'use strict';

const { Router } = require('express');

const productsController = require('./products.controller');
const {
	createProductSchema,
	updateProductSchema,
	listProductsSchema,
	productIdSchema,
} = require('./products.schema');
const validate = require('../../common/middleware/validation.middleware');
const authMiddleware = require('../../common/middleware/auth.middleware');
const authorize = require('../../common/middleware/role.middleware');

const router = Router();

// Public routes
router.get('/', listProductsSchema, validate, productsController.list);
router.get('/:id', productIdSchema, validate, productsController.getById);

// View counter — public; optional auth so seller's own visits are skipped
router.post('/:id/view', (req, res, next) => {
	const authHeader = req.headers['authorization'];
	if (authHeader && authHeader.startsWith('Bearer ')) {
		return authMiddleware(req, res, (err) => {
			if (err) { req.user = null; }
			next();
		});
	}
	next();
}, productsController.incrementView);

// Protected routes — only pro_commerce sellers can mutate products
router.post('/', authMiddleware, authorize('pro_commerce'), createProductSchema, validate, productsController.create);
router.patch('/:id', authMiddleware, authorize('pro_commerce'), updateProductSchema, validate, productsController.update);
router.delete('/:id', authMiddleware, authorize('pro_commerce'), productIdSchema, validate, productsController.remove);

module.exports = router;
