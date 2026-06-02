import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
} from 'react-native';
import { Font, Radius } from '../utils/theme';
import { useTheme } from '../context/theme.context';

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
  const { theme: T } = useTheme();
  const isFilled = variant === 'filled';

  const styles = React.useMemo(() => StyleSheet.create({
    button: {
      height: 54,
      borderRadius: Radius.md,
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
    },
    filled: {
      backgroundColor: T.green,
    },
    outlined: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: T.green,
    },
    disabled: {
      opacity: 0.55,
    },
    label: {
      fontSize: 17,
      fontWeight: Font.bold,
      color: T.white,
      letterSpacing: 0.5,
    },
    labelOutlined: {
      color: T.green,
    },
  }), [T]);

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
        <ActivityIndicator color={isFilled ? T.white : T.green} />
      ) : (
        <Text style={[styles.label, !isFilled && styles.labelOutlined]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}
