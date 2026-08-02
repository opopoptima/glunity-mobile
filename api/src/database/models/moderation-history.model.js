'use strict';

const mongoose = require('mongoose');
const { Schema, model, Types } = mongoose;

const changedFieldSchema = new Schema({
  field: { type: String, required: true },
  previousValue: Schema.Types.Mixed,
  newValue: Schema.Types.Mixed,
}, { _id: false });

const moderationHistorySchema = new Schema({
  entityType: { type: String, enum: ['product', 'recipe', 'seller_verification', 'seller_badge', 'shop'], required: true, index: true },
  entityId: { type: Types.ObjectId, required: true, index: true },
  entityTitle: { type: String, default: '' },
  action: { type: String, required: true, index: true },
  previousStatus: { type: String, default: '' },
  newStatus: { type: String, default: '' },
  adminId: { type: Types.ObjectId, ref: 'User', default: null, index: true },
  adminName: { type: String, default: '' },
  ownerId: { type: Types.ObjectId, ref: 'User', default: null, index: true },
  ownerName: { type: String, default: '' },
  shopId: { type: Types.ObjectId, ref: 'Establishment', default: null },
  shopName: { type: String, default: '' },
  reason: { type: String, default: '' },
  notes: { type: String, default: '' },
  changedFields: { type: [changedFieldSchema], default: [] },
  snapshot: { type: Schema.Types.Mixed, default: null },
}, { timestamps: { createdAt: true, updatedAt: false }, versionKey: false });

moderationHistorySchema.index({ createdAt: -1 });
moderationHistorySchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

module.exports = model('ModerationHistory', moderationHistorySchema);
