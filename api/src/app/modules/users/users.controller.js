'use strict';

const User         = require('../../../database/models/user.model');
const asyncHandler = require('../../common/utils/async-handler');
const AppError     = require('../../common/errors/app-error');
const { hashPassword, verifyPassword } = require('../../common/utils/password');

// Whitelist of fields users are allowed to update
const ALLOWED_FIELDS = ['fullName', 'phone', 'bio', 'language', 'darkMode', 'pushToken'];

const usersController = {
  /** PATCH /api/users/me — update the authenticated user's profile */
  updateMe: asyncHandler(async (req, res) => {
    const updates = {};
    ALLOWED_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (req.body.avatarUrl !== undefined) {
      updates.avatar = { url: req.body.avatarUrl };
    }

    if (Object.keys(updates).length === 0) {
      throw AppError.badRequest('No valid fields provided to update', 'NO_FIELDS');
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true },
    );

    if (!user) throw AppError.notFound('User');

    res.status(200).json({
      success: true,
      data: { user: user.toPublic() },
    });
  }),

  /** POST /api/users/change-password — update user password */
  changePassword: asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      throw AppError.badRequest('Both current and new password are required', 'MISSING_FIELDS');
    }

    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!user) throw AppError.notFound('User');

    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      throw AppError.badRequest('Invalid current password', 'INVALID_PASSWORD');
    }

    if (newPassword.length < 6) {
      throw AppError.badRequest('New password must be at least 6 characters long', 'PASSWORD_TOO_SHORT');
    }

    user.passwordHash = await hashPassword(newPassword);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  }),
};

module.exports = usersController;
