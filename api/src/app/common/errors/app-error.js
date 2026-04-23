'use strict';

/**
 * Base application error — carries an HTTP status code.
 */
class AppError extends Error {
  /**
   * @param {string} message   Human-readable message
   * @param {number} status    HTTP status code (default 500)
   * @param {string} [code]    Machine-readable error code
   */
  constructor(message, status = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name   = 'AppError';
    this.status = status;
    this.code   = code;
    Error.captureStackTrace(this, this.constructor);
  }

  // ── Factory helpers ────────────────────────────────────────────────────────
  static badRequest(message, code = 'BAD_REQUEST') {
    return new AppError(message, 400, code);
  }

  static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    return new AppError(message, 401, code);
  }

  static forbidden(message = 'Forbidden', code = 'FORBIDDEN') {
    return new AppError(message, 403, code);
  }

  static notFound(resource = 'Resource', code = 'NOT_FOUND') {
    return new AppError(`${resource} not found`, 404, code);
  }

  static conflict(message, code = 'CONFLICT') {
    return new AppError(message, 409, code);
  }

  static unprocessable(message, code = 'UNPROCESSABLE') {
    return new AppError(message, 422, code);
  }
}

module.exports = AppError;
