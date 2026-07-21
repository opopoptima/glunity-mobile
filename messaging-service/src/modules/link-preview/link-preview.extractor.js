'use strict';

/**
 * Link Preview Metadata Extractor
 *
 * Fetches the HTML of a public social media URL and extracts rich metadata
 * from Open Graph / Twitter Card / JSON-LD / oEmbed tags.
 *
 * Supported platforms:
 *   - Instagram Reels
 *   - Facebook Reels
 *   - TikTok Videos
 *   - YouTube Videos & Shorts
 *
 * Security:
 *   - Hard 6-second fetch timeout — never hangs
 *   - Only accepts http/https schemes
 *   - Never follows more than 3 redirects
 *   - Does not execute JavaScript (pure HTML parsing)
 *   - SSRF protection: rejects private IP ranges
 */

const fetch = require('node-fetch');

// ── Constants ──────────────────────────────────────────────────────────────────
const FETCH_TIMEOUT_MS = 6000;
const MAX_BODY_BYTES   = 400_000; // 400 KB — enough for any <head> section

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// ── SSRF Guard ─────────────────────────────────────────────────────────────────
const PRIVATE_IP_REGEX = /^(10\.|172\.(1[6-9]|2\d|3[0-1])\.|192\.168\.|127\.|::1|localhost)/i;

function guardSsrf(rawUrl) {
  let parsed;
  try { parsed = new URL(rawUrl); } catch { throw new Error('Invalid URL'); }
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Unsupported protocol');
  if (PRIVATE_IP_REGEX.test(parsed.hostname)) throw new Error('Private host not allowed');
}

