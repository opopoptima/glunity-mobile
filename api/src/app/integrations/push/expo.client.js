'use strict';

const https = require('https');
const logger = require('../../bootstrap/logger.bootstrap');

/**
 * Sends a push notification to an Expo Push Token.
 *
 * @param {string} to      - Expo push token (e.g. ExponentPushToken[xxx])
 * @param {string} title   - Notification title
 * @param {string} body    - Notification body
 * @param {object} [data]  - Optional metadata payload
 */
async function sendPushNotification(to, title, body, data = {}) {
  if (!to || !to.startsWith('ExponentPushToken')) {
    logger.warn('[ExpoPush] Invalid or missing push token', { to });
    return null;
  }

  const payload = JSON.stringify({
    to,
    title,
    body,
    sound: 'default',
    data,
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'exp.host',
      path: '/--/api/v2/push/send',
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(responseBody);
          logger.info('[ExpoPush] Push notification response received', { to, status: res.statusCode, json });
          resolve(json);
        } catch (e) {
          logger.error('[ExpoPush] Failed to parse response JSON', { to, responseBody });
          resolve(null);
        }
      });
    });

    req.on('error', (err) => {
      logger.error('[ExpoPush] https request error', { to, err: err.message });
      resolve(null);
    });

    req.write(payload);
    req.end();
  });
}

module.exports = {
  sendPushNotification,
};
