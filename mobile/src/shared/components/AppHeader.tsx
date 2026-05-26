/**
 * AppHeader — Unified global header for every screen in the app.
 *
 * Usage variants:
 *   1. Back header (detail screens):
 *      <AppHeader title="Settings" onBack={() => navigation.goBack()} />
 *
 *   2. Main screen header (home-level, no back):
 *      <AppHeader title="Profile" rightIcon="bell" onRightPress={...} />
 *
 *   3. With both:
 *      <AppHeader title="Edit Profile" onBack={...} rightIcon="check" onRightPress={...} />
 */
import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/theme.context';

const F = {
  regular:  'Poppins_400Regular',
  semibold: 'Poppins_600SemiBold',
  bold:     'Poppins_700Bold',
};

interface AppHeaderProps {
  title: string;
  /** Show back arrow on the left */
  onBack?: () => void;
  /** Icon name from MaterialCommunityIcons for right action */
  rightIcon?: string;
  /** Handler for right action icon */
  onRightPress?: () => void;
  /** Pass a custom right element instead of an icon */
  rightElement?: React.ReactNode;
  /** Override subtitle below the title */
  subtitle?: string;
}

export function AppHeader({
  title,
  onBack,
  rightIcon,
  onRightPress,
  rightElement,
  subtitle,
}: AppHeaderProps) {
  const { theme: C } = useTheme();

  const s = useMemo(
    () =>
      StyleSheet.create({
        // Extra top padding on Android to clear status bar
        wrap: {
          backgroundColor: C.surface,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: C.border,
          paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0,
        },
        row: {
          height: 54,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
        },
        // ── left slot ──────────────────────────────────────────────────────────
        leftSlot: {
          width: 40,
          height: 40,
          alignItems: 'flex-start',
          justifyContent: 'center',
        },
        backBtn: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: C.surfaceAlt,
          alignItems: 'center',
          justifyContent: 'center',
        },
        // ── centre ─────────────────────────────────────────────────────────────
        centre: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        title: {
          fontSize: 16,
          fontFamily: F.bold,
          fontWeight: '700',
          color: C.text,
          letterSpacing: 0.1,
        },
        subtitle: {
          fontSize: 11,
          fontFamily: F.regular,
          color: C.textMuted,
          marginTop: 1,
        },
        // ── right slot ─────────────────────────────────────────────────────────
        rightSlot: {
          width: 40,
          height: 40,
          alignItems: 'flex-end',
          justifyContent: 'center',
        },
        rightBtn: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: C.surfaceAlt,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [C],
  );

  return (
    <View style={s.wrap}>
      <View style={s.row}>
        {/* Left — back button or spacer */}
        <View style={s.leftSlot}>
          {onBack ? (
            <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.7}>
              <MaterialCommunityIcons name="arrow-left" size={20} color={C.text} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Centre — title + optional subtitle */}
        <View style={s.centre}>
          <Text style={s.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
        </View>

        {/* Right — icon button, custom element, or spacer */}
        <View style={s.rightSlot}>
          {rightElement ?? (
            rightIcon ? (
              <TouchableOpacity style={s.rightBtn} onPress={onRightPress} activeOpacity={0.7}>
                <MaterialCommunityIcons name={rightIcon as any} size={20} color={C.text} />
              </TouchableOpacity>
            ) : null
          )}
        </View>
      </View>
    </View>
  );
}
