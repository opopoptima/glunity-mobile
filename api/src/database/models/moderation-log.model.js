'use strict';

const mongoose = require('mongoose');
const { Schema, model, Types } = mongoose;

const moderationLogSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: ['Warning', 'Temporary Suspension', 'Permanent Ban', 'Role Change', 'Reactivation', 'Content Removal'],
      index: true,
    },
    adminId: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    adminName: {
      type: String,
      required: true,
      default: 'Admin',
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const ModerationLog = model('ModerationLog', moderationLogSchema);
module.exports = ModerationLog;
