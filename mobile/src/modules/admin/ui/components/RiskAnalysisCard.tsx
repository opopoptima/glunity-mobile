import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../../shared/context/theme.context';
import { Radius, Spacing } from '../../../../shared/utils/theme';
import { RiskAnalysis } from '../../api/admin.api';

interface RiskAnalysisCardProps {
  risk: RiskAnalysis;
}

export function RiskAnalysisCard({ risk }: RiskAnalysisCardProps) {
  const { theme: T, isDark } = useTheme();

  const isHighRisk = risk.score === 'high';
  const isMedRisk = risk.score === 'medium';
  
  let riskColor = '#10B981';
  let iconName: 'shield' | 'alert-triangle' = 'shield';
  if (isHighRisk) {
    riskColor = '#EF4444';
    iconName = 'alert-triangle';
  } else if (isMedRisk) {
    riskColor = '#F59E0B';
    iconName = 'alert-triangle';
  }

  const getFakeAccountIndicatorLabel = (val: string) => {
    switch (val) {
      case 'high': return 'Élevé';
      case 'medium': return 'Moyen';
      default: return 'Faible';
    }
  };

  return (
    <View style={[
      styles.card, 
      { 
        backgroundColor: isDark ? '#1A1A1D' : '#FFFFFF',
        borderColor: isHighRisk ? 'rgba(239, 68, 68, 0.3)' : isMedRisk ? 'rgba(245, 158, 11, 0.3)' : 'rgba(0,0,0,0.05)' 
      }
    ]}>
      <View style={styles.sectionHeader}>
        <Feather name={iconName} size={16} color={riskColor} />
        <Text style={[styles.sectionTitle, { color: T.text }]}>Analyse de Risque</Text>
        
        <View style={[
          styles.riskScoreBadge, 
          { 
            backgroundColor: isHighRisk ? 'rgba(239, 68, 68, 0.12)' : isMedRisk ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)'
          }
        ]}>
          <Text style={[
            styles.riskScoreText, 
            { color: riskColor }
          ]}>
            {risk.scoreLabel || (isHighRisk ? 'Risque Élevé' : isMedRisk ? 'Risque Modéré' : 'Faible Risque')}
          </Text>
        </View>
      </View>

      <View style={styles.riskGrid}>
        <View style={styles.riskGridItem}>
          <Text style={[styles.riskLabel, { color: T.textMuted }]}>Toxicité Détectée</Text>
          <Text style={[styles.riskVal, { color: risk.toxicityScore > 40 ? '#EF4444' : T.text }]}>
            {risk.toxicityScore}%
          </Text>
        </View>
        
        <View style={styles.riskGridItem}>
          <Text style={[styles.riskLabel, { color: T.textMuted }]}>Signalements Actifs</Text>
          <Text style={[styles.riskVal, { color: risk.reports > 0 ? '#EF4444' : T.text }]}>
            {risk.reports}
          </Text>
        </View>
        
        <View style={styles.riskGridItem}>
          <Text style={[styles.riskLabel, { color: T.textMuted }]}>Détecteur de Spam</Text>
          <Text style={[styles.riskVal, { color: risk.spamFlags > 0 ? '#F59E0B' : T.text }]}>
            {risk.spamFlags > 0 ? `${risk.spamFlags} alertes` : 'Normal'}
          </Text>
        </View>
        
        <View style={styles.riskGridItem}>
          <Text style={[styles.riskLabel, { color: T.textMuted }]}>Détecteur Bot / Fake</Text>
          <Text style={[styles.riskVal, { color: risk.fakeAccountIndicator === 'high' ? '#EF4444' : T.text }]}>
            {getFakeAccountIndicatorLabel(risk.fakeAccountIndicator)}
          </Text>
        </View>
      </View>
    </View>
  );
}

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
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 14.5,
    flex: 1,
  },
  riskScoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  riskScoreText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  riskGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12,
  },
  riskGridItem: {
    width: '50%',
  },
  riskLabel: {
    fontSize: 11,
  },
  riskVal: {
    fontSize: 13.5,
    fontWeight: '600',
    marginTop: 2,
  },
});
