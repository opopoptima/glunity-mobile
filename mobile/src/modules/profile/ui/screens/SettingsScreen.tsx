import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Switch,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'Settings'>;

const C = {
  green:  '#8BC34A',
  dark:   '#2E2E2E',
  bg:     '#F6F5F3',
  white:  '#FFFFFF',
  muted:  '#6B6B6B',
  red:    '#C8102E',
  redLight: 'rgba(200,16,46,0.08)',
  border: 'rgba(46,46,46,0.12)',
};

// ── SettingItem ────────────────────────────────────────────────────────────────
interface SettingItemProps {
  iconName: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  showArrow?: boolean;
  showSwitch?: boolean;
  isLast?: boolean;
  danger?: boolean;
  onPress?: () => void;
}

function SettingItem({
  iconName, iconColor, title, subtitle,
  showArrow = true, showSwitch = false,
  isLast = false, danger = false, onPress,
}: SettingItemProps) {
  const [enabled, setEnabled] = useState(true);
  const color = danger ? C.red : (iconColor ?? C.green);

  return (
    <TouchableOpacity
      style={[s.row, !isLast && s.rowBorder]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[s.rowIcon, { backgroundColor: danger ? C.redLight : 'rgba(139,195,74,0.12)' }]}>
        <MaterialCommunityIcons name={iconName as any} size={20} color={color} />
      </View>

      <View style={s.rowContent}>
        <Text style={[s.rowTitle, danger && { color: C.red }]}>{title}</Text>
        {subtitle ? <Text style={s.rowSub}>{subtitle}</Text> : null}
      </View>

      {showSwitch ? (
        <Switch
          value={enabled}
          onValueChange={setEnabled}
          trackColor={{ false: '#ccc', true: C.green }}
          thumbColor={C.white}
        />
      ) : showArrow ? (
        <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(46,46,46,0.3)" />
      ) : null}
    </TouchableOpacity>
  );
}

// ── SettingsScreen ─────────────────────────────────────────────────────────────
export default function SettingsScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.headerBack} onPress={() => navigation.goBack()} id="settings-back-btn">
          <MaterialCommunityIcons name="arrow-left" size={22} color={C.dark} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Settings</Text>
        <TouchableOpacity style={s.headerBack} id="settings-notif-btn">
          <MaterialCommunityIcons name="bell-outline" size={22} color={C.dark} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ACCOUNT */}
        <Text style={s.sectionLabel}>ACCOUNT</Text>
        <View style={s.card}>
          <SettingItem
            iconName="account-edit-outline"
            title="Edit Profile"
            subtitle="Update your name, photo & info"
            onPress={() => navigation.navigate('EditProfile')}
          />
          <SettingItem
            iconName="lock-outline"
            title="Change Password"
            subtitle="Update your login credentials"
            isLast
            onPress={() => navigation.navigate('EditProfile')}
          />
        </View>

        {/* NOTIFICATIONS */}
        <Text style={s.sectionLabel}>NOTIFICATIONS</Text>
        <View style={s.card}>
          <SettingItem
            iconName="bell-ring-outline"
            title="Push Notifications"
            subtitle="Alerts, reminders and updates"
            showArrow={false}
            showSwitch
          />
          <SettingItem
            iconName="email-outline"
            title="Email Updates"
            subtitle="Weekly digest and newsletters"
            showArrow={false}
            showSwitch
            isLast
          />
        </View>

        {/* APPEARANCE */}
        <Text style={s.sectionLabel}>APPEARANCE</Text>
        <View style={s.card}>
          <SettingItem
            iconName="weather-night"
            title="Dark Mode"
            subtitle="Switch to dark theme"
            showArrow={false}
            showSwitch
          />
          <SettingItem
            iconName="format-size"
            title="Text Size"
            subtitle="Adjust reading comfort"
            isLast
          />
        </View>

        {/* SUPPORT */}
        <Text style={s.sectionLabel}>SUPPORT</Text>
        <View style={s.card}>
          <SettingItem
            iconName="help-circle-outline"
            title="Help Center"
            subtitle="FAQs and guides"
          />
          <SettingItem
            iconName="bug-outline"
            title="Report a Bug"
            subtitle="Help us improve the app"
            isLast
          />
        </View>

        {/* DANGER ZONE */}
        <Text style={s.sectionLabel}>DANGER ZONE</Text>
        <View style={s.card}>
          <SettingItem
            iconName="logout"
            title="Log Out"
            showArrow={false}
            danger
            isLast
            onPress={() => navigation.navigate('Profile')}
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Nav */}
      <View style={s.bottomNav}>
        <TouchableOpacity style={s.navBtn} onPress={() => navigation.navigate('Home')} id="settings-nav-home">
          <MaterialCommunityIcons name="home-outline" size={24} color={C.dark} />
          <Text style={s.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.navBtn} id="settings-nav-events">
          <MaterialCommunityIcons name="calendar-outline" size={24} color={C.dark} />
          <Text style={s.navLabel}>Events</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.fab} id="settings-nav-fab">
          <MaterialCommunityIcons name="plus" size={28} color={C.white} />
        </TouchableOpacity>

        <TouchableOpacity style={s.navBtn} id="settings-nav-reels">
          <MaterialCommunityIcons name="play-circle-outline" size={24} color={C.dark} />
          <Text style={s.navLabel}>Reels</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.navBtn} onPress={() => navigation.navigate('Profile')} id="settings-nav-profile">
          <MaterialCommunityIcons name="account" size={24} color={C.green} />
          <Text style={[s.navLabel, { color: C.green }]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 20,
    paddingTop: 12, paddingBottom: 8,
  },
  headerBack: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.white, alignItems: 'center', justifyContent: 'center',
    elevation: 2,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.dark },

  scroll: { paddingHorizontal: 16, paddingTop: 12 },

  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: 'rgba(46,46,46,0.4)',
    marginBottom: 8, marginTop: 16, letterSpacing: 1,
  },
  card: {
    backgroundColor: C.white, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 14,
  },
  rowBorder: { borderBottomWidth: 0.5, borderBottomColor: C.border },
  rowIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: C.dark },
  rowSub:   { fontSize: 11, color: C.muted, marginTop: 2 },

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
