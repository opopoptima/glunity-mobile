import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/types';
import { AuthButton } from '@/shared/components/AuthButton';
import { Colors, Font, Spacing } from '@/shared/utils/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'EmailVerified'>;

export default function EmailVerifiedScreen({ route, navigation }: Props) {
  const success = route.params?.success !== false;

  if (success) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />
        <View style={styles.container}>
          {/* Icon */}
          <View style={styles.iconCircle}>
            <Text style={styles.iconEmoji}>✅</Text>
          </View>

          <Text style={styles.title}>Email Verified!</Text>
          <Text style={styles.body}>
            Your email address has been verified successfully.{'\n'}
            You can now log in to your account and enjoy GlUnity.
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

  // Failure state
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />
      <View style={styles.container}>
        <View style={[styles.iconCircle, styles.iconCircleRed]}>
          <Text style={styles.iconEmoji}>❌</Text>
        </View>

        <Text style={styles.title}>Verification Failed</Text>
        <Text style={styles.body}>
          This verification link is invalid or has expired.{'\n'}
          Please request a new verification email.
        </Text>

        <AuthButton
          label="Resend Verification"
          variant="filled"
          onPress={() => navigation.navigate('Login')}
          containerStyle={{ marginTop: Spacing.xl, width: '100%' }}
        />
        <AuthButton
          label="Back to Login"
          variant="outlined"
          onPress={() => navigation.navigate('Login')}
          containerStyle={{ marginTop: Spacing.md, width: '100%' }}
        />
      </View>
      <View style={styles.wave} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: 140,
  },

  iconCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: Colors.greenLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xl,
    shadowColor: Colors.green,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 16, elevation: 6,
  },
  iconCircleRed: { backgroundColor: 'rgba(229,57,53,0.1)' },
  iconEmoji: { fontSize: 60 },

  title: {
    fontSize: 26, fontWeight: Font.bold, color: Colors.dark,
    textAlign: 'center', marginBottom: Spacing.sm,
  },
  body: {
    fontSize: 15, color: Colors.muted, textAlign: 'center',
    lineHeight: 24,
  },

  wave: {
    position: 'absolute', bottom: 0, left: -4, right: -4,
    height: 110, backgroundColor: Colors.green,
    borderTopLeftRadius: 9999, borderTopRightRadius: 9999,
  },
});
