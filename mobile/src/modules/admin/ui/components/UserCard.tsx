import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../shared/context/theme.context';
import { Colors, Font, Radius, Spacing } from '../../../../shared/utils/theme';
import { AdminUserListItem } from '../../api/admin.api';
import { getEnrichedUserDetail } from '../../utils/adminMockData';

interface UserCardProps {
  user: AdminUserListItem;
  onPress: () => void;
}

export function UserCard({ user, onPress }: UserCardProps) {
  const { theme: T, isDark } = useTheme();
  const primaryGreen = Colors.green || '#8BC34A';
  const isSuspended = user.status === 'suspended';

  // Load the enriched user stats deterministically
  const enriched = getEnrichedUserDetail(user);
  const { stats, lastActiveLabel } = enriched;

  const getProfileTypeBadge = (type: string) => {
    switch (type) {
      case 'celiac': 
        return { label: 'Patient', color: '#10B981', bg: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.08)' };
      case 'pro_commerce': 
        return { label: 'Vendeur', color: '#3B82F6', bg: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)' };
      case 'pro_health': 
        return { label: 'Santé', color: '#8B5CF6', bg: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.08)' };
      case 'admin': 
        return { label: 'Admin', color: '#F59E0B', bg: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.08)' };
      default: 
        return { label: 'Membre', color: T.textMuted, bg: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' };
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'suspended') {
      return { label: 'Suspendu', color: '#EF4444', bg: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)' };
    }
    if (stats.warnings > 0) {
      return { label: 'Avertissement', color: '#F59E0B', bg: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.08)' };
    }
    return { label: 'Actif', color: '#10B981', bg: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.08)' };
  };

  // Generate deterministic avatar gradient colors based on name length/hash
  const getAvatarColors = (name: string) => {
    const code = name.charCodeAt(0) + name.length;
    const gradients = [
      { from: '#6366F1', to: '#4F46E5' }, // indigo
      { from: '#3B82F6', to: '#2563EB' }, // blue
      { from: '#10B981', to: '#059669' }, // emerald
      { from: '#EC4899', to: '#DB2777' }, // pink
      { from: '#8B5CF6', to: '#7C3AED' }, // purple
      { from: '#F59E0B', to: '#D97706' }, // amber
    ];
    return gradients[code % gradients.length];
  };

  const role = getProfileTypeBadge(user.profileType);
  const status = getStatusBadge(user.status);
  const avatarBg = getAvatarColors(user.fullName);

  return (
    <TouchableOpacity
      style={[
        styles.userCard,
        {
          backgroundColor: isDark ? '#1A1A1D' : Colors.white,
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Upper Info Row */}
      <View style={styles.cardHeader}>
        <View style={[styles.userAvatar, { backgroundColor: avatarBg.from }]}>
          <Text style={styles.avatarText}>{user.fullName.charAt(0).toUpperCase()}</Text>
        </View>

        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.userName, { color: T.text }]} numberOfLines={1}>
              {user.fullName}
            </Text>
          </View>
          <Text style={[styles.userEmail, { color: T.textMuted }]} numberOfLines={1}>
            {user.email}
          </Text>
        </View>

        {/* Badges Column */}
        <View style={styles.badgesCol}>
          <View style={[styles.badge, { backgroundColor: role.bg }]}>
            <Text style={[styles.badgeText, { color: role.color }]}>{role.label}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: status.bg, marginTop: Spacing.xs }]}>
            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
            <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
      </View>

      {/* Spacing Divider */}
      <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]} />

      {/* Middle row: Metadata */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Feather name="calendar" size={11} color={T.textMuted} />
          <Text style={[styles.metaText, { color: T.textMuted }]}>
            Inscrit le {new Date(user.joinedDate).toLocaleDateString('fr-FR')}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Feather name="clock" size={11} color={T.textMuted} />
          <Text style={[styles.metaText, { color: T.textMuted }]}>
            Actif : {lastActiveLabel}
          </Text>
        </View>
      </View>

      {/* Lower Row: Mini Stats & Action */}
      <View style={styles.cardFooter}>
        <View style={styles.statsRow}>
          {/* Posts */}
          <View style={styles.statChip}>
            <Feather name="file-text" size={11} color={T.textMuted} />
            <Text style={[styles.statValue, { color: T.textSub }]}>{stats.posts}</Text>
          </View>

          {/* Comments */}
          <View style={styles.statChip}>
            <Feather name="message-square" size={11} color={T.textMuted} />
            <Text style={[styles.statValue, { color: T.textSub }]}>{stats.comments}</Text>
          </View>

          {/* Events */}
          <View style={styles.statChip}>
            <Feather name="calendar" size={11} color={T.textMuted} />
            <Text style={[styles.statValue, { color: T.textSub }]}>{stats.events}</Text>
          </View>

          {/* Warnings */}
          {stats.warnings > 0 && (
            <View style={[styles.statChip, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.05)' }]}>
              <Feather name="bell" size={11} color="#F59E0B" />
              <Text style={[styles.statValue, { color: '#F59E0B', fontWeight: 'bold' }]}>{stats.warnings}</Text>
            </View>
          )}

          {/* Reports */}
          {stats.reports > 0 && (
            <View style={[styles.statChip, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)' }]}>
              <Feather name="alert-triangle" size={11} color="#EF4444" />
              <Text style={[styles.statValue, { color: '#EF4444', fontWeight: 'bold' }]}>{stats.reports}</Text>
            </View>
          )}
        </View>

        <View style={styles.actionBtn}>
          <Text style={[styles.actionBtnText, { color: primaryGreen }]}>
            Détails
          </Text>
          <Feather name="arrow-right" size={12} color={primaryGreen} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  userCard: {
    borderWidth: 1,
    borderRadius: Radius.lg, // 16px rounded cards
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontFamily: Font.family,
    fontWeight: '700',
    fontSize: 16,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontFamily: Font.family,
    fontWeight: '600',
    fontSize: 14.5,
  },
  userEmail: {
    fontFamily: Font.family,
    fontSize: 12,
    marginTop: 2,
  },
  badgesCol: {
    alignItems: 'flex-end',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  badgeText: {
    fontFamily: Font.family,
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: Font.family,
    fontSize: 11,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  statValue: {
    fontFamily: Font.family,
    fontSize: 10.5,
    fontWeight: '500',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtnText: {
    fontFamily: Font.family,
    fontWeight: '700',
    fontSize: 12.5,
  },
});
