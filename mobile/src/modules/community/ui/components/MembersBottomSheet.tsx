import React, { useRef, useEffect, useMemo } from 'react';
import {
  View, Text, Modal, Pressable, Animated, PanResponder,
  Dimensions, TouchableOpacity, Image, FlatList,
  ActivityIndicator, StyleSheet, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Deterministic avatar color
function avatarColor(str: string) {
  const colors = ['#6C63FF','#FF6584','#43B89C','#F7B731','#E17055','#0984E3','#A29BFE','#00B894','#FDCB6E','#D63031'];
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

interface MembersBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  channel: any;
  members: any[];
  membersLoading: boolean;
  isAdmin: boolean;
  user: any;
  allUsers: any[];
  showAddList: boolean;
  setShowAddList: (val: boolean) => void;
  selectedToAdd: string[];
  toggleSelectToAdd: (id: string) => void;
  addMembers: () => void;
  adding: boolean;
  removeMember: (id: string) => void;
  openEditSheet: () => void;
  copyChannelLink: () => void;
  fetchMembers: () => void;
  theme: any;
  isRTL: boolean;
  t: (key: string) => string;
  isDark: boolean;
  BlurView: any;
}

export function MembersBottomSheet({
  visible, onClose, channel, members, membersLoading,
  isAdmin, user, allUsers, showAddList, setShowAddList,
  selectedToAdd, toggleSelectToAdd, addMembers, adding,
  removeMember, openEditSheet, copyChannelLink, fetchMembers,
  theme: T, isRTL, t, isDark, BlurView,
}: MembersBottomSheetProps) {
  const SHEET_HEIGHT = Dimensions.get('window').height * 0.82;
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const pan = useRef(new Animated.Value(0)).current;

  // ── Detect DM vs Group ───────────────────────────────────────────────────
  const isDM = useMemo(() => {
    if (!channel) return false;
    if (channel.type === 'group' || channel.type === 'social') return false;
    if (channel.name && typeof channel.name === 'string' && !channel.name.startsWith('DM-')) return false;
    if (channel.type === 'direct' || channel.type === 'dm' || channel.type === 'DM') return true;
    if (typeof channel.name === 'string' && channel.name.startsWith('DM-')) return true;
    const parts = channel.participants || channel.members || [];
    if (Array.isArray(parts) && parts.length === 2) return true;
    return false;
  }, [channel]);

  // For DMs: find the other person from members list
  const dmPartner = useMemo(() => {
    if (!isDM || !user || !members || members.length === 0) return null;
    return members.find((m: any) => String(m._id) !== String(user._id)) || null;
  }, [isDM, members, user]);

  // ── Display info ─────────────────────────────────────────────────────────
  const displayName = useMemo(() => {
    if (isDM && dmPartner) return dmPartner.fullName || dmPartner.name || 'Direct Message';
    return channel?.name && !channel.name.startsWith('DM-') ? channel.name : (channel?.displayName || t('Group'));
  }, [isDM, dmPartner, channel]);

  const displayAvatar = useMemo(() => {
    if (isDM && dmPartner) return dmPartner.avatarUrl || null;
    return channel?.avatarUrl || channel?.icon || null;
  }, [isDM, dmPartner, channel]);

  // ── Animation ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      pan.setValue(0);
      Animated.spring(sheetAnim, { toValue: 1, useNativeDriver: true, damping: 22, stiffness: 220 }).start();
      fetchMembers();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(sheetAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => onClose());
  };

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
    onPanResponderMove: (_, g) => { if (g.dy > 0) pan.setValue(g.dy); },
    onPanResponderRelease: (_, g) => {
      if (g.dy > 100) handleClose();
      else Animated.spring(pan, { toValue: 0, useNativeDriver: true }).start();
    },
  })).current;

  // ── Theme shortcuts ──────────────────────────────────────────────────────
  const GREEN   = '#27AE60';
  const SURFACE = isDark ? '#13161C' : '#FFFFFF';
  const SURF2   = isDark ? '#1C2028' : '#F4F6F8';
  const TEXT    = isDark ? '#E8EAED' : '#0D1117';
  const MUTED   = isDark ? 'rgba(200,210,220,0.45)' : 'rgba(0,0,0,0.4)';
  const DIVIDER = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const DANGER  = '#E74C3C';

  const adminCount = (members || []).filter((m: any) =>
    (m.role || '').toLowerCase().includes('admin') || (m.role || '').toLowerCase() === 'owner'
  ).length;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      {/* Backdrop */}
      {BlurView ? (
        <Pressable onPress={handleClose} style={StyleSheet.absoluteFillObject}>
          <BlurView intensity={55} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
        </Pressable>
      ) : (
        <Pressable
          onPress={handleClose}
          style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.48)' }]}
        />
      )}

      {/* Sheet */}
      <Animated.View
        {...panResponder.panHandlers}
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          height: SHEET_HEIGHT,
          backgroundColor: SURFACE,
          borderTopLeftRadius: 28, borderTopRightRadius: 28,
          paddingHorizontal: 16,
          paddingBottom: 24,
          transform: [{
            translateY: Animated.add(
              sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [SHEET_HEIGHT, 0] }),
              pan,
            ),
          }],
        }}
      >
        {/* Drag handle */}
        <View style={{ alignItems: 'center', paddingTop: 12, marginBottom: 4 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: DIVIDER }} />
        </View>

        {/* ── HEADER ────────────────────────────────────────────────────────── */}
        <View style={{ alignItems: 'center', paddingVertical: 16 }}>
          {/* Avatar */}
          <View style={{
            width: 86, height: 86,
            borderRadius: isDM ? 43 : 22,
            overflow: 'hidden',
            backgroundColor: avatarColor(displayName),
            justifyContent: 'center', alignItems: 'center',
            shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12, elevation: 6,
          }}>
            {displayAvatar ? (
              <Image source={{ uri: displayAvatar }} style={{ width: 86, height: 86 }} />
            ) : (
              <Text style={{ fontSize: 36, fontWeight: '900', color: '#fff' }}>
                {String(displayName).charAt(0).toUpperCase()}
              </Text>
            )}
          </View>

          <Text style={{ fontSize: 19, fontWeight: '800', color: TEXT, marginTop: 10, textAlign: 'center' }}>
            {displayName}
          </Text>

          {channel?.description ? (
            <Text style={{ color: MUTED, textAlign: 'center', marginTop: 5, fontSize: 13.5, paddingHorizontal: 24 }}>
              {channel.description}
            </Text>
          ) : null}

          <Text style={{ color: MUTED, marginTop: 6, fontSize: 13 }}>
            {members.length} {members.length === 1 ? t('member') : t('members')}
          </Text>
        </View>

        {/* ── QUICK ACTIONS (groups only) ───────────────────────────────────── */}
        {!isDM && (
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8, marginBottom: 16 }}>
            {isAdmin && (
              <TouchableOpacity
                onPress={() => setShowAddList(true)}
                style={[styles.actionBtn, { backgroundColor: SURF2, flex: 1 }]}
              >
                <Ionicons name="person-add" size={20} color={GREEN} />
                <Text style={[styles.actionLabel, { color: TEXT }]}>{t('Add')}</Text>
              </TouchableOpacity>
            )}

            {isAdmin && (
              <TouchableOpacity
                onPress={() => { handleClose(); openEditSheet(); }}
                style={[styles.actionBtn, { backgroundColor: SURF2, flex: 1 }]}
              >
                <Ionicons name="create" size={20} color={GREEN} />
                <Text style={[styles.actionLabel, { color: TEXT }]}>{t('Edit')}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={copyChannelLink}
              style={[styles.actionBtn, { backgroundColor: SURF2, flex: 1 }]}
            >
              <Ionicons name="share-social" size={20} color={GREEN} />
              <Text style={[styles.actionLabel, { color: TEXT }]}>{t('Share')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── STATS ROW (groups only) ───────────────────────────────────────── */}
        {!isDM && (
          <View style={{
            flexDirection: 'row', backgroundColor: SURF2,
            borderRadius: 14, padding: 12, marginBottom: 14, gap: 12,
          }}>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: GREEN }}>{members.length}</Text>
              <Text style={{ fontSize: 11.5, color: MUTED, marginTop: 2, fontWeight: '600' }}>{t('Members')}</Text>
            </View>
            <View style={{ width: StyleSheet.hairlineWidth, backgroundColor: DIVIDER }} />
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: GREEN }}>{adminCount}</Text>
              <Text style={{ fontSize: 11.5, color: MUTED, marginTop: 2, fontWeight: '600' }}>{t('Admins')}</Text>
            </View>
          </View>
        )}

        {/* ── SECTION LABEL ─────────────────────────────────────────────────── */}
        <Text style={{ fontSize: 11.5, fontWeight: '800', color: GREEN, letterSpacing: 0.9, textTransform: 'uppercase', marginBottom: 8 }}>
          {isDM ? t('Participants') : t('Members')}
        </Text>

        {/* ── MEMBER LIST ───────────────────────────────────────────────────── */}
        {membersLoading ? (
          <ActivityIndicator color={GREEN} style={{ marginVertical: 24 }} />
        ) : members && members.length > 0 ? (
          <FlatList
            data={members}
            keyExtractor={(i, idx) => String(i._id || i.id || idx)}
            style={{ flex: 1 }}
            ItemSeparatorComponent={() => <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: DIVIDER }} />}
            renderItem={({ item }) => {
              const isMe = String(item._id || item.id) === String(user?._id);
              const name = item.fullName || item.name || item.displayName || String(item._id || item.id);
              const bg = avatarColor(name);
              const role = (item.role || 'member').toLowerCase();
              const isOwnerOrAdmin = role === 'owner' || role === 'admin';

              return (
                <View style={{
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  paddingVertical: 11,
                }}>
                  {/* Avatar */}
                  <View style={{
                    width: 46, height: 46,
                    borderRadius: 23,
                    backgroundColor: bg,
                    overflow: 'hidden',
                    justifyContent: 'center', alignItems: 'center',
                    marginRight: isRTL ? 0 : 12,
                    marginLeft: isRTL ? 12 : 0,
                  }}>
                    {item.avatarUrl ? (
                      <Image source={{ uri: item.avatarUrl }} style={{ width: 46, height: 46 }} />
                    ) : (
                      <Text style={{ fontSize: 18, fontWeight: '800', color: '#fff' }}>
                        {String(name).charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>

                  {/* Info */}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 14.5, fontWeight: '700', color: TEXT }} numberOfLines={1}>
                        {name}
                      </Text>
                      {isMe && (
                        <View style={{ backgroundColor: GREEN, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
                          <Text style={{ fontSize: 10, color: '#fff', fontWeight: '700' }}>{t('You')}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontSize: 12, color: isOwnerOrAdmin ? GREEN : MUTED, fontWeight: isOwnerOrAdmin ? '700' : '400', marginTop: 2 }}>
                      {role === 'owner' ? '👑 ' : role === 'admin' ? '🛡 ' : ''}{role.charAt(0).toUpperCase() + role.slice(1)}
                    </Text>
                  </View>

                  {/* Remove button (admins only, not self) */}
                  {isAdmin && !isMe && !isDM && (
                    <TouchableOpacity
                      onPress={() => {
                        const confirmRemove = () => removeMember(item._id || item.id);
                        if (Platform.OS === 'web') {
                          if (window.confirm(`${t('Remove')} ${name}?`)) {
                            confirmRemove();
                          }
                        } else {
                          Alert.alert(
                            t('Remove member'),
                            `${t('Remove')} ${name}?`,
                            [
                              { text: t('Cancel'), style: 'cancel' },
                              { text: t('Remove'), style: 'destructive', onPress: confirmRemove },
                            ]
                          );
                        }
                      }}
                      style={{ padding: 10 }}
                    >
                      <Ionicons name="remove-circle-outline" size={22} color={DANGER} />
                    </TouchableOpacity>
                  )}
                </View>
              );
            }}
          />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
            <Ionicons name="people-outline" size={48} color={MUTED} />
            <Text style={{ color: MUTED, fontSize: 14 }}>{t('No members found')}</Text>
            <TouchableOpacity
              onPress={fetchMembers}
              style={{ backgroundColor: GREEN, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 }}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>{t('Retry')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── ADD MEMBERS PANEL (groups / admin only) ───────────────────────── */}
        {!isDM && isAdmin && showAddList && (
          <View style={{ height: 230, marginTop: 8 }}>
            <FlatList
              data={(allUsers || []).filter(u =>
                !(members || []).some((m: any) => String(m._id || m.id) === String(u._id || u.id))
              )}
              keyExtractor={(i) => String(i._id || i.id)}
              style={{ flex: 1 }}
              renderItem={({ item }) => {
                const isSel = selectedToAdd.includes(String(item._id || item.id));
                const name = item.fullName || item.name || '';
                const bg = avatarColor(name);
                return (
                  <TouchableOpacity
                    onPress={() => toggleSelectToAdd(String(item._id || item.id))}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}
                  >
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: bg, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      {item.avatarUrl
                        ? <Image source={{ uri: item.avatarUrl }} style={{ width: 40, height: 40 }} />
                        : <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff' }}>{String(name).charAt(0).toUpperCase()}</Text>}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: TEXT, fontWeight: '700', fontSize: 14 }}>{name}</Text>
                      <Text style={{ color: MUTED, fontSize: 12 }}>{item.profileType || ''}</Text>
                    </View>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isSel ? GREEN : SURF2, justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name={isSel ? 'checkmark' : 'add'} size={17} color={isSel ? '#fff' : MUTED} />
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <TouchableOpacity
                onPress={() => setShowAddList(false)}
                style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: SURF2, alignItems: 'center' }}
              >
                <Text style={{ color: TEXT, fontWeight: '600' }}>{t('Cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={addMembers}
                style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: GREEN, alignItems: 'center' }}
                disabled={adding || selectedToAdd.length === 0}
              >
                {adding
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={{ color: '#fff', fontWeight: '700' }}>{t('Add')} {selectedToAdd.length > 0 ? `(${selectedToAdd.length})` : ''}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actionBtn: {
    paddingVertical: 12, paddingHorizontal: 8,
    borderRadius: 14, alignItems: 'center', gap: 6,
  },
  actionLabel: {
    fontSize: 12.5, fontWeight: '700',
  },
});
