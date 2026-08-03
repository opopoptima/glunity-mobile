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
  { key: 'pendingProducts', label: 'Produits',   icon: 'food-apple',  color: '#8BC34A' },
  { key: 'pendingEvents' as any,   label: 'Événements', icon: 'calendar',    color: '#3B82F6' },
  { key: 'pendingRecipes',  label: 'Recettes',   icon: 'chef-hat',    color: '#F59E0B' },
  { key: 'pendingReels',    label: 'Reels',      icon: 'movie-play',  color: '#EC4899' },
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

      {/* Per-category strip (4 cards fill screen width evenly) */}
      <View style={styles.gridRow}>
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
                <MaterialCommunityIcons name={cell.icon as any} size={24} color={cell.color} />
              </View>
              <Text style={[styles.cellCount, { color: T.text }]}>{count}</Text>
              <Text style={[styles.cellLabel, { color: T.textMuted }]} numberOfLines={1}>{cell.label}</Text>
              {isUrgent && (
                <View style={styles.urgentDot} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingBottom: 4 },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 14,
    marginTop: 6,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  summaryLeft: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  totalNum:   { fontFamily: Font.bold, fontSize: 22 },
  totalLabel: { fontFamily: Font.regular, fontSize: 13 },
  summaryRight: { flexDirection: 'row', alignItems: 'center' },
  todayPill:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
  todayText:  { fontFamily: Font.semibold, fontSize: 12 },

  gridRow: { paddingHorizontal: 14, flexDirection: 'row', gap: 10, paddingBottom: 6 },
  cell: {
    flex: 1,
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 6,
    position: 'relative',
  },
  cellIcon:  { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cellCount: { fontFamily: Font.bold, fontSize: 20 },
  cellLabel: { fontFamily: Font.medium, fontSize: 12, textAlign: 'center' },
  urgentDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
});
