require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const User = require('./src/database/models/user.model');
const Product = require('./src/database/models/product.model');
const Event = require('./src/database/models/event.model');
const Recipe = require('./src/database/models/recipe.model');
const Reel = require('./src/database/models/reel.model');

async function removeTestData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB for cleaning...');

    const resUsers = await User.deleteMany({ email: { $in: ['test_patient_0@example.com', 'test_patient_1@example.com', 'test_patient_2@example.com', 'test_patient_3@example.com', 'test_patient_4@example.com', 'test_seller@example.com', 'top@example.com'] } });
    console.log(`Deleted ${resUsers.deletedCount} test users.`);

    const resProd = await Product.deleteMany({ name: 'Pain Sans Gluten Test' });
    const resEvt = await Event.deleteMany({ title: 'Test Webinar SG' });
    const resRec = await Recipe.deleteMany({ title: 'Tarte Test' });
    const resReel = await Reel.deleteMany({ caption: 'Recette en vidéo test' });

    console.log(`Deleted ${resProd.deletedCount} products, ${resEvt.deletedCount} events, ${resRec.deletedCount} recipes, ${resReel.deletedCount} reels.`);

    console.log('Cleanup complete!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

removeTestData();
