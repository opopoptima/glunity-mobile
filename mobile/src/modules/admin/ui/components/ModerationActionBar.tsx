import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../../shared/context/theme.context';
import { Colors, Font, Radius, Spacing } from '../../../../shared/utils/theme';
import { useLanguage } from '../../../../shared/context/language.context';

interface ModerationActionBarProps {
  onApprove: () => void;
  onReject: () => void;
  approving?: boolean;
  rejecting?: boolean;
}

export function ModerationActionBar({ onApprove, onReject, approving = false, rejecting = false }: ModerationActionBarProps) {
  const { theme: T, isDark } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#1C1C1E' : Colors.white,
          borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          paddingBottom: Math.max(Spacing.md, insets.bottom),
        },
      ]}
    >
      <View style={styles.buttonRow}>
        {/* Reject Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onReject}
          disabled={approving || rejecting}
          style={[styles.button, styles.rejectButton, { borderColor: Colors.error }]}
        >
          {rejecting ? (
            <ActivityIndicator size="small" color={Colors.error} />
          ) : (
            <>
              <Feather name="x-circle" size={18} color={Colors.error} />
              <Text style={[styles.buttonText, { color: Colors.error }]}>
                {t('mod.reject', 'Refuser')}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Approve Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onApprove}
          disabled={approving || rejecting}
          style={[styles.button, styles.approveButton, { backgroundColor: Colors.green }]}
        >
          {approving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Feather name="check-circle" size={18} color="#FFFFFF" />
              <Text style={[styles.buttonText, styles.approveButtonText]}>
                {t('mod.approve_notify', 'Approuver & Notifier')}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 16,
    zIndex: 999,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  rejectButton: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  approveButton: {
    flex: 1.5, // Make approve slightly wider for visual hierarchy
    shadowColor: Colors.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: {
    fontFamily: Font.family,
    fontWeight: Font.bold,
    fontSize: 14,
  },
  approveButtonText: {
    color: '#FFFFFF',
  },
});
