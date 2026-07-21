/**
 * Link Preview Service
 *
 * Fetches rich metadata for a social media URL from the messaging-service
 * backend endpoint (POST /api/link-preview).
 *
 * Features:
 *   - In-memory cache (avoids duplicate network calls for the same URL)
 *   - In-flight deduplication (concurrent calls to the same URL share one request)
 *   - Typed response
 */

import messagingHttp from '../../../core/network/messaging-http.client';
import type { SupportedPlatform } from '../utils/url-parser';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LinkPreviewData {
  /** Original URL */
  url: string;
  /** Detected platform */
  type: SupportedPlatform | 'unknown';
  /** Video / page title */
  title: string | null;
  /** Short description or caption */
  description: string | null;
  /** High-res thumbnail image URL */
  thumbnail: string | null;
  /** e.g. "YouTube", "Instagram" */
  siteName: string | null;
  /** Creator handle or channel name */
  author: string | null;
  /** Video duration string, e.g. "3:45" */
  duration: string | null;
  /** Platform favicon URL */
  favicon: string | null;
}

// ── Cache ─────────────────────────────────────────────────────────────────────

/** Resolved previews — keyed by URL */
const resolvedCache = new Map<string, LinkPreviewData>();

/** In-flight requests — prevents duplicate concurrent fetches */
const inflightMap = new Map<string, Promise<LinkPreviewData>>();

// ── Fetch ─────────────────────────────────────────────────────────────────────

/**
 * Fetch metadata for a URL.
 * Returns cached data instantly if available.
 * Reuses an in-flight request if the same URL is already being fetched.
 */
export async function fetchLinkPreview(url: string): Promise<LinkPreviewData> {
  const cacheKey = url.toLowerCase().trim();

  // Cache hit
  if (resolvedCache.has(cacheKey)) {
    return resolvedCache.get(cacheKey)!;
  }

  // In-flight deduplication
  if (inflightMap.has(cacheKey)) {
    return inflightMap.get(cacheKey)!;
  }

  const request = (async (): Promise<LinkPreviewData> => {
    try {
      const response = await messagingHttp.post<{ success: boolean; data: LinkPreviewData }>(
        '/api/link-preview',
        { url },
        { timeout: 10_000 },
      );

      const preview = response.data.data;
      resolvedCache.set(cacheKey, preview);
      return preview;
    } finally {
      inflightMap.delete(cacheKey);
    }
  })();

  inflightMap.set(cacheKey, request);
  return request;
}

/**
 * Evict a specific URL from the cache (e.g. to force a refresh).
 */
export function evictPreviewCache(url: string): void {
  resolvedCache.delete(url.toLowerCase().trim());
}

/**
 * Clear the entire in-memory preview cache.
 */
export function clearPreviewCache(): void {
  resolvedCache.clear();
  inflightMap.clear();
}
