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
  Keyboard,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../navigation/types';
import { AuthInput } from '../../../../shared/components/AuthInput';
import { AuthButton } from '../../../../shared/components/AuthButton';
import { Colors, Font, Spacing, Radius } from '../../../../shared/utils/theme';
import { useAuth } from '../../state/auth.context';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

interface FormState {
  fullName: string;
  email: string;
  password: string;
  confirm: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

export default function RegisterScreen({ navigation }: Props) {
  const { register, isLoading, error, clearError } = useAuth();

  const [form, setForm] = useState<FormState>({
    fullName: '',
    email: '',
    password: '',
    confirm: '',
  });
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors]           = useState<FormErrors>({});

  const set = (key: keyof FormState) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  function validate(): boolean {
    const e: FormErrors = {};
    if (!form.fullName.trim() || form.fullName.trim().length < 2)
      e.fullName = 'Full name must be at least 2 characters';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email))
      e.email = 'Valid email is required';
    if (form.password.length < 8)
      e.password = 'Password must be at least 8 characters';
    else if (!/[A-Z]/.test(form.password))
      e.password = 'Must contain an uppercase letter';
    else if (!/[0-9]/.test(form.password))
      e.password = 'Must contain a number';
    if (form.confirm !== form.password)
      e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleRegister() {
    if (Platform.OS === 'web') {
      const el = document.activeElement as HTMLElement | null;
      el?.blur();
    } else {
      Keyboard.dismiss();
    }

    clearError();
    if (!validate()) return;
    try {
      await register({
        fullName: form.fullName.trim(),
        email:    form.email.trim().toLowerCase(),
        password: form.password,
      });
    } catch {
      // error already in context
    }
  }

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
          {/* Divider accent */}
          <View style={styles.divider} />

          {/* Title */}
          <Text style={styles.title}>GET STARTED</Text>
          <Text style={styles.subtitle}>Create your free account</Text>

          {/* API error banner */}
          {!!error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}

          {/* Fields */}
          <AuthInput
            label="Full Name"
            placeholder="Enter your name"
            value={form.fullName}
            onChangeText={set('fullName')}
            error={errors.fullName}
          />
          <AuthInput
            label="Email"
            placeholder="Enter your email"
            keyboardType="email-address"
            value={form.email}
            onChangeText={set('email')}
            error={errors.email}
          />
          <AuthInput
            label="Password"
            placeholder="Create a password"
            secureTextEntry={!showPass}
            value={form.password}
            onChangeText={set('password')}
            error={errors.password}
            rightIcon={<Text style={styles.eye}>{showPass ? '🙈' : '👁️'}</Text>}
            onRightIconPress={() => setShowPass((p) => !p)}
          />
          <AuthInput
            label="Confirm Password"
            placeholder="Re-enter your password"
            secureTextEntry={!showConfirm}
            value={form.confirm}
            onChangeText={set('confirm')}
            error={errors.confirm}
            rightIcon={<Text style={styles.eye}>{showConfirm ? '🙈' : '👁️'}</Text>}
            onRightIconPress={() => setShowConfirm((p) => !p)}
          />

          {/* Password strength hint */}
          <Text style={styles.hint}>
            Min 8 chars · one uppercase · one number
          </Text>

          {/* Submit */}
          <View style={styles.btnGroup}>
            <AuthButton
              label="REGISTER"
              variant="outlined"
              loading={isLoading}
              onPress={handleRegister}
            />
          </View>

          {/* Switch to login */}
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.switchLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Wave bottom */}
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
    paddingBottom: 130,
    paddingTop: Spacing.xl,
  },

  divider: {
    width: '90%',
    height: 1,
    backgroundColor: Colors.white,
    alignSelf: 'center',
    marginBottom: Spacing.xl,
  },

  title: {
    fontSize: 22,
    fontWeight: Font.bold,
    color: Colors.dark,
    textAlign: 'center',
    letterSpacing: 1.5,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.muted,
    fontWeight: Font.medium,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },

  // Error banner
  errorBanner: {
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorBannerText: { color: Colors.error, fontSize: 13, fontWeight: Font.medium },

  hint: {
    fontSize: 12,
    color: Colors.muted,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },

  btnGroup: { marginBottom: Spacing.lg },

  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchText: { fontSize: 14, fontWeight: Font.light, color: Colors.muted },
  switchLink: { fontSize: 14, fontWeight: Font.bold, color: Colors.green },

  eye: { fontSize: 18 },

  wave: {
    position: 'absolute',
    bottom: 0, left: -4, right: -4,
    height: 110,
    backgroundColor: Colors.green,
    borderTopLeftRadius: 9999,
    borderTopRightRadius: 9999,
  },
});
