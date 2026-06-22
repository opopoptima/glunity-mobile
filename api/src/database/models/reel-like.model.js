'use strict';

const mongoose = require('mongoose');
const { Schema, model, Types } = mongoose;

const reelLikeSchema = new Schema(
	{
		reelId: { type: Types.ObjectId, ref: 'Reel', required: true, index: true },
		userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
	},
	{
		timestamps: true,
		versionKey: false,
	}
);

// Ensure a user can only like a reel once
reelLikeSchema.index({ reelId: 1, userId: 1 }, { unique: true });

const ReelLike = model('ReelLike', reelLikeSchema);
module.exports = ReelLike;
