import React, { useRef, useEffect, useState } from 'react';
import { View, Text, Modal, Pressable, Animated, TextInput, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EditGroupModalProps {
  visible: boolean;
  onClose: () => void;
  channel: any;
  editName: string;
  setEditName: (name: string) => void;
  editPhotoUri: string | null;
  uploadingPhoto: boolean;
  saving: boolean;
  hasChanges: boolean;
  isCreator: boolean;
  isAdmin: boolean;
  showImageOptions: () => void;
  saveGroupEdits: () => void;
  setConfirmDeleteVisible: (val: boolean) => void;
  theme: any;
  isDark: boolean;
  BlurView: any;
  t: (key: string) => string;
  modalBg: string;
  overlayFallback: string;
}

export function EditGroupModal({
  visible,
  onClose,
  channel,
  editName,
  setEditName,
  editPhotoUri,
  uploadingPhoto,
  saving,
  hasChanges,
  isCreator,
  isAdmin,
  showImageOptions,
  saveGroupEdits,
  setConfirmDeleteVisible,
  theme: T,
  isDark,
  BlurView,
  t,
  modalBg,
  overlayFallback
}: EditGroupModalProps) {
  const [nameFocused, setNameFocused] = useState(false);
  const editModalAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      editModalAnim.setValue(0);
      Animated.timing(editModalAnim, { toValue: 1, duration: 320, useNativeDriver: true }).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(editModalAnim, { toValue: 0, duration: 240, useNativeDriver: true }).start(() => {
      onClose();
    });
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      {BlurView ? (
        <Pressable onPress={handleClose} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
          <BlurView intensity={70} tint={isDark ? 'dark' : 'light'} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
        </Pressable>
      ) : (
        <Pressable onPress={handleClose} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: overlayFallback }} />
      )}

      <Animated.View style={{
        width: '92%',
        alignSelf: 'center',
        marginTop: 80,
        borderRadius: 24,
        padding: 20,
        backgroundColor: modalBg,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 18,
        elevation: 12,
        transform: [
          { scale: editModalAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
          { translateY: editModalAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }
        ],
        opacity: editModalAnim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0.9, 1] })
      }}>
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <View style={{ width: 48, height: 4, borderRadius: 2, backgroundColor: T.divider }} />
        </View>

        <Text style={{ fontSize: 20, fontWeight: '700', color: T.text, marginBottom: 12 }}>Modifier les informations du groupe</Text>

        <View style={{ alignItems: 'center', marginBottom: 12 }}>
          <TouchableOpacity onPress={showImageOptions} activeOpacity={0.85} style={{ width: 110, height: 110, borderRadius: 55, overflow: 'hidden', backgroundColor: T.surfaceAlt, justifyContent: 'center', alignItems: 'center' }} accessibilityLabel={t('Change Photo')}>
            {uploadingPhoto ? <ActivityIndicator /> : (
              editPhotoUri ? <Image source={{ uri: editPhotoUri }} style={{ width: 110, height: 110 }} /> : <Ionicons name="person-circle" size={64} color={T.textMuted} />
            )}

            <TouchableOpacity onPress={showImageOptions} hitSlop={{ top: 12, left: 12, right: 12, bottom: 12 }} style={{ position: 'absolute', right: -6, bottom: -6, width: 44, height: 44, borderRadius: 22, backgroundColor: T.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: T.divider }} accessibilityLabel={t('Change Photo')}>
              <Ionicons name="camera" size={18} color={T.text} />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* Floating label input */}
        <View style={{ marginBottom: 12 }}>
          <View style={{ position: 'relative' }}>
            <Animated.Text pointerEvents="none" style={{ position: 'absolute', left: 14, top: nameFocused || editName ? 6 : 16, fontSize: nameFocused || editName ? 12 : 16, color: nameFocused ? T.text : T.textMuted, fontWeight: '600' }}>
              {t('Group name')}
            </Animated.Text>
            <TextInput
              value={editName}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              onChangeText={setEditName}
              placeholder={nameFocused ? '' : t('Group name')}
              placeholderTextColor={T.textMuted}
              style={{ backgroundColor: T.surfaceAlt, borderRadius: 12, paddingHorizontal: 14, paddingTop: 22, paddingBottom: 12, color: T.text }}
            />
          </View>
        </View>

        <TouchableOpacity onPress={() => {
          if (saving) { console.warn('Save already in progress'); return; }
          console.log('[CommunityMessaging] Save button pressed', { isAdmin, isCreator, hasChanges, editName, editPhotoUri });
          if (!hasChanges) return;
          saveGroupEdits();
        }} style={{ backgroundColor: (!hasChanges || saving) ? 'rgba(46,204,113,0.35)' : '#2ECC71', padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 12 }} accessibilityLabel={t('Save Changes')} accessibilityState={{ disabled: saving || !hasChanges }}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>{t('Enregistrer les modifications')}</Text>}
        </TouchableOpacity>

        {saving ? (
          <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.18)' }} pointerEvents="auto">
            <ActivityIndicator size="large" color="#fff" />
          </View>
        ) : null}

        <View style={{ height: 1, backgroundColor: T.divider, marginVertical: 12 }} />

        {isCreator ? (
          <>
            <Text style={{ color: '#D9534F', fontWeight: '700', marginBottom: 8 }}>{t('Zone dangereuse')}</Text>
            <TouchableOpacity onPress={() => setConfirmDeleteVisible(true)} style={{ backgroundColor: '#FDECEA', padding: 12, borderRadius: 10, alignItems: 'center' }} accessibilityLabel={t('Delete Group')}>
              <Text style={{ color: '#A94442', fontWeight: '700' }}>{t('Supprimer le groupe')}</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </Animated.View>
    </Modal>
  );
}
