'use strict';

require('dotenv').config({ override: true });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const User = require('../src/database/models/user.model');
const Location = require('../src/database/models/location.model');
const Event = require('../src/database/models/event.model');
const Recipe = require('../src/database/models/recipe.model');
const Channel = require('../src/database/models/channel.model');
const Message = require('../src/database/models/message.model');
const Reel = require('../src/database/models/reel.model');

async function revertSeed() {
  const seedFile = path.join(__dirname, 'latest-seed-run.json');
  if (!fs.existsSync(seedFile)) {
    console.error('❌ Cannot find latest-seed-run.json. Have you run the seed script?');
    process.exit(1);
  }

  const SEED_DATA = JSON.parse(fs.readFileSync(seedFile, 'utf8'));

  const mongoUri = String(process.env.MONGO_URI || '')
    .trim()
    .replace(/^['"]|['"]$/g, '');
  if (!mongoUri) {
    throw new Error('MONGO_URI is missing. Set it in your .env');
  }

  console.log('🧹 Starting cleanup of seeded data...');
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000, socketTimeoutMS: 45000 });

  const deleteResults = {};

  if (SEED_DATA.messages?.length) {
    const res = await Message.deleteMany({ _id: { $in: SEED_DATA.messages } });
    deleteResults.messages = res.deletedCount;
  }
  
  if (SEED_DATA.channels?.length) {
    const res = await Channel.deleteMany({ _id: { $in: SEED_DATA.channels } });
    deleteResults.channels = res.deletedCount;
  }
  
  if (SEED_DATA.reels?.length) {
    const res = await Reel.deleteMany({ _id: { $in: SEED_DATA.reels } });
    deleteResults.reels = res.deletedCount;
  }

  if (SEED_DATA.recipes?.length) {
    const res = await Recipe.deleteMany({ _id: { $in: SEED_DATA.recipes } });
    deleteResults.recipes = res.deletedCount;
  }

  if (SEED_DATA.events?.length) {
    const res = await Event.deleteMany({ _id: { $in: SEED_DATA.events } });
    deleteResults.events = res.deletedCount;
  }

  if (SEED_DATA.locations?.length) {
    const res = await Location.deleteMany({ _id: { $in: SEED_DATA.locations } });
    deleteResults.locations = res.deletedCount;
  }

  if (SEED_DATA.users?.length) {
    const res = await User.deleteMany({ _id: { $in: SEED_DATA.users } });
    deleteResults.users = res.deletedCount;
  }

  console.log('✅ Cleanup completed! Deleted counts:');
  console.table(deleteResults);

  // Rename the file to mark it as reverted
  const revertedFile = path.join(__dirname, `reverted-seed-run-${Date.now()}.json`);
  fs.renameSync(seedFile, revertedFile);
  console.log(`Tracking file renamed to: ${revertedFile}`);
}

revertSeed()
  .catch((err) => {
    console.error('Revert failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
