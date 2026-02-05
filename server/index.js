const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { Server } = require('socket.io');
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
app.set('trust proxy', 1);

// PRODUCTION BUG FIX: Aggressive Cache-Control to stop Ctrl+F5 requirement
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// LOCAL STORAGE MIGRATION: Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('[Recovery] Created /uploads directory');
}

// MULTER SETUP: Handle local machine uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'report-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB Limit
});

// STATIC SERVING: Expose uploads folder to the internet
app.use('/uploads', express.static('uploads'));

const server = http.createServer(app);

// SOCKET CONFIG: Optimized for Cloudflare Tunnel compatibility
const io = new Server(server, {
  cors: {
    origin: ["https://mgt.bojex.online", "http://mgt.bojex.online", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'], // Reordered for stability
  allowEIO3: true
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const PORT = process.env.PORT || 5000;
// RESTORE DATA CONNECTIVITY: Prioritize Docker service name 'mongo'
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/bayadnet';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

mongoose.connect(MONGO_URI)
  .then(() => console.log('[Recovery] Connected to MongoDB at', MONGO_URI))
  .catch(err => {
    console.error('[Recovery] MongoDB connection error:', err);
    // Fallback for non-docker local testing
    if (MONGO_URI.includes('mongo:')) {
      console.log('[Recovery] Retrying with localhost...');
      mongoose.connect('mongodb://localhost:27017/bayadnet');
    }
  });

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
  // Pass name back to frontend for Seen system
  res.json({ token, role: user.role, name: user.name || user.username });
});

const validateObjectId = (req, res, next) => {
  if (req.params.id && !mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  next();
};

// API ROUTES
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
      return { ...sub.toObject(), ...processed };
    });
    res.json(processedSubscribers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/subscribers/:id', authenticateToken, authorize('admin'), validateObjectId, async (req, res) => {
  try {
    const subscriber = await Subscriber.findByIdAndUpdate(req.params.id, req.body, { new: true });
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

    if (subscriber.remainingBalance === undefined) {
      subscriber.remainingBalance = processed.amountDue;
    }

    subscriber.remainingBalance = Math.max(0, subscriber.remainingBalance - amountPaid);
    if (subscriber.remainingBalance <= 0) subscriber.isPaidFeb2026 = true;

    subscriber.payments.push({
      amountPaid, referenceNo, receiptImage,
      month: month || 'February 2026',
      date: now
    });

    await subscriber.save();
    res.json(subscriber);
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

      if (processed.status === 'Due Today') groupCounts['Overdue']++;
      else if (groupCounts.hasOwnProperty(processed.status)) groupCounts[processed.status]++;
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

// LOCAL RECOVERY: New Local File Upload Endpoint
app.post('/api/reports/upload', authenticateToken, upload.single('reportImage'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image file provided' });

    // INFRASTRUCTURE COMPATIBILITY: Force absolute HTTP URL for tunnel
    const fileUrl = `http://mgt.bojex.online/uploads/${req.file.filename}`;
    console.log(`[Recovery] Local Upload Success: ${fileUrl}`);

    res.json({ url: fileUrl });
  } catch (error) {
    console.error('[Recovery] Upload status code 500 error:', error);
    res.status(500).json({ message: 'Internal Server Error during upload: ' + error.message });
  }
});

app.post('/api/subscribers/:id/report', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const subscriber = await Subscriber.findById(req.params.id);
    if (!subscriber) return res.status(404).json({ message: 'Subscriber not found' });

    const { message, attachmentUrl } = req.body;
    const report = {
      reporterName: req.user.name || req.user.username,
      reporterRole: req.user.role,
      message,
      attachmentUrl,
      timestamp: new Date(),
      readBy: [{
        name: req.user.name || req.user.username,
        role: req.user.role,
        timestamp: new Date()
      }]
    };

    subscriber.reports.push(report);
    await subscriber.save();

    io.emit('report-added', { subscriberId: subscriber._id, report });
    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// REAL-TIME RECOVERY: Robust Seen System
io.on('connection', (socket) => {
  socket.on('mark-as-read', async ({ subscriberId, adminName, role }) => {
    try {
      const subscriber = await Subscriber.findById(subscriberId);
      if (!subscriber || !adminName) return;

      let updated = false;
      subscriber.reports.forEach(report => {
        const alreadyRead = report.readBy.some(r => r.name === adminName);
        if (!alreadyRead) {
          report.readBy.push({ name: adminName, role: role || 'staff', timestamp: new Date() });
          updated = true;
        }
      });

      if (updated) {
        await subscriber.save();
        io.emit('reports-read', { subscriberId, reports: subscriber.reports });
      }
    } catch (error) {
      console.error('[Recovery] Socket mark-as-read error:', error);
    }
  });
});

server.listen(PORT, () => console.log(`[Recovery] Server running on port ${PORT}`));
