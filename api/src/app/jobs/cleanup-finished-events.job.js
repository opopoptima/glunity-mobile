"use strict";

const logger = require('../bootstrap/logger.bootstrap');

async function runOnce() {
  try {
    const Event = require('../../database/models/event.model');

    const now = new Date();

    // 1) Mark events that are past as finished (but still published)
    const markRes = await Event.updateMany(
      { startsAt: { $lt: now }, isPublished: true, isFinished: { $ne: true } },
      { $set: { isFinished: true, finishedAt: now } }
    ).exec();
    if (markRes && (markRes.nModified || markRes.modifiedCount)) {
      logger.info('Marked events as finished', { count: markRes.nModified || markRes.modifiedCount });
    }

    // 2) Soft-remove events that were finished more than 7 days ago
    const retentionMs = 7 * 24 * 60 * 60 * 1000;
    const cutoff = new Date(now.getTime() - retentionMs);
    const oldEvents = await Event.find({ isFinished: true, finishedAt: { $lte: cutoff }, isPublished: true }).lean();
    for (const ev of oldEvents) {
      try {
        await Event.findByIdAndUpdate(ev._id, { $set: { isPublished: false, removedAt: now } });
        logger.info('Soft-removed finished event', { eventId: String(ev._id) });
      } catch (err) {
        logger.warn('Failed to remove finished event', { eventId: String(ev._id), err: err.message });
      }
    }
  } catch (err) {
    logger.error('cleanup-finished-events job failed', { err: err.message });
  }
}

// Run immediately and then every hour
runOnce();
setInterval(runOnce, 60 * 60 * 1000);

module.exports = { runOnce };
