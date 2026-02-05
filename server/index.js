const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const Subscriber = require('./models/Subscriber');
const User = require('./models/User');
const Setting = require('./models/Setting');
const MonthlyReport = require('./models/MonthlyReport');
const { getCurrentDate } = require('./config/time');
const { processSubscriber, calculateStats } = require('./utils/logic');
const userRoutes = require('./routes/userRoutes');
const publicRoutes = require('./routes/publicRoutes');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bayadnet';
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

const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }
  return (req, res, next) => {
    if (!req.user || (roles.length && !roles.includes(req.user.role))) {
      return res.status(403).json({ message: 'Forbidden: You do not have the required role' });
    }
    next();
  };
};

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = jwt.sign(
    { id: user._id, username: user.username, role: user.role, name: user.name || user.username },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
  res.json({ token, role: user.role });
});

const validateObjectId = (req, res, next) => {
  if (req.params.id && !mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  next();
};

app.post('/api/subscribers', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const subscriber = new Subscriber(req.body);
    await subscriber.save();
    res.status(201).json(subscriber);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/subscribers', authenticateToken, authorize(['admin', 'staff', 'technician']), async (req, res) => {
  try {
    const now = getCurrentDate();
    const settings = await Setting.findOne() || { rebateValue: 30 };
    const subscribers = await Subscriber.find({ isArchived: false });
    const processedSubscribers = subscribers.map(sub => {
      const processed = processSubscriber(sub, now, settings);
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

app.put('/api/subscribers/:id', authenticateToken, authorize('admin'), validateObjectId, async (req, res) => {
  try {
    const subscriber = await Subscriber.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!subscriber) return res.status(404).json({ message: 'Subscriber not found' });
    res.json(subscriber);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/subscribers/:id', authenticateToken, authorize('admin'), validateObjectId, async (req, res) => {
  try {
    const subscriber = await Subscriber.findById(req.params.id);
    if (!subscriber) return res.status(404).json({ message: 'Subscriber not found' });

    subscriber.isArchived = true;
    await subscriber.save();
    res.json({ message: 'Subscriber archived' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/subscribers/:id/payments', authenticateToken, authorize(['admin', 'staff']), validateObjectId, async (req, res) => {
  try {
    const subscriber = await Subscriber.findById(req.params.id);
    if (!subscriber) return res.status(404).json({ message: 'Subscriber not found' });

    const { amountPaid, referenceNo, receiptImage, month } = req.body;
    const now = getCurrentDate();
    const settings = await Setting.findOne() || { rebateValue: 30 };
    const processed = processSubscriber(subscriber, now, settings);

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

app.patch('/api/subscribers/:id/pay', authenticateToken, authorize(['admin', 'staff']), validateObjectId, async (req, res) => {
  try {
    const subscriber = await Subscriber.findById(req.params.id);
    if (!subscriber) return res.status(404).json({ message: 'Subscriber not found' });

    const now = getCurrentDate();
    const settings = await Setting.findOne() || { rebateValue: 30 };
    const processed = processSubscriber(subscriber, now, settings);

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

app.get('/api/stats', authenticateToken, authorize(['admin', 'staff', 'technician']), async (req, res) => {
  try {
    const now = getCurrentDate();
    const settings = await Setting.findOne() || { rebateValue: 30 };
    const subscribers = await Subscriber.find();
    const stats = calculateStats(subscribers, now, settings);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/settings', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({ defaultRate: 500, rebateValue: 30, providerCost: 1500 });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/settings', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const settings = await Setting.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    res.json(settings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post('/api/bulk/reset', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const now = getCurrentDate();
    const subscribers = await Subscriber.find({ isArchived: false });
    const settings = await Setting.findOne() || { rebateValue: 30, providerCost: 0 };
    const providerCost = settings.providerCost || 0;

    let totalExpected = 0;
    let totalCollected = 0;

    subscribers.forEach(sub => {
      const processed = processSubscriber(sub, now, settings);
      totalExpected += processed.amountDue;
      const collected = (sub.payments || [])
        .filter(p => p.month === 'February 2026')
        .reduce((sum, p) => sum + (p.amountPaid || 0), 0);
      totalCollected += collected;
    });

    // Save snapshot to MonthlyReport
    await MonthlyReport.create({
      monthYear: "February 2026",
      totalExpected: Math.round(totalExpected * 100) / 100,
      totalCollected: Math.round(totalCollected * 100) / 100,
      totalProfit: Math.round((totalCollected - providerCost) * 100) / 100,
      subscriberCount: subscribers.length
    });

    // Start New Month logic
    await Subscriber.updateMany({ isArchived: false }, {
      $set: {
        isPaidFeb2026: false,
        daysDown: 0
      }
    });

    await Subscriber.updateMany({ isArchived: false }, { $unset: { remainingBalance: "" } });

    res.json({ message: 'System reset for new month successfully and report saved.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/analytics', authenticateToken, authorize(['admin', 'staff', 'technician']), async (req, res) => {
  try {
    const now = getCurrentDate();
    const subscribers = await Subscriber.find({ isArchived: false });
    const settings = await Setting.findOne() || { rebateValue: 30, providerCost: 0 };
    const providerCost = settings.providerCost || 0;

    let totalExpected = 0;
    let totalCollected = 0;
    let groupCounts = { Overdue: 0, Partial: 0, Upcoming: 0, Paid: 0 };

    subscribers.forEach(sub => {
      const processed = processSubscriber(sub, now, settings);
      totalExpected += processed.amountDue;

      const collected = (sub.payments || [])
        .filter(p => p.month === 'February 2026')
        .reduce((sum, p) => sum + (p.amountPaid || 0), 0);
      totalCollected += collected;

      if (processed.status === 'Due Today') {
        groupCounts['Overdue']++; // Or group as you wish, prompt says Overdue/Partial/Upcoming/Paid
      } else if (groupCounts.hasOwnProperty(processed.status)) {
        groupCounts[processed.status]++;
      }
    });

    res.json({
      totalExpected: Math.round(totalExpected * 100) / 100,
      totalCollected: Math.round(totalCollected * 100) / 100,
      providerCost,
      currentProfit: Math.round((totalCollected - providerCost) * 100) / 100,
      groupCounts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.use('/api/users', userRoutes(authenticateToken, authorize));
app.use('/api/public', publicRoutes);

app.post('/api/subscribers/:id/report', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const subscriber = await Subscriber.findById(req.params.id);
    if (!subscriber) return res.status(404).json({ message: 'Subscriber not found' });

    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });

    const report = {
      reporterName: req.user.name || req.user.username,
      reporterRole: req.user.role,
      message,
      timestamp: new Date()
    };

    subscriber.reports.push(report);
    await subscriber.save();

    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
