'use strict';

const { extractLinkPreview } = require('./link-preview.extractor');

// Supported hostnames (exact or suffix match)
const ALLOWED_HOSTS = [
  'instagram.com',
  'www.instagram.com',
  'facebook.com',
  'www.facebook.com',
  'fb.watch',
  'tiktok.com',
  'www.tiktok.com',
  'vm.tiktok.com',
  'vt.tiktok.com',
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'm.youtube.com',
];


// Extra URL-level patterns for platforms with non-obvious domains
const ALLOWED_URL_PATTERNS = [
  /^https?:\/\/fb\.watch\//i,
  /^https?:\/\/(?:vm|vt)\.tiktok\.com\//i,
];

function isAllowedHost(rawUrl) {
  try {
    const { hostname } = new URL(rawUrl);
    if (ALLOWED_HOSTS.some(h => hostname === h || hostname.endsWith(`.${h}`))) return true;
    return ALLOWED_URL_PATTERNS.some(p => p.test(rawUrl));
  } catch {
    return false;
  }
}

/**
 * POST /api/link-preview
 * Body: { url: string }
 * Returns: LinkPreviewData
 */
async function getLinkPreview(req, res, next) {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'url is required and must be a string',
      });
    }

    const trimmed = url.trim();

    // Validate URL shape
    let parsed;
    try { parsed = new URL(trimmed); } catch {
      return res.status(400).json({
        success: false,
        code: 'INVALID_URL',
        message: 'The provided value is not a valid URL',
      });
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return res.status(400).json({
        success: false,
        code: 'UNSUPPORTED_PROTOCOL',
        message: 'Only http and https URLs are supported',
      });
    }

    if (!isAllowedHost(trimmed)) {
      return res.status(422).json({
        success: false,
        code: 'UNSUPPORTED_PLATFORM',
        message: 'This platform is not supported for link preview',
      });
    }

    const preview = await extractLinkPreview(trimmed);

    return res.status(200).json({
      success: true,
      data: preview,
    });
  } catch (err) {
    // Surface fetch timeouts / SSRF rejections as 422
    if (err.name === 'AbortError' || err.message?.includes('timeout')) {
      return res.status(422).json({
        success: false,
        code: 'FETCH_TIMEOUT',
        message: 'The URL took too long to respond',
      });
    }
    next(err);
  }
}

module.exports = { getLinkPreview };
