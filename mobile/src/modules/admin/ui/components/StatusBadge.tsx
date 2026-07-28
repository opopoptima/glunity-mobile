import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../../shared/context/theme.context';
import { Colors, Font, Radius } from '../../../../shared/utils/theme';
import { useLanguage } from '../../../../shared/context/language.context';

export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'cancelled';

interface StatusBadgeProps {
  status: ModerationStatus | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { isDark } = useTheme();
  const { t } = useLanguage();

  const normalizedStatus = String(status).toLowerCase() as ModerationStatus;

  let badgeBg = 'rgba(245,158,11,0.1)';
  let textColor = '#F59E0B';
  let label = t('status.pending', 'En attente');

  if (normalizedStatus === 'approved' || normalizedStatus === 'active') {
    badgeBg = isDark ? 'rgba(139,195,74,0.15)' : Colors.greenLight;
    textColor = Colors.green;
    label = t('status.approved', 'Approuvé');
  } else if (normalizedStatus === 'rejected' || normalizedStatus === 'cancelled') {
    badgeBg = isDark ? 'rgba(229,57,53,0.15)' : Colors.errorLight;
    textColor = Colors.error;
    label = t('status.rejected', 'Refusé');
  }

  return (
    <View style={[styles.badge, { backgroundColor: badgeBg }]}>
      <View style={[styles.dot, { backgroundColor: textColor }]} />
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontFamily: Font.family,
    fontWeight: Font.bold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
