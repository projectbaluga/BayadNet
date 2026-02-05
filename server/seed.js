const mongoose = require('mongoose');
const Subscriber = require('./models/Subscriber');
const User = require('./models/User');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bayadnet';

const seedData = [
  { name: 'Bonete', accountId: 'ACC-101', planName: 'Residential Plus', bandwidth: '50Mbps', rate: 500, cycle: 7, daysDown: 0 },
  { name: 'Ate Pinang', accountId: 'ACC-114', planName: 'Residential Basic', bandwidth: '10Mbps', rate: 100, cycle: 7, daysDown: 0 },
  { name: 'Villano Julie', accountId: 'ACC-108', planName: 'Residential Basic', bandwidth: '25Mbps', rate: 400, cycle: 16, daysDown: 0 },
  { name: 'Villano Clariz', accountId: 'ACC-115', planName: 'Commercial Lite', bandwidth: '20Mbps', rate: 300, cycle: 15, daysDown: 0 },
  { name: 'Villano Loriegen', accountId: 'ACC-103', planName: 'Residential Basic', bandwidth: '25Mbps', rate: 400, cycle: 6, daysDown: 0 },
  { name: 'Mamlor', accountId: 'ACC-116', planName: 'Residential Basic', bandwidth: '25Mbps', rate: 400, cycle: 11, daysDown: 0 },
  { name: 'MCGI', accountId: 'ACC-105', planName: 'Residential Basic', bandwidth: '25Mbps', rate: 400, cycle: 13, daysDown: 0 },
  { name: 'De Leon', accountId: 'ACC-117', planName: 'Residential Basic', bandwidth: '25Mbps', rate: 400, cycle: 31, daysDown: 0 },
  { name: 'De Leon R', accountId: 'ACC-118', planName: 'Residential Basic', bandwidth: '25Mbps', rate: 400, cycle: 31, daysDown: 0 },
  { name: 'Zaragoza Joy', accountId: 'ACC-119', planName: 'Residential Basic', bandwidth: '25Mbps', rate: 400, cycle: 14, daysDown: 0 },
  { name: 'Viray Kim Ashley', accountId: 'ACC-107', planName: 'Residential Basic', bandwidth: '25Mbps', rate: 400, cycle: 15, daysDown: 0 },
  { name: 'Callao', accountId: 'ACC-120', planName: 'Residential Basic', bandwidth: '25Mbps', rate: 400, cycle: 21, daysDown: 0 },
  { name: 'Estacio', accountId: 'ACC-121', planName: 'Residential Basic', bandwidth: '25Mbps', rate: 400, cycle: 28, daysDown: 0 },
  { name: 'Ate Edna', accountId: 'ACC-112', planName: 'Residential Basic', bandwidth: '25Mbps', rate: 400, cycle: 26, daysDown: 0 },
  { name: 'Amparado', accountId: 'ACC-122', planName: 'Residential Basic', bandwidth: '25Mbps', rate: 400, cycle: 19, daysDown: 0 },
  { name: 'Pelonio', accountId: 'ACC-123', planName: 'Residential Plus', bandwidth: '50Mbps', rate: 500, cycle: 26, daysDown: 0 },
  { name: 'Villano Ceasar', accountId: 'ACC-102', planName: 'Residential Basic', bandwidth: '25Mbps', rate: 400, cycle: 30, daysDown: 0 },
  { name: 'Kuya Colin', accountId: 'ACC-111', planName: 'Residential Basic', bandwidth: '25Mbps', rate: 400, cycle: 18, daysDown: 0 },
  { name: 'Collantes', accountId: 'ACC-106', planName: 'Residential Basic', bandwidth: '25Mbps', rate: 400, cycle: 13, daysDown: 0 },
  { name: 'Melgar', accountId: 'ACC-110', planName: 'Residential Basic', bandwidth: '25Mbps', rate: 400, cycle: 17, daysDown: 0 },
  { name: 'Imperial', accountId: 'ACC-113', planName: 'Residential Basic', bandwidth: '25Mbps', rate: 400, cycle: 27, daysDown: 0 },
  { name: 'Kuya Glenn Store', accountId: 'ACC-104', planName: 'Commercial Lite', bandwidth: '20Mbps', rate: 300, cycle: 11, daysDown: 0 },
  { name: 'Gilbert Lombz', accountId: 'ACC-109', planName: 'Residential Basic', bandwidth: '25Mbps', rate: 400, cycle: 16, daysDown: 0 }
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
