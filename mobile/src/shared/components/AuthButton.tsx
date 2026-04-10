import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
} from 'react-native';
import { Colors, Font, Radius, Spacing } from '../utils/theme';

interface AuthButtonProps extends TouchableOpacityProps {
  label: string;
  loading?: boolean;
  variant?: 'filled' | 'outlined';
  containerStyle?: ViewStyle;
}

export function AuthButton({
  label,
  loading = false,
  variant = 'filled',
  containerStyle,
  disabled,
  ...rest
}: AuthButtonProps) {
  const isFilled = variant === 'filled';

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      disabled={disabled || loading}
      style={[
        styles.button,
        isFilled ? styles.filled : styles.outlined,
        (disabled || loading) && styles.disabled,
        containerStyle,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={isFilled ? Colors.white : Colors.green} />
      ) : (
        <Text style={[styles.label, !isFilled && styles.labelOutlined]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 54,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  filled: {
    backgroundColor: Colors.green,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.green,
  },
  disabled: {
    opacity: 0.55,
  },
  label: {
    fontSize: 17,
    fontWeight: Font.bold,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  labelOutlined: {
    color: Colors.green,
  },
});
