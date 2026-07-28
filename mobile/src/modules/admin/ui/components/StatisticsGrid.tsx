import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../../shared/context/theme.context';
import { Radius, Spacing } from '../../../../shared/utils/theme';
import { UserStats } from '../../api/admin.api';

interface StatisticsGridProps {
  stats: UserStats;
}

export function StatisticsGrid({ stats }: StatisticsGridProps) {
  const { theme: T, isDark } = useTheme();

  const statItems = [
    { label: 'Posts', value: stats.posts, icon: 'file-text', color: '#10B981' },
    { label: 'Commentaires', value: stats.comments, icon: 'message-square', color: '#8B5CF6' },
    { label: 'Événements', value: stats.events, icon: 'calendar', color: '#3B82F6' },
    { label: 'Abonnés', value: stats.followers, icon: 'users', color: '#EC4899' },
    { label: 'Signalements', value: stats.reports, icon: 'alert-triangle', color: '#EF4444' },
    { label: 'Avertissements', value: stats.warnings, icon: 'bell', color: '#F59E0B' },
    { label: 'Retraits Contenu', value: stats.deletedContent, icon: 'trash-2', color: '#6B7280' },
    { label: 'Connexions', value: stats.logins, icon: 'log-in', color: '#06B6D4' },
    { label: 'Achats', value: stats.purchases, icon: 'shopping-cart', color: '#14B8A6' },
    { label: 'Avis émis', value: stats.reviews, icon: 'star', color: '#EAB308' },
  ];

  return (
    <View style={styles.container}>
      <Text style={[styles.blockTitle, { color: T.textMuted }]}>Statistiques d'Activité</Text>
      <View style={styles.statsWrap}>
        {statItems.map((stat, i) => (
          <View
            key={i}
            style={[
              styles.statCard,
              {
                backgroundColor: isDark ? '#1A1A1D' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
              },
            ]}
          >
            <View style={[styles.statIconWrapper, { backgroundColor: `${stat.color}15` }]}>
              <Feather name={stat.icon as any} size={15} color={stat.color} />
            </View>
            <Text style={[styles.statValueText, { color: T.text }]}>{stat.value}</Text>
            <Text style={[styles.statLabelText, { color: T.textMuted }]} numberOfLines={1}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  blockTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  statsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'column',
    gap: 4,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  statIconWrapper: {
    width: 26,
    height: 26,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  statValueText: {
    fontSize: 16.5,
    fontWeight: '700',
  },
  statLabelText: {
    fontSize: 11.5,
  },
});
