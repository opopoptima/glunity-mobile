import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../../shared/context/theme.context';
import { Colors, Font, Radius, Spacing } from '../../../../shared/utils/theme';
import { useModerationHistory } from '../../hooks/useModerationHistory';
import { SkeletonCard } from '../components/SkeletonCard';
import { ModerationHistoryEntry } from '../../api/admin.api';
import { formatDateUserFriendly } from '../../../../shared/utils/date.utils';

const ENTITY_FILTERS = [
  { id: '',                    label: 'Tout',      icon: 'view-list-outline' },
  { id: 'product',             label: 'Produits',  icon: 'food-apple' },
  { id: 'recipe',              label: 'Recettes',  icon: 'chef-hat' },
  { id: 'seller_verification', label: 'Vendeurs',  icon: 'shield-account' },
  { id: 'shop',                label: 'Boutiques', icon: 'store-edit-outline' },
];

const ACTION_META: Record<string, { color: string; bg: string; label: string }> = {
  approved:             { color: '#22C55E', bg: 'rgba(34,197,94,0.1)',   label: 'Approuvé' },
  rejected:             { color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   label: 'Refusé' },
  revision_requested:   { color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', label: 'Révision' },
  submitted:            { color: '#3B82F6', bg: 'rgba(59,130,246,0.1)',  label: 'Soumis' },
  resubmitted:          { color: '#6366F1', bg: 'rgba(99,102,241,0.1)',  label: 'Renvoyé' },
  badge_assigned:       { color: '#22C55E', bg: 'rgba(34,197,94,0.1)',   label: 'Badge ✓' },
  badge_revoked:        { color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   label: 'Badge révoqué' },
  shop_update_approved: { color: '#22C55E', bg: 'rgba(34,197,94,0.1)',   label: 'MAJ ✓' },
  shop_update_rejected: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   label: 'MAJ ✗' },
};

const ENTITY_ICON: Record<string, string> = {
  product:             'food-apple',
  recipe:              'chef-hat',
  seller_verification: 'shield-account',
  seller_badge:        'certificate-outline',
  shop:                'store-edit-outline',
};

