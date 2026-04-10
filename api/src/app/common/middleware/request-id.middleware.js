'use strict';

const { v4: uuidv4 } = (() => {
  try { return require('crypto'); } catch { return { v4: () => Math.random().toString(36).slice(2) }; }
})();

/**
 * Attaches a unique request-id to every incoming request for traceability.
 */
function requestId(req, res, next) {
  const id = req.headers['x-request-id'] ||
    (typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 11));
  req.requestId      = id;
  res.setHeader('x-request-id', id);
  next();
}

module.exports = requestId;
