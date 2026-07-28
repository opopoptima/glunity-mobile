'use strict';

const mongoose = require('mongoose');
const { Schema, model, Types } = mongoose;

const reportSchema = new Schema(
  {
    targetUserId: {
      type: Types.ObjectId,
      ref: 'User',
      required: [true, 'Target User ID is required'],
      index: true,
    },
    reporterId: {
      type: Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    reporterName: {
      type: String,
      required: true,
      default: 'Anonyme',
    },
    category: {
      type: String,
      required: true,
      enum: ['Spam', 'Harcèlement', 'Contenu Inapproprié', 'Hate Speech', 'Scam', 'Other'],
      default: 'Other',
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    evidence: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'resolved', 'dismissed', 'escalated'],
      default: 'pending',
      index: true,
    },
    resolverId: {
      type: Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolutionNotes: {
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

const Report = model('Report', reportSchema);
module.exports = Report;
