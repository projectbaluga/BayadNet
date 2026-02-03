const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const Subscriber = require('./models/Subscriber');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/internet_billing';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Reference date for Feb 2026
const CURRENT_DATE = new Date('2026-02-15');
const CURRENT_DAY = CURRENT_DATE.getDate();
const CURRENT_MONTH = CURRENT_DATE.getMonth(); // 1 (February)
const CURRENT_YEAR = CURRENT_DATE.getFullYear(); // 2026

app.get('/api/subscribers', async (req, res) => {
  try {
    const subscribers = await Subscriber.find();

    const processedSubscribers = subscribers.map(sub => {
      let amountDue = sub.rate;
      let status = sub.isPaidFeb2026 ? 'Paid' : 'Unpaid';

      // Special Rule 1: Storm Credit (2 Weeks)
      if (sub.creditType === '2 Weeks') {
        amountDue = sub.rate * 0.5;
      }

      // Special Rule 2: Bonete (1 Month Free)
      if (sub.creditType === '1 Month') {
        amountDue = 0;
        status = 'Paid';
      }

      // Calculate Status if not already Paid
      if (status === 'Unpaid') {
        if (sub.cycle < CURRENT_DAY) {
          status = 'Overdue';
        } else if (sub.cycle === CURRENT_DAY) {
          status = 'Due Today';
        } else {
          status = 'Upcoming';
        }
      }

      return {
        ...sub.toObject(),
        amountDue,
        status,
        dueDate: `2026-02-${sub.cycle.toString().padStart(2, '0')}`
      };
    });

    res.json(processedSubscribers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.patch('/api/subscribers/:id/pay', async (req, res) => {
  try {
    const subscriber = await Subscriber.findById(req.params.id);
    if (!subscriber) return res.status(404).json({ message: 'Subscriber not found' });

    subscriber.isPaidFeb2026 = true;
    await subscriber.save();
    res.json(subscriber);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/stats', async (req, res) => {
    try {
        const subscribers = await Subscriber.find();
        let dueToday = 0;
        let overdue = 0;
        let totalCollections = 0;

        subscribers.forEach(sub => {
            let amount = sub.rate;
            if (sub.creditType === '2 Weeks') amount *= 0.5;
            if (sub.creditType === '1 Month') amount = 0;

            if (sub.isPaidFeb2026 || sub.creditType === '1 Month') {
                totalCollections += amount;
            } else {
                if (sub.cycle < CURRENT_DAY) {
                    overdue++;
                } else if (sub.cycle === CURRENT_DAY) {
                    dueToday++;
                }
            }
        });

        res.json({ dueToday, overdue, totalCollections });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
