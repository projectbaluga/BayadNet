require('dotenv').config();

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'supersecretkey',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/bayadnet',
  PORT: process.env.PORT || 5000,
  CLOUDINARY: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  }
};