function HistoryCard({ entry }: { entry: ModerationHistoryEntry }) {
  const { theme: T, isDark } = useTheme();
  const cardBg  = isDark ? '#1C1C1E' : '#FFFFFF';
  const borderC = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';

  const action = ACTION_META[entry.action] ?? { color: '#6B7280', bg: 'rgba(107,114,128,0.1)', label: entry.action };
  const icon   = ENTITY_ICON[entry.entityType] ?? 'file-document-outline';

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderC }]}>
      <View style={styles.cardRow}>
        {/* Entity icon */}
        <View style={[styles.entityIcon, { backgroundColor: action.bg }]}>
          <MaterialCommunityIcons name={icon as any} size={18} color={action.color} />
        </View>

        {/* Main content */}
        <View style={styles.cardContent}>
          <View style={styles.topLine}>
            <Text style={[styles.entityTitle, { color: T.text }]} numberOfLines={1}>
              {entry.entityTitle || '—'}
            </Text>
            <View style={[styles.badge, { backgroundColor: action.bg }]}>
              <Text style={[styles.badgeText, { color: action.color }]}>{action.label}</Text>
            </View>
          </View>

          {/* Status flow */}
          {entry.previousStatus ? (
            <View style={styles.flowRow}>
              <Text style={[styles.flowText, { color: T.textMuted }]}>{entry.previousStatus}</Text>
              <Feather name="arrow-right" size={11} color={T.textMuted} style={{ marginHorizontal: 4 }} />
              <Text style={[styles.flowText, { color: action.color, fontFamily: Font.semibold }]}>{entry.newStatus}</Text>
            </View>
          ) : null}

          {/* Owner */}
          <View style={styles.metaLine}>
            <Feather name="user" size={11} color={T.textMuted} />
            <Text style={[styles.metaText, { color: T.textMuted }]}>{entry.ownerName || '—'}</Text>
            {entry.shopName ? (
              <>
                <Text style={[styles.dot, { color: T.textMuted }]}>·</Text>
                <Text style={[styles.metaText, { color: T.textMuted }]}>{entry.shopName}</Text>
              </>
            ) : null}
          </View>

          {/* Reason */}
          {entry.reason ? (
            <Text style={[styles.reason, { color: T.textMuted }]} numberOfLines={2}>
              "{entry.reason}"
            </Text>
          ) : null}

          {/* Admin + date */}
          <View style={styles.footLine}>
            <MaterialCommunityIcons name="shield-account-outline" size={12} color={T.textMuted} />
            <Text style={[styles.metaText, { color: T.textMuted }]}>{entry.adminName || 'Admin'}</Text>
            <Text style={[styles.dot, { color: T.textMuted }]}>·</Text>
            <Text style={[styles.metaText, { color: T.textMuted }]}>{formatDateUserFriendly(entry.createdAt)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export function AdminHistoryScreen({ navigation }: any) {
  const { theme: T, isDark } = useTheme();
  const primaryGreen = Colors.green || '#8BC34A';
  const cardBg  = isDark ? '#1C1C1E' : '#FFFFFF';
  const borderC = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';

  const [entityFilter, setEntityFilter] = useState('');
  const { items, total, loading, setFilter, refresh, hasMore, loadMore } = useModerationHistory();

  const handleEntityFilter = (id: string) => {
    setEntityFilter(id);
    setFilter('entityType', id || undefined);
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: T.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: borderC }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation?.goBack()}>
          <Feather name="arrow-left" size={20} color={T.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: T.text }]}>Historique</Text>
          <Text style={[styles.headerSub, { color: T.textMuted }]}>
            {total > 0 ? `${total} action${total > 1 ? 's' : ''}` : 'Toutes les décisions de modération'}
          </Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={refresh}>
          <Feather name="refresh-cw" size={18} color={T.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Entity filter chips */}
      <View style={styles.chipSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {ENTITY_FILTERS.map(f => {
            const isActive = entityFilter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[
                  styles.typeChip,
                  {
                    backgroundColor: isActive ? primaryGreen : (isDark ? '#2C2C2E' : 'rgba(46,46,46,0.06)'),
                    borderColor: isActive ? primaryGreen : 'transparent',
                  },
                ]}
                onPress={() => handleEntityFilter(f.id)}
                activeOpacity={0.75}
              >
                <MaterialCommunityIcons
                  name={f.icon as any}
                  size={13}
                  color={isActive ? '#FFF' : T.textMuted}
                />
                <Text style={[styles.typeChipLabel, { color: isActive ? '#FFF' : T.text }]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* List */}
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {loading && items.length === 0 ? (
          <><SkeletonCard height={110} /><SkeletonCard height={110} /><SkeletonCard height={110} /></>
        ) : items.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={[styles.emptyIcon, { backgroundColor: Colors.greenLight }]}>
              <Feather name="clock" size={30} color={primaryGreen} />
            </View>
            <Text style={[styles.emptyTitle, { color: T.text }]}>Aucun historique</Text>
            <Text style={[styles.emptyDesc, { color: T.textMuted }]}>Les actions de modération apparaîtront ici.</Text>
          </View>
        ) : (
          <>
            {items.map(entry => <HistoryCard key={entry.id} entry={entry} />)}
            {hasMore && (
              <TouchableOpacity
                style={[styles.loadMoreBtn, { borderColor: borderC }]}
                onPress={loadMore}
                activeOpacity={0.7}
              >
                <Feather name="chevron-down" size={16} color={primaryGreen} />
                <Text style={[styles.loadMoreText, { color: primaryGreen }]}>Charger plus</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1,
  },
  iconBtn:     { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  headerCenter:{ flex: 1, alignItems: 'center' },
  headerTitle: { fontFamily: Font.bold, fontSize: 17 },
  headerSub:   { fontFamily: Font.regular, fontSize: 12, marginTop: 1 },

  /* Filter chips */
  chipSection: { paddingTop: 12, paddingBottom: 4 },
  chipRow:     { paddingHorizontal: Spacing.md, gap: 8 },
  typeChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 7, paddingHorizontal: 12,
    borderRadius: Radius.full, borderWidth: 1.5, gap: 4,
  },
  typeChipLabel: { fontFamily: Font.medium, fontSize: 12 },

  list: { padding: Spacing.md, paddingBottom: 120 },

  /* Card */
  card: {
    borderRadius: Radius.lg, borderWidth: 1,
    marginBottom: 8, padding: 12,
  },
  cardRow:     { flexDirection: 'row', gap: 10 },
  entityIcon:  { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardContent: { flex: 1 },
  topLine:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 },
  entityTitle: { fontFamily: Font.semibold, fontSize: 13, flex: 1 },
  badge:       { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full, flexShrink: 0 },
  badgeText:   { fontFamily: Font.semibold, fontSize: 11 },

  flowRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  flowText:  { fontFamily: Font.regular, fontSize: 12 },

  metaLine:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
  metaText:  { fontFamily: Font.regular, fontSize: 11 },
  dot:       { fontFamily: Font.regular, fontSize: 11 },

  reason:    { fontFamily: Font.regular, fontSize: 12, fontStyle: 'italic', marginBottom: 4, lineHeight: 17 },
  footLine:  { flexDirection: 'row', alignItems: 'center', gap: 4 },

  /* Empty */
  emptyBox:  { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xxl, marginTop: Spacing.lg },
  emptyIcon: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  emptyTitle:{ fontFamily: Font.bold, fontSize: 17, marginBottom: 6 },
  emptyDesc: { fontFamily: Font.regular, fontSize: 14, textAlign: 'center', lineHeight: 20 },

  /* Load more */
  loadMoreBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: Radius.md, paddingVertical: 12, marginTop: 4, gap: 6 },
  loadMoreText: { fontFamily: Font.semibold, fontSize: 14 },
});
