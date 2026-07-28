import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Image,
  Dimensions,
  FlatList,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/shared/context/theme.context';
import { useLanguage } from '@/shared/context/language.context';
import { AppScaffold } from '@/shared/components/AppScaffold';
import { SkeletonLoader } from '@/shared/components/SkeletonLoader';
import { useAuth } from '@/modules/auth/state/auth.context';

const { width } = Dimensions.get('window');

const F = {
  regular: 'Poppins_400Regular',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
};

// ── Types ────────────────────────────────────────────────────────────────────
interface EventItem {
  id: string;
  title: string;
  organizerName: string;
  organizerBusiness: string;
  category: string;
  eventType: 'online' | 'in_person';
  eventDate: string;
  eventTime: string;
  location: string;
  meetingUrl?: string;
  capacity: number;
  priceType: 'free' | 'paid';
  price?: number;
  description: string;
  coverImage: string;
  uploadedImages: string[];
  submissionDate: string;
  status: 'pending' | 'published' | 'rejected';
  registrationSettings: string;
}

// ── Initial Mock Data ────────────────────────────────────────────────────────
const INITIAL_MOCK_EVENTS: EventItem[] = [
  {
    id: 'evt-201',
    title: 'Gluten-Free Baking Masterclass',
    organizerName: 'Marc G. Baker',
    organizerBusiness: 'Gluten-Free Oasis Bakery',
    category: 'Food & Cooking',
    eventType: 'in_person',
    eventDate: '2026-07-28',
    eventTime: '10:00 - 13:00',
    location: '12 Rue des Boulangers, Lyon, France',
    capacity: 15,
    priceType: 'paid',
    price: 45,
    description: 'Learn the secrets of baking delicious gluten-free sourdough bread and french pastries. This hands-on workshop covers flour selections, proofing, and baking techniques in a fully certified gluten-free kitchen.',
    coverImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
    uploadedImages: [
      'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=200',
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200',
    ],
    submissionDate: '2026-07-20',
    status: 'pending',
    registrationSettings: 'Requires approval, deadline 2026-07-26',
  },
  {
    id: 'evt-202',
    title: 'Celiac Diet & Nutrition Seminar',
    organizerName: 'Dr. Sophia Martinez',
    organizerBusiness: 'NutriHealth Autoimmune Clinic',
    category: 'Health & Wellness',
    eventType: 'online',
    eventDate: '2026-08-05',
    eventTime: '18:00 - 19:30',
    location: 'Zoom Webinar',
    meetingUrl: 'https://zoom.us/j/9876543210',
    capacity: 100,
    priceType: 'free',
    description: 'An informative online session discussing the clinical aspects of celiac disease management, cross-contamination prevention, and maintaining a balanced, nutrient-dense gluten-free diet.',
    coverImage: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400',
    uploadedImages: [
      'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=200',
    ],
    submissionDate: '2026-07-19',
    status: 'pending',
    registrationSettings: 'Open registration, automatic approval',
  },
  {
    id: 'evt-203',
    title: 'Gluten-Free Food Festival Paris',
    organizerName: 'Alice Dubois',
    organizerBusiness: 'Organic Delights Co.',
    category: 'Festival & Socials',
    eventType: 'in_person',
    eventDate: '2026-09-12',
    eventTime: '11:00 - 20:00',
    location: 'Parc des Expositions, Paris, France',
    capacity: 500,
    priceType: 'paid',
    price: 10,
    description: 'The annual festival bringing together the best gluten-free manufacturers, bakeries, and chefs in France. Enjoy live cooking demonstrations, product tastings, and specialized retail booths.',
    coverImage: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400',
    uploadedImages: [
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200',
    ],
    submissionDate: '2026-07-15',
    status: 'published',
    registrationSettings: 'Ticket purchasing required',
  },
];

