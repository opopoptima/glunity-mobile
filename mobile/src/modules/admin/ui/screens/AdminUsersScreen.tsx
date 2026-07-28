import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../shared/context/theme.context';
import { Colors, Font, Radius, Spacing } from '../../../../shared/utils/theme';
import { useAdminUsers } from '../../hooks/useAdminUsers';
import { UserCard } from '../components/UserCard';
import { UserFilterBar } from '../components/UserFilterBar';
import { SkeletonCard } from '../components/SkeletonCard';

import { useLanguage } from '../../../../shared/context/language.context';
import { useAuth } from '../../../../modules/auth/state/auth.context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

export function AdminUsersScreen({ navigation }: any) {
  const { theme: T, isDark } = useTheme();
  const { t } = useLanguage();
  const primaryGreen = Colors.green || '#8BC34A';
  const { filter, setFilter, searchQuery, setSearchQuery, users, loading, refresh } = useAdminUsers();

  const { isAuthenticated, isInitialized, user } = useAuth();
  const navigationHook = useNavigation<any>();
  const [sortBy, setSortBy] = useState<'newest' | 'name'>('newest');

  // Automatically refresh when screen receives focus to reflect moderation actions
  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [filter, searchQuery])
  );

  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated) {
        if (navigation?.navigate) {
          navigation.navigate('Login');
        } else {
          navigationHook.navigate('Login');
        }
      } else if (user?.profileType !== 'admin') {
        if (navigation?.navigate) {
          navigation.navigate('Home');
        } else {
          navigationHook.navigate('Home');
        }
      }
    }
  }, [isInitialized, isAuthenticated, user, navigation, navigationHook]);

  if (!isInitialized || !isAuthenticated || user?.profileType !== 'admin') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.bg }}>
        <ActivityIndicator size="large" color={primaryGreen} />
      </View>
    );
  }

  // Handle local sorting
  const sortedUsers = [...users].sort((a, b) => {
    if (sortBy === 'name') {
      return a.fullName.localeCompare(b.fullName);
    }
    // Default: newest first
    return new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime();
  });

  const toggleSort = () => {
    setSortBy(prev => (prev === 'newest' ? 'name' : 'newest'));
  };

  const handleFilterPress = () => {
    // Show details about active filter/advanced modes
    // Users can click filter chips to filter. Advanced is documented.
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: T.bg }]}>
      {/* Header Panel */}
      <View style={[styles.header, { backgroundColor: isDark ? '#0D0D0F' : T.bg, borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]} onPress={() => navigation?.goBack()}>
          <Feather name="arrow-left" size={20} color={T.text} />
        </TouchableOpacity>
        
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: T.text }]}>Gestion des Membres</Text>
          <Text style={[styles.headerSub, { color: T.textMuted }]}>
            Consultez les statistiques d'activité, inspectez les signalements et modérez les comptes de la communauté.
          </Text>
        </View>
      </View>

      {/* Modern Filter and Search Bar Component */}
      <UserFilterBar
        filter={filter}
        setFilter={setFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSortPress={toggleSort}
        onFilterPress={handleFilterPress}
        activeSortLabel={sortBy === 'newest' ? 'Plus récent' : 'Ordre alphabétique'}
      />

      {/* Active Sort/Filter Indicator Info Bar */}
      <View style={styles.infoBar}>
        <Text style={[styles.infoText, { color: T.textMuted }]}>
          {users.length} {users.length > 1 ? 'membres trouvés' : 'membre trouvé'} • Tri : {sortBy === 'newest' ? 'Récent' : 'Nom'}
        </Text>
      </View>

      {/* Users Scrollable List */}
      <ScrollView contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <>
            <SkeletonCard height={120} />
            <SkeletonCard height={120} />
            <SkeletonCard height={120} />
            <SkeletonCard height={120} />
          </>
        ) : sortedUsers.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
              <Feather name="users" size={32} color={T.textMuted} />
            </View>
            <Text style={[styles.emptyText, { color: T.text }]}>Aucun membre trouvé</Text>
            <Text style={[styles.emptySubText, { color: T.textMuted }]}>
              Essayez de modifier vos filtres de recherche ou changez de catégorie.
            </Text>
          </View>
        ) : (
          sortedUsers.map((u) => (
            <UserCard
              key={u.id}
              user={u}
              onPress={() => {
                navigationHook.navigate('AdminUserModeration', { userId: u.id, user: u });
              }}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  headerText: { flex: 1 },
  headerTitle: {
    fontFamily: Font.family,
    fontWeight: '700',
    fontSize: 20,
  },
  headerSub: {
    fontFamily: Font.family,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  infoBar: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    marginBottom: Spacing.xs,
  },
  infoText: {
    fontFamily: Font.family,
    fontSize: 11,
    fontWeight: '500',
  },
  contentScroll: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    marginTop: Spacing.lg,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  emptyText: {
    fontFamily: Font.family,
    fontWeight: '700',
    fontSize: 16,
    marginTop: Spacing.xs,
  },
  emptySubText: {
    fontFamily: Font.family,
    fontSize: 12.5,
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    lineHeight: 18,
  },
});
