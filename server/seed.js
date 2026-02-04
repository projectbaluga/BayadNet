const mongoose = require('mongoose');
const Subscriber = require('./models/Subscriber');
const User = require('./models/User');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/internet_billing';

const seedData = [
  { name: 'Bonete', rate: 500, cycle: 7, creditType: '1 Month' },
  { name: 'Villano Ceasar', rate: 400, cycle: 3, creditType: '2 Weeks' },
  { name: 'Villano Loriegen', rate: 400, cycle: 6, creditType: '2 Weeks' },
  { name: 'Kuya Glenn Store', rate: 300, cycle: 11, creditType: '2 Weeks' },
  { name: 'MCGI', rate: 400, cycle: 13, creditType: '2 Weeks' },
  { name: 'Collantes', rate: 400, cycle: 13, creditType: '2 Weeks' },
  { name: 'Viray Kim Ashley', rate: 400, cycle: 15, creditType: '2 Weeks' },
  { name: 'Villano Julie', rate: 400, cycle: 16, creditType: '2 Weeks' },
  { name: 'Gilbert Lombz', rate: 400, cycle: 16, creditType: '2 Weeks' },
  { name: 'Melgar', rate: 400, cycle: 17, creditType: '2 Weeks' },
  { name: 'Kuya Colin', rate: 400, cycle: 18, creditType: '2 Weeks' },
  { name: 'Ate Edna', rate: 400, cycle: 26, creditType: '2 Weeks' },
  { name: 'Imperial', rate: 400, cycle: 27, creditType: '2 Weeks' }
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
