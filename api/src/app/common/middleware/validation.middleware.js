'use strict';

const { validationResult } = require('express-validator');
const AppError             = require('../errors/app-error');

/**
 * Run after express-validator chains.
 * If there are validation errors, returns 422 with structured field errors.
 */
function validate(req, _res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const errors = result.array().map((e) => ({
      field:   e.path,
      message: e.msg,
    }));
    console.error('[Validation Error]', JSON.stringify(errors, null, 2));
    const err     = AppError.unprocessable('Validation failed', 'VALIDATION_ERROR');
    err.errors    = errors;
    return next(err);
  }
  return next();
}

module.exports = validate;
