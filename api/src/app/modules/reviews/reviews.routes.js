'use strict';

const { Router } = require('express');
const controller = require('./reviews.controller');
const validate = require('../../common/middleware/validation.middleware');
const authMiddleware = require('../../common/middleware/auth.middleware');
const authorize = require('../../common/middleware/role.middleware');
const { createReviewSchema } = require('./reviews.schema');

const router = Router();

// Anyone (including unauthenticated) can READ reviews
router.get('/', controller.list);

// Only non-seller users (celiac, proche, pro_health) can WRITE reviews.
// pro_commerce sellers are not allowed to submit reviews — they can only view them.
router.post(
  '/',
  authMiddleware,
  authorize('celiac', 'proche', 'pro_health'),
  createReviewSchema,
  validate,
  controller.create,
);

module.exports = router;
