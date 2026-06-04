'use strict';

const cloudinary = require('cloudinary').v2;
const env = require('../../config/env');

if (env.cloudinary && env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });
} else {
  // leave unconfigured — uploads will fail with a helpful error
}

async function uploadBuffer(buffer, opts = {}) {
  if (!cloudinary.config().cloud_name) {
    throw new Error('Cloudinary not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET');
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(opts, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    stream.end(buffer);
  });
}

module.exports = {
  uploadBuffer,
};
