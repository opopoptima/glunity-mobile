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

async function cleanAll() {
  const mongoUri = String(process.env.MONGO_URI || '').trim().replace(/^['"]|['"]$/g, '');
  await mongoose.connect(mongoUri);

  const scriptsDir = __dirname;
  const files = fs.readdirSync(scriptsDir).filter(f => f.startsWith('reverted-seed-run-') || f === 'latest-seed-run.json');

  const deleteResults = { messages: 0, channels: 0, reels: 0, recipes: 0, events: 0, locations: 0, users: 0 };

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(scriptsDir, file), 'utf8'));
    
    if (data.messages) deleteResults.messages += (await Message.deleteMany({ _id: { $in: data.messages } })).deletedCount;
    if (data.channels) deleteResults.channels += (await Channel.deleteMany({ _id: { $in: data.channels } })).deletedCount;
    if (data.reels) deleteResults.reels += (await Reel.deleteMany({ _id: { $in: data.reels } })).deletedCount;
    if (data.recipes) deleteResults.recipes += (await Recipe.deleteMany({ _id: { $in: data.recipes } })).deletedCount;
    if (data.events) deleteResults.events += (await Event.deleteMany({ _id: { $in: data.events } })).deletedCount;
    if (data.locations) deleteResults.locations += (await Location.deleteMany({ _id: { $in: data.locations } })).deletedCount;
    if (data.users) deleteResults.users += (await User.deleteMany({ _id: { $in: data.users } })).deletedCount;
  }

  console.log('Cleanup from ALL tracked files completed! Deleted counts:');
  console.table(deleteResults);
  process.exit(0);
}
cleanAll().catch(console.error);
