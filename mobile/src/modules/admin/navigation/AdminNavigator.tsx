import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons, Ionicons, Feather } from '@expo/vector-icons';
import { useTheme } from '../../../shared/context/theme.context';
import { Colors, Font, Radius } from '../../../shared/utils/theme';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AdminHomeScreen } from '../ui/screens/AdminHomeScreen';
import { AdminModerationScreen } from '../ui/screens/AdminModerationScreen';
import { AdminSellerVerificationScreen } from '../ui/screens/AdminSellerVerificationScreen';
import { AdminUsersScreen } from '../ui/screens/AdminUsersScreen';
import { AdminResourcesScreen } from '../ui/screens/AdminResourcesScreen';
import { useAdminDashboard } from '../hooks/useAdminDashboard';
import AdminEventsScreen from '../ui/screens/AdminEventsScreen';
import AdminVerificationScreen from '../ui/screens/AdminVerificationScreen';
import { AdminEventDetailScreen } from '../ui/screens/AdminEventDetailScreen';
import { AdminReelDetailScreen } from '../ui/screens/AdminReelDetailScreen';
import { AdminUserModerationScreen } from '../ui/screens/AdminUserModerationScreen';
import { useSocket } from '../../../shared/context/socket.context';

import { LanguageProvider, useLanguage } from '../../../shared/context/language.context';

