const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const Subscriber = require('./models/Subscriber');
const User = require('./models/User');
const Setting = require('./models/Setting');
const MonthlyReport = require('./models/MonthlyReport');
const { getCurrentDate } = require('./config/time');
const { processSubscriber, calculateStats } = require('./utils/logic');
const userRoutes = require('./routes/userRoutes');
const publicRoutes = require('./routes/publicRoutes');
const messageRoutes = require('./routes/messages');
const routerRoutes = require('./routes/routerRoutes');
const authenticateToken = require('./middleware/auth');
const checkPermission = require('./middleware/checkPermission');
const { PERMISSIONS } = require('./config/permissions');
const mikrotikService = require('./services/mikrotik');
const Router = require('./models/Router');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["https://bojex.online", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['polling', 'websocket'], // Ensure compatibility with Cloudflare proxy
  allowEIO3: true // Compatibility for some clients if needed
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Attach IO to request for access in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased limit for active dashboard/chat usage
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Limit each IP to 5 login requests per 15 minutes
  message: { message: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bayadnet';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Start Cron Jobs
    require('./cron/checkOverdue').startCron();
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadToCloudinary = async (image, folder = 'bayadnet') => {
  if (!image || typeof image !== 'string' || !image.startsWith('data:image')) return image;

  const sizeInMB = Buffer.from(image.split(',')[1], 'base64').length / (1024 * 1024);
  console.log(`Processing image upload: ${sizeInMB.toFixed(2)} MB`);

  // Check if Cloudinary is configured
  const isConfigured = process.env.CLOUDINARY_CLOUD_NAME &&
                      process.env.CLOUDINARY_API_KEY &&
                      process.env.CLOUDINARY_API_SECRET;

  if (!isConfigured) {
    console.warn('Cloudinary not configured, falling back to database storage for image');
    if (sizeInMB > 10) {
      console.warn('WARNING: Image size is over 10MB and Cloudinary is not configured. This might exceed MongoDB limits.');
    }
    return image;
  }

  try {
    const uploadRes = await cloudinary.uploader.upload(image, {
      folder,
      resource_type: "auto",
      timeout: 60000 // 60 seconds timeout
    });
    console.log('Cloudinary upload successful:', uploadRes.secure_url);
    return uploadRes.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    // Fall back to original image string instead of throwing to avoid breaking the request
    return image;
  }
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

app.post('/api/auth/login', loginLimiter, async (req, res) => {
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
  res.json({
    token,
    role: user.role,
    user: {
      name: user.name || user.username,
      role: user.role,
      permissions: user.getEffectivePermissions()
    }
  });
});

const validateObjectId = (req, res, next) => {
  if (req.params.id && !mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  next();
};

app.post('/api/subscribers', authenticateToken, checkPermission(PERMISSIONS.MANAGE_SUBSCRIBERS), async (req, res) => {
  try {
    const { initialPayment, ...subData } = req.body;
    const subscriber = new Subscriber(subData);

    // If initial payment is provided (Advance Payment)
    if (initialPayment && initialPayment.amountPaid > 0) {
      const now = getCurrentDate();
      const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const currentMonthName = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

      subscriber.payments.push({
        amountPaid: initialPayment.amountPaid,
        referenceNo: 'INITIAL-PAYMENT',
        month: currentMonthName,
        date: now
      });

      // Update remaining balance immediately
      if (subscriber.remainingBalance === undefined) {
        subscriber.remainingBalance = subscriber.rate;
      }
      subscriber.remainingBalance = Math.max(0, subscriber.remainingBalance - initialPayment.amountPaid);
    }

    // Sync Mikrotik on Creation
    if (subscriber.pppoeUsername && subscriber.router) {
       try {
           const routerConfig = await Router.findById(subscriber.router);
           if (routerConfig && routerConfig.isActive) {
               const result = await mikrotikService.createOrUpdateSecret(routerConfig, subscriber);
               if (result.success) {
                   subscriber.mikrotikSyncStatus = 'Synced';
               } else {
                   console.warn(`Mikrotik Sync Failed on Create: ${result.message}`);
                   subscriber.mikrotikSyncStatus = 'Failed';
               }
           }
       } catch (syncErr) {
           console.error('Mikrotik Sync Error:', syncErr);
           subscriber.mikrotikSyncStatus = 'Failed';
       }
    }

    await subscriber.save();
    res.status(201).json(subscriber);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/subscribers', authenticateToken, checkPermission(PERMISSIONS.VIEW_SUBSCRIBERS), async (req, res) => {
  try {
    const now = getCurrentDate();
    const settings = await Setting.findOne() || { rebateValue: 30 };
    const subscribers = await Subscriber.find({ isArchived: false }).populate('router', 'name host');
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

app.put('/api/subscribers/:id', authenticateToken, checkPermission(PERMISSIONS.MANAGE_SUBSCRIBERS), validateObjectId, async (req, res) => {
  try {
    const subscriber = await Subscriber.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!subscriber) return res.status(404).json({ message: 'Subscriber not found' });

    // Sync Mikrotik state if necessary
    if (subscriber.pppoeUsername && subscriber.router && !subscriber.isArchived) {
        const routerConfig = await Router.findById(subscriber.router);
        if (routerConfig && routerConfig.isActive) {

            // Sync Credentials/Profile if changed
            if (req.body.pppoeUsername || req.body.pppoePassword) {
                 // Use updated data
                 const updatedData = { ...subscriber.toObject(), ...req.body };
                 await mikrotikService.createOrUpdateSecret(routerConfig, updatedData)
                    .then(res => {
                        if(!res.success) console.warn('Mikrotik Credential Sync Failed:', res.message);
                    })
                    .catch(err => console.error('Mikrotik Credential Sync Error:', err));
            }

            const now = getCurrentDate();
            const settings = await Setting.findOne() || { rebateValue: 30 };
            const processed = processSubscriber(subscriber, now, settings);

            if (processed.status === 'Overdue') {
                 mikrotikService.setPppoeProfile(routerConfig, subscriber.pppoeUsername, 'payment-reminder')
                   .catch(err => console.error(`Failed to auto-restrict Mikrotik user ${subscriber.pppoeUsername} on update:`, err.message));
            } else {
                 mikrotikService.setPppoeProfile(routerConfig, subscriber.pppoeUsername, subscriber.pppoeProfile || 'default')
                   .catch(err => console.error(`Failed to auto-restore Mikrotik user ${subscriber.pppoeUsername} on update:`, err.message));
            }
        }
    }

    res.json(subscriber);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/subscribers/:id', authenticateToken, checkPermission(PERMISSIONS.MANAGE_SUBSCRIBERS), validateObjectId, async (req, res) => {
  try {
    const subscriber = await Subscriber.findById(req.params.id);
    if (!subscriber) return res.status(404).json({ message: 'Subscriber not found' });

    // Sync Mikrotik Deletion
    if (subscriber.pppoeUsername && subscriber.router) {
        try {
            const routerConfig = await Router.findById(subscriber.router);
            if (routerConfig && routerConfig.isActive) {
                const result = await mikrotikService.deleteSecret(routerConfig, subscriber.pppoeUsername);
                if (!result.success) {
                    console.warn(`Mikrotik Delete Failed: ${result.message}`);
                    // We continue with archive even if router is unreachable
                }
            }
        } catch (delErr) {
             console.error('Mikrotik Delete Error:', delErr);
        }
    }

    subscriber.isArchived = true;
    await subscriber.save();
    res.json({ message: 'Subscriber archived' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/subscribers/:id/payments', authenticateToken, checkPermission(PERMISSIONS.PROCESS_PAYMENTS), validateObjectId, async (req, res) => {
  try {
    const subscriber = await Subscriber.findById(req.params.id);
    if (!subscriber) return res.status(404).json({ message: 'Subscriber not found' });

    let { amountPaid, referenceNo, receiptImage, month } = req.body;

    // Upload receipt to Cloudinary if it's base64
    if (receiptImage && receiptImage.startsWith('data:image')) {
      receiptImage = await uploadToCloudinary(receiptImage, 'bayadnet_receipts');
    }

    const now = getCurrentDate();
    const settings = await Setting.findOne() || { rebateValue: 30 };
    const processed = processSubscriber(subscriber, now, settings);
    const currentMonthName = processed.currentMonthName;

    // Initialize remainingBalance if it's the first payment or not set correctly
    if (subscriber.remainingBalance === undefined || subscriber.remainingBalance === subscriber.rate) {
      if (!subscriber.payments || !subscriber.payments.some(p => p.month === currentMonthName)) {
        subscriber.remainingBalance = processed.amountDue;
      }
    }

    subscriber.remainingBalance = Math.max(0, subscriber.remainingBalance - amountPaid);

    if (subscriber.remainingBalance <= 0) {
      // Cleaned up legacy fields

      // Re-enable internet if fully paid
      if (subscriber.pppoeUsername && subscriber.router) {
        const routerConfig = await Router.findById(subscriber.router);
        if (routerConfig && routerConfig.isActive) {
            mikrotikService.setPppoeProfile(routerConfig, subscriber.pppoeUsername, subscriber.pppoeProfile || 'default')
              .catch(err => console.error(`Failed to auto-restore Mikrotik user ${subscriber.pppoeUsername}:`, err));
        }
      }
    }

    subscriber.payments.push({
      amountPaid,
      referenceNo,
      receiptImage,
      month: month || currentMonthName,
      date: now
    });

    try {
      await subscriber.save();
    } catch (saveError) {
      console.error('Error saving subscriber with new payment:', saveError);
      if (saveError.message.includes('maximum document size')) {
        return res.status(413).json({ message: 'Document size limit exceeded. The receipt image might be too large.' });
      }
      throw saveError;
    }
    res.json(subscriber);
  } catch (error) {
    console.error('Server error in payments route:', error);
    res.status(500).json({ message: error.message });
  }
});

app.patch('/api/subscribers/:id/pay', authenticateToken, checkPermission(PERMISSIONS.PROCESS_PAYMENTS), validateObjectId, async (req, res) => {
  try {
    const subscriber = await Subscriber.findById(req.params.id);
    if (!subscriber) return res.status(404).json({ message: 'Subscriber not found' });

    const now = getCurrentDate();
    const settings = await Setting.findOne() || { rebateValue: 30 };
    const processed = processSubscriber(subscriber, now, settings);
    const currentMonthName = processed.currentMonthName;

    // Quick pay assumes full payment of remaining balance
    const amountToPay = subscriber.remainingBalance !== undefined ? subscriber.remainingBalance : processed.amountDue;

    subscriber.payments.push({
      amountPaid: amountToPay,
      referenceNo: 'QUICK-PAY',
      month: currentMonthName,
      date: now
    });

    subscriber.remainingBalance = 0;
    // Cleaned up legacy fields

    // Re-enable internet
    if (subscriber.pppoeUsername && subscriber.router) {
      const routerConfig = await Router.findById(subscriber.router);
      if (routerConfig && routerConfig.isActive) {
          mikrotikService.setPppoeProfile(routerConfig, subscriber.pppoeUsername, subscriber.pppoeProfile || 'default')
            .catch(err => console.error(`Failed to auto-restore Mikrotik user ${subscriber.pppoeUsername}:`, err));
      }
    }

    await subscriber.save();
    res.json(subscriber);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/stats', authenticateToken, checkPermission(PERMISSIONS.VIEW_ANALYTICS), async (req, res) => {
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

app.get('/api/settings', authenticateToken, checkPermission(PERMISSIONS.MANAGE_SETTINGS), async (req, res) => {
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

app.put('/api/settings', authenticateToken, checkPermission(PERMISSIONS.MANAGE_SETTINGS), async (req, res) => {
  try {
    const settings = await Setting.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    res.json(settings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post('/api/bulk/reset', authenticateToken, checkPermission(PERMISSIONS.MANAGE_SETTINGS), async (req, res) => {
  try {
    const now = getCurrentDate();
    const subscribers = await Subscriber.find({ isArchived: false });
    const settings = await Setting.findOne() || { rebateValue: 30, providerCost: 0 };
    const providerCost = settings.providerCost || 0;

    let totalExpected = 0;
    let totalCollected = 0;

    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const currentMonthName = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

    subscribers.forEach(sub => {
      const processed = processSubscriber(sub, now, settings);
      totalExpected += processed.amountDue;
      const collected = (sub.payments || [])
        .filter(p => p.month === currentMonthName)
        .reduce((sum, p) => sum + (p.amountPaid || 0), 0);
      totalCollected += collected;
    });

    // Save snapshot to MonthlyReport
    await MonthlyReport.create({
      monthYear: currentMonthName,
      totalExpected: Math.round(totalExpected * 100) / 100,
      totalCollected: Math.round(totalCollected * 100) / 100,
      totalProfit: Math.round((totalCollected - providerCost) * 100) / 100,
      subscriberCount: subscribers.length
    });

    // Start New Month logic - Cleaned up legacy fields
    const updateObj = { daysDown: 0 };

    await Subscriber.updateMany({ isArchived: false }, {
      $set: updateObj
    });

    await Subscriber.updateMany({ isArchived: false }, { $unset: { remainingBalance: "" } });

    res.json({ message: 'System reset for new month successfully and report saved.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/analytics', authenticateToken, checkPermission(PERMISSIONS.VIEW_ANALYTICS), async (req, res) => {
  try {
    const now = getCurrentDate();
    const subscribers = await Subscriber.find({ isArchived: false });
    const settings = await Setting.findOne() || { rebateValue: 30, providerCost: 0 };
    const providerCost = settings.providerCost || 0;

    let totalExpected = 0;
    let totalCollected = 0;
    let groupCounts = { Overdue: 0, Partial: 0, Upcoming: 0, Paid: 0 };

    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const currentMonthName = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

    subscribers.forEach(sub => {
      const processed = processSubscriber(sub, now, settings);
      totalExpected += processed.amountDue;

      const collected = (sub.payments || [])
        .filter(p => p.month === currentMonthName)
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

app.post('/api/public/report', rateLimit({ windowMs: 60 * 1000, max: 10 }), async (req, res) => {
  try {
    const { accountId, message, attachmentUrl } = req.body;
    if (!accountId) return res.status(400).json({ message: 'Account ID is required' });

    const subscriber = await Subscriber.findOne({ accountId });
    if (!subscriber) return res.status(404).json({ message: 'Subscriber not found' });

    if (!message && !attachmentUrl) return res.status(400).json({ message: 'Message or attachment is required' });

    let finalAttachmentUrl = attachmentUrl;
    // Upload attachment to Cloudinary if it's base64
    if (finalAttachmentUrl && finalAttachmentUrl.startsWith('data:image')) {
      finalAttachmentUrl = await uploadToCloudinary(finalAttachmentUrl, 'bayadnet_reports');
    }

    const report = {
      reporterName: subscriber.name,
      reporterRole: 'subscriber',
      message: message || '',
      attachmentUrl: finalAttachmentUrl,
      timestamp: new Date(),
      readBy: [{
        name: subscriber.name,
        role: 'subscriber',
        timestamp: new Date()
      }]
    };

    subscriber.reports.push(report);
    subscriber.issueStatus = 'Open';

    await subscriber.save();

    // Emit real-time event
    io.emit('report-added', { subscriberId: subscriber._id, report, issueStatus: 'Open' });

    res.status(201).json(report);
  } catch (error) {
    console.error('Server error in public report route:', error);
    res.status(500).json({ message: error.message });
  }
});

app.use('/api/users', userRoutes(authenticateToken, authorize, checkPermission));
app.use('/api/routers', routerRoutes(authenticateToken, authorize, checkPermission));
app.use('/api/public', publicRoutes);
app.use('/api', messageRoutes);

// Mikrotik Control Routes
app.post('/api/mikrotik/toggle/:id', authenticateToken, checkPermission(PERMISSIONS.MANAGE_ROUTERS), validateObjectId, async (req, res) => {
  try {
    const subscriber = await Subscriber.findById(req.params.id).populate('router');
    if (!subscriber) return res.status(404).json({ message: 'Subscriber not found' });
    if (!subscriber.pppoeUsername) return res.status(400).json({ message: 'Subscriber has no PPPoE Username configured' });
    if (!subscriber.router) return res.status(400).json({ message: 'Subscriber has no assigned Router' });

    const { enable } = req.body; // true or false
    if (enable === undefined) return res.status(400).json({ message: 'Enable status is required' });

    // "Disable" now means set to payment-reminder profile
    // "Enable" means restore to assigned profile
    const targetProfile = enable ? (subscriber.pppoeProfile || 'default') : 'payment-reminder';

    const result = await mikrotikService.setPppoeProfile(subscriber.router, subscriber.pppoeUsername, targetProfile);
    if (!result.success) {
      return res.status(502).json({ message: result.message || 'Failed to communicate with Mikrotik' });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/mikrotik/status/:id', authenticateToken, checkPermission(PERMISSIONS.VIEW_ROUTER_STATUS), validateObjectId, async (req, res) => {
  try {
    const subscriber = await Subscriber.findById(req.params.id).populate('router');
    if (!subscriber) return res.status(404).json({ message: 'Subscriber not found' });
    if (!subscriber.pppoeUsername) return res.json({ exists: false, message: 'No PPPoE Username configured' });
    if (!subscriber.router) return res.json({ exists: false, message: 'No assigned Router' });

    const status = await mikrotikService.getPppoeStatus(subscriber.router, subscriber.pppoeUsername);
    res.json(status);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/mikrotik/health', authenticateToken, checkPermission(PERMISSIONS.VIEW_ROUTER_STATUS), async (req, res) => {
  try {
    const routers = await Router.find({ isActive: true });

    // Check all routers in parallel
    const checks = await Promise.all(routers.map(async (router) => {
        const result = await mikrotikService.checkHealth(router);
        // Update status in DB (non-blocking for response)
        Router.findByIdAndUpdate(router._id, {
            status: result.connected ? 'Online' : 'Offline',
            lastChecked: new Date()
        }).catch(() => {});
        return {
            _id: router._id,
            name: router.name,
            connected: result.connected,
            message: result.message
        };
    }));

    const onlineCount = checks.filter(c => c.connected).length;
    res.json({
        summary: `${onlineCount}/${routers.length} Online`,
        details: checks
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/routers/:id/profiles', authenticateToken, checkPermission(PERMISSIONS.MANAGE_ROUTERS), validateObjectId, async (req, res) => {
  try {
    const router = await Router.findById(req.params.id);
    if (!router) return res.status(404).json({ message: 'Router not found' });

    const profiles = await mikrotikService.getProfiles(router);
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Image Upload Route
app.post('/api/upload', authenticateToken, async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ message: 'No image provided' });

    const url = await uploadToCloudinary(image, 'bayadnet_reports');
    res.json({ url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/subscribers/:id/resolve', authenticateToken, checkPermission(PERMISSIONS.RESOLVE_ISSUES), validateObjectId, async (req, res) => {
  try {
    const subscriber = await Subscriber.findById(req.params.id);
    if (!subscriber) return res.status(404).json({ message: 'Subscriber not found' });

    subscriber.issueStatus = 'Resolved';
    await subscriber.save();

    io.emit('issue-resolved', { subscriberId: subscriber._id, status: 'Resolved' });

    res.json({ message: 'Issue resolved', status: 'Resolved' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/subscribers/:id/report', authenticateToken, validateObjectId, async (req, res) => {
  try {
    const subscriber = await Subscriber.findById(req.params.id);
    if (!subscriber) return res.status(404).json({ message: 'Subscriber not found' });

    let { message, attachmentUrl } = req.body;
    if (!message && !attachmentUrl) return res.status(400).json({ message: 'Message or attachment is required' });

    console.log(`Received report for subscriber ${req.params.id}. Message length: ${message?.length || 0}. Has attachment: ${!!attachmentUrl}`);

    // Upload attachment to Cloudinary if it's base64
    if (attachmentUrl && attachmentUrl.startsWith('data:image')) {
      attachmentUrl = await uploadToCloudinary(attachmentUrl, 'bayadnet_reports');
    }

    const report = {
      reporterName: req.user.name || req.user.username,
      reporterRole: req.user.role,
      message: message || '',
      attachmentUrl,
      timestamp: new Date(),
      readBy: [{
        name: req.user.name || req.user.username,
        role: req.user.role,
        timestamp: new Date()
      }]
    };

    subscriber.reports.push(report);
    subscriber.issueStatus = 'Open'; // Re-open or keep open on new messages

    try {
      await subscriber.save();
    } catch (saveError) {
      console.error('Error saving subscriber with new report:', saveError);
      if (saveError.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation Error: ' + saveError.message });
      }
      if (saveError.message.includes('maximum document size')) {
        return res.status(413).json({ message: 'Document size limit exceeded. Please use smaller images or contact support.' });
      }
      throw saveError;
    }

    // Emit real-time event
    io.emit('report-added', { subscriberId: subscriber._id, report, issueStatus: 'Open' });

    res.status(201).json(report);
  } catch (error) {
    console.error('Server error in report route:', error);
    res.status(500).json({ message: error.message });
  }
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('mark-as-read', async ({ subscriberId, user }) => {
    try {
      if (!user || !user.name) return;
      const subscriber = await Subscriber.findById(subscriberId);
      if (!subscriber) return;

      let updated = false;
      subscriber.reports.forEach(report => {
        const alreadyRead = report.readBy.some(r => r.name === user.name);
        if (!alreadyRead) {
          report.readBy.push({
            name: user.name,
            role: user.role,
            timestamp: new Date()
          });
          updated = true;
        }
      });

      if (updated) {
        await subscriber.save();
        io.emit('reports-read', { subscriberId, reports: subscriber.reports });
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
