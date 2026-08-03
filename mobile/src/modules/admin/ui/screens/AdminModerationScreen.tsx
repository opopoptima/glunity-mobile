import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../../../shared/context/theme.context';
import { Colors, Font, Radius, Spacing } from '../../../../shared/utils/theme';
import { useAdminModeration, TabType } from '../../hooks/useAdminModeration';
import { ModerationCard } from '../components/ModerationCard';
import { EventCard } from '../components/EventCard';
import { ActionModal } from '../components/ActionModal';
import { ModerationDetailModal } from '../components/ModerationDetailModal';
import { SkeletonCard } from '../components/SkeletonCard';
import { ModerationStatsStrip } from '../components/ModerationStatsStrip';
import { useLanguage } from '../../../../shared/context/language.context';
import { ModerationStatus } from '../../api/admin.api';
import { useAdminDashboard } from '../../hooks/useAdminDashboard';

const CONTENT_TABS: { id: TabType; label: string; icon: string; color: string }[] = [
  { id: 'products', label: 'Produits',   icon: 'food-apple',  color: '#8BC34A' },
  { id: 'events',   label: 'Événements', icon: 'calendar',    color: '#3B82F6' },
  { id: 'recipes',  label: 'Recettes',   icon: 'chef-hat',    color: '#F59E0B' },
  { id: 'reels',    label: 'Reels',      icon: 'movie-play',  color: '#EC4899' },
];

const STATUS_FILTERS: { id: ModerationStatus; label: string; color: string }[] = [
  { id: 'pending',            label: 'En attente', color: '#F59E0B' },
  { id: 'revision_requested', label: 'Révision',   color: '#8B5CF6' },
  { id: 'rejected',           label: 'Refusés',    color: '#EF4444' },
  { id: 'approved',           label: 'Approuvés',  color: '#22C55E' },
  { id: 'all',                label: 'Tout',       color: '#6B7280' },
];

function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  if (isNaN(diffMs) || diffMs < 0) return '1m';
  
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'À l\'instant';
  if (diffMin < 60) return `Il y a ${diffMin} minute${diffMin > 1 ? 's' : ''}`;
  if (diffHour < 24) return `Il y a ${diffHour} heure${diffHour > 1 ? 's' : ''}`;
  return `Il y a ${diffDay} jour${diffDay > 1 ? 's' : ''}`;
}

