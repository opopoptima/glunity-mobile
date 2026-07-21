'use strict';

require('dotenv').config({ override: true });
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const User = require('../src/database/models/user.model');
const Location = require('../src/database/models/location.model');
const Event = require('../src/database/models/event.model');
const Recipe = require('../src/database/models/recipe.model');
const Channel = require('../src/database/models/channel.model');
const Message = require('../src/database/models/message.model');
const Reel = require('../src/database/models/reel.model');
const { hashPassword } = require('../src/app/common/utils/password');

const CONFIG = {
  NUM_USERS: 30,
  SELLERS_RATIO: 0.2, // 20%
  NUM_LOCATIONS: 10,
  NUM_EVENTS: 10,
  NUM_RECIPES: 15,
  NUM_CHANNELS: 5,
  MESSAGES_PER_CHANNEL: 15,
  NUM_REELS: 12,
};

const SEED_DATA = {
  users: [],
  locations: [],
  events: [],
  recipes: [],
  channels: [],
  messages: [],
  reels: [],
};

async function runSeed() {
  const mongoUri = String(process.env.MONGO_URI || '')
    .trim()
    .replace(/^['"]|['"]$/g, '');
  if (!mongoUri) {
    throw new Error('MONGO_URI is missing. Set it in your .env');
  }

  console.log('🌱 Starting High-Quality Reality Case Seed...');
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000, socketTimeoutMS: 45000 });

  const commonPasswordHash = await hashPassword('password123');

  // 1. Generate Users
  console.log(`Generating ${CONFIG.NUM_USERS} users...`);
  const profileTypes = ['celiac', 'proche'];
  for (let i = 0; i < CONFIG.NUM_USERS; i++) {
    const isSeller = Math.random() < CONFIG.SELLERS_RATIO;
    const pType = isSeller ? 'pro_commerce' : faker.helpers.arrayElement(profileTypes);
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    
    const user = new User({
      fullName: `${firstName} ${lastName}`,
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      phone: faker.phone.number({ style: 'international' }),
      passwordHash: commonPasswordHash,
      profileType: pType,
      avatar: { url: faker.image.avatar() },
      streakDays: faker.number.int({ min: 0, max: 100 }),
      points: faker.number.int({ min: 0, max: 5000 }),
      language: 'fr',
      emailVerified: true,
      onlineStatus: faker.helpers.arrayElement(['online', 'offline']),
      lastActiveAt: faker.date.recent(),
      isActive: true,
    });
    
    if (isSeller) {
      user.storeInfo = {
        storeName: faker.company.name() + ' Gluten Free',
        description: faker.company.catchPhrase(),
        address: faker.location.streetAddress(),
        phone: faker.phone.number({ style: 'international' }),
        imageUrl: faker.image.url(),
        mapClicks: faker.number.int({ min: 0, max: 200 })
      };
    }
    
    await user.save();
    SEED_DATA.users.push(user._id);
  }

  const allUsers = await User.find({ _id: { $in: SEED_DATA.users } });
  const sellers = allUsers.filter(u => u.profileType === 'pro_commerce');
  const normalUsers = allUsers.filter(u => u.profileType !== 'pro_commerce');

  // 2. Generate Locations
  console.log(`Generating ${CONFIG.NUM_LOCATIONS} locations...`);
  for (let i = 0; i < CONFIG.NUM_LOCATIONS; i++) {
    const seller = sellers.length > 0 ? faker.helpers.arrayElement(sellers) : faker.helpers.arrayElement(allUsers);
    const tunisCoords = [
      10.1815 + (Math.random() - 0.5) * 0.1, // Lng around Tunis
      36.8065 + (Math.random() - 0.5) * 0.1  // Lat around Tunis
    ];
    
    const location = new Location({
      name: seller.storeInfo?.storeName || faker.company.name(),
      description: faker.lorem.paragraph(),
      category: faker.helpers.arrayElement(Object.values(Location.CATEGORIES || {})),
      glutenFree: true,
      certified: faker.datatype.boolean(),
      address: faker.location.streetAddress(),
      city: 'Tunis',
      country: 'Tunisia',
      phone: faker.phone.number({ style: 'international' }),
      location: { type: 'Point', coordinates: tunisCoords },
      images: [{ url: faker.image.url() }],
      createdBy: seller._id,
      rating: { average: faker.number.float({ min: 3.5, max: 5, fractionDigits: 1 }), count: faker.number.int({ min: 1, max: 100 }) },
      priceRange: faker.helpers.arrayElement(['$', '$$', '$$$', '$$$$']),
    });
    
    await location.save();
    SEED_DATA.locations.push(location._id);
  }

  // 3. Generate Events
  console.log(`Generating ${CONFIG.NUM_EVENTS} events...`);
  for (let i = 0; i < CONFIG.NUM_EVENTS; i++) {
    const organizer = faker.helpers.arrayElement(allUsers);
    const startsAt = faker.date.soon({ days: 30 });
    const endsAt = new Date(startsAt.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
    
    const event = new Event({
      title: faker.company.catchPhrase() + ' Meetup',
      type: faker.helpers.arrayElement(['meetup', 'class', 'market']),
      description: faker.lorem.paragraphs(2),
      startsAt,
      endsAt,
      location: {
        name: faker.location.street(),
        address: faker.location.streetAddress(),
        city: 'Tunis',
        country: 'Tunisia',
        lat: 36.8065 + (Math.random() - 0.5) * 0.1,
        lng: 10.1815 + (Math.random() - 0.5) * 0.1,
      },
      organizer: {
        name: organizer.fullName,
        contact: organizer.email,
        organizerId: organizer._id,
      },
      price: faker.helpers.arrayElement([0, 10, 20, 50]),
      currency: 'TND',
      images: [{ url: faker.image.url() }],
      createdBy: organizer._id,
    });
    
    await event.save();
    SEED_DATA.events.push(event._id);
  }

  // 4. Generate Recipes
  console.log(`Generating ${CONFIG.NUM_RECIPES} recipes...`);
  const RECIPE_CATEGORIES = ['tunisian', 'easy', 'quick'];
  for (let i = 0; i < CONFIG.NUM_RECIPES; i++) {
    const author = faker.helpers.arrayElement(allUsers);
    const title = faker.food.dish() + ' (Gluten Free)';
    
    const recipe = new Recipe({
      title,
      slug: faker.helpers.slugify(title).toLowerCase() + '-' + crypto.randomBytes(3).toString('hex'),
      category: faker.helpers.arrayElement(RECIPE_CATEGORIES),
      description: faker.food.description(),
      ingredients: Array.from({ length: 5 }, () => faker.food.ingredient()),
      steps: Array.from({ length: 4 }, () => faker.lorem.sentence()),
      nutritionInfo: {
        calories: faker.number.int({ min: 100, max: 800 }),
        protein: faker.number.int({ min: 5, max: 50 }),
        carbs: faker.number.int({ min: 10, max: 100 }),
      },
      photos: [faker.image.url()],
      authorId: author._id,
      isPublished: true,
    });
    
    await recipe.save();
    SEED_DATA.recipes.push(recipe._id);
  }

  // 5. Generate Channels & Messages
  console.log(`Generating ${CONFIG.NUM_CHANNELS} channels with messages...`);
  for (let i = 0; i < CONFIG.NUM_CHANNELS; i++) {
    const creator = faker.helpers.arrayElement(allUsers);
    const members = faker.helpers.arrayElements(allUsers, faker.number.int({ min: 3, max: 10 }));
    const memberIds = members.map(m => m._id.toString());
    if (!memberIds.includes(creator._id.toString())) memberIds.push(creator._id.toString());
    
    const participants = memberIds.map(id => ({
      userId: id,
      role: id === creator._id.toString() ? 'owner' : 'member'
    }));

    const channel = new Channel({
      name: faker.lorem.words(3) + ' Group',
      description: faker.lorem.sentence(),
      type: 'group',
      coverImageUrl: faker.image.url(),
      isPrivate: false,
      participants: participants,
    });
    
    await channel.save();
    SEED_DATA.channels.push(channel._id);

    // Generate messages for this channel
    for (let j = 0; j < CONFIG.MESSAGES_PER_CHANNEL; j++) {
      const sender = faker.helpers.arrayElement(members);
      const message = new Message({
        channelId: channel._id,
        senderId: sender._id,
        content: faker.lorem.sentences(faker.number.int({ min: 1, max: 3 })),
        type: 'text',
      });
      await message.save();
      SEED_DATA.messages.push(message._id);
    }
    
    channel.lastMessage = SEED_DATA.messages[SEED_DATA.messages.length - 1];
    await channel.save();
  }

  // 6. Generate Reels
  console.log(`Generating ${CONFIG.NUM_REELS} reels...`);
  // using a public test video
  const testVideoUrls = [
    'https://res.cloudinary.com/demo/video/upload/v1581415053/dog.mp4',
    'https://res.cloudinary.com/demo/video/upload/v1605697669/elephants.mp4',
    'https://res.cloudinary.com/demo/video/upload/v1642599298/surf.mp4'
  ];

  for (let i = 0; i < CONFIG.NUM_REELS; i++) {
    const author = faker.helpers.arrayElement(allUsers);
    const videoUrl = faker.helpers.arrayElement(testVideoUrls);
    const thumbnailUrl = videoUrl.replace(/\.mp4$/, '.jpg'); // Cloudinary can auto-generate thumbnails

    const reel = new Reel({
      authorId: author._id,
      videoUrl: videoUrl,
      thumbnailUrl: thumbnailUrl,
      caption: faker.lorem.sentence() + ' #glutenfree',
      duration: faker.number.int({ min: 15, max: 60 }),
      viewsCount: faker.number.int({ min: 100, max: 10000 }),
      likesCount: faker.number.int({ min: 10, max: 1000 }),
      commentsCount: faker.number.int({ min: 0, max: 100 }),
      trendingScore: faker.number.float({ min: 10, max: 100 }),
      status: 'ready',
      category: faker.helpers.arrayElement(['all', 'recipes', 'tips', 'products', 'lifestyle']),
    });
    
    await reel.save();
    SEED_DATA.reels.push(reel._id);
  }

  // Save the tracking file
  const seedFile = path.join(__dirname, `latest-seed-run.json`);
  fs.writeFileSync(seedFile, JSON.stringify(SEED_DATA, null, 2));
  console.log(`✅ Seed tracking file created at: ${seedFile}`);
  console.log('✅ Reality Case Seed completely applied.');
}

runSeed()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
