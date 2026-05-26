import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppScaffold } from '../../../../shared/components/AppScaffold';
import { FilterPill } from '../components/FilterPill';
import { PlaceCard } from '../components/PlaceCard';
import { MapWebView, MapWebViewHandle } from '../components/MapWebView';
import { locationsApi } from '../../api/locations.api';
import type { LocationCategory, LocationFilters, MapLocation } from '../../domain/location.types';
import { useTheme } from '../../../../shared/context/theme.context';

interface MapScreenProps {
  userName?: string;
  userAvatarUri?: string | null;
  onPressNavHome?: () => void;
  onPressNavEvents?: () => void;
  onPressNavReels?: () => void;
  onPressNavProfile?: () => void;
  onPressProfilePhoto?: () => void;
}

const CATEGORIES: Array<{ key: LocationCategory | 'all'; label: string }> = [
  { key: 'all',        label: 'All' },
  { key: 'restaurant', label: 'Restaurants' },
  { key: 'bakery',     label: 'Bakeries' },
  { key: 'grocery',    label: 'Grocery' },
  { key: 'cafe',       label: 'Cafés' },
  { key: 'pharmacy',   label: 'Pharmacy' },
];

/**
 * Collaborative gluten-free map.
 *  - Top bar with avatar, name, search and notification bell
 *  - Floating Filter pill above the map
 *  - Leaflet WebView showing all GF locations
 *  - Bottom card: compact (no selection) → detailed when a pin is tapped
 */
