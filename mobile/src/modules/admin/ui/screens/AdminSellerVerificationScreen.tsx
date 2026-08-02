import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity,
} from 'react-native';
import { Feather, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../../shared/context/theme.context';
import { Colors, Font, Spacing, Radius } from '../../../../shared/utils/theme';
import { useSellerVerification } from '../../hooks/useSellerVerification';
import { SellerDossierCard } from '../components/SellerDossierCard';
import { DossierActionModal } from '../components/DossierActionModal';
import { SkeletonCard } from '../components/SkeletonCard';
import { useLanguage } from '../../../../shared/context/language.context';
import { ModerationStatus } from '../../api/admin.api';

const STATUS_FILTERS: { id: ModerationStatus | 'all'; label: string; color: string }[] = [
  { id: 'pending',            label: 'En attente', color: '#F59E0B' },
  { id: 'revision_requested', label: 'Révision',   color: '#8B5CF6' },
  { id: 'approved',           label: 'Approuvés',  color: '#22C55E' },
  { id: 'rejected',           label: 'Refusés',    color: '#EF4444' },
  { id: 'all',                label: 'Tout',       color: '#6B7280' },
];

export function AdminSellerVerificationScreen({ navigation }: any) {
  const { theme: T, isDark } = useTheme();
  const { t } = useLanguage();
  const primaryGreen = Colors.green || '#8BC34A';
  const { sellers, total, loading, statusFilter, setStatusFilter, refresh, modal } = useSellerVerification();

  const cardBg  = isDark ? '#1C1C1E' : '#FFFFFF';
  const borderC = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: T.bg }]}>
      {/* ─── Header ─────────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: borderC }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation?.goBack()}>
          <Feather name="arrow-left" size={20} color={T.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            <MaterialIcons name="verified" size={18} color="#3B82F6" />
            <Text style={[styles.headerTitle, { color: T.text }]}>Vérification Vendeurs</Text>
          </View>
          <Text style={[styles.headerSub, { color: T.textMuted }]}>
            {total > 0 ? `${total} dossier${total > 1 ? 's' : ''}` : 'Audit KBIs & certifications sans gluten'}
          </Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={refresh}>
          <Feather name="refresh-cw" size={18} color={T.textMuted} />
        </TouchableOpacity>
      </View>

      {/* ─── Status Tabs ─────────────────────────────────────── */}
      <View style={[styles.statusBar, { borderBottomColor: borderC }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusRow}>
          {STATUS_FILTERS.map(s => {
            const isActive = statusFilter === s.id;
            return (
              <TouchableOpacity
                key={s.id}
                style={styles.statusTab}
                onPress={() => setStatusFilter(s.id as ModerationStatus)}
                activeOpacity={0.7}
              >
                <Text style={[styles.statusLabel, {
                  color: isActive ? s.color : T.textMuted,
                  fontFamily: isActive ? Font.semibold : Font.regular,
                }]}>
                  {s.label}
                </Text>
                {isActive && (
                  <View style={[styles.statusUnderline, { backgroundColor: s.color }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ─── Content ─────────────────────────────────────────── */}
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {loading ? (
          <><SkeletonCard height={140} /><SkeletonCard height={140} /><SkeletonCard height={140} /></>
        ) : sellers.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={[styles.emptyIcon, { backgroundColor: Colors.greenLight }]}>
              <Feather name="shield" size={30} color={primaryGreen} />
            </View>
            <Text style={[styles.emptyTitle, { color: T.text }]}>Aucun dossier</Text>
            <Text style={[styles.emptyDesc, { color: T.textMuted }]}>
              Tous les dossiers vendeurs ont été traités dans cette catégorie.
            </Text>
          </View>
        ) : (
          sellers.map(s => (
            <SellerDossierCard
              key={s.id}
              seller={s}
              onOpenDetails={() => modal.handleOpenDetails(s)}
              onApprove={() => modal.handleOpenAction(s, 'approve')}
              onRevision={() => modal.handleOpenAction(s, 'revision')}
              onReject={() => modal.handleOpenAction(s, 'reject')}
              onRevoke={() => modal.handleOpenAction(s, 'revoke')}
            />
          ))
        )}
      </ScrollView>

      <DossierActionModal
        modalType={modal.type}
        onClose={() => modal.setType(null)}
        seller={modal.selectedSeller}
        actionKind={modal.actionKind}
        remarks={modal.remarks}
        setRemarks={modal.setRemarks}
        onConfirmAction={modal.handleConfirmAction}
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
  iconBtn:       { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  headerCenter:  { flex: 1, alignItems: 'center' },
  headerTitleRow:{ flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle:   { fontFamily: Font.bold, fontSize: 17 },
  headerSub:     { fontFamily: Font.regular, fontSize: 12, marginTop: 1 },
  statusBar:     { borderBottomWidth: 1 },
  statusRow:     { paddingHorizontal: Spacing.md, gap: 4 },
  statusTab:     { paddingHorizontal: 10, paddingBottom: 10, paddingTop: 10, alignItems: 'center', position: 'relative' },
  statusLabel:   { fontSize: 13 },
  statusUnderline: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2.5, borderRadius: 2 },
  list:          { padding: Spacing.md, paddingBottom: 120 },
  emptyBox:      { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xxl, marginTop: Spacing.lg },
  emptyIcon:     { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  emptyTitle:    { fontFamily: Font.bold, fontSize: 17, marginBottom: 6 },
  emptyDesc:     { fontFamily: Font.regular, fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
