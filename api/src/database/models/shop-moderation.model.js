'use strict';

const mongoose = require('mongoose');
const { Schema, model, Types } = mongoose;

const changedFieldSchema = new Schema(
  {
    field:    { type: String, required: true },
    oldValue: { type: Schema.Types.Mixed, default: null },
    newValue: { type: Schema.Types.Mixed, default: null },
  },
  { _id: false },
);

const shopModerationSchema = new Schema(
  {
    // Seller who submitted the update
    sellerId:  { type: Types.ObjectId, ref: 'User', required: true, index: true },

    // For embedded storeInfo, shopId equals sellerId; kept for future separate Shop model
    shopId:    { type: Types.ObjectId, ref: 'User', required: true, index: true },

    // Snapshot of the approved data at time of submission
    currentData: { type: Schema.Types.Mixed, default: null },

    // What the seller wants to change
    proposedData: { type: Schema.Types.Mixed, required: true },

    // Structured diff of changed fields
    changedFields: { type: [changedFieldSchema], default: [] },

    moderationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'revision_requested', 'resubmitted'],
      default: 'pending',
      index: true,
    },

    reason:      { type: String, trim: true, default: '' },
    notes:       { type: String, trim: true, default: '' },
    moderatedAt: { type: Date, default: null },
    moderatedBy: { type: Types.ObjectId, ref: 'User', default: null },
    adminName:   { type: String, trim: true, default: '' },
  },
  { timestamps: true, versionKey: false, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

shopModerationSchema.index({ moderationStatus: 1, createdAt: -1 });
shopModerationSchema.index({ sellerId: 1, moderationStatus: 1 });

module.exports = model('ShopModeration', shopModerationSchema);
