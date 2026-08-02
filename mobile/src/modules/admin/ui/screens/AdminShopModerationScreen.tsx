import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Modal, TextInput,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../../shared/context/theme.context';
import { Colors, Font, Radius, Spacing } from '../../../../shared/utils/theme';
import { useShopModeration } from '../../hooks/useShopModeration';
import { SkeletonCard } from '../components/SkeletonCard';
import { ShopModerationItem } from '../../api/admin.api';
import { formatDateUserFriendly } from '../../../../shared/utils/date.utils';
import { ShopDetailModal } from '../components/ShopDetailModal';

const STATUS_META: Record<string, { color: string; bg: string; label: string }> = {
  pending:  { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  label: 'En attente' },
  approved: { color: '#22C55E', bg: 'rgba(34,197,94,0.1)',   label: 'Approuvée' },
  rejected: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   label: 'Refusée' },
};

function FieldDiffRow({ field, oldValue, newValue }: { field: string; oldValue: unknown; newValue: unknown }) {
  const { theme: T, isDark } = useTheme();
  const primaryGreen = Colors.green || '#8BC34A';
  return (
    <View style={diffStyles.row}>
      <Text style={[diffStyles.field, { color: T.textMuted }]}>{field}</Text>
      <View style={diffStyles.values}>
        <Text style={[diffStyles.old, { color: Colors.error }]} numberOfLines={1}>
          {String(oldValue ?? '—')}
        </Text>
        <Feather name="arrow-right" size={11} color={T.textMuted} style={{ marginHorizontal: 5 }} />
        <Text style={[diffStyles.new, { color: primaryGreen }]} numberOfLines={1}>
          {String(newValue ?? '—')}
        </Text>
      </View>
    </View>
  );
}

const diffStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, gap: 8 },
  field: { fontFamily: Font.medium, fontSize: 12, width: 80 },
  values: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  old: { fontFamily: Font.regular, fontSize: 12, flex: 1 },
  new: { fontFamily: Font.semibold, fontSize: 12, flex: 1 },
});