// ── Platform Detection ──────────────────────────────────────────────
// Strategy: broad hostname matching — detect ALL URLs from supported domains.
// Specific path validation happens later (or is skipped for Meta platforms
// where we always return a branded fallback regardless of path).
function detectPlatform(url) {
  // Instagram — any instagram.com URL
  if (/(?:www\.)?instagram\.com\//i.test(url))                return 'instagram';
  // Facebook — facebook.com/* and fb.watch/* short links
  if (/(?:www\.)?facebook\.com\//i.test(url))                  return 'facebook';
  if (/fb\.watch\//i.test(url))                                return 'facebook';
  // TikTok: full URL or vm./vt. short links
  if (/(?:www\.)?tiktok\.com\//i.test(url))                    return 'tiktok';
  if (/(?:vm|vt)\.tiktok\.com\//i.test(url))                   return 'tiktok';
  // YouTube Shorts — must come before generic YouTube check
  if (/youtube\.com\/shorts\//i.test(url))                     return 'youtube_shorts';
  // YouTube
  if (/youtu\.be\//i.test(url))                                return 'youtube';
  if (/(?:www\.|m\.)?youtube\.com\/watch/i.test(url))          return 'youtube';
  return 'unknown';
}


// ── YouTube ID extraction ──────────────────────────────────────────────────────
function extractYoutubeId(url) {
  const patterns = [
    /youtu\.be\/([^?&#/]+)/,
    /youtube\.com\/watch\?.*v=([^&#/]+)/,
    /youtube\.com\/shorts\/([^?&#/]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

// ── oEmbed fetch for YouTube (no API key required) ───────────────────────────
async function fetchYoutubeOembed(url) {
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(oembedUrl, {
      signal: ctrl.signal,
      headers: { 'User-Agent': BROWSER_UA },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ── oEmbed fetch for Facebook (videos & posts) ────────────────
// Facebook oEmbed works for public videos/reels without an access token.
// Posts and share links may still fail — we fall back gracefully.
async function fetchFacebookOembed(url) {
  // Try video oEmbed first, then post oEmbed
  const endpoints = [
    `https://www.facebook.com/plugins/video/oembed.json/?url=${encodeURIComponent(url)}`,
    `https://www.facebook.com/plugins/post/oembed.json/?url=${encodeURIComponent(url)}`,
  ];
  for (const endpoint of endpoints) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(endpoint, {
        signal: ctrl.signal,
        headers: { 'User-Agent': BROWSER_UA },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && (data.title || data.author_name)) return data;
      }
    } catch {
      // try next endpoint
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

// ── oEmbed fetch for Instagram ────────────────────────────
async function fetchInstagramOembed(url) {
  const endpoint = `https://www.instagram.com/api/v1/oembed/?url=${encodeURIComponent(url)}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(endpoint, {
      signal: ctrl.signal,
      headers: { 'User-Agent': BROWSER_UA },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data && (data.title || data.author_name) ? data : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ── HTML Meta Tag Parser ───────────────────────────────────────────────────────
function parseMeta(html) {
  const meta = {};

  // Helper: get first regex match group
  const grab = (pattern) => { const m = html.match(pattern); return m ? m[1]?.trim() : null; };

  // Open Graph
  meta.ogTitle       = grab(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
                    || grab(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
  meta.ogDescription = grab(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)
                    || grab(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i);
  meta.ogImage       = grab(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
                    || grab(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  meta.ogSiteName    = grab(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i)
                    || grab(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:site_name["']/i);
  meta.ogVideo       = grab(/<meta[^>]+property=["']og:video:url["'][^>]+content=["']([^"']+)["']/i)
                    || grab(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:video:url["']/i);

  // Twitter Card
  meta.twTitle = grab(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i)
              || grab(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:title["']/i);
  meta.twImage = grab(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
              || grab(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
  meta.twDesc  = grab(/<meta[^>]+name=["']twitter:description["'][^>]+content=["']([^"']+)["']/i)
              || grab(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:description["']/i);
  meta.twCreator = grab(/<meta[^>]+name=["']twitter:creator["'][^>]+content=["']([^"']+)["']/i)
                || grab(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:creator["']/i);

  // Standard
  meta.description = grab(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
                  || grab(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  meta.title = grab(/<title[^>]*>([^<]+)<\/title>/i);

  // Favicon — prefer apple-touch-icon then shortcut then icon
  meta.favicon = grab(/<link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]+href=["']([^"']+)["']/i)
              || grab(/<link[^>]+rel=["'][^"']*shortcut icon[^"']*["'][^>]+href=["']([^"']+)["']/i)
              || grab(/<link[^>]+rel=["']icon["'][^>]+href=["']([^"']+)["']/i);

  return meta;
}

// ── Resolve relative favicon to absolute ──────────────────────────────────────
function resolveUrl(base, relative) {
  if (!relative) return null;
  if (relative.startsWith('http')) return relative;
  try {
    return new URL(relative, base).href;
  } catch {
    return null;
  }
}

// ── Platform meta ──────────────────────────────────────────────────────────────
const PLATFORM_META = {
  instagram:      { siteName: 'Instagram',      favicon: 'https://www.instagram.com/favicon.ico' },
  facebook:       { siteName: 'Facebook',       favicon: 'https://www.facebook.com/favicon.ico' },
  tiktok:         { siteName: 'TikTok',         favicon: 'https://www.tiktok.com/favicon.ico' },
  youtube:        { siteName: 'YouTube',        favicon: 'https://www.youtube.com/favicon.ico' },
  youtube_shorts: { siteName: 'YouTube Shorts', favicon: 'https://www.youtube.com/favicon.ico' },
};

// ── Main extractor ─────────────────────────────────────────────────────────────
async function extractLinkPreview(rawUrl) {
  guardSsrf(rawUrl);

  const platform = detectPlatform(rawUrl);

  // ── YouTube: use oEmbed for reliable data ──────────────────────────────────
  if (platform === 'youtube' || platform === 'youtube_shorts') {
    const ytId = extractYoutubeId(rawUrl);
    const oembed = await fetchYoutubeOembed(rawUrl);

    return {
      title:       oembed?.title       || 'YouTube Video',
      description: null,
      thumbnail:   ytId
        ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
        : (oembed?.thumbnail_url || null),
      siteName:    PLATFORM_META[platform].siteName,
      favicon:     PLATFORM_META[platform].favicon,
      author:      oembed?.author_name || null,
      duration:    null,
      url:         rawUrl,
      type:        platform,
    };
  }

  // ── Facebook: oEmbed → fallback branded card ────────────────────────
  // Facebook blocks server-side HTML scraping (HTTP 400/403). oEmbed is the
  // only reliable unauthenticated approach. If that also fails (e.g. /share/p/
  // posts), we return a branded fallback so the UI always shows something.
  if (platform === 'facebook') {
    const oembed = await fetchFacebookOembed(rawUrl);
    return {
      title:       oembed?.title       || 'Facebook',
      description: oembed?.html        ? null : 'View on Facebook',
      thumbnail:   oembed?.thumbnail_url || null,
      siteName:    'Facebook',
      favicon:     PLATFORM_META.facebook.favicon,
      author:      oembed?.author_name || null,
      duration:    null,
      url:         rawUrl,
      type:        'facebook',
    };
  }

  // ── Instagram: oEmbed → fallback branded card ──────────────────────
  // Same situation as Facebook — Meta blocks scraping without auth.
  if (platform === 'instagram') {
    const oembed = await fetchInstagramOembed(rawUrl);
    return {
      title:       oembed?.title       || 'Instagram',
      description: oembed?.title       ? null : 'View on Instagram',
      thumbnail:   oembed?.thumbnail_url || null,
      siteName:    'Instagram',
      favicon:     PLATFORM_META.instagram.favicon,
      author:      oembed?.author_name || null,
      duration:    null,
      url:         rawUrl,
      type:        'instagram',
    };
  }

  // ── TikTok & others: scrape HTML ────────────────────────────────
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);

  let html = '';
  try {
    const res = await fetch(rawUrl, {
      signal: ctrl.signal,
      redirect: 'follow',
      follow: 3,
      headers: {
        'User-Agent': BROWSER_UA,
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!res.ok) {
      // Return branded fallback instead of throwing
      const plat = PLATFORM_META[platform] || {};
      return {
        title: plat.siteName || 'Link',
        description: 'View on ' + (plat.siteName || 'external site'),
        thumbnail: null,
        siteName: plat.siteName || null,
        favicon: plat.favicon || null,
        author: null,
        duration: null,
        url: rawUrl,
        type: platform,
      };
    }

    // Stream only the first N bytes to avoid downloading the full page
    const chunks = [];
    let totalBytes = 0;
    for await (const chunk of res.body) {
      chunks.push(chunk);
      totalBytes += chunk.length;
      if (totalBytes >= MAX_BODY_BYTES) break;
    }
    html = Buffer.concat(chunks).toString('utf-8');
  } finally {
    clearTimeout(timer);
  }

  const meta = parseMeta(html);
  const plat = PLATFORM_META[platform] || {};

  const title       = meta.ogTitle || meta.twTitle || meta.title || null;
  const description = meta.ogDescription || meta.twDesc || meta.description || null;
  const thumbnail   = meta.ogImage || meta.twImage || null;
  const siteName    = meta.ogSiteName || plat.siteName || null;
  const favicon     = resolveUrl(rawUrl, meta.favicon) || plat.favicon || null;
  const author      = meta.twCreator || null;

  return {
    title,
    description,
    thumbnail,
    siteName,
    favicon,
    author,
    duration: null,
    url: rawUrl,
    type: platform,
  };
}

module.exports = { extractLinkPreview, detectPlatform };
