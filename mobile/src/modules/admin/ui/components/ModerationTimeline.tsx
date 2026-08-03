import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../../shared/context/theme.context';
import { Font, Radius } from '../../../../shared/utils/theme';

export type TimelineStatus = 'submitted' | 'pending' | 'approved' | 'rejected' | 'revision_requested' | 'resubmitted';

interface TimelineStep {
  key: TimelineStatus | string;
  label: string;
  icon: string;
  color: string;
}

const STEPS: TimelineStep[] = [
  { key: 'submitted',          label: 'Soumis',          icon: 'upload',        color: '#6B7280' },
  { key: 'pending',            label: 'En révision',     icon: 'clock',         color: '#F59E0B' },
  { key: 'approved',           label: 'Approuvé',        icon: 'check-circle',  color: '#22C55E' },
];

const REVISION_STEPS: TimelineStep[] = [
  { key: 'submitted',          label: 'Soumis',          icon: 'upload',        color: '#6B7280' },
  { key: 'pending',            label: 'En révision',     icon: 'clock',         color: '#F59E0B' },
  { key: 'revision_requested', label: 'Révision requise', icon: 'edit-2',       color: '#8B5CF6' },
  { key: 'resubmitted',        label: 'Renvoyé',         icon: 'refresh-cw',    color: '#3B82F6' },
  { key: 'approved',           label: 'Approuvé',        icon: 'check-circle',  color: '#22C55E' },
];

const REJECTION_STEPS: TimelineStep[] = [
  { key: 'submitted',          label: 'Soumis',          icon: 'upload',        color: '#6B7280' },
  { key: 'pending',            label: 'En révision',     icon: 'clock',         color: '#F59E0B' },
  { key: 'rejected',           label: 'Refusé',          icon: 'x-circle',      color: '#EF4444' },
];

interface Props {
  currentStatus: TimelineStatus;
  submittedAt?: string;
  moderatedAt?: string;
  compact?: boolean;
}

export function ModerationTimeline({ currentStatus, submittedAt, moderatedAt, compact = false }: Props) {
  const { theme: T, isDark } = useTheme();
  const borderC = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';

  // Choose the appropriate timeline track
  let steps: TimelineStep[];
  if (currentStatus === 'rejected') {
    steps = REJECTION_STEPS;
  } else if (currentStatus === 'revision_requested' || currentStatus === 'resubmitted') {
    steps = REVISION_STEPS;
  } else {
    steps = STEPS;
  }

  // Determine which steps are done/active/future
  const stepOrder = steps.map(s => s.key);
  const currentIdx = stepOrder.indexOf(currentStatus);
  const effectiveIdx = currentIdx === -1 ? 1 : currentIdx; // default to 'pending'

  if (compact) {
    // Compact horizontal pill timeline (for seller side)
    return (
      <View style={compStyles.row}>
        {steps.map((step, idx) => {
          const isDone   = idx < effectiveIdx;
          const isActive = idx === effectiveIdx;
          const isFuture = idx > effectiveIdx;
          const color = isActive ? step.color : isDone ? '#22C55E' : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)');
          return (
            <React.Fragment key={step.key}>
              <View style={[compStyles.dot, { backgroundColor: color + (isFuture ? '40' : 'FF') }]}>
                {isActive && <View style={[compStyles.activePulse, { borderColor: color }]} />}
              </View>
              {idx < steps.length - 1 && (
                <View style={[compStyles.connector, { backgroundColor: isDone ? '#22C55E' : borderC }]} />
              )}
            </React.Fragment>
          );
        })}
      </View>
    );
  }

  // Full vertical timeline
  return (
    <View style={styles.container}>
      {steps.map((step, idx) => {
        const isDone   = idx < effectiveIdx;
        const isActive = idx === effectiveIdx;
        const isFuture = idx > effectiveIdx;
        const iconColor = isActive ? step.color : isDone ? '#22C55E' : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)');
        const textColor = isActive ? step.color : isDone ? T.text : T.textMuted;

        return (
          <View key={step.key} style={styles.row}>
            {/* Connector line segment */}
            <View style={styles.lineCol}>
              {idx > 0 && (
                <View style={[
                  styles.lineAbove,
                  { backgroundColor: (isDone || isActive) ? '#22C55E' : borderC },
                ]} />
              )}
              <View style={[styles.iconCircle, {
                backgroundColor: isActive ? step.color + '18' : isDone ? 'rgba(34,197,94,0.12)' : (isDark ? '#2C2C2E' : 'rgba(0,0,0,0.04)'),
                borderColor: isActive ? step.color : isDone ? '#22C55E' : borderC,
              }]}>
                <Feather
                  name={(isDone ? 'check' : step.icon) as any}
                  size={compact ? 10 : 13}
                  color={iconColor}
                />
              </View>
              {idx < steps.length - 1 && (
                <View style={[
                  styles.lineBelow,
                  { backgroundColor: isDone ? '#22C55E' : borderC },
                ]} />
              )}
            </View>

            {/* Label */}
            <View style={styles.labelCol}>
              <Text style={[styles.stepLabel, { color: textColor, fontFamily: isActive ? Font.semibold : Font.regular }]}>
                {step.label}
              </Text>
              {isActive && (submittedAt || moderatedAt) && (
                <Text style={[styles.stepDate, { color: T.textMuted }]}>
                  {idx === 0 && submittedAt ? submittedAt : moderatedAt ?? ''}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'stretch', minHeight: 42 },
  lineCol: { width: 32, alignItems: 'center' },
  lineAbove: { width: 2, flex: 1, maxHeight: 10 },
  lineBelow: { width: 2, flex: 1 },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  labelCol: { flex: 1, paddingLeft: 10, paddingTop: 4, paddingBottom: 4 },
  stepLabel: { fontSize: 13, lineHeight: 18 },
  stepDate:  { fontFamily: Font.regular, fontSize: 11, marginTop: 2 },
});

const compStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  activePulse: {
    position: 'absolute',
    top: -3,
    left: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    opacity: 0.4,
  },
  connector: { flex: 1, height: 2, maxWidth: 20 },
});
