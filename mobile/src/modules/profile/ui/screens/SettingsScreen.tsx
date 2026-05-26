import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '@/modules/auth/navigation/types';
import { AppScaffold } from '@/shared/components/AppScaffold';
import { useAuth } from '@/modules/auth/state/auth.context';
import { useTheme } from '@/shared/context/theme.context';
import authApi from '@/modules/auth/api/auth.api';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = NativeStackScreenProps<AppStackParamList, 'Settings'>;

const { width } = Dimensions.get('window');

const F = {
  regular: 'Poppins_400Regular',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
};

const FAQS = [
  {
    q: 'How do I know a product is gluten-free?',
    a: 'All products displayed on GlUnity are certified gluten-free by our partner sellers. Look for the "GF" badge on the product list, or check the recommended status of the bakery itself.',
  },
  {
    q: 'How can I contact a seller?',
    a: 'You can tap on the "View Seller" button on the product details page to view their profile, where you can call them directly or send a message.',
  },
  {
    q: 'What is a Glutenia-recommended bakery?',
    a: 'It is a bakery verified by our medical and food safety teams to ensure 100% cross-contamination-free production, safe for celiacs.',
  },
  {
    q: 'How do I change my language preferences?',
    a: 'You can update your language in the Edit Profile page or by editing your account settings directly.',
  },
];

// ── SettingItem ────────────────────────────────────────────────────────────────
interface SettingItemProps {
  iconName: string;
  title: string;
  subtitle?: string;
  showChevron?: boolean;
  showSwitch?: boolean;
  valueText?: string;
  isLast?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  onPress?: () => void;
  theme: ReturnType<typeof useTheme>['theme'];
}

