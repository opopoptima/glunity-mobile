'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const adminService = require('../app/modules/admin/admin.service');

async function test() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('Connected to DB. Testing getModerationItems...');
    const items = await adminService.getModerationItems('all');
    console.log('Items returned:', items.length);
    process.exit(0);
  } catch (err) {
    console.error('Stack Trace of Error:');
    console.error(err);
    process.exit(1);
  }
}
test();
