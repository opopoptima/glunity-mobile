import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../../shared/context/theme.context';
import { Colors, Font, Radius, Spacing } from '../../../../shared/utils/theme';
import { SellerVerificationDossier } from '../../api/admin.api';
import { formatDateUserFriendly } from '../../../../shared/utils/date.utils';

interface SellerDossierCardProps {
  seller: SellerVerificationDossier;
  onOpenDetails: () => void;
  onApprove: () => void;
  onRevision: () => void;
  onReject: () => void;
  onRevoke?: () => void;
}

const STATUS_META: Record<string, { color: string; bg: string; label: string }> = {
  draft:              { color: '#6B7280', bg: 'rgba(107,114,128,0.1)', label: 'Brouillon' },
  pending:            { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  label: 'En attente' },
  approved:           { color: '#22C55E', bg: 'rgba(34,197,94,0.1)',   label: 'Vérifié ✓' },
  rejected:           { color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   label: 'Refusé' },
  revision_requested: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', label: 'Révision' },
  resubmitted:        { color: '#3B82F6', bg: 'rgba(59,130,246,0.1)',  label: 'Renvoyé' },
};

export function SellerDossierCard({ seller, onOpenDetails, onApprove, onRevision, onReject, onRevoke }: SellerDossierCardProps) {
  const { theme: T, isDark } = useTheme();
  const primaryGreen = Colors.green || '#8BC34A';
  const cardBg  = isDark ? '#1C1C1E' : '#FFFFFF';
  const borderC = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
  const rowBg   = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(46,46,46,0.03)';

  const status = STATUS_META[seller.sellerVerificationStatus] ?? { color: '#6B7280', bg: 'rgba(107,114,128,0.1)', label: seller.sellerVerificationStatus };
  const isApproved = seller.sellerVerificationStatus === 'approved';

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderC }]}>
      {/* ── Header ── */}
      <View style={styles.cardTop}>
        <View style={styles.storeIcon}>
          <MaterialCommunityIcons name="store-outline" size={20} color="#3B82F6" />
        </View>
        <View style={styles.storeInfo}>
          <Text style={[styles.storeName, { color: T.text }]} numberOfLines={1}>{seller.storeName}</Text>
          <Text style={[styles.ownerName, { color: T.textMuted }]} numberOfLines={1}>
            {seller.ownerName} · {seller.email}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: status.bg }]}>
          <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      {/* ── Info Row ── */}
      <View style={[styles.infoRow, { backgroundColor: rowBg, borderColor: borderC }]}>
        <View style={styles.infoCell}>
          <Text style={[styles.infoKey, { color: T.textMuted }]}>SIRET</Text>
          <Text style={[styles.infoVal, { color: T.text }]}>{seller.siret || '—'}</Text>
        </View>
        <View style={[styles.infoDivider, { backgroundColor: borderC }]} />
        <View style={styles.infoCell}>
          <Text style={[styles.infoKey, { color: T.textMuted }]}>Badge</Text>
          <Text style={[styles.infoVal, { color: isApproved ? '#22C55E' : T.textMuted }]}>
            {isApproved ? 'Vérifié' : 'Aucun'}
          </Text>
        </View>
        <View style={[styles.infoDivider, { backgroundColor: borderC }]} />
        <View style={styles.infoCell}>
          <Text style={[styles.infoKey, { color: T.textMuted }]}>Soumis</Text>
          <Text style={[styles.infoVal, { color: T.text }]}>{formatDateUserFriendly(seller.submittedDate)}</Text>
        </View>
      </View>

      {/* ── Certifications ── */}
      {seller.certifications ? (
        <View style={[styles.certRow, { borderColor: borderC }]}>
          <MaterialCommunityIcons name="certificate-outline" size={14} color={primaryGreen} />
          <Text style={[styles.certText, { color: T.textMuted }]} numberOfLines={1}>{seller.certifications}</Text>
        </View>
      ) : null}

      {/* ── Inspect Button ── */}
      <TouchableOpacity
        style={[styles.inspectBtn, { borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(46,46,46,0.15)' }]}
        onPress={onOpenDetails}
        activeOpacity={0.7}
      >
        <Feather name="eye" size={14} color={T.text} />
        <Text style={[styles.inspectBtnText, { color: T.text }]}>Inspecter le dossier complet</Text>
        <Feather name="chevron-right" size={14} color={T.textMuted} />
      </TouchableOpacity>

      {/* ── Divider ── */}
      <View style={[styles.divider, { backgroundColor: borderC }]} />

      {/* ── Actions ── */}
      {isApproved ? (
        <View style={styles.actions}>
          {onRevoke && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(239,68,68,0.08)' }]} onPress={onRevoke} activeOpacity={0.75}>
              <Feather name="shield-off" size={14} color={Colors.error} />
              <Text style={[styles.actionBtnText, { color: Colors.error }]}>Révoquer badge</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(239,68,68,0.07)' }]} onPress={onReject} activeOpacity={0.75}>
            <Feather name="x" size={14} color={Colors.error} />
            <Text style={[styles.actionBtnText, { color: Colors.error }]}>Refuser</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(139,92,246,0.08)' }]} onPress={onRevision} activeOpacity={0.75}>
            <Feather name="edit-2" size={14} color="#8B5CF6" />
            <Text style={[styles.actionBtnText, { color: '#8B5CF6' }]}>Révision</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(139,195,74,0.09)' }]} onPress={onApprove} activeOpacity={0.75}>
            <Feather name="check-circle" size={14} color={primaryGreen} />
            <Text style={[styles.actionBtnText, { color: primaryGreen }]}>Valider badge</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 10,
  },
  storeIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(59,130,246,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  storeInfo:  { flex: 1 },
  storeName:  { fontFamily: Font.semibold, fontSize: 14, lineHeight: 20 },
  ownerName:  { fontFamily: Font.regular, fontSize: 12, marginTop: 2 },
  badge:      { paddingHorizontal: 9, paddingVertical: 4, borderRadius: Radius.full, alignSelf: 'flex-start', flexShrink: 0 },
  badgeText:  { fontFamily: Font.semibold, fontSize: 11 },

  /* Info row */
  infoRow: {
    flexDirection: 'row',
    marginHorizontal: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  infoCell:    { flex: 1, padding: 8, alignItems: 'center' },
  infoKey:     { fontFamily: Font.regular, fontSize: 10, marginBottom: 2 },
  infoVal:     { fontFamily: Font.semibold, fontSize: 12 },
  infoDivider: { width: 1 },

  /* Certifications */
  certRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 14,
    marginBottom: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  certText: { fontFamily: Font.regular, fontSize: 12, flex: 1 },

  /* Inspect btn */
  inspectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 14,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 6,
  },
  inspectBtnText: { fontFamily: Font.medium, fontSize: 13, flex: 1 },

  /* Divider + Actions */
  divider: { height: 1 },
  actions: { flexDirection: 'row' },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    gap: 5,
  },
  actionBtnText: { fontFamily: Font.semibold, fontSize: 13 },
});
