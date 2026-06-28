'use strict';

const mongoose = require('mongoose');
const { Schema, model, Types } = mongoose;

const reelCommentSchema = new Schema(
	{
		reelId: { type: Types.ObjectId, ref: 'Reel', required: true, index: true },
		userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
		text: { type: String, required: true, trim: true, maxlength: 1000 },
		edited: { type: Boolean, default: false },
		likeCount: { type: Number, default: 0 },
		likedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
		replyCount: { type: Number, default: 0 },
		parentCommentId: { type: Schema.Types.ObjectId, ref: 'ReelComment', default: null, index: true },
	},
	{
		timestamps: true,
		versionKey: false,
	}
);

// Index to query comments for a reel, sorted by creation date (newest first)
reelCommentSchema.index({ reelId: 1, createdAt: -1 });

const ReelComment = model('ReelComment', reelCommentSchema);
module.exports = ReelComment;
