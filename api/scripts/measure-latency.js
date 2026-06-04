'use strict';

require('dotenv').config({ override: true });
const mongoose = require('mongoose');
const axios = require('axios');

async function testHttpLatency() {
  console.log('\n--- TESTING HTTP LATENCY ---');
  const urls = [
    'http://localhost:5000/health',
    'http://localhost:5000/api/products',
    'http://localhost:5000/api/events',
  ];

  for (const url of urls) {
    const start = Date.now();
    try {
      const res = await axios.get(url, { timeout: 5000 });
      const duration = Date.now() - start;
      console.log(`- GET ${url} -> Status: ${res.status} (${duration}ms)`);
    } catch (err) {
      const duration = Date.now() - start;
      console.log(`- GET ${url} -> FAILED: ${err.message} (${duration}ms)`);
    }
  }
}

async function testDatabaseLatency() {
  console.log('\n--- TESTING DATABASE LATENCY ---');
  const mongoUri = String(process.env.MONGO_URI || '')
    .trim()
    .replace(/^['\"]|['\"]$/g, '');

  if (!mongoUri) {
    console.log('Error: MONGO_URI is missing in .env file.');
    return;
  }

  const startConnect = Date.now();
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`- Connection time: ${Date.now() - startConnect}ms`);

    const startPing = Date.now();
    const admin = mongoose.connection.db.admin();
    await admin.ping();
    console.log(`- MDB Ping RTT: ${Date.now() - startPing}ms`);

    const startList = Date.now();
    await mongoose.connection.db.listCollections().toArray();
    console.log(`- List collections: ${Date.now() - startList}ms`);

  } catch (err) {
    console.log(`- DB test failed: ${err.message}`);
  } finally {
    await mongoose.connection.close();
  }
}

async function main() {
  await testHttpLatency();
  await testDatabaseLatency();
}

main();
