import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../../shared/context/theme.context';
import { Colors, Font, Radius, Spacing } from '../../../../shared/utils/theme';
import { useAdminUserDetail } from '../../hooks/useAdminUserDetail';
import { SkeletonCard } from '../components/SkeletonCard';

// Reusable refactored modular components
import { UserHeaderCard } from '../components/UserHeaderCard';
import { RiskAnalysisCard } from '../components/RiskAnalysisCard';
import { StatisticsGrid } from '../components/StatisticsGrid';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { ReportsSection } from '../components/ReportsSection';
import { ModerationHistory } from '../components/ModerationHistory';
import { UserActionMenu } from '../components/UserActionMenu';

export function AdminUserModerationScreen({ route, navigation }: any) {
  const { theme: T, isDark } = useTheme();
  const primaryGreen = Colors.green || '#8BC34A';

  // Get user ID from route parameters
  const routeUser = route?.params?.user;
  const routeUserId = route?.params?.userId || routeUser?.id;

  if (!routeUserId) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: T.bg }]}>
        <Text style={{ color: T.text, fontFamily: Font.family }}>
          Identifiant de membre manquant.
        </Text>
      </SafeAreaView>
    );
  }

  // Bind the state controller hook using route userId
  const {
    user,
    enriched,
    loading,
    refreshing,
    error,
    activeTab,
    setActiveTab,
    menuVisible,
    setMenuVisible,
    refresh,

    // Suspension modal inputs
    suspendModalVisible,
    setSuspendModalVisible,
    suspendReason,
    setSuspendReason,
    suspendDuration,
    setSuspendDuration,
    suspendNotes,
    setSuspendNotes,
    handleSuspendUser,
    handleReactivateUser,

    // Warning modal inputs
    warningModalVisible,
    setWarningModalVisible,
    warningMessage,
    setWarningMessage,
    handleSendWarning,

    // Role modal inputs
    roleModalVisible,
    setRoleModalVisible,
    handleChangeRole,

    // Directly action methods
    handleResetPassword,
    handleDeleteAccount,
    handleExportData,
  } = useAdminUserDetail(routeUserId);

  // Fallback if loading fails or initial load
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: T.bg }]}>
        {/* AppBar (Back, Title) */}
        <View style={[styles.header, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Feather name="chevron-left" size={22} color={T.text} />
            <Text style={[styles.backText, { color: T.text }]}>Retour</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: T.text }]}>Modération</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Skeleton loaders */}
        <ScrollView style={styles.scrollContent}>
          <SkeletonCard height={140} />
          <SkeletonCard height={110} />
          <SkeletonCard height={160} />
          <SkeletonCard height={120} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Error state layout
  if (error || !enriched || !user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: T.bg }]}>
        <View style={[styles.header, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Feather name="chevron-left" size={22} color={T.text} />
            <Text style={[styles.backText, { color: T.text }]}>Retour</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: T.text }]}>Modération</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.errorBox}>
          <Feather name="alert-octagon" size={42} color="#EF4444" />
          <Text style={[styles.errorText, { color: T.text }]}>{error || "Erreur de chargement."}</Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: primaryGreen }]}
            onPress={() => refresh()}
          >
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { stats, risk, timeline, tabsData, reports, history, phone, location, accountAge, lastActiveLabel } = enriched;

  // Helper for rendering generic preview card rows
  const renderPreviewList = (items: any[], emptyLabel: string) => {
    if (!items || items.length === 0) {
      return (
        <View style={styles.emptyTabBox}>
          <Text style={[styles.emptyTabText, { color: T.textMuted }]}>{emptyLabel}</Text>
        </View>
      );
    }

    return items.map((item, idx) => (
      <View
        key={item.id || idx}
        style={[
          styles.previewCard,
          {
            backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
          },
        ]}
      >
        <View style={styles.previewHeader}>
          <Text style={[styles.previewTitle, { color: T.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          {item.status && (
            <View style={[styles.previewStatusBadge, { backgroundColor: item.status === 'Reported' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0,0,0,0.04)' }]}>
              <Text style={[styles.previewStatusText, { color: item.status === 'Reported' ? '#EF4444' : T.textMuted }]}>
                {item.status}
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.previewText, { color: T.textSub }]} numberOfLines={3}>
          {item.previewText}
        </Text>
        <View style={styles.previewFooter}>
          <Text style={[styles.previewMetaText, { color: T.textMuted }]}>{item.date}</Text>
          {item.extraInfo && (
            <Text style={[styles.previewMetaText, { color: T.textMuted }]}>• {item.extraInfo}</Text>
          )}
          <TouchableOpacity
            style={styles.previewAction}
            onPress={() => Alert.alert('Inspecter', `Inspection du contenu : ${item.title}`)}
          >
            <Text style={[styles.previewActionText, { color: primaryGreen }]}>Voir en détail</Text>
            <Feather name="chevron-right" size={12} color={primaryGreen} />
          </TouchableOpacity>
        </View>
      </View>
    ));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: T.bg }]}>
      {/* 5. Better Header (Left: Back, Center: Modération title, Right: ⋮ More Actions) */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={22} color={T.text} />
          <Text style={[styles.backText, { color: T.text }]}>Retour</Text>
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: T.text }]}>Centre de Modération</Text>
        
        <TouchableOpacity
          style={styles.moreBtn}
          onPress={() => setMenuVisible(true)}
          activeOpacity={0.7}
        >
          <Feather name="more-vertical" size={22} color={T.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[primaryGreen]} />
        }
      >
        {/* User Header Info Card */}
        <UserHeaderCard
          user={user}
          phone={phone}
          location={location}
          accountAge={accountAge}
          lastActiveLabel={lastActiveLabel}
        />

        {/* Risk Analysis Card */}
        <RiskAnalysisCard risk={risk} />

        {/* Statistics Grid */}
        <StatisticsGrid stats={stats} />

        {/* Activity Timeline */}
        <ActivityTimeline timeline={timeline} />

        {/* Content Tabs */}
        {(() => {
          const tabItems = [
            { id: 'posts', label: `Posts (${tabsData.posts?.length || 0})` },
            { id: 'comments', label: `Commentaires (${tabsData.comments?.length || 0})` },
            { id: 'events', label: `Événements (${tabsData.events?.length || 0})` },
          ];

          if (user.profileType === 'pro_commerce') {
            tabItems.push({ id: 'marketplace', label: `Boutique (${tabsData.marketplace?.length || 0})` });
          }

          if (tabsData.reviews && tabsData.reviews.length > 0) {
            tabItems.push({ id: 'reviews', label: `Avis (${tabsData.reviews.length})` });
          }

          if (tabsData.purchases && tabsData.purchases.length > 0) {
            tabItems.push({ id: 'purchases', label: `Achats (${tabsData.purchases.length})` });
          }

          tabItems.push(
            { id: 'reports', label: `Signalements (${reports?.length || 0})` },
            { id: 'history', label: `Modération (${history?.length || 0})` }
          );

          const resolvedActiveTab = tabItems.some((t) => t.id === activeTab)
            ? activeTab
            : tabItems[0]?.id || 'posts';

          return (
            <>
              <View style={styles.tabsStickyWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
                  {tabItems.map((tab) => {
                    const isActive = resolvedActiveTab === tab.id;
                    return (
                      <TouchableOpacity
                        key={tab.id}
                        style={[
                          styles.tabItem,
                          isActive && { borderBottomColor: primaryGreen },
                        ]}
                        onPress={() => setActiveTab(tab.id as any)}
                      >
                        <Text
                          style={[
                            styles.tabItemText,
                            { color: isActive ? primaryGreen : T.textMuted },
                            isActive && { fontWeight: '700' },
                          ]}
                        >
                          {tab.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Active Tab Preview list rendering */}
              <View style={styles.tabContentBlock}>
                {resolvedActiveTab === 'posts' && renderPreviewList(tabsData.posts, 'Aucun post publié')}
                {resolvedActiveTab === 'comments' && renderPreviewList(tabsData.comments, 'Aucun commentaire publié')}
                {resolvedActiveTab === 'events' && renderPreviewList(tabsData.events, 'Aucun événement créé')}
                {resolvedActiveTab === 'marketplace' && renderPreviewList(tabsData.marketplace, 'Aucun produit publié')}
                {resolvedActiveTab === 'reviews' && renderPreviewList(tabsData.reviews, 'Aucun avis publié')}
                {resolvedActiveTab === 'purchases' && renderPreviewList(tabsData.purchases, 'Aucun achat effectué')}
                {resolvedActiveTab === 'reports' && <ReportsSection reports={reports} />}
                {resolvedActiveTab === 'history' && <ModerationHistory history={history} />}
              </View>
            </>
          );
        })()}
      </ScrollView>

      {/* 3. Bottom Overflow Action Sheet Menu Component */}
      <UserActionMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        user={user}
        onSendWarning={() => setWarningModalVisible(true)}
        onSuspend={() => setSuspendModalVisible(true)}
        onReactivate={handleReactivateUser}
        onChangeRole={() => setRoleModalVisible(true)}
        onResetPassword={handleResetPassword}
        onExportData={handleExportData}
        onDeleteAccount={handleDeleteAccount}
      />

      {/* SUSPENSION CONFIRMATION MODAL */}
      <Modal
        visible={suspendModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSuspendModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: isDark ? '#1A1A1D' : '#FFFFFF' }]}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalHeaderTitleBox}>
                <Feather name="user-x" size={18} color="#EF4444" />
                <Text style={[styles.modalTitle, { color: T.text }]}>Confirmer la Suspension</Text>
              </View>
              <TouchableOpacity onPress={() => setSuspendModalVisible(false)} style={{ padding: 4 }}>
                <Feather name="x" size={18} color={T.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSub, { color: T.textMuted }]}>
              Veuillez spécifier la raison et la durée de la suspension pour le membre {user.fullName}.
            </Text>

            {/* Reason selector chips */}
            <Text style={[styles.modalSectionLabel, { color: T.textSub }]}>Motif de la suspension</Text>
            <View style={styles.modalSelectorRow}>
              {['Spam', 'Harassment', 'Fake Account', 'Hate Speech', 'Scam', 'Inappropriate Content', 'Other'].map((reason) => {
                const isSelected = suspendReason === reason;
                return (
                  <TouchableOpacity
                    key={reason}
                    style={[
                      styles.modalSelectorChip,
                      {
                        backgroundColor: isSelected ? 'rgba(239, 68, 68, 0.12)' : isDark ? '#252528' : '#F3F4F6',
                        borderColor: isSelected ? '#EF4444' : 'transparent',
                      },
                    ]}
                    onPress={() => setSuspendReason(reason as any)}
                  >
                    <Text style={[styles.modalSelectorText, { color: isSelected ? '#EF4444' : T.textSub, fontWeight: isSelected ? '700' : '400' }]}>
                      {reason}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Duration selector chips */}
            <Text style={[styles.modalSectionLabel, { color: T.textSub }]}>Durée de suspension</Text>
            <View style={styles.modalSelectorRow}>
              {['24 Hours', '7 Days', '30 Days', 'Permanent'].map((duration) => {
                const isSelected = suspendDuration === duration;
                return (
                  <TouchableOpacity
                    key={duration}
                    style={[
                      styles.modalSelectorChip,
                      {
                        backgroundColor: isSelected ? 'rgba(239, 68, 68, 0.12)' : isDark ? '#252528' : '#F3F4F6',
                        borderColor: isSelected ? '#EF4444' : 'transparent',
                      },
                    ]}
                    onPress={() => setSuspendDuration(duration as any)}
                  >
                    <Text style={[styles.modalSelectorText, { color: isSelected ? '#EF4444' : T.textSub, fontWeight: isSelected ? '700' : '400' }]}>
                      {duration}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Internal notes */}
            <Text style={[styles.modalSectionLabel, { color: T.textSub }]}>Notes de modération internes (Obligatoire)</Text>
            <TextInput
              style={[
                styles.modalTextInput,
                {
                  color: T.text,
                  backgroundColor: isDark ? '#252528' : '#F9FAFB',
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                },
              ]}
              multiline
              numberOfLines={4}
              placeholder="Saisissez des notes détaillées justifiant l'application de cette sanction..."
              placeholderTextColor={T.textMuted}
              value={suspendNotes}
              onChangeText={setSuspendNotes}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: isDark ? '#252528' : '#F3F4F6' }]}
                onPress={() => setSuspendModalVisible(false)}
              >
                <Text style={[styles.modalActionBtnText, { color: T.text }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: '#EF4444' }]}
                onPress={handleSuspendUser}
              >
                <Text style={[styles.modalActionBtnText, { color: '#FFF' }]}>Suspendre le membre</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* WARNING POPUP MODAL */}
      <Modal
        visible={warningModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setWarningModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: isDark ? '#1A1A1D' : '#FFFFFF' }]}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalHeaderTitleBox}>
                <Feather name="bell" size={18} color="#F59E0B" />
                <Text style={[styles.modalTitle, { color: T.text }]}>Envoyer un Avertissement</Text>
              </View>
              <TouchableOpacity onPress={() => setWarningModalVisible(false)} style={{ padding: 4 }}>
                <Feather name="x" size={18} color={T.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSectionLabel, { color: T.textSub }]}>Message d'avertissement officiel</Text>
            <TextInput
              style={[
                styles.modalTextInput,
                {
                  color: T.text,
                  backgroundColor: isDark ? '#252528' : '#F9FAFB',
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                },
              ]}
              multiline
              numberOfLines={4}
              placeholder="Veuillez détailler le comportement inapproprié..."
              placeholderTextColor={T.textMuted}
              value={warningMessage}
              onChangeText={setWarningMessage}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: isDark ? '#252528' : '#F3F4F6' }]}
                onPress={() => setWarningModalVisible(false)}
              >
                <Text style={[styles.modalActionBtnText, { color: T.text }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: '#F59E0B' }]}
                onPress={handleSendWarning}
              >
                <Text style={[styles.modalActionBtnText, { color: '#FFF' }]}>Envoyer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CHANGE ROLE MODAL */}
      <Modal
        visible={roleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRoleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: isDark ? '#1A1A1D' : '#FFFFFF' }]}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalHeaderTitleBox}>
                <Feather name="shield" size={18} color={primaryGreen} />
                <Text style={[styles.modalTitle, { color: T.text }]}>Modifier le Rôle</Text>
              </View>
              <TouchableOpacity onPress={() => setRoleModalVisible(false)} style={{ padding: 4 }}>
                <Feather name="x" size={18} color={T.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 8, marginTop: 12 }}>
              {[
                { id: 'celiac', name: 'Patient Cœliaque' },
                { id: 'pro_commerce', name: 'Commerçant / Vendeur' },
                { id: 'pro_health', name: 'Professionnel Santé' },
                { id: 'admin', name: 'Administrateur' },
              ].map((roleObj) => (
                <TouchableOpacity
                  key={roleObj.id}
                  style={[
                    styles.roleRowItem,
                    {
                      backgroundColor: user.profileType === roleObj.id ? 'rgba(109, 174, 63, 0.08)' : isDark ? '#252528' : '#F9FAFB',
                      borderColor: user.profileType === roleObj.id ? primaryGreen : 'transparent',
                    },
                  ]}
                  onPress={() => handleChangeRole(roleObj.id as any)}
                >
                  <Text style={[styles.roleRowText, { color: user.profileType === roleObj.id ? primaryGreen : T.text, fontWeight: user.profileType === roleObj.id ? '700' : '400' }]}>
                    {roleObj.name}
                  </Text>
                  {user.profileType === roleObj.id && <Feather name="check" size={16} color={primaryGreen} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  backText: {
    fontSize: 14.5,
    fontFamily: Font.family,
    fontWeight: '600',
    marginLeft: 2,
  },
  headerTitle: {
    fontFamily: Font.family,
    fontWeight: '700',
    fontSize: 16.5,
    textAlign: 'center',
    flex: 1,
  },
  moreBtn: {
    width: 80,
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: 60,
  },
  errorBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    gap: 16,
  },
  errorText: {
    fontSize: 14.5,
    fontFamily: Font.family,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: Radius.full,
  },
  retryText: {
    color: '#FFF',
    fontFamily: Font.family,
    fontWeight: '700',
    fontSize: 13.5,
  },
  tabsStickyWrapper: {
    marginVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tabsContainer: {
    gap: 20,
    paddingBottom: 2,
  },
  tabItem: {
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemText: {
    fontFamily: Font.family,
    fontSize: 13.5,
  },
  tabContentBlock: {
    marginTop: Spacing.xs,
  },
  emptyTabBox: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTabText: {
    fontSize: 12.5,
  },
  previewCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  previewTitle: {
    fontWeight: '700',
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  previewStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  previewStatusText: {
    fontSize: 9.5,
  },
  previewText: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  previewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.04)',
    paddingTop: 8,
  },
  previewMetaText: {
    fontSize: 11,
    marginRight: 6,
  },
  previewAction: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  previewActionText: {
    fontWeight: '700',
    fontSize: 11.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalHeaderTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontWeight: '700',
    fontSize: 16.5,
  },
  modalSub: {
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 14,
  },
  modalSectionLabel: {
    fontWeight: '700',
    fontSize: 11.5,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: 10,
    marginBottom: 8,
  },
  modalSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  modalSelectorChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  modalSelectorText: {
    fontSize: 12,
  },
  modalTextInput: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 10,
    fontSize: 13,
    textAlignVertical: 'top',
    height: 90,
    marginBottom: 16,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  modalActionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radius.full,
  },
  modalActionBtnText: {
    fontWeight: '700',
    fontSize: 13,
  },
  roleRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  roleRowText: {
    fontSize: 13.5,
  },
});
