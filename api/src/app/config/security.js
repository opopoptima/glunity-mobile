'use strict';

const helmet = require('helmet');

/**
 * Helmet middleware configuration.
 * Configured with cross-origin policies relaxed slightly to facilitate React Native/Expo image fetching,
 * while keeping standard clickjacking, mime-sniffing, and X-Powered-By protection enabled.
 */
const securityMiddleware = helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

module.exports = securityMiddleware;
