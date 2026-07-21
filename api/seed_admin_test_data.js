require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const User = require('./src/database/models/user.model');
const Product = require('./src/database/models/product.model');
const Event = require('./src/database/models/event.model');
const Recipe = require('./src/database/models/recipe.model');
const Reel = require('./src/database/models/reel.model');

async function seedTestData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB for seeding...');

    const admin = await User.findOne({ email: 'admin@glunity.com' });
    const adminId = admin ? admin._id : new mongoose.Types.ObjectId();

    // 1. Seed some recent users for "Nouvelles Inscriptions" & "Inscriptions au fil du temps"
    const testUsers = [];
    for (let i = 0; i < 5; i++) {
      testUsers.push({
        fullName: `Test Patient ${i}`,
        email: `test_patient_${i}@example.com`,
        passwordHash: 'dummy_hash',
        profileType: 'celiac',
        points: Math.floor(Math.random() * 500) + 100,
        createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // past 5 days
        isTestData: true
      });
    }
    
    // Add a pending seller for "Vendeurs Vérifiés"
    testUsers.push({
      fullName: 'Test Epicerie Sans Gluten',
      email: 'test_seller@example.com',
      passwordHash: 'dummy_hash',
      profileType: 'pro_commerce',
      storeInfo: { isVerified: false, name: 'Ma Boutique SG', siret: '123456789' },
      isTestData: true
    });

    // Add a top performer
    testUsers.push({
      fullName: 'Top Contributor',
      email: 'top@example.com',
      passwordHash: 'dummy_hash',
      profileType: 'celiac',
      points: 4500,
      isTestData: true
    });

    const insertedUsers = await User.insertMany(testUsers);
    console.log(`Seeded ${insertedUsers.length} users.`);

    const randomUserId = insertedUsers[0]._id;

    // 2. Seed Moderation Items
    const pendingProducts = await Product.insertMany([
      { name: 'Pain Sans Gluten Test', brand: 'Test Brand', price: 4.50, category: 'bakery', sellerId: randomUserId, status: 'pending', isApproved: false, isTestData: true }
    ]);

    const pendingEvents = await Event.insertMany([
      { title: 'Test Webinar SG', organizerId: randomUserId, startsAt: new Date(), location: 'En Ligne', status: 'active', isApproved: false, isTestData: true }
    ]);

    const pendingRecipes = await Recipe.insertMany([
      { title: 'Tarte Test', authorId: randomUserId, category: 'easy', ingredients: [{name: 'flour', quantity: '100g'}], steps: ['mix'], preparationTime: 30, status: 'pending', isApproved: false, isTestData: true }
    ]);

    const pendingReels = await Reel.insertMany([
      { caption: 'Recette en vidéo test', user: randomUserId, status: 'pending', isTestData: true }
    ]);

    console.log('Seeded pending moderation items.');

    console.log('Test data seeding complete! You can now check the dashboard.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedTestData();
