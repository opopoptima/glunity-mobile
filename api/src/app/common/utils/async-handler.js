'use strict';

/**
 * Wraps an async route handler and forwards errors to Express error middleware.
 * Eliminates the need for try-catch in every controller.
 *
 * @param {Function} fn  async (req, res, next) => void
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
