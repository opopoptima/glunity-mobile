require('dotenv').config({ override: true });
const mongoose = require('mongoose');

const User = require('../src/database/models/user.model');
const Location = require('../src/database/models/location.model');
const Event = require('../src/database/models/event.model');
const Recipe = require('../src/database/models/recipe.model');
const Channel = require('../src/database/models/channel.model');
const Message = require('../src/database/models/message.model');
const Reel = require('../src/database/models/reel.model');

async function run() {
  const mongoUri = String(process.env.MONGO_URI || '').trim().replace(/^['"]|['"]$/g, '');
  await mongoose.connect(mongoUri);

  const startOfToday = new Date();
  startOfToday.setHours(0,0,0,0);

  const r = await Recipe.countDocuments({createdAt: {$gte: startOfToday}});
  const e = await Event.countDocuments({createdAt: {$gte: startOfToday}});
  const l = await Location.countDocuments({createdAt: {$gte: startOfToday}});
  const u = await User.countDocuments({createdAt: {$gte: startOfToday}});
  const c = await Channel.countDocuments({createdAt: {$gte: startOfToday}});
  const m = await Message.countDocuments({createdAt: {$gte: startOfToday}});
  const re = await Reel.countDocuments({createdAt: {$gte: startOfToday}});

  console.log(`Created today: Users: ${u}, Recipes: ${r}, Events: ${e}, Locations: ${l}, Channels: ${c}, Messages: ${m}, Reels: ${re}`);

  // Auto clean up everything created today!
  console.log('Cleaning up all entities created today...');
  await Recipe.deleteMany({createdAt: {$gte: startOfToday}});
  await Event.deleteMany({createdAt: {$gte: startOfToday}});
  await Location.deleteMany({createdAt: {$gte: startOfToday}});
  await User.deleteMany({createdAt: {$gte: startOfToday}});
  await Channel.deleteMany({createdAt: {$gte: startOfToday}});
  await Message.deleteMany({createdAt: {$gte: startOfToday}});
  await Reel.deleteMany({createdAt: {$gte: startOfToday}});

  console.log('Cleanup of all today entities finished.');
  process.exit(0);
}
run().catch(console.error);
