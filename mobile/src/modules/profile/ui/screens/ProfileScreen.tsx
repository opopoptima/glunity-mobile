import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '@/navigation/types';
import { useAuth } from '@/modules/auth/state/auth.context';

type Props = NativeStackScreenProps<AppStackParamList, 'Profile'>;

const C = {
  green:      '#8BC34A',
  dark:       '#2E2E2E',
  bg:         '#F6F5F3',
  white:      '#FFFFFF',
  muted:      '#6B6B6B',
  greenLight: '#E8F5E9',
};

const JOURNEY_LEVELS = [
  { label: 'Beginner',   active: true  },
  { label: 'Aware',      active: true  },
  { label: 'Safe Eater', active: true  },
  { label: 'Fighter',    active: false },
  { label: 'Titan',      active: false },
];

export default function ProfileScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const name = user?.fullName ?? 'GlUnity User';

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <View style={s.headerRow}>
          <Text style={s.headerTitle}>My Profile</Text>
          <TouchableOpacity
            style={s.settingsBtn}
            onPress={() => navigation.navigate('Settings')}
            id="profile-settings-btn"
          >
            <MaterialCommunityIcons name="cog-outline" size={24} color={C.dark} />
          </TouchableOpacity>
        </View>

        {/* ── Avatar block ────────────────────────────────────────────── */}
        <View style={s.avatarSection}>
          <View style={s.avatarWrap}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop' }}
              style={s.avatar}
            />
            <TouchableOpacity
              style={s.editBadge}
              onPress={() => navigation.navigate('EditProfile')}
              id="profile-edit-photo-btn"
            >
              <MaterialCommunityIcons name="camera" size={18} color={C.white} />
            </TouchableOpacity>
          </View>

          <Text style={s.name}>{name}</Text>
          <View style={s.badge}>
            <MaterialCommunityIcons name="shield-star-outline" size={14} color={C.green} />
            <Text style={s.badgeText}>Gluten-Free Warrior</Text>
          </View>
        </View>

        {/* ── Quick actions ────────────────────────────────────────────── */}
        <View style={s.actionRow}>
          <TouchableOpacity
            style={s.actionCard}
            onPress={() => navigation.navigate('EditProfile')}
            id="profile-edit-btn"
          >
            <View style={s.actionIcon}>
              <MaterialCommunityIcons name="account-edit-outline" size={24} color={C.green} />
            </View>
            <Text style={s.actionLabel}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.actionCard}
            onPress={() => navigation.navigate('Settings')}
            id="profile-settings-card-btn"
          >
            <View style={s.actionIcon}>
              <MaterialCommunityIcons name="cog-outline" size={24} color={C.green} />
            </View>
            <Text style={s.actionLabel}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.actionCard} id="profile-share-btn">
            <View style={s.actionIcon}>
              <MaterialCommunityIcons name="share-variant-outline" size={24} color={C.green} />
            </View>
            <Text style={s.actionLabel}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* ── Role section ─────────────────────────────────────────────── */}
        <Text style={s.sectionLabel}>YOUR ROLE</Text>
        <View style={s.card}>
          <View style={s.roleIconBox}>
            <MaterialCommunityIcons name="shield-star-outline" size={28} color={C.green} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.roleTitle}>Gluten-Free Warrior</Text>
            <Text style={s.roleDesc}>
              You actively manage your gluten-free lifestyle and inspire others in the community.
            </Text>
          </View>
        </View>

        {/* ── Journey ─────────────────────────────────────────────────── */}
        <Text style={s.sectionLabel}>YOUR JOURNEY</Text>
        <View style={s.journeyCard}>
          <View style={s.progressBg}>
            <View style={s.progressFill} />
          </View>
          <View style={s.levelRow}>
            {JOURNEY_LEVELS.map((lvl, i) => (
              <View key={i} style={s.levelItem}>
                <View style={[s.dot, !lvl.active && s.dotInactive]}>
                  {lvl.active && <View style={s.dotInner} />}
                </View>
                <Text style={[s.levelLabel, !lvl.active && { opacity: 0.35 }]}>
                  {lvl.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Impact card ─────────────────────────────────────────────── */}
        <View style={s.impactCard}>
          <MaterialCommunityIcons name="leaf" size={54} color={C.green} />
          <Text style={s.impactText}>
            Every action you take makes the GlUnity ecosystem stronger for everyone.
          </Text>
        </View>

        {/* ── Logout ──────────────────────────────────────────────────── */}
        <TouchableOpacity style={s.logoutBtn} onPress={logout} id="profile-logout-btn">
          <MaterialCommunityIcons name="logout" size={20} color={C.white} />
          <Text style={s.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Bottom Nav ───────────────────────────────────────────────── */}
      <View style={s.bottomNav}>
        <TouchableOpacity style={s.navBtn} onPress={() => navigation.navigate('Home')} id="profile-nav-home">
          <MaterialCommunityIcons name="home-outline" size={24} color={C.dark} />
          <Text style={s.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.navBtn} id="profile-nav-events">
          <MaterialCommunityIcons name="calendar-outline" size={24} color={C.dark} />
          <Text style={s.navLabel}>Events</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.fab} id="profile-nav-fab">
          <MaterialCommunityIcons name="plus" size={28} color={C.white} />
        </TouchableOpacity>

        <TouchableOpacity style={s.navBtn} id="profile-nav-reels">
          <MaterialCommunityIcons name="play-circle-outline" size={24} color={C.dark} />
          <Text style={s.navLabel}>Reels</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.navBtn} id="profile-nav-profile">
          <MaterialCommunityIcons name="account" size={24} color={C.green} />
          <Text style={[s.navLabel, { color: C.green }]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 16 },

  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 24,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: C.dark },
  settingsBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.white, alignItems: 'center', justifyContent: 'center',
    elevation: 2,
  },

  // Avatar
  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatarWrap:    { position: 'relative', marginBottom: 14 },
  avatar: {
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 3, borderColor: C.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 6, elevation: 6,
  },
  editBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.green, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: C.white,
  },
  name: { fontSize: 20, fontWeight: '700', color: C.dark, marginBottom: 8 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.greenLight, paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: C.green },

  // Action cards
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionCard: {
    flex: 1, backgroundColor: C.white, borderRadius: 16,
    paddingVertical: 18, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  actionIcon: {
    width: 50, height: 50, borderRadius: 14, backgroundColor: C.greenLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  actionLabel: { fontSize: 11, fontWeight: '600', color: C.dark, textAlign: 'center' },

  // Section
  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: 'rgba(46,46,46,0.4)',
    marginBottom: 10, letterSpacing: 1,
  },

  // Role card
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    backgroundColor: C.white, borderRadius: 16, padding: 16,
    marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  roleIconBox: {
    width: 52, height: 52, borderRadius: 14, backgroundColor: C.greenLight,
    alignItems: 'center', justifyContent: 'center',
  },
  roleTitle: { fontSize: 15, fontWeight: '700', color: C.dark, marginBottom: 4 },
  roleDesc:  { fontSize: 12, color: 'rgba(46,46,46,0.65)', lineHeight: 20 },

  // Journey
  journeyCard: {
    backgroundColor: C.white, borderRadius: 16, padding: 16,
    marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  progressBg:   { height: 6, backgroundColor: 'rgba(46,46,46,0.12)', borderRadius: 3, marginBottom: 14, overflow: 'hidden' },
  progressFill: { height: '100%', width: '60%', backgroundColor: C.green, borderRadius: 3 },
  levelRow:     { flexDirection: 'row', justifyContent: 'space-between' },
  levelItem:    { alignItems: 'center', gap: 6 },
  dot: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: C.green,
    borderWidth: 2, borderColor: C.white, alignItems: 'center', justifyContent: 'center',
    shadowColor: C.green, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 2,
  },
  dotInactive:  { backgroundColor: C.bg, borderColor: 'rgba(46,46,46,0.2)' },
  dotInner:     { width: 6, height: 6, borderRadius: 3, backgroundColor: C.white },
  levelLabel:   { fontSize: 9, fontWeight: '700', color: C.dark, textAlign: 'center' },

  // Impact
  impactCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: 'rgba(139,195,74,0.2)', borderRadius: 20,
    padding: 20, marginBottom: 20,
  },
  impactText: { flex: 1, fontSize: 13, fontWeight: '500', color: C.dark, lineHeight: 20 },

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#E53935', borderRadius: 14, paddingVertical: 14,
    marginBottom: 20,
    shadowColor: '#E53935', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: C.white },

  // Bottom nav
  bottomNav: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
    backgroundColor: C.white, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-around', paddingBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 10,
  },
  navBtn:   { alignItems: 'center', gap: 2, minWidth: 48 },
  navLabel: { fontSize: 8, fontWeight: '500', color: C.dark, marginTop: 2 },
  fab: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: C.green,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    borderWidth: 4, borderColor: C.bg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15, shadowRadius: 10, elevation: 8,
  },
});
