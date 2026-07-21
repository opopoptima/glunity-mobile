/**
 * useLinkPreview hook
 *
 * Watches a text string (typically the chat compose input), detects the first
 * supported social media URL after a 600ms debounce, fetches its metadata,
 * and exposes the result for rendering a PreviewCard.
 *
 * Usage:
 *   const { preview, isLoading, error, dismiss } = useLinkPreview(chat.input);
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { extractSupportedUrl } from '../utils/url-parser';
import { fetchLinkPreview, type LinkPreviewData } from '../services/link-preview.service';

const DEBOUNCE_MS = 600;

export interface UseLinkPreviewReturn {
  /** Fetched metadata — null when loading or no link detected */
  preview: LinkPreviewData | null;
  /** True while the backend request is in-flight */
  isLoading: boolean;
  /** Error message if the fetch failed */
  error: string | null;
  /** The URL currently being previewed */
  detectedUrl: string | null;
  /** Call to manually hide the preview card (persists until the URL changes) */
  dismiss: () => void;
}

export function useLinkPreview(text: string): UseLinkPreviewReturn {
  const [preview, setPreview]         = useState<LinkPreviewData | null>(null);
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [detectedUrl, setDetectedUrl] = useState<string | null>(null);
  const [dismissed, setDismissed]     = useState<string | null>(null); // dismissed URL

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortedRef  = useRef(false);

  // Stable dismiss callback — marks the current URL as dismissed
  const dismiss = useCallback(() => {
    setDismissed(detectedUrl);
    setPreview(null);
    setError(null);
  }, [detectedUrl]);

  useEffect(() => {
    // Clear any pending debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const link = extractSupportedUrl(text);
    const url  = link?.url ?? null;

    // No link in text → clear everything
    if (!url) {
      setPreview(null);
      setIsLoading(false);
      setError(null);
      setDetectedUrl(null);
      setDismissed(null); // reset dismissed when the URL disappears
      return;
    }

    setDetectedUrl(url);

    // User already dismissed this exact URL — don't re-fetch
    if (url === dismissed) return;

    // Debounce the network call
    debounceRef.current = setTimeout(async () => {
      abortedRef.current = false;
      setIsLoading(true);
      setError(null);
      setPreview(null);

      try {
        const data = await fetchLinkPreview(url);
        if (!abortedRef.current) {
          setPreview(data);
        }
      } catch (err: any) {
        if (!abortedRef.current) {
          const msg =
            err?.response?.data?.message ||
            err?.message ||
            'Could not load preview';
          setError(msg);
        }
      } finally {
        if (!abortedRef.current) {
          setIsLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      abortedRef.current = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, dismissed]);

  return { preview, isLoading, error, detectedUrl, dismiss };
}