function ShopUpdateCard({
  item,
  onApprove,
  onReject,
  onViewDetail,
}: {
  item: ShopModerationItem;
  onApprove: () => void;
  onReject: () => void;
  onViewDetail?: () => void;
}) {
  const { theme: T, isDark } = useTheme();
  const primaryGreen = Colors.green || '#8BC34A';
  const cardBg  = isDark ? '#1C1C1E' : '#FFFFFF';
  const borderC = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
  const diffBg  = isDark ? '#2C2C2E' : 'rgba(46,46,46,0.03)';
  const s = STATUS_META[item.moderationStatus] ?? STATUS_META.pending;

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderC }]}>
      {/* Header */}
      <View style={styles.cardTop}>
        <View style={[styles.shopIcon, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
          <MaterialCommunityIcons name="store-edit-outline" size={20} color="#3B82F6" />
        </View>
        <View style={styles.shopInfo}>
          <Text style={[styles.shopName, { color: T.text }]} numberOfLines={1}>
            {item.currentStoreName || item.sellerName}
          </Text>
          <Text style={[styles.shopOwner, { color: T.textMuted }]} numberOfLines={1}>
            {item.sellerName} · {item.sellerEmail}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: s.bg }]}>
          <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
        </View>
      </View>

      {/* Diff block */}
      {item.changedFields && item.changedFields.length > 0 ? (
        <View style={[styles.diffBlock, { backgroundColor: diffBg, borderColor: borderC }]}>
          <View style={styles.diffHeader}>
            <MaterialCommunityIcons name="swap-horizontal" size={14} color={T.textMuted} />
            <Text style={[styles.diffTitle, { color: T.text }]}>
              {item.changedFields.length} champ{item.changedFields.length > 1 ? 's' : ''} modifié{item.changedFields.length > 1 ? 's' : ''}
            </Text>
          </View>
          {item.changedFields.slice(0, 4).map(cf => (
            <FieldDiffRow key={cf.field} field={cf.field} oldValue={cf.oldValue} newValue={cf.newValue} />
          ))}
          {item.changedFields.length > 4 && (
            <Text style={[styles.moreText, { color: T.textMuted }]}>
              + {item.changedFields.length - 4} autres champs…
            </Text>
          )}
        </View>
      ) : null}

      {/* View Details Button */}
      {onViewDetail ? (
        <TouchableOpacity
          style={[styles.detailBtn, { borderColor: borderC }]}
          onPress={onViewDetail}
          activeOpacity={0.7}
        >
          <Feather name="eye" size={13} color={T.textMuted} />
          <Text style={[styles.detailBtnText, { color: T.textMuted }]}>Voir les détails complets de la boutique</Text>
          <Feather name="chevron-right" size={13} color={T.textMuted} />
        </TouchableOpacity>
      ) : null}

      <Text style={[styles.dateText, { color: T.textMuted }]}>
        Soumis {formatDateUserFriendly(item.submittedAt)}
      </Text>

      {/* Actions — only for pending */}
      {item.moderationStatus === 'pending' && (
        <>
          <View style={[styles.divider, { backgroundColor: borderC }]} />
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(239,68,68,0.07)' }]} onPress={onReject} activeOpacity={0.75}>
              <Feather name="x" size={14} color={Colors.error} />
              <Text style={[styles.actionBtnText, { color: Colors.error }]}>Refuser</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(139,195,74,0.09)' }]} onPress={onApprove} activeOpacity={0.75}>
              <Feather name="check" size={14} color={primaryGreen} />
              <Text style={[styles.actionBtnText, { color: primaryGreen }]}>Approuver</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}


const STATUS_FILTERS = [
  { id: 'pending',  label: 'En attente', color: '#F59E0B' },
  { id: 'approved', label: 'Approuvées', color: '#22C55E' },
  { id: 'rejected', label: 'Refusées',   color: '#EF4444' },
  { id: 'all',      label: 'Tout',       color: '#6B7280' },
];

export function AdminShopModerationScreen({ navigation }: any) {
  const { theme: T, isDark } = useTheme();
  const primaryGreen = Colors.green || '#8BC34A';
  const cardBg  = isDark ? '#1C1C1E' : '#FFFFFF';
  const borderC = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const inputBg = isDark ? '#2C2C2E' : 'rgba(46,46,46,0.05)';

  const { items, total, loading, statusFilter, setStatusFilter, refresh, modal, detail } = useShopModeration();

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: T.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: borderC }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation?.goBack()}>
          <Feather name="arrow-left" size={20} color={T.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: T.text }]}>Mises à jour Boutiques</Text>
          <Text style={[styles.headerSub, { color: T.textMuted }]}>
            {total > 0 ? `${total} demande${total > 1 ? 's' : ''}` : 'Modifications soumises par les vendeurs'}
          </Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={refresh}>
          <Feather name="refresh-cw" size={18} color={T.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Status Tabs */}
      <View style={[styles.statusBar, { borderBottomColor: borderC }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusRow}>
          {STATUS_FILTERS.map(s => {
            const isActive = statusFilter === s.id;
            return (
              <TouchableOpacity key={s.id} style={styles.statusTab} onPress={() => setStatusFilter(s.id as any)} activeOpacity={0.7}>
                <Text style={[styles.statusLabel, {
                  color: isActive ? s.color : T.textMuted,
                  fontFamily: isActive ? Font.semibold : Font.regular,
                }]}>{s.label}</Text>
                {isActive && <View style={[styles.statusUnderline, { backgroundColor: s.color }]} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* List */}
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {loading ? (
          <><SkeletonCard height={150} /><SkeletonCard height={150} /></>
        ) : items.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={[styles.emptyIcon, { backgroundColor: Colors.greenLight }]}>
              <MaterialCommunityIcons name="store-check-outline" size={30} color={primaryGreen} />
            </View>
            <Text style={[styles.emptyTitle, { color: T.text }]}>Aucune mise à jour</Text>
            <Text style={[styles.emptyDesc, { color: T.textMuted }]}>Aucune modification de boutique en attente.</Text>
          </View>
        ) : (
          items.map(item => (
            <ShopUpdateCard
              key={item.id}
              item={item}
              onApprove={() => modal.handleOpenAction(item, 'approve')}
              onReject={() => modal.handleOpenAction(item, 'reject')}
              onViewDetail={() => detail.open(item)}
            />
          ))
        )}
      </ScrollView>

      {/* Confirm Modal */}
      <Modal visible={modal.visible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.modalCard, { backgroundColor: cardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: T.text }]}>
                {modal.actionType === 'reject' ? 'Motif de refus' : 'Confirmer l\'approbation'}
              </Text>
              <TouchableOpacity onPress={() => modal.setVisible(false)}>
                <Feather name="x" size={20} color={T.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalDesc, { color: T.textMuted }]}>
              {modal.actionType === 'approve'
                ? `Les modifications de "${modal.selectedItem?.sellerName}" seront appliquées immédiatement.`
                : `Expliquez pourquoi la demande de "${modal.selectedItem?.sellerName}" est refusée.`}
            </Text>
            {modal.actionType === 'reject' && (
              <TextInput
                style={[styles.textInput, { color: T.text, backgroundColor: inputBg, borderColor: borderC }]}
                placeholder="Motif du refus..."
                placeholderTextColor={T.textMuted}
                multiline
                numberOfLines={3}
                value={modal.rejectReason}
                onChangeText={modal.setRejectReason}
              />
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: inputBg }]} onPress={() => modal.setVisible(false)}>
                <Text style={[styles.modalBtnText, { color: T.text }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: modal.actionType === 'approve' ? primaryGreen : Colors.error }]}
                onPress={modal.handleConfirmAction}
              >
                <Text style={[styles.modalBtnText, { color: '#FFF' }]}>
                  {modal.actionType === 'approve' ? 'Approuver' : 'Refuser'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Detail Modal */}
      <ShopDetailModal
        visible={detail.visible}
        item={detail.item}
        onClose={() => detail.setVisible(false)}
        onApprove={() => {
          detail.setVisible(false);
          if (detail.item) modal.handleOpenAction(detail.item, 'approve');
        }}
        onReject={() => {
          detail.setVisible(false);
          if (detail.item) modal.handleOpenAction(detail.item, 'reject');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1,
  },
  iconBtn:     { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  headerCenter:{ flex: 1, alignItems: 'center' },
  headerTitle: { fontFamily: Font.bold, fontSize: 17 },
  headerSub:   { fontFamily: Font.regular, fontSize: 12, marginTop: 1 },
  statusBar:   { borderBottomWidth: 1 },
  statusRow:   { paddingHorizontal: Spacing.md, gap: 4 },
  statusTab:   { paddingHorizontal: 10, paddingBottom: 10, paddingTop: 10, alignItems: 'center', position: 'relative' },
  statusLabel: { fontSize: 13 },
  statusUnderline: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2.5, borderRadius: 2 },
  list:        { padding: Spacing.md, paddingBottom: 120 },

  /* Card */
  card: { borderRadius: Radius.lg, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  cardTop:     { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 10 },
  shopIcon:    { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  shopInfo:    { flex: 1 },
  shopName:    { fontFamily: Font.semibold, fontSize: 14, lineHeight: 20 },
  shopOwner:   { fontFamily: Font.regular, fontSize: 12, marginTop: 2 },
  badge:       { paddingHorizontal: 9, paddingVertical: 4, borderRadius: Radius.full, alignSelf: 'flex-start', flexShrink: 0 },
  badgeText:   { fontFamily: Font.semibold, fontSize: 11 },

  /* Diff block */
  diffBlock: {
    marginHorizontal: 14, marginBottom: 10,
    borderRadius: Radius.md, borderWidth: 1, padding: 10,
  },
  diffHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  diffTitle:  { fontFamily: Font.semibold, fontSize: 13 },
  moreText:   { fontFamily: Font.regular, fontSize: 12, marginTop: 4 },

  /* Detail button */
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderTopWidth: 1,
    gap: 6,
  },
  detailBtnText: { fontFamily: Font.medium, fontSize: 12, flex: 1 },

  dateText:   { fontFamily: Font.regular, fontSize: 12, paddingHorizontal: 14, paddingBottom: 10, },
  divider:    { height: 1 },
  actions:    { flexDirection: 'row' },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 13, gap: 5,
  },
  actionBtnText: { fontFamily: Font.semibold, fontSize: 13 },

  /* Empty */
  emptyBox:  { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xxl, marginTop: Spacing.lg },
  emptyIcon: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  emptyTitle:{ fontFamily: Font.bold, fontSize: 17, marginBottom: 6 },
  emptyDesc: { fontFamily: Font.regular, fontSize: 14, textAlign: 'center', lineHeight: 20 },

  /* Modal */
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard:   { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitle:  { fontFamily: Font.bold, fontSize: 18 },
  modalDesc:   { fontFamily: Font.regular, fontSize: 14, lineHeight: 20, marginBottom: 14 },
  textInput: {
    borderWidth: 1, borderRadius: Radius.md, padding: 12,
    fontFamily: Font.regular, fontSize: 14, minHeight: 80,
    textAlignVertical: 'top', marginBottom: 14,
  },
  modalActions:  { flexDirection: 'row', gap: 10 },
  modalBtn:      { flex: 1, paddingVertical: 13, borderRadius: Radius.md, alignItems: 'center' },
  modalBtnText:  { fontFamily: Font.semibold, fontSize: 14 },
});
