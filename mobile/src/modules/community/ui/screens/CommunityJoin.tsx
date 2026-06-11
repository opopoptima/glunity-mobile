import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
  ActivityIndicator, Platform, Dimensions, TextInput, Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Reanimated, { FadeInDown, FadeInRight, useReducedMotion } from 'react-native-reanimated';
import http from '../../../../core/network/http.client';
import messagingHttp from '../../../../core/network/messaging-http.client';
import { useTheme } from '../../../../shared/context/theme.context';
import { useLanguage } from '../../../../shared/context/language.context';
import { usePresence } from '../../../../shared/hooks/usePresence';

const { width: SCREEN_W } = Dimensions.get('window');

// Deterministic avatar color
function avatarColor(str: string) {
  const colors = ['#6C63FF','#FF6584','#43B89C','#F7B731','#E17055','#0984E3','#A29BFE','#00B894','#FDCB6E','#D63031'];
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// Channel icon + color based on name keywords
function channelVisual(name: string): { icon: string; color: string } {
  const n = (name || '').toLowerCase();
  if (n.includes('tip') || n.includes('gf'))        return { icon: 'bulb',           color: '#F7B731' };
  if (n.includes('review') || n.includes('rate'))   return { icon: 'star',           color: '#E17055' };
  if (n.includes('begin') || n.includes('start'))   return { icon: 'leaf',           color: '#43B89C' };
  if (n.includes('store') || n.includes('shop'))    return { icon: 'storefront',     color: '#0984E3' };
  if (n.includes('sport') || n.includes('fit'))     return { icon: 'barbell',        color: '#6C63FF' };
  if (n.includes('music') || n.includes('sound'))   return { icon: 'musical-note',   color: '#FF6584' };
  if (n.includes('game') || n.includes('play'))     return { icon: 'game-controller', color: '#A29BFE' };
  if (n.includes('health') || n.includes('med'))    return { icon: 'heart',          color: '#D63031' };
  return { icon: 'chatbubbles',                                                       color: '#27AE60' };
}

function isDMChannel(c: any) {
  if (!c) return false;
  if (c.type === 'group' || c.type === 'social') return false;
  if (c.name && typeof c.name === 'string' && !c.name.startsWith('DM-')) return false;
  if (c.name && typeof c.name === 'string' && c.name.startsWith('DM-')) return true;
  if (c.type && (c.type === 'direct' || c.type === 'dm' || c.type === 'DM')) return true;
  if (c.participants && Array.isArray(c.participants) && c.participants.length === 2) return true;
  return false;
}

export default function CommunityJoin({ navigation }: any) {
  const { theme: T, isDark } = useTheme();
  const { t, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const { isOnline } = usePresence();
  const reducedMotion = useReducedMotion();

  const [users, setUsers]                           = useState<any[]>([]);
  const [channels, setChannels]                     = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers]             = useState(true);
  const [loadingChannels, setLoadingChannels]       = useState(true);
  const [creatingChannelFor, setCreatingChannelFor] = useState<string | null>(null);
  const [joiningId, setJoiningId]                   = useState<string | null>(null);
  const [search, setSearch]                         = useState('');
  const [activeCategory, setActiveCategory]         = useState('All');

  const seenUserIds    = useRef<Set<string>>(new Set());
  const seenChannelIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      try { const r = await http.get('/users'); setUsers(r.data?.data || []); }
      catch (e) { setUsers([]); }
      finally { setLoadingUsers(false); }
    })();
    (async () => {
      try {
        const r = await http.get('/channels');
        setChannels((r.data?.data || []).filter((c: any) => !isDMChannel(c)));
      } catch { setChannels([]); }
      finally { setLoadingChannels(false); }
    })();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>(['All']);
    channels.forEach((c: any) => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set);
  }, [channels]);

  const filteredChannels = useMemo(() => {
    return channels.filter((c: any) => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        (c.name || '').toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q);
      const matchCat = activeCategory === 'All' || c.category === activeCategory;
      return matchSearch && matchCat;
    });
  }, [channels, search, activeCategory]);

  const filteredUsers = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter((u: any) =>
      (u.fullName || '').toLowerCase().includes(q) ||
      (u.profileType || '').toLowerCase().includes(q)
    );
  }, [users, search]);

  const contactUser = useCallback(async (targetUserId: string) => {
    setCreatingChannelFor(targetUserId);
    try {
      // Messaging-service: POST /channels/dm with { targetUserId }
      let ch: any = null;
      try {
        const res = await messagingHttp.post('/channels/dm', { targetUserId });
        ch = res.data?.data || res.data;
      } catch {
        // Fallback: core API
        try {
          const res2 = await http.post('/channels/direct', { userId: targetUserId });
          ch = res2.data?.data || res2.data;
        } catch { /* ignore */ }
      }
      if (ch) {
        navigation.navigate('CommunityChat', { initialChannel: ch, channelId: String(ch._id || ch.id) });
      }
    } catch (err) {
      console.error('[community] Failed to create DM', err);
    } finally {
      setCreatingChannelFor(null);
    }
  }, [navigation]);

  const joinChannel = useCallback(async (item: any) => {
    const id = item._id || item.id;
    setJoiningId(id);
    try {
      try { await http.post(`/channels/${id}/join`, {}); } catch { /* ignore */ }
      navigation.navigate('CommunityChat', { initialChannel: item, channelId: String(id) });
    } catch (err) { console.error('Failed to join channel', err); }
    finally { setJoiningId(null); }
  }, [navigation]);

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const BG      = isDark ? '#0D0F13' : '#F5F7FA';
  const SURFACE = isDark ? '#13161C' : '#FFFFFF';
  const SURF2   = isDark ? '#1C2028' : '#F0F2F5';
  const GREEN   = '#27AE60';
  const TEXT    = isDark ? '#E8EAED' : '#0D1117';
  const MUTED   = isDark ? 'rgba(200,210,220,0.45)' : 'rgba(0,0,0,0.4)';
  const DIVIDER = isDark ? 'rgba(255,255,255,0.055)' : 'rgba(0,0,0,0.055)';

  const onlineCount = useMemo(() => users.filter((u: any) => isOnline(u._id)).length, [users, isOnline]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <FlatList
        data={filteredChannels}
        keyExtractor={(c) => String(c._id || c.id)}
        contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={(
          <View>
            {/* ── HERO HEADER ─────────────────────────────────────────────── */}
            <View style={{
              paddingHorizontal: 20, paddingTop: 18, paddingBottom: 20,
              backgroundColor: SURFACE,
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: DIVIDER,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ fontSize: 12.5, color: MUTED, fontWeight: '600', letterSpacing: 0.2 }}>
                    {onlineCount} online
                  </Text>
                  <Text style={{ fontSize: 28, fontWeight: '900', color: TEXT, letterSpacing: -0.6, marginTop: 2 }}>
                    Community
                  </Text>
                  <Text style={{ fontSize: 13.5, color: MUTED, marginTop: 3, fontWeight: '500' }}>
                    Discover people & spaces
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate('CommunityChat')}
                  style={{
                    paddingHorizontal: 16, paddingVertical: 9,
                    borderRadius: 20, borderWidth: 1.5,
                    borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
                  }}
                >
                  <Text style={{ color: MUTED, fontSize: 14, fontWeight: '600' }}>Skip</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── SEARCH BAR ─────────────────────────────────────────────── */}
            <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 }}>
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: SURFACE,
                borderRadius: 16, paddingHorizontal: 14, paddingVertical: 11,
                borderWidth: StyleSheet.hairlineWidth, borderColor: DIVIDER,
              }}>
                <Ionicons name="search" size={17} color={MUTED} style={{ marginRight: 9 }} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search people or channels..."
                  placeholderTextColor={MUTED}
                  style={{ flex: 1, fontSize: 14.5, color: TEXT }}
                />
                {!!search && (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <Ionicons name="close-circle" size={18} color={MUTED} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* ── PEOPLE SECTION ─────────────────────────────────────────── */}
            <Text style={{
              fontSize: 11.5, fontWeight: '800', color: GREEN, letterSpacing: 0.9,
              textTransform: 'uppercase', marginTop: 18, marginBottom: 10, paddingHorizontal: 16,
            }}>
              People
            </Text>

            {loadingUsers ? (
              <ActivityIndicator color={GREEN} style={{ marginVertical: 20 }} />
            ) : (
              <FlatList
                horizontal
                data={filteredUsers}
                keyExtractor={(i) => String(i._id)}
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={136}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4 }}
                renderItem={({ item, index }) => {
                  const uid = String(item._id);
                  const isNew = !seenUserIds.current.has(uid);
                  if (isNew) seenUserIds.current.add(uid);
                  const name = item.fullName || 'User';
                  const bg = avatarColor(name);
                  const online = isOnline(item._id);
                  const entering = !isNew || reducedMotion ? undefined : FadeInRight.duration(300).delay(index * 50);

                  return (
                    <Reanimated.View entering={entering}>
                      <View style={{
                        width: 120, marginRight: 12,
                        backgroundColor: SURFACE,
                        borderRadius: 18,
                        padding: 14,
                        alignItems: 'center',
                        borderWidth: StyleSheet.hairlineWidth,
                        borderColor: DIVIDER,
                      }}>
                        {/* Avatar */}
                        <View style={{ position: 'relative' }}>
                          <View style={{
                            width: 60, height: 60, borderRadius: 30,
                            backgroundColor: bg, overflow: 'hidden',
                            justifyContent: 'center', alignItems: 'center',
                            borderWidth: 2.5, borderColor: online ? GREEN : 'transparent',
                          }}>
                            {item.avatarUrl
                              ? <Image source={{ uri: item.avatarUrl }} style={{ width: 56, height: 56, borderRadius: 28 }} />
                              : <Text style={{ fontSize: 22, fontWeight: '900', color: '#fff' }}>{name.charAt(0).toUpperCase()}</Text>}
                          </View>
                          <View style={{
                            position: 'absolute', right: 1, bottom: 1,
                            width: 14, height: 14, borderRadius: 7,
                            backgroundColor: online ? '#2ECC71' : (isDark ? '#3A3F4A' : '#C8CDD5'),
                            borderWidth: 2, borderColor: SURFACE,
                          }} />
                        </View>

                        <Text style={{ fontSize: 13, fontWeight: '700', color: TEXT, marginTop: 9, textAlign: 'center' }} numberOfLines={1}>
                          {name.split(' ')[0]}
                        </Text>
                        <Text style={{ fontSize: 11, color: MUTED, marginTop: 2, textAlign: 'center' }} numberOfLines={1}>
                          {item.profileType || ''}
                        </Text>

                        <TouchableOpacity
                          onPress={() => contactUser(item._id)}
                          disabled={creatingChannelFor === item._id}
                          style={{
                            marginTop: 10, backgroundColor: GREEN,
                            paddingVertical: 7, paddingHorizontal: 14,
                            borderRadius: 12, width: '100%', alignItems: 'center',
                          }}
                        >
                          {creatingChannelFor === item._id
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12.5 }}>Message</Text>}
                        </TouchableOpacity>
                      </View>
                    </Reanimated.View>
                  );
                }}
              />
            )}

            {/* ── CHANNELS SECTION ───────────────────────────────────────── */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 22, marginBottom: 10 }}>
              <Text style={{ fontSize: 11.5, fontWeight: '800', color: GREEN, letterSpacing: 0.9, textTransform: 'uppercase' }}>
                Channels
              </Text>
              <Text style={{ fontSize: 12.5, color: MUTED }}>{filteredChannels.length} spaces</Text>
            </View>

            {/* Categories */}
            {categories.length > 1 && (
              <FlatList
                horizontal
                data={categories}
                keyExtractor={(c) => c}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10, gap: 8 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => setActiveCategory(item)}
                    style={{
                      paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                      backgroundColor: activeCategory === item ? GREEN : SURFACE,
                      borderWidth: 1,
                      borderColor: activeCategory === item ? GREEN : DIVIDER,
                    }}
                  >
                    <Text style={{ color: activeCategory === item ? '#fff' : MUTED, fontWeight: '700', fontSize: 13 }}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        )}

        ListEmptyComponent={() => loadingChannels
          ? <ActivityIndicator color={GREEN} style={{ margin: 32 }} />
          : (
            <View style={{ alignItems: 'center', paddingTop: 40, gap: 10 }}>
              <Ionicons name="search-outline" size={48} color={MUTED} />
              <Text style={{ color: MUTED, fontSize: 15, fontWeight: '600' }}>No channels found</Text>
              {!!search && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Text style={{ color: GREEN, fontWeight: '700', marginTop: 4 }}>Clear search</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        }

        renderItem={({ item, index }) => {
          const id = String(item._id || item.id);
          const isNew = !seenChannelIds.current.has(id);
          if (isNew) seenChannelIds.current.add(id);
          const entering = !isNew || reducedMotion ? undefined : FadeInDown.duration(280).delay(index * 40);

          const name = item.name || item.displayName || 'Channel';
          const visual = channelVisual(name);
          const desc = item.description || 'Tap to explore this space.';
          const memberCount = item.participantCount || (item.participants?.length) || '?';
          const isJoining = joiningId === id;

          return (
            <Reanimated.View entering={entering} style={{ paddingHorizontal: 16, marginBottom: 10 }}>
              <View style={{
                backgroundColor: SURFACE,
                borderRadius: 18,
                padding: 14,
                flexDirection: isRTL ? 'row-reverse' : 'row',
                alignItems: 'center',
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: DIVIDER,
              }}>
                {/* Icon */}
                <View style={{
                  width: 52, height: 52, borderRadius: 16,
                  backgroundColor: visual.color + '22',
                  justifyContent: 'center', alignItems: 'center',
                  marginRight: isRTL ? 0 : 14,
                  marginLeft: isRTL ? 14 : 0,
                }}>
                  <Ionicons name={visual.icon as any} size={24} color={visual.color} />
                </View>

                {/* Content */}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15.5, fontWeight: '800', color: TEXT }} numberOfLines={1}>
                    {name}
                  </Text>
                  <Text style={{ fontSize: 13, color: MUTED, marginTop: 3 }} numberOfLines={1}>
                    {desc}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 7, gap: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="people" size={13} color={MUTED} />
                      <Text style={{ fontSize: 12, color: MUTED, fontWeight: '600' }}>{memberCount}</Text>
                    </View>
                    {item.isPrivate ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="lock-closed" size={12} color={MUTED} />
                        <Text style={{ fontSize: 12, color: MUTED }}>Private</Text>
                      </View>
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="globe" size={12} color={GREEN} />
                        <Text style={{ fontSize: 12, color: GREEN, fontWeight: '600' }}>Public</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Join button */}
                <TouchableOpacity
                  onPress={() => joinChannel(item)}
                  disabled={isJoining}
                  style={{
                    paddingHorizontal: 16, paddingVertical: 9,
                    borderRadius: 14,
                    backgroundColor: GREEN,
                    marginLeft: isRTL ? 0 : 10,
                    marginRight: isRTL ? 10 : 0,
                    minWidth: 64, alignItems: 'center',
                    shadowColor: GREEN,
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.35, shadowRadius: 8, elevation: 3,
                  }}
                >
                  {isJoining
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>Join</Text>}
                </TouchableOpacity>
              </View>
            </Reanimated.View>
          );
        }}
      />
    </SafeAreaView>
  );
}
