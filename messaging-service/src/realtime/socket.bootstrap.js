'use strict';

const { Server }        = require('socket.io');
const env               = require('../config/env');
const logger            = require('../bootstrap/logger.bootstrap');
const socketAuth        = require('./socket.auth');

const channelHandler  = require('./handlers/channel.handler');
const messageHandler  = require('./handlers/message.handler');
const reactionHandler = require('./handlers/reaction.handler');
const presenceHandler = require('./handlers/presence.handler');

const isAllowedLocalDevOrigin = (origin) => {
  return /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin);
};

function bootstrap(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        const isAllowed = env.socket.corsOrigins.includes(origin) || (env.isDev && isAllowedLocalDevOrigin(origin));
        if (isAllowed) {
          return callback(null, true);
        }
        return callback(new Error(`CORS: Origin "${origin}" is not allowed`));
      },
      methods:     ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 25_000,
    pingTimeout:  60_000,
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares:          true,
    },
    transports: ['websocket', 'polling'],
  });

  attachRedisAdapter(io).catch((err) => {
    logger.warn('[socket.io] Redis adapter not attached — running single-instance', { err: err.message });
  });

  io.use(socketAuth);

  io.on('connection', (socket) => {
    const userId = socket.data.user?._id?.toString() ?? 'unknown';
    logger.info('[socket.io] Client connected', { userId, socketId: socket.id });

    socket.userId = userId;
    const redisClient = require('../bootstrap/redis.bootstrap').getPubClient();

    socket.data.io = io;
    if (userId !== 'unknown') {
      socket.join(userId);
    }

    channelHandler (io, socket);
    messageHandler (io, socket);
    reactionHandler(io, socket);
    presenceHandler(io, socket, redisClient);

    socket.on('disconnect', (reason) => {
      logger.info('[socket.io] Client disconnected', { userId, reason });
    });
  });

  logger.info('[socket.io] Server bootstrapped');
  return io;
}

async function attachRedisAdapter(io) {
  const { createAdapter } = require('@socket.io/redis-adapter');
  const { getPubClient, getSubClient } = require('../bootstrap/redis.bootstrap');

  const pub = getPubClient();
  const sub = getSubClient();

  if (!pub || !sub) {
    throw new Error('Redis clients not initialized (disabled)');
  }

  await Promise.race([
    new Promise((resolve, reject) => {
      if (pub.status === 'ready') return resolve();
      pub.once('ready', resolve);
      pub.once('error', reject);
      pub.once('end',   () => reject(new Error('Redis gave up reconnecting')));
    }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Redis ready timeout')), 5000)),
  ]);

  io.adapter(createAdapter(pub, sub));
  logger.info('[socket.io] Redis adapter attached ✓');
}

module.exports = bootstrap;
