import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../../../shared/context/theme.context';
import { Colors, Font, Radius, Spacing } from '../../../../shared/utils/theme';
import { useAdminModeration, TabType } from '../../hooks/useAdminModeration';
import { ModerationCard } from '../components/ModerationCard';
import { EventCard } from '../components/EventCard';
import { ActionModal } from '../components/ActionModal';
import { SkeletonCard } from '../components/SkeletonCard';
import { useLanguage } from '../../../../shared/context/language.context';

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
  const parentNavigation = useNavigation<any>();

  const {
    activeTab,
    setActiveTab,
    loading,
    filteredItems,
    refresh,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    eventTypeFilter,
    setEventTypeFilter,
    sortBy,
    setSortBy,
    modal,
  } = useAdminModeration(initialTab);

  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [activeTab])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const tabs: { id: TabType; label: string; icon: string; color: string }[] = [
    { id: 'products', label: t('mod.filter_products', 'Produits'), icon: 'food-apple', color: '#8BC34A' },
    { id: 'events', label: t('mod.filter_events', 'Événements'), icon: 'calendar', color: '#3B82F6' },
    { id: 'recipes', label: t('mod.filter_recipes', 'Recettes'), icon: 'chef-hat', color: '#F59E0B' },
    { id: 'reels', label: t('mod.filter_reels', 'Reels'), icon: 'movie-play', color: '#EC4899' },
  ];

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
    <SafeAreaView style={[styles.container, { backgroundColor: T.bg }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: isDark ? '#1C1C1E' : Colors.white,
            borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          },
        ]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
          <Feather name="arrow-left" size={20} color={T.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: T.text }]}>{t('mod.title', 'Centre de Modération')}</Text>
          <Text style={[styles.headerSub, { color: T.textMuted }]}>
            {t('mod.sub', 'Validation des produits, recettes, événements et reels')}
          </Text>
        </View>
      </View>

      {/* Pill Tabs */}
      <View style={styles.tabBarContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tabPill,
                  { backgroundColor: isActive ? tab.color : isDark ? '#2C2C2E' : 'rgba(46,46,46,0.06)' },
                ]}
                onPress={() => setActiveTab(tab.id)}
              >
                <MaterialCommunityIcons name={tab.icon as any} size={15} color={isActive ? '#FFF' : T.textMuted} />
                <Text style={[styles.tabLabel, { color: isActive ? '#FFF' : T.text }]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Filters & Search Section */}
      <View style={[styles.filtersContainer, { backgroundColor: isDark ? '#1C1C1E' : Colors.white }]}>
        {/* Search Input */}
        <View style={[styles.searchWrapper, { backgroundColor: T.inputBg, borderColor: T.border }]}>
          <Feather name="search" size={16} color={T.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: T.text }]}
            placeholder={t('mod.search_placeholder', 'Rechercher par titre, auteur...')}
            placeholderTextColor={T.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
              <Feather name="x" size={14} color={T.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Dynamic Filters Strips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.filtersScroll, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        >
          {/* Sorting filter chip */}
          <TouchableOpacity
            style={[styles.filterChip, { borderColor: T.border }]}
            onPress={cycleSort}
            activeOpacity={0.8}
          >
            <Feather name="bar-chart-2" size={12} color={Colors.green} />
            <Text style={[styles.filterChipText, { color: T.textSub }]}>{getSortLabel()}</Text>
          </TouchableOpacity>

          {activeTab === 'events' && (
            <>
              {/* Event Type Filter chip */}
              <TouchableOpacity
                style={[styles.filterChip, { borderColor: T.border }]}
                onPress={cycleFormat}
                activeOpacity={0.8}
              >
                <Feather name="video" size={12} color="#EC4899" />
                <Text style={[styles.filterChipText, { color: T.textSub }]}>{getFormatLabel()}</Text>
              </TouchableOpacity>

              {/* Category Filter chip */}
              <TouchableOpacity
                style={[styles.filterChip, { borderColor: T.border }]}
                onPress={cycleCategory}
                activeOpacity={0.8}
              >
                <Feather name="tag" size={12} color="#3B82F6" />
                <Text style={[styles.filterChipText, { color: T.textSub }]}>
                  {categoryFilter === 'all'
                    ? t('filter.category_all', 'Toutes catégories')
                    : categoryFilter.toUpperCase()}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.contentScroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[Colors.green]} />
        }
      >
        {loading && !refreshing ? (
          <>
            <SkeletonCard height={120} />
            <SkeletonCard height={120} />
            <SkeletonCard height={120} />
          </>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6' }]}>
              <Feather name="check-circle" size={40} color={Colors.green} />
            </View>
            <Text style={[styles.emptyText, { color: T.text }]}>
              {t('empty.queue_clean', 'File d\'attente vide')}
            </Text>
            <Text style={[styles.emptySubText, { color: T.textMuted }]}>
              {t('empty.queue_clean_sub', 'Aucun contenu en attente de modération pour vos filtres.')}
            </Text>
          </View>
        ) : (
          filteredItems.map((item) => {
            if (item.type === 'event') {
              return (
                <EventCard
                  key={item.id}
                  item={item as any}
                  onPress={() => parentNavigation.navigate('AdminEventDetail', { eventId: item.id })}
                />
              );
            }
            if (item.type === 'reel') {
              const isUnread = item.reviewStatus === 'unreviewed';
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.reelNotificationCard,
                    {
                      backgroundColor: isDark ? '#1C1C1E' : Colors.white,
                      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                    },
                  ]}
                  onPress={() => parentNavigation.navigate('AdminReelDetail', { item })}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: item.authorAvatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop' }}
                    style={styles.reelAvatar}
                  />

                  <View style={styles.reelContent}>
                    <View style={styles.reelHeaderRow}>
                      <Text style={[styles.reelTitle, { color: T.text }]}>Nouveau Reel publié</Text>
                      {isUnread && <View style={styles.unreadBadge} />}
                    </View>
                    <Text style={[styles.reelUsername, { color: T.textSub }]} numberOfLines={2}>
                      @{item.authorUsername || item.authorOrSeller || 'username'} vient de publier un nouveau Reel.
                    </Text>
                    <Text style={[styles.reelSub, { color: T.textMuted }]}>
                      Vérifiez le contenu si nécessaire.
                    </Text>
                    <Text style={[styles.reelTime, { color: T.textMuted }]}>
                      {formatRelativeTime(item.date)}
                    </Text>
                  </View>

                  <Image
                    source={{ uri: item.thumbnailUrl || 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=200' }}
                    style={styles.reelThumbnail}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              );
            }
            return (
              <ModerationCard
                key={item.id}
                item={item}
                onApprove={() => modal.handleOpenAction(item, 'approve')}
                onReject={() => modal.handleOpenAction(item, 'reject')}
              />
            );
          })
        )}
      </ScrollView>

      {/* Decision Modal for other moderation tabs */}
      <ActionModal
        visible={modal.visible}
        onClose={() => modal.setVisible(false)}
        onConfirm={modal.handleConfirmAction}
        actionType={modal.actionType}
        selectedItem={modal.selectedItem}
        rejectReason={modal.rejectReason}
        setRejectReason={modal.setRejectReason}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  headerText: { flex: 1 },
  headerTitle: { fontFamily: Font.bold, fontSize: 20 },
  headerSub: { fontFamily: Font.regular, fontSize: 13, marginTop: 2 },
  tabBarContainer: { marginTop: Spacing.md, marginBottom: Spacing.xs },
  tabsScroll: { paddingHorizontal: Spacing.md, gap: 8 },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    gap: 5,
  },
  tabLabel: { fontFamily: Font.medium, fontSize: 13 },
  filtersContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    height: 40,
  },
  searchIcon: {
    marginRight: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontFamily: Font.family,
    fontSize: 13,
    paddingVertical: 4,
  },
  filtersScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 6,
  },
  filterChipText: {
    fontFamily: Font.family,
    fontWeight: Font.semibold,
    fontSize: 11,
  },
  contentScroll: { padding: Spacing.md, paddingBottom: 120 },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    marginTop: Spacing.lg,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontFamily: Font.family,
    fontWeight: Font.bold,
    fontSize: 16,
    marginBottom: 4,
  },
  emptySubText: {
    fontFamily: Font.family,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  reelNotificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reelAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  reelContent: {
    flex: 1,
    gap: 2,
  },
  reelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reelTitle: {
    fontFamily: Font.bold,
    fontSize: 14,
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EC4899',
  },
  reelUsername: {
    fontFamily: Font.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  reelSub: {
    fontFamily: Font.regular,
    fontSize: 12,
  },
  reelTime: {
    fontFamily: Font.regular,
    fontSize: 11,
    marginTop: 4,
  },
  reelThumbnail: {
    width: 48,
    height: 64,
    borderRadius: Radius.sm,
    backgroundColor: '#2C2C2E',
  },
});
