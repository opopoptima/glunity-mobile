import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../../shared/context/theme.context';
import { Colors, Font, Radius, Spacing } from '../../../../shared/utils/theme';
import { formatDateUserFriendly } from '../../../../shared/utils/date.utils';
import { useLanguage } from '../../../../shared/context/language.context';
import { StatusBadge } from './StatusBadge';
import FastImage from '../../../../shared/components/FastImage';

export interface ModerationEventItem {
  id: string;
  title: string;
  type: 'event';
  authorOrSeller: string;
  date: string;
  eventDate?: string;
  location?: string;
  coverImage?: string;
  category?: string;
  format?: 'presentiel' | 'online' | 'in-person';
  price?: number;
  currency?: string;
  description?: string;
  status?: string;
  ownerName?: string;
  ownerAvatar?: string;
}

interface EventCardProps {
  item: ModerationEventItem;
  onPress: () => void;
}

export function EventCard({ item, onPress }: EventCardProps) {
  const { theme: T, isDark } = useTheme();
  const { t, isRTL } = useLanguage();

  const placeholderImage = 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=400';
  const coverUrl = item.coverImage || placeholderImage;

  // Format event date/time
  const getFormattedEventDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const dt = new Date(dateStr);
      return dt.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const isFree = !item.price || item.price === 0;
  const isOnline = item.format === 'online';

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#1C1C1E' : Colors.white,
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          shadowColor: '#000',
        },
      ]}
    >
      {/* Event Cover Image */}
      <View style={styles.imageContainer}>
        <FastImage
          source={{ uri: coverUrl }}
          style={styles.coverImage}
          contentFit="cover"
          cachePolicy="disk"
        />
        {/* Status Badge overlay */}
        <View style={styles.statusOverlay}>
          <StatusBadge status={item.status || 'pending'} />
        </View>
      </View>

      {/* Card Content */}
      <View style={styles.content}>
        {/* Category & Tags Row */}
        <View style={[styles.badgeRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.categoryBadge, { backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6' }]}>
            <Text style={[styles.categoryText, { color: T.text }]}>
              {item.category ? String(item.category).toUpperCase() : 'EVENT'}
            </Text>
          </View>
          
          {/* Cost Badge */}
          <View style={[styles.pillBadge, { backgroundColor: isFree ? 'rgba(139,195,74,0.15)' : 'rgba(59,130,246,0.15)' }]}>
            <Text style={[styles.pillText, { color: isFree ? Colors.green : '#3B82F6' }]}>
              {isFree ? t('event.free', 'Gratuit') : `${item.price} ${item.currency || 'TND'}`}
            </Text>
          </View>

          {/* Online/Presentiel Badge */}
          <View style={[styles.pillBadge, { backgroundColor: isOnline ? 'rgba(236,72,153,0.15)' : 'rgba(168,85,247,0.15)' }]}>
            <Text style={[styles.pillText, { color: isOnline ? '#EC4899' : '#A855F7' }]}>
              {isOnline ? t('event.online', 'Online') : t('event.presentiel', 'Présentiel')}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: T.text }]} numberOfLines={2}>
          {item.title}
        </Text>

        {/* Event Date & Time */}
        <View style={[styles.metaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Feather name="calendar" size={14} color="#3B82F6" />
          <Text style={[styles.metaText, { color: T.textSub, marginLeft: isRTL ? 0 : 6, marginRight: isRTL ? 6 : 0 }]}>
            {getFormattedEventDate(item.eventDate)}
          </Text>
        </View>

        {/* Event Location */}
        <View style={[styles.metaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Feather name="map-pin" size={14} color={Colors.primaryRed} />
          <Text
            style={[styles.metaText, { color: T.textSub, marginLeft: isRTL ? 0 : 6, marginRight: isRTL ? 6 : 0 }]}
            numberOfLines={1}
          >
            {isOnline ? t('event.online_location', 'Online / Virtuel') : (item.location || t('event.no_location', 'Lieu non spécifié'))}
          </Text>
        </View>

        {/* Description Preview */}
        {item.description ? (
          <Text style={[styles.description, { color: T.textMuted }]} numberOfLines={3}>
            {item.description}
          </Text>
        ) : null}

        {/* Separator */}
        <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />

        {/* Owner Info and Submission Date */}
        <View style={[styles.footer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.ownerWrap, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {item.ownerAvatar ? (
              <FastImage source={{ uri: item.ownerAvatar }} style={styles.ownerAvatar} contentFit="cover" cachePolicy="disk" />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}>
                <Feather name="user" size={12} color={T.textMuted} />
              </View>
            )}
            <View style={[styles.ownerNames, { alignItems: isRTL ? 'flex-end' : 'flex-start', marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }]}>
              <Text style={[styles.ownerName, { color: T.text }]} numberOfLines={1}>
                {item.ownerName || item.authorOrSeller}
              </Text>
              <Text style={[styles.submitDate, { color: T.textMuted }]}>
                {t('event.submitted', 'Soumis le')} {formatDateUserFriendly(item.date)}
              </Text>
            </View>
          </View>
          
          <View style={styles.detailsIndicator}>
            <Feather name={isRTL ? 'chevron-left' : 'chevron-right'} size={18} color={T.textMuted} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  imageContainer: {
    height: 150,
    width: '100%',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  statusOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  content: {
    padding: Spacing.md,
  },
  badgeRow: {
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  pillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  title: {
    fontFamily: Font.family,
    fontWeight: Font.bold,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: Spacing.xs,
  },
  metaRow: {
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  metaText: {
    fontFamily: Font.family,
    fontWeight: Font.regular,
    fontSize: 13,
  },
  description: {
    fontFamily: Font.family,
    fontWeight: Font.regular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  separator: {
    height: 1,
    marginVertical: Spacing.sm,
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ownerWrap: {
    alignItems: 'center',
    flex: 1,
  },
  ownerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ownerNames: {
    flex: 1,
  },
  ownerName: {
    fontFamily: Font.family,
    fontWeight: Font.semibold,
    fontSize: 13,
  },
  submitDate: {
    fontSize: 11,
    marginTop: 1,
  },
  detailsIndicator: {
    paddingLeft: Spacing.sm,
  },
});
