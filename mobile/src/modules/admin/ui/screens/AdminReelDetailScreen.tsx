import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Modal,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { adminApi, ModerationItem } from '../../api/admin.api';
import { ReelPlayerItem } from '../../../reels/ui/components/ReelPlayerItem';
import { Reel } from '../../../reels/services/reels.service';
import { useTheme } from '../../../../shared/context/theme.context';
import { Colors, Font, Radius, Spacing } from '../../../../shared/utils/theme';
import { useLanguage } from '../../../../shared/context/language.context';

export function AdminReelDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const item: ModerationItem = route.params?.item;
  const { width, height } = useWindowDimensions();
  const { theme: T, isDark } = useTheme();
  const { t } = useLanguage();

  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Mark notification as "reviewed" on mount/view
  useEffect(() => {
    if (item && item.id) {
      adminApi.moderateItem(item.id, 'reel', 'review').catch((err) => {
        console.warn('[AdminReelDetail] Failed to auto-review reel notification:', err);
      });
    }
  }, [item]);

  if (!item) {
    return (
      <View style={[styles.centered, { backgroundColor: '#000' }]}>
        <Text style={{ color: '#fff' }}>Reel data not found</Text>
      </View>
    );
  }

  // Reconstruct standard Reel object to feed into ReelPlayerItem
  const reelObject: Reel = {
    id: item.reelId || item.id,
    author: {
      id: item.authorOrSeller || '',
      fullName: item.authorUsername || item.authorOrSeller || 'Inconnu',
      avatarUrl: item.authorAvatar || undefined,
      profileType: 'user',
    },
    videoUrl: item.videoUrl || '',
    thumbnailUrl: item.thumbnailUrl || '',
    caption: item.caption || '',
    duration: 0,
    viewsCount: item.viewsCount || 0,
    likesCount: item.likesCount || 0,
    commentsCount: item.commentsCount || 0,
    sharesCount: 0,
    isLiked: false,
    status: 'ready',
    category: 'all',
    createdAt: item.date,
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      const success = await adminApi.moderateItem(item.id, 'reel', 'reject');
      if (success) {
        Alert.alert(
          t('mod.success_delete_title', 'Reel Supprimé'),
          t('mod.success_delete_body', 'Le Reel a été retiré de la plateforme.')
        );
        setConfirmModalVisible(false);
        navigation.goBack();
      } else {
        Alert.alert(t('mod.error', 'Erreur'), t('mod.error_delete', 'Impossible de supprimer le Reel.'));
      }
    } catch (err) {
      console.error(err);
      Alert.alert(t('mod.error', 'Erreur'), t('mod.error_delete', 'Une erreur est survenue.'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Reel Player exactly as it appears on the platform */}
      <ReelPlayerItem
        reel={reelObject}
        isActive={true}
        onToggleLike={() => {}}
        onRecordView={() => {}}
        onRecordShare={() => {}}
        onIncrementCommentsCount={() => {}}
        containerHeight={height}
        containerWidth={width}
      />

      {/* Overlay Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <Feather name="arrow-left" size={24} color="#FFF" />
      </TouchableOpacity>

      {/* Overlay Delete Action */}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => setConfirmModalVisible(true)}
        activeOpacity={0.8}
      >
        <Feather name="trash-2" size={18} color="#FFF" />
        <Text style={styles.deleteButtonText}>{t('mod.delete_reel', 'Supprimer le Reel')}</Text>
      </TouchableOpacity>

      {/* Deletion Confirmation Modal */}
      <Modal
        visible={confirmModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFF' }]}>
            <View style={styles.modalHeader}>
              <View style={styles.warningCircle}>
                <Feather name="alert-triangle" size={24} color={Colors.error} />
              </View>
              <Text style={[styles.modalTitle, { color: T.text }]}>
                {t('mod.delete_confirm_title', 'Supprimer ce Reel ?')}
              </Text>
            </View>

            <Text style={[styles.modalBody, { color: T.textMuted }]}>
              {t('mod.delete_confirm_body', 'Ce Reel sera définitivement retiré de la plateforme.')}
            </Text>

            {deleting ? (
              <ActivityIndicator size="small" color={Colors.error} style={{ marginVertical: Spacing.md }} />
            ) : (
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.cancelBtn, { borderColor: T.border }]}
                  onPress={() => setConfirmModalVisible(false)}
                >
                  <Text style={[styles.cancelBtnText, { color: T.textSub }]}>
                    {t('common.cancel', 'Annuler')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, styles.confirmBtn, { backgroundColor: Colors.error }]}
                  onPress={handleConfirmDelete}
                >
                  <Text style={styles.confirmBtnText}>
                    {t('common.delete', 'Supprimer')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  deleteButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(220, 38, 38, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  deleteButtonText: {
    color: '#FFF',
    fontFamily: Font.bold,
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    width: '90%',
    maxWidth: 320,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Spacing.sm,
  },
  warningCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.errorLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: Font.bold,
    flex: 1,
  },
  modalBody: {
    fontSize: 14,
    fontFamily: Font.family,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  modalBtn: {
    flex: 1,
    height: 42,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    borderWidth: 1.5,
  },
  cancelBtnText: {
    fontFamily: Font.bold,
    fontSize: 14,
  },
  confirmBtn: {
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  confirmBtnText: {
    color: '#FFF',
    fontFamily: Font.bold,
    fontSize: 14,
  },
});
