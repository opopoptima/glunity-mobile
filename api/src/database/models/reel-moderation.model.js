'use strict';

const mongoose = require('mongoose');
const { Schema, model, Types } = mongoose;

const reelModerationSchema = new Schema(
	{
		reelId: { type: Types.ObjectId, ref: 'Reel', required: true, index: true },
		reviewStatus: {
			type: String,
			enum: ['unreviewed', 'reviewed', 'removed'],
			default: 'unreviewed',
			index: true,
		},
	},
	{
		timestamps: true,
		versionKey: false,
	}
);

// Optimize retrieval of unreviewed reels chronologically
reelModerationSchema.index({ reviewStatus: 1, createdAt: -1 });

const ReelModeration = model('ReelModeration', reelModerationSchema);
module.exports = ReelModeration;
