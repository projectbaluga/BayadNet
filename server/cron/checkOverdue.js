const cron = require('node-cron');
const Subscriber = require('../models/Subscriber');
const Setting = require('../models/Setting');
const Router = require('../models/Router');
const { processSubscriber } = require('../utils/logic');
const mikrotikService = require('../services/mikrotik');
const { getCurrentDate } = require('../config/time');

const checkOverdueSubscribers = async () => {
  console.log('Cron: Checking for overdue subscribers across all routers...');

  try {
    const activeRouters = await Router.find({ isActive: true });
    if (activeRouters.length === 0) {
        console.log('Cron: No active routers found.');
        return;
    }

    const now = getCurrentDate();
    const settings = await Setting.findOne() || { rebateValue: 30 };

    for (const router of activeRouters) {
        console.log(`Cron: Processing Router ${router.name} (${router.host})...`);
        let client = null;

        try {
            // 1. Fetch relevant subscribers for THIS router
            const subscribers = await Subscriber.find({
                isArchived: false,
                router: router._id,
                pppoeUsername: { $exists: true, $ne: '' }
            });

            if (subscribers.length === 0) {
                console.log(`Cron: No PPPoE subscribers for router ${router.name}.`);
                continue;
            }

            // 2. Identify overdue users
            const overdueUsers = [];
            for (const sub of subscribers) {
                const processed = processSubscriber(sub, now, settings);
                if (processed.status === 'Overdue') {
                    overdueUsers.push(sub.pppoeUsername);
                }
            }

            if (overdueUsers.length === 0) {
                console.log(`Cron: No overdue users for router ${router.name}.`);
                continue;
            }

            console.log(`Cron: Found ${overdueUsers.length} overdue users on ${router.name}. Connecting...`);

            // 3. Connect to THIS router
            try {
                // We don't check isConfigured globally anymore, we check per router
                client = await mikrotikService.connect(router);
            } catch (connErr) {
                console.error(`Cron: Failed to connect to ${router.name}:`, connErr.message);
                continue;
            }

            // 4. Batch Shift Profile
            let successCount = 0;
            for (const username of overdueUsers) {
                 try {
                     // Pass the router config AND the existing client connection
                     // The service method expects (config, username, profileName, existingClient)
                     await mikrotikService.setPppoeProfile(router, username, 'payment-reminder', client);
                     successCount++;
                 } catch (actionErr) {
                     console.error(`Cron: Failed to set profile for ${username} on ${router.name}:`, actionErr.message);
                 }
            }
            console.log(`Cron: Successfully processed ${successCount}/${overdueUsers.length} overdue users on ${router.name}.`);

        } catch (routerErr) {
            console.error(`Cron: Error processing router ${router.name}:`, routerErr);
        } finally {
            if (client) {
                try {
                    client.close();
                } catch (e) { /* ignore */ }
            }
        }
    }

  } catch (error) {
    console.error('Cron Error:', error);
  }
};

// Schedule: Daily at 12:00 AM
const startCron = () => {
    cron.schedule('0 0 * * *', checkOverdueSubscribers);
    console.log('Cron: Overdue check scheduled (Daily at 00:00).');
};

module.exports = { startCron, checkOverdueSubscribers };
