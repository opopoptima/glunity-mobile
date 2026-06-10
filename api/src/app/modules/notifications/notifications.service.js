'use strict';

const repository = require('./notifications.repository');

const notificationsService = {
	async list(userId, { limit = 50, skip = 0 } = {}) {
		const items = await repository.findManyByUser(userId, { limit, skip });
		return { items };
	},

	async markAsRead(id, userId) {
		const updated = await repository.markAsRead(id, userId);
		if (!updated) {
			const error = new Error('Notification not found');
			error.status = 404;
			throw error;
		}
		return updated;
	},

	async markAllAsRead(userId) {
		await repository.markAllAsRead(userId);
		return { success: true };
	},

	async delete(id, userId) {
		const doc = await repository.delete(id, userId);
		if (!doc) {
			const error = new Error('Notification not found');
			error.status = 404;
			throw error;
		}
		return doc;
	},

	async deleteAll(userId) {
		await repository.deleteAll(userId);
		return { success: true };
	},

	async create(payload) {
		const doc = await repository.create(payload);
		// Dispatch push notification in the background
		(async () => {
			try {
				const User = require('../../../database/models/user.model');
				const user = await User.findById(payload.userId, 'pushToken pushEnabled').lean();
				if (user && user.pushToken && user.pushEnabled !== false) {
					const expoClient = require('../../integrations/push/expo.client');
					await expoClient.sendPushNotification(
						user.pushToken,
						payload.title,
						payload.body,
						payload.metadata || {}
					);
				}
			} catch (err) {
				console.error('Failed to send push notification background event:', err);
			}
		})();
		return doc;
	},
};

module.exports = notificationsService;
