'use strict';

/**
 * Insert 5 additional demo locations with varied categories.
 * Usage:
 *   node scripts/insert-more-locations.js
 */

require('../src/app/bootstrap/env.bootstrap');
const mongoose = require('mongoose');
const env      = require('../src/app/config/env');
const Location = require('../src/database/models/location.model');

const SAMPLES = [
  {
    name: 'Pharmacie du Centre',
    description: 'Local pharmacy carrying gluten-free supplements.',
    category: 'pharmacy',
    glutenFree: true,
    certified: false,
    address: 'Centre Ville',
    city: 'Tunis',
    phone: '+216 71 000 010',
    priceRange: '$',
    lng: 10.182,
    lat: 36.805,
    rating: { average: 4.2, count: 120 },
  },
  {
    name: 'Petit Délice Bakery',
    description: 'Small bakery with a daily selection of GF pastries.',
    category: 'bakery',
    glutenFree: true,
    certified: false,
    address: 'Rue du Marché',
    city: 'Tunis',
    phone: '+216 71 000 011',
    priceRange: '$',
    lng: 10.173,
    lat: 36.799,
    rating: { average: 4.7, count: 88 },
  },
  {
    name: 'Corner Restaurant',
    description: 'Neighborhood restaurant offering GF options.',
    category: 'restaurant',
    glutenFree: true,
    certified: false,
    address: 'Avenue des Oliviers',
    city: 'Tunis',
    phone: '+216 71 000 012',
    priceRange: '$$',
    lng: 10.190,
    lat: 36.810,
    rating: { average: 4.1, count: 54 },
  },
  {
    name: 'Organic Market',
    description: 'A small organic shop with GF staples and snacks.',
    category: 'grocery',
    glutenFree: true,
    certified: false,
    address: 'Rue Bio',
    city: 'Tunis',
    phone: '+216 71 000 013',
    priceRange: '$$',
    lng: 10.183,
    lat: 36.807,
    rating: { average: 4.3, count: 46 },
  },
  {
    name: 'Neighborhood Other Place',
    description: 'Community spot — uncategorized.',
    category: 'other',
    glutenFree: false,
    certified: false,
    address: 'Unknown street',
    city: 'Tunis',
    phone: '',
    priceRange: '',
    lng: 10.177,
    lat: 36.803,
    rating: { average: 3.9, count: 12 },
  },
];

async function run() {
  console.log('[insert-more] connecting to', env.mongo.uri.replace(/:[^@]+@/, ':***@'));
  await mongoose.connect(env.mongo.uri);

  console.log('[insert-more] inserting locations…');
  const docs = SAMPLES.map(({ lng, lat, ...rest }) => ({
    ...rest,
    location: { type: 'Point', coordinates: [lng, lat] },
  }));

  const inserted = await Location.insertMany(docs);
  console.log(`[insert-more] inserted ${inserted.length} locations`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(async (err) => {
  console.error('[insert-more] failed:', err);
  try { await mongoose.disconnect(); } catch (_) { /* noop */ }
  process.exit(1);
});
