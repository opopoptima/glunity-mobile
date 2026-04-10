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
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../navigation/types';
import { AuthInput } from '../../../../shared/components/AuthInput';
import { AuthButton } from '../../../../shared/components/AuthButton';
import { Colors, Font, Spacing, Radius } from '../../../../shared/utils/theme';
import { useAuth } from '../../state/auth.context';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { login, isLoading, error, clearError } = useAuth();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass]  = useState(false);

  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate(): boolean {
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleLogin() {
    clearError();
    if (!validate()) return;
    try {
      await login({ email: email.trim().toLowerCase(), password });
      // Navigation handled by RootNavigator after auth state change
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
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.mascot}>🦸</Text>
            <View style={styles.divider} />
          </View>

          {/* Title */}
          <Text style={styles.title}>Login</Text>

          {/* API error banner */}
          {!!error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}

          {/* Fields */}
          <AuthInput
            label="Email"
            placeholder="Enter your email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
          />
          <AuthInput
            label="Password"
            placeholder="Enter your password"
            secureTextEntry={!showPass}
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            rightIcon={
              <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁️'}</Text>
            }
            onRightIconPress={() => setShowPass((p) => !p)}
          />

          {/* Forgot password */}
          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotWrap}
          >
            <Text style={styles.forgot}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Submit */}
          <View style={styles.btnGroup}>
            <AuthButton
              label="LOGIN"
              variant="outlined"
              loading={isLoading}
              onPress={handleLogin}
            />
          </View>

          {/* Switch to register */}
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>No Account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.switchLink}>Register</Text>
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
    paddingBottom: 120,
    paddingTop: Spacing.lg,
  },

  // Header area
  header: { alignItems: 'center', marginBottom: Spacing.lg },
  mascot: { fontSize: 80, marginBottom: Spacing.md },
  divider: {
    width: '90%',
    height: 1,
    backgroundColor: Colors.white,
  },

  title: {
    fontSize: 28,
    fontWeight: Font.semibold,
    color: Colors.dark,
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
  errorBannerText: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: Font.medium,
  },

  // Forgot
  forgotWrap: { alignSelf: 'flex-start', marginBottom: Spacing.lg },
  forgot: {
    fontSize: 14,
    fontWeight: Font.bold,
    color: Colors.dark,
  },

  btnGroup: { marginBottom: Spacing.lg },

  // Switch
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchText: {
    fontSize: 14,
    fontWeight: Font.light,
    color: Colors.muted,
  },
  switchLink: {
    fontSize: 14,
    fontWeight: Font.bold,
    color: Colors.green,
  },

  eyeIcon: { fontSize: 18 },

  // Wave
  wave: {
    position: 'absolute',
    bottom: 0, left: -4, right: -4,
    height: 110,
    backgroundColor: Colors.green,
    borderTopLeftRadius: 9999,
    borderTopRightRadius: 9999,
  },
});
