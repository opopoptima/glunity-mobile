import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../../shared/context/theme.context';
import { Colors, Font, Radius } from '../../../../shared/utils/theme';
import { ModerationStats } from '../../api/admin.types';

interface StatCell {
  key: keyof ModerationStats;
  label: string;
  icon: string;
  color: string;
  onPress?: () => void;
}

const CELLS: StatCell[] = [
  { key: 'pendingProducts',          label: 'Produits',   icon: 'food-apple',           color: '#8BC34A' },
  { key: 'pendingRecipes',           label: 'Recettes',   icon: 'chef-hat',             color: '#F59E0B' },
  { key: 'pendingReels',             label: 'Reels',      icon: 'movie-play',           color: '#EC4899' },
  { key: 'pendingShopUpdates',       label: 'Boutiques',  icon: 'store-edit-outline',   color: '#3B82F6' },
  { key: 'pendingSellerVerifications', label: 'Vendeurs', icon: 'shield-account-outline', color: '#8B5CF6' },
];

interface Props {
  stats: ModerationStats | null;
  onCellPress?: (key: string) => void;
}

export function ModerationStatsStrip({ stats, onCellPress }: Props) {
  const { theme: T, isDark } = useTheme();
  const cardBg  = isDark ? '#1C1C1E' : '#FFFFFF';
  const borderC = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';

  const totalPending = stats?.totalPending ?? 0;

  return (
    <View style={styles.wrapper}>
      {/* Totals summary row */}
      <View style={[styles.summaryRow, { backgroundColor: cardBg, borderColor: borderC }]}>
        <View style={styles.summaryLeft}>
          <Text style={[styles.totalNum, { color: T.text }]}>{totalPending}</Text>
          <Text style={[styles.totalLabel, { color: T.textMuted }]}>en attente</Text>
        </View>
        <View style={styles.summaryRight}>
          <View style={styles.todayPill}>
            <MaterialCommunityIcons name="check-circle-outline" size={13} color="#22C55E" />
            <Text style={[styles.todayText, { color: '#22C55E' }]}>{stats?.approvedToday ?? 0} approuvé</Text>
          </View>
          <View style={[styles.todayPill, { marginLeft: 6 }]}>
            <MaterialCommunityIcons name="close-circle-outline" size={13} color="#EF4444" />
            <Text style={[styles.todayText, { color: '#EF4444' }]}>{stats?.rejectedToday ?? 0} refusé</Text>
          </View>
        </View>
      </View>

      {/* Per-category strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}
      >
        {CELLS.map(cell => {
          const count = (stats?.[cell.key] as number) ?? 0;
          const isUrgent = count > 10;
          return (
            <TouchableOpacity
              key={cell.key}
              style={[styles.cell, { backgroundColor: cardBg, borderColor: borderC }]}
              activeOpacity={0.75}
              onPress={() => onCellPress?.(cell.key)}
            >
              <View style={[styles.cellIcon, { backgroundColor: cell.color + '18' }]}>
                <MaterialCommunityIcons name={cell.icon as any} size={16} color={cell.color} />
              </View>
              <Text style={[styles.cellCount, { color: T.text }]}>{count}</Text>
              <Text style={[styles.cellLabel, { color: T.textMuted }]} numberOfLines={1}>{cell.label}</Text>
              {isUrgent && (
                <View style={styles.urgentDot} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingBottom: 2 },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 14,
    marginTop: 6,
    marginBottom: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  summaryLeft: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  totalNum:   { fontFamily: Font.bold, fontSize: 20 },
  totalLabel: { fontFamily: Font.regular, fontSize: 12 },
  summaryRight: { flexDirection: 'row', alignItems: 'center' },
  todayPill:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
  todayText:  { fontFamily: Font.semibold, fontSize: 11 },

  strip: { paddingHorizontal: 14, gap: 8, paddingBottom: 4 },
  cell: {
    width: 78,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 3,
    position: 'relative',
  },
  cellIcon:  { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cellCount: { fontFamily: Font.bold, fontSize: 16 },
  cellLabel: { fontFamily: Font.regular, fontSize: 10, textAlign: 'center' },
  urgentDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
});
