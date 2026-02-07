const cron = require('node-cron');
const Subscriber = require('../models/Subscriber');
const Setting = require('../models/Setting');
const { processSubscriber } = require('../utils/logic');
const mikrotikService = require('../services/mikrotik');
const { getCurrentDate } = require('../config/time');

const checkOverdueSubscribers = async () => {
  console.log('Cron: Checking for overdue subscribers...');
  let client = null;
  try {
    // 1. Fetch relevant subscribers
    const subscribers = await Subscriber.find({
        isArchived: false,
        pppoeUsername: { $exists: true, $ne: '' }
    });

    if (subscribers.length === 0) {
        console.log('Cron: No PPPoE subscribers to check.');
        return;
    }

    const now = getCurrentDate();
    const settings = await Setting.findOne() || { rebateValue: 30 };

    // 2. Identify who needs to be disabled
    // We only connect to Mikrotik if we actually need to change something
    // BUT since we don't know the CURRENT state in Mikrotik without asking,
    // and we want to ENFORCE state, we should probably connect if there are ANY overdue users.
    // Optimization: Only toggle if status is Overdue.

    const overdueUsers = [];
    for (const sub of subscribers) {
        const processed = processSubscriber(sub, now, settings);
        if (processed.status === 'Overdue') {
            overdueUsers.push(sub.pppoeUsername);
        }
    }

    if (overdueUsers.length === 0) {
         console.log('Cron: No overdue PPPoE subscribers found.');
         return;
    }

    console.log(`Cron: Found ${overdueUsers.length} overdue users. Connecting to Mikrotik...`);

    // 3. Connect once
    if (mikrotikService.isConfigured()) {
        try {
            client = await mikrotikService.connect();
        } catch (connErr) {
            console.error('Cron: Failed to connect to Mikrotik:', connErr.message);
            return; // Abort if can't connect
        }

        // 4. Batch Process
        let successCount = 0;
        for (const username of overdueUsers) {
             try {
                 // Pass the existing client
                 const result = await mikrotikService.togglePppoeSecret(username, false, client);
                 if (result.success) successCount++;
             } catch (actionErr) {
                 console.error(`Cron: Failed to disable ${username}:`, actionErr.message);
             }
        }
        console.log(`Cron: Successfully processed ${successCount}/${overdueUsers.length} overdue users.`);
    } else {
        console.log('Cron: Mikrotik not configured.');
    }

  } catch (error) {
    console.error('Cron Error:', error);
  } finally {
      // 5. Cleanup
      if (client) {
          try {
              client.close();
              console.log('Cron: Mikrotik connection closed.');
          } catch (e) { /* ignore */ }
      }
  }
};

// Schedule: Daily at 12:00 AM
const startCron = () => {
    // Run every day at midnight
    cron.schedule('0 0 * * *', checkOverdueSubscribers);
    console.log('Cron: Overdue check scheduled (Daily at 00:00).');
};

module.exports = { startCron, checkOverdueSubscribers };
