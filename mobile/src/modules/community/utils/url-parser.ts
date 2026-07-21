/**
 * URL Parser — detects supported social media URLs inside free-form text.
 *
 * Strategy: broad hostname matching on the mobile side (detect anything from
 * a supported domain), and let the backend controller apply strict validation.
 * This avoids the fragility of trying to enumerate every possible path shape.
 *
 * Supported platforms:
 *   instagram  — any instagram.com URL
 *   facebook   — facebook.com/* and fb.watch/* short links
 *   tiktok     — tiktok.com/* and vm./vt. short links
 *   youtube    — youtube.com/watch, /shorts, youtu.be
 */

export type SupportedPlatform =
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'youtube'
  | 'youtube_shorts';

export interface DetectedLink {
  url: string;
  platform: SupportedPlatform;
}

// ── Generic URL extractor ─────────────────────────────────────────────────────
// Grabs the first https URL from a string
const GENERIC_URL_RE = /https?:\/\/[^\s<>"']+/g;

// ── Platform hostname/path matchers ──────────────────────────────────────────
const MATCHERS: Array<{ test: (url: string) => boolean; platform: SupportedPlatform }> = [
  // YouTube Shorts — must come before generic YouTube check
  {
    test: (u) => /youtube\.com\/shorts\//i.test(u),
    platform: 'youtube_shorts',
  },
  // YouTube
  {
    test: (u) =>
      /(?:youtube\.com\/watch|youtu\.be\/|m\.youtube\.com\/watch)/i.test(u),
    platform: 'youtube',
  },
  // Instagram — any instagram.com path (reels, posts, tv, stories…)
  {
    test: (u) => /(?:www\.)?instagram\.com\//i.test(u),
    platform: 'instagram',
  },
  // Facebook — facebook.com AND fb.watch short links
  {
    test: (u) =>
      /(?:www\.)?facebook\.com\//i.test(u) ||
      /fb\.watch\//i.test(u),
    platform: 'facebook',
  },
  // TikTok — full URLs and vm./vt. short links
  {
    test: (u) =>
      /(?:www\.)?tiktok\.com\//i.test(u) ||
      /(?:vm|vt)\.tiktok\.com\//i.test(u),
    platform: 'tiktok',
  },
];

/**
 * Extracts the first supported social media URL from arbitrary text.
 * Returns null when no supported link is found.
 */
export function extractSupportedUrl(text: string): DetectedLink | null {
  if (!text || text.length < 10) return null;

  // Find all https URLs in the text
  const matches = text.match(GENERIC_URL_RE);
  if (!matches) return null;

  for (const rawUrl of matches) {
    // Trim trailing punctuation (., !, ), etc.)
    const url = rawUrl.replace(/[.,!?;:'")\]>]+$/, '');

    for (const { test, platform } of MATCHERS) {
      if (test(url)) {
        return { url, platform };
      }
    }
  }

  return null;
}

/** Platform display name map used by the UI */
export const PLATFORM_DISPLAY: Record<SupportedPlatform, string> = {
  instagram:      'Instagram',
  facebook:       'Facebook',
  tiktok:         'TikTok',
  youtube:        'YouTube',
  youtube_shorts: 'YouTube Shorts',
};

/** Platform brand colors */
export const PLATFORM_COLOR: Record<SupportedPlatform, string> = {
  instagram:      '#E1306C',
  facebook:       '#1877F2',
  tiktok:         '#010101',
  youtube:        '#FF0000',
  youtube_shorts: '#FF0000',
};
