import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../../shared/context/theme.context';
import { Colors, Font, Radius, Spacing } from '../../../../shared/utils/theme';
import { ModerationItem } from '../../api/admin.api';
import { formatDateUserFriendly } from '../../../../shared/utils/date.utils';
import { useLanguage } from '../../../../shared/context/language.context';

interface ModerationCardProps {
  item: ModerationItem;
  onApprove: () => void;
  onReject: () => void;
  onRevision?: () => void;
  onViewDetail?: () => void;
}

const STATUS_META: Record<string, { color: string; bg: string; label: string }> = {
  pending:            { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  label: 'En attente' },
  approved:           { color: '#22C55E', bg: 'rgba(34,197,94,0.1)',   label: 'Approuvé' },
  rejected:           { color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   label: 'Refusé' },
  revision_requested: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', label: 'Révision' },
};

const TYPE_META: Record<string, { icon: string; color: string }> = {
  product: { icon: 'food-apple',  color: '#8BC34A' },
  event:   { icon: 'calendar',    color: '#3B82F6' },
  recipe:  { icon: 'chef-hat',    color: '#F59E0B' },
  reel:    { icon: 'movie-play',  color: '#EC4899' },
};

export function ModerationCard({ item, onApprove, onReject, onRevision, onViewDetail }: ModerationCardProps) {
  const { theme: T, isDark } = useTheme();
  const { t } = useLanguage();
  const primaryGreen = Colors.green || '#8BC34A';

  const cardBg  = isDark ? '#1C1C1E' : '#FFFFFF';
  const borderC = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';

  const status = STATUS_META[item.moderationStatus] ?? { color: '#6B7280', bg: 'rgba(107,114,128,0.1)', label: item.moderationStatus };
  const typeM  = TYPE_META[item.type]  ?? { icon: 'file-document-outline', color: '#6B7280' };

  const author = item.sellerName || item.authorName || item.authorOrSeller;

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderC }]}>
      {/* ── Top Row ── */}
      <View style={styles.topRow}>
        {/* Type icon */}
        <View style={[styles.typeIcon, { backgroundColor: typeM.color + '18' }]}>
          <MaterialCommunityIcons name={typeM.icon as any} size={18} color={typeM.color} />
        </View>

        {/* Title + Author */}
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: T.text }]} numberOfLines={1}>{item.title}</Text>
          {author ? (
            <View style={styles.authorRow}>
              <Feather name="user" size={11} color={T.textMuted} />
              <Text style={[styles.author, { color: T.textMuted }]}>{author}</Text>
              {item.shopName ? (
                <>
                  <Text style={[styles.dot, { color: T.textMuted }]}>·</Text>
                  <Text style={[styles.shop, { color: T.textMuted }]}>{item.shopName}</Text>
                </>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Status Badge */}
        <View style={[styles.badge, { backgroundColor: status.bg }]}>
          <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      {/* ── Meta Row (price / date) ── */}
      <View style={styles.metaRow}>
        {item.price ? (
          <View style={styles.metaChip}>
            <MaterialCommunityIcons name="tag-outline" size={12} color={primaryGreen} />
            <Text style={[styles.metaChipText, { color: primaryGreen }]}>{item.price}</Text>
          </View>
        ) : null}

        {item.category ? (
          <View style={[styles.metaChip, { backgroundColor: isDark ? '#2C2C2E' : 'rgba(46,46,46,0.06)' }]}>
            <Text style={[styles.metaChipText, { color: T.textMuted }]}>{item.category}</Text>
          </View>
        ) : null}

        {item.eventDate ? (
          <View style={styles.metaChip}>
            <Feather name="calendar" size={11} color="#3B82F6" />
            <Text style={[styles.metaChipText, { color: '#3B82F6' }]}>{item.eventDate}</Text>
          </View>
        ) : null}

        <Text style={[styles.dateText, { color: T.textMuted }]}>
          {formatDateUserFriendly(item.date)}
        </Text>
      </View>

      {/* ── View Details Button ── */}
      {onViewDetail ? (
        <TouchableOpacity
          style={[styles.detailBtn, { borderColor: borderC }]}
          onPress={onViewDetail}
          activeOpacity={0.7}
        >
          <Feather name="eye" size={13} color={T.textMuted} />
          <Text style={[styles.detailBtnText, { color: T.textMuted }]}>Voir les détails complets</Text>
          <Feather name="chevron-right" size={13} color={T.textMuted} />
        </TouchableOpacity>
      ) : null}

      {/* ── Divider ── */}
      <View style={[styles.divider, { backgroundColor: borderC }]} />

      {/* ── Actions ── */}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={onReject} activeOpacity={0.75}>
          <Feather name="x" size={14} color={Colors.error} />
          <Text style={[styles.actionBtnText, { color: Colors.error }]}>Refuser</Text>
        </TouchableOpacity>

        {onRevision && item.moderationStatus !== 'approved' ? (
          <TouchableOpacity style={[styles.actionBtn, styles.revisionBtn]} onPress={onRevision} activeOpacity={0.75}>
            <Feather name="edit-2" size={14} color="#8B5CF6" />
            <Text style={[styles.actionBtnText, { color: '#8B5CF6' }]}>Révision</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={onApprove} activeOpacity={0.75}>
          <Feather name="check" size={14} color={primaryGreen} />
          <Text style={[styles.actionBtnText, { color: primaryGreen }]}>Valider</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },

  /* Top */
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 10,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titleBlock: { flex: 1 },
  title: { fontFamily: Font.semibold, fontSize: 14, lineHeight: 20 },
  authorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 4, flexWrap: 'wrap' },
  author: { fontFamily: Font.regular, fontSize: 12 },
  dot: { fontFamily: Font.regular, fontSize: 12 },
  shop: { fontFamily: Font.regular, fontSize: 12 },

  badge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  badgeText: { fontFamily: Font.semibold, fontSize: 11 },

  /* Meta */
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(139,195,74,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  metaChipText: { fontFamily: Font.medium, fontSize: 11 },
  dateText: { fontFamily: Font.regular, fontSize: 11, marginLeft: 'auto' },

  /* Details Button */
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderTopWidth: 1,
    gap: 6,
  },
  detailBtnText: { fontFamily: Font.medium, fontSize: 12, flex: 1 },

  /* Divider */
  divider: { height: 1, marginHorizontal: 14 },

  /* Actions */
  actions: {
    flexDirection: 'row',
    gap: 0,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 5,
  },
  rejectBtn:   { backgroundColor: 'rgba(239,68,68,0.07)' },
  revisionBtn: { backgroundColor: 'rgba(139,92,246,0.07)' },
  approveBtn:  { backgroundColor: 'rgba(139,195,74,0.09)' },
  actionBtnText: { fontFamily: Font.semibold, fontSize: 13 },
});
