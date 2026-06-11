import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Image,
  FlatList, ScrollView, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import http from '../../../../core/network/http.client';
import messagingHttp from '../../../../core/network/messaging-http.client';
import { API_BASE_URL } from '../../../../core/config/api.config';
import { useTheme } from '../../../../shared/context/theme.context';
import { useLanguage } from '../../../../shared/context/language.context';
import { useAuth } from '../../../auth/state/auth.context';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// Deterministic avatar color
function avatarColor(str: string) {
  const colors = ['#6C63FF','#FF6584','#43B89C','#F7B731','#E17055','#0984E3','#A29BFE','#00B894','#FDCB6E','#D63031'];
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

const CORE_API_URL = API_BASE_URL;

export default function CreateGroupScreen({ navigation }: any) {
  const { theme: T, isDark } = useTheme();
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [users, setUsers]               = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch]             = useState('');
  const [selected, setSelected]         = useState<any[]>([]);
  const [groupName, setGroupName]       = useState('');
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading]       = useState(false);
  const [creating, setCreating]         = useState(false);
  const [nameFocused, setNameFocused]   = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const GREEN   = '#27AE60';
  const BG      = isDark ? '#0D0F13' : '#F5F7FA';
  const SURFACE = isDark ? '#13161C' : '#FFFFFF';
  const SURF2   = isDark ? '#1C2028' : '#F0F2F5';
  const TEXT    = isDark ? '#E8EAED' : '#0D1117';
  const MUTED   = isDark ? 'rgba(200,210,220,0.45)' : 'rgba(0,0,0,0.4)';
  const DIVIDER = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await http.get('/users');
        if (!mounted) return;
        setUsers((res.data?.data || []).filter((u: any) => String(u._id) !== String(user?._id)));
      } catch { setUsers([]); }
      finally { if (mounted) setLoadingUsers(false); }
    })();
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    if (!search) return users;
    const s = search.toLowerCase();
    return users.filter(u => (u.fullName || u.name || '').toLowerCase().includes(s));
  }, [users, search]);

  const toggleSelect = useCallback((u: any) => {
    const id = String(u._id || u.id);
    setSelected(prev =>
      prev.some(s => String(s._id || s.id) === id)
        ? prev.filter(p => String(p._id || p.id) !== id)
        : [...prev, u]
    );
  }, []);

  const removeSelected = useCallback((id: string) =>
    setSelected(prev => prev.filter(p => String(p._id || p.id) !== id)), []);

  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert(t('Permission Denied ❌'), t('You must allow photo library access to upload a cover photo.'));
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, allowsEditing: true, aspect: [1, 1],
      });
      const uri = res?.assets?.[0]?.uri || (res as any).uri;
      if (!uri) return;
      setLocalPhotoUri(uri);
      await uploadImage(uri);
    } catch { Alert.alert('Error', t('Failed to pick image')); }
  };

  const uploadImage = async (uri: string) => {
    setUploading(true);
    try {
      const filename = uri.split('/').pop() || 'group.jpg';
      const form = new FormData();
      if (Platform.OS === 'web') {
        const blobResp = await fetch(uri);
        const blob = await blobResp.blob();
        form.append('file', typeof File !== 'undefined' ? new File([blob], filename, { type: blob.type || 'image/jpeg' }) : blob as any);
      } else {
        form.append('file', { uri, name: filename, type: 'image/jpeg' } as any);
      }
      const uploadRes = await http.post('/uploads', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = uploadRes.data?.data?.url;
      if (!url) throw new Error('Invalid upload response');
      setUploadedPhotoUrl(url);
    } catch { Alert.alert('Error', t('Failed to upload image')); }
    finally { setUploading(false); }
  };

  const handleCreate = async () => {
    if (creating) return;
    if (selected.length === 0) {
      Alert.alert(t('Select Members'), t('Please select at least one member to create a group.'));
      return;
    }
    setCreating(true);
    const name = (groupName || selected.map(s => (s.fullName || s.name || '').split(' ')[0]).slice(0, 4).join(', ')).trim();
    const participantIds = selected.map(s => String(s._id || s.id));
    try {
      // Primary: create via messaging-service (owns participant tracking)
      const payload: any = {
        name,
        description: `Group created by ${user?.fullName || 'user'}`,
        participantIds,
      };
      if (uploadedPhotoUrl) { payload.avatarUrl = uploadedPhotoUrl; payload.icon = uploadedPhotoUrl; }

      let ch: any = null;
      try {
        const res = await messagingHttp.post('/channels', payload);
        ch = res.data?.data || res.data;
      } catch (msgErr) {
        // Fallback: try core API with 'participants' field name
        try {
          const res2 = await http.post('/channels', { ...payload, participants: participantIds });
          ch = res2.data?.data || res2.data;
        } catch (coreErr) {
          // Last resort: local-only channel so the user can still enter the chat
          ch = {
            id: `local-${Date.now()}`, _id: `local-${Date.now()}`,
            name,
            description: '',
            participants: selected.map(s => ({
              _id: s._id || s.id, userId: s._id || s.id,
              fullName: s.fullName || s.name, avatarUrl: s.avatarUrl || null, role: 'member',
            })),
            avatarUrl: uploadedPhotoUrl || null,
          };
        }
      }

      if (ch) {
        navigation.navigate('CommunityChat', { initialChannel: ch, channelId: String(ch._id || ch.id) });
      }
    } finally {
      setCreating(false);
    }
  };

  const avatarPreview = uploadedPhotoUrl || localPhotoUri;
  const groupAvatarBg = avatarColor(groupName || 'G');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={['top']}>
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <View style={{
        flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 14,
        backgroundColor: SURFACE,
        borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: DIVIDER,
      }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: SURF2, justifyContent: 'center', alignItems: 'center', marginRight: isRTL ? 0 : 12, marginLeft: isRTL ? 12 : 0 }}
        >
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={20} color={TEXT} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 19, fontWeight: '900', color: TEXT, letterSpacing: -0.4 }}>
            {t('Create Group')}
          </Text>
          <Text style={{ fontSize: 12.5, color: MUTED, marginTop: 1 }}>
            {selected.length > 0 ? `${selected.length} ${t('selected')}` : t('Select members to add')}
          </Text>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => String(i._id || i.id)}
        contentContainerStyle={{ paddingBottom: 110 + insets.bottom }}
        showsVerticalScrollIndicator={false}

        ListHeaderComponent={(
          <View style={{ paddingHorizontal: 16 }}>
            {/* ── GROUP INFO CARD ──────────────────────────────────────── */}
            <View style={{
              backgroundColor: SURFACE, borderRadius: 20, padding: 16,
              marginTop: 14, marginBottom: 14,
              borderWidth: StyleSheet.hairlineWidth, borderColor: DIVIDER,
            }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#27AE60', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 14 }}>
                Group Info
              </Text>

              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center' }}>
                {/* Avatar picker */}
                <TouchableOpacity onPress={pickImage} activeOpacity={0.82}>
                  <View style={{
                    width: 80, height: 80, borderRadius: 24,
                    backgroundColor: groupAvatarBg, overflow: 'hidden',
                    justifyContent: 'center', alignItems: 'center',
                    marginRight: isRTL ? 0 : 14, marginLeft: isRTL ? 14 : 0,
                  }}>
                    {uploading
                      ? <ActivityIndicator color="#fff" />
                      : avatarPreview
                        ? <Image source={{ uri: avatarPreview }} style={{ width: 80, height: 80 }} />
                        : <Text style={{ fontSize: 30, fontWeight: '900', color: '#fff' }}>
                            {(groupName || 'G').charAt(0).toUpperCase()}
                          </Text>
                    }
                  </View>
                  {/* Camera badge */}
                  <View style={{
                    position: 'absolute', right: isRTL ? 'auto' : 8, left: isRTL ? 8 : 'auto', bottom: -2,
                    width: 26, height: 26, borderRadius: 13,
                    backgroundColor: GREEN, justifyContent: 'center', alignItems: 'center',
                    borderWidth: 2, borderColor: SURFACE,
                  }}>
                    <Ionicons name="camera" size={13} color="#fff" />
                  </View>
                </TouchableOpacity>

                {/* Name input */}
                <View style={{ flex: 1 }}>
                  <View style={{
                    backgroundColor: SURF2, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13,
                    borderWidth: 1.5, borderColor: nameFocused ? GREEN : 'transparent',
                  }}>
                    <TextInput
                      value={groupName}
                      onChangeText={setGroupName}
                      onFocus={() => setNameFocused(true)}
                      onBlur={() => setNameFocused(false)}
                      placeholder={t('Group name (optional)')}
                      placeholderTextColor={MUTED}
                      style={{ fontSize: 15, color: TEXT, fontWeight: '600' }}
                      returnKeyType="done"
                      maxLength={80}
                    />
                  </View>
                  <Text style={{ fontSize: 11, color: MUTED, marginTop: 4, marginLeft: 4 }}>
                    {groupName.length}/80 · {t('Auto-named if empty')}
                  </Text>
                </View>
              </View>
            </View>

            {/* ── SELECTED CHIPS ───────────────────────────────────────── */}
            {selected.length > 0 && (
              <View style={{ marginBottom: 10 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', paddingBottom: 4 }}>
                  {selected.map((s) => {
                    const name = s.fullName || s.name || 'U';
                    const bg = avatarColor(name);
                    return (
                      <View key={String(s._id || s.id)} style={{
                        flexDirection: 'row', alignItems: 'center',
                        backgroundColor: SURFACE, borderRadius: 24, paddingLeft: 4, paddingRight: 10,
                        paddingVertical: 4, marginRight: 8,
                        borderWidth: 1, borderColor: GREEN + '40',
                      }}>
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: bg, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginRight: 7 }}>
                          {s.avatarUrl
                            ? <Image source={{ uri: s.avatarUrl }} style={{ width: 32, height: 32 }} />
                            : <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff' }}>{name.charAt(0).toUpperCase()}</Text>}
                        </View>
                        <Text style={{ color: TEXT, fontWeight: '700', fontSize: 13, marginRight: 6 }}>
                          {name.split(' ')[0]}
                        </Text>
                        <TouchableOpacity onPress={() => removeSelected(String(s._id || s.id))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <Ionicons name="close-circle" size={17} color={MUTED} />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* ── SEARCH BAR ───────────────────────────────────────────── */}
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: SURFACE, borderRadius: 14,
              paddingHorizontal: 13, paddingVertical: 11,
              borderWidth: 1.5, borderColor: searchFocused ? GREEN : DIVIDER,
              marginBottom: 12,
            }}>
              <Ionicons name="search" size={16} color={MUTED} style={{ marginRight: 9 }} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder={t('Search users...')}
                placeholderTextColor={MUTED}
                style={{ flex: 1, fontSize: 14.5, color: TEXT }}
              />
              {!!search && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={18} color={MUTED} />
                </TouchableOpacity>
              )}
            </View>

            <Text style={{ fontSize: 11, fontWeight: '800', color: GREEN, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
              {t('Members')} · {filtered.length}
            </Text>
          </View>
        )}

        ListEmptyComponent={() => loadingUsers
          ? <ActivityIndicator color={GREEN} style={{ marginTop: 32 }} />
          : <View style={{ alignItems: 'center', marginTop: 32, gap: 8 }}>
              <Ionicons name="people-outline" size={44} color={MUTED} />
              <Text style={{ color: MUTED, fontSize: 14 }}>{t('No users found')}</Text>
            </View>
        }

        renderItem={({ item }) => {
          const isSel = selected.some(s => String(s._id || s.id) === String(item._id || item.id));
          const name = item.fullName || item.name || 'User';
          const bg = avatarColor(name);

          return (
            <TouchableOpacity
              onPress={() => toggleSelect(item)}
              activeOpacity={0.75}
              style={{
                flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center',
                backgroundColor: isSel ? (isDark ? 'rgba(39,174,96,0.08)' : 'rgba(39,174,96,0.06)') : SURFACE,
                marginHorizontal: 16, marginBottom: 8,
                borderRadius: 16, padding: 12,
                borderWidth: 1.5,
                borderColor: isSel ? GREEN + '50' : DIVIDER,
              }}
            >
              {/* Avatar */}
              <View style={{
                width: 50, height: 50, borderRadius: 16, backgroundColor: bg,
                overflow: 'hidden', justifyContent: 'center', alignItems: 'center',
                marginRight: isRTL ? 0 : 13, marginLeft: isRTL ? 13 : 0,
              }}>
                {item.avatarUrl
                  ? <Image source={{ uri: item.avatarUrl }} style={{ width: 50, height: 50 }} />
                  : <Text style={{ fontSize: 20, fontWeight: '900', color: '#fff' }}>{name.charAt(0).toUpperCase()}</Text>}
              </View>

              {/* Info */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: TEXT }} numberOfLines={1}>{name}</Text>
                <Text style={{ fontSize: 12, color: MUTED, marginTop: 2 }} numberOfLines={1}>{item.profileType || item.email || ''}</Text>
              </View>

              {/* Checkbox */}
              <View style={{
                width: 30, height: 30, borderRadius: 15,
                backgroundColor: isSel ? GREEN : SURF2,
                justifyContent: 'center', alignItems: 'center',
                borderWidth: isSel ? 0 : 1.5, borderColor: DIVIDER,
              }}>
                {isSel && <Ionicons name="checkmark" size={17} color="#fff" />}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* ── FLOATING CREATE BUTTON ──────────────────────────────────────── */}
      <View style={{
        position: 'absolute', left: 16, right: 16, bottom: 16 + insets.bottom,
      }}>
        <TouchableOpacity
          onPress={handleCreate}
          disabled={creating || selected.length === 0}
          style={{
            backgroundColor: selected.length === 0 ? (isDark ? 'rgba(39,174,96,0.3)' : 'rgba(39,174,96,0.25)') : GREEN,
            borderRadius: 18, paddingVertical: 16, alignItems: 'center',
            flexDirection: 'row', justifyContent: 'center',
            shadowColor: GREEN,
            shadowOffset: { width: 0, height: selected.length > 0 ? 6 : 0 },
            shadowOpacity: selected.length > 0 ? 0.4 : 0,
            shadowRadius: 12, elevation: selected.length > 0 ? 6 : 0,
          }}
        >
          {creating
            ? <ActivityIndicator color="#fff" />
            : <>
                <Ionicons name="people" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
                  {t('Create Group')}{selected.length > 0 ? ` (${selected.length})` : ''}
                </Text>
              </>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
