import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../../shared/context/theme.context';
import { Colors, Font, Radius, Spacing } from '../../../../shared/utils/theme';
import { AdminUserListItem } from '../../api/admin.api';

interface UserHeaderCardProps {
  user: AdminUserListItem;
  phone: string;
  location: string;
  accountAge: string;
  lastActiveLabel: string;
}

export function UserHeaderCard({
  user,
  phone,
  location,
  accountAge,
  lastActiveLabel,
}: UserHeaderCardProps) {
  const { theme: T, isDark } = useTheme();
  const primaryGreen = Colors.green || '#8BC34A';
  const isSuspended = user.status === 'suspended';

  // Role details mapping
  const getRoleDetails = (type: string) => {
    switch (type) {
      case 'celiac':
        return { label: 'Patient', color: '#10B981', bg: '#D1FAE5', avatarBg: '#10B981' };
      case 'pro_commerce':
        return { label: 'Vendeur', color: '#3B82F6', bg: '#DBEAFE', avatarBg: '#3B82F6' };
      case 'pro_health':
        return { label: 'Professionnel Santé', color: '#8B5CF6', bg: '#F3E8FF', avatarBg: '#8B5CF6' };
      case 'admin':
        return { label: 'Admin', color: '#F59E0B', bg: '#FEF3C7', avatarBg: '#F59E0B' };
      default:
        return { label: 'Membre', color: '#6B7280', bg: '#F3F4F6', avatarBg: '#9CA3AF' };
    }
  };

  const roleInfo = getRoleDetails(user.profileType);

  // Render avatar: image if exists, otherwise initials placeholder
  const renderAvatar = () => {
    const avatarUri = (user as any).avatarUrl || (user as any).avatar?.url;
    if (avatarUri) {
      return (
        <Image
          source={{ uri: avatarUri }}
          style={styles.avatarImage}
          resizeMode="cover"
        />
      );
    }

    const initial = user.fullName ? user.fullName.trim().charAt(0).toUpperCase() : '?';
    return (
      <View style={[styles.avatarPlaceholder, { backgroundColor: roleInfo.avatarBg }]}>
        <Text style={styles.avatarInitialText}>{initial}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.card, { backgroundColor: isDark ? '#1A1A1D' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
      <View style={styles.profileMainRow}>
        {renderAvatar()}
        
        <View style={styles.profileBrief}>
          <View style={styles.nameRow}>
            <Text style={[styles.profileName, { color: T.text }]} numberOfLines={1}>
              {user.fullName}
            </Text>
            {user.profileType === 'admin' && (
              <Feather name="shield" size={15} color="#F59E0B" style={styles.shieldIcon} />
            )}
          </View>
          <Text style={[styles.profileEmail, { color: T.textMuted }]} numberOfLines={1}>
            {user.email}
          </Text>
          <Text style={[styles.profilePhone, { color: T.textMuted }]}>{phone}</Text>
        </View>
      </View>

      {/* Badges Row */}
      <View style={styles.badgeRow}>
        <View style={[styles.badge, { backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : roleInfo.bg }]}>
          <Text style={[styles.badgeText, { color: isDark ? '#60A5FA' : roleInfo.color }]}>
            {roleInfo.label.toUpperCase()}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: isSuspended ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.1)' }]}>
          <View style={[styles.statusDot, { backgroundColor: isSuspended ? '#EF4444' : '#10B981' }]} />
          <Text style={[styles.badgeText, { color: isSuspended ? '#EF4444' : '#10B981' }]}>
            {isSuspended ? 'SUSPENDU' : 'ACTIF'}
          </Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]} />

      {/* Metadata Grid */}
      <View style={styles.gridMeta}>
        <View style={styles.gridMetaItem}>
          <Text style={[styles.metaLabel, { color: T.textMuted }]}>INSCRIPTION</Text>
          <Text style={[styles.metaVal, { color: T.text }]}>
            {user.joinedDate ? new Date(user.joinedDate).toLocaleDateString('fr-FR') : 'Non spécifiée'}
          </Text>
        </View>
        <View style={styles.gridMetaItem}>
          <Text style={[styles.metaLabel, { color: T.textMuted }]}>DERNIÈRE ACTIVITÉ</Text>
          <Text style={[styles.metaVal, { color: T.text }]}>{lastActiveLabel}</Text>
        </View>
        <View style={styles.gridMetaItem}>
          <Text style={[styles.metaLabel, { color: T.textMuted }]}>LOCALISATION</Text>
          <Text style={[styles.metaVal, { color: T.text }]} numberOfLines={1}>{location}</Text>
        </View>
        <View style={styles.gridMetaItem}>
          <Text style={[styles.metaLabel, { color: T.textMuted }]}>ÂGE DU COMPTE</Text>
          <Text style={[styles.metaVal, { color: T.text }]}>{accountAge}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  profileMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitialText: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '800',
  },
  profileBrief: {
    marginLeft: 14,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileName: {
    fontFamily: Font.family,
    fontWeight: '700',
    fontSize: 17,
  },
  shieldIcon: {
    marginTop: 2,
  },
  profileEmail: {
    fontFamily: Font.family,
    fontSize: 13,
    marginTop: 2,
  },
  profilePhone: {
    fontFamily: Font.family,
    fontSize: 12.5,
    marginTop: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  badgeText: {
    fontFamily: Font.family,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  gridMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 14,
  },
  gridMetaItem: {
    width: '50%',
  },
  metaLabel: {
    fontFamily: Font.family,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metaVal: {
    fontFamily: Font.family,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 3,
  },
});
