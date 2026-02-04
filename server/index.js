const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const Subscriber = require('./models/Subscriber');
const User = require('./models/User');
const { getCurrentDate } = require('./config/time');
const { processSubscriber, calculateStats } = require('./utils/logic');

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
    const subscribers = await Subscriber.find();
    const processedSubscribers = subscribers.map(sub => {
      const processed = processSubscriber(sub, now);
      return {
        ...sub.toObject(),
        ...processed
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

app.post('/api/subscribers/:id/payments', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const subscriber = await Subscriber.findById(req.params.id);
    if (!subscriber) return res.status(404).json({ message: 'Subscriber not found' });

    const { amountPaid, referenceNo, receiptImage, month } = req.body;
    const now = getCurrentDate();
    const processed = processSubscriber(subscriber, now);

    // Initialize remainingBalance if it's the first payment or not set correctly
    if (subscriber.remainingBalance === undefined || subscriber.remainingBalance === subscriber.rate) {
      // If it matches the original rate, it might need pro-rating
      // But we must be careful not to overwrite a manual balance if it was intended.
      // For this system, we'll assume the pro-rated amount is the starting point for Feb 2026.
      if (!subscriber.payments || subscriber.payments.length === 0) {
        subscriber.remainingBalance = processed.amountDue;
      }
    }

    subscriber.remainingBalance = Math.max(0, subscriber.remainingBalance - amountPaid);

    if (subscriber.remainingBalance <= 0) {
      subscriber.isPaidFeb2026 = true;
    }

    subscriber.payments.push({
      amountPaid,
      referenceNo,
      receiptImage,
      month: month || 'February 2026',
      date: now
    });

    await subscriber.save();
    res.json(subscriber);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.patch('/api/subscribers/:id/pay', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const subscriber = await Subscriber.findById(req.params.id);
    if (!subscriber) return res.status(404).json({ message: 'Subscriber not found' });

    const now = getCurrentDate();
    const processed = processSubscriber(subscriber, now);

    // Quick pay assumes full payment of remaining balance
    const amountToPay = subscriber.remainingBalance !== undefined ? subscriber.remainingBalance : processed.amountDue;

    subscriber.payments.push({
      amountPaid: amountToPay,
      referenceNo: 'QUICK-PAY',
      month: 'February 2026',
      date: now
    });

    subscriber.remainingBalance = 0;
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
    const subscribers = await Subscriber.find();
    const stats = calculateStats(subscribers, now);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
