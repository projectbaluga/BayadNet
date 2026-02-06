const cron = require('node-cron');
const Subscriber = require('../models/Subscriber');
const Setting = require('../models/Setting');
const { processSubscriber } = require('../utils/logic');
const mikrotikService = require('../services/mikrotik');
const { getCurrentDate } = require('../config/time');

const checkOverdueSubscribers = async () => {
  console.log('Cron: Checking for overdue subscribers...');
  try {
    const now = getCurrentDate();
    const settings = await Setting.findOne() || { rebateValue: 30 };
    // Only fetch subscribers that have a pppoeUsername configured
    const subscribers = await Subscriber.find({
        isArchived: false,
        pppoeUsername: { $exists: true, $ne: '' }
    });

    let count = 0;
    for (const sub of subscribers) {
        if (!sub.pppoeUsername) continue;

        const processed = processSubscriber(sub, now, settings);

        // If status is Overdue, disable internet
        if (processed.status === 'Overdue') {
            try {
                // Attempt to disable.
                // Optimization: In a real world, we might want to check DB flag first
                // but since Mikrotik status is the source of truth for "Internet Access",
                // we enforce it here.
                const result = await mikrotikService.togglePppoeSecret(sub.pppoeUsername, false);
                if (result.success && result.enabled === false) {
                    // Only log if it was a successful operation (even if already disabled)
                    // But to reduce spam, we might only want to log if state CHANGED.
                    // The service logs internally.
                    count++;
                }
            } catch (err) {
                console.error(`Cron: Failed to disable ${sub.pppoeUsername}:`, err.message);
            }
        }
    }
    console.log(`Cron: Overdue check complete. Processed ${subscribers.length} candidates.`);
  } catch (error) {
    console.error('Cron Error:', error);
  }
};

// Schedule: Daily at 12:00 AM
const startCron = () => {
    // Run every day at midnight
    cron.schedule('0 0 * * *', checkOverdueSubscribers);
    console.log('Cron: Overdue check scheduled (Daily at 00:00).');
};

module.exports = { startCron, checkOverdueSubscribers };
