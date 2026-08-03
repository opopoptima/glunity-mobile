import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ScrollView, Image, useWindowDimensions, Platform,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../../shared/context/theme.context';
import { Colors, Font, Radius, Spacing } from '../../../../shared/utils/theme';
import { ModerationItem } from '../../api/admin.api';
import { formatDateUserFriendly } from '../../../../shared/utils/date.utils';
import { ModerationTimeline, TimelineStatus } from './ModerationTimeline';
import { VerificationChecklist } from './VerificationChecklist';

interface Props {
  visible: boolean;
  item: ModerationItem | null;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onRevision: () => void;
}

const STATUS_META: Record<string, { color: string; bg: string; label: string }> = {
  pending:            { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  label: '⏳ En attente' },
  approved:           { color: '#22C55E', bg: 'rgba(34,197,94,0.12)',   label: '✅ Approuvé' },
  rejected:           { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',   label: '❌ Refusé' },
  revision_requested: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', label: '✏️ Révision' },
  resubmitted:        { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)',  label: '🔄 Renvoyé' },
};

function InfoRow({ icon, label, value }: { icon: string; label: string; value?: unknown }) {
  const { theme: T } = useTheme();
  if (value === undefined || value === null || value === '') return null;
  const safeVal = typeof value === 'object'
    ? ((value as any).name || (value as any).fullName || (value as any).address || JSON.stringify(value))
    : String(value);
  return (
    <View style={rowStyles.row}>
      <View style={rowStyles.iconWrap}>
        <Feather name={icon as any} size={13} color={T.textMuted} />
      </View>
      <View style={rowStyles.content}>
        <Text style={[rowStyles.label, { color: T.textMuted }]}>{label}</Text>
        <Text style={[rowStyles.value, { color: T.text }]}>{safeVal}</Text>
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

function SectionTitle({ title, icon, color }: { title: string; icon: string; color?: string }) {
  const { theme: T } = useTheme();
  const c = color || (Colors.green || '#8BC34A');
  return (
    <View style={sectionStyles.row}>
      <View style={[sectionStyles.icon, { backgroundColor: c + '18' }]}>
        <MaterialCommunityIcons name={icon as any} size={14} color={c} />
      </View>
      <Text style={[sectionStyles.text, { color: T.text }]}>{title}</Text>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, marginTop: 4 },
  icon: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: Font.bold, fontSize: 14 },
});

export function ModerationDetailModal({ visible, item, onClose, onApprove, onReject, onRevision }: Props) {
  const { theme: T, isDark } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const isWide = windowWidth >= 640;

  const primaryGreen = Colors.green || '#8BC34A';
  const cardBg  = isDark ? '#1C1C1E' : '#FFFFFF';
  const sectionBg = isDark ? '#2C2C2E' : 'rgba(46,46,46,0.04)';
  const borderC = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const [activeDetailTab, setActiveDetailTab] = useState<'info' | 'checklist'>('info');

  if (!item) return null;

  const status = STATUS_META[item.moderationStatus] ?? STATUS_META.pending;
  const isProduct = item.type === 'product';
  const isRecipe  = item.type === 'recipe';
  const images    = item.images || (item as any).photos || [];
  const author    = item.sellerName || item.authorName || item.authorOrSeller;
  const isPending = item.moderationStatus === 'pending' || item.moderationStatus === 'resubmitted';

  const renderIdentityCard = () => (
    <View style={[styles.section, { backgroundColor: sectionBg, borderColor: borderC }]}>
      <SectionTitle title="Identité" icon="account-circle-outline" color="#3B82F6" />
      <InfoRow icon="user"         label="Auteur / Vendeur" value={author} />
      <InfoRow icon="mail"         label="Email"            value={item.sellerEmail || (item as any).authorEmail} />
      <InfoRow icon="shopping-bag" label="Boutique"         value={item.shopName} />
      <InfoRow icon="calendar"     label="Soumis le"        value={formatDateUserFriendly(item.date)} />
      {item.moderatedAt ? (
        <InfoRow icon="check-square" label="Modéré le"     value={formatDateUserFriendly(item.moderatedAt)} />
      ) : null}
      {item.moderatedByName ? (
        <InfoRow icon="shield"       label="Modéré par"     value={item.moderatedByName} />
      ) : null}
    </View>
  );

  const renderDetailsCard = () => (
    <>
      {/* Product Specific */}
      {isProduct && (
        <View style={[styles.section, { backgroundColor: sectionBg, borderColor: borderC }]}>
          <SectionTitle title="Détails Produit" icon="food-apple" color={primaryGreen} />
          <InfoRow icon="tag"         label="Catégorie"   value={item.category} />
          <InfoRow icon="dollar-sign" label="Prix"        value={item.price} />
          <InfoRow icon="check-circle"
            label="Sans gluten"
            value={
              (item as any).isGlutenFree === true ? '✅ Oui'
              : (item as any).isGlutenFree === false ? '❌ Non'
              : undefined
            }
          />
          <InfoRow icon="award"
            label="Certifié SG"
            value={
              (item as any).certifiedGF === true ? '✅ Certifié'
              : (item as any).certifiedGF === false ? '⚠️ Non certifié'
              : undefined
            }
          />

          {/* Ingredients */}
          {(item as any).ingredients?.length > 0 && (
            <View style={styles.tagsBlock}>
              <Text style={[styles.tagsLabel, { color: T.textMuted }]}>Ingrédients</Text>
              <View style={styles.tagsRow}>
                {(item as any).ingredients.map((ing: any, i: number) => {
                  const ingLabel = typeof ing === 'string' ? ing : (ing?.name || ing?.ingredient || ing?.title || JSON.stringify(ing));
                  return (
                    <View key={i} style={[styles.tag, { backgroundColor: primaryGreen + '18', borderColor: primaryGreen + '33' }]}>
                      <Text style={[styles.tagText, { color: primaryGreen }]}>{ingLabel}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Recipe Specific */}
      {isRecipe && (
        <View style={[styles.section, { backgroundColor: sectionBg, borderColor: borderC }]}>
          <SectionTitle title="Détails Recette" icon="chef-hat" color="#F59E0B" />
          <InfoRow icon="tag"       label="Catégorie"    value={item.category} />
          <InfoRow icon="file-text" label="Description"  value={(item as any).description} />

          {/* Ingredients */}
          {(item as any).ingredients?.length > 0 && (
            <View style={styles.tagsBlock}>
              <Text style={[styles.tagsLabel, { color: T.textMuted }]}>Ingrédients</Text>
              <View style={styles.tagsRow}>
                {(item as any).ingredients.map((ing: any, i: number) => {
                  const ingLabel = typeof ing === 'string' ? ing : (ing?.name || ing?.ingredient || ing?.title || JSON.stringify(ing));
                  return (
                    <View key={i} style={[styles.tag, { backgroundColor: '#F59E0B18', borderColor: '#F59E0B33' }]}>
                      <Text style={[styles.tagText, { color: '#D97706' }]}>{ingLabel}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Steps */}
          {(item as any).steps?.length > 0 && (
            <View style={styles.stepsBlock}>
              <Text style={[styles.tagsLabel, { color: T.textMuted }]}>Étapes ({(item as any).steps.length})</Text>
              {(item as any).steps.slice(0, 5).map((step: any, i: number) => {
                const stepText = typeof step === 'string' ? step : (step?.description || step?.text || step?.instruction || JSON.stringify(step));
                return (
                  <View key={i} style={styles.stepRow}>
                    <View style={[styles.stepNum, { backgroundColor: primaryGreen + '18' }]}>
                      <Text style={[styles.stepNumText, { color: primaryGreen }]}>{i + 1}</Text>
                    </View>
                    <Text style={[styles.stepText, { color: T.text }]} numberOfLines={3}>
                      {stepText}
                    </Text>
                  </View>
                );
              })}
              {(item as any).steps.length > 5 && (
                <Text style={[styles.moreText, { color: T.textMuted }]}>
                  + {(item as any).steps.length - 5} étapes supplémentaires…
                </Text>
              )}
            </View>
          )}
        </View>
      )}
    </>
  );

  const renderImagesCard = () => (
    images.length > 0 ? (
      <View style={[styles.section, { backgroundColor: sectionBg, borderColor: borderC }]}>
        <SectionTitle title="Visuels" icon="image-outline" color="#EC4899" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.imageScroll}
          contentContainerStyle={styles.imageRow}
        >
          {images.map((uri: string, i: number) => (
            <Image
              key={i}
              source={{ uri }}
              style={styles.image}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      </View>
    ) : null
  );

  const renderNotices = () => (
    <>
      {item.moderationReason ? (
        <View style={[styles.noticeBox, { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }]}>
          <Feather name="alert-circle" size={14} color={Colors.error} />
          <Text style={[styles.noticeText, { color: Colors.error }]}>
            Motif de refus : {item.moderationReason}
          </Text>
        </View>
      ) : null}
      {item.moderationNotes ? (
        <View style={[styles.noticeBox, { backgroundColor: 'rgba(139,92,246,0.08)', borderColor: 'rgba(139,92,246,0.2)' }]}>
          <Feather name="edit-2" size={14} color="#8B5CF6" />
          <Text style={[styles.noticeText, { color: '#8B5CF6' }]}>
            Révision demandée : {item.moderationNotes}
          </Text>
        </View>
      ) : null}
    </>
  );

  const renderTimelineCard = () => (
    <View style={[styles.section, { backgroundColor: sectionBg, borderColor: borderC }]}>
      <SectionTitle title="Historique de modération" icon="timeline-clock-outline" color="#F59E0B" />
      <ModerationTimeline
        currentStatus={item.moderationStatus as TimelineStatus}
        submittedAt={formatDateUserFriendly(item.date)}
        moderatedAt={item.moderatedAt ? formatDateUserFriendly(item.moderatedAt) : undefined}
      />
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: T.bg }]}>
          {/* ── Header ── */}
          <View style={[styles.headerBar, { backgroundColor: cardBg, borderBottomColor: borderC }]}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Feather name="x" size={20} color={T.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: T.text }]} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>

          {/* ── Detail / Checklist tabs ── */}
          <View style={[styles.detailTabs, { backgroundColor: isDark ? '#2C2C2E' : 'rgba(0,0,0,0.04)', borderBottomColor: borderC }]}>
            {(['info', 'checklist'] as const).map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.detailTab, activeDetailTab === tab && { backgroundColor: cardBg }]}
                onPress={() => setActiveDetailTab(tab)}
                activeOpacity={0.7}
              >
                <Feather
                  name={tab === 'info' ? 'file-text' : 'check-square'}
                  size={13}
                  color={activeDetailTab === tab ? primaryGreen : T.textMuted}
                />
                <Text style={[styles.detailTabText, { color: activeDetailTab === tab ? T.text : T.textMuted, fontFamily: activeDetailTab === tab ? Font.semibold : Font.regular }]}>
                  {tab === 'info' ? 'Informations' : 'Checklist'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {activeDetailTab === 'checklist' ? (
              <View style={[styles.section, { backgroundColor: sectionBg, borderColor: borderC }]}>
                <SectionTitle title="Checklist de vérification" icon="clipboard-check-outline" color={primaryGreen} />
                <VerificationChecklist
                  contentType={isProduct ? 'product' : isRecipe ? 'recipe' : 'product'}
                />
              </View>
            ) : isWide ? (
              /* ── 2-COLUMN RESPONSIVE LAYOUT (Wide screens / Web / Desktop) ── */
              <View style={styles.columnsContainer}>
                {/* Left Column: Identité + Details */}
                <View style={styles.column}>
                  {renderIdentityCard()}
                  {renderDetailsCard()}
                </View>

                {/* Right Column: Visuels + Notice + Timeline */}
                <View style={styles.column}>
                  {renderImagesCard()}
                  {renderNotices()}
                  {renderTimelineCard()}
                </View>
              </View>
            ) : (
              /* ── 1-COLUMN MOBILE LAYOUT ── */
              <>
                {renderImagesCard()}
                {renderNotices()}
                {renderIdentityCard()}
                {renderDetailsCard()}
                {renderTimelineCard()}
              </>
            )}
          </ScrollView>

          {/* ── Actions — only for pending/resubmitted ── */}
          {isPending && (
            <View style={[styles.actionBar, { backgroundColor: cardBg, borderTopColor: borderC }]}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(239,68,68,0.08)' }]} onPress={onReject} activeOpacity={0.75}>
                <Feather name="x" size={15} color={Colors.error} />
                <Text style={[styles.actionBtnText, { color: Colors.error }]}>Refuser</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(139,92,246,0.08)' }]} onPress={onRevision} activeOpacity={0.75}>
                <Feather name="edit-2" size={15} color="#8B5CF6" />
                <Text style={[styles.actionBtnText, { color: '#8B5CF6' }]}>Révision</Text>
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
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    height: '92%',
    maxHeight: 880,
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderRadius: Platform.OS === 'web' ? 24 : undefined,
    overflow: 'hidden',
  },

  /* Header */
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 10,
  },
  closeBtn:    { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontFamily: Font.bold, fontSize: 16, flex: 1 },
  statusPill:  { paddingHorizontal: 11, paddingVertical: 5, borderRadius: Radius.full, flexShrink: 0 },
  statusText:  { fontFamily: Font.semibold, fontSize: 12 },

  /* Body */
  body: { padding: 16, paddingBottom: 24 },

  /* 2-Column Responsive Layout */
  columnsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  column: {
    flex: 1,
  },

  /* Images */
  imageScroll: { marginBottom: 4 },
  imageRow:    { gap: 8 },
  image:       { width: 140, height: 140, borderRadius: Radius.lg },

  /* Notice boxes */
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
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

  /* Tags */
  tagsBlock: { marginTop: 4 },
  tagsLabel: { fontFamily: Font.regular, fontSize: 11, marginBottom: 6 },
  tagsRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag:       { paddingHorizontal: 9, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1 },
  tagText:   { fontFamily: Font.medium, fontSize: 12 },

  /* Steps */
  stepsBlock: { marginTop: 10 },
  stepRow:    { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, gap: 8 },
  stepNum:    { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNumText:{ fontFamily: Font.bold, fontSize: 12 },
  stepText:   { fontFamily: Font.regular, fontSize: 13, flex: 1, lineHeight: 18 },
  moreText:   { fontFamily: Font.regular, fontSize: 12 },

  /* Detail tabs */
  detailTabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: Radius.md,
    padding: 3,
    gap: 2,
    borderBottomWidth: 0,
  },
  detailTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: Radius.sm,
    gap: 5,
  },
  detailTabText: { fontSize: 13 },

  /* Action bar */
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
  approveBtn:     { backgroundColor: Colors.green || '#8BC34A' },
  actionBtnText:  { fontFamily: Font.semibold, fontSize: 13 },
});
