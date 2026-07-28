import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../../shared/context/theme.context';
import { Radius, Spacing } from '../../../../shared/utils/theme';
import { ActivityTimelineItem } from '../../api/admin.api';

interface ActivityTimelineProps {
  timeline: ActivityTimelineItem[];
}

export function ActivityTimeline({ timeline }: ActivityTimelineProps) {
  const { theme: T, isDark } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: isDark ? '#1A1A1D' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
      <View style={styles.sectionHeader}>
        <Feather name="activity" size={16} color={Colors.green || '#8BC34A'} />
        <Text style={[styles.sectionTitle, { color: T.text }]}>Fil d'Activité</Text>
      </View>

      <View style={styles.timelineBox}>
        {timeline.length === 0 ? (
          <Text style={[styles.emptyText, { color: T.textMuted }]}>Aucune activité récente enregistrée.</Text>
        ) : (
          timeline.map((item, idx) => (
            <View key={item.id || idx} style={styles.timelineItemRow}>
              <View style={styles.timelineLeftCol}>
                <View style={[styles.timelineIconCircle, { backgroundColor: `${item.color}18` }]}>
                  <Feather name={item.icon as any} size={13} color={item.color} />
                </View>
                {idx < timeline.length - 1 && (
                  <View style={[styles.timelineConnector, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#EBEBEB' }]} />
                )}
              </View>
              <View style={styles.timelineRightCol}>
                <View style={styles.timelineHeaderRow}>
                  <Text style={[styles.timelineTitle, { color: T.text }]}>{item.title}</Text>
                  <Text style={[styles.timelineDate, { color: T.textMuted }]}>{item.date}</Text>
                </View>
                <Text style={[styles.timelineDesc, { color: T.textSub }]}>{item.description}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

// Fallback Colors if not imported
const Colors = {
  green: '#8BC34A',
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 14.5,
  },
  timelineBox: {
    marginTop: 4,
  },
  timelineItemRow: {
    flexDirection: 'row',
  },
  timelineLeftCol: {
    alignItems: 'center',
    width: 26,
  },
  timelineIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    marginVertical: 2,
  },
  timelineRightCol: {
    flex: 1,
    marginLeft: 12,
    paddingBottom: 16,
  },
  timelineHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineTitle: {
    fontWeight: '600',
    fontSize: 13.5,
  },
  timelineDate: {
    fontSize: 10.5,
  },
  timelineDesc: {
    fontSize: 12,
    marginTop: 3.5,
    lineHeight: 16,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 10,
  },
});
