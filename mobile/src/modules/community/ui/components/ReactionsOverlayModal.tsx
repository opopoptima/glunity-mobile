import React, { useRef, useEffect } from 'react';
import {
  View, Text, Modal, Pressable, TouchableOpacity,
  StyleSheet, Platform, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ReactionsOverlayModalProps {
  visible: boolean;
  reactionMsgId: string | null;
  onClose: () => void;
  reactionEmojis: string[];
  handleToggleReaction: (messageId: string, emoji: string) => void;
  selectedMsg: any;
  handleReplyTo: (msg: any) => void;
  handleCopy: (text: string) => void;
  handleStartEdit: (msg: any) => void;
  handleDeleteMessage: (id: string) => void;
  handleTogglePin: (messageId: string) => void;
  user: any;
  theme: any;
  isDark: boolean;
  BlurView: any;
  t: (key: string) => string;
  modalBg: string;
  overlayFallback: string;
}

export function ReactionsOverlayModal({
  visible, reactionMsgId, onClose, reactionEmojis,
  handleToggleReaction, selectedMsg, handleReplyTo, handleCopy,
  handleStartEdit, handleDeleteMessage, handleTogglePin,
  user, theme: T, isDark, BlurView, t,
}: ReactionsOverlayModalProps) {
  const slideAnim = useRef(new Animated.Value(300)).current;

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const GREEN   = '#27AE60';
  const SURFACE = isDark ? '#13161C' : '#FFFFFF';
  const SURF2   = isDark ? '#1C2028' : '#F4F6F8';
  const TEXT    = isDark ? '#E8EAED' : '#0D1117';
  const MUTED   = isDark ? 'rgba(200,210,220,0.45)' : 'rgba(0,0,0,0.4)';
  const DIVIDER = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const DANGER  = '#E74C3C';
  const DANGER_BG = isDark ? 'rgba(231,76,60,0.14)' : 'rgba(231,76,60,0.08)';

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 24, stiffness: 260 }).start();
    } else {
      slideAnim.setValue(300);
    }
  }, [visible]);

  if (!visible) return null;

  const isAudio = selectedMsg?.attachments?.some((att: any) => att.type === 'audio');
  const isMine = String(selectedMsg?.senderId?._id || selectedMsg?.senderId || '') === String(user?._id || '');
  const isPinned = !!selectedMsg?.pinned;

  const handleAction = (fn: () => void) => {
    fn();
    onClose();
  };

  // ── Action item renderer ──────────────────────────────────────────────────
  const ActionItem = ({
    icon, label, onPress, iconBg, iconColor, labelColor, bold,
  }: {
    icon: string; label: string; onPress: () => void;
    iconBg?: string; iconColor?: string; labelColor?: string; bold?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 13, paddingHorizontal: 4,
      }}
      activeOpacity={0.68}
    >
      <View style={{
        width: 40, height: 40, borderRadius: 13,
        backgroundColor: iconBg || SURF2,
        justifyContent: 'center', alignItems: 'center',
        marginRight: 14,
      }}>
        <Ionicons name={icon as any} size={20} color={iconColor || TEXT} />
      </View>
      <Text style={{
        fontSize: 15.5, fontWeight: bold ? '700' : '500',
        color: labelColor || TEXT, flex: 1,
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      {BlurView ? (
        <Pressable onPress={onClose} style={StyleSheet.absoluteFillObject}>
          <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
        </Pressable>
      ) : (
        <Pressable
          onPress={onClose}
          style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.46)' }]}
        />
      )}

      {/* Sheet */}
      <Animated.View style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        backgroundColor: SURFACE,
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
        transform: [{ translateY: slideAnim }],
      }}>
        {/* Handle */}
        <View style={{ alignItems: 'center', paddingTop: 12, marginBottom: 4 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: DIVIDER }} />
        </View>

        {/* ── EMOJI QUICK-REACTIONS ──────────────────────────────────── */}
        <View style={{
          flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
          paddingHorizontal: 12, paddingVertical: 14,
          marginHorizontal: 16, marginBottom: 12,
          backgroundColor: SURF2, borderRadius: 20,
        }}>
          {reactionEmojis.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              onPress={() => {
                if (reactionMsgId) handleToggleReaction(reactionMsgId, emoji);
                onClose();
              }}
              style={{ padding: 6 }}
              activeOpacity={0.6}
            >
              <Text style={{ fontSize: 29 }}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── MESSAGE PREVIEW (snippet) ─────────────────────────────── */}
        {!!selectedMsg?.content && !selectedMsg.deletedAt && (
          <View style={{
            marginHorizontal: 16, marginBottom: 12, padding: 12,
            backgroundColor: SURF2, borderRadius: 14,
            borderLeftWidth: 3, borderLeftColor: GREEN,
          }}>
            <Text style={{ fontSize: 13.5, color: MUTED, fontWeight: '500' }} numberOfLines={2}>
              {selectedMsg.content}
            </Text>
          </View>
        )}

        {/* ── ACTION LIST ───────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 16 }}>
          <ActionItem
            icon="arrow-undo"
            label={t('Reply')}
            onPress={() => handleAction(() => handleReplyTo(selectedMsg))}
            iconBg={isDark ? 'rgba(39,174,96,0.15)' : 'rgba(39,174,96,0.1)'}
            iconColor={GREEN}
          />

          {!isAudio && (
            <ActionItem
              icon="copy"
              label={t('Copy Text')}
              onPress={() => handleAction(() => handleCopy(selectedMsg?.content || ''))}
            />
          )}

          <ActionItem
            icon={isPinned ? 'pin' : 'pin-outline'}
            label={isPinned ? t('Unpin Message') : t('Pin Message')}
            onPress={() => handleAction(() => { if (reactionMsgId) handleTogglePin(reactionMsgId); })}
            iconBg={isPinned ? (isDark ? 'rgba(247,183,49,0.15)' : 'rgba(247,183,49,0.1)') : SURF2}
            iconColor={isPinned ? '#F7B731' : TEXT}
          />

          {isMine && !selectedMsg?.deletedAt && (
            <>
              <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: DIVIDER, marginVertical: 4 }} />

              {!isAudio && (
                <ActionItem
                  icon="create"
                  label={t('Edit Message')}
                  onPress={() => handleAction(() => handleStartEdit(selectedMsg))}
                  iconBg={isDark ? 'rgba(9,132,227,0.15)' : 'rgba(9,132,227,0.08)'}
                  iconColor="#0984E3"
                />
              )}

              <ActionItem
                icon="trash"
                label={t('Delete Message')}
                onPress={() => handleAction(() => handleDeleteMessage(selectedMsg?.id || selectedMsg?._id))}
                iconBg={DANGER_BG}
                iconColor={DANGER}
                labelColor={DANGER}
                bold
              />
            </>
          )}

          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: DIVIDER, marginVertical: 4 }} />

          <ActionItem
            icon="close"
            label={t('Cancel')}
            onPress={onClose}
            iconColor={MUTED}
            labelColor={MUTED}
          />
        </View>
      </Animated.View>
    </Modal>
  );
}
