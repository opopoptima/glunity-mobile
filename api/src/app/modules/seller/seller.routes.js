'use strict';

const { Router } = require('express');
const sellerController = require('./seller.controller');
const authenticate = require('../../common/middleware/auth.middleware');
const authorize = require('../../common/middleware/role.middleware');

const router = Router();

// All seller routes require authentication and pro_commerce role
router.use(authenticate);
router.use(authorize('pro_commerce'));

/**
 * POST /api/seller/verify
 * Submit verification documents to admin for review.
 * Body: { documents: string[] }
 */
router.post('/verify', (req, res, next) => sellerController.submitVerification(req, res, next));

/**
 * GET /api/seller/shop
 * Get the seller's current approved shop info.
 */
router.get('/shop', (req, res, next) => sellerController.getShopInfo(req, res, next));

/**
 * POST /api/seller/shop/update
 * Submit shop info changes for admin review.
 * Body: { storeName, description, address, operatingHours, phone, imageUrl }
 */
router.post('/shop/update', (req, res, next) => sellerController.submitShopUpdate(req, res, next));

/**
 * GET /api/seller/shop/pending
 * Check if there is a pending shop update submission.
 */
router.get('/shop/pending', (req, res, next) => sellerController.getMyShopPendingUpdate(req, res, next));

/**
 * GET /api/seller/products
 * Get the seller's own products (all moderation statuses, not filtered by isPublic).
 */
router.get('/products', (req, res, next) => sellerController.getSellerProducts(req, res, next));

module.exports = router;
