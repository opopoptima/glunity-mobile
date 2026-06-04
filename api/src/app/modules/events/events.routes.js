'use strict';

const { Router } = require('express');
const controller = require('./events.controller');
const validate = require('../../common/middleware/validation.middleware');
const authMiddleware = require('../../common/middleware/auth.middleware');
const { listEventsSchema, createEventSchema, getEventSchema } = require('./events.schema');

const authorize = require('../../common/middleware/role.middleware');

const router = Router();

router.get('/', listEventsSchema, validate, controller.list);
router.get('/:id', getEventSchema, validate, controller.getOne);
router.post('/', authMiddleware, createEventSchema, validate, controller.create);
router.post('/:id/join', authMiddleware, getEventSchema, validate, controller.join);
router.post('/:id/leave', authMiddleware, getEventSchema, validate, controller.leave);
router.post('/:id/cancel', authMiddleware, getEventSchema, validate, controller.cancel);
// Remove (soft-delete) — only pro_commerce or admin OR organizer (checked in service)
router.post('/:id/remove', authMiddleware, authorize('pro_commerce', 'admin'), getEventSchema, validate, controller.remove);

module.exports = router;
