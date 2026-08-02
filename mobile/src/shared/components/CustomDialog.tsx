import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/theme.context';
import { Font, Radius, Spacing } from '../utils/theme';

export interface DialogButton {
  text: string;
  onPress: () => void | Promise<void>;
  type?: 'primary' | 'secondary' | 'destructive';
  disabled?: boolean;
  loading?: boolean;
}

interface CustomDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  icon?: keyof typeof Feather.glyphMap;
  iconColor?: string;
  loading?: boolean;
  loadingMessage?: string;
  buttons?: DialogButton[];
  // Input configuration (e.g. for typing "DELETE")
  showInput?: boolean;
  inputValue?: string;
  onChangeInput?: (text: string) => void;
  inputPlaceholder?: string;
  inputAutoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  // Closing options
  closeOnOverlayTap?: boolean;
  onClose?: () => void;
  children?: React.ReactNode;
}

export function CustomDialog({
  visible,
  title,
  message,
  icon,
  iconColor,
  loading = false,
  loadingMessage,
  buttons = [],
  showInput = false,
  inputValue = '',
  onChangeInput,
  inputPlaceholder,
  inputAutoCapitalize = 'none',
  closeOnOverlayTap = false,
  onClose,
  children,
}: CustomDialogProps) {
  const { theme: T, isDark } = useTheme();

  const handleOverlayTap = () => {
    if (closeOnOverlayTap && onClose && !loading) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (onClose && !loading) {
          onClose();
        }
      }}
    >
      <TouchableWithoutFeedback onPress={handleOverlayTap}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={[
                styles.dialogCard,
                {
                  backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                },
              ]}
            >
              {/* Header Icon */}
              {icon && (
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' },
                  ]}
                >
                  <Feather name={icon} size={28} color={iconColor || T.text} />
                </View>
              )}

              {/* Title & Description */}
              <Text style={[styles.title, { color: T.text }]}>{title}</Text>
              {message ? <Text style={[styles.message, { color: T.textSub }]}>{message}</Text> : null}

              {/* Custom Children Content */}
              {children && <View style={styles.childrenContainer}>{children}</View>}

              {/* TextInput Field (e.g. for "DELETE" confirmation) */}
              {showInput && onChangeInput && (
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      color: T.text,
                      backgroundColor: isDark ? '#252528' : '#F9FAFB',
                      borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
                    },
                  ]}
                  placeholder={inputPlaceholder}
                  placeholderTextColor={T.textMuted}
                  value={inputValue}
                  onChangeText={onChangeInput}
                  autoCapitalize={inputAutoCapitalize}
                  editable={!loading}
                  autoFocus
                />
              )}

              {/* Loading State Overlay */}
              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={T.green || '#8BC34A'} />
                  {loadingMessage ? (
                    <Text style={[styles.loadingText, { color: T.textMuted }]}>{loadingMessage}</Text>
                  ) : null}
                </View>
              )}

              {/* Action Buttons */}
              {!loading && buttons.length > 0 && (
                <View style={styles.buttonContainer}>
                  {buttons.map((btn, idx) => {
                    const isDestructive = btn.type === 'destructive';
                    const isPrimary = btn.type === 'primary';
                    
                    let btnBg = isDark ? '#252528' : '#F3F4F6';
                    let btnTextColor = T.text;

                    if (isDestructive) {
                      btnBg = '#EF4444';
                      btnTextColor = '#FFFFFF';
                    } else if (isPrimary) {
                      btnBg = T.green || '#8BC34A';
                      btnTextColor = '#FFFFFF';
                    }

                    if (btn.disabled) {
                      btnBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
                      btnTextColor = T.textMuted;
                    }

                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.button, { backgroundColor: btnBg }]}
                        onPress={btn.onPress}
                        disabled={btn.disabled || btn.loading}
                      >
                        {btn.loading ? (
                          <ActivityIndicator size="small" color={btnTextColor} />
                        ) : (
                          <Text style={[styles.buttonText, { color: btnTextColor }]}>{btn.text}</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  dialogCard: {
    width: Platform.OS === 'web' ? 420 : '88%',
    maxWidth: '95%',
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 18,
    fontFamily: Font.family,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: 14.5,
    fontFamily: Font.family,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  childrenContainer: {
    width: '100%',
    marginBottom: Spacing.md,
  },
  textInput: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 15,
    fontFamily: Font.family,
    marginBottom: Spacing.md,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginVertical: Spacing.md,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: Font.family,
  },
  buttonContainer: {
    width: '100%',
    flexDirection: 'column',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  button: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14.5,
    fontFamily: Font.family,
    fontWeight: '700',
  },
});
