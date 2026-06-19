'use strict';

const Channel = require('../../database/models/channel.model');
const logger  = require('../../bootstrap/logger.bootstrap');

function channelHandler(io, socket) {
  const userId = socket.data.user?._id?.toString();

  // Auto-join active socket to all rooms the user is participating in
  (async () => {
    try {
      const channels = await Channel.find({
        $or: [
          { isPrivate: { $ne: true } },
          { 'participants.userId': socket.data.user?._id }
        ]
      }).lean();
      for (const ch of channels) {
        socket.join(`channel:${ch._id.toString()}`);
      }
      // (auto-join logged at debug level only)
    } catch (err) {
      logger.error('[socket:channel] Auto-join failed', { err: err.message });
    }
  })();

  socket.on('channel:join', async ({ channelId }) => {
    try {
      const channel = await Channel.findById(channelId).lean();
      if (!channel) {
        return logger.warn('[socket:channel] Join blocked: channel not found', { channelId, userId });
      }

      const isPublic = !channel.isPrivate;
      const hasAccess = isPublic || (channel.participants && channel.participants.some(p => {
        if (!p) return false;
        const pId = p.userId ? p.userId.toString() : p.toString();
        return pId === userId;
      }));

      if (!hasAccess) {
        return logger.warn('[socket:channel] Join blocked: not a member', { channelId, userId });
      }

      socket.join(`viewing:${channelId}`);
      socket.join(`channel:${channelId}`);
      // joined — no-op log
    } catch (err) {
      logger.error('[socket:channel] Join handler error', { err: err.message });
    }
  });

  socket.on('channel:leave', ({ channelId }) => {
    socket.leave(`viewing:${channelId}`);
    // left — no-op log
  });
}

module.exports = channelHandler;