export default function MapScreen({
  userName = 'Guest',
  userAvatarUri,
  onPressNavHome,
  onPressNavEvents,
  onPressNavReels,
  onPressNavProfile,
  onPressProfilePhoto,
}: MapScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme: T } = useTheme();
  const mapRef = useRef<MapWebViewHandle>(null);

  const [filters, setFilters]       = useState<LocationFilters>({ category: 'all' });
  const [showFilters, setShowFilters] = useState(false);
  const [items, setItems]           = useState<MapLocation[]>([]);
  const [selectedId, setSelected]   = useState<string | null>(null);
  const [isLoading, setLoading]     = useState(true);
  const [errorMsg, setError]        = useState<string | null>(null);

  const fetchLocations = useCallback(async (f: LocationFilters) => {
    setLoading(true);
    setError(null);
    try {
      const data = await locationsApi.list({
        category: f.category && f.category !== 'all' ? f.category : undefined,
        glutenFree: f.glutenFree,
        certified: f.certified,
        search: f.search,
        limit: 100,
      });
      setItems(data);
    } catch (err: any) {
      setItems([]);
      setError(err?.message || 'Could not load map locations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLocations(filters); }, [filters, fetchLocations]);

  const selected = useMemo(
    () => items.find((it) => it.id === selectedId) || null,
    [items, selectedId],
  );

  function applyFilter(next: Partial<LocationFilters>) {
    setFilters((prev) => ({ ...prev, ...next }));
    setShowFilters(false);
  }

  function onSelectFromMap(id: string) {
    setSelected(id);
    const loc = items.find((l) => l.id === id);
    if (loc) mapRef.current?.flyTo(loc.lng, loc.lat, 16);
  }

  function onContact() {
    if (selected?.phone) Linking.openURL(`tel:${selected.phone}`).catch(() => {});
  }

  const headerActions = (
    <View style={styles.headerRight}>
      <TouchableOpacity style={[styles.iconBtn, { backgroundColor: T.surfaceAlt }]}>
        <Feather name="search" size={18} color={T.text} />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.iconBtn, { backgroundColor: T.surfaceAlt }]}>
        <Feather name="bell" size={18} color={T.text} />
      </TouchableOpacity>
    </View>
  );

  return (
    <AppScaffold
      title="Events"
      activeTab="events"
      rightElement={headerActions}
      onPressHome={onPressNavHome}
      onPressEvents={onPressNavEvents}
      onPressCenter={() => {}}
      onPressReels={onPressNavReels}
      onPressProfile={onPressNavProfile}
      contentStyle={{ backgroundColor: T.bg }}
    >
      <View style={[styles.root, { backgroundColor: T.bg }]}>

      {/* ── Map + filter pill overlay ──────────────────────────────────── */}
      <View style={styles.mapWrap}>
        <MapWebView
          ref={mapRef}
          locations={items}
          onSelectLocation={onSelectFromMap}
          initialCenter={{ lng: 10.181667, lat: 36.806389 }}
          initialZoom={14}
        />

        <View style={styles.filterPillWrap}>
          <FilterPill onPress={() => setShowFilters(true)} />
        </View>

        {isLoading && (
          <View style={[styles.loadingBadge, { backgroundColor: T.surface }]}
          >
            <ActivityIndicator size="small" color={T.green} />
          </View>
        )}

        {!!errorMsg && !isLoading && (
          <View style={[styles.errorBadge, { backgroundColor: T.redLight }]}
          >
            <Text style={[styles.errorText, { color: T.red }]} numberOfLines={2}>{errorMsg}</Text>
          </View>
        )}
      </View>

      {/* ── Floating place card ────────────────────────────────────────── */}
      <View style={[styles.cardSlot, { bottom: 96 + Math.max(insets.bottom, 10) + 16 }]}>
        {selected ? (
          <PlaceCard
            location={selected}
            variant="detailed"
            distanceKm={5}
            etaMinutes={15}
            onContact={onContact}
          />
        ) : items[0] ? (
          <PlaceCard
            location={items[0]}
            variant="compact"
            distanceKm={1.2}
            onPress={() => setSelected(items[0].id)}
          />
        ) : null}
      </View>
      </View>
      {/* ── Filter sheet ───────────────────────────────────────────────── */}
      <Modal visible={showFilters} animationType="slide" transparent onRequestClose={() => setShowFilters(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowFilters(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: T.surface }]} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: T.text }]}>Filter places</Text>

            <Text style={[styles.sheetSubtitle, { color: T.textMuted }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {CATEGORIES.map((c) => {
                const isActive = (filters.category || 'all') === c.key;
                return (
                  <Pressable
                    key={c.key}
                    onPress={() => applyFilter({ category: c.key })}
                    style={[styles.chip, { backgroundColor: isActive ? T.green : T.surfaceAlt }]}
                  >
                    <Text style={[styles.chipText, { color: T.text }, isActive && styles.chipTextActive]}>{c.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={[styles.sheetSubtitle, { color: T.textMuted }]}>Status</Text>
            <View style={styles.toggleRow}>
              <Pressable
                onPress={() => applyFilter({ certified: !filters.certified ? true : undefined })}
                style={[styles.chip, { backgroundColor: filters.certified ? T.green : T.surfaceAlt }]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color={filters.certified ? T.white : T.green}
                />
                <Text style={[styles.chipText, { color: T.text }, filters.certified && styles.chipTextActive]}>Certified only</Text>
              </Pressable>
              <Pressable
                onPress={() => applyFilter({ glutenFree: !filters.glutenFree ? true : undefined })}
                style={[styles.chip, { backgroundColor: filters.glutenFree ? T.green : T.surfaceAlt }]}
              >
                <Text style={[styles.chipText, { color: T.text }, filters.glutenFree && styles.chipTextActive]}>Gluten-free only</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => { setFilters({ category: 'all' }); setShowFilters(false); }}
              style={styles.clearBtn}
            >
              <Text style={[styles.clearText, { color: T.green }]}>Clear filters</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </AppScaffold>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // ── header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarWrap: { width: 40, height: 40, position: 'relative' },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarFallback: { backgroundColor: '#D7D7D7', alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 16, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  avatarBadge: {
    position: 'absolute', right: -2, bottom: -2, width: 16, height: 16, borderRadius: 8,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  userName: { fontSize: 17, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },

  // ── map ───────────────────────────────────────────────────────────────────
  mapWrap: { flex: 1, position: 'relative', overflow: 'hidden', borderRadius: 0 },
  filterPillWrap: { position: 'absolute', top: 14, alignSelf: 'center' },
  loadingBadge: {
    position: 'absolute', top: 16, right: 16,
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  errorBadge: {
    position: 'absolute', top: 60, left: 16, right: 16,
    borderRadius: 12, padding: 12,
  },
  errorText: { fontSize: 12, fontFamily: 'Poppins_500Medium' },

  // ── bottom card slot ──────────────────────────────────────────────────────
  cardSlot: { position: 'absolute', left: 16, right: 16 },

  // ── filter sheet ──────────────────────────────────────────────────────────
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
    padding: 20, paddingBottom: 30,
  },
  sheetHandle: {
    alignSelf: 'center', width: 42, height: 4, borderRadius: 2,
    backgroundColor: '#D9D9D9', marginBottom: 14,
  },
  sheetTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', marginBottom: 14 },
  sheetSubtitle: { fontSize: 13, fontFamily: 'Poppins_500Medium', marginTop: 8, marginBottom: 8 },
  chipRow: { gap: 8, paddingVertical: 4, paddingRight: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
  },
  chipActive: {},
  chipText: { fontSize: 13, fontFamily: 'Poppins_500Medium' },
  chipTextActive: { color: '#FFFFFF' },
  toggleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  clearBtn: { marginTop: 18, alignItems: 'center', paddingVertical: 12 },
  clearText: { fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
});
