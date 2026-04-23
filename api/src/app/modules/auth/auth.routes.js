'use strict';

const { Router } = require('express');

const authController = require('./auth.controller');
const {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
} = require('./auth.schema');
const validate       = require('../../common/middleware/validation.middleware');
const authMiddleware = require('../../common/middleware/auth.middleware');

const router = Router();

// ── Public routes ──────────────────────────────────────────────────────────────
router.post('/register',              registerSchema,             validate, authController.register);
router.post('/login',                 loginSchema,                validate, authController.login);
router.post('/refresh',               refreshSchema,              validate, authController.refresh);
router.post('/logout',                                                      authController.logout);

// ── Email verification ─────────────────────────────────────────────────────────
router.get('/verify-email/:token',    verifyEmailSchema,          validate, authController.verifyEmail);
router.post('/resend-verification',   resendVerificationSchema,   validate, authController.resendVerification);

// ── Password reset ─────────────────────────────────────────────────────────────
router.post('/forgot-password',       forgotPasswordSchema,       validate, authController.forgotPassword);
router.post('/reset-password',        resetPasswordSchema,        validate, authController.resetPassword);

// ── Protected routes ───────────────────────────────────────────────────────────
router.get('/me', authMiddleware, authController.me);

module.exports = router;
