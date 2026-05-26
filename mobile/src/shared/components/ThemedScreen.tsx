import React, { useMemo } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../context/theme.context';

interface ThemedScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  /** If true, no horizontal padding is added (useful for full-bleed headers) */
  noPadding?: boolean;
}

/**
 * Drop-in replacement for `<SafeAreaView>` that automatically adapts
 * background colour and StatusBar to the current light/dark theme.
 *
 * Usage:
 *   <ThemedScreen>
 *     {content}
 *   </ThemedScreen>
 */
export function ThemedScreen({ children, style, noPadding }: ThemedScreenProps) {
  const { theme: C } = useTheme();

  const s = useMemo(
    () =>
      StyleSheet.create({
        safe: {
          flex: 1,
          backgroundColor: C.bg,
        },
      }),
    [C],
  );

  return (
    <SafeAreaView style={[s.safe, style]}>
      <StatusBar barStyle={C.statusBar} backgroundColor={C.bg} />
      {children}
    </SafeAreaView>
  );
}
