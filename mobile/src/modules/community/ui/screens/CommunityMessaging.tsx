import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  useWindowDimensions,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../auth/state/auth.context';
import { useTheme } from '../../../../shared/context/theme.context';
import { useLanguage } from '../../../../shared/context/language.context';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCommunityChat } from '../../hooks/useCommunityChat';
import { usePresence } from '../../../../shared/hooks/usePresence';
import AnimatedReanimated, { FadeInDown, SlideInRight, useReducedMotion } from 'react-native-reanimated';

// Decoupled sub-components
import { OptionsActionMenu } from '../components/OptionsActionMenu';
import { MembersBottomSheet } from '../components/MembersBottomSheet';
import { EditGroupModal } from '../components/EditGroupModal';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { ReactionsOverlayModal } from '../components/ReactionsOverlayModal';

// Optional native BlurView
let BlurView: any = null;
try { BlurView = require('expo-blur').BlurView; } catch (e) { BlurView = null; }

// Deterministic avatar color from string
function avatarColor(str: string) {
  const colors = ['#6C63FF','#FF6584','#43B89C','#F7B731','#E17055','#0984E3','#A29BFE','#00B894','#FDCB6E','#D63031'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function CommunityMessaging({ initialChannel, initialChannelId, navigation }: any) {
  const { user } = useAuth();
  const { theme: T, isDark } = useTheme();
  const { t, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();

  const [highlightedMsgId, setHighlightedMsgId] = React.useState<string | null>(null);
  const [currentPinIndex, setCurrentPinIndex] = React.useState(0);
  const touchStartX = React.useRef(0);

  const handleTouchStart = (e: any) => { touchStartX.current = e.nativeEvent.pageX; };
  const handleTouchEnd = (e: any) => {
    const diff = touchStartX.current - e.nativeEvent.pageX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) { if (currentPinIndex < (chat.channel?.pinnedMessages?.length || 0) - 1) setCurrentPinIndex(currentPinIndex + 1); }
      else { if (currentPinIndex > 0) setCurrentPinIndex(currentPinIndex - 1); }
    }
  };

  const chat = useCommunityChat(initialChannel, initialChannelId, navigation);
  const { isOnline } = usePresence();

  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    if (chat.isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.15, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else { pulseAnim.setValue(1); }
  }, [chat.isRecording]);

  const formatRecordingTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // DM partner presence
  const dmPartnerId = useMemo(() => {
    const ch = chat.channel;
    if (!ch) return null;
    const isDM = ch.name ? ch.name.startsWith('DM-') : (ch.type === 'direct' || ch.type === 'dm' || ch.type === 'DM');
    if (!isDM) return null;
    const parts = ch.participants || ch.members || [];
    for (const p of parts) {
      const id = p.userId ? String(p.userId) : String(p._id || p.id || p);
      if (id && id !== String(user?._id)) return id;
    }
    return null;
  }, [chat.channel, user?._id]);

  const partnerOnline = dmPartnerId ? isOnline(dmPartnerId) : false;

  const seenIds = React.useRef<Set<string>>(new Set());
  const reducedMotion = useReducedMotion();

  if (seenIds.current.size === 0 && chat.messages && chat.messages.length > 0) {
    chat.messages.forEach((m: any) => seenIds.current.add(String(m.id || m._id)));
  }

  const overlayFallback = isDark ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.38)';
  const modalBg = isDark ? 'rgba(18,18,22,0.96)' : 'rgba(255,255,255,0.95)';

  const pinnedMessages = useMemo(() => chat.channel?.pinnedMessages || [], [chat.channel?.pinnedMessages]);
  const selectedMsg = useMemo(() => chat.messages.find((m) => m.id === chat.reactionMsgId), [chat.messages, chat.reactionMsgId]);

  const formatDuration = (sec?: number) => {
    if (sec === undefined || isNaN(sec)) return '0:00';
    const r = Math.round(sec);
    return `${Math.floor(r / 60)}:${r % 60 < 10 ? '0' : ''}${r % 60}`;
  };

  // ─── getChatDisplay: safe, never returns [object Object] ───────────────────
  const getChatDisplay = (ch: any): { name: string; avatar: string | null } => {
    if (!ch) return { name: t('Chat'), avatar: null };

    // Group channels — just use name directly
    const isGroup = ch.type === 'group' ||
      (Array.isArray(ch.participants) && ch.participants.length > 2) ||
      (ch.name && typeof ch.name === 'string' && !ch.name.startsWith('DM-'));
    if (isGroup) {
      return { name: (typeof ch.name === 'string' ? ch.name : null) || ch.displayName || t('Group'), avatar: ch.avatarUrl || null };
    }

    // DM — resolve other participant
    const desc: string | undefined = ch.description || ch.desc;
    if (desc && typeof desc === 'string' && desc.startsWith('Direct Message between ')) {
      const namesStr = desc.substring('Direct Message between '.length);
      const parts = namesStr.split(' and ');
      if (parts.length === 2) {
        const otherName = parts[0] === user?.fullName ? parts[1] : parts[0];
        return { name: otherName, avatar: ch.avatarUrl || null };
      }
    }

    const parts = ch.participants || ch.members || ch.userIds || ch.participantIds;
    if (Array.isArray(parts) && parts.length > 0) {
      const obj = parts.find((p: any) => p && typeof p === 'object' && (p._id || p.id) && String(p._id || p.id) !== String(user?._id));
      if (obj) return { name: String(obj.fullName || obj.name || obj.displayName || obj._id || obj.id), avatar: obj.avatarUrl || obj.avatar || ch.avatarUrl || null };
      const rawId = parts.find((p: any) => typeof p === 'string' && p !== String(user?._id));
      if (rawId) return { name: String(rawId), avatar: ch.avatarUrl || null };
    }

    const safeChName = typeof ch.name === 'string' ? ch.name : null;
    return { name: safeChName || ch.displayName || t('Chat'), avatar: ch.avatarUrl || null };
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString || Date.now());
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return timeStr;
    const dateStr = date.toLocaleDateString([], { day: 'numeric', month: 'short' });
    return `${dateStr}, ${timeStr}`;
  };

  // ─── Color scheme ───────────────────────────────────────────────────────────
  const GREEN = isDark ? '#27AE60' : '#2ECC71';
  const GREEN_DARK = isDark ? '#1A6B3A' : '#1E9E55';
  const BUBBLE_ME_BG = isDark ? '#1E6B3D' : '#25A55A';
  const BUBBLE_THEM_BG = isDark ? '#1E2028' : '#F0F2F5';
  const BUBBLE_ME_TEXT = '#FFFFFF';
  const BUBBLE_THEM_TEXT = isDark ? '#E8EAED' : '#1A1A2E';
  const TIME_COLOR = isDark ? 'rgba(200,210,220,0.55)' : 'rgba(100,110,130,0.7)';
  const TICK_COLOR = '#5EE87B';

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: isDark ? '#0D0F13' : '#F5F7FA' },
    // Header
    header: {
      height: 62,
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      paddingHorizontal: 6,
      paddingTop: 2,
      justifyContent: 'space-between',
      backgroundColor: isDark ? '#121418' : '#FFFFFF',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.3 : 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    headerLeft: { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', flex: 1, minWidth: 0 },
    headerRight: { flexDirection: 'row', alignItems: 'center', paddingLeft: 4 },
    backBtn: { padding: 8, marginRight: 2 },
    headerName: { fontSize: 16, fontWeight: '700', color: isDark ? '#FFFFFF' : '#0D1117', letterSpacing: -0.2 },
    headerSub: { fontSize: 11.5, color: isDark ? 'rgba(200,210,220,0.55)' : 'rgba(0,0,0,0.45)', marginTop: 1 },
    headerSubOnline: { fontSize: 11.5, color: '#27AE60', marginTop: 1, fontWeight: '600' },
    // Avatar shapes
    dmAvatar: { width: 40, height: 40, borderRadius: 20 },
    groupAvatar: { width: 40, height: 40, borderRadius: 14, backgroundColor: isDark ? '#1A2030' : '#E8F4FD', alignItems: 'center', justifyContent: 'center' },
    presenceDot: { position: 'absolute', right: 0, bottom: 0, width: 11, height: 11, borderRadius: 6, borderWidth: 2, borderColor: isDark ? '#121418' : '#FFFFFF' },
    // Messages list
    listContent: { paddingTop: 12, paddingHorizontal: 12 },
    // Message row
    row: { marginVertical: 2, flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'flex-end' },
    // Avatar in row
    msgAvatar: { width: 32, height: 32, borderRadius: 16 },
    msgAvatarWrap: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
    messageBlock: { flexDirection: 'column', alignItems: 'flex-start', maxWidth: windowWidth * 0.75 },
    // Sender name label (groups)
    senderName: { fontSize: 11.5, fontWeight: '700', marginBottom: 3, marginLeft: 2 },
    // Bubbles
    bubbleMe: {
      backgroundColor: BUBBLE_ME_BG,
      paddingVertical: 10, paddingHorizontal: 14,
      borderRadius: 20, borderBottomRightRadius: 5,
      alignSelf: 'flex-end',
      shadowColor: isDark ? '#000' : '#25A55A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 3,
    },
    bubbleThem: {
      backgroundColor: BUBBLE_THEM_BG,
      paddingVertical: 10, paddingHorizontal: 14,
      borderRadius: 20, borderBottomLeftRadius: 5,
      alignSelf: 'flex-start',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 1,
    },
    msgText: { fontSize: 15, lineHeight: 21, flexWrap: 'wrap', flexShrink: 1 },
    // Time row
    timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginHorizontal: 4 },
    timeText: { fontSize: 10.5, color: TIME_COLOR },
    // Input bar
    inputBar: {
      position: 'absolute', left: 0, right: 0, bottom: 0,
      paddingHorizontal: 12, paddingTop: 10,
      backgroundColor: isDark ? '#121418' : '#FFFFFF',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
    },
    inputRow: { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'flex-end' },
    textInput: {
      flex: 1, marginHorizontal: 8,
      backgroundColor: isDark ? '#1A1D24' : '#F0F2F5',
      paddingVertical: Platform.OS === 'ios' ? 10 : 7,
      paddingHorizontal: 16,
      borderRadius: 24, color: isDark ? '#E8EAED' : '#0D1117',
      fontSize: 15,
      maxHeight: 120,
    },
    sendBtn: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: GREEN,
      justifyContent: 'center', alignItems: 'center',
      shadowColor: GREEN,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 4,
    },
    micBtn: {
      width: 44, height: 44, borderRadius: 22,
      justifyContent: 'center', alignItems: 'center',
    },
  }), [T, isDark, isRTL, windowWidth, BUBBLE_ME_BG, BUBBLE_THEM_BG]);

  // ─── Render a single message item ──────────────────────────────────────────
  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const senderId = typeof item.senderId === 'object' && item.senderId
      ? (item.senderId._id || item.senderId.id)
      : item.senderId;
    const isMe = String(senderId) === String((user as any)?._id || (user as any)?.id);
    const isTemp = String(item.id || '').startsWith('temp-');
    const avatarUrl = item.senderAvatarUrl || (typeof item.senderId === 'object' && item.senderId ? item.senderId.avatar?.url : null);
    const senderDisplayName = String(item.senderName || 'A');

    const itemId = String(item.id || item._id);
    const shouldAnimate = !seenIds.current.has(itemId);
    if (shouldAnimate) seenIds.current.add(itemId);

    const delay = Math.min(index * 30, 300);
    const enteringAnimation = !shouldAnimate || reducedMotion
      ? undefined
      : (isMe ? SlideInRight.duration(220).delay(delay) : FadeInDown.duration(220).delay(delay));

    const firstAtt = item.attachments && item.attachments.length > 0 ? item.attachments[0] : null;
    const isAudio = firstAtt?.type === 'audio';
    const isImage = firstAtt?.type === 'image';
    const isVideo = firstAtt?.type === 'video';

    const isHighlighted = item.id === highlightedMsgId;
    const bubbleStyle = isMe
      ? [styles.bubbleMe, isHighlighted && { opacity: 0.75, transform: [{ scale: 1.02 }] }]
      : [styles.bubbleThem, isHighlighted && { backgroundColor: isDark ? '#2C3E50' : '#DFF9F0' }];

    // ── Reaction pills ──
    const reactionPills = item.reactionCounts && Object.keys(item.reactionCounts).length > 0 ? (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 5, gap: 4 }}>
        {Object.entries(item.reactionCounts).map(([emoji, count]: any) => (
          <TouchableOpacity
            key={emoji}
            onPress={() => chat.handleToggleReaction(item.id || item._id, emoji)}
            style={{
              backgroundColor: isMe ? 'rgba(255,255,255,0.15)' : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              paddingHorizontal: 8, paddingVertical: 3,
              borderRadius: 12,
              flexDirection: 'row', alignItems: 'center',
              borderWidth: 1,
              borderColor: isMe ? 'rgba(255,255,255,0.12)' : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
            }}
          >
            <Text style={{ fontSize: 13 }}>{emoji}</Text>
            <Text style={{ fontSize: 11, marginLeft: 4, color: isMe ? 'rgba(255,255,255,0.85)' : (isDark ? '#A0B0C0' : '#444'), fontWeight: '700' }}>{count}</Text>
          </TouchableOpacity>
        ))}
      </View>
    ) : null;

    // ── Reply preview ──
    const replyPreview = item.replyTo && item.replyTo.messageId ? (
      <View style={{
        borderLeftWidth: 3,
        borderLeftColor: isMe ? 'rgba(255,255,255,0.5)' : GREEN,
        paddingLeft: 8, marginBottom: 8,
        backgroundColor: isMe ? 'rgba(0,0,0,0.12)' : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
        borderRadius: 8, paddingVertical: 5, paddingRight: 8,
      }}>
        <Text style={{ fontSize: 11.5, fontWeight: '700', color: isMe ? 'rgba(255,255,255,0.85)' : GREEN }}>
          {item.replyTo.senderName || 'User'}
        </Text>
        <Text numberOfLines={1} style={{ fontSize: 12.5, color: isMe ? 'rgba(255,255,255,0.65)' : (isDark ? '#8899A8' : '#7A8999'), marginTop: 2 }}>
          {item.replyTo.preview || '...'}
        </Text>
      </View>
    ) : null;

    // ── Bubble content ──
    const renderBubbleContent = () => {
      if (item.deletedAt) {
        return (
          <Text style={[styles.msgText, { fontStyle: 'italic', opacity: 0.55, color: isMe ? '#fff' : (isDark ? '#8899A8' : '#9AABB8') }]}>
            🗑 {t('Message deleted')}
          </Text>
        );
      }

      if (item.status === 'sending') {
        if (isImage || isVideo) {
          return (
            <View style={{ width: Math.min(windowWidth * 0.58, 240), height: Math.min(windowWidth * 0.43, 180), borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.15)', alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="small" color={isMe ? '#fff' : GREEN} />
            </View>
          );
        }
        return (
          <View style={{ paddingVertical: 4, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', minWidth: 80 }}>
            <ActivityIndicator size="small" color={isMe ? 'rgba(255,255,255,0.6)' : GREEN} />
          </View>
        );
      }

      if (isAudio) {
        const isPlaying = chat.playingId === (item.id || item._id);
        const waveHeights = [5, 9, 14, 18, 22, 18, 14, 9, 6, 10, 16, 20, 16, 10, 7];
        return (
          <View style={{ flexDirection: 'row', alignItems: 'center', minWidth: 170 }}>
            {/* Play/Pause button */}
            <View style={{
              width: 38, height: 38, borderRadius: 19,
              backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
              justifyContent: 'center', alignItems: 'center',
            }}>
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={17} color={isMe ? '#fff' : GREEN} />
            </View>
            {/* Waveform */}
            <View style={{ flex: 1, marginHorizontal: 10, flexDirection: 'row', alignItems: 'center', height: 28 }}>
              {waveHeights.map((h, idx) => {
                const progress = isPlaying ? chat.audioProgress : 0;
                const filled = progress >= idx / waveHeights.length;
                return (
                  <View
                    key={idx}
                    style={{
                      width: 2.5,
                      height: h,
                      marginHorizontal: 1,
                      borderRadius: 2,
                      backgroundColor: isMe
                        ? (filled ? '#fff' : 'rgba(255,255,255,0.3)')
                        : (filled ? GREEN : (isDark ? 'rgba(200,210,220,0.25)' : 'rgba(0,0,0,0.15)')),
                    }}
                  />
                );
              })}
            </View>
            {/* Duration */}
            <Text style={{ fontSize: 12, color: isMe ? 'rgba(255,255,255,0.75)' : (isDark ? '#8899A8' : '#7A8999'), fontWeight: '600', minWidth: 34 }}>
              {formatDuration(firstAtt?.duration || item.duration)}
            </Text>
          </View>
        );
      }

      if (isImage) {
        const imgUrl = firstAtt?.thumbnail || firstAtt?.url;
        return (
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => { if (firstAtt?.url) Linking.openURL(firstAtt.url).catch(() => {}); }}
            style={{ borderRadius: 14, overflow: 'hidden' }}
          >
            <Image
              source={{ uri: imgUrl }}
              style={{
                width: Math.min(windowWidth * 0.58, 240),
                height: Math.min(windowWidth * 0.43, 180),
                borderRadius: 14,
                backgroundColor: isDark ? '#1A2030' : '#E8ECF0',
              }}
              resizeMode="cover"
            />
            {!!item.content && (
              <Text style={[styles.msgText, { marginTop: 8, color: isMe ? '#fff' : BUBBLE_THEM_TEXT }]}>{item.content}</Text>
            )}
          </TouchableOpacity>
        );
      }

      if (isVideo) {
        return (
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => { if (firstAtt?.url) Linking.openURL(firstAtt.url).catch(() => {}); }}
            style={{ borderRadius: 14, overflow: 'hidden', position: 'relative' }}
          >
            {firstAtt?.thumbnail ? (
              <Image
                source={{ uri: firstAtt.thumbnail }}
                style={{ width: Math.min(windowWidth * 0.58, 240), height: Math.min(windowWidth * 0.38, 160), borderRadius: 14, backgroundColor: isDark ? '#1A2030' : '#E8ECF0' }}
                resizeMode="cover"
              />
            ) : (
              <View style={{ width: Math.min(windowWidth * 0.58, 240), height: Math.min(windowWidth * 0.38, 160), borderRadius: 14, backgroundColor: isDark ? '#1A2030' : '#E0EAF4', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="videocam" size={34} color={GREEN} />
              </View>
            )}
            {/* Play overlay */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.42)', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="play" size={22} color="#fff" />
              </View>
            </View>
            {!!item.content && (
              <Text style={[styles.msgText, { marginTop: 8, color: isMe ? '#fff' : BUBBLE_THEM_TEXT }]}>{item.content}</Text>
            )}
          </TouchableOpacity>
        );
      }

      // Default: text
      return (
        <Text style={[styles.msgText, { color: isMe ? BUBBLE_ME_TEXT : BUBBLE_THEM_TEXT }]}>
          {item.content}
        </Text>
      );
    };

    return (
      <AnimatedReanimated.View
        entering={enteringAnimation}
        style={[styles.row, { justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 2 }]}
      >
        {/* Left avatar for others */}
        {!isMe && (
          avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={[styles.msgAvatar, { marginRight: 8 }]} />
          ) : (
            <View style={[styles.msgAvatarWrap, { backgroundColor: avatarColor(senderDisplayName), marginRight: 8 }]}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff' }}>
                {senderDisplayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )
        )}

        {/* Status indicators for my messages */}
        {isMe && item.status === 'failed' && (
          <TouchableOpacity onPress={() => chat.handleRetrySend(item)} style={{ marginRight: 6, alignSelf: 'center' }} accessibilityLabel="Retry">
            <Ionicons name="alert-circle" size={18} color="#E74C3C" />
          </TouchableOpacity>
        )}
        {isMe && item.status === 'sending' && (
          <View style={{ marginRight: 6, alignSelf: 'center' }}>
            <ActivityIndicator size="small" color={isDark ? '#8899A8' : '#A0B0C0'} />
          </View>
        )}

        <View style={[styles.messageBlock, { alignItems: isMe ? 'flex-end' : 'flex-start' }]}>
          {/* Sender name in groups */}
          {!isMe && !dmPartnerId && (
            <Text style={[styles.senderName, { color: avatarColor(senderDisplayName) }]}>
              {item.senderName || 'User'}
            </Text>
          )}

          <TouchableOpacity
            activeOpacity={0.92}
            onLongPress={() => { if (!isTemp) chat.setReactionMsgId(item.id || item._id); }}
            onPress={() => {
              if (isTemp) return;
              if (isAudio) chat.playAudio(item);
              else chat.handlePressMessage(item);
            }}
            style={bubbleStyle}
          >
            {replyPreview}
            {renderBubbleContent()}
            {reactionPills}
          </TouchableOpacity>

          {/* Timestamp + read status */}
          <View style={[styles.timeRow, { flexDirection: isMe ? 'row-reverse' : 'row' }]}>
            <Text style={styles.timeText}>{formatMessageTime(item.createdAt || item.created_at)}</Text>
            {isMe && !isTemp && (
              <Ionicons
                name={item.seenBy && item.seenBy.length > 0 ? 'checkmark-done' : 'checkmark-done'}
                size={14}
                color={TICK_COLOR}
                style={{ marginHorizontal: 3 }}
              />
            )}
            {!!item.editedAt && (
              <Text style={{ fontSize: 10, color: TIME_COLOR, marginHorizontal: 3, fontStyle: 'italic' }}>{t('edited')}</Text>
            )}
            {!!item.pinned && (
              <Ionicons name="pin" size={10} color={GREEN} style={{ marginHorizontal: 3 }} />
            )}
          </View>
        </View>
      </AnimatedReanimated.View>
    );
  };

  if (!chat.channel) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#0D0F13' : '#F5F7FA' }}>
        <ActivityIndicator size="large" color={GREEN} />
        <Text style={{ color: isDark ? '#8899A8' : '#9AABB8', marginTop: 12, fontSize: 14 }}>{t('Loading channel...')}</Text>
      </View>
    );
  }

  const display = getChatDisplay(chat.channel);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => { if (navigation.canGoBack && navigation.canGoBack()) navigation.goBack(); else navigation.navigate('MessagingHome'); }}
            style={styles.backBtn}
          >
            <Ionicons name={isRTL ? 'arrow-forward-outline' : 'chevron-back'} size={24} color={isDark ? '#E8EAED' : '#0D1117'} />
          </TouchableOpacity>

          {dmPartnerId ? (
            <TouchableOpacity onPress={() => chat.setMembersSheetVisible(true)} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }} activeOpacity={0.75}>
              <View style={{ position: 'relative' }}>
                {display.avatar ? (
                  <Image source={{ uri: display.avatar }} style={styles.dmAvatar} />
                ) : (
                  <View style={[styles.dmAvatar, { backgroundColor: avatarColor(display.name), justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ fontSize: 17, fontWeight: '800', color: '#fff' }}>{String(display.name || '?').charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <View style={[styles.presenceDot, { backgroundColor: partnerOnline ? '#2ECC71' : '#636E72' }]} />
              </View>
              <View style={{ marginLeft: 10, flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Text style={styles.headerName} numberOfLines={1}>{display.name}</Text>
                  {!!chat.channel?.myMuted && <Ionicons name="notifications-off" size={13} color={isDark ? '#8899A8' : '#9AABB8'} />}
                </View>
                {chat.typingUser ? (
                  <Text style={styles.headerSubOnline}>{t('typing...')}</Text>
                ) : (
                  <Text style={partnerOnline ? styles.headerSubOnline : styles.headerSub}>
                    {partnerOnline ? t('Online') : t('Offline')}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => chat.setMembersSheetVisible(true)} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }} activeOpacity={0.75}>
              <View style={styles.groupAvatar}>
                {display.avatar ? (
                  <Image source={{ uri: display.avatar }} style={{ width: 40, height: 40, borderRadius: 14 }} />
                ) : (
                  <Ionicons name="people" size={20} color={GREEN} />
                )}
              </View>
              <View style={{ marginLeft: 10, flex: 1, minWidth: 0 }}>
                <Text style={styles.headerName} numberOfLines={1}>{display.name}</Text>
                <Text style={styles.headerSub}>
                  {chat.typingUser
                    ? `${chat.typingUser} ${t('is typing')}...`
                    : (chat.channel?.participants?.length || 0) > 0
                      ? `${chat.channel.participants.length} ${t('members')}`
                      : t('Group')}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={{ padding: 8 }} onPress={() => chat.setMenuVisible(true)} accessibilityLabel="Options">
            <Ionicons name="ellipsis-vertical" size={20} color={isDark ? '#E8EAED' : '#0D1117'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── PINNED MESSAGES BANNER ──────────────────────────────────────────── */}
      {pinnedMessages.length > 0 && (() => {
        const safeIndex = Math.min(currentPinIndex, pinnedMessages.length - 1);
        const activePin = pinnedMessages[safeIndex];
        if (!activePin) return null;
        return (
          <View
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{
              borderBottomWidth: 1,
              borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
              backgroundColor: isDark ? '#141820' : '#F8FFF8',
              paddingVertical: 10, paddingHorizontal: 14,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <TouchableOpacity
              onPress={() => {
                const idx = chat.messages.findIndex((m: any) => String(m.id || m._id) === String(activePin.messageId));
                if (idx >= 0) {
                  try {
                    chat.listRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
                    setHighlightedMsgId(activePin.messageId);
                    setTimeout(() => setHighlightedMsgId(null), 1500);
                  } catch (e) {}
                } else {
                  Alert.alert(t('Info'), t('Message is older. Scroll up to find it.'));
                }
              }}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
            >
              <View style={{ width: 3, height: 28, backgroundColor: GREEN, borderRadius: 2, marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11.5, fontWeight: '700', color: GREEN }}>
                  {activePin.senderName || t('Pinned')}{pinnedMessages.length > 1 ? `  ${safeIndex + 1}/${pinnedMessages.length}` : ''}
                </Text>
                <Text numberOfLines={1} style={{ fontSize: 13, color: isDark ? '#C0D0E0' : '#374151', marginTop: 1 }}>
                  {activePin.content || (activePin.attachments?.[0]?.type === 'audio' ? t('Voice Message') : t('[Attachment]'))}
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => chat.handleTogglePin(activePin.messageId)} style={{ padding: 6 }} accessibilityLabel="Unpin">
              <Ionicons name="close" size={17} color={isDark ? '#8899A8' : '#9AABB8'} />
            </TouchableOpacity>
          </View>
        );
      })()}

      {/* ── MESSAGES LIST ───────────────────────────────────────────────────── */}
      {chat.loading && chat.messages.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      ) : (
        <FlatList
          ref={chat.listRef}
          data={chat.messages}
          keyExtractor={(i) => String(i.id || i._id || Math.random())}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: 120 + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        />
      )}

      {/* Emoji pop animation */}
      {chat.popEmoji ? (
        <Animated.View pointerEvents="none" style={{
          position: 'absolute', right: 40, bottom: 120,
          transform: [{ scale: chat.popAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1.2] }) }],
          opacity: chat.popAnim.interpolate({ inputRange: [0, 0.65, 1], outputRange: [0, 1, 0] }),
        }}>
          <Text style={{ fontSize: 44 }}>{chat.popEmoji}</Text>
        </Animated.View>
      ) : null}

      {/* ── INPUT BAR ───────────────────────────────────────────────────────── */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 + insets.bottom : 0}>
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 10 }]}>

          {/* Typing indicator */}
          {chat.typingUser && !dmPartnerId && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, paddingLeft: 4 }}>
              <Text style={{ color: isDark ? '#8899A8' : '#9AABB8', fontSize: 12.5, fontStyle: 'italic' }}>
                {chat.typingUser} {t('is typing')}...
              </Text>
            </View>
          )}

          {/* Reply preview bar */}
          {chat.replyingTo && (
            <View style={{
              backgroundColor: isDark ? '#1A1D24' : '#F0F2F5',
              padding: 10, borderRadius: 14, marginBottom: 8,
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              borderLeftWidth: 3, borderLeftColor: GREEN,
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: GREEN, fontSize: 12.5, fontWeight: '700' }}>{t('Replying to')} {chat.replyingTo.senderName}</Text>
                <Text style={{ color: isDark ? '#8899A8' : '#9AABB8', fontSize: 12.5, marginTop: 2 }} numberOfLines={1}>{chat.replyingTo.preview}</Text>
              </View>
              <TouchableOpacity onPress={() => chat.setReplyingTo(null)} style={{ padding: 6 }}>
                <Ionicons name="close" size={18} color={isDark ? '#8899A8' : '#9AABB8'} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputRow}>
            {/* Attachment button */}
            {!chat.isRecording && (
              <TouchableOpacity
                onPress={() => {
                  if (Platform.OS === 'web') { chat.pickMediaAndSend(); return; }
                  Alert.alert(t('Attach Media'), '', [
                    { text: t('Photo / Video'), onPress: () => chat.pickMediaAndSend() },
                    { text: t('Cancel'), style: 'cancel' },
                  ]);
                }}
                style={{ padding: 8 }}
                accessibilityLabel="Attach media"
              >
                <Ionicons name="attach" size={24} color={isDark ? '#8899A8' : '#9AABB8'} />
              </TouchableOpacity>
            )}

            {/* Mic button */}
            <TouchableOpacity
              onPress={chat.isRecording ? chat.stopRecordingAndSend : chat.startRecording}
              style={styles.micBtn}
              accessibilityLabel="Voice message"
            >
              <View style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: chat.isRecording ? '#E74C3C' : 'transparent',
                justifyContent: 'center', alignItems: 'center',
              }}>
                <Ionicons name="mic" size={20} color={chat.isRecording ? '#fff' : (isDark ? '#8899A8' : '#9AABB8')} />
              </View>
            </TouchableOpacity>

            {/* Recording state OR Text input + send */}
            {chat.isRecording ? (
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginLeft: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Animated.View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#E74C3C', opacity: pulseAnim, marginRight: 8 }} />
                  <Text style={{ color: isDark ? '#E8EAED' : '#0D1117', fontSize: 14.5, fontWeight: '600' }}>
                    {formatRecordingTime(chat.recordingDuration)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <TouchableOpacity
                    onPress={chat.cancelRecording}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 16, backgroundColor: isDark ? '#2C2030' : '#FEF3F3' }}
                    accessibilityLabel="Cancel recording"
                  >
                    <Ionicons name="trash-outline" size={15} color="#E74C3C" />
                    <Text style={{ color: '#E74C3C', marginLeft: 4, fontWeight: '700', fontSize: 13 }}>{t('Cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={chat.stopRecordingAndSend}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 7, backgroundColor: GREEN, borderRadius: 16 }}
                    accessibilityLabel="Send recording"
                  >
                    <Ionicons name="send" size={14} color="#fff" />
                    <Text style={{ color: '#fff', marginLeft: 5, fontWeight: '700', fontSize: 13 }}>{t('Send')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <TextInput
                  value={chat.input}
                  onChangeText={chat.setInput}
                  placeholder={chat.editingMsgId ? t('Edit message...') : t('Message')}
                  placeholderTextColor={isDark ? 'rgba(200,210,220,0.35)' : 'rgba(0,0,0,0.3)'}
                  style={styles.textInput}
                  multiline
                />
                <TouchableOpacity
                  onPress={() => { chat.handleSend(); chat.setReplyingTo(null); }}
                  style={styles.sendBtn}
                  accessibilityLabel="Send message"
                >
                  <Ionicons name={chat.editingMsgId ? 'checkmark' : 'send'} size={18} color="#fff" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* ── MODALS ──────────────────────────────────────────────────────────── */}
      <OptionsActionMenu
        visible={chat.menuVisible}
        onRequestClose={() => chat.setMenuVisible(false)}
        isDM={!!dmPartnerId}
        isMuted={!!chat.channel?.myMuted}
        onOpenMembers={() => chat.setMembersSheetVisible(true)}
        onOpenEditGroup={() => chat.setEditSheetVisible(true)}
        onMuteToggle={chat.handleMuteDM}
        onClearChat={chat.handleClearChat}
        onDeleteConversation={chat.handleDeleteDM}
        theme={T}
        insets={insets}
        isDark={isDark}
        BlurView={BlurView}
        t={t}
      />

      <MembersBottomSheet
        visible={chat.membersSheetVisible}
        onClose={() => chat.setMembersSheetVisible(false)}
        channel={chat.channel}
        members={chat.members}
        membersLoading={chat.membersLoading}
        isAdmin={chat.isAdmin}
        user={user}
        allUsers={chat.allUsers}
        showAddList={chat.showAddList}
        setShowAddList={chat.setShowAddList}
        selectedToAdd={chat.selectedToAdd}
        toggleSelectToAdd={chat.toggleSelectToAdd}
        addMembers={chat.addMembers}
        adding={chat.adding}
        removeMember={chat.removeMember}
        openEditSheet={() => chat.setEditSheetVisible(true)}
        copyChannelLink={chat.copyChannelLink}
        fetchMembers={chat.fetchMembers}
        theme={T}
        isRTL={isRTL}
        t={t}
        isDark={isDark}
        BlurView={BlurView}
      />

      <EditGroupModal
        visible={chat.editSheetVisible}
        onClose={() => chat.setEditSheetVisible(false)}
        channel={chat.channel}
        editName={chat.editName}
        setEditName={chat.setEditName}
        editPhotoUri={chat.editPhotoUri}
        uploadingPhoto={chat.uploadingPhoto}
        saving={chat.saving}
        hasChanges={chat.hasChanges}
        isCreator={chat.isCreator}
        isAdmin={chat.isAdmin}
        showImageOptions={chat.showImageOptions}
        saveGroupEdits={chat.saveGroupEdits}
        setConfirmDeleteVisible={chat.setConfirmDeleteVisible}
        theme={T}
        isDark={isDark}
        BlurView={BlurView}
        t={t}
        modalBg={modalBg}
        overlayFallback={overlayFallback}
      />

      <ConfirmDeleteModal
        visible={chat.confirmDeleteVisible}
        onClose={() => chat.setConfirmDeleteVisible(false)}
        deleting={chat.deleting}
        performDeleteGroup={chat.performDeleteGroup}
        theme={T}
        isDark={isDark}
        BlurView={BlurView}
        t={t}
        modalBg={modalBg}
        overlayFallback={overlayFallback}
      />

      <ReactionsOverlayModal
        visible={!!chat.reactionMsgId}
        reactionMsgId={chat.reactionMsgId}
        onClose={() => chat.setReactionMsgId(null)}
        reactionEmojis={chat.reactionEmojis}
        handleToggleReaction={chat.handleToggleReaction}
        selectedMsg={selectedMsg}
        handleReplyTo={chat.handleReplyTo}
        handleCopy={chat.handleCopy}
        handleStartEdit={chat.handleStartEdit}
        handleDeleteMessage={chat.handleDeleteMessage}
        handleTogglePin={chat.handleTogglePin}
        user={user}
        theme={T}
        isDark={isDark}
        BlurView={BlurView}
        t={t}
        modalBg={modalBg}
        overlayFallback={overlayFallback}
      />
    </SafeAreaView>
  );
}
