'use strict';

// ─── Profile Types ───────────────────────────────────────────────────────────
const PROFILE_TYPES = Object.freeze({
  CELIAC:       'celiac',
  PROCHE:       'proche',
  PRO_COMMERCE: 'pro_commerce',
  PRO_HEALTH:   'pro_health',
  ADMIN:        'admin',
});

// ─── Languages ────────────────────────────────────────────────────────────────
const LANGUAGES = Object.freeze({
  FR: 'fr',
  AR: 'ar',
  EN: 'en',
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
const AUTH = Object.freeze({
  BCRYPT_ROUNDS: 12,
  COOKIE_NAME: 'refreshToken',
  COOKIE_OPTIONS: {
    httpOnly: true,
    sameSite: 'Strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
});

// ─── HTTP ──────────────────────────────────────────────────────────────────────
const HTTP_STATUS = Object.freeze({
  OK:            200,
  CREATED:       201,
  NO_CONTENT:    204,
  BAD_REQUEST:   400,
  UNAUTHORIZED:  401,
  FORBIDDEN:     403,
  NOT_FOUND:     404,
  CONFLICT:      409,
  UNPROCESSABLE: 422,
  SERVER_ERROR:  500,
});

module.exports = { PROFILE_TYPES, LANGUAGES, AUTH, HTTP_STATUS };
