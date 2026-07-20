/**
 * LinkPreviewCard — Premium social media link preview component.
 *
 * Displays rich metadata for a detected social media URL in the chat compose
 * area. Supports skeleton loading, fade-in animation, platform branding,
 * thumbnail, dismiss, and open-in-browser actions.
 *
 * Visual states:
 *   1. Loading  → Animated skeleton placeholder
 *   2. Loaded   → Full card with thumbnail, title, author, platform badge
 *   3. Error    → Subtle error chip with retry option
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Animated,
  Linking,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../shared/context/theme.context';
import type { LinkPreviewData } from '../../services/link-preview.service';
import {
  PLATFORM_COLOR,
  PLATFORM_DISPLAY,
  type SupportedPlatform,
} from '../../utils/url-parser';

// ── Props ─────────────────────────────────────────────────────────────────────

interface LinkPreviewCardProps {
  preview: LinkPreviewData | null;
  isLoading: boolean;
  error: string | null;
  detectedUrl: string | null;
  onDismiss: () => void;
}

// ── Skeleton pulse ────────────────────────────────────────────────────────────

function SkeletonBar({
  width,
  height = 12,
  style,
  opacity,
}: {
  width: number | string;
  height?: number;
  style?: object;
  opacity: Animated.Value;
}) {
  const { theme: T } = useTheme();
  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: 6,
          backgroundColor: T.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

// ── Main Card ─────────────────────────────────────────────────────────────────

export default function LinkPreviewCard({
  preview,
  isLoading,
  error,
  detectedUrl,
  onDismiss,
}: LinkPreviewCardProps) {
  const { theme: T, isDark } = useTheme();

  // Fade-in animation for the card content
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Skeleton pulse animation
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (isLoading) {
      fadeAnim.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoading, preview, error]);

  // Don't render at all when there's nothing to show
  if (!isLoading && !preview && !error) return null;

  const platform     = (preview?.type ?? 'unknown') as SupportedPlatform;
  const accentColor  = PLATFORM_COLOR[platform] ?? '#888';
  const platformName = PLATFORM_DISPLAY[platform] ?? preview?.siteName ?? 'Link';

  const cardBg = isDark
    ? 'rgba(255,255,255,0.05)'
    : 'rgba(0,0,0,0.04)';

  // ── Error state ─────────────────────────────────────────────────────────────
  if (error && !isLoading) {
    return (
      <Animated.View style={[styles.wrapper, { opacity: fadeAnim }]}>
        <View
          style={[
            styles.card,
            { backgroundColor: cardBg, borderColor: T.border },
          ]}
        >
          <View style={[styles.accent, { backgroundColor: '#888' }]} />
          <View style={styles.errorBody}>
            <Ionicons name="warning-outline" size={14} color={T.textMuted} />
            <Text style={[styles.errorText, { color: T.textMuted }]}>
              Couldn't load preview
            </Text>
          </View>
          <TouchableOpacity
            onPress={onDismiss}
            style={styles.dismissBtn}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            accessibilityLabel="Dismiss preview"
          >
            <Ionicons name="close" size={16} color={T.textMuted} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.wrapper}>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: T.border }]}>
          <View style={[styles.accent, { backgroundColor: T.border }]} />

          {/* Thumbnail skeleton */}
          <SkeletonBar
            width={72}
            height={72}
            style={{ borderRadius: 8, marginRight: 12 }}
            opacity={pulseAnim}
          />

          {/* Text skeletons */}
          <View style={{ flex: 1, gap: 8, justifyContent: 'center' }}>
            <SkeletonBar width="90%" height={10} opacity={pulseAnim} />
            <SkeletonBar width="70%" height={10} opacity={pulseAnim} />
            <SkeletonBar width="50%" height={8} opacity={pulseAnim} />
          </View>

          {/* Close placeholder */}
          <TouchableOpacity
            onPress={onDismiss}
            style={styles.dismissBtn}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            accessibilityLabel="Dismiss preview"
          >
            <Ionicons name="close" size={16} color={T.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Loaded card ─────────────────────────────────────────────────────────────
  if (!preview) return null;

  const handleOpen = () => {
    const url = preview.url ?? detectedUrl;
    if (url) Linking.openURL(url).catch(() => {});
  };

  return (
    <Animated.View style={[styles.wrapper, { opacity: fadeAnim }]}>
      <View
        style={[
          styles.card,
          { backgroundColor: cardBg, borderColor: T.border },
        ]}
      >
        {/* Left accent bar — platform color */}
        <View style={[styles.accent, { backgroundColor: accentColor }]} />

        {/* Thumbnail */}
        {preview.thumbnail ? (
          <TouchableOpacity onPress={handleOpen} activeOpacity={0.85}>
            <Image
              source={{ uri: preview.thumbnail }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
            {/* Play icon overlay */}
            <View style={styles.playOverlay}>
              <View style={styles.playCircle}>
                <Ionicons name="play" size={12} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={[styles.thumbnailPlaceholder, { backgroundColor: accentColor + '22' }]}>
            <Ionicons name="link" size={22} color={accentColor} />
          </View>
        )}

        {/* Text content */}
        <TouchableOpacity style={styles.textContent} onPress={handleOpen} activeOpacity={0.8}>
          {/* Platform badge row */}
          <View style={styles.badgeRow}>
            {preview.favicon ? (
              <Image
                source={{ uri: preview.favicon }}
                style={styles.favicon}
                resizeMode="contain"
              />
            ) : (
              <View style={[styles.faviconDot, { backgroundColor: accentColor }]} />
            )}
            <Text style={[styles.platformLabel, { color: accentColor }]} numberOfLines={1}>
              {platformName}
            </Text>
          </View>

          {/* Title */}
          {preview.title ? (
            <Text style={[styles.title, { color: T.text }]} numberOfLines={2}>
              {preview.title}
            </Text>
          ) : null}

          {/* Author + duration row */}
          <View style={styles.metaRow}>
            {preview.author ? (
              <Text style={[styles.author, { color: T.textMuted }]} numberOfLines={1}>
                {preview.author.startsWith('@') ? preview.author : `@${preview.author}`}
              </Text>
            ) : null}
            {preview.duration ? (
              <View style={[styles.durationChip, { borderColor: T.border }]}>
                <Ionicons name="time-outline" size={10} color={T.textMuted} />
                <Text style={[styles.durationText, { color: T.textMuted }]}>
                  {preview.duration}
                </Text>
              </View>
            ) : null}
          </View>
        </TouchableOpacity>

        {/* Dismiss button */}
        <TouchableOpacity
          onPress={onDismiss}
          style={styles.dismissBtn}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          accessibilityLabel="Dismiss preview"
        >
          <Ionicons name="close" size={16} color={T.textMuted} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 8,
    marginBottom: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 76,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 2,
      },
    }),
  },
  accent: {
    width: 4,
    alignSelf: 'stretch',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 0,
    marginHorizontal: 10,
  },
  thumbnailPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 10,
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 2,
  },
  textContent: {
    flex: 1,
    paddingVertical: 10,
    paddingRight: 4,
    gap: 3,
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 4,
  },
  favicon: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  faviconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  platformLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 17,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  author: {
    fontSize: 11,
    fontWeight: '400',
    flexShrink: 1,
  },
  durationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  durationText: {
    fontSize: 10,
    fontWeight: '500',
  },
  dismissBtn: {
    padding: 10,
    alignSelf: 'flex-start',
  },
  errorBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  errorText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});
