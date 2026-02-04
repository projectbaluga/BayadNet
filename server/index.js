const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const Subscriber = require('./models/Subscriber');
const User = require('./models/User');
const { getCurrentDate } = require('./config/time');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/internet_billing';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
  res.json({ token });
});

const validateObjectId = (req, res, next) => {
  if (req.params.id && !mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  next();
};

app.post('/api/subscribers', authenticateToken, async (req, res) => {
  try {
    const subscriber = new Subscriber(req.body);
    await subscriber.save();
    res.status(201).json(subscriber);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/subscribers', authenticateToken, async (req, res) => {
  try {
    const now = getCurrentDate();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const subscribers = await Subscriber.find();
    const processedSubscribers = subscribers.map(sub => {
      let amountDue = sub.rate;
      let effectiveCycle = sub.cycle;
      let status = sub.isPaidFeb2026 ? 'Paid' : 'Unpaid';

      // Apply Credit Logic
      if (sub.creditType === '2 Weeks') {
        if (sub.creditPreference === 'Discount') {
          amountDue = sub.rate * 0.5;
        } else if (sub.creditPreference === 'Extension') {
          effectiveCycle = sub.cycle + 14;
        }
      } else if (sub.creditType === '1 Month') {
        amountDue = 0;
        status = 'Paid';
      }

      // Calculate Status based on Effective Cycle
      if (status === 'Unpaid') {
        if (effectiveCycle < currentDay) status = 'Overdue';
        else if (effectiveCycle === currentDay) status = 'Due Today';
        else status = 'Upcoming';
      }

      // Format Due Date (handle month overflow if extension goes to next month)
      const dueDateObj = new Date(currentYear, currentMonth, effectiveCycle);
      const formattedDueDate = dueDateObj.toISOString().split('T')[0];

      return {
        ...sub.toObject(),
        amountDue,
        status,
        effectiveCycle,
        dueDate: formattedDueDate
      };
    });
    res.json(processedSubscribers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/subscribers/:id', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const subscriber = await Subscriber.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!subscriber) return res.status(404).json({ message: 'Subscriber not found' });
    res.json(subscriber);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/subscribers/:id', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const subscriber = await Subscriber.findByIdAndDelete(req.params.id);
    if (!subscriber) return res.status(404).json({ message: 'Subscriber not found' });
    res.json({ message: 'Subscriber deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.patch('/api/subscribers/:id/pay', authenticateToken, validateObjectId, async (req, res) => {
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

app.get('/api/stats', authenticateToken, async (req, res) => {
  try {
    const now = getCurrentDate();
    const currentDay = now.getDate();

    const subscribers = await Subscriber.find();
    let dueToday = 0, overdue = 0, totalCollections = 0;
    let totalMonthlyRevenue = 0;

    subscribers.forEach(sub => {
      let amount = sub.rate;
      let effectiveCycle = sub.cycle;

      if (sub.creditType === '2 Weeks') {
        if (sub.creditPreference === 'Discount') {
          amount *= 0.5;
        } else if (sub.creditPreference === 'Extension') {
          effectiveCycle = sub.cycle + 14;
        }
      } else if (sub.creditType === '1 Month') {
        amount = 0;
      }

      totalMonthlyRevenue += amount;

      if (sub.isPaidFeb2026 || sub.creditType === '1 Month') {
        totalCollections += amount;
      } else {
        if (effectiveCycle < currentDay) overdue++;
        else if (effectiveCycle === currentDay) dueToday++;
      }
    });
    res.json({
      dueToday,
      overdue,
      totalCollections,
      totalSubscribers: subscribers.length,
      totalMonthlyRevenue
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
