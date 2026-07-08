'use strict';

const service = require('./messages.service');
const mapper  = require('./messages.mapper');
const asyncHandler = require('../../common/utils/async-handler');

const messagesController = {

  list: asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const limit     = Math.min(Number(req.query.limit) || 20, 100);
    
    let cursor = req.query.cursor || null;
    let direction = req.query.direction === 'after' ? 'after' : 'before';

    if (req.query.before !== undefined) {
      cursor = req.query.before || null;
      direction = 'before';
    } else if (req.query.after !== undefined) {
      cursor = req.query.after || null;
      direction = 'after';
    }

    const { items } = await service.list(channelId, req.user._id, { cursor, limit, direction });

    const hasMore = items.length === limit;
    let nextCursor = null;
    if (hasMore && items.length > 0) {
      const cursorItem = direction === 'before' ? items[0] : items[items.length - 1];
      nextCursor = cursorItem._id?.toString() || cursorItem.id?.toString() || null;
    }

    res.status(200).json(mapper.toMessageListResponse(items, { cursor: nextCursor, hasMore }));
  }),

  edit: asyncHandler(async (req, res) => {
    const msg = await service.edit(req.params.id, req.user._id, req.body.content);
    res.status(200).json({ success: true, data: mapper.toMessageResponse(msg) });
  }),

  remove: asyncHandler(async (req, res) => {
    await service.remove(req.params.id, req.user._id);
    res.status(200).json({ success: true });
  }),

  pin: asyncHandler(async (req, res) => {
    const { channelId, messageId } = req.params;
    await service.pin(channelId, messageId, req.user._id);
    const pinnedMessages = await service.getPinnedMessages(channelId);
    const io = req.app.get('io');
    if (io) {
      io.to(`channel:${channelId}`).emit('message:pinned', { channelId, messageId, pinned: true, pinnedMessages });
    }
    res.status(200).json({ success: true, pinnedMessages });
  }),

  unpin: asyncHandler(async (req, res) => {
    const { channelId, messageId } = req.params;
    await service.unpin(channelId, messageId, req.user._id);
    const pinnedMessages = await service.getPinnedMessages(channelId);
    const io = req.app.get('io');
    if (io) {
      io.to(`channel:${channelId}`).emit('message:unpinned', { channelId, messageId, pinned: false, pinnedMessages });
    }
    res.status(200).json({ success: true, pinnedMessages });
  }),
};

module.exports = messagesController;
