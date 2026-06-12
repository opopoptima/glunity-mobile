'use strict';

const { createMainClient, available: redisAvailable } = require('../../bootstrap/redis.bootstrap');
const emitter  = require('../emitters/channel.emitter');
const env      = require('../../config/env');
const logger   = require('../../bootstrap/logger.bootstrap');
const Channel  = require('../../database/models/channel.model');
const mongoose = require('mongoose');

const PRESENCE_KEY  = (userId) => `presence:${userId}`;
const HEARTBEAT_TTL = Math.ceil(env.presence.timeout / 1000);

let redisClient = null;
function getRedis() {
  if (!redisClient && redisAvailable()) {
    redisClient = createMainClient();
  }
  return redisClient;
}

// Lazy-load User model (same shared MongoDB connection as Channel)
function getUserModel() {
  return mongoose.model('User');
}

/**
 * Returns the set of user IDs that share at least one channel with `userId`.
 * These are the only users that need to receive presence updates for this user.
 */
async function getPeerUserIds(userId) {
  const channels = await Channel.find({
    $or: [
      { 'participants.userId': userId }, // Mongoose auto-casts string → ObjectId
      { isPrivate: { $ne: true } },       // all public channels
    ]
  }).select('participants').lean();

  const peerSet = new Set();
  for (const ch of channels) {
    for (const p of ch.participants || []) {
      const pId = p.userId ? p.userId.toString() : p.toString();
      if (pId !== userId) peerSet.add(pId);
    }
  }
  return [...peerSet];
}

function presenceHandler(io, socket) {
  const user   = socket.data.user;
  const userId = user._id.toString();
  const redis  = getRedis();

  // ── Mark online on connect ───────────────────────────────────────────────────
  (async () => {
    try {
      const User = getUserModel();

      // 1. Join the user's own named room immediately — before any async work
      //    so that peers who connect milliseconds later can already target this socket
      socket.join(userId);

      // 2. Persist to MongoDB
      await User.findByIdAndUpdate(userId, {
        onlineStatus: 'online',
        lastSeenAt: null,
      });

      // 3. Set Redis TTL key (heartbeat window), if Redis is enabled
      if (redis) {
        await redis.set(PRESENCE_KEY(userId), socket.id, 'EX', HEARTBEAT_TTL);
      }

      // 4. Get this user's peer IDs (channel-mates)
      const peerIds = await getPeerUserIds(userId);

      // 5. Tell every peer that this user is now online
      emitter.presenceOnline(io, userId, peerIds);

      // 6. ── SYNC GAP FIX ──────────────────────────────────────────────────
      //    The connecting user has an empty onlineMap and has no way of knowing
      //    which of their peers are ALREADY online.  Query MongoDB for online peers
      //    and push individual presence:online events straight back to THIS socket.
      //    This runs every connect so the client never needs to poll or refresh.
      if (peerIds.length > 0) {
        const onlinePeers = await User.find({
          _id: { $in: peerIds },
          onlineStatus: 'online',
        }).select('_id').lean();

        for (const p of onlinePeers) {
          socket.emit('presence:online', { userId: p._id.toString() });
        }

        logger.info('[presence] Online — synced peers', {
          userId,
          totalPeers: peerIds.length,
          onlinePeers: onlinePeers.length,
        });
      } else {
        logger.info('[presence] Online', { userId, peers: 0 });
      }
    } catch (err) {
      logger.error('[presence] Failed to set online', { err: err.message });
    }
  })();

  // ── Heartbeat ping ────────────────────────────────────────────────────────────
  socket.on('presence:ping', async () => {
    try {
      if (redis) {
        await redis.expire(PRESENCE_KEY(userId), HEARTBEAT_TTL);
      }
    } catch (err) {
      logger.warn('[presence] Ping expire failed', { err: err.message });
    }
  });

  // ── Disconnect ────────────────────────────────────────────────────────────────
  socket.on('disconnect', async () => {
    try {
      // Only mark offline if this user has NO other open sockets (e.g. multiple tabs)
      const allSockets = await io.fetchSockets();
      const stillOnline = allSockets.some(
        (s) => s.id !== socket.id && s.data?.user?._id?.toString() === userId
      );

      if (!stillOnline) {
        const now = new Date();
        const User = getUserModel();

        // 1. Persist to MongoDB
        await User.findByIdAndUpdate(userId, {
          onlineStatus: 'offline',
          lastSeenAt: now,
        });

        // 2. Clean Redis key
        if (redis) {
          await redis.del(PRESENCE_KEY(userId));
        }

        // 3. Emit offline to peers
        const peerIds = await getPeerUserIds(userId);
        emitter.presenceOffline(io, userId, now.toISOString(), peerIds);

        logger.info('[presence] Offline', { userId, lastSeen: now });
      }
    } catch (err) {
      logger.error('[presence] Failed to set offline', { err: err.message });
    }
  });
}

module.exports = presenceHandler;
