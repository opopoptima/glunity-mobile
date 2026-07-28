import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../shared/context/theme.context';
import { Colors, Font, Radius, Spacing } from '../../../../shared/utils/theme';
import { UserFilter } from '../../hooks/useAdminUsers';
import { useLanguage } from '../../../../shared/context/language.context';

interface UserFilterBarProps {
  filter: UserFilter;
  setFilter: (f: UserFilter) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSortPress?: () => void;
  onFilterPress?: () => void;
  activeSortLabel?: string;
}

export function UserFilterBar({
  filter,
  setFilter,
  searchQuery,
  setSearchQuery,
  onSortPress,
  onFilterPress,
  activeSortLabel = 'Plus récent',
}: UserFilterBarProps) {
  const { theme: T, isDark } = useTheme();
  const { t } = useLanguage();
  const primaryGreen = Colors.green || '#8BC34A';

  const tabs: { id: UserFilter; label: string; icon?: string; isDanger?: boolean }[] = [
    { id: 'all', label: 'Tous' },
    { id: 'celiac', label: 'Patients' },
    { id: 'pro_commerce', label: 'Vendeurs' },
    { id: 'pro_health', label: 'Santé' },
    { id: 'admin', label: 'Admins' },
    { id: 'suspended', label: 'Suspendus', isDanger: true },
  ];

  const handleFilterClick = () => {
    if (onFilterPress) {
      onFilterPress();
    } else {
      Alert.alert('Filtres Avancés', 'Filtrer par : Date d\'inscription, Niveau de signalement, Nombre d\'avertissements, Type de compte.');
    }
  };

  const handleSortClick = () => {
    if (onSortPress) {
      onSortPress();
    } else {
      Alert.alert('Tri', 'Trier par : Date d\'inscription (Récent/Ancien), Activité (Récent/Ancien), Nombre de posts.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Search & Actions Bar */}
      <View style={styles.searchRow}>
        <View style={[styles.searchBox, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
          <Feather name="search" size={16} color={T.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: T.text }]}
            placeholder={t('users.search', 'Rechercher par nom, email...')}
            placeholderTextColor={T.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
              <Feather name="x" size={14} color={T.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter button */}
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}
          onPress={handleFilterClick}
          activeOpacity={0.7}
        >
          <Feather name="sliders" size={16} color={T.textSub} />
        </TouchableOpacity>

        {/* Sort button */}
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}
          onPress={handleSortClick}
          activeOpacity={0.7}
        >
          <Feather name="bar-chart-2" size={16} color={T.textSub} />
        </TouchableOpacity>
      </View>

      {/* Modern Filter Chips Scroll */}
      <View style={styles.tabBarContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {tabs.map((tab) => {
            const isActive = filter === tab.id;
            
            // Standard Linear style chips
            let chipBg = isDark ? '#1C1C1E' : '#FFFFFF';
            let chipBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
            let textColor = T.textSub;

            if (isActive) {
              if (tab.isDanger) {
                chipBg = 'rgba(239, 68, 68, 0.12)';
                chipBorder = 'rgba(239, 68, 68, 0.4)';
                textColor = '#EF4444';
              } else {
                chipBg = isDark ? 'rgba(163, 214, 92, 0.15)' : 'rgba(109, 174, 63, 0.08)';
                chipBorder = isDark ? 'rgba(163, 214, 92, 0.5)' : 'rgba(109, 174, 63, 0.45)';
                textColor = primaryGreen;
              }
            } else if (tab.isDanger) {
              textColor = '#EF4444';
            }

            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tabPill,
                  {
                    backgroundColor: chipBg,
                    borderColor: chipBorder,
                  },
                ]}
                onPress={() => setFilter(tab.id)}
                activeOpacity={0.8}
              >
                {tab.isDanger && <View style={[styles.dangerDot, { backgroundColor: '#EF4444' }]} />}
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: textColor,
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: Spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    gap: 8,
    marginBottom: Spacing.sm,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 42,
    borderRadius: Radius.md, // 10px rounded card style
    borderWidth: 1,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontFamily: Font.family,
    fontSize: 13.5,
    height: '100%',
    padding: 0,
  },
  actionBtn: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  tabBarContainer: {
    marginBottom: Spacing.xs,
  },
  tabsScroll: {
    paddingHorizontal: Spacing.md,
    gap: 6,
  },
  tabPill: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.01,
    shadowRadius: 2,
    elevation: 1,
  },
  dangerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  tabLabel: {
    fontFamily: Font.family,
    fontSize: 12.5,
  },
});
