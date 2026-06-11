import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ActivityIndicator, Animated, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import http from '../../../../core/network/http.client';
import messagingHttp from '../../../../core/network/messaging-http.client';
import messagingEvents from '../../../../shared/utils/messagingEvents';
import { useTheme } from '../../../../shared/context/theme.context';
import { useLanguage } from '../../../../shared/context/language.context';
import { useAuth } from '../../../../modules/auth/state/auth.context';
import { useSocket } from '../../../../shared/context/socket.context';
import { ChatCacheService } from '../../services/chat-cache.service';
import { usePresence } from '../../../../shared/hooks/usePresence';
import AnimatedReanimated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

// Deterministic color from string
function avatarColor(str: string) {
  const colors = ['#6C63FF','#FF6584','#43B89C','#F7B731','#E17055','#0984E3','#A29BFE','#00B894','#FDCB6E','#D63031'];
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function formatTime(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

export default function MessagingHome({ navigation }: any) {
  const { theme: T, isDark } = useTheme();
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const { socket } = useSocket();
  const { isOnline } = usePresence();

  const seenIds = useRef<Set<string>>(new Set());
  const hasPopulatedChannels = useRef(false);
  const hasPopulatedContacts = useRef(false);
  const reducedMotion = useReducedMotion();

  const [channels, setChannels] = useState<any[]>([]);
  const [sortOrder, setSortOrder] = useState<string[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [activeTab, setActiveTab] = useState<'all'|'groups'|'contacts'>('all');
  const [tabsWidth, setTabsWidth] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const BG       = isDark ? '#0D0F13' : '#F5F7FA';
  const SURFACE  = isDark ? '#121418' : '#FFFFFF';
  const SURF_ALT = isDark ? '#1A1D24' : '#F0F2F5';
  const GREEN    = isDark ? '#27AE60' : '#2ECC71';
  const TEXT     = isDark ? '#E8EAED' : '#0D1117';
  const MUTED    = isDark ? 'rgba(200,210,220,0.45)' : 'rgba(0,0,0,0.4)';
  const DIVIDER  = isDark ? 'rgba(255,255,255,0.055)' : 'rgba(0,0,0,0.055)';

  const fetchChannels = useCallback(async () => {
    try {
      const cached = await ChatCacheService.getChannels();
      if (cached && cached.length > 0) { setChannels(cached); setLoading(false); }
    } catch (err) {}

    try {
      const res = await messagingHttp.get('/channels');
      const fresh = res.data?.data || [];
      const ids = fresh.map((c: any) => String(c._id || c.id));
      setSortOrder(ids);
      setChannels(fresh);
      await ChatCacheService.saveChannels(fresh);
    } catch (err) {
      if (channels.length === 0) setChannels([]);
    } finally {
      setLoading(false);
    }
  }, [channels.length]);

  useEffect(() => { fetchChannels(); }, []);

  useEffect(() => {
    if (channels.length > 0) ChatCacheService.saveChannels(channels);
  }, [channels]);

  useEffect(() => {
    (async () => {
      try {
        const res = await http.get('/users');
        setUsers(res.data?.data || []);
      } catch (err) { setUsers([]); }
      finally { setLoadingUsers(false); }
    })();
  }, []);

  useFocusEffect(useCallback(() => { fetchChannels(); }, [fetchChannels]));

  const [creatingContactFor, setCreatingContactFor] = useState<string | null>(null);

  function isDMChannel(c: any) {
    if (!c) return false;
    if (c.type === 'group' || c.type === 'social') return false;
    if (c.name && typeof c.name === 'string' && !c.name.startsWith('DM-')) return false;
    if (c.name && typeof c.name === 'string' && c.name.startsWith('DM-')) return true;
    if (c.type && (c.type === 'direct' || c.type === 'dm' || c.type === 'DM')) return true;
    if (c.participants && Array.isArray(c.participants) && c.participants.length === 2) return true;
    return false;
  }

  function isGroupChannel(c: any) {
    if (!c) return false;
    if (c.type === 'group' || c.type === 'social') return true;
    if (c.name && typeof c.name === 'string' && !c.name.startsWith('DM-')) return true;
    if (c.type === 'direct' || c.type === 'dm' || c.type === 'DM') return false;
    return !isDMChannel(c);
  }

  function findOtherParticipant(channel: any) {
    if (!channel || !user) return null;
    const parts = channel.participants || channel.members || channel.participantIds || channel.userIds;
    let otherId: any = null;
    if (parts && Array.isArray(parts)) {
      const ids = parts.map((p: any) => (typeof p === 'string' ? p : (p._id || p.id || p.userId || p._userId)));
      otherId = ids.find((id: any) => id && String(id) !== String(user._id));
    }
    if (!otherId && channel.name && typeof channel.name === 'string') {
      const matches = channel.name.match(/[0-9a-fA-F]{6,}/g);
      if (matches) { const m = matches.find((mId: string) => String(mId) !== String(user._id)); if (m) otherId = m; }
    }
    if (!otherId) return null;
    const found = users.find(u => String(u._id) === String(otherId) || String(u.id) === String(otherId));
    if (found) return found;
    if (parts && Array.isArray(parts)) {
      const obj = parts.find((p: any) => p && (String(p._id) === String(otherId) || String(p.id) === String(otherId)));
      if (obj) return obj;
    }
    return { _id: otherId, fullName: String(otherId), avatarUrl: null };
  }

  function getChannelDisplay(channel: any) {
    if (!channel) return { name: 'Channel', avatarUrl: null, isDM: false };
    if (isDMChannel(channel)) {
      const other = findOtherParticipant(channel);
      const name = other ? (other.fullName || other.name || other.displayName || 'User') : (channel.name || 'Direct Message');
      const avatarUrl = other ? (other.avatarUrl || other.avatar || null) : null;
      return { name, avatarUrl, isDM: true };
    }
    return {
      name: (typeof channel.name === 'string' ? channel.name : null) || channel.displayName || 'Group',
      avatarUrl: channel.avatarUrl || null,
      isDM: false,
    };
  }

  const filteredChannels = useMemo(() => {
    if (activeTab === 'contacts') return [];
    if (activeTab === 'groups') return channels.filter(isGroupChannel);
    return channels.filter(c => isGroupChannel(c) || isDMChannel(c));
  }, [channels, activeTab]);

  const sortedChannels = useMemo(() => {
    const list = filteredChannels ? [...filteredChannels] : [];
    if (sortOrder.length > 0) {
      list.sort((a: any, b: any) => {
        const ai = sortOrder.indexOf(String(a._id || a.id));
        const bi = sortOrder.indexOf(String(b._id || b.id));
        if (ai !== -1 && bi !== -1) return ai - bi;
        if (ai !== -1) return -1;
        if (bi !== -1) return 1;
        const ta = a?.lastMessage?.createdAt || a?.updatedAt || a?.createdAt || 0;
        const tb = b?.lastMessage?.createdAt || b?.updatedAt || b?.createdAt || 0;
        return new Date(tb).getTime() - new Date(ta).getTime();
      });
    } else {
      list.sort((a: any, b: any) => {
        const ta = a?.lastMessage?.createdAt || a?.updatedAt || a?.createdAt || 0;
        const tb = b?.lastMessage?.createdAt || b?.updatedAt || b?.createdAt || 0;
        return new Date(tb).getTime() - new Date(ta).getTime();
      });
    }
    return list;
  }, [filteredChannels, sortOrder]);

  const contactsList = useMemo(() => {
    if (!users || !user) return [];
    const dmChannels = channels.filter(isDMChannel);
    return users.filter(u => {
      if (u._id === user._id) return false;
      return !dmChannels.some(dc => {
        const parts = dc.participants || dc.members || [];
        return Array.isArray(parts) && parts.some((p: any) => String(p._id || p.id || p.userId || p) === String(u._id)) && parts.some((p: any) => String(p._id || p.id || p.userId || p) === String(user._id));
      });
    });
  }, [users, channels, user]);

  if (!hasPopulatedChannels.current && sortedChannels && sortedChannels.length > 0) {
    sortedChannels.forEach((c: any) => seenIds.current.add(String(c._id || c.id)));
    hasPopulatedChannels.current = true;
  }
  if (!hasPopulatedContacts.current && contactsList && contactsList.length > 0) {
    contactsList.forEach((u: any) => seenIds.current.add(String(u._id || u.id || u.fullName)));
    hasPopulatedContacts.current = true;
  }

  async function contactUser(targetId: string) {
    setCreatingContactFor(targetId);
    try {
      const res = await http.post('/channels/direct', { userId: targetId });
      const channel = res.data?.data;
      if (channel) navigation.navigate('CommunityChat', { initialChannel: channel, channelId: String(channel._id || channel.id || '') });
    } catch (err) { console.error('Failed to create direct channel', err); }
    finally { setCreatingContactFor(null); }
  }

  const pinnedChannels = useMemo(() => sortedChannels.filter(c => c.isPinned), [sortedChannels]);
  const unpinnedChannels = useMemo(() => sortedChannels.filter(c => !c.isPinned), [sortedChannels]);

  const flattenedList = useMemo(() => {
    const list: any[] = [];
    if (pinnedChannels.length > 0) {
      list.push({ isHeader: true, title: t('Pinned') });
      list.push(...pinnedChannels);
    }
    if (unpinnedChannels.length > 0) {
      if (pinnedChannels.length > 0) list.push({ isHeader: true, title: t('Recent') });
      list.push(...unpinnedChannels);
    }
    return list;
  }, [pinnedChannels, unpinnedChannels, t]);

  const togglePinChannel = async (channel: any) => {
    const channelId = channel._id || channel.id;
    const nextPinned = !channel.isPinned;
    setChannels(prev => prev.map(c => String(c._id || c.id) === String(channelId) ? { ...c, isPinned: nextPinned } : c));
    try {
      if (channel.isPinned) await http.delete(`/channels/${channelId}/pin`);
      else await http.post(`/channels/${channelId}/pin`, {});
    } catch (err) {
      setChannels(prev => prev.map(c => String(c._id || c.id) === String(channelId) ? { ...c, isPinned: !nextPinned } : c));
      Alert.alert(t('Error'), t('Failed to update pin status'));
    }
  };

  const handleLongPressChannel = (channel: any) => {
    const isPinned = !!channel.isPinned;
    Alert.alert(
      getChannelDisplay(channel).name,
      isPinned ? t('Unpin this conversation?') : t('Pin this conversation to top?'),
      [{ text: t('Cancel'), style: 'cancel' }, { text: isPinned ? t('Unpin') : t('Pin'), onPress: () => togglePinChannel(channel) }],
      { cancelable: true }
    );
  };

  // Socket events
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = ({ message }: any) => {
      setChannels(prev => {
        const cid = String(message.channelId || message.channel || '');
        let found = false;
        const next = prev.map(c => {
          if (String(c._id || c.id) === cid) {
            found = true;
            const isSenderMe = String(message.senderId) === String(user?._id);
            return { ...c, lastMessage: { content: message.content, createdAt: message.createdAt, messageId: message.id || message._id }, unreadCount: isSenderMe ? 0 : (c.unreadCount || 0) + 1 };
          }
          return c;
        });
        return found ? next : prev;
      });
    };

    const handleConversationUpdated = ({ channelId, lastMessage, unreadCount }: any) => {
      if (!channelId) return;
      const cid = String(channelId);
      setSortOrder(prev => { const next = prev.filter(id => id !== cid); next.unshift(cid); return next; });
      setChannels(prev => {
        const idx = prev.findIndex(c => String(c._id || c.id) === cid);
        if (idx === -1) return prev;
        const updated = { ...prev[idx], ...(lastMessage !== undefined ? { lastMessage } : {}), ...(unreadCount !== undefined ? { unreadCount } : {}) };
        const next = [...prev]; next[idx] = updated;
        return next;
      });
    };

    const handleMessageEdited = ({ messageId, content }: any) => {
      setChannels(prev => prev.map(c => {
        const lm = c.lastMessage || {};
        if (lm.messageId && String(lm.messageId) === String(messageId)) return { ...c, lastMessage: { ...lm, content } };
        return c;
      }));
    };

    const handleMessageDeleted = ({ messageId, channelId }: any) => {
      setChannels(prev => prev.map(c => {
        const lm = c.lastMessage || {};
        if ((lm.messageId && String(lm.messageId) === String(messageId)) || String(c._id || c.id) === String(channelId)) {
          return { ...c, lastMessage: { ...lm, content: null } };
        }
        return c;
      }));
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:edited', handleMessageEdited);
    socket.on('message:deleted', handleMessageDeleted);
    socket.on('conversation:updated', handleConversationUpdated);
    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:edited', handleMessageEdited);
      socket.off('message:deleted', handleMessageDeleted);
      socket.off('conversation:updated', handleConversationUpdated);
    };
  }, [socket, user]);

  useEffect(() => {
    const onOpened = (channelId: any) => {
      setChannels(prev => prev.map(c => String(c._id || c.id) === String(channelId) ? { ...c, unreadCount: 0 } : c));
    };
    messagingEvents.on('channel:opened', onOpened);
    return () => { messagingEvents.off('channel:opened', onOpened); };
  }, []);

  useEffect(() => {
    const onLocalMessage = (message: any) => {
      if (!message) return;
      const cid = String(message.channelId || message.channel || '');
      setSortOrder(prev => { const next = prev.filter(id => id !== cid); next.unshift(cid); return next; });
      setChannels(prev => {
        let found = false;
        const next = prev.map(c => {
          if (String(c._id || c.id) === cid) {
            found = true;
            const isSenderMe = String(message.senderId) === String(user?._id);
            return { ...c, lastMessage: { content: message.content, createdAt: message.createdAt, messageId: message.id || message._id }, unreadCount: isSenderMe ? 0 : (c.unreadCount || 0) + 1 };
          }
          return c;
        });
        return found ? next : prev;
      });
    };
    const onChannelUpdated = (updated: any) => {
      if (!updated) return;
      setChannels(prev => prev.map(c => String(c._id || c.id) === String(updated.id || updated._id) ? { ...c, ...updated } : c));
    };
    messagingEvents.on('message:new', onLocalMessage);
    messagingEvents.on('channel:updated', onChannelUpdated);
    return () => {
      messagingEvents.off('message:new', onLocalMessage);
      messagingEvents.off('channel:updated', onChannelUpdated);
    };
  }, [user]);

  // ─── Render helpers ──────────────────────────────────────────────────────
  const renderSnippet = (item: any, disp: any) => {
    const raw = item.lastMessage?.content;
    if (!raw) {
      if (item.lastMessage?.type === 'media') return '📎 Media';
      return disp.isDM ? 'Direct message' : '';
    }
    return raw;
  };

  const styles = useMemo(() => StyleSheet.create({
    container:    { flex: 1, backgroundColor: BG },
    header:       { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10, backgroundColor: SURFACE, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: DIVIDER },
    greeting:     { fontSize: 12.5, color: MUTED, fontWeight: '500', letterSpacing: 0.2 },
    userName:     { fontSize: 26, fontWeight: '900', color: TEXT, marginTop: 2, letterSpacing: -0.5 },
    headerRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    iconBtn:      { width: 40, height: 40, borderRadius: 20, backgroundColor: SURF_ALT, justifyContent: 'center', alignItems: 'center' },
    headerIcons:  { flexDirection: 'row', gap: 8, alignItems: 'center', paddingBottom: 4 },
    // Tabs
    tabsWrap:     { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: SURFACE },
    tabsRow:      { flexDirection: 'row', backgroundColor: SURF_ALT, borderRadius: 14, padding: 4 },
    tab:          { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 11 },
    tabActive:    { backgroundColor: GREEN, shadowColor: GREEN, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 3 },
    tabText:      { fontSize: 13.5, fontWeight: '700', color: MUTED },
    tabTextActive:{ color: '#fff' },
    // Channel row
    row:          { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: DIVIDER, backgroundColor: SURFACE },
    avatar:       { width: 52, height: 52, borderRadius: 26 },
    groupAv:      { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    rowContent:   { flex: 1, marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 },
    rowTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rowName:      { fontSize: 15.5, fontWeight: '700', color: TEXT, flex: 1, marginRight: 4 },
    rowTime:      { fontSize: 11.5, color: MUTED },
    rowSnippet:   { fontSize: 13.5, color: MUTED, marginTop: 3 },
    badge:        { backgroundColor: GREEN, minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5, marginLeft: 8 },
    badgeText:    { color: '#fff', fontSize: 11, fontWeight: '800' },
    fab:          { position: 'absolute', right: 18, bottom: 30, width: 58, height: 58, borderRadius: 29, backgroundColor: GREEN, justifyContent: 'center', alignItems: 'center', shadowColor: GREEN, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
    sectionHeader:{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6 },
    sectionTitle: { fontSize: 11.5, fontWeight: '800', color: GREEN, letterSpacing: 1, textTransform: 'uppercase' },
    contactBtn:   { backgroundColor: GREEN, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, shadowColor: GREEN, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 3 },
  }), [isDark, isRTL]);

  return (
    <SafeAreaView style={styles.container}>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Hello 👋</Text>
            <Text style={styles.userName}>{user?.fullName?.split(' ')[0] || 'User'}</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => {}}>
              <Ionicons name="search" size={18} color={isDark ? '#E8EAED' : '#0D1117'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => {}}>
              <Ionicons name="ellipsis-vertical" size={18} color={isDark ? '#E8EAED' : '#0D1117'} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── TABS ────────────────────────────────────────────────────────── */}
      <View style={styles.tabsWrap}>
        <View style={styles.tabsRow} onLayout={e => setTabsWidth(e.nativeEvent.layout.width)}>
          {(['all', 'groups', 'contacts'] as const).map((tab, i) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => {
                setActiveTab(tab);
                Animated.timing(anim, { toValue: i, useNativeDriver: Platform.OS !== 'web', duration: 220 }).start();
              }}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'all' ? 'All' : tab === 'groups' ? 'Groups' : 'Contacts'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── CONTENT ─────────────────────────────────────────────────────── */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      ) : activeTab === 'contacts' ? (
        loadingUsers ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={GREEN} />
          </View>
        ) : (
          <FlatList
            data={contactsList}
            contentContainerStyle={{ paddingBottom: 120 }}
            keyExtractor={(i, idx) => String(i._id || i.id || i.fullName || idx)}
            renderItem={({ item, index }) => {
              const itemId = String(item._id || item.id || item.fullName);
              const shouldAnimate = !seenIds.current.has(itemId);
              if (shouldAnimate) seenIds.current.add(itemId);
              const entering = !shouldAnimate || reducedMotion ? undefined : FadeInDown.duration(250).delay(index * 40);
              const bg = avatarColor(item.fullName || '');
              return (
                <AnimatedReanimated.View entering={entering}>
                  <View style={[styles.row, { justifyContent: 'space-between' }]}>
                    <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
                      {item.avatarUrl ? (
                        <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
                      ) : (
                        <View style={[styles.groupAv, { backgroundColor: bg }]}>
                          <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff' }}>{String(item.fullName || 'U').charAt(0).toUpperCase()}</Text>
                        </View>
                      )}
                      <View style={styles.rowContent}>
                        <Text style={styles.rowName} numberOfLines={1}>{item.fullName}</Text>
                        <Text style={[styles.rowSnippet, { color: MUTED }]}>{item.profileType || ''}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => contactUser(item._id)}
                      style={styles.contactBtn}
                      disabled={creatingContactFor === item._id}
                    >
                      {creatingContactFor === item._id
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Contact</Text>}
                    </TouchableOpacity>
                  </View>
                </AnimatedReanimated.View>
              );
            }}
          />
        )
      ) : (
        <FlatList
          data={flattenedList}
          contentContainerStyle={{ paddingBottom: 120 }}
          keyExtractor={(i, idx) => i.isHeader ? `hdr-${i.title}-${idx}` : String(i._id || i.id || idx)}
          renderItem={({ item, index }) => {
            if (item.isHeader) {
              return (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{item.title}</Text>
                </View>
              );
            }

            const disp = getChannelDisplay(item);
            const unread: number = item.unreadCount || 0;
            const snippet = renderSnippet(item, disp);
            const bg = avatarColor(disp.name || '');

            let showOnlineDot = false;
            if (disp.isDM) {
              const other = findOtherParticipant(item);
              if (other) showOnlineDot = isOnline(other._id || other.id);
            }

            const itemId = String(item._id || item.id);
            const shouldAnimate = !seenIds.current.has(itemId);
            if (shouldAnimate) seenIds.current.add(itemId);
            const entering = !shouldAnimate || reducedMotion ? undefined : FadeInDown.duration(250).delay(index * 35);

            return (
              <AnimatedReanimated.View entering={entering}>
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => {
                    setChannels(prev => prev.map(c => String(c._id || c.id) === String(item._id || item.id) ? { ...c, unreadCount: 0 } : c));
                    navigation.navigate('CommunityChat', { initialChannel: item, channelId: String(item._id || item.id || '') });
                  }}
                  onLongPress={() => handleLongPressChannel(item)}
                  activeOpacity={0.7}
                >
                  {/* Avatar */}
                  <View style={{ position: 'relative' }}>
                    {disp.avatarUrl ? (
                      <Image
                        source={{ uri: disp.avatarUrl }}
                        style={disp.isDM ? styles.avatar : [styles.groupAv, { borderRadius: 16 }]}
                      />
                    ) : (
                      <View style={[disp.isDM ? styles.avatar : styles.groupAv, { backgroundColor: bg }]}>
                        <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff' }}>
                          {String(disp.name || '?').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    {showOnlineDot && (
                      <View style={{ position: 'absolute', right: 1, bottom: 1, width: 13, height: 13, borderRadius: 7, backgroundColor: '#2ECC71', borderWidth: 2, borderColor: SURFACE }} />
                    )}
                    {!!item.isPinned && (
                      <View style={{ position: 'absolute', right: -3, top: -3, width: 18, height: 18, borderRadius: 9, backgroundColor: GREEN, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: SURFACE }}>
                        <Ionicons name="pin" size={9} color="#fff" />
                      </View>
                    )}
                  </View>

                  {/* Content */}
                  <View style={styles.rowContent}>
                    <View style={styles.rowTop}>
                      <Text style={[styles.rowName, unread > 0 && { fontWeight: '900', color: TEXT }]} numberOfLines={1}>
                        {disp.name}
                      </Text>
                      <Text style={[styles.rowTime, unread > 0 && { color: GREEN, fontWeight: '700' }]}>
                        {formatTime(item.lastMessage?.createdAt)}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text
                        style={[styles.rowSnippet, unread > 0 && { fontWeight: '600', color: TEXT }]}
                        numberOfLines={1}
                      >
                        {snippet}
                      </Text>
                      {unread > 0 && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              </AnimatedReanimated.View>
            );
          }}
        />
      )}

      {/* ── FAB ─────────────────────────────────────────────────────────── */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateGroup')}>
        <Ionicons name="chatbubble-ellipses" size={26} color="#fff" />
      </TouchableOpacity>

    </SafeAreaView>
  );
}
