import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../../shared/context/theme.context';
import { Font, Radius, Spacing } from '../../../../shared/utils/theme';
import { AdminUserListItem } from '../../api/admin.api';

interface UserActionMenuProps {
  visible: boolean;
  onClose: () => void;
  user: AdminUserListItem;
  onSendWarning: () => void;
  onSuspend: () => void;
  onReactivate: () => void;
  onChangeRole: () => void;
  onResetPassword: () => void;
  onExportData: () => void;
  onDeleteAccount: () => void;
}

export function UserActionMenu({
  visible,
  onClose,
  user,
  onSendWarning,
  onSuspend,
  onReactivate,
  onChangeRole,
  onResetPassword,
  onExportData,
  onDeleteAccount,
}: UserActionMenuProps) {
  const { theme: T, isDark } = useTheme();
  const isSuspended = user.status === 'suspended';
  const isTargetAdmin = user.profileType === 'admin';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={[
            styles.bottomSheet,
            {
              backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
              borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          {/* Top drag handle indicator */}
          <View style={[styles.dragHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }]} />

          <Text style={[styles.sheetTitle, { color: T.textMuted }]}>Gérer le membre</Text>
          <Text style={[styles.sheetSubTitle, { color: T.text }]}>{user.fullName}</Text>

          <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]} />

          <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
            {/* View Public Profile */}
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                onClose();
                // Logic to view public profile
              }}
            >
              <Feather name="user" size={18} color={T.textSub} style={styles.optionIcon} />
              <Text style={[styles.optionText, { color: T.text }]}>Voir le profil public</Text>
            </TouchableOpacity>

            {/* Active Conditional Actions */}
            {!isSuspended && (
              <>
                {/* Send Warning */}
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => {
                    onClose();
                    onSendWarning();
                  }}
                >
                  <Feather name="bell" size={18} color={T.textSub} style={styles.optionIcon} />
                  <Text style={[styles.optionText, { color: T.text }]}>Envoyer un avertissement</Text>
                </TouchableOpacity>

                {/* Suspend User (Hide if target is Admin for security) */}
                {!isTargetAdmin && (
                  <TouchableOpacity
                    style={styles.optionItem}
                    onPress={() => {
                      onClose();
                      onSuspend();
                    }}
                  >
                    <Feather name="user-x" size={18} color="#EF4444" style={styles.optionIcon} />
                    <Text style={[styles.optionText, { color: '#EF4444', fontWeight: '600' }]}>
                      Suspendre le membre
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* Suspended Conditional Actions */}
            {isSuspended && (
              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => {
                  onClose();
                  onReactivate();
                }}
              >
                <Feather name="check-circle" size={18} color="#10B981" style={styles.optionIcon} />
                <Text style={[styles.optionText, { color: '#10B981', fontWeight: '600' }]}>
                  Réactiver le compte
                </Text>
              </TouchableOpacity>
            )}

            <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]} />

            {/* Change Role */}
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                onClose();
                onChangeRole();
              }}
            >
              <Feather name="shield" size={18} color={T.textSub} style={styles.optionIcon} />
              <Text style={[styles.optionText, { color: T.text }]}>Changer le rôle</Text>
            </TouchableOpacity>

            {/* Reset Password */}
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                onClose();
                onResetPassword();
              }}
            >
              <Feather name="key" size={18} color={T.textSub} style={styles.optionIcon} />
              <Text style={[styles.optionText, { color: T.text }]}>Réinitialiser mot de passe</Text>
            </TouchableOpacity>

            {/* Export User Data */}
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                onClose();
                onExportData();
              }}
            >
              <Feather name="download" size={18} color={T.textSub} style={styles.optionIcon} />
              <Text style={[styles.optionText, { color: T.text }]}>Exporter les données (RGPD)</Text>
            </TouchableOpacity>

            {/* Delete Account (Hide if target is Admin) */}
            {!isTargetAdmin && (
              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => {
                  onClose();
                  onDeleteAccount();
                }}
              >
                <Feather name="trash-2" size={18} color="#EF4444" style={styles.optionIcon} />
                <Text style={[styles.optionText, { color: '#EF4444' }]}>Supprimer définitivement</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Cancel button */}
          <TouchableOpacity
            style={[styles.cancelBtn, { backgroundColor: isDark ? '#252528' : '#F3F4F6' }]}
            onPress={onClose}
          >
            <Text style={[styles.cancelText, { color: T.text }]}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    paddingTop: 12,
    paddingBottom: Spacing.xl,
    maxHeight: '80%',
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 10,
  },
  sheetTitle: {
    fontSize: 9.5,
    fontFamily: Font.family,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 2,
  },
  sheetSubTitle: {
    fontSize: 16,
    fontFamily: Font.family,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  optionsList: {
    paddingHorizontal: Spacing.md,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    gap: 12,
  },
  optionIcon: {
    width: 22,
    textAlign: 'center',
  },
  optionText: {
    fontSize: 14.5,
    fontFamily: Font.family,
  },
  cancelBtn: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    paddingVertical: 12,
    borderRadius: Radius.full,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontFamily: Font.family,
    fontWeight: '700',
  },
});
