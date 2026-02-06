const mongoose = require('mongoose');
const User = require('./server/models/User');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bayadnet';

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      const admin = new User({
        username: 'admin',
        password: 'password123',
        role: 'admin',
        name: 'Administrator'
      });
      await admin.save();
      console.log('Admin user created: admin / password123');
    } else {
      console.log('Admin user already exists');
    }

    // Also seed a subscriber for testing
    const Subscriber = require('./server/models/Subscriber');
    const subExists = await Subscriber.findOne({ name: 'Test Subscriber' });
    if (!subExists) {
        const sub = new Subscriber({
            name: 'Test Subscriber',
            rate: 500,
            cycle: 1,
            contactNo: '09123456789'
        });
        await sub.save();
        console.log('Test subscriber created');
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
