const mongoose = require('mongoose');
const Subscriber = require('./models/Subscriber');
const User = require('./models/User');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bayadnet';

const seedDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    const subCount = await Subscriber.countDocuments();
    if (subCount === 0) {
      await Subscriber.insertMany(seedData);
      console.log('Subscribers seeded.');
    } else {
      console.log('Subscribers already exist, skipping seed.');
    }

    const userCount = await User.countDocuments();
    if (userCount === 0) {
      await User.create({ username: 'admin', password: 'password123', role: 'admin' });
      await User.create({ username: 'staff', password: 'password123', role: 'staff' });
      await User.create({ username: 'tech', password: 'password123', role: 'technician' });
      console.log('Users created: admin/password123, staff/password123, tech/password123.');
    } else {
      console.log('Admin user already exists, skipping seed.');
    }

    process.exit();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDB();
