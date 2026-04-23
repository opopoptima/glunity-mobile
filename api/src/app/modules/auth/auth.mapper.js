'use strict';

/**
 * Maps internal user/tokens to API response shapes.
 * Keeps controllers thin and prevents accidental data leaks.
 */
const authMapper = {
  /**
   * @param {{ user: object, tokens: object }} data
   */
  toAuthResponse({ user, tokens }) {
    return {
      success: true,
      data: {
        user,
        accessToken:  tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn:    tokens.expiresIn,
      },
    };
  },

  toRefreshResponse({ tokens }) {
    return {
      success: true,
      data: {
        accessToken:  tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn:    tokens.expiresIn,
      },
    };
  },

  toMeResponse(user) {
    return {
      success: true,
      data: { user },
    };
  },
};

module.exports = authMapper;
