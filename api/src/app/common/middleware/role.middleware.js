'use strict';

const AppError = require('../errors/app-error');

/**
 * Role-based access control middleware.
 * Usage: router.get('/admin', authorize('admin'), handler)
 *
 * @param {...string} roles  Allowed profile types
 */
function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }
    if (!roles.includes(req.user.profileType)) {
      return next(AppError.forbidden('Insufficient permissions'));
    }
    return next();
  };
}

module.exports = authorize;
