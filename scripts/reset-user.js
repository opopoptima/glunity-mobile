'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../api/.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../api/src/database/models/user.model');

const targetEmail = process.argv[2] || 'rayenmestiri08@gmail.com';
const newPassword = process.argv[3] || 'Password123!';

async function resetUserPassword() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/glu10';
    console.log(`Connecting to MongoDB...`);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully.');

    const emailClean = targetEmail.toLowerCase().trim();
    let user = await User.findOne({ email: emailClean });

    const passwordHash = await bcrypt.hash(newPassword, 10);

    if (user) {
      user.passwordHash = passwordHash;
      user.emailVerified = true;
      user.isActive = true;
      await user.save();
      console.log(`\n✅ Password successfully updated for user: ${emailClean}`);
      console.log(`🔑 New Password: ${newPassword}`);
    } else {
      console.log(`\n⚠️  User with email '${emailClean}' not found. Creating user account...`);
      user = await User.create({
        fullName: 'Rayen Mestiri',
        email: emailClean,
        passwordHash: passwordHash,
        profileType: 'celiac',
        emailVerified: true,
        isActive: true,
      });
      console.log(`\n✅ Created new user account for: ${emailClean}`);
      console.log(`🔑 New Password: ${newPassword}`);
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error resetting user password:', err);
    process.exit(1);
  }
}

resetUserPassword();
