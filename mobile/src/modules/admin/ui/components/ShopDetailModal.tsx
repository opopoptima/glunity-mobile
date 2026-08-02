import React from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Image,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../../shared/context/theme.context';
import { Colors, Font, Radius, Spacing } from '../../../../shared/utils/theme';
import { ShopModerationItem } from '../../api/admin.api';
import { formatDateUserFriendly } from '../../../../shared/utils/date.utils';

interface Props {
  visible: boolean;
  item: ShopModerationItem | null;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}

const STATUS_META: Record<string, { color: string; bg: string; label: string }> = {
  pending:            { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  label: '⏳ En attente' },
  approved:           { color: '#22C55E', bg: 'rgba(34,197,94,0.12)',   label: '✅ Approuvée' },
  rejected:           { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',   label: '❌ Refusée' },
  revision_requested: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', label: '✏️ Révision' },
};

function InfoRow({ icon, label, value }: { icon: string; label: string; value?: string | null }) {
  const { theme: T } = useTheme();
  if (!value) return null;
  return (
    <View style={rowStyles.row}>
      <View style={rowStyles.iconWrap}>
        <Feather name={icon as any} size={13} color={T.textMuted} />
      </View>
      <View style={rowStyles.content}>
        <Text style={[rowStyles.label, { color: T.textMuted }]}>{label}</Text>
        <Text style={[rowStyles.value, { color: T.text }]}>{value}</Text>
      </View>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  iconWrap: { width: 28, alignItems: 'center', paddingTop: 2 },
  content:  { flex: 1 },
  label:    { fontFamily: Font.regular, fontSize: 11, marginBottom: 1 },
  value:    { fontFamily: Font.medium, fontSize: 13, lineHeight: 18 },
});

export function ShopDetailModal({ visible, item, onClose, onApprove, onReject }: Props) {
  const { theme: T, isDark } = useTheme();
  const primaryGreen = Colors.green || '#8BC34A';
  const cardBg  = isDark ? '#1C1C1E' : '#FFFFFF';
  const sectionBg = isDark ? '#2C2C2E' : 'rgba(46,46,46,0.04)';
  const borderC = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';

  if (!item) return null;

  const status = STATUS_META[item.moderationStatus] ?? STATUS_META.pending;
  const isPending = item.moderationStatus === 'pending';
  const proposed = (item.proposedData || {}) as Record<string, any>;
  const displayTitle = (typeof proposed.storeName === 'string' ? proposed.storeName : '') || item.currentStoreName || item.sellerName || 'Boutique';
  const coverImg = typeof proposed.imageUrl === 'string' ? proposed.imageUrl : (typeof proposed.coverImageUrl === 'string' ? proposed.coverImageUrl : undefined);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: T.bg }]}>
          {/* Header */}
          <View style={[styles.headerBar, { backgroundColor: cardBg, borderBottomColor: borderC }]}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Feather name="x" size={20} color={T.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: T.text }]} numberOfLines={1}>
              {displayTitle}
            </Text>
            <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {/* Store Banner Preview */}
            {coverImg ? (
              <Image
                source={{ uri: coverImg }}
                style={styles.bannerImage}
                resizeMode="cover"
              />
            ) : null}

            {/* Rejection Notice */}
            {item.reason ? (
              <View style={[styles.noticeBox, { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }]}>
                <Feather name="alert-circle" size={14} color={Colors.error} />
                <Text style={[styles.noticeText, { color: Colors.error }]}>
                  Motif de refus : {item.reason}
                </Text>
              </View>
            ) : null}

            {/* Seller Info */}
            <View style={[styles.section, { backgroundColor: sectionBg, borderColor: borderC }]}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="store-cog" size={16} color="#3B82F6" />
                <Text style={[styles.sectionTitleText, { color: T.text }]}>Propriétaire & Demande</Text>
              </View>
              <InfoRow icon="user"     label="Vendeur"          value={item.sellerName} />
              <InfoRow icon="mail"     label="Email"            value={item.sellerEmail} />
              <InfoRow icon="calendar" label="Date de demande"   value={formatDateUserFriendly(item.submittedAt)} />
              {item.moderatedAt ? (
                <InfoRow icon="check-square" label="Modérée le"  value={formatDateUserFriendly(item.moderatedAt)} />
              ) : null}
              {item.moderatedByName ? (
                <InfoRow icon="shield" label="Modérée par"      value={item.moderatedByName} />
              ) : null}
            </View>

            {/* Changed Fields Diff Section */}
            <View style={[styles.section, { backgroundColor: sectionBg, borderColor: borderC }]}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="swap-horizontal" size={16} color={primaryGreen} />
                <Text style={[styles.sectionTitleText, { color: T.text }]}>
                  Changements demandés ({item.changedFields?.length || 0})
                </Text>
              </View>

              {item.changedFields && item.changedFields.length > 0 ? (
                item.changedFields.map((cf, idx) => (
                  <View key={idx} style={[styles.diffCard, { backgroundColor: cardBg, borderColor: borderC }]}>
                    <Text style={[styles.diffFieldLabel, { color: T.textMuted }]}>{cf.field}</Text>
                    <View style={styles.diffComparison}>
                      <View style={styles.diffValBox}>
                        <Text style={styles.diffValHeader}>Actuel :</Text>
                        <Text style={[styles.diffValText, { color: Colors.error }]}>
                          {String(cf.oldValue ?? 'Non renseigné')}
                        </Text>
                      </View>
                      <Feather name="arrow-right" size={14} color={T.textMuted} style={{ marginHorizontal: 8 }} />
                      <View style={styles.diffValBox}>
                        <Text style={styles.diffValHeader}>Proposé :</Text>
                        <Text style={[styles.diffValText, { color: primaryGreen, fontFamily: Font.bold }]}>
                          {String(cf.newValue ?? 'Effacé')}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={[styles.noDiffText, { color: T.textMuted }]}>
                  Création d'un nouveau point de vente.
                </Text>
              )}
            </View>

            {/* Proposed Full Identity */}
            <View style={[styles.section, { backgroundColor: sectionBg, borderColor: borderC }]}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="card-account-details-outline" size={16} color="#F59E0B" />
                <Text style={[styles.sectionTitleText, { color: T.text }]}>Profil Complet Proposé</Text>
              </View>
              <InfoRow icon="shopping-bag" label="Nom du magasin"  value={typeof proposed.storeName === 'string' ? proposed.storeName : item.currentStoreName} />
              <InfoRow icon="tag"          label="Catégorie"       value={typeof proposed.category === 'string' ? proposed.category : undefined} />
              <InfoRow icon="file-text"    label="Description"     value={typeof proposed.description === 'string' ? proposed.description : undefined} />
              <InfoRow icon="map-pin"      label="Adresse"         value={typeof proposed.address === 'string' ? proposed.address : undefined} />
              <InfoRow icon="phone"        label="Téléphone"       value={typeof proposed.phone === 'string' ? proposed.phone : undefined} />
              <InfoRow icon="clock"        label="Horaires"        value={typeof proposed.operatingHours === 'string' ? proposed.operatingHours : (proposed.openTime && proposed.closeTime ? `${proposed.openTime} - ${proposed.closeTime}` : undefined)} />
            </View>
          </ScrollView>

          {/* Action Bar — only for pending */}
          {isPending && (
            <View style={[styles.actionBar, { backgroundColor: cardBg, borderTopColor: borderC }]}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(239,68,68,0.08)' }]} onPress={onReject} activeOpacity={0.75}>
                <Feather name="x" size={15} color={Colors.error} />
                <Text style={[styles.actionBtnText, { color: Colors.error }]}>Refuser</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={onApprove} activeOpacity={0.8}>
                <Feather name="check" size={15} color="#FFF" />
                <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Approuver</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    height: '92%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },

  /* Header */
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 10,
  },
  closeBtn:    { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontFamily: Font.bold, fontSize: 15, flex: 1 },
  statusPill:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full, flexShrink: 0 },
  statusText:  { fontFamily: Font.semibold, fontSize: 11 },

  /* Body */
  body: { padding: 14, paddingBottom: 20 },
  bannerImage: { width: '100%', height: 160, borderRadius: Radius.lg, marginBottom: 14 },

  /* Notice */
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: 12,
  },
  noticeText: { fontFamily: Font.medium, fontSize: 13, flex: 1, lineHeight: 18 },

  /* Section */
  section: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitleText: { fontFamily: Font.bold, fontSize: 14 },

  /* Diff Card */
  diffCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: 10,
    marginBottom: 8,
  },
  diffFieldLabel: { fontFamily: Font.semibold, fontSize: 12, marginBottom: 6 },
  diffComparison: { flexDirection: 'row', alignItems: 'center' },
  diffValBox: { flex: 1 },
  diffValHeader: { fontFamily: Font.regular, fontSize: 10, color: '#9CA3AF', marginBottom: 2 },
  diffValText: { fontFamily: Font.medium, fontSize: 12 },
  noDiffText: { fontFamily: Font.regular, fontSize: 13 },

  /* Actions */
  actionBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    gap: 0,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 5,
  },
  approveBtn: { backgroundColor: Colors.green || '#8BC34A' },
  actionBtnText: { fontFamily: Font.semibold, fontSize: 13 },
});
