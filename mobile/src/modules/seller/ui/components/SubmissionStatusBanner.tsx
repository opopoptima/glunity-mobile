import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/shared/context/theme.context';
import { Font, Radius } from '@/shared/utils/theme';
import { ModerationTimeline, TimelineStatus } from '../../../admin/ui/components/ModerationTimeline';

export type ContentModerationStatus = 'pending' | 'approved' | 'rejected' | 'revision_requested' | 'resubmitted' | 'draft';

interface Props {
  status: ContentModerationStatus;
  reason?: string;
  notes?: string;
  submittedAt?: string;
  moderatedAt?: string;
  onResubmit?: () => void;
  onEdit?: () => void;
  compact?: boolean;
}

const STATUS_CONFIG: Record<ContentModerationStatus, { color: string; bg: string; label: string; icon: string }> = {
  draft:              { color: '#6B7280', bg: 'rgba(107,114,128,0.1)',  label: 'Brouillon',         icon: 'file-outline' },
  pending:            { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  label: 'En attente',        icon: 'clock-outline' },
  approved:           { color: '#22C55E', bg: 'rgba(34,197,94,0.12)',   label: 'Approuvé',          icon: 'check-circle-outline' },
  rejected:           { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',   label: 'Refusé',            icon: 'close-circle-outline' },
  revision_requested: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', label: 'Révision requise',  icon: 'pencil-circle-outline' },
  resubmitted:        { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)',  label: 'Renvoyé',           icon: 'refresh' },
};

export function SubmissionStatusBanner({
  status,
  reason,
  notes,
  submittedAt,
  moderatedAt,
  onResubmit,
  onEdit,
  compact = false,
}: Props) {
  const { theme: T, isDark } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const cfg   = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const borderC = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';

  // Compact pill version (for inside cards)
  if (compact) {
    return (
      <View style={[compStyles.pill, { backgroundColor: cfg.bg }]}>
        <MaterialCommunityIcons name={cfg.icon as any} size={12} color={cfg.color} />
        <Text style={[compStyles.pillText, { color: cfg.color }]}>{cfg.label}</Text>
      </View>
    );
  }

  const hasFeedback = !!reason || !!notes;
  const showCTA     = status === 'rejected' || status === 'revision_requested';

  return (
    <View style={[styles.banner, { borderColor: cfg.color + '40', backgroundColor: cfg.bg }]}>
      {/* Header row */}
      <TouchableOpacity
        style={styles.headerRow}
        onPress={() => hasFeedback && setExpanded(e => !e)}
        activeOpacity={hasFeedback ? 0.7 : 1}
      >
        <MaterialCommunityIcons name={cfg.icon as any} size={20} color={cfg.color} />
        <View style={styles.headerText}>
          <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
          {status === 'pending' && (
            <Text style={[styles.hint, { color: T.textMuted }]}>
              En attente de validation par l'administrateur
            </Text>
          )}
          {status === 'approved' && (
            <Text style={[styles.hint, { color: T.textMuted }]}>
              Visible sur la plateforme
            </Text>
          )}
          {status === 'resubmitted' && (
            <Text style={[styles.hint, { color: T.textMuted }]}>
              Renvoyé — en attente d'une nouvelle décision
            </Text>
          )}
        </View>
        {hasFeedback && (
          <Feather
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={cfg.color}
          />
        )}
      </TouchableOpacity>

      {/* Expandable: feedback + timeline */}
      {expanded && (
        <View style={[styles.expandedContent, { borderTopColor: cfg.color + '25' }]}>
          {/* Rejection reason */}
          {reason ? (
            <View style={[styles.feedbackBox, { backgroundColor: 'rgba(239,68,68,0.07)', borderColor: 'rgba(239,68,68,0.18)' }]}>
              <Feather name="alert-circle" size={13} color="#EF4444" />
              <Text style={[styles.feedbackText, { color: '#EF4444' }]}>
                <Text style={{ fontFamily: Font.semibold }}>Motif : </Text>
                {reason}
              </Text>
            </View>
          ) : null}

          {/* Revision notes */}
          {notes ? (
            <View style={[styles.feedbackBox, { backgroundColor: 'rgba(139,92,246,0.07)', borderColor: 'rgba(139,92,246,0.18)' }]}>
              <Feather name="edit-2" size={13} color="#8B5CF6" />
              <Text style={[styles.feedbackText, { color: '#8B5CF6' }]}>
                <Text style={{ fontFamily: Font.semibold }}>Modifications requises : </Text>
                {notes}
              </Text>
            </View>
          ) : null}

          {/* Timeline */}
          <ModerationTimeline
            currentStatus={status as TimelineStatus}
            submittedAt={submittedAt}
            moderatedAt={moderatedAt}
          />
        </View>
      )}

      {/* CTAs */}
      {showCTA && (
        <View style={styles.ctaRow}>
          {onEdit && (
            <TouchableOpacity
              style={[styles.ctaBtn, { borderColor: cfg.color + '50', backgroundColor: cfg.bg }]}
              onPress={onEdit}
              activeOpacity={0.75}
            >
              <Feather name="edit-2" size={13} color={cfg.color} />
              <Text style={[styles.ctaBtnText, { color: cfg.color }]}>Modifier</Text>
            </TouchableOpacity>
          )}
          {onResubmit && status === 'revision_requested' && (
            <TouchableOpacity
              style={[styles.ctaBtn, styles.ctaBtnPrimary, { backgroundColor: cfg.color }]}
              onPress={onResubmit}
              activeOpacity={0.8}
            >
              <Feather name="send" size={13} color="#FFF" />
              <Text style={[styles.ctaBtnText, { color: '#FFF' }]}>Renvoyer</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  headerText:  { flex: 1 },
  statusLabel: { fontFamily: Font.semibold, fontSize: 13 },
  hint:        { fontFamily: Font.regular, fontSize: 11, marginTop: 2 },

  expandedContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
  },
  feedbackBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginTop: 10,
    marginBottom: 4,
  },
  feedbackText: { fontFamily: Font.regular, fontSize: 13, flex: 1, lineHeight: 18 },

  ctaRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingBottom: 12 },
  ctaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radius.md,
    gap: 6,
    borderWidth: 1,
  },
  ctaBtnPrimary: { borderWidth: 0 },
  ctaBtnText: { fontFamily: Font.semibold, fontSize: 13 },
});

const compStyles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    gap: 4,
    alignSelf: 'flex-start',
  },
  pillText: { fontFamily: Font.semibold, fontSize: 11 },
});
