'use strict';

require('dotenv').config({ override: true });
const mongoose = require('mongoose');
const axios = require('axios');
const User = require('../src/database/models/user.model');
const { signAccessToken } = require('../src/app/common/utils/token');

const API_BASE_URL = 'http://localhost:5000/api';
const MSG_BASE_URL = 'http://localhost:5001/api';

async function runTests() {
  const mongoUri = String(process.env.MONGO_URI || '').trim().replace(/^['"]|['"]$/g, '');
  if (!mongoUri) throw new Error('MONGO_URI is missing. Set it in your .env');

  console.log('🧪 Starting Endpoint Availability Tests...');
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });

  // 1. Get a Celiac User and a Pro User
  const celiacUser = await User.findOne({ profileType: 'celiac', isActive: true });
  const proUser = await User.findOne({ profileType: 'pro_commerce', isActive: true });

  if (!celiacUser || !proUser) {
    throw new Error('Could not find both a celiac user and a pro user in the DB. Ensure seed is run.');
  }

  // 2. Generate Tokens
  const celiacToken = signAccessToken({ id: celiacUser._id.toString(), profileType: celiacUser.profileType });
  const proToken = signAccessToken({ id: proUser._id.toString(), profileType: proUser.profileType });

  console.log(`👤 Found Celiac User: ${celiacUser.email}`);
  console.log(`🏪 Found Pro User: ${proUser.email}`);

  // 3. Define Endpoints to Test
  const endpoints = [
    { method: 'GET', path: '/users', server: API_BASE_URL },
    { method: 'GET', path: '/users/random', server: API_BASE_URL },
    { method: 'GET', path: '/users/me', server: API_BASE_URL },
    { method: 'GET', path: '/users/me/seller-stats', server: API_BASE_URL, requiresPro: true },
    { method: 'GET', path: '/recipes', server: API_BASE_URL },
    { method: 'GET', path: '/locations', server: API_BASE_URL },
    { method: 'GET', path: '/events', server: API_BASE_URL },
    { method: 'GET', path: '/products', server: API_BASE_URL },
    { method: 'GET', path: '/reels', server: API_BASE_URL },
    { method: 'GET', path: '/channels', server: API_BASE_URL },
    { method: 'GET', path: '/channels', server: MSG_BASE_URL }, // test messaging service
    { method: 'GET', path: '/notifications', server: API_BASE_URL },
    { method: 'GET', path: '/badges', server: API_BASE_URL },
  ];

  const results = {
    celiac: [],
    pro: []
  };

  async function testEndpoint(endpoint, role, token) {
    try {
      const url = `${endpoint.server}${endpoint.path}`;
      const res = await axios({
        method: endpoint.method,
        url,
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: () => true // Resolve on all statuses
      });
      return { path: endpoint.path, status: res.status, server: endpoint.server };
    } catch (error) {
      return { path: endpoint.path, status: 'ERROR', message: error.message, server: endpoint.server };
    }
  }

  console.log('\n--- Testing as Celiac User ---');
  for (const ep of endpoints) {
    const res = await testEndpoint(ep, 'celiac', celiacToken);
    results.celiac.push(res);
    console.log(`[Celiac] ${ep.method} ${ep.server}${ep.path} -> ${res.status}`);
  }

  console.log('\n--- Testing as Pro User ---');
  for (const ep of endpoints) {
    const res = await testEndpoint(ep, 'pro', proToken);
    results.pro.push(res);
    console.log(`[Pro] ${ep.method} ${ep.server}${ep.path} -> ${res.status}`);
  }

  // 4. Output Results
  const fs = require('fs');
  fs.writeFileSync('scripts/test-results.json', JSON.stringify(results, null, 2));
  console.log('\n✅ Tests complete. Results saved to scripts/test-results.json');
}

runTests()
  .catch(err => console.error(err))
  .finally(async () => await mongoose.connection.close());
