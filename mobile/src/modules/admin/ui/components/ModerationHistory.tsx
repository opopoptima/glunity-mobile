import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../../shared/context/theme.context';
import { Radius, Spacing } from '../../../../shared/utils/theme';
import { ModerationHistoryItem } from '../../api/admin.api';

interface ModerationHistoryProps {
  history: ModerationHistoryItem[];
}

export function ModerationHistory({ history }: ModerationHistoryProps) {
  const { theme: T, isDark } = useTheme();

  if (!history || history.length === 0) {
    return (
      <View style={styles.emptyTabBox}>
        <Text style={[styles.emptyTabText, { color: T.textMuted }]}>
          Aucune action de modération antérieure enregistrée.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {history.map((hist, idx) => (
        <View
          key={hist.id || idx}
          style={[
            styles.previewCard,
            {
              backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
            },
          ]}
        >
          <View style={styles.previewHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather name="shield" size={14} color="#F59E0B" />
              <Text style={[styles.previewTitle, { color: T.text }]}>{hist.action}</Text>
            </View>
            {hist.duration && (
              <View style={[styles.previewStatusBadge, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                <Text style={[styles.previewStatusText, { color: '#F59E0B', fontWeight: 'bold' }]}>
                  {hist.duration}
                </Text>
              </View>
            )}
          </View>

          <Text style={[styles.previewText, { color: T.textSub, marginTop: 4 }]}>
            <Text style={{ fontWeight: '600', color: T.text }}>Motif : </Text>
            {hist.reason}
          </Text>

          <View style={styles.previewFooter}>
            <Text style={[styles.previewMetaText, { color: T.textMuted }]}>Par : {hist.adminName}</Text>
            <Text style={[styles.previewMetaText, { color: T.textMuted }]}>• Le {hist.date}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  emptyTabBox: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTabText: {
    fontSize: 12.5,
  },
  previewCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  previewTitle: {
    fontWeight: '700',
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  previewStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  previewStatusText: {
    fontSize: 9.5,
  },
  previewText: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  previewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.04)',
    paddingTop: 8,
  },
  previewMetaText: {
    fontSize: 11,
    marginRight: 6,
  },
});