function AdminNavigatorContent() {
  const [activeTab, setActiveTab] = useState<'home' | 'moderation' | 'sellers' | 'users' | 'resources'>('home');
  const { theme: T, isDark } = useTheme();
  const { t } = useLanguage();
  const { stats, refresh } = useAdminDashboard();
  const { socket } = useSocket();
  const [extraReelCount, setExtraReelCount] = useState(0);

  useEffect(() => {
    if (!socket) return;

    const handleNewReel = () => {
      setExtraReelCount(prev => prev + 1);
      refresh();
    };

    const handleReelReviewed = () => {
      setExtraReelCount(prev => Math.max(0, prev - 1));
      refresh();
    };

    const handleReelRemoved = () => {
      setExtraReelCount(prev => Math.max(0, prev - 1));
      refresh();
    };

    socket.on('NEW_REEL_PUBLISHED', handleNewReel);
    socket.on('REEL_REVIEWED', handleReelReviewed);
    socket.on('REEL_REMOVED', handleReelRemoved);

    return () => {
      socket.off('NEW_REEL_PUBLISHED', handleNewReel);
      socket.off('REEL_REVIEWED', handleReelReviewed);
      socket.off('REEL_REMOVED', handleReelRemoved);
    };
  }, [socket, refresh]);

  useEffect(() => {
    setExtraReelCount(0);
  }, [stats]);

  const moderationCount = (stats?.pendingModeration?.total ?? 0) + extraReelCount;
  const pendingSellersCount = stats?.pendingSellersCount ?? 0;

  const primaryGreen = Colors.green || '#8BC34A';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
        },
        screenWrapper: {
          flex: 1,
        },
        floatingBarContainer: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 24 : 16,
          left: 16,
          right: 16,
          alignItems: 'center',
        },
        floatingPill: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          height: 64,
          borderRadius: 32,
          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
          paddingHorizontal: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.35 : 0.1,
          shadowRadius: 16,
          elevation: 10,
          borderWidth: isDark ? 1 : 0,
          borderColor: 'rgba(255,255,255,0.08)',
        },
        tabItem: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 4,
          paddingHorizontal: 2,
        },
        tabLabel: {
          fontSize: 9.5,
          fontFamily: Font.family,
          marginTop: 2,
          textAlign: 'center',
          width: '100%',
        },
        badgePill: {
          position: 'absolute',
          top: -4,
          right: -8,
          backgroundColor: '#F59E0B',
          borderRadius: Radius.full,
          paddingHorizontal: 5,
          paddingVertical: 1,
        },
        badgeText: {
          color: '#FFF',
          fontSize: 9,
          fontFamily: Font.family,
          fontWeight: '700',
        },
        // Center Floating Action Button for Seller Badge Verification
        centerTabItem: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: -26,
        },
        centerIconCircle: {
          width: 58,
          height: 58,
          borderRadius: 29,
          backgroundColor: primaryGreen,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 4,
          borderColor: isDark ? '#1C1C1E' : '#F6F5F3',
          shadowColor: primaryGreen,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        },
        centerBadgePill: {
          position: 'absolute',
          top: -2,
          right: -2,
          backgroundColor: Colors.primaryRed,
          borderRadius: Radius.full,
          width: 18,
          height: 18,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: '#FFFFFF',
        },
        centerBadgeText: {
          color: '#FFF',
          fontSize: 9,
          fontWeight: '800',
        },
      }),
    [isDark, primaryGreen]
  );

  return (
    <View style={[styles.container, { backgroundColor: T.bg }]}>
      <View style={styles.screenWrapper}>
        {activeTab === 'home' && (
          <AdminHomeScreen
            navigation={{
              navigate: (screen: string, params?: any) => {
                if (screen === 'AdminSellerVerification') setActiveTab('sellers');
                if (screen === 'AdminModeration') setActiveTab('moderation');
              },
            }}
          />
        )}
        {activeTab === 'moderation' && (
          <AdminModerationScreen
            navigation={{ goBack: () => setActiveTab('home'), navigate: (s: string) => s === 'AdminSellerVerification' && setActiveTab('sellers') }}
            route={{ params: { initialTab: 'products' } }}
          />
        )}
        {activeTab === 'sellers' && (
          <AdminSellerVerificationScreen navigation={{ goBack: () => setActiveTab('home') }} />
        )}
        {activeTab === 'users' && (
          <AdminUsersScreen navigation={{ goBack: () => setActiveTab('home') }} />
        )}
        {activeTab === 'resources' && (
          <AdminResourcesScreen navigation={{ goBack: () => setActiveTab('home') }} />
        )}
      </View>

      {/* Floating Pill Bottom Navbar */}
      <View style={styles.floatingBarContainer}>
        <View style={styles.floatingPill}>
          {/* Tab 1: Home Dashboard */}
          <TouchableOpacity
            style={styles.tabItem}
            activeOpacity={0.7}
            onPress={() => setActiveTab('home')}
          >
            <Feather
              name="home"
              size={22}
              color={activeTab === 'home' ? primaryGreen : T.textMuted}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color: activeTab === 'home' ? primaryGreen : T.textMuted,
                  fontWeight: activeTab === 'home' ? Font.bold : Font.regular,
                },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {t('tab.home', 'Accueil')}
            </Text>
          </TouchableOpacity>

          {/* Tab 2: Shops / Sellers Validation (Secondary) */}
          <TouchableOpacity
            style={styles.tabItem}
            activeOpacity={0.7}
            onPress={() => setActiveTab('sellers')}
          >
            <View style={{ alignItems: 'center' }}>
              <MaterialCommunityIcons
                name="storefront-outline"
                size={22}
                color={activeTab === 'sellers' ? primaryGreen : T.textMuted}
              />
              {pendingSellersCount > 0 && (
                <View style={styles.badgePill}>
                  <Text style={styles.badgeText}>{pendingSellersCount > 99 ? '99+' : pendingSellersCount}</Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.tabLabel,
                {
                  color: activeTab === 'sellers' ? primaryGreen : T.textMuted,
                  fontWeight: activeTab === 'sellers' ? Font.bold : Font.regular,
                },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {t('tab.shops', 'Boutiques')}
            </Text>
          </TouchableOpacity>

          {/* Tab 3: Center Primary Action Circle for Moderation Hub */}
          <TouchableOpacity
            style={styles.centerTabItem}
            activeOpacity={0.85}
            onPress={() => setActiveTab('moderation')}
          >
            <View style={styles.centerIconCircle}>
              <MaterialCommunityIcons name="shield-check-outline" size={26} color="#FFFFFF" />
              {moderationCount > 0 && (
                <View style={styles.centerBadgePill}>
                  <Text style={styles.centerBadgeText}>{moderationCount > 99 ? '99+' : moderationCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Tab 4: Users Management */}
          <TouchableOpacity
            style={styles.tabItem}
            activeOpacity={0.7}
            onPress={() => setActiveTab('users')}
          >
            <Feather
              name="users"
              size={22}
              color={activeTab === 'users' ? primaryGreen : T.textMuted}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color: activeTab === 'users' ? primaryGreen : T.textMuted,
                  fontWeight: activeTab === 'users' ? Font.bold : Font.regular,
                },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {t('tab.users', 'Membres')}
            </Text>
          </TouchableOpacity>

          {/* Tab 5: Patient Resources */}
          <TouchableOpacity
            style={styles.tabItem}
            activeOpacity={0.7}
            onPress={() => setActiveTab('resources')}
          >
            <Feather
              name="book-open"
              size={22}
              color={activeTab === 'resources' ? primaryGreen : T.textMuted}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color: activeTab === 'resources' ? primaryGreen : T.textMuted,
                  fontWeight: activeTab === 'resources' ? Font.bold : Font.regular,
                },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {t('tab.resources', 'Ressources')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const Stack = createNativeStackNavigator();

export function AdminNavigator() {
  return (
    <LanguageProvider>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="AdminTabs" component={AdminNavigatorContent} />
        <Stack.Screen name="AdminEvents" component={AdminEventsScreen} />
        <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
        <Stack.Screen name="AdminVerification" component={AdminVerificationScreen} />
        <Stack.Screen name="AdminDashboard" component={AdminVerificationScreen} />
        <Stack.Screen name="AdminDashboardAlt" component={AdminVerificationScreen} />
        <Stack.Screen name="AdminReels" component={AdminVerificationScreen} />
        <Stack.Screen name="AdminEventDetail" component={AdminEventDetailScreen} />
        <Stack.Screen name="AdminReelDetail" component={AdminReelDetailScreen} />
        <Stack.Screen name="AdminUserModeration" component={AdminUserModerationScreen} />
      </Stack.Navigator>
    </LanguageProvider>
  );
}
