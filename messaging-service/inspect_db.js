'use strict';

require('./src/bootstrap/env.bootstrap');
const mongoose = require('mongoose');
const env = require('./src/config/env');
const Channel = require('./src/database/models/channel.model');

async function run() {
  console.log('Connecting to MongoDB:', env.mongo.uri);
  await mongoose.connect(env.mongo.uri);
  console.log('Connected!');

  try {
    const channels = await Channel.find().lean();
    console.log(`Total channels in database: ${channels.length}`);
    channels.forEach((c, index) => {
      console.log(`[${index}] ID: ${c._id}, Name: ${c.name}, Type: ${c.type}, Participants count: ${c.participants ? c.participants.length : 0}, DeletedAt: ${c.deletedAt}`);
    });
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
