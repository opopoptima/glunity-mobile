'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('./models/user.model');

async function listAdmins() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);

    console.log('=== ADMIN ACCOUNTS IN DATABASE ===');
    const admins = await User.find({ profileType: 'admin' });

    admins.forEach((admin, i) => {
      console.log(`\nAdmin #${i + 1}:`);
      console.log(`- ID: ${admin._id}`);
      console.log(`- Name: ${admin.fullName}`);
      console.log(`- Email: ${admin.email}`);
      console.log(`- Password: Password123!`);
      console.log(`- Profile Type: ${admin.profileType}`);
      console.log(`- Email Verified: ${admin.emailVerified}`);
      console.log(`- Is Active: ${admin.isActive}`);
    });

    console.log('\n=================================');
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Error listing admins:', err);
    process.exit(1);
  }
}

listAdmins();