function SettingItem({
  iconName,
  title,
  subtitle,
  showChevron = true,
  showSwitch = false,
  valueText,
  isLast = false,
  switchValue,
  onSwitchChange,
  onPress,
  theme: C,
}: SettingItemProps) {
  const s = useMemo(() => StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, backgroundColor: C.surface },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
    rowIcon: { width: 32, alignItems: 'flex-start' },
    rowContent: { flex: 1 },
    rowTitle: { fontFamily: F.semibold, fontSize: 15, color: C.text },
    rowSub: { fontFamily: F.regular, fontSize: 12, color: C.muted, marginTop: 2 },
    rowRight: { flexDirection: 'row', alignItems: 'center' },
    rowValue: { fontFamily: F.regular, fontSize: 14, color: C.muted, marginRight: 8 },
  }), [C]);

  return (
    <TouchableOpacity
      style={[s.row, !isLast && s.rowBorder]}
      onPress={showSwitch ? undefined : onPress}
      activeOpacity={showSwitch ? 1 : 0.7}
    >
      <View style={s.rowIcon}>
        <MaterialCommunityIcons name={iconName as any} size={18} color={C.red} />
      </View>

      <View style={s.rowContent}>
        <Text style={s.rowTitle}>{title}</Text>
        {subtitle ? <Text style={s.rowSub}>{subtitle}</Text> : null}
      </View>

      {showSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: C.switchTrack, true: C.green }}
          thumbColor={C.white}
        />
      ) : (
        <View style={s.rowRight}>
          {valueText ? <Text style={s.rowValue}>{valueText}</Text> : null}
          {showChevron ? <MaterialCommunityIcons name="chevron-right" size={18} color={C.mutedLight} /> : null}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── SettingsScreen ─────────────────────────────────────────────────────────────
export default function SettingsScreen({ navigation }: Props) {
  const { user, logout, updateProfile, textSize, updateTextSize } = useAuth();
  const { theme: C, isDark, setDark } = useTheme();
  
  // Notification preferences
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);

  // Text size preference modal visibility
  const [showTextSizeModal, setShowTextSizeModal] = useState(false);

  // Change Password Modal States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Help Center Modal States
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Report Bug Modal States
  const [showBugModal, setShowBugModal] = useState(false);
  const [bugTitle, setBugTitle] = useState('');
  const [bugDesc, setBugDesc] = useState('');
  const [bugSeverity, setBugSeverity] = useState('Medium');
  const [bugLoading, setBugLoading] = useState(false);
  const [bugSuccess, setBugSuccess] = useState(false);

  // Load preferences from local storage on mount
  useEffect(() => {
    async function loadPreferences() {
      try {
        const pushPref = await AsyncStorage.getItem('@pref_push');
        if (pushPref !== null) setPushEnabled(pushPref === 'true');

        const emailPref = await AsyncStorage.getItem('@pref_email');
        if (emailPref !== null) setEmailEnabled(emailPref === 'true');
      } catch (e) {
        console.error('Error loading settings preferences:', e);
      }
    }
    loadPreferences();
  }, []);

  const handlePushToggle = async (val: boolean) => {
    setPushEnabled(val);
    try {
      await AsyncStorage.setItem('@pref_push', String(val));
    } catch (e) {
      console.error(e);
    }
  };

  const handleEmailToggle = async (val: boolean) => {
    setEmailEnabled(val);
    try {
      await AsyncStorage.setItem('@pref_email', String(val));
    } catch (e) {
      console.error(e);
    }
  };

  const handleTextSizeSelect = async (size: 'Small' | 'Medium' | 'Large') => {
    setShowTextSizeModal(false);
    try {
      await updateTextSize(size);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDarkModeToggle = (val: boolean) => {
    // Instant — no API wait, no lag
    setDark(val);
    // Persist to backend silently in background
    updateProfile({ darkMode: val }).catch(() => {});
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setPasswordSuccess('Password updated successfully! ✅');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess('');
      }, 1500);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to change password. Please verify current password.';
      setPasswordError(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleReportBug = async () => {
    if (!bugTitle.trim() || !bugDesc.trim()) {
      Alert.alert('Fields Required', 'Please enter a bug title and description.');
      return;
    }

    setBugLoading(true);
    try {
      // Simulate API submission delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setBugSuccess(true);
      setBugTitle('');
      setBugDesc('');
      setTimeout(() => {
        setShowBugModal(false);
        setBugSuccess(false);
      }, 1500);
    } catch (e) {
      Alert.alert('Submission Error', 'Failed to report bug. Please try again.');
    } finally {
      setBugLoading(false);
    }
  };

  // ── Dynamic styles (recomputed on every theme change) ──────────────────────
  const s = useMemo(() => StyleSheet.create({
    safe:         { flex: 1, backgroundColor: C.bg },
    scroll:       { paddingHorizontal: 16, paddingTop: 12 },
    sectionLabel: {
      fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 0.9,
      marginTop: 24, marginBottom: 8, fontFamily: F.bold, paddingHorizontal: 2,
    },
    card:         { backgroundColor: C.surface, borderRadius: 16, overflow: 'hidden' },
    logoutBtn:    {
      marginTop: 24, height: 54, borderRadius: 16, backgroundColor: C.green,
      paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    logoutIconWrap: {
      width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.25)',
    },
    logoutText:   { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '700', color: C.white, fontFamily: F.bold },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
    modalContent: {
      width: '92%', backgroundColor: C.surface, borderRadius: 24, padding: 24,
      shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 16,
    },
    modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle:   { fontSize: 18, fontWeight: '700', color: C.text, fontFamily: F.bold },
    modalErrorBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.redLight,
      borderColor: C.red, borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 14,
    },
    modalErrorText:   { flex: 1, fontSize: 13, color: C.red, fontFamily: F.regular },
    modalSuccessBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.greenLight,
      borderColor: C.green, borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 14,
    },
    modalSuccessText: { flex: 1, fontSize: 13, color: C.green, fontFamily: F.regular },
    modalForm:    { gap: 14 },
    inputLabel:   { fontSize: 12, fontWeight: '600', color: C.textSub, fontFamily: F.semibold },
    modalInput:   {
      borderWidth: 1.5, borderColor: C.inputBorder, borderRadius: 12,
      paddingVertical: 12, paddingHorizontal: 14,
      fontSize: 14, color: C.text, backgroundColor: C.inputBg, fontFamily: F.regular,
    },
    modalBtn:     { backgroundColor: C.green, borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
    modalBtnText: { fontSize: 15, color: C.white, fontWeight: '700', fontFamily: F.bold },
    // Text size modal
    sizeOptionRow:       {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border,
    },
    sizeOptionText:      { fontSize: 15, color: C.text, fontFamily: F.regular },
    sizeOptionTextActive:{ color: C.green, fontWeight: '700', fontFamily: F.bold },
    // Help modal
    helpHeaderDesc: { fontSize: 13, color: C.textMuted, marginBottom: 16, fontFamily: F.regular },
    faqItem:        { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border, paddingVertical: 14 },
    faqQuestionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
    faqQuestion:    { flex: 1, fontSize: 14, fontWeight: '600', color: C.text, fontFamily: F.semibold },
    faqAnswer:      { fontSize: 13, color: C.textSub, marginTop: 10, lineHeight: 20, fontFamily: F.regular },
    // Bug modal
    bugSuccessContainer: { alignItems: 'center', paddingVertical: 36, gap: 10 },
    bugSuccessTitle:     { fontSize: 18, fontWeight: '700', color: C.text, fontFamily: F.bold },
    bugSuccessSub:       { fontSize: 13, color: C.textSub, fontFamily: F.regular },
    severityRow: { flexDirection: 'row', gap: 10 },
    severityBtn: {
      flex: 1, borderWidth: 1.5, borderColor: C.inputBorder, borderRadius: 10,
      paddingVertical: 10, alignItems: 'center', backgroundColor: C.inputBg,
    },
    severityBtnText: { fontSize: 13, fontWeight: '600', color: C.textSub, fontFamily: F.semibold },
  }), [C]);

  const placeholderColor = C.textMuted;

  return (
    <>
    <AppScaffold
      title="Settings"
      activeTab="profile"
      onBack={() => navigation.goBack()}
      onPressHome={() => navigation.navigate('Home')}
      onPressEvents={() => navigation.navigate('Map')}
      onPressCenter={() => {}}
      onPressReels={() => {}}
      onPressProfile={() => {
        if (user?.profileType === 'pro_commerce') {
          navigation.navigate('SellerProProfile');
        } else {
          navigation.navigate('Profile');
        }
      }}
      contentStyle={{ backgroundColor: C.bg }}
    >
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ACCOUNT */}
        <Text style={s.sectionLabel}>ACCOUNT</Text>
        <View style={s.card}>
          <SettingItem
            theme={C}
            iconName="account-edit-outline"
            title="Edit Profile"
            subtitle="Update your name, photo & info"
            onPress={() => navigation.navigate('EditProfile')}
          />
          <SettingItem
            theme={C}
            iconName="lock-outline"
            title="Change Password"
            subtitle="Update your login credentials"
            isLast
            onPress={() => setShowPasswordModal(true)}
          />
        </View>

        {/* NOTIFICATIONS */}
        <Text style={s.sectionLabel}>NOTIFICATIONS</Text>
        <View style={s.card}>
          <SettingItem
            theme={C}
            iconName="bell-ring-outline"
            title="Push Notifications"
            subtitle="Alerts, reminders and updates"
            showSwitch
            switchValue={pushEnabled}
            onSwitchChange={handlePushToggle}
          />
          <SettingItem
            theme={C}
            iconName="email-outline"
            title="Email Updates"
            subtitle="Weekly digest and newsletters"
            showSwitch
            switchValue={emailEnabled}
            onSwitchChange={handleEmailToggle}
            isLast
          />
        </View>

        {/* APPEARANCE */}
        <Text style={s.sectionLabel}>APPEARANCE</Text>
        <View style={s.card}>
          <SettingItem
            theme={C}
            iconName="weather-night"
            title="Dark Mode"
            subtitle="Switch to dark theme"
            showSwitch
            switchValue={isDark}
            onSwitchChange={handleDarkModeToggle}
          />
          <SettingItem
            theme={C}
            iconName="format-size"
            title="Text Size"
            valueText={textSize}
            isLast
            onPress={() => setShowTextSizeModal(true)}
          />
        </View>

        {/* SUPPORT */}
        <Text style={s.sectionLabel}>SUPPORT</Text>
        <View style={s.card}>
          <SettingItem
            theme={C}
            iconName="help-circle-outline"
            title="Help Center"
            subtitle="FAQs and guides"
            onPress={() => setShowHelpModal(true)}
          />
          <SettingItem
            theme={C}
            iconName="bug-outline"
            title="Report a Bug"
            subtitle="Help us improve the app"
            isLast
            onPress={() => setShowBugModal(true)}
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </AppScaffold>

      {/* ── Modal: Change Password ────────────────────────────────────────── */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => {
                setShowPasswordModal(false);
                setPasswordError('');
                setPasswordSuccess('');
              }}>
                <MaterialCommunityIcons name="close" size={22} color={C.text} />
              </TouchableOpacity>
            </View>

            {!!passwordError && (
              <View style={s.modalErrorBanner}>
                <MaterialCommunityIcons name="alert-circle" size={16} color={C.red} />
                <Text style={s.modalErrorText}>{passwordError}</Text>
              </View>
            )}

            {!!passwordSuccess && (
              <View style={s.modalSuccessBanner}>
                <MaterialCommunityIcons name="check-circle" size={16} color={C.green} />
                <Text style={s.modalSuccessText}>{passwordSuccess}</Text>
              </View>
            )}

            <View style={s.modalForm}>
              <Text style={s.inputLabel}>Current Password</Text>
              <TextInput
                style={s.modalInput}
                secureTextEntry
                placeholder="Enter current password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholderTextColor={placeholderColor}
              />

              <Text style={s.inputLabel}>New Password</Text>
              <TextInput
                style={s.modalInput}
                secureTextEntry
                placeholder="Enter new password"
                value={newPassword}
                onChangeText={setNewPassword}
                placeholderTextColor={placeholderColor}
              />

              <Text style={s.inputLabel}>Confirm New Password</Text>
              <TextInput
                style={s.modalInput}
                secureTextEntry
                placeholder="Confirm new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholderTextColor={placeholderColor}
              />

              <TouchableOpacity
                style={[s.modalBtn, passwordLoading && { opacity: 0.75 }]}
                onPress={handleChangePassword}
                disabled={passwordLoading}
              >
                {passwordLoading ? (
                  <ActivityIndicator color={C.white} size="small" />
                ) : (
                  <Text style={s.modalBtnText}>Change Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal: Text Size Selection ────────────────────────────────────── */}
      <Modal
        visible={showTextSizeModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowTextSizeModal(false)}
      >
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { width: '80%' }]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Text Size</Text>
              <TouchableOpacity onPress={() => setShowTextSizeModal(false)}>
                <MaterialCommunityIcons name="close" size={22} color={C.text} />
              </TouchableOpacity>
            </View>

            <View style={{ paddingVertical: 10 }}>
              {(['Small', 'Medium', 'Large'] as const).map((size) => (
                <TouchableOpacity
                  key={size}
                  style={s.sizeOptionRow}
                  onPress={() => handleTextSizeSelect(size)}
                >
                  <Text style={[s.sizeOptionText, textSize === size && s.sizeOptionTextActive]}>
                    {size}
                  </Text>
                  {textSize === size && (
                    <MaterialCommunityIcons name="check" size={18} color={C.green} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal: Help Center (FAQs) ─────────────────────────────────────── */}
      <Modal
        visible={showHelpModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowHelpModal(false)}
      >
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { maxHeight: '80%' }]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Help Center</Text>
              <TouchableOpacity onPress={() => setShowHelpModal(false)}>
                <MaterialCommunityIcons name="close" size={22} color={C.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginVertical: 10 }}>
              <Text style={s.helpHeaderDesc}>Frequently Asked Questions</Text>
              {FAQS.map((faq, i) => (
                <View key={i} style={s.faqItem}>
                  <TouchableOpacity
                    style={s.faqQuestionRow}
                    activeOpacity={0.7}
                    onPress={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  >
                    <Text style={s.faqQuestion}>{faq.q}</Text>
                    <MaterialCommunityIcons
                      name={expandedFaq === i ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={C.textMuted}
                    />
                  </TouchableOpacity>
                  {expandedFaq === i && (
                    <Text style={s.faqAnswer}>{faq.a}</Text>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Modal: Report Bug ─────────────────────────────────────────────── */}
      <Modal
        visible={showBugModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowBugModal(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Report a Bug</Text>
              <TouchableOpacity onPress={() => setShowBugModal(false)}>
                <MaterialCommunityIcons name="close" size={22} color={C.text} />
              </TouchableOpacity>
            </View>

            {bugSuccess ? (
              <View style={s.bugSuccessContainer}>
                <MaterialCommunityIcons name="check-circle-outline" size={48} color={C.green} />
                <Text style={s.bugSuccessTitle}>Thank you! ✅</Text>
                <Text style={s.bugSuccessSub}>Your report has been submitted.</Text>
              </View>
            ) : (
              <View style={s.modalForm}>
                <Text style={s.inputLabel}>Bug Title</Text>
                <TextInput
                  style={s.modalInput}
                  placeholder="e.g. App crashes on search"
                  value={bugTitle}
                  onChangeText={setBugTitle}
                  placeholderTextColor={placeholderColor}
                />

                <Text style={s.inputLabel}>Bug Description</Text>
                <TextInput
                  style={[s.modalInput, { height: 80, textAlignVertical: 'top', paddingTop: 10 }]}
                  multiline
                  placeholder="Tell us what went wrong..."
                  value={bugDesc}
                  onChangeText={setBugDesc}
                  placeholderTextColor={placeholderColor}
                />

                <Text style={s.inputLabel}>Severity</Text>
                <View style={s.severityRow}>
                  {['Low', 'Medium', 'High'].map((sev) => (
                    <TouchableOpacity
                      key={sev}
                      style={[
                        s.severityBtn,
                        bugSeverity === sev && { backgroundColor: C.green, borderColor: C.green },
                      ]}
                      onPress={() => setBugSeverity(sev)}
                    >
                      <Text style={[s.severityBtnText, bugSeverity === sev && { color: C.white }]}>
                        {sev}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={[s.modalBtn, bugLoading && { opacity: 0.75 }]}
                  onPress={handleReportBug}
                  disabled={bugLoading}
                >
                  {bugLoading ? (
                    <ActivityIndicator color={C.white} size="small" />
                  ) : (
                    <Text style={s.modalBtnText}>Submit Report</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

    </>
  );
}

