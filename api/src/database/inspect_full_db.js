'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');

const User = require('./models/user.model');
const Product = require('./models/product.model');
const Event = require('./models/event.model');
const Recipe = require('./models/recipe.model');
const Reel = require('./models/reel.model');
const Location = require('./models/location.model');

async function inspectSampleDocs() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);

    console.log('--- SAMPLE USER DOC ---');
    console.log(await User.findOne());

    console.log('\n--- SAMPLE PRODUCT DOC ---');
    console.log(await Product.findOne());

    console.log('\n--- SAMPLE EVENT DOC ---');
    console.log(await Event.findOne());

    console.log('\n--- SAMPLE RECIPE DOC ---');
    console.log(await Recipe.findOne());

    console.log('\n--- SAMPLE REEL DOC ---');
    console.log(await Reel.findOne());

    console.log('\n--- SAMPLE LOCATION DOC ---');
    console.log(await Location.findOne());

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Error inspecting sample docs:', err);
    process.exit(1);
  }
}

inspectSampleDocs();
