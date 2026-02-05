const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bayadnet';

const migrate = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for migration...');

    const db = mongoose.connection.db;
    const collection = db.collection('subscribers');

    // 1. Rename monthlyRate to rate
    console.log('Renaming monthlyRate to rate...');
    await collection.updateMany(
      { monthlyRate: { $exists: true } },
      { $rename: { monthlyRate: 'rate' } }
    );

    // 2. Rename billingCycle to cycle
    console.log('Renaming billingCycle to cycle...');
    await collection.updateMany(
      { billingCycle: { $exists: true } },
      { $rename: { billingCycle: 'cycle' } }
    );

    // 3. Ensure daysDown exists
    console.log('Ensuring daysDown exists...');
    await collection.updateMany(
      { daysDown: { $exists: false } },
      { $set: { daysDown: 0 } }
    );

    // 4. Ensure isPaidFeb2026 exists
    console.log('Ensuring isPaidFeb2026 exists...');
    await collection.updateMany(
      { isPaidFeb2026: { $exists: false } },
      { $set: { isPaidFeb2026: false } }
    );

    // 5. Ensure isArchived exists
    console.log('Ensuring isArchived exists...');
    await collection.updateMany(
      { isArchived: { $exists: false } },
      { $set: { isArchived: false } }
    );

    // 6. Ensure remainingBalance exists, default to rate
    console.log('Ensuring remainingBalance exists...');
    const subscribers = await collection.find({}).toArray();
    for (const sub of subscribers) {
      if (sub.remainingBalance === undefined) {
        await collection.updateOne(
          { _id: sub._id },
          { $set: { remainingBalance: sub.rate || 0 } }
        );
      }
    }

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
