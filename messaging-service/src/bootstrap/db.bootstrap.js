'use strict';

const mongoose = require('mongoose');
const env = require('../config/env');
const logger = require('./logger.bootstrap');

async function connectDB() {
  try {
    const conn = await mongoose.connect(env.mongo.uri);
    logger.info(`MongoDB connected → ${conn.connection.host}`);
    
    // Ensure all critical indexes for the Message model are registered in MongoDB
    const Message = require('../database/models/message.model');
    await Message.createIndexes().catch((err) => {
      logger.warn('Failed to register Message collection indexes', { err: err.message });
    });
  } catch (err) {
    logger.error('Failed to connect to MongoDB', { err: err.message });
    process.exit(1);
  }
}

module.exports = connectDB;
