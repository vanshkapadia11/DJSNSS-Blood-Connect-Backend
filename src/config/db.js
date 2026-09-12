const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // modern mongoose (v6+) no longer needs useNewUrlParser/useUnifiedTopology
      autoIndex: process.env.NODE_ENV !== 'production', // build indexes only outside prod for speed
      serverSelectionTimeoutMS: 10000,
    });

    logger.info(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    return conn;
  } catch (err) {
    logger.error(`MongoDB initial connection failed: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