export default function AdminEventsScreen() {
  const { theme: C, isDark } = useTheme();
  const { t, isRTL } = useLanguage();
  const navigation = useNavigation<any>();
  const { width: windowWidth } = useWindowDimensions();

  const { isAuthenticated, isInitialized, user } = useAuth();

  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated) {
        navigation.navigate('Login');
      } else if (user?.profileType !== 'admin') {
        navigation.navigate('Home');
      }
    }
  }, [isInitialized, isAuthenticated, user, navigation]);

  if (!isInitialized || !isAuthenticated || user?.profileType !== 'admin') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg }}>
        <ActivityIndicator size="large" color="#8BC34A" />
      </View>
    );
  }

  const numColumns = useMemo(() => {
    if (windowWidth > 1100) return 3;
    if (windowWidth > 700) return 2;
    return 1;
  }, [windowWidth]);

  // ── States ─────────────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'published' | 'rejected'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // Submission date sorting

  // Modal Visibility States
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [isApproveVisible, setIsApproveVisible] = useState(false);
  const [isRejectVisible, setIsRejectVisible] = useState(false);
  const [isDeleteVisible, setIsDeleteVisible] = useState(false);

  // Rejection Form
  const [rejectionReason, setRejectionReason] = useState('');

  // Reusable Toast State
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // ── Simulate Initial Load ──────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setEvents(INITIAL_MOCK_EVENTS);
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────
  const triggerToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
    }, 2500);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      triggerToast(t('Events list refreshed') || 'Events list refreshed');
    }, 800);
  };

  const handleViewDetails = (event: EventItem) => {
    setSelectedEvent(event);
    setIsDetailsVisible(true);
  };

  const handleOpenApprove = (event: EventItem) => {
    setSelectedEvent(event);
    setIsApproveVisible(true);
  };

  const handleConfirmApprove = () => {
    if (selectedEvent) {
      setEvents((prev) =>
        prev.map((e) => (e.id === selectedEvent.id ? { ...e, status: 'published' as const } : e))
      );
      setIsApproveVisible(false);
      setIsDetailsVisible(false);
      triggerToast(t('Event approved successfully. The event is now published.') || 'Event approved successfully. The event is now published.');
    }
  };

  const handleOpenReject = (event: EventItem) => {
    setSelectedEvent(event);
    setRejectionReason('');
    setIsRejectVisible(true);
  };

  const handleConfirmReject = () => {
    if (selectedEvent) {
      setEvents((prev) =>
        prev.map((e) => (e.id === selectedEvent.id ? { ...e, status: 'rejected' as const } : e))
      );
      setIsRejectVisible(false);
      setIsDetailsVisible(false);
      triggerToast(t('Event rejected successfully.') || 'Event rejected successfully.');
    }
  };

  const handleOpenDelete = (event: EventItem) => {
    setSelectedEvent(event);
    setIsDeleteVisible(true);
  };

  const handleConfirmDelete = () => {
    if (selectedEvent) {
      setEvents((prev) => prev.filter((e) => e.id !== selectedEvent.id));
      setIsDeleteVisible(false);
      setIsDetailsVisible(false);
      triggerToast(t('Event deleted successfully.') || 'Event deleted successfully.');
    }
  };

  const handlePlaceholderEdit = () => {
    triggerToast(t('Edit is a placeholder. Action not available.') || 'Edit is a placeholder. Action not available.');
  };

  const toggleSort = () => {
    setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    triggerToast(sortOrder === 'desc' ? t('Sorting oldest first') : t('Sorting newest first'));
  };

  // ── Calculated Statistics ──────────────────────────────────────────────────
  const stats = useMemo(() => {
    return {
      total: events.length,
      pending: events.filter((e) => e.status === 'pending').length,
      published: events.filter((e) => e.status === 'published').length,
      rejected: events.filter((e) => e.status === 'rejected').length,
    };
  }, [events]);

  // ── Filtered & Sorted Events List ──────────────────────────────────────────
  const filteredEvents = useMemo(() => {
    let result = [...events];

    // Filter status tab
    if (activeFilter !== 'all') {
      result = result.filter((e) => e.status === activeFilter);
    }

    // Filter search text
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.organizerName.toLowerCase().includes(q) ||
          e.organizerBusiness.toLowerCase().includes(q)
      );
    }

    // Sort by submission Date
    result.sort((a, b) => {
      const dateA = new Date(a.submissionDate).getTime();
      const dateB = new Date(b.submissionDate).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [events, activeFilter, searchQuery, sortOrder]);

  // ── Styles (Minimalist, Chic & Monochrome) ─────────────────────────────────
  const s = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.bg,
    },
    listContent: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 40,
    },
    // Top Overview Stats Row
    statsRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 20,
    },
    statCard: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: C.surface,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: C.border,
    },
    statLabel: {
      fontFamily: F.semibold,
      fontSize: 10,
      color: C.textMuted,
      marginBottom: 4,
      textTransform: 'uppercase',
      textAlign: isRTL ? 'right' : 'left',
    },
    statValue: {
      fontFamily: F.bold,
      fontSize: 20,
      color: C.text,
      textAlign: isRTL ? 'right' : 'left',
    },
    // Filter controls, Search & Sort
    controlPanel: {
      backgroundColor: C.surface,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
      paddingVertical: 14,
      paddingHorizontal: 20,
      gap: 12,
    },
    searchRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 8,
    },
    searchWrapper: {
      flex: 1,
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: C.inputBorder,
      borderRadius: 8,
      backgroundColor: C.inputBg,
      paddingHorizontal: 10,
      height: 38,
    },
    searchInput: {
      flex: 1,
      fontFamily: F.regular,
      fontSize: 12,
      color: C.text,
      textAlign: isRTL ? 'right' : 'left',
      paddingVertical: 0,
    },
    iconBtn: {
      width: 38,
      height: 38,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: C.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.surface,
    },
    filterScroll: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: 6,
    },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: C.surfaceAlt,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    filterChipActive: {
      backgroundColor: 'transparent',
      borderColor: C.text,
    },
    filterChipText: {
      fontFamily: F.semibold,
      fontSize: 11,
      color: C.textSub,
    },
    filterChipTextActive: {
      color: C.text,
    },
    // Card styling
    card: {
      backgroundColor: C.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.border,
      marginBottom: 16,
      overflow: 'hidden',
      flex: 1,
      marginHorizontal: numColumns > 1 ? 8 : 0,
      maxWidth: numColumns > 1 ? (windowWidth - 40) / numColumns - 16 : '100%',
    },
    coverImg: {
      width: '100%',
      height: 140,
      backgroundColor: C.surfaceAlt,
    },
    cardBody: {
      padding: 16,
    },
    cardHeader: {
      marginBottom: 12,
    },
    eventTitle: {
      fontFamily: F.bold,
      fontSize: 15,
      color: C.text,
      lineHeight: 20,
      marginBottom: 4,
      textAlign: isRTL ? 'right' : 'left',
    },
    organizerLabel: {
      fontFamily: F.regular,
      fontSize: 11,
      color: C.textMuted,
      textAlign: isRTL ? 'right' : 'left',
    },
    organizerBold: {
      fontFamily: F.semibold,
      color: C.textSub,
    },
    tagRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 12,
    },
    tag: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: C.surfaceAlt,
    },
    tagText: {
      fontFamily: F.semibold,
      fontSize: 10,
      color: C.textSub,
    },
    statusBadgePending: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: C.border,
    },
    statusBadgePendingText: {
      color: C.textMuted,
    },
    statusBadgePublished: {
      backgroundColor: C.surfaceAlt,
      borderWidth: 0,
    },
    statusBadgePublishedText: {
      color: C.text,
    },
    statusBadgeRejected: {
      backgroundColor: C.surfaceAlt,
      borderWidth: 0,
    },
    statusBadgeRejectedText: {
      color: C.textMuted,
      textDecorationLine: 'line-through',
    },
    // Detail info lines
    detailsBox: {
      borderTopWidth: 1,
      borderTopColor: C.divider,
      paddingTop: 12,
      gap: 8,
      marginBottom: 14,
    },
    detailItem: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 8,
    },
    detailText: {
      fontFamily: F.regular,
      fontSize: 11,
      color: C.textSub,
      flex: 1,
      textAlign: isRTL ? 'right' : 'left',
    },
    // Actions grid
    actionsRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    actionBtn: {
      flex: 1,
      minWidth: '45%',
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 8,
      paddingVertical: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionBtnText: {
      fontFamily: F.semibold,
      fontSize: 11,
      color: C.textSub,
    },
    actionBtnPrimary: {
      backgroundColor: C.text,
      borderColor: C.text,
    },
    actionBtnPrimaryText: {
      color: C.white,
    },
    // Empty state
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      paddingVertical: 50,
    },
    emptyIconWrap: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: C.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      borderWidth: 1,
      borderColor: C.border,
    },
    emptyTitle: {
      fontFamily: F.bold,
      fontSize: 14,
      color: C.text,
      textAlign: 'center',
      marginBottom: 6,
    },
    emptyDesc: {
      fontFamily: F.regular,
      fontSize: 12,
      color: C.textMuted,
      textAlign: 'center',
    },
    // Skeleton
    skeletonCard: {
      backgroundColor: C.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.border,
      marginBottom: 16,
      padding: 16,
      gap: 12,
    },
    // Modals
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      width: '92%',
      maxHeight: '85%',
      backgroundColor: C.surface,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: C.border,
    },
    modalHeader: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: C.divider,
    },
    modalTitle: {
      fontFamily: F.bold,
      fontSize: 15,
      color: C.text,
    },
    modalCloseBtn: {
      padding: 4,
    },
    modalScroll: {
      padding: 20,
    },
    detailCover: {
      width: '100%',
      height: 160,
      borderRadius: 10,
      marginBottom: 16,
      backgroundColor: C.surfaceAlt,
    },
    detailDesc: {
      fontFamily: F.regular,
      fontSize: 12,
      color: C.text,
      lineHeight: 18,
      marginBottom: 16,
      textAlign: isRTL ? 'right' : 'left',
    },
    sectionTitle: {
      fontFamily: F.bold,
      fontSize: 13,
      color: C.text,
      marginTop: 14,
      marginBottom: 8,
      textAlign: isRTL ? 'right' : 'left',
    },
    sectionCard: {
      backgroundColor: C.surfaceAlt,
      borderRadius: 10,
      padding: 12,
      gap: 8,
      marginBottom: 8,
    },
    sectionRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'flex-start',
      gap: 6,
    },
    sectionLabel: {
      fontFamily: F.semibold,
      fontSize: 11,
      color: C.textMuted,
      width: 100,
      textAlign: isRTL ? 'right' : 'left',
    },
    sectionValue: {
      fontFamily: F.regular,
      fontSize: 12,
      color: C.text,
      flex: 1,
      textAlign: isRTL ? 'right' : 'left',
    },
    imageGrid: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 20,
    },
    gridImage: {
      width: (width - 72) / 3,
      height: 70,
      borderRadius: 6,
      backgroundColor: C.surfaceAlt,
    },
    // Footer Modal
    modalFooter: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: C.divider,
      backgroundColor: C.surface,
      gap: 12,
    },
    rejectBtn: {
      flex: 1,
      backgroundColor: 'transparent',
      borderColor: C.border,
      borderWidth: 1,
      borderRadius: 8,
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rejectBtnText: {
      fontFamily: F.semibold,
      fontSize: 13,
      color: C.textSub,
    },
    approveBtn: {
      flex: 1,
      backgroundColor: C.text,
      borderRadius: 8,
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    approveBtnText: {
      fontFamily: F.semibold,
      fontSize: 13,
      color: C.white,
    },
    // Confirm dialogue modals
    confirmContainer: {
      width: '88%',
      backgroundColor: C.surface,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: C.border,
    },
    confirmFooter: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: 10,
      marginTop: 16,
    },
    confirmBtnCancel: {
      flex: 1,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 8,
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmBtnCancelText: {
      fontFamily: F.semibold,
      fontSize: 13,
      color: C.textSub,
    },
    confirmBtnApprove: {
      flex: 1.3,
      backgroundColor: C.text,
      borderRadius: 8,
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmBtnApproveText: {
      fontFamily: F.semibold,
      fontSize: 13,
      color: C.white,
    },
    confirmBtnReject: {
      flex: 1.3,
      backgroundColor: C.text,
      borderRadius: 8,
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmBtnRejectText: {
      fontFamily: F.semibold,
      fontSize: 13,
      color: C.white,
    },
    confirmHeader: {
      alignItems: 'center',
      marginBottom: 16,
    },
    confirmIconBg: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: C.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    confirmTitleText: {
      fontFamily: F.bold,
      fontSize: 15,
      color: C.text,
      textAlign: 'center',
    },
    confirmBodyText: {
      fontFamily: F.regular,
      fontSize: 12,
      color: C.textSub,
      textAlign: 'center',
      marginTop: 4,
      lineHeight: 18,
    },
    formField: {
      marginBottom: 12,
    },
    formLabel: {
      fontFamily: F.semibold,
      fontSize: 11,
      color: C.textSub,
      marginBottom: 6,
      textAlign: isRTL ? 'right' : 'left',
    },
    textarea: {
      borderWidth: 1,
      borderColor: C.inputBorder,
      borderRadius: 8,
      backgroundColor: C.inputBg,
      padding: 12,
      fontFamily: F.regular,
      fontSize: 13,
      color: C.text,
      textAlign: isRTL ? 'right' : 'left',
      minHeight: 70,
      textAlignVertical: 'top',
    },
    // Reusable Minimal Toast
    toastOverlay: {
      position: 'absolute',
      bottom: 40,
      left: 20,
      right: 20,
      backgroundColor: C.text,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      zIndex: 9999,
      elevation: 5,
      borderWidth: 1,
      borderColor: C.divider,
    },
    toastText: {
      fontFamily: F.semibold,
      fontSize: 12,
      color: C.white,
    },
  }), [C, isRTL, isDark]);

  // ── Render Helpers ─────────────────────────────────────────────────────────
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <View style={[s.tag, s.statusBadgePublished]}>
            <Text style={[s.tagText, s.statusBadgePublishedText]}>{t('Published') || 'Published'}</Text>
          </View>
        );
      case 'rejected':
        return (
          <View style={[s.tag, s.statusBadgeRejected]}>
            <Text style={[s.tagText, s.statusBadgeRejectedText]}>{t('Rejected') || 'Rejected'}</Text>
          </View>
        );
      default:
        return (
          <View style={[s.tag, s.statusBadgePending]}>
            <Text style={[s.tagText, s.statusBadgePendingText]}>{t('Pending Approval') || 'Pending Approval'}</Text>
          </View>
        );
    }
  };

  const renderCardItem = ({ item }: { item: EventItem }) => {
    return (
      <View style={s.card}>
        {item.coverImage ? (
          <Image source={{ uri: item.coverImage }} style={s.coverImg} />
        ) : (
          <View style={[s.coverImg, { justifyContent: 'center', alignItems: 'center' }]}>
            <MaterialCommunityIcons name="image-outline" size={32} color={C.textMuted} />
          </View>
        )}
        <View style={s.cardBody}>
          <View style={s.cardHeader}>
            <Text style={s.eventTitle}>{item.title}</Text>
            <Text style={s.organizerLabel}>
              {t('Organizer') || 'Organizer'}: <Text style={s.organizerBold}>{item.organizerName}</Text> ({item.organizerBusiness})
            </Text>
          </View>

          {/* Tags */}
          <View style={s.tagRow}>
            <View style={s.tag}>
              <Text style={s.tagText}>{item.category}</Text>
            </View>
            <View style={s.tag}>
              <Text style={s.tagText}>
                {item.eventType === 'online' ? t('Online') || 'Online' : t('In-Person') || 'In-Person'}
              </Text>
            </View>
            {renderStatusBadge(item.status)}
          </View>

          {/* Details */}
          <View style={s.detailsBox}>
            <View style={s.detailItem}>
              <MaterialCommunityIcons name="clock-outline" size={13} color={C.textMuted} />
              <Text style={s.detailText}>{item.eventDate} • {item.eventTime}</Text>
            </View>
            <View style={s.detailItem}>
              <MaterialCommunityIcons name="map-marker-outline" size={13} color={C.textMuted} />
              <Text style={s.detailText} numberOfLines={1}>{item.location}</Text>
            </View>
            <View style={s.detailItem}>
              <MaterialCommunityIcons name="currency-eur" size={13} color={C.textMuted} />
              <Text style={s.detailText}>
                {item.priceType === 'free' ? t('Free') || 'Free' : `€${item.price}`} • {t('Capacity') || 'Capacity'}: {item.capacity}
              </Text>
            </View>
          </View>

          {/* Buttons Layout */}
          <View style={s.actionsRow}>
            <TouchableOpacity
              style={s.actionBtn}
              onPress={() => handleViewDetails(item)}
            >
              <Text style={s.actionBtnText}>{t('View Details') || 'Details'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.actionBtn}
              onPress={handlePlaceholderEdit}
            >
              <Text style={s.actionBtnText}>{t('Edit') || 'Edit'}</Text>
            </TouchableOpacity>

            {item.status === 'pending' && (
              <>
                <TouchableOpacity
                  style={[s.actionBtn, s.actionBtnPrimary]}
                  onPress={() => handleOpenApprove(item)}
                >
                  <Text style={[s.actionBtnText, s.actionBtnPrimaryText]}>{t('Approve') || 'Approve'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.actionBtn}
                  onPress={() => handleOpenReject(item)}
                >
                  <Text style={s.actionBtnText}>{t('Reject') || 'Reject'}</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={s.actionBtn}
              onPress={() => handleOpenDelete(item)}
            >
              <Text style={s.actionBtnText}>{t('Delete') || 'Delete'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderSkeleton = () => (
    <View style={s.skeletonCard}>
      <SkeletonLoader width="100%" height={140} borderRadius={10} />
      <SkeletonLoader width="70%" height={16} borderRadius={4} style={{ marginTop: 8 }} />
      <SkeletonLoader width="40%" height={12} borderRadius={4} />
      <View style={{ flexDirection: 'row', gap: 6, marginVertical: 6 }}>
        <SkeletonLoader width={80} height={20} borderRadius={6} />
        <SkeletonLoader width={80} height={20} borderRadius={6} />
      </View>
      <View style={{ borderTopWidth: 1, borderTopColor: C.border, paddingTop: 10, gap: 6 }}>
        <SkeletonLoader width="50%" height={10} borderRadius={4} />
        <SkeletonLoader width="40%" height={10} borderRadius={4} />
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <SkeletonLoader width="30%" height={32} borderRadius={6} />
        <SkeletonLoader width="30%" height={32} borderRadius={6} />
        <SkeletonLoader width="30%" height={32} borderRadius={6} />
      </View>
    </View>
  );

  return (
    <AppScaffold
      title={t('Events Management') || 'Events Management'}
      activeTab="profile"
      onBack={() => navigation.goBack()}
      showBottomNav={false}
      fullWidth={true}
    >
      <View style={s.container}>
        {/* Pinned Header Controls */}
        <View style={s.controlPanel}>
          <View style={s.searchRow}>
            <View style={s.searchWrapper}>
              <MaterialCommunityIcons name="magnify" size={16} color={C.textMuted} style={{ marginRight: 6 }} />
              <TextInput
                style={s.searchInput}
                placeholder={t('Search by title, organizer...') || 'Search title, organizer...'}
                placeholderTextColor={C.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity style={s.iconBtn} onPress={toggleSort}>
              <MaterialCommunityIcons
                name={sortOrder === 'desc' ? 'sort-calendar-descending' : 'sort-calendar-ascending'}
                size={18}
                color={C.text}
              />
            </TouchableOpacity>
            <TouchableOpacity style={s.iconBtn} onPress={handleRefresh}>
              <MaterialCommunityIcons name="refresh" size={18} color={C.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.filterScroll}
          >
            {[
              { key: 'all', label: t('All Events') || 'All Events' },
              { key: 'pending', label: t('Pending Approval') || 'Pending' },
              { key: 'published', label: t('Published') || 'Published' },
              { key: 'rejected', label: t('Rejected') || 'Rejected' },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[s.filterChip, activeFilter === tab.key && s.filterChipActive]}
                onPress={() => setActiveFilter(tab.key as any)}
              >
                <Text style={[s.filterChipText, activeFilter === tab.key && s.filterChipTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {isLoading ? (
          <ScrollView contentContainerStyle={s.listContent} showsVerticalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 }}>
              {Array.from({ length: numColumns * 2 }).map((_, i) => (
                <View key={i} style={[s.skeletonCard, { flex: 1, minWidth: numColumns > 1 ? '45%' : '100%', maxWidth: numColumns > 1 ? (windowWidth - 40) / numColumns - 16 : '100%', marginHorizontal: numColumns > 1 ? 8 : 0 }]}>
                  <SkeletonLoader width="100%" height={140} borderRadius={10} />
                  <SkeletonLoader width="70%" height={16} borderRadius={4} style={{ marginTop: 8 }} />
                  <SkeletonLoader width="40%" height={12} borderRadius={4} />
                  <View style={{ flexDirection: 'row', gap: 6, marginVertical: 6 }}>
                    <SkeletonLoader width={80} height={20} borderRadius={6} />
                    <SkeletonLoader width={80} height={20} borderRadius={6} />
                  </View>
                  <View style={{ borderTopWidth: 1, borderTopColor: C.border, paddingTop: 10, gap: 6 }}>
                    <SkeletonLoader width="50%" height={10} borderRadius={4} />
                    <SkeletonLoader width="40%" height={10} borderRadius={4} />
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        ) : (
          <FlatList
            key={`list-cols-${numColumns}`}
            data={filteredEvents}
            numColumns={numColumns}
            keyExtractor={(item) => item.id}
            renderItem={renderCardItem}
            contentContainerStyle={s.listContent}
            columnWrapperStyle={numColumns > 1 ? { gap: 16 } : undefined}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={s.emptyContainer}>
                <View style={s.emptyIconWrap}>
                  <MaterialCommunityIcons name="calendar-blank-outline" size={36} color={C.textMuted} />
                </View>
                <Text style={s.emptyTitle}>
                  {activeFilter === 'pending'
                    ? t('No events awaiting approval.') || 'No events awaiting approval.'
                    : t('No events available.') || 'No events available.'}
                </Text>
                <Text style={s.emptyDesc}>
                  {t('Check back later or try adjusting your active filters.') || 'Check back later or try adjusting your active filters.'}
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* ── Modal: Event Details (View Details) ───────────────────────────── */}
      <Modal
        visible={isDetailsVisible && !!selectedEvent}
        animationType="slide"
        transparent
        onRequestClose={() => setIsDetailsVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContainer}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{t('Event Details') || 'Event Details'}</Text>
              <TouchableOpacity onPress={() => setIsDetailsVisible(false)} style={s.modalCloseBtn}>
                <MaterialCommunityIcons name="close" size={20} color={C.text} />
              </TouchableOpacity>
            </View>

            {selectedEvent && (
              <ScrollView style={s.modalScroll} showsVerticalScrollIndicator={false}>
                {selectedEvent.coverImage ? (
                  <Image source={{ uri: selectedEvent.coverImage }} style={s.detailCover} />
                ) : null}

                <Text style={[s.eventTitle, { fontSize: 16 }]} numberOfLines={2}>
                  {selectedEvent.title}
                </Text>

                <View style={[s.tagRow, { marginVertical: 8 }]}>
                  <View style={s.tag}>
                    <Text style={s.tagText}>{selectedEvent.category}</Text>
                  </View>
                  <View style={s.tag}>
                    <Text style={s.tagText}>
                      {selectedEvent.eventType === 'online' ? t('Online') || 'Online' : t('In-Person') || 'In-Person'}
                    </Text>
                  </View>
                  {renderStatusBadge(selectedEvent.status)}
                </View>

                <Text style={s.detailDesc}>{selectedEvent.description}</Text>

                {/* Organizer Info */}
                <Text style={s.sectionTitle}>{t('Organizer Information') || 'Organizer Information'}</Text>
                <View style={s.sectionCard}>
                  <View style={s.sectionRow}>
                    <Text style={s.sectionLabel}>{t('Organizer') || 'Name'}</Text>
                    <Text style={s.sectionValue}>{selectedEvent.organizerName}</Text>
                  </View>
                  <View style={s.sectionRow}>
                    <Text style={s.sectionLabel}>{t('Business') || 'Business'}</Text>
                    <Text style={s.sectionValue}>{selectedEvent.organizerBusiness}</Text>
                  </View>
                </View>

                {/* Event Settings */}
                <Text style={s.sectionTitle}>{t('Date, Price & Venue') || 'Date, Price & Venue'}</Text>
                <View style={s.sectionCard}>
                  <View style={s.sectionRow}>
                    <Text style={s.sectionLabel}>{t('Date & Time') || 'Schedule'}</Text>
                    <Text style={s.sectionValue}>{selectedEvent.eventDate} @ {selectedEvent.eventTime}</Text>
                  </View>
                  <View style={s.sectionRow}>
                    <Text style={s.sectionLabel}>{t('Registration') || 'Registration'}</Text>
                    <Text style={s.sectionValue}>{selectedEvent.priceType === 'free' ? t('Free Event') || 'Free' : `Paid (€${selectedEvent.price})`}</Text>
                  </View>
                  <View style={s.sectionRow}>
                    <Text style={s.sectionLabel}>{t('Capacity Limit') || 'Capacity Limit'}</Text>
                    <Text style={s.sectionValue}>{selectedEvent.capacity} {t('participants') || 'participants'}</Text>
                  </View>

                  {selectedEvent.eventType === 'online' ? (
                    <View style={s.sectionRow}>
                      <Text style={s.sectionLabel}>{t('Meeting Link') || 'Meeting Link'}</Text>
                      <Text style={[s.sectionValue, { color: C.textSub, textDecorationLine: 'underline' }]} numberOfLines={1}>
                        {selectedEvent.meetingUrl || 'https://zoom.us/webinar/placeholder'}
                      </Text>
                    </View>
                  ) : (
                    <View style={s.sectionRow}>
                      <Text style={s.sectionLabel}>{t('Address') || 'Address'}</Text>
                      <Text style={s.sectionValue}>{selectedEvent.location}</Text>
                    </View>
                  )}
                  <View style={s.sectionRow}>
                    <Text style={s.sectionLabel}>{t('Submission') || 'Submitted'}</Text>
                    <Text style={s.sectionValue}>{selectedEvent.submissionDate}</Text>
                  </View>
                </View>

                {/* Uploaded Images */}
                {selectedEvent.uploadedImages && selectedEvent.uploadedImages.length > 0 ? (
                  <View>
                    <Text style={s.sectionTitle}>{t('Uploaded Images') || 'Uploaded Media'}</Text>
                    <View style={s.imageGrid}>
                      {selectedEvent.uploadedImages.map((imgUrl, i) => (
                        <Image key={i} source={{ uri: imgUrl }} style={s.gridImage} />
                      ))}
                    </View>
                  </View>
                ) : null}
              </ScrollView>
            )}

            {/* Actions Footer */}
            {selectedEvent && (
              <View style={s.modalFooter}>
                <TouchableOpacity style={s.rejectBtn} onPress={() => handleOpenDelete(selectedEvent)}>
                  <Text style={s.rejectBtnText}>{t('Delete') || 'Delete'}</Text>
                </TouchableOpacity>

                {selectedEvent.status === 'pending' ? (
                  <>
                    <TouchableOpacity style={s.rejectBtn} onPress={() => handleOpenReject(selectedEvent)}>
                      <Text style={s.rejectBtnText}>{t('Reject') || 'Reject'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.approveBtn} onPress={() => handleOpenApprove(selectedEvent)}>
                      <Text style={s.approveBtnText}>{t('Approve') || 'Approve'}</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity style={[s.approveBtn, { backgroundColor: C.surfaceAlt }]} onPress={() => setIsDetailsVisible(false)}>
                    <Text style={[s.approveBtnText, { color: C.text }]}>{t('Close') || 'Close'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Modal: Approve confirmation dialog ────────────────────────────── */}
      <Modal
        visible={isApproveVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setIsApproveVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.confirmContainer}>
            <View style={s.confirmHeader}>
              <View style={s.confirmIconBg}>
                <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={24} color={C.text} />
              </View>
              <Text style={s.confirmTitleText}>{t('Publish Event?') || 'Approve & Publish'}</Text>
              <Text style={s.confirmBodyText}>
                {t('Approve this event and publish it on the mobile application?') || 'Approve this event and publish it on the mobile application?'}
              </Text>
            </View>
            <View style={s.confirmFooter}>
              <TouchableOpacity style={s.confirmBtnCancel} onPress={() => setIsApproveVisible(false)}>
                <Text style={s.confirmBtnCancelText}>{t('Cancel') || 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.confirmBtnApprove} onPress={handleConfirmApprove}>
                <Text style={s.confirmBtnApproveText}>{t('Approve & Publish') || 'Approve & Publish'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal: Reject confirmation dialog ────────────────────────────── */}
      <Modal
        visible={isRejectVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setIsRejectVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.confirmContainer}>
            <View style={s.confirmHeader}>
              <View style={s.confirmIconBg}>
                <MaterialCommunityIcons name="close-circle-outline" size={24} color={C.text} />
              </View>
              <Text style={s.confirmTitleText}>{t('Reject Event?') || 'Reject Event'}</Text>
              <Text style={s.confirmBodyText}>
                {t('Provide an optional rejection reason. The organizer will be notified.') || 'Provide an optional rejection reason. The organizer will be notified.'}
              </Text>
            </View>

            <View style={s.formField}>
              <Text style={s.formLabel}>{t('Rejection Reason (Optional)') || 'Reason'}</Text>
              <TextInput
                style={s.textarea}
                multiline
                numberOfLines={3}
                placeholder={t('Type the reason here...') || 'Type feedback here...'}
                placeholderTextColor={C.textMuted}
                value={rejectionReason}
                onChangeText={setRejectionReason}
              />
            </View>

            <View style={s.confirmFooter}>
              <TouchableOpacity style={s.confirmBtnCancel} onPress={() => setIsRejectVisible(false)}>
                <Text style={s.confirmBtnCancelText}>{t('Cancel') || 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.confirmBtnReject} onPress={handleConfirmReject}>
                <Text style={s.confirmBtnRejectText}>{t('Reject Event') || 'Reject Event'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal: Delete confirmation dialog ────────────────────────────── */}
      <Modal
        visible={isDeleteVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setIsDeleteVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.confirmContainer}>
            <View style={s.confirmHeader}>
              <View style={s.confirmIconBg}>
                <MaterialCommunityIcons name="delete-outline" size={24} color={C.text} />
              </View>
              <Text style={s.confirmTitleText}>{t('Delete Event?') || 'Permanently Delete'}</Text>
              <Text style={s.confirmBodyText}>
                {t('Are you sure you want to permanently delete this event?') || 'Are you sure you want to permanently delete this event?'}
              </Text>
            </View>
            <View style={s.confirmFooter}>
              <TouchableOpacity style={s.confirmBtnCancel} onPress={() => setIsDeleteVisible(false)}>
                <Text style={s.confirmBtnCancelText}>{t('Cancel') || 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.confirmBtnReject} onPress={handleConfirmDelete}>
                <Text style={s.confirmBtnRejectText}>{t('Delete') || 'Delete'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Reusable Monochromatic Action Toast ────────────────────────────── */}
      {toastVisible && (
        <View style={s.toastOverlay}>
          <MaterialCommunityIcons name="information-outline" size={16} color={C.white} />
          <Text style={s.toastText}>{toastMessage}</Text>
        </View>
      )}
    </AppScaffold>
  );
}
