'use strict';

const bcrypt = require('bcryptjs');
const { AUTH } = require('../../config/constants');

/**
 * Hash a plaintext password.
 * @param {string} plain
 * @returns {Promise<string>}
 */
async function hashPassword(plain) {
  return bcrypt.hash(plain, AUTH.BCRYPT_ROUNDS);
}

/**
 * Compare a plaintext password against a stored hash.
 * @param {string} plain
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

module.exports = { hashPassword, verifyPassword };
