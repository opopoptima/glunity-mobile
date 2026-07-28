import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../../shared/context/theme.context';
import { Radius, Spacing } from '../../../../shared/utils/theme';
import { ReportItem } from '../../api/admin.api';

interface ReportsSectionProps {
  reports: ReportItem[];
  onActionReport?: (id: string, action: 'resolve' | 'dismiss') => void;
}

export function ReportsSection({ reports, onActionReport }: ReportsSectionProps) {
  const { theme: T, isDark } = useTheme();
  const primaryGreen = '#8BC34A';

  const defaultHandleAction = (id: string, actionName: 'resolve' | 'dismiss') => {
    if (onActionReport) {
      onActionReport(id, actionName);
    } else {
      Alert.alert(
        'Actionner le signalement',
        `Marquer le signalement ${id} comme ${actionName === 'resolve' ? 'résolu' : 'classé sans suite'}.`
      );
    }
  };

  if (!reports || reports.length === 0) {
    return (
      <View style={styles.emptyTabBox}>
        <Text style={[styles.emptyTabText, { color: T.textMuted }]}>
          Aucun signalement déposé contre cet utilisateur.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {reports.map((rep, idx) => {
        let statusColor = '#3B82F6'; // pending
        if (rep.status === 'resolved') statusColor = '#10B981';
        if (rep.status === 'dismissed') statusColor = T.textMuted;
        if (rep.status === 'escalated') statusColor = '#EC4899';

        return (
          <View
            key={rep.id || idx}
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
                <Feather name="alert-triangle" size={14} color="#EF4444" />
                <Text style={[styles.previewTitle, { color: T.text }]}>{rep.category}</Text>
              </View>
              <View style={[styles.previewStatusBadge, { backgroundColor: `${statusColor}18` }]}>
                <Text style={[styles.previewStatusText, { color: statusColor, textTransform: 'uppercase', fontWeight: 'bold' }]}>
                  {rep.status}
                </Text>
              </View>
            </View>

            <Text style={[styles.previewText, { color: T.textSub, marginTop: 4 }]}>
              <Text style={{ fontWeight: '600', color: T.text }}>Description : </Text>
              {rep.description}
            </Text>

            {rep.evidence ? (
              <View style={[styles.evidenceBox, { backgroundColor: isDark ? '#252528' : '#F9FAFB' }]}>
                <Text style={[styles.evidenceLabel, { color: T.textMuted }]}>Preuve / Contexte :</Text>
                <Text style={[styles.evidenceText, { color: T.textSub }]}>{rep.evidence}</Text>
              </View>
            ) : null}

            <View style={styles.previewFooter}>
              <Text style={[styles.previewMetaText, { color: T.textMuted }]}>Rapporteur : {rep.reporter}</Text>
              <Text style={[styles.previewMetaText, { color: T.textMuted }]}>• {rep.date}</Text>
              
              {rep.status === 'pending' && (
                <TouchableOpacity
                  style={styles.previewAction}
                  onPress={() => Alert.alert('Actionner le signalement', 'Choisissez une action :', [
                    { text: 'Fermer', style: 'cancel' },
                    { text: 'Résoudre', onPress: () => defaultHandleAction(rep.id, 'resolve') },
                    { text: 'Classer sans suite', style: 'destructive', onPress: () => defaultHandleAction(rep.id, 'dismiss') }
                  ])}
                >
                  <Text style={[styles.previewActionText, { color: primaryGreen }]}>Actionner</Text>
                  <Feather name="settings" size={12} color={primaryGreen} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}
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
  evidenceBox: {
    borderRadius: Radius.sm,
    padding: 8,
    marginTop: 8,
  },
  evidenceLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    marginBottom: 2,
  },
  evidenceText: {
    fontSize: 12,
    lineHeight: 16,
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
  previewAction: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  previewActionText: {
    fontWeight: '700',
    fontSize: 11.5,
  },
});
