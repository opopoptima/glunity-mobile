'use strict';

const multer       = require('multer');
const uploadService = require('./upload.service');
const asyncHandler  = require('../../common/utils/async-handler');
const Message       = require('../../database/models/message.model');
const Channel       = require('../../database/models/channel.model');

// ── Multer instance ───────────────────────────────────────────────────────────
// Memory storage — buffers land in RAM, never hit disk.
// fileFilter and limits are owned by the service to keep business rules there.

const upload = multer({
  storage:    multer.memoryStorage(),
  fileFilter: uploadService.fileFilter,
  limits:     uploadService.limits,
});

// ── Multer error normaliser ───────────────────────────────────────────────────

function handleMulterError(err, _req, _res, next) {
  if (err instanceof multer.MulterError) {
    const e = new Error(
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File exceeds the maximum allowed size'
        : err.message
    );
    e.status = 413;
    e.code   = 'FILE_TOO_LARGE';
    return next(e);
  }
  // fileFilter rejection or other errors bubble as-is
  next(err);
}

// ── Controller ────────────────────────────────────────────────────────────────

const uploadController = {

  /**
   * POST /api/channels/:id/upload
   *
   * Multipart/form-data field name: `file`
   *
   * 1. multer buffers the file and runs fileFilter (MIME whitelist).
   * 2. uploadService validates size per MIME type and uploads to Cloudinary.
   * 3. A new Message of the appropriate type is persisted with the attachment.
   * 4. Channel.lastMessage is updated.
   *
   * Response: 201 with { success, data: { message, attachment } }
   */
  upload: [
    // Middleware chain: multer → multer error handler → async business logic
    upload.single('file'),
    handleMulterError,
    asyncHandler(async (req, res) => {
      if (!req.file) {
        const err = new Error('No file uploaded — use multipart/form-data with field name "file"');
        err.status = 400;
        throw err;
      }

      const { id: channelId } = req.params;
      const senderId          = req.user._id;

      // ── Access check ────────────────────────────────────────────────────
      // Use $or so we accept: (a) public channels, (b) explicit participant entry,
      // (c) participant stored as plain ObjectId (older schema variant).
      // deletedAt may be undefined (field not set) or null — both mean "not deleted".
      const channel = await Channel.findOne({
        _id: channelId,
        deletedAt: { $in: [null, undefined] },
        $or: [
          { isPrivate: { $ne: true } },          // public / group channel
          { 'participants.userId': senderId },    // participant sub-doc format
          { participants: senderId },             // plain ObjectId array format
        ],
      }).lean();

      if (!channel) {
        const err = new Error('Channel not found or access denied');
        err.status = 404;
        throw err;
      }

      // ── Upload to Cloudinary ─────────────────────────────────────────────
      const attachment = await uploadService.uploadAttachment(req.file, channelId);

      // ── Persist Message ──────────────────────────────────────────────────
      const messageType = ['image', 'video'].includes(attachment.type) ? 'media' : 'media';

      const message = await Message.create({
        channelId,
        senderId,
        content:     (req.body.caption || '').trim().slice(0, 4000),
        type:        messageType,
        attachments: [attachment],
      });

      // ── Update channel last message ──────────────────────────────────────
      await Channel.updateLastMessage(channelId, message);

      // ── Socket Broadcast ──────────────────────────────────────────────────
      const io = req.app.get('io');
      if (io) {
        const populated = {
          id:              message._id.toString(),
          channelId:       message.channelId.toString(),
          senderId:        message.senderId.toString(),
          senderName:      req.user.fullName,
          senderAvatarUrl: req.user.avatar?.url || null,
          content:         message.content,
          type:            message.type,
          attachments:     message.attachments,
          reelRef:         message.reelRef || null,
          replyTo:         message.replyTo && message.replyTo.messageId ? {
            messageId:  message.replyTo.messageId.toString(),
            senderName: message.replyTo.senderName,
            preview:    message.replyTo.preview,
          } : null,
          reactionCounts:  {},
          createdAt:       message.createdAt,
        };
        io.to(`channel:${channelId}`).emit('message:new', { message: populated });
      }

      res.status(201).json({
        success:    true,
        data: {
          message: {
            id:          message._id.toString(),
            channelId:   message.channelId.toString(),
            senderId:    message.senderId.toString(),
            type:        message.type,
            attachments: message.attachments,
            createdAt:   message.createdAt,
          },
          attachment,
        },
      });
    }),
  ],
};

module.exports = uploadController;
