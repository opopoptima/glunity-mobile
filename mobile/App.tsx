import React from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { AuthProvider } from './src/modules/auth/state/auth.context';
import { RootNavigator } from './src/navigation/RootNavigator';

/**
 * Deep-link / URL mapping.
 *
 * When the user clicks an email link such as:
 *   http://localhost:8081/reset-password?token=abc123
 *   http://localhost:8081/email-verified?verified=1
 *
 * React Navigation translates those URLs into the matching screen + params.
 */
const linking: LinkingOptions<ReactNavigation.RootParamList> = {
  prefixes: [
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:8083',
    'http://localhost:8090',
    'glunity://',             // native deep link scheme
  ],
  config: {
    screens: {
      // The navigator names must match your stack structure.
      // AuthNavigator is rendered directly by RootNavigator, so we
      // reference screens inside it at the top level here.
      ResetPassword:  {
        path: 'reset-password',
        parse: { token: (t: string) => t },
      },
      EmailVerified: {
        path: 'email-verified',
        parse: {
          success: (v: string) => v !== '0' && v !== 'false',
        },
      },
      Login:          'login',
      Register:       'register',
      ForgotPassword: 'forgot-password',
      Welcome:        'welcome',
    },
  },
};

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <NavigationContainer linking={linking}>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
