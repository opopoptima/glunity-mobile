import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useAuth } from '@/modules/auth/state/auth.context';
import { Colors, Font, Spacing } from '@/shared/utils/theme';

const { width } = Dimensions.get('window');

const QUICK_ACCESS = [
  { icon: '🔍', label: 'Find Products' },
  { icon: '👥', label: 'Community' },
  { icon: '📋', label: 'Patient Resources' },
  { icon: '📍', label: 'Map' },
];

const RECIPES = [
  { name: 'Gluten-Free Pizza', emoji: '🍕' },
  { name: 'Tunisian Brik',     emoji: '🥘' },
  { name: 'Quinoa Bowl',       emoji: '🥗' },
];

const EVENTS = [
  {
    name:     'Gluten-Free Cooking Workshop',
    location: 'Central Park, NYC',
    date:     'Sat, Jun 15 • 2:00 PM',
    emoji:    '🍳',
  },
  {
    name:     'GF Community Picnic',
    location: 'Central Park, NYC',
    date:     'Sat, Jun 15 • 2:00 PM',
    emoji:    '🧺',
  },
];

const NAV_ITEMS = [
  { icon: '🏠', label: 'Home',    active: true  },
  { icon: '📅', label: 'Events',  active: false },
  { icon: null,  label: '',        fab: true    },
  { icon: '🎬', label: 'Reels',   active: false },
  { icon: '👤', label: 'Profile', active: false },
];

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const firstName = user?.fullName?.split(' ')[0] ?? 'You';

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />

      <ScrollView
        style={s.flex}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ────────────────────────────────────────────────────────── */}
        <View style={s.header}>
          <View style={s.userRow}>
            <View style={s.avatar}>
              <Text style={{ fontSize: 18 }}>👩</Text>
            </View>
            <Text style={s.greeting}>{firstName}</Text>
          </View>
          <View style={s.headerActions}>
            <TouchableOpacity style={s.iconBtn} id="home-search-btn">
              <Text>🔍</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.iconBtn} id="home-notif-btn">
              <Text>🔔</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.logoutBtn} onPress={logout} id="home-logout-btn">
              <Text style={s.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── QR Scanner Banner ─────────────────────────────────────────────── */}
        <View style={s.banner}>
          <Text style={s.bannerSub}>
            Instantly check for gluten & find safe alternatives
          </Text>
          <View style={s.qrBox}>
            <Text style={s.qrIcon}>⬛</Text>
          </View>
          <TouchableOpacity style={s.tapScanBtn} activeOpacity={0.85} id="home-scan-btn">
            <Text style={s.tapScanText}>Tap to Scan</Text>
          </TouchableOpacity>
        </View>

        {/* ── Quick Access ───────────────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>Quick Access</Text>
        <View style={s.quickGrid}>
          {QUICK_ACCESS.map((item) => (
            <TouchableOpacity key={item.label} style={s.quickCard} activeOpacity={0.8}>
              <View style={s.quickIconBox}>
                <Text style={{ fontSize: 22 }}>{item.icon}</Text>
              </View>
              <Text style={s.quickLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Recipes ───────────────────────────────────────────────────────── */}
        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>Check Recipes</Text>
          <View style={s.gfBadge}><Text style={s.gfText}>GF</Text></View>
          <TouchableOpacity style={s.seeAll} id="home-recipes-see-all">
            <Text style={s.seeAllText}>See All →</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.hRow}
        >
          {RECIPES.map((r) => (
            <View key={r.name} style={s.recipeCard}>
              <View style={s.recipeImg}>
                <Text style={{ fontSize: 42 }}>{r.emoji}</Text>
              </View>
              <Text style={s.recipeTitle}>{r.name}</Text>
            </View>
          ))}
        </ScrollView>

        {/* ── Events ────────────────────────────────────────────────────────── */}
        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>Check Events</Text>
          <TouchableOpacity style={s.seeAll} id="home-events-see-all">
            <Text style={s.seeAllText}>See All →</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[s.hRow, { marginBottom: 0 }]}
        >
          {EVENTS.map((ev) => (
            <View key={ev.name} style={s.eventCard}>
              <View style={s.eventImg}>
                <Text style={{ fontSize: 36 }}>{ev.emoji}</Text>
                <View style={s.eventBadge}><Text style={s.gfText}>GF</Text></View>
              </View>
              <View style={s.eventInfo}>
                <Text style={s.eventName}>{ev.name}</Text>
                <Text style={s.eventMeta}>📍 {ev.location}</Text>
                <Text style={s.eventMeta}>📅 {ev.date}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Bottom Navigation Bar ─────────────────────────────────────────── */}
      <View style={s.bottomNav}>
        {NAV_ITEMS.map((n, i) =>
          n.fab ? (
            <TouchableOpacity key="fab" style={s.fab} activeOpacity={0.85} id="home-fab-btn">
              <Text style={{ color: Colors.white, fontSize: 26 }}>＋</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity key={i} style={s.navBtn} activeOpacity={0.7}>
              <Text style={{ fontSize: 20 }}>{n.icon}</Text>
              <Text style={[s.navLabel, n.active && { color: Colors.green }]}>{n.label}</Text>
            </TouchableOpacity>
          ),
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  flex:    { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 12 },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  userRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.greenLight, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.green,
  },
  greeting: { fontSize: 17, fontWeight: Font.medium, color: '#343831', marginLeft: 8 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center',
    elevation: 2,
  },
  logoutBtn: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8, borderWidth: 1, borderColor: Colors.error,
  },
  logoutText: { fontSize: 11, color: Colors.error, fontWeight: Font.semibold },

  // Banner
  banner: {
    width: '100%', height: 200,
    backgroundColor: 'rgba(139,195,74,0.8)',
    borderRadius: 24, marginBottom: 20,
    alignItems: 'center', justifyContent: 'center', padding: 16,
    shadowColor: Colors.green,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3,
    shadowRadius: 10, elevation: 5,
  },
  bannerSub: {
    fontSize: 10, color: '#DCFCE7', textAlign: 'center',
    textTransform: 'capitalize', marginBottom: 12,
  },
  qrBox: {
    width: 80, height: 80, backgroundColor: Colors.white,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  qrIcon: { fontSize: 50 },
  tapScanBtn: {
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10, paddingHorizontal: 18, paddingVertical: 8,
  },
  tapScanText: { fontSize: 11, fontWeight: Font.bold, color: Colors.white },

  // Sections
  sectionTitle: {
    fontSize: 15, fontWeight: Font.bold, color: '#111827', marginBottom: 12,
  },
  sectionRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8,
  },
  gfBadge: {
    backgroundColor: Colors.green, borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  gfText: { fontSize: 10, fontWeight: Font.bold, color: Colors.white },
  seeAll: { marginLeft: 'auto' },
  seeAllText: { fontSize: 11, fontWeight: Font.semibold, color: '#C8102E' },

  // Quick Access
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 24 },
  quickCard: {
    width: (width - 46) / 2, height: 140,
    backgroundColor: Colors.white, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 4,
  },
  quickIconBox: {
    width: 55, height: 55, borderRadius: 16, backgroundColor: Colors.greenLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  quickLabel: { fontSize: 12, fontWeight: Font.semibold, color: Colors.dark, textAlign: 'center' },

  // Horizontal row
  hRow: { paddingRight: 16, marginBottom: 24, gap: 14 },

  // Recipes
  recipeCard: {
    width: 138, height: 190,
    backgroundColor: Colors.white, borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 10, elevation: 5,
  },
  recipeImg: {
    width: '100%', height: 130, backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },
  recipeTitle: {
    fontSize: 13, fontWeight: Font.bold, color: '#000',
    textAlign: 'center', marginTop: 10, paddingHorizontal: 6,
  },

  // Events
  eventCard: {
    width: 160, backgroundColor: Colors.white, borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  eventImg: {
    width: '100%', height: 110, backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  eventBadge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: Colors.green, borderRadius: 999,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  eventInfo: { padding: 10 },
  eventName: { fontSize: 9, fontWeight: Font.bold, color: '#111827', marginBottom: 6 },
  eventMeta: { fontSize: 8, color: Colors.dark, marginBottom: 2 },

  // Bottom Nav
  bottomNav: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
    backgroundColor: Colors.white,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 10,
  },
  navBtn: { alignItems: 'center', gap: 2, minWidth: 48 },
  navLabel: { fontSize: 8, fontWeight: Font.medium, color: Colors.dark, marginTop: 2 },
  fab: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.green,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    borderWidth: 4, borderColor: Colors.bg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15, shadowRadius: 10, elevation: 8,
  },
});
