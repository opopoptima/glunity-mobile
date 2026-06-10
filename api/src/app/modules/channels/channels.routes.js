'use strict';

const { Router } = require('express');
const controller = require('./channels.controller');
const validate = require('../../common/middleware/validation.middleware');
const authMiddleware = require('../../common/middleware/auth.middleware');
const { channelIdSchema, postMessageSchema, updateChannelSchema } = require('./channels.schema');

const router = Router();

// ── Channel CRUD ────────────────────────────────────────────────────────────
router.get('/',             authMiddleware, controller.list);
router.post('/',            authMiddleware, controller.createChannel);
router.post('/direct',      authMiddleware, controller.getOrCreateDirectChannel);
router.patch('/:id',        authMiddleware, updateChannelSchema, validate, controller.updateChannel);
router.post('/:id/update',  authMiddleware, updateChannelSchema, validate, controller.updateChannel);

// ── Messages ─────────────────────────────────────────────────────────────────
router.get('/:id/messages',  authMiddleware, channelIdSchema, validate, controller.listMessages);
router.post('/:id/messages', authMiddleware, postMessageSchema, validate, controller.postMessage);

// ── Pinned channels (user-level bookmarks) ───────────────────────────────────
router.post('/:id/pin',    authMiddleware, controller.pinChannel);
router.delete('/:id/pin',  authMiddleware, controller.unpinChannel);

// ── Join ─────────────────────────────────────────────────────────────────────
router.post('/:id/join', authMiddleware, controller.joinChannel);

// ── Member management ────────────────────────────────────────────────────────
router.get('/:id/members',              authMiddleware, channelIdSchema, validate, controller.listMembers);
router.post('/:id/members',             authMiddleware, channelIdSchema, validate, controller.addMembers);
router.delete('/:id/members/:memberId', authMiddleware, channelIdSchema, validate, controller.removeMember);
router.post('/:id/remove-member',       authMiddleware, channelIdSchema, validate, controller.removeMember);
router.post('/:id/promote-member',      authMiddleware, channelIdSchema, validate, controller.promoteMember);
router.post('/:id/demote-member',       authMiddleware, channelIdSchema, validate, controller.demoteMember);

module.exports = router;
