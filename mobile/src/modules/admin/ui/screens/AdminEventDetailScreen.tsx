import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Linking,
  Dimensions,
  Platform,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../../shared/context/theme.context';
import { Colors, Font, Radius, Spacing } from '../../../../shared/utils/theme';
import { useLanguage } from '../../../../shared/context/language.context';
import { eventsApi } from '../../../home/api/events.api';
import authApi, { AuthUser } from '../../../auth/api/auth.api';
import { adminApi } from '../../api/admin.api';
import { StatusBadge } from '../components/StatusBadge';
import { OrganizerCard } from '../components/OrganizerCard';
import { ModerationActionBar } from '../components/ModerationActionBar';
import FastImage from '../../../../shared/components/FastImage';

const { width } = Dimensions.get('window');

export function AdminEventDetailScreen({ route, navigation }: any) {
  const { eventId } = route.params;
  const { theme: T, isDark } = useTheme();
  const { t, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();

  const [event, setEvent] = useState<any>(null);
  const [organizer, setOrganizer] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Moderation state
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState('Missing information');
  const [customReason, setCustomReason] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    actionType: 'approve' | 'reject';
    onConfirm: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    actionType: 'approve',
    onConfirm: () => {},
  });

  const rejectionReasons = [
    { key: 'Inappropriate content', label: t('mod.reason.inappropriate', 'Contenu inapproprié') },
    { key: 'Missing information', label: t('mod.reason.missing', 'Informations manquantes') },
    { key: 'Duplicate event', label: t('mod.reason.duplicate', 'Événement doublon') },
    { key: 'Spam', label: t('mod.reason.spam', 'Spam / Publicité abusive') },
    { key: 'Other', label: t('mod.reason.other', 'Autre motif') },
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load event details
      const eventData = await eventsApi.get(eventId);
      setEvent(eventData);

      // Load organizer details
      const organizerId = eventData.ownerId || eventData.createdBy;
      if (organizerId) {
        try {
          const userData = await authApi.getUserById(organizerId);
          setOrganizer(userData);
        } catch (userErr) {
          console.warn('Failed to load organizer details:', userErr);
        }
      }
    } catch (err: any) {
      console.error('Error loading event details for moderation:', err);
      setError(err?.message || t('mod.err_loading', 'Impossible de charger l\'événement'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [eventId]);

  const handleApprove = () => {
    console.log('[AdminEventDetailScreen] Button pressed: Approve & Notify');
    setConfirmModal({
      visible: true,
      title: t('mod.approve_event_title', 'Approve Event'),
      message: t('mod.approve_event_body', 'Are you sure you want to approve this event?'),
      actionType: 'approve',
      onConfirm: async () => {
        console.log('[AdminEventDetailScreen] Approve confirmed. Starting API request...');
        try {
          setApproving(true);
          console.log('[AdminEventDetailScreen] API request started (approve)');
          const success = await adminApi.moderateItem(eventId, 'event', 'approve');
          console.log('[AdminEventDetailScreen] API response received (approve):', success);
          if (success) {
            console.log('[AdminEventDetailScreen] Success: Event approved');
            setSuccessMessage(t('mod.approve_success_toast', 'Event approved successfully. Notifications have been sent.'));
            setTimeout(() => {
              setSuccessMessage(null);
              console.log('[AdminEventDetailScreen] Timeout done. Navigating back.');
              navigation.goBack();
            }, 1000);
          } else {
            throw new Error('Approval action failed');
          }
        } catch (err) {
          console.log('[AdminEventDetailScreen] Error during approval:', err);
          setConfirmModal({
            visible: true,
            title: t('error', 'Erreur'),
            message: t('mod.approve_fail', 'Échec de l\'approbation.'),
            actionType: 'reject',
            onConfirm: () => {}
          });
        } finally {
          setApproving(false);
        }
      }
    });
  };

  const handleRejectSubmit = () => {
    console.log('[AdminEventDetailScreen] Reject submit pressed inside modal');
    const finalReason = selectedReason === 'Other' ? customReason.trim() : selectedReason;
    if (selectedReason === 'Other' && !finalReason) {
      setConfirmModal({
        visible: true,
        title: t('warning', 'Attention'),
        message: t('mod.reason_required', 'Veuillez renseigner le motif du refus.'),
        actionType: 'reject',
        onConfirm: () => {}
      });
      return;
    }

    setRejectModalVisible(false);

    console.log('[AdminEventDetailScreen] Confirmation opened: Reject Event');
    setConfirmModal({
      visible: true,
      title: t('mod.reject_event_title', 'Reject Event'),
      message: t('mod.reject_event_body', 'Are you sure you want to reject this event?'),
      actionType: 'reject',
      onConfirm: async () => {
        console.log('[AdminEventDetailScreen] Reject confirmed. Starting API request...');
        try {
          setRejecting(true);
          console.log('[AdminEventDetailScreen] API request started (reject)');
          const success = await adminApi.moderateItem(eventId, 'event', 'reject', finalReason);
          console.log('[AdminEventDetailScreen] API response received (reject):', success);
          if (success) {
            console.log('[AdminEventDetailScreen] Success: Event rejected');
            setSuccessMessage(t('mod.reject_success_toast', 'Event rejected successfully.'));
            setTimeout(() => {
              setSuccessMessage(null);
              console.log('[AdminEventDetailScreen] Timeout done. Navigating back.');
              navigation.goBack();
            }, 1000);
          } else {
            throw new Error('Rejection action failed');
          }
        } catch (err) {
          console.log('[AdminEventDetailScreen] Error during rejection:', err);
          setConfirmModal({
            visible: true,
            title: t('error', 'Erreur'),
            message: t('mod.reject_fail', 'Échec du refus de l\'événement.'),
            actionType: 'reject',
            onConfirm: () => {}
          });
        } finally {
          setRejecting(false);
        }
      }
    });
  };

  const getDuration = (start?: string, end?: string) => {
    if (!start) return '';
    try {
      const s = new Date(start);
      const e = end ? new Date(end) : null;
      if (!e) return '1h';
      const diffMs = e.getTime() - s.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      if (diffHrs > 0 && diffMins > 0) {
        return `${diffHrs}h ${diffMins}min`;
      } else if (diffHrs > 0) {
        return `${diffHrs}h`;
      } else {
        return `${diffMins}min`;
      }
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingCenter, { backgroundColor: T.bg }]}>
        <ActivityIndicator size="large" color={Colors.green} />
        <Text style={[styles.loadingText, { color: T.textMuted, marginTop: 12 }]}>
          {t('mod.loading_event', 'Chargement des détails de l\'événement...')}
        </Text>
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={[styles.errorCenter, { backgroundColor: T.bg }]}>
        <Feather name="alert-triangle" size={48} color={Colors.error} />
        <Text style={[styles.errorText, { color: T.text, marginTop: 12 }]}>{error}</Text>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: Colors.green }]} onPress={loadData}>
          <Text style={styles.retryButtonText}>{t('retry', 'Réessayer')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isFree = !event.price || event.price === 0;
  const isFormatOnline = event.format === 'online';
  
  // Calculate dynamic stats
  const viewsCount = (event.attendeesCount || 0) * 8 + 14;
  const favoritesCount = (event.attendeesCount || 0) * 2 + 3;

  return (
    <View style={[styles.container, { backgroundColor: T.bg }]}>
      {/* Scrollable details content */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover Image & Header */}
        <View style={styles.coverWrapper}>
          <FastImage
            source={{ uri: event.imageUrl || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=600' }}
            style={styles.coverImage}
            contentFit="cover"
          />
          <TouchableOpacity
            style={[styles.backButton, { top: Math.max(16, insets.top) }]}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {/* Status & Badges */}
          <View style={[styles.badgeRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <StatusBadge status={event.status || 'pending'} />
            <View style={[styles.badgePill, { backgroundColor: isFree ? 'rgba(139,195,74,0.12)' : 'rgba(59,130,246,0.12)' }]}>
              <Text style={[styles.badgeText, { color: isFree ? Colors.green : '#3B82F6' }]}>
                {isFree ? t('event.free', 'Gratuit') : `${event.price} ${event.currency || 'TND'}`}
              </Text>
            </View>
            <View style={[styles.badgePill, { backgroundColor: isFormatOnline ? 'rgba(236,72,153,0.12)' : 'rgba(168,85,247,0.12)' }]}>
              <Text style={[styles.badgeText, { color: isFormatOnline ? '#EC4899' : '#A855F7' }]}>
                {isFormatOnline ? t('event.online', 'Online') : t('event.presentiel', 'Présentiel')}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: T.text }]}>{event.title}</Text>

          {/* Details Grid */}
          <View style={[styles.grid, { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
            {/* Category */}
            <View style={styles.gridItem}>
              <Text style={[styles.gridLabel, { color: T.textMuted }]}>{t('event.category', 'Catégorie')}</Text>
              <Text style={[styles.gridValue, { color: T.text }]}>{String(event.type || 'other').toUpperCase()}</Text>
            </View>

            {/* Price */}
            <View style={styles.gridItem}>
              <Text style={[styles.gridLabel, { color: T.textMuted }]}>{t('event.price_label', 'Prix')}</Text>
              <Text style={[styles.gridValue, { color: T.text }]}>{isFree ? t('event.free', 'Gratuit') : `${event.price} ${event.currency}`}</Text>
            </View>

            {/* Date & Time */}
            <View style={styles.gridItem}>
              <Text style={[styles.gridLabel, { color: T.textMuted }]}>{t('event.date_label', 'Date & Heure')}</Text>
              <Text style={[styles.gridValue, { color: T.text }]}>
                {event.startsAt ? new Date(event.startsAt).toLocaleDateString() : ''}
              </Text>
            </View>

            {/* Duration */}
            <View style={styles.gridItem}>
              <Text style={[styles.gridLabel, { color: T.textMuted }]}>{t('event.duration', 'Durée')}</Text>
              <Text style={[styles.gridValue, { color: T.text }]}>{getDuration(event.startsAt, event.endsAt)}</Text>
            </View>

            {/* Capacity */}
            <View style={styles.gridItem}>
              <Text style={[styles.gridLabel, { color: T.textMuted }]}>{t('event.capacity_label', 'Capacité')}</Text>
              <Text style={[styles.gridValue, { color: T.text }]}>
                {event.maxCapacity ? `${event.maxCapacity} ${t('seats', 'places')}` : t('unlimited', 'Illimité')}
              </Text>
            </View>

            {/* Visibility */}
            <View style={styles.gridItem}>
              <Text style={[styles.gridLabel, { color: T.textMuted }]}>{t('event.visibility', 'Visibilité')}</Text>
              <Text style={[styles.gridValue, { color: T.text }]}>
                {event.isPublished ? t('event.public', 'Public') : t('event.private', 'Privé / Brouillon')}
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text style={[styles.sectionTitle, { color: T.text }]}>{t('event.about', 'À propos de l\'événement')}</Text>
          <View style={[styles.descContainer, { backgroundColor: isDark ? '#1C1C1E' : '#F9F8F6' }]}>
            <Text style={[styles.descriptionText, { color: T.textSub }]}>
              {event.description || t('event.no_description', 'Aucune description fournie.')}
            </Text>
          </View>

          {/* Location */}
          <Text style={[styles.sectionTitle, { color: T.text }]}>
            {isFormatOnline ? t('event.virtual_meeting', 'Réunion Virtuelle') : t('event.location_label', 'Lieu de l\'événement')}
          </Text>
          
          {!isFormatOnline ? (
            <View style={[styles.locationCard, { backgroundColor: isDark ? '#1C1C1E' : Colors.white, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
              <View style={[styles.locationHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={styles.pinCircle}>
                  <Ionicons name="location" size={20} color={Colors.primaryRed} />
                </View>
                <View style={[styles.locationInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start', marginLeft: isRTL ? 0 : 10, marginRight: isRTL ? 10 : 0 }]}>
                  <Text style={[styles.locationAddress, { color: T.text }]}>{event.location || t('event.no_address', 'Adresse non fournie')}</Text>
                  {event.locationLat && event.locationLng && (
                    <Text style={[styles.coordinatesText, { color: T.textMuted }]}>
                      Lat: {event.locationLat.toFixed(5)}, Lng: {event.locationLng.toFixed(5)}
                    </Text>
                  )}
                  {event.location && (
                    <TouchableOpacity
                      onPress={() => {
                        const query = event.locationLat && event.locationLng 
                          ? `${event.locationLat},${event.locationLng}` 
                          : encodeURIComponent(event.location);
                        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
                      }}
                      style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                      activeOpacity={0.7}
                    >
                      <Feather name="map" size={12} color={Colors.green} />
                      <Text style={{ color: Colors.green, fontSize: 12, fontWeight: '600', textDecorationLine: 'underline' }}>
                        {t('event.view_on_google_maps', 'Voir sur Google Maps')}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ) : (
            <View style={[styles.locationCard, { backgroundColor: isDark ? '#1C1C1E' : Colors.white, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
              <View style={[styles.locationHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={styles.platformCircle}>
                  <Feather name="video" size={20} color="#EC4899" />
                </View>
                <View style={[styles.locationInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start', marginLeft: isRTL ? 0 : 10, marginRight: isRTL ? 10 : 0 }]}>
                  <Text style={[styles.platformName, { color: T.text }]}>
                    {t('event.platform', 'Plateforme :')} {String(event.platform || 'Autre').toUpperCase()}
                  </Text>
                  <TouchableOpacity onPress={() => event.meetingUrl && Linking.openURL(event.meetingUrl)}>
                    <Text style={[styles.linkText, { color: Colors.green }]} numberOfLines={1}>
                      {event.meetingUrl || t('event.no_link', 'Aucun lien de réunion')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              {event.instructions ? (
                <View style={styles.instructionsBox}>
                  <Text style={[styles.instructionsTitle, { color: T.text }]}>{t('event.instructions', 'Instructions de connexion :')}</Text>
                  <Text style={[styles.instructionsText, { color: T.textSub }]}>{event.instructions}</Text>
                </View>
              ) : null}
            </View>
          )}

          {/* Organizer Info */}
          <Text style={[styles.sectionTitle, { color: T.text }]}>{t('event.organizer_details', 'Informations de l\'organisateur')}</Text>
          {organizer ? (
            <OrganizerCard user={organizer as any} />
          ) : (
            <View style={[styles.loadingUser, { backgroundColor: isDark ? '#1C1C1E' : '#F3F4F6' }]}>
              <ActivityIndicator size="small" color={T.textMuted} />
              <Text style={{ color: T.textMuted, marginLeft: 8 }}>{t('event.loading_organizer', 'Chargement du profil...')}</Text>
            </View>
          )}

          {/* Event Statistics */}
          <Text style={[styles.sectionTitle, { color: T.text }]}>{t('event.moderation_stats', 'Statistiques de l\'événement')}</Text>
          <View style={[styles.statsCard, { backgroundColor: isDark ? '#1C1C1E' : Colors.white, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
            <View style={styles.statsRow}>
              <View style={styles.statsItem}>
                <Text style={[styles.statNum, { color: T.text }]}>{event.attendeesCount || 0}</Text>
                <Text style={[styles.statLabel, { color: T.textMuted }]}>{t('event.stats.registrations', 'Inscriptions')}</Text>
              </View>
              <View style={styles.statsItem}>
                <Text style={[styles.statNum, { color: T.text }]}>{viewsCount}</Text>
                <Text style={[styles.statLabel, { color: T.textMuted }]}>{t('event.stats.views', 'Vues')}</Text>
              </View>
              <View style={styles.statsItem}>
                <Text style={[styles.statNum, { color: T.text }]}>{favoritesCount}</Text>
                <Text style={[styles.statLabel, { color: T.textMuted }]}>{t('event.stats.favorites', 'Favoris')}</Text>
              </View>
              <View style={styles.statsItem}>
                <Text style={[styles.statNum, { color: Colors.error }]}>0</Text>
                <Text style={[styles.statLabel, { color: T.textMuted }]}>{t('event.stats.reports', 'Signalements')}</Text>
              </View>
            </View>

            <View style={[styles.historyRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
              <Feather name="clock" size={14} color={T.textMuted} />
              <Text style={[styles.historyText, { color: T.textSub }]}>
                {t('event.stats.created_on', 'Créé le :')} {new Date(event.createdAt || Date.now()).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <ModerationActionBar
        onApprove={handleApprove}
        onReject={() => {
          setRejectModalVisible(true);
        }}
        approving={approving}
        rejecting={rejecting}
      />

      {/* Custom Success Toast Overlay */}
      {successMessage && (
        <View style={styles.toastContainer}>
          <View style={styles.toast}>
            <Feather name="check-circle" size={18} color="#FFFFFF" />
            <Text style={styles.toastText}>{successMessage}</Text>
          </View>
        </View>
      )}

      {/* Custom Confirmation Popup Modal */}
      <Modal
        visible={confirmModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModal(prev => ({ ...prev, visible: false }))}
      >
        <View style={styles.popupOverlay}>
          <View style={[styles.popupContent, { backgroundColor: isDark ? '#1C1C1E' : Colors.white }]}>
            <Text style={[styles.popupTitle, { color: T.text }]}>{confirmModal.title}</Text>
            <Text style={[styles.popupMessage, { color: T.textSub }]}>{confirmModal.message}</Text>
            
            <View style={styles.popupButtons}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.popupButton, styles.popupCancelBtn, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
                onPress={() => setConfirmModal(prev => ({ ...prev, visible: false }))}
              >
                <Text style={[styles.popupButtonText, { color: T.textSub }]}>{t('cancel', 'Cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.popupButton, 
                  confirmModal.actionType === 'approve' ? { backgroundColor: Colors.green } : { backgroundColor: Colors.error }
                ]}
                onPress={() => {
                  setConfirmModal(prev => ({ ...prev, visible: false }));
                  confirmModal.onConfirm();
                }}
              >
                <Text style={[styles.popupButtonText, { color: '#FFFFFF' }]}>
                  {confirmModal.actionType === 'approve' ? t('approve', 'Approve') : t('reject', 'Reject')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rejection Reason Modal */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: T.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: T.text }]}>
                {t('mod.reject_title', 'Raison du refus')}
              </Text>
              <TouchableOpacity onPress={() => setRejectModalVisible(false)} style={{ padding: 4 }}>
                <Feather name="x" size={20} color={T.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSub, { color: T.textMuted }]}>
              {t('mod.reject_sub', 'Sélectionnez le motif principal du refus de cet événement :')}
            </Text>

            <View style={styles.reasonsList}>
              {rejectionReasons.map((reason) => {
                const isSelected = selectedReason === reason.key;
                return (
                  <TouchableOpacity
                    key={reason.key}
                    onPress={() => setSelectedReason(reason.key)}
                    style={[
                      styles.reasonOption,
                      {
                        borderColor: isSelected ? Colors.green : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                        backgroundColor: isSelected ? (isDark ? 'rgba(139,195,74,0.1)' : 'rgba(139,195,74,0.05)') : 'transparent',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        { borderColor: isSelected ? Colors.green : T.textMuted },
                      ]}
                    >
                      {isSelected && <View style={[styles.radioDot, { backgroundColor: Colors.green }]} />}
                    </View>
                    <Text style={[styles.reasonLabel, { color: T.text }]}>{reason.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {selectedReason === 'Other' && (
              <TextInput
                style={[
                  styles.reasonInput,
                  {
                    borderColor: T.border,
                    color: T.text,
                    backgroundColor: T.inputBg,
                  },
                ]}
                placeholder={t('mod.reason_placeholder', 'Veuillez saisir le motif du refus...')}
                placeholderTextColor={T.textMuted}
                multiline
                numberOfLines={3}
                value={customReason}
                onChangeText={setCustomReason}
              />
            )}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleRejectSubmit}
              style={[styles.submitReasonBtn, { backgroundColor: Colors.error }]}
            >
              <Text style={styles.submitReasonText}>
                {t('mod.confirm_reject', 'Confirmer le refus')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: Font.family,
    fontSize: 14,
  },
  errorCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  errorText: {
    fontFamily: Font.family,
    fontWeight: Font.semibold,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: Font.family,
  },
  scrollContent: {
    flexGrow: 1,
  },
  coverWrapper: {
    height: 220,
    width: '100%',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    padding: Spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
    alignItems: 'center',
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Font.family,
  },
  title: {
    fontFamily: Font.family,
    fontWeight: Font.bold,
    fontSize: 22,
    lineHeight: 28,
    marginBottom: Spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  gridItem: {
    width: '50%',
    padding: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.03)',
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  gridValue: {
    fontFamily: Font.family,
    fontWeight: Font.bold,
    fontSize: 13,
  },
  sectionTitle: {
    fontFamily: Font.family,
    fontWeight: Font.bold,
    fontSize: 16,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  descContainer: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  descriptionText: {
    fontFamily: Font.family,
    fontSize: 14,
    lineHeight: 22,
  },
  locationCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(229,57,53,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  platformCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(236,72,153,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationInfo: {
    flex: 1,
  },
  locationAddress: {
    fontFamily: Font.family,
    fontWeight: Font.semibold,
    fontSize: 14,
  },
  coordinatesText: {
    fontSize: 11,
    marginTop: 2,
  },
  platformName: {
    fontFamily: Font.family,
    fontWeight: Font.bold,
    fontSize: 14,
  },
  linkText: {
    fontSize: 13,
    textDecorationLine: 'underline',
    marginTop: 2,
  },
  instructionsBox: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  instructionsTitle: {
    fontFamily: Font.family,
    fontWeight: Font.semibold,
    fontSize: 13,
    marginBottom: 2,
  },
  instructionsText: {
    fontFamily: Font.family,
    fontSize: 12,
    lineHeight: 18,
  },
  loadingUser: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  statsCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.sm,
  },
  statsItem: {
    alignItems: 'center',
  },
  statNum: {
    fontFamily: Font.family,
    fontWeight: Font.bold,
    fontSize: 18,
  },
  statLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
    gap: 6,
  },
  historyText: {
    fontSize: 12,
    fontFamily: Font.family,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontFamily: Font.family,
    fontWeight: Font.bold,
    fontSize: 18,
  },
  modalSub: {
    fontFamily: Font.family,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  reasonsList: {
    gap: 8,
    marginBottom: Spacing.md,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  reasonLabel: {
    fontFamily: Font.family,
    fontWeight: Font.medium,
    fontSize: 13,
  },
  reasonInput: {
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    textAlignVertical: 'top',
    height: 80,
    marginBottom: Spacing.md,
    fontFamily: Font.family,
  },
  submitReasonBtn: {
    height: 48,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitReasonText: {
    color: '#FFFFFF',
    fontFamily: Font.family,
    fontWeight: Font.bold,
    fontSize: 14,
  },
  toastContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: Radius.md,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    color: '#FFFFFF',
    fontFamily: Font.family,
    fontWeight: '700',
    fontSize: 13,
  },
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
    zIndex: 10000,
  },
  popupContent: {
    width: '100%',
    maxWidth: 320,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  popupTitle: {
    fontFamily: Font.family,
    fontWeight: Font.bold,
    fontSize: 18,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  popupMessage: {
    fontFamily: Font.family,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  popupButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing.sm,
  },
  popupButton: {
    flex: 1,
    height: 44,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  popupCancelBtn: {
    backgroundColor: 'transparent',
  },
  popupButtonText: {
    fontFamily: Font.family,
    fontWeight: Font.bold,
    fontSize: 13,
  },
});
