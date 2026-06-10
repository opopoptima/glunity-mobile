import React from 'react';
import { View, Text, Modal, Pressable, Animated, TouchableOpacity, ActivityIndicator } from 'react-native';

interface ConfirmDeleteModalProps {
  visible: boolean;
  onClose: () => void;
  deleting: boolean;
  performDeleteGroup: () => void;
  theme: any;
  isDark: boolean;
  BlurView: any;
  t: (key: string) => string;
  modalBg: string;
  overlayFallback: string;
}

export function ConfirmDeleteModal({
  visible,
  onClose,
  deleting,
  performDeleteGroup,
  theme: T,
  isDark,
  BlurView,
  t,
  modalBg,
  overlayFallback
}: ConfirmDeleteModalProps) {
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {BlurView ? (
        <Pressable onPress={onClose} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
          <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
        </Pressable>
      ) : (
        <Pressable onPress={onClose} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: overlayFallback }} />
      )}

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Animated.View style={{ width: '86%', backgroundColor: modalBg, padding: 18, borderRadius: 14, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, elevation: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: T.text, marginBottom: 8 }}>{t('Are you sure?')}</Text>
          <Text style={{ color: T.textMuted, marginBottom: 16 }}>{t('This action cannot be undone.')}</Text>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={onClose} style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: T.surfaceAlt, alignItems: 'center', marginRight: 8 }}>
              <Text style={{ color: T.text }}>{t('Cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={performDeleteGroup} disabled={deleting} style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#E74C3C', alignItems: 'center' }}>
              {deleting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>{t('Delete')}</Text>}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
