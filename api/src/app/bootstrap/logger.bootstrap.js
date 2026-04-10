'use strict';

/**
 * Minimal structured console logger.
 * In production swap this for Winston / Pino.
 */

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const env    = process.env.NODE_ENV || 'development';
const maxLvl = env === 'production' ? LEVELS.info : LEVELS.debug;

function format(level, msg, meta) {
  const ts   = new Date().toISOString();
  const base = `[${ts}] [${level.toUpperCase()}] ${msg}`;
  return meta ? `${base} ${JSON.stringify(meta)}` : base;
}

const logger = {
  error: (msg, meta) => LEVELS.error <= maxLvl && console.error(format('error', msg, meta)),
  warn:  (msg, meta) => LEVELS.warn  <= maxLvl && console.warn(format('warn',  msg, meta)),
  info:  (msg, meta) => LEVELS.info  <= maxLvl && console.info(format('info',  msg, meta)),
  debug: (msg, meta) => LEVELS.debug <= maxLvl && console.debug(format('debug', msg, meta)),
};

module.exports = logger;
