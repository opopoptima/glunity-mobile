'use strict';

const asyncHandler      = require('../../common/utils/async-handler');
const reelShareService  = require('./reel-share.service');
const messageMapper     = require('../messages/messages.mapper');
const Channel           = require('../../database/models/channel.model');
const Message           = require('../../database/models/message.model');

const reelShareController = {

  // ── POST /api/channels/:id/reels ─────────────────────────────────────────
  /**
   * Share a reel into a channel.
   *
   * Body: { reelId: ObjectId, caption?: string }
   */
  shareReel: asyncHandler(async (req, res) => {
    const { id: channelId } = req.params;
    const { reelId, caption = '' } = req.body;

    if (!reelId) {
      const err = new Error('reelId is required');
      err.status = 400;
      err.code   = 'VALIDATION_ERROR';
      throw err;
    }

    const message = await reelShareService.shareReel(
      channelId,
      req.user._id,
      reelId,
      caption
    );

    const io = req.app.get('io');
    if (io) {
      try {
        const populated = messageMapper.toMessageResponse(message);
        populated.senderName = req.user.fullName || 'User';
        populated.senderAvatarUrl = req.user.avatar?.url || null;

        io.to(`channel:${channelId}`).emit('message:new', { message: populated });

        const updatedChannel = await Channel.findById(channelId).lean();
        if (updatedChannel && updatedChannel.participants) {
          for (const p of updatedChannel.participants) {
            const pId = (p.userId || p).toString();
            const startFrom = [p.lastReadAt, p.clearedAt].filter(Boolean).sort((a, b) => b - a)[0] || new Date(0);
            const unreadCount = await Message.countDocuments({
              channelId,
              deletedAt: { $in: [null, undefined] },
              createdAt: { $gt: startFrom },
            });

            io.to(pId).emit('conversation:updated', {
              channelId,
              lastMessage: {
                messageId:  message._id.toString(),
                senderId:   message.senderId.toString(),
                senderName: req.user.fullName || 'User',
                content:    '[reel]',
                createdAt:  message.createdAt,
              },
              unreadCount,
            });
          }
        }
      } catch (err) {
        console.warn('[reel-share] Socket broadcast error:', err);
      }
    }

    res.status(201).json({
      success: true,
      data:    messageMapper.toMessageResponse(message),
    });
  }),
};

module.exports = reelShareController;
