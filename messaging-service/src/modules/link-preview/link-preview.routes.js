'use strict';

const { Router } = require('express');
const rateLimit  = require('express-rate-limit');
const auth       = require('../../common/middleware/auth.middleware');
const { getLinkPreview } = require('./link-preview.controller');

const router = Router();

/**
 * Independent rate limiter for the preview endpoint.
 * 20 requests per minute per authenticated user IP.
 */
const previewLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'RATE_LIMITED',
    message: 'Too many preview requests. Please wait a moment.',
  },
});

/**
 * POST /api/link-preview
 * Fetch rich metadata for a supported social media URL.
 * Body: { url: string }
 */
router.post('/', auth, previewLimiter, getLinkPreview);

module.exports = router;
