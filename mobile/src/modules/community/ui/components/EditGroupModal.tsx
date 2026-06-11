import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, Modal, Pressable, Animated, TextInput,
  TouchableOpacity, ActivityIndicator, Image, StyleSheet, Alert,
} from 'react-native';
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

// Deterministic avatar color
function avatarColor(str: string) {
  const colors = ['#6C63FF','#FF6584','#43B89C','#F7B731','#E17055','#0984E3','#A29BFE','#00B894'];
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export function EditGroupModal({
  visible, onClose, channel, editName, setEditName,
  editPhotoUri, uploadingPhoto, saving, hasChanges, isCreator, isAdmin,
  showImageOptions, saveGroupEdits, setConfirmDeleteVisible,
  theme: T, isDark, BlurView, t, modalBg, overlayFallback,
}: EditGroupModalProps) {
  const [nameFocused, setNameFocused] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const GREEN   = '#27AE60';
  const SURFACE = isDark ? '#13161C' : '#FFFFFF';
  const SURF2   = isDark ? '#1C2028' : '#F4F6F8';
  const TEXT    = isDark ? '#E8EAED' : '#0D1117';
  const MUTED   = isDark ? 'rgba(200,210,220,0.45)' : 'rgba(0,0,0,0.4)';
  const DIVIDER = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const DANGER  = '#E74C3C';
  const DANGER_BG = isDark ? 'rgba(231,76,60,0.12)' : 'rgba(231,76,60,0.08)';

  const avatarBg = avatarColor(channel?.name || editName || '');

  useEffect(() => {
    if (visible) {
      anim.setValue(0);
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, damping: 22, stiffness: 240 }).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => onClose());
  };

  const handleSave = () => {
    if (saving) return;
    if (!hasChanges) return;
    saveGroupEdits();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      {/* Backdrop */}
      {BlurView ? (
        <Pressable onPress={handleClose} style={StyleSheet.absoluteFillObject}>
          <BlurView intensity={65} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
        </Pressable>
      ) : (
        <Pressable
          onPress={handleClose}
          style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.52)' }]}
        />
      )}

      {/* Card */}
      <Animated.View style={{
        width: '92%',
        alignSelf: 'center',
        marginTop: 72,
        borderRadius: 26,
        backgroundColor: isDark ? '#13161C' : '#FFFFFF',
        shadowColor: '#000',
        shadowOpacity: isDark ? 0.5 : 0.15,
        shadowRadius: 24,
        elevation: 16,
        overflow: 'hidden',
        opacity: anim,
        transform: [
          { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
          { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
        ],
      }}>
        {/* ── Top accent strip ─────────────────────────────────────────────── */}
        <View style={{ height: 4, backgroundColor: GREEN }} />

        <View style={{ padding: 22 }}>

          {/* Header row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ fontSize: 19, fontWeight: '800', color: TEXT }}>
              {t('Edit Group')}
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: SURF2, justifyContent: 'center', alignItems: 'center' }}
            >
              <Ionicons name="close" size={18} color={MUTED} />
            </TouchableOpacity>
          </View>

          {/* ── Avatar picker ─────────────────────────────────────────────── */}
          <View style={{ alignItems: 'center', marginBottom: 22 }}>
            <TouchableOpacity
              onPress={showImageOptions}
              activeOpacity={0.85}
              accessibilityLabel={t('Change Photo')}
            >
              <View style={{
                width: 100, height: 100, borderRadius: 28, overflow: 'hidden',
                backgroundColor: avatarBg,
                justifyContent: 'center', alignItems: 'center',
                borderWidth: 3,
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              }}>
                {uploadingPhoto ? (
                  <ActivityIndicator color="#fff" />
                ) : editPhotoUri ? (
                  <Image source={{ uri: editPhotoUri }} style={{ width: 100, height: 100 }} />
                ) : (
                  <Text style={{ fontSize: 38, fontWeight: '900', color: '#fff' }}>
                    {(editName || channel?.name || 'G').charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>

              {/* Camera badge */}
              <View style={{
                position: 'absolute', right: -4, bottom: -4,
                width: 32, height: 32, borderRadius: 16,
                backgroundColor: GREEN,
                justifyContent: 'center', alignItems: 'center',
                borderWidth: 2.5, borderColor: isDark ? '#13161C' : '#FFFFFF',
              }}>
                <Ionicons name="camera" size={15} color="#fff" />
              </View>
            </TouchableOpacity>

            <Text style={{ color: MUTED, fontSize: 12.5, marginTop: 10, fontWeight: '500' }}>
              {t('Tap to change photo')}
            </Text>
          </View>

          {/* ── Group name input ──────────────────────────────────────────── */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 11.5, fontWeight: '800', color: GREEN, letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 8 }}>
              {t('Group Name')}
            </Text>
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: SURF2,
              borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13,
              borderWidth: 1.5,
              borderColor: nameFocused ? GREEN : DIVIDER,
            }}>
              <TextInput
                value={editName}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
                onChangeText={setEditName}
                placeholder={t('Enter group name...')}
                placeholderTextColor={MUTED}
                style={{ flex: 1, fontSize: 15.5, color: TEXT, fontWeight: '600' }}
                maxLength={100}
                returnKeyType="done"
              />
              {!!editName && (
                <TouchableOpacity onPress={() => setEditName('')}>
                  <Ionicons name="close-circle" size={18} color={MUTED} />
                </TouchableOpacity>
              )}
            </View>
            <Text style={{ fontSize: 11.5, color: MUTED, marginTop: 5, textAlign: 'right' }}>
              {editName.length}/100
            </Text>
          </View>

          {/* ── Save button ───────────────────────────────────────────────── */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={!hasChanges || saving}
            accessibilityLabel={t('Save Changes')}
            style={{
              backgroundColor: (!hasChanges || saving) ? (isDark ? 'rgba(39,174,96,0.35)' : 'rgba(39,174,96,0.3)') : GREEN,
              paddingVertical: 15, borderRadius: 16, alignItems: 'center',
              shadowColor: GREEN,
              shadowOffset: { width: 0, height: hasChanges && !saving ? 4 : 0 },
              shadowOpacity: hasChanges && !saving ? 0.35 : 0,
              shadowRadius: 8, elevation: hasChanges && !saving ? 4 : 0,
            }}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{t('Save changes')}</Text>}
          </TouchableOpacity>

          {/* ── Divider ───────────────────────────────────────────────────── */}
          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: DIVIDER, marginVertical: 18 }} />

          {/* ── Danger zone ───────────────────────────────────────────────── */}
          {isCreator && (
            <View style={{
              backgroundColor: DANGER_BG,
              borderRadius: 14, padding: 14,
              borderWidth: 1, borderColor: DANGER + '33',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Ionicons name="warning" size={15} color={DANGER} />
                <Text style={{ color: DANGER, fontWeight: '800', marginLeft: 6, fontSize: 12, letterSpacing: 0.4 }}>
                  {t('DANGER ZONE')}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    t('Delete Group'),
                    t('Are you sure you want to permanently delete this group? This action cannot be undone.'),
                    [
                      { text: t('Cancel'), style: 'cancel' },
                      { text: t('Delete'), style: 'destructive', onPress: () => setConfirmDeleteVisible(true) },
                    ]
                  );
                }}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  paddingVertical: 12, borderRadius: 12,
                  backgroundColor: isDark ? 'rgba(231,76,60,0.18)' : 'rgba(231,76,60,0.1)',
                  borderWidth: 1, borderColor: DANGER + '40',
                }}
              >
                <Ionicons name="trash" size={16} color={DANGER} style={{ marginRight: 8 }} />
                <Text style={{ color: DANGER, fontWeight: '700', fontSize: 14 }}>{t('Delete group')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Saving overlay */}
        {saving && (
          <View style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(0,0,0,0.18)',
            justifyContent: 'center', alignItems: 'center',
          }}>
            <ActivityIndicator size="large" color={GREEN} />
          </View>
        )}
      </Animated.View>
    </Modal>
  );
}
