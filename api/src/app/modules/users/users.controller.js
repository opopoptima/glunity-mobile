'use strict';

const User         = require('../../../database/models/user.model');
const asyncHandler = require('../../common/utils/async-handler');
const AppError     = require('../../common/errors/app-error');

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
};

module.exports = usersController;
