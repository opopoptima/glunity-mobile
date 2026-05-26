import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/types';
import { AuthButton } from '@/shared/components/AuthButton';
import { useTheme } from '@/shared/context/theme.context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  const { theme: T, isDark } = useTheme();

  const styles = React.useMemo(() => StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: T.bg,
    },
    container: {
      flex: 1,
      paddingHorizontal: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    mascotWrap: {
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: T.greenLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
      // subtle shadow
      ...Platform.select({
        ios: {
          shadowColor: T.green,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.18,
          shadowRadius: 20,
        },
        android: {
          elevation: 8,
        },
        web: {
          boxShadow: `0px 8px 20px rgba(139, 195, 74, 0.18)`,
        },
      }),
    },
    mascot: {
      fontSize: 80,
    },
    title: {
      fontSize: 34,
      fontWeight: '600',
      fontFamily: 'Poppins_600SemiBold',
      color: T.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      fontWeight: '500',
      fontFamily: 'Poppins_500Medium',
      color: T.textSub,
      textAlign: 'center',
      lineHeight: 26,
      marginBottom: 40,
    },
    btnGroup: {
      width: '100%',
    },
    btnSep: {
      height: 16,
    },
    waveBg: {
      position: 'absolute',
      bottom: 0,
      left: -4,
      right: -4,
      height: 130,
      backgroundColor: T.green,
      borderTopLeftRadius: 9999,
      borderTopRightRadius: 9999,
      opacity: 0.15,
    },
  }), [T]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={T.bg} />

      <View style={styles.container}>
        {/* Mascot */}
        <View style={styles.mascotWrap}>
          <MaterialCommunityIcons name={"barley" as any} size={80} color={T.green} />
        </View>

        {/* Heading */}
        <Text style={styles.title}>Salut, Bienvenue!</Text>
        <Text style={styles.subtitle}>
          Connectez-vous{'\n'}pour continuer
        </Text>

        {/* CTA Buttons */}
        <View style={styles.btnGroup}>
          <AuthButton
            label="Se connecter"
            variant="filled"
            onPress={() => navigation.navigate('Login')}
          />
          <View style={styles.btnSep} />
          <AuthButton
            label="Créer un compte"
            variant="outlined"
            onPress={() => navigation.navigate('Register')}
          />
        </View>
      </View>

      {/* Bottom wave decoration */}
      <View style={styles.waveBg} />
    </SafeAreaView>
  );
}
