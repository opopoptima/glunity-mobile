'use strict';

const express         = require('express');
const authMiddleware  = require('../../common/middleware/auth.middleware');
const usersController = require('./users.controller');

const router = express.Router();

// All /api/users/* routes require authentication
router.use(authMiddleware);

/** PATCH /api/users/me — update authenticated user's profile */
router.patch('/me', usersController.updateMe);

/** POST /api/users/change-password — update user password */
router.post('/change-password', usersController.changePassword);

module.exports = router;
