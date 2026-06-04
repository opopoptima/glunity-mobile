"use strict";

const logger = require('../bootstrap/logger.bootstrap');

// This job scans for events starting ~24 hours from now and creates reminder notifications
async function runOnce() {
	try {
		const Event = require('../../database/models/event.model');
		const Notification = require('../../database/models/notification.model');

		const now = new Date();
		const target = new Date(now.getTime() + 24 * 60 * 60 * 1000);
		// 15 minute window around the exact 24h mark to be resilient
		const windowStart = new Date(target.getTime() - 15 * 60 * 1000);
		const windowEnd = new Date(target.getTime() + 15 * 60 * 1000);

		const events = await Event.find({
			startsAt: { $gte: windowStart, $lte: windowEnd },
			isPublished: true,
		}).lean();

		for (const ev of events) {
			const attendees = Array.isArray(ev.attendees) ? ev.attendees : [];
			for (const attendeeId of attendees) {
				// Avoid duplicate reminders for the same event+user
				const existing = await Notification.findOne({
					userId: attendeeId,
					'metadata.eventId': ev._id,
					'metadata.kind': 'reminder',
				}).lean();

				if (existing) continue;

				const title = `Reminder: ${ev.title}`;
				const body = `Don't forget: ${ev.title} is happening tomorrow.`;

				try {
					await Notification.create({
						userId: attendeeId,
						title,
						body,
						type: 'event',
						metadata: { eventId: ev._id, kind: 'reminder' },
					});
				} catch (err) {
					logger.warn('Failed to create reminder notification', { err: err.message });
				}
			}
		}
	} catch (err) {
		logger.error('notifications-dispatch job failed', { err: err.message });
	}
}

// Run immediately and then every 15 minutes
runOnce();
setInterval(runOnce, 15 * 60 * 1000);

module.exports = { runOnce };
