const mongoose = require('mongoose');
const Subscriber = require('./models/Subscriber');
const User = require('./models/User');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/internet_billing';

const seedData = [
  { name: 'Bonete', rate: 500, cycle: 7, daysDown: 30 },
  { name: 'Villano Ceasar', rate: 400, cycle: 3, daysDown: 14 },
  { name: 'Villano Loriegen', rate: 400, cycle: 6, daysDown: 14 },
  { name: 'Kuya Glenn Store', rate: 300, cycle: 11, daysDown: 14 },
  { name: 'MCGI', rate: 400, cycle: 13, daysDown: 14 },
  { name: 'Collantes', rate: 400, cycle: 13, daysDown: 14 },
  { name: 'Viray Kim Ashley', rate: 400, cycle: 15, daysDown: 14 },
  { name: 'Villano Julie', rate: 400, cycle: 16, daysDown: 14 },
  { name: 'Gilbert Lombz', rate: 400, cycle: 16, daysDown: 14 },
  { name: 'Melgar', rate: 400, cycle: 17, daysDown: 14 },
  { name: 'Kuya Colin', rate: 400, cycle: 18, daysDown: 14 },
  { name: 'Ate Edna', rate: 400, cycle: 26, daysDown: 14 },
  { name: 'Imperial', rate: 400, cycle: 27, daysDown: 14 }
];

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
      await User.create({ username: 'admin', password: 'password123' });
      console.log('Admin user created (admin / password123).');
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