export function AdminModerationScreen({ route, navigation }: any) {
  const { theme: T, isDark } = useTheme();
  const { t, isRTL } = useLanguage();
  const initialTab: TabType = route?.params?.initialTab || 'products';

  const {
    activeTab, setActiveTab,
    statusFilter, setStatusFilter,
    loading, filteredItems,
    search, setSearch,
    refresh, modal, detail,
  } = useAdminModeration(initialTab);

  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popularity'>('newest');
  const [eventTypeFilter, setEventTypeFilter] = useState<'all' | 'online' | 'presentiel'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // For stats strip
  const { stats: dashStats } = useAdminDashboard();
  const moderationStats = dashStats ? {
    pendingProducts: dashStats.pendingModeration?.products ?? 0,
    pendingEvents:   dashStats.pendingModeration?.events ?? 0,
    pendingRecipes:  dashStats.pendingModeration?.recipes ?? 0,
    pendingReels:    dashStats.pendingModeration?.reels ?? 0,
    pendingShopUpdates: (dashStats as any).pendingShopUpdates ?? 0,
    pendingSellerVerifications: dashStats.pendingSellersCount ?? 0,
    totalPending: dashStats.pendingModeration?.total ?? 0,
    approvedToday: (dashStats as any).approvedToday ?? 0,
    rejectedToday: (dashStats as any).rejectedToday ?? 0,
    revisionRequests: 0,
    verifiedSellers: dashStats.verifiedSellers ?? 0,
  } : null;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  const primaryGreen = Colors.green || '#8BC34A';
  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const borderC = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const inputBg = isDark ? '#2C2C2E' : 'rgba(46,46,46,0.05)';

  const activeTabConfig = CONTENT_TABS.find(t => t.id === activeTab);

  // Cycles formatting
  const cycleSort = () => {
    if (sortBy === 'newest') setSortBy('oldest');
    else if (sortBy === 'oldest') setSortBy('popularity');
    else setSortBy('newest');
  };

  const cycleFormat = () => {
    if (eventTypeFilter === 'all') setEventTypeFilter('online');
    else if (eventTypeFilter === 'online') setEventTypeFilter('presentiel');
    else setEventTypeFilter('all');
  };

  const cycleCategory = () => {
    const categories = ['all', 'meetup', 'class', 'webinar', 'market', 'other'];
    const nextIdx = (categories.indexOf(categoryFilter) + 1) % categories.length;
    setCategoryFilter(categories[nextIdx]);
  };

  const getSortLabel = () => {
    if (sortBy === 'newest') return t('sort.newest', 'Plus récent');
    if (sortBy === 'oldest') return t('sort.oldest', 'Plus ancien');
    return t('sort.popularity', 'Popularité');
  };

  const getFormatLabel = () => {
    if (eventTypeFilter === 'all') return t('filter.format_all', 'Tous les formats');
    if (eventTypeFilter === 'online') return t('filter.online', 'En ligne');
    return t('filter.presentiel', 'Présentiel');
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: T.bg }]}>
      {/* ─── Header ─────────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: borderC }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation?.goBack()}>
          <Feather name="arrow-left" size={20} color={T.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: T.text }]}>Modération</Text>
          <Text style={[styles.headerSub, { color: T.textMuted }]}>
            {filteredItems.length} élément{filteredItems.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={refresh}>
          <Feather name="refresh-cw" size={18} color={T.textMuted} />
        </TouchableOpacity>
      </View>

      {/* ─── Stats Strip ─────────────────────────────────────── */}
      <ModerationStatsStrip stats={moderationStats} onCellPress={(key) => {
        if (key === 'pendingProducts') setActiveTab('products');
        else if (key === 'pendingEvents') setActiveTab('events');
        else if (key === 'pendingRecipes') setActiveTab('recipes');
        else if (key === 'pendingReels') setActiveTab('reels');
      }} />

      {/* ─── Search ──────────────────────────────────────────── */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: inputBg, borderColor: borderC }]}>
          <Feather name="search" size={16} color={T.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: T.text }]}
            placeholder="Rechercher un contenu..."
            placeholderTextColor={T.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x-circle" size={16} color={T.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ─── Content Type Chips ──────────────────────────────── */}
      <View style={styles.chipSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {CONTENT_TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.typeChip,
                  {
                    backgroundColor: isActive ? tab.color : (isDark ? '#2C2C2E' : 'rgba(46,46,46,0.06)'),
                    borderColor: isActive ? tab.color : 'transparent',
                  },
                ]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.75}
              >
                <MaterialCommunityIcons
                  name={tab.icon as any}
                  size={14}
                  color={isActive ? '#FFF' : T.textMuted}
                />
                <Text style={[styles.typeChipLabel, { color: isActive ? '#FFF' : T.text }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ─── Status Filter Underline Tabs ────────────────────── */}
      <View style={[styles.statusBar, { borderBottomColor: borderC }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusRow}
        >
          {STATUS_FILTERS.map(s => {
            const isActive = statusFilter === s.id;
            return (
              <TouchableOpacity
                key={s.id}
                style={styles.statusTab}
                onPress={() => setStatusFilter(s.id)}
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

      {/* ─── List ────────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={primaryGreen}
            colors={[primaryGreen]}
          />
        }
      >
        {loading ? (
          <>
            <SkeletonCard height={120} />
            <SkeletonCard height={120} />
            <SkeletonCard height={120} />
          </>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={[styles.emptyIcon, { backgroundColor: Colors.greenLight }]}>
              <Feather name="check-circle" size={32} color={primaryGreen} />
            </View>
            <Text style={[styles.emptyTitle, { color: T.text }]}>Tout est à jour !</Text>
            <Text style={[styles.emptyDesc, { color: T.textMuted }]}>
              Aucun contenu{activeTabConfig ? ` (${activeTabConfig.label})` : ''} dans cette catégorie.
            </Text>
          </View>
        ) : (
          filteredItems.map(item => (
            <ModerationCard
              key={item.id}
              item={item}
              onApprove={() => modal.handleOpenAction(item, 'approve')}
              onReject={() => modal.handleOpenAction(item, 'reject')}
              onRevision={() => modal.handleOpenAction(item, 'revision')}
              onViewDetail={() => detail.open(item)}
            />
          ))
        )}
      </ScrollView>

      {/* ─── Action Modal ───────────────────────────────────────────────── */}
      <ActionModal
        visible={modal.visible}
        onClose={() => modal.setVisible(false)}
        onConfirm={modal.handleConfirmAction}
        actionType={modal.actionType}
        selectedItem={modal.selectedItem}
        rejectReason={modal.rejectReason}
        setRejectReason={modal.setRejectReason}
        revisionNotes={modal.revisionNotes}
        setRevisionNotes={modal.setRevisionNotes}
      />

      {/* ─── Detail Modal ────────────────────────────────────────────────── */}
      <ModerationDetailModal
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
        onRevision={() => {
          detail.setVisible(false);
          if (detail.item) modal.handleOpenAction(detail.item, 'revision');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle:  { fontFamily: Font.bold, fontSize: 17 },
  headerSub:    { fontFamily: Font.regular, fontSize: 12, marginTop: 1 },

  /* Search */
  searchContainer: { paddingHorizontal: Spacing.md, paddingTop: 6, paddingBottom: 4 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: Font.regular,
    fontSize: 14,
    padding: 0,
    margin: 0,
  },

  /* Content Type Chips */
  chipSection: { paddingTop: 12 },
  chipRow: {
    paddingHorizontal: Spacing.md,
    gap: 8,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    gap: 5,
  },
  typeChipLabel: { fontFamily: Font.medium, fontSize: 13 },

  /* Status filter underline tabs */
  statusBar: {
    borderBottomWidth: 1,
    marginTop: 12,
  },
  statusRow: {
    paddingHorizontal: Spacing.md,
    gap: 4,
  },
  statusTab: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 4,
    alignItems: 'center',
    position: 'relative',
  },
  statusLabel: { fontSize: 13 },
  statusUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    borderRadius: 2,
  },

  /* List */
  listContent: { padding: Spacing.md, paddingBottom: 120 },

  /* Empty */
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    marginTop: Spacing.lg,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: { fontFamily: Font.bold, fontSize: 17, marginBottom: 6 },
  emptyDesc:  { fontFamily: Font.regular, fontSize: 14, textAlign: 'center', lineHeight: 20 },

  /* Cross-link cards */
  crossLinks: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  crossCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 12,
  },
  crossIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  crossLabel: { fontFamily: Font.semibold, fontSize: 13 },
  crossSub:   { fontFamily: Font.regular, fontSize: 11, marginTop: 1 },
});
