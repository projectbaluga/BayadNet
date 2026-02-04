const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const Subscriber = require('./models/Subscriber');
const User = require('./models/User');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/internet_billing';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware to protect routes
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

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
  res.json({ token });
});

// Reference date for Feb 2026
const CURRENT_DATE = new Date('2026-02-15');
const CURRENT_DAY = CURRENT_DATE.getDate();

app.get('/api/subscribers', authenticateToken, async (req, res) => {
  try {
    const subscribers = await Subscriber.find();
    const processedSubscribers = subscribers.map(sub => {
      let amountDue = sub.rate;
      let status = sub.isPaidFeb2026 ? 'Paid' : 'Unpaid';

      if (sub.creditType === '2 Weeks') amountDue = sub.rate * 0.5;
      if (sub.creditType === '1 Month') {
        amountDue = 0;
        status = 'Paid';
      }

      if (status === 'Unpaid') {
        if (sub.cycle < CURRENT_DAY) status = 'Overdue';
        else if (sub.cycle === CURRENT_DAY) status = 'Due Today';
        else status = 'Upcoming';
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

app.patch('/api/subscribers/:id/pay', authenticateToken, async (req, res) => {
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
    const subscribers = await Subscriber.find();
    let dueToday = 0, overdue = 0, totalCollections = 0;

    subscribers.forEach(sub => {
      let amount = sub.rate;
      if (sub.creditType === '2 Weeks') amount *= 0.5;
      if (sub.creditType === '1 Month') amount = 0;

      if (sub.isPaidFeb2026 || sub.creditType === '1 Month') {
        totalCollections += amount;
      } else {
        if (sub.cycle < CURRENT_DAY) overdue++;
        else if (sub.cycle === CURRENT_DAY) dueToday++;
      }
    });
    res.json({ dueToday, overdue, totalCollections });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
