import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/types';
import { AuthInput } from '@/shared/components/AuthInput';
import { AuthButton } from '@/shared/components/AuthButton';
import { Colors, Font, Spacing, Radius } from '@/shared/utils/theme';
import authApi from '../../api/auth.api';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

type Step = 'form' | 'success' | 'error';

export default function ResetPasswordScreen({ route, navigation }: Props) {
  const token = route.params?.token ?? '';

  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [showConf, setShowConf]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [step, setStep]           = useState<Step>('form');
  const [errors, setErrors]       = useState<{ password?: string; confirm?: string }>({});
  const [apiError, setApiError]   = useState('');

  function validate(): boolean {
    const e: typeof errors = {};
    if (password.length < 8)
      e.password = 'Minimum 8 characters';
    else if (!/[A-Z]/.test(password))
      e.password = 'Must include an uppercase letter';
    else if (!/[0-9]/.test(password))
      e.password = 'Must include a number';
    if (confirm !== password)
      e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleReset() {
    setApiError('');
    if (!validate()) return;
    if (!token) {
      setApiError('Invalid or missing reset token. Please request a new link.');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setStep('success');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Reset failed. The link may have expired.';
      setApiError(msg);
      if (msg.toLowerCase().includes('expir')) setStep('error');
    } finally {
      setLoading(false);
    }
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />
        <View style={styles.centeredBox}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconEmoji}>🔓</Text>
          </View>
          <Text style={styles.resultTitle}>Password Updated!</Text>
          <Text style={styles.resultBody}>
            Your password has been reset successfully.{'\n'}You can now log in with your new password.
          </Text>
          <AuthButton
            label="Go to Login"
            variant="filled"
            onPress={() => navigation.navigate('Login')}
            containerStyle={{ marginTop: Spacing.xl, width: '100%' }}
          />
        </View>
        <View style={styles.wave} />
      </SafeAreaView>
    );
  }

  // ── Error (expired) ────────────────────────────────────────────────────────
  if (step === 'error') {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />
        <View style={styles.centeredBox}>
          <View style={[styles.iconCircle, styles.iconCircleRed]}>
            <Text style={styles.iconEmoji}>⏰</Text>
          </View>
          <Text style={styles.resultTitle}>Link Expired</Text>
          <Text style={styles.resultBody}>
            This reset link has expired or was already used.{'\n'}Please request a new one.
          </Text>
          <AuthButton
            label="Request New Link"
            variant="filled"
            onPress={() => navigation.navigate('ForgotPassword')}
            containerStyle={{ marginTop: Spacing.xl, width: '100%' }}
          />
          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backWrap}>
            <Text style={styles.backText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.wave} />
      </SafeAreaView>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Icon */}
          <View style={styles.iconCircle}>
            <Text style={styles.iconEmoji}>🔐</Text>
          </View>

          <Text style={styles.title}>Set New Password</Text>
          <Text style={styles.subtitle}>
            Choose a strong new password for your account.
          </Text>

          {/* API error */}
          {!!apiError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{apiError}</Text>
            </View>
          )}

          <AuthInput
            label="New Password"
            placeholder="At least 8 characters"
            secureTextEntry={!showPass}
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            rightIcon={<Text style={styles.eye}>{showPass ? '🙈' : '👁️'}</Text>}
            onRightIconPress={() => setShowPass((p) => !p)}
          />
          <AuthInput
            label="Confirm Password"
            placeholder="Re-enter your password"
            secureTextEntry={!showConf}
            value={confirm}
            onChangeText={setConfirm}
            error={errors.confirm}
            rightIcon={<Text style={styles.eye}>{showConf ? '🙈' : '👁️'}</Text>}
            onRightIconPress={() => setShowConf((p) => !p)}
          />

          <Text style={styles.hint}>Min 8 chars · one uppercase · one number</Text>

          <AuthButton
            label="Reset Password"
            variant="filled"
            loading={loading}
            onPress={handleReset}
            containerStyle={{ marginTop: Spacing.sm }}
          />

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backWrap}>
            <Text style={styles.backText}>Back to Login</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.wave} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: Colors.bg },
  flex:  { flex: 1 },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: 140,
    alignItems: 'center',
  },

  centeredBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: 140,
  },

  iconCircle: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: Colors.greenLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xl,
    shadowColor: Colors.green,
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2,
    shadowRadius: 16, elevation: 6,
  },
  iconCircleRed: { backgroundColor: 'rgba(229,57,53,0.1)' },
  iconEmoji: { fontSize: 52 },

  title: {
    fontSize: 24, fontWeight: Font.bold, color: Colors.dark,
    textAlign: 'center', marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 14, color: Colors.muted, textAlign: 'center',
    lineHeight: 22, marginBottom: Spacing.xl, width: '100%',
  },

  errorBanner: {
    backgroundColor: Colors.errorLight, borderWidth: 1, borderColor: Colors.error,
    borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md,
    width: '100%',
  },
  errorText: { color: Colors.error, fontSize: 13 },

  hint: { fontSize: 12, color: Colors.muted, marginBottom: Spacing.lg, textAlign: 'center' },

  backWrap: { alignSelf: 'center', marginTop: Spacing.lg },
  backText: { fontSize: 14, fontWeight: Font.medium, color: Colors.muted },

  resultTitle: {
    fontSize: 24, fontWeight: Font.bold, color: Colors.dark,
    textAlign: 'center', marginBottom: Spacing.sm,
  },
  resultBody: {
    fontSize: 14, color: Colors.muted, textAlign: 'center', lineHeight: 22,
  },

  eye: { fontSize: 18 },
  wave: {
    position: 'absolute', bottom: 0, left: -4, right: -4,
    height: 110, backgroundColor: Colors.green,
    borderTopLeftRadius: 9999, borderTopRightRadius: 9999,
  },
});
