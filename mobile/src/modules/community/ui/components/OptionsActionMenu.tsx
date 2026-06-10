import React from 'react';
import { View, Text, Modal, Pressable, TouchableOpacity, Animated } from 'react-native';

interface OptionsActionMenuProps {
  visible: boolean;
  onRequestClose: () => void;
  onOpenMembers: () => void;
  onOpenEditGroup: () => void;
  theme: any;
  insets: any;
  isDark: boolean;
  BlurView: any;
}

export function OptionsActionMenu({
  visible,
  onRequestClose,
  onOpenMembers,
  onOpenEditGroup,
  theme: T,
  insets,
  isDark,
  BlurView
}: OptionsActionMenuProps) {
  const overlayFallback = 'rgba(0, 0, 0, 0.45)';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      {BlurView ? (
        <Pressable onPress={onRequestClose} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
          <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
        </Pressable>
      ) : (
        <Pressable onPress={onRequestClose} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: overlayFallback }} />
      )}

      <View style={{ position: 'absolute', right: 12, top: (insets?.top || 0) + 56 }}>
        <Animated.View style={{ width: 220, backgroundColor: T.surface, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 8, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 6 }}>
          <TouchableOpacity onPress={() => { onRequestClose(); onOpenMembers(); }} style={{ paddingVertical: 12, paddingHorizontal: 8 }}>
            <Text style={{ color: T.text, fontWeight: '700' }}>Informations du groupe</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { onRequestClose(); onOpenEditGroup(); }} style={{ paddingVertical: 12, paddingHorizontal: 8 }}>
            <Text style={{ color: T.text, fontWeight: '700' }}>Modifier les informations du groupe</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}
