'use strict';

/**
 * Insert exactly 5 demo locations into the DB.
 * Usage:
 *   node scripts/insert-5-locations.js
 */

require('../src/app/bootstrap/env.bootstrap');
const mongoose = require('mongoose');
const env      = require('../src/app/config/env');
const Location = require('../src/database/models/location.model');

const SAMPLES = [
  {
    name: 'Ben Yaghlane Shops',
    description:
      'Premium Tunisian grocery known for high-end gluten-free pasta, breads and gourmet products.',
    category: 'grocery',
    glutenFree: true,
    certified: true,
    address: 'Avenue Habib Bourguiba',
    city: 'Tunis',
    phone: '+216 71 000 001',
    priceRange: '$$$',
    lng: 10.181667,
    lat: 36.806389,
    rating: { average: 4.8, count: 8200 },
    images: [{ url: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&q=80' }],
  },
  {
    name: 'La Maison Sans Gluten',
    description: 'Dedicated 100% gluten-free bakery with fresh breads and pastries daily.',
    category: 'bakery',
    glutenFree: true,
    certified: true,
    address: '14 Rue de Marseille',
    city: 'Tunis',
    phone: '+216 71 000 002',
    priceRange: '$$',
    lng: 10.175,
    lat: 36.798,
    rating: { average: 4.9, count: 412 },
    images: [{ url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80' }],
  },
  {
    name: 'Green Leaf Café',
    description: 'Cozy café offering certified gluten-free brunch, salads and smoothies.',
    category: 'cafe',
    glutenFree: true,
    certified: true,
    address: 'Avenue Mohamed V',
    city: 'Tunis',
    phone: '+216 71 000 003',
    priceRange: '$$',
    lng: 10.187,
    lat: 36.811,
    rating: { average: 4.6, count: 215 },
    images: [{ url: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=800&q=80' }],
  },
  {
    name: 'Pasta Verde',
    description: 'Italian restaurant with a separate gluten-free kitchen line.',
    category: 'restaurant',
    glutenFree: true,
    certified: false,
    address: '5 Rue de Carthage',
    city: 'Tunis',
    phone: '+216 71 000 004',
    priceRange: '$$$',
    lng: 10.169,
    lat: 36.802,
    rating: { average: 4.4, count: 188 },
    images: [{ url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80' }],
  },
  {
    name: 'Carrefour Marsa',
    description:
      'Supermarket with a wide selection of gluten-free products. Some shared shelves — check labels.',
    category: 'grocery',
    glutenFree: true,
    certified: false,
    contaminationWarning: true,
    address: 'La Marsa',
    city: 'La Marsa',
    phone: '+216 71 000 005',
    priceRange: '$$',
    lng: 10.323,
    lat: 36.878,
    rating: { average: 4.0, count: 1320 },
    images: [{ url: 'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?w=800&q=80' }],
  },
];

async function run() {
  console.log('[insert-5] connecting to', env.mongo.uri.replace(/:[^@]+@/, ':***@'));
  await mongoose.connect(env.mongo.uri);

  console.log('[insert-5] inserting locations…');
  const docs = SAMPLES.map(({ lng, lat, ...rest }) => ({
    ...rest,
    location: { type: 'Point', coordinates: [lng, lat] },
  }));

  const inserted = await Location.insertMany(docs);
  console.log(`[insert-5] inserted ${inserted.length} locations`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(async (err) => {
  console.error('[insert-5] failed:', err);
  try { await mongoose.disconnect(); } catch (_) { /* noop */ }
  process.exit(1);
});
