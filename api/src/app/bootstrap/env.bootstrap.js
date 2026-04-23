'use strict';

/**
 * Loads .env before any other module reads process.env.
 * Must be the very first import in server.js.
 */
require('dotenv').config();
