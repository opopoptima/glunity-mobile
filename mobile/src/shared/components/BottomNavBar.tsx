import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TabKey = 'home' | 'events' | 'reels' | 'profile';

interface BottomNavBarProps {
  activeTab: TabKey;
  idPrefix?: string;
  onPressHome?: () => void;
  onPressEvents?: () => void;
  onPressCenter?: () => void;
  onPressReels?: () => void;
  onPressProfile?: () => void;
}

const C = {
  bg: '#F6F5F3',
  dark: '#2E2E2E',
  green: '#8BC34A',
};

export function BottomNavBar({
  activeTab,
  idPrefix = 'nav',
  onPressHome,
  onPressEvents,
  onPressCenter,
  onPressReels,
  onPressProfile,
}: BottomNavBarProps) {
  const insets = useSafeAreaInsets();

  const getLabelStyle = (tab: TabKey) => [styles.navLabel, activeTab === tab ? styles.navLabelActive : null];
  const getIconColor = (tab: TabKey) => (activeTab === tab ? C.green : C.dark);

  return (
    <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={onPressHome} id={`${idPrefix}-home`}>
        <Feather name="home" size={22} color={getIconColor('home')} />
        <Text style={getLabelStyle('home')}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={onPressEvents} id={`${idPrefix}-events`}>
        <Feather name="calendar" size={22} color={getIconColor('events')} />
        <Text style={getLabelStyle('events')}>Events</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.fabButton} activeOpacity={0.85} onPress={onPressCenter} id={`${idPrefix}-fab`}>
        <Ionicons name="qr-code" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={onPressReels} id={`${idPrefix}-reels`}>
        <MaterialCommunityIcons name="movie-play-outline" size={24} color={getIconColor('reels')} />
        <Text style={getLabelStyle('reels')}>Reels</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={onPressProfile} id={`${idPrefix}-profile`}>
        <Feather name="user" size={22} color={getIconColor('profile')} />
        <Text style={getLabelStyle('profile')}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 96,
    backgroundColor: C.bg,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingHorizontal: 18,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  navItem: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
    paddingBottom: 2,
  },
  navLabel: {
    fontSize: 8.5,
    lineHeight: 15,
    fontWeight: '500',
    color: C.dark,
    fontFamily: 'Poppins_400Regular',
  },
  navLabelActive: {
    color: C.green,
  },
  fabButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.green,
    borderWidth: 4,
    borderColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 8,
  },
});
