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
  ActivityIndicator,
  FlatList,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/shared/context/theme.context';
import { useLanguage } from '@/shared/context/language.context';
import { AppScaffold } from '@/shared/components/AppScaffold';
import { SkeletonLoader } from '@/shared/components/SkeletonLoader';

const { width, height } = Dimensions.get('window');

const F = {
  regular: 'Poppins_400Regular',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
};

// ── Mock Data Definition ─────────────────────────────────────────────────────
interface DocumentItem {
  id: string;
  name: string;
  type: string;
  fileSize: string;
}

interface Application {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  profileType: 'pro_health' | 'pro_commerce';
  registrationDate: string;
  avatarUrl: string | null;
  status: 'pending' | 'approved' | 'rejected';
  personalInfo: {
    bio: string;
    address: string;
    city: string;
    country: string;
  };
  medicalInfo?: {
    specialty: string;
    clinicName: string;
    licenseNumber: string;
    experienceYears: number;
  };
  businessInfo?: {
    companyName: string;
    taxId: string;
    registrationNumber: string;
    businessType: string;
  };
  documents: DocumentItem[];
}

const INITIAL_MOCK_APPLICATIONS: Application[] = [
  {
    id: 'app-101',
    fullName: 'Dr. Sophia Martinez',
    email: 's.martinez@celiacdietetics.org',
    phone: '+33 6 1234 5678',
    profileType: 'pro_health',
    registrationDate: '2026-07-18',
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150',
    status: 'pending',
    personalInfo: {
      bio: 'Specializing in autoimmune disorders, food intolerances, and gluten-free dietary plans with over 8 years of clinical experience in gastroenterology dietetics.',
      address: '45 Avenue de la République',
      city: 'Paris',
      country: 'France',
    },
    medicalInfo: {
      specialty: 'Clinical Dietitian & Celiac Specialist',
      clinicName: 'NutriHealth Autoimmune Clinic',
      licenseNumber: 'RPPS-987654321',
      experienceYears: 8,
    },
    documents: [
      { id: 'doc-1', name: 'medical_diploma_sorbonne.pdf', type: 'Medical Diploma', fileSize: '2.4 MB' },
      { id: 'doc-2', name: 'national_dietetic_license.pdf', type: 'Professional License', fileSize: '1.8 MB' },
      { id: 'doc-3', name: 'identity_verification_passport.pdf', type: 'ID Proof (Passport)', fileSize: '3.1 MB' },
    ],
  },
  {
    id: 'app-102',
    fullName: 'Marc G. Baker',
    email: 'm.baker@glutenfreeoasis.com',
    phone: '+33 7 9876 5432',
    profileType: 'pro_commerce',
    registrationDate: '2026-07-19',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    status: 'pending',
    personalInfo: {
      bio: 'Founder and Lead Baker of Gluten-Free Oasis. Dedicated to crafting artisanal, certified gluten-free breads, sourdoughs, and fine pastries. Our kitchen is 100% gluten-free certified.',
      address: '12 Rue des Boulangers',
      city: 'Lyon',
      country: 'France',
    },
    businessInfo: {
      companyName: 'Gluten-Free Oasis Bakery',
      taxId: 'FR-889988991',
      registrationNumber: 'SIRET-12345678900012',
      businessType: 'Dedicated Gluten-Free Bakery & Retailer',
    },
    documents: [
      { id: 'doc-4', name: 'chamber_of_commerce_registration.pdf', type: 'Kbis / Business Registration', fileSize: '1.2 MB' },
      { id: 'doc-5', name: 'gluten_free_kitchen_certification.pdf', type: 'Gluten-Free Lab Certification', fileSize: '2.9 MB' },
      { id: 'doc-6', name: 'food_safety_hygiene_permit.pdf', type: 'Food Safety Permit', fileSize: '1.5 MB' },
    ],
  },
];

export default function AdminVerificationScreen() {
  const { theme: C, isDark } = useTheme();
  const { t, isRTL } = useLanguage();
  const navigation = useNavigation<any>();

  // ── States ─────────────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  // Modal Visibility States
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [isApproveVisible, setIsApproveVisible] = useState(false);
  const [isRejectVisible, setIsRejectVisible] = useState(false);
  const [isDocViewerVisible, setIsDocViewerVisible] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);

  // Form States
  const [tempPassword, setTempPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Notification States
  const [successDialogVisible, setSuccessDialogVisible] = useState(false);
  const [successDialogTitle, setSuccessDialogTitle] = useState('');
  const [successDialogMessage, setSuccessDialogMessage] = useState('');

  // Password Visibility State
  const [showPassword, setShowPassword] = useState(false);

  // ── Simulation of Data Load ────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setApplications(INITIAL_MOCK_APPLICATIONS);
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleViewApplication = (app: Application) => {
    setSelectedApp(app);
    setIsDetailsVisible(true);
  };

  const handleOpenApprove = () => {
    setTempPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setIsApproveVisible(true);
  };

  const handleConfirmApprove = () => {
    if (!tempPassword) {
      setPasswordError(t('Password is required'));
      return;
    }
    if (tempPassword.length < 6) {
      setPasswordError(t('Password must be at least 6 characters'));
      return;
    }
    if (tempPassword !== confirmPassword) {
      setPasswordError(t('Passwords do not match'));
      return;
    }

    // Success confirmation
    setIsApproveVisible(false);
    setIsDetailsVisible(false);

    if (selectedApp) {
      const applicantName = selectedApp.fullName;
      // Remove from list
      setApplications((prev) => prev.filter((app) => app.id !== selectedApp.id));
      
      // Open success notifications
      setSuccessDialogTitle(t('Professional account approved'));
      setSuccessDialogMessage(
        `${applicantName} (${selectedApp.profileType === 'pro_health' ? 'Health Pro' : 'Commercial Pro'}) has been verified.\n\nTemporary password assigned successfully.\n\nApplicant will receive their credentials by email.`
      );
      setSuccessDialogVisible(true);
    }
  };

  const handleOpenReject = () => {
    setRejectionReason('');
    setIsRejectVisible(true);
  };

  const handleConfirmReject = () => {
    setIsRejectVisible(false);
    setIsDetailsVisible(false);

    if (selectedApp) {
      const applicantName = selectedApp.fullName;
      // Remove from list
      setApplications((prev) => prev.filter((app) => app.id !== selectedApp.id));

      // Open success notifications
      setSuccessDialogTitle(t('Application rejected'));
      setSuccessDialogMessage(
        `The application for ${applicantName} has been rejected.${
          rejectionReason.trim() ? `\n\nReason: "${rejectionReason.trim()}"` : ''
        }\n\nThe applicant will be notified of the decision.`
      );
      setSuccessDialogVisible(true);
    }
  };

  const handleViewDocument = (doc: DocumentItem) => {
    setSelectedDoc(doc);
    setIsDocViewerVisible(true);
  };

  // ── Responsive Layout & Styles ─────────────────────────────────────────────
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
    // Header Info Banner
    bannerCard: {
      backgroundColor: C.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: C.border,
    },
    bannerTitle: {
      fontFamily: F.bold,
      fontSize: 15,
      color: C.text,
      marginBottom: 4,
      textAlign: isRTL ? 'right' : 'left',
    },
    bannerDesc: {
      fontFamily: F.regular,
      fontSize: 12,
      color: C.textSub,
      lineHeight: 17,
      textAlign: isRTL ? 'right' : 'left',
    },
    // Queue Card Styles
    card: {
      backgroundColor: C.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: C.border,
    },
    cardHeader: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: C.surfaceAlt,
    },
    avatarPlaceholder: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: C.surfaceAlt,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerText: {
      flex: 1,
      marginLeft: isRTL ? 0 : 12,
      marginRight: isRTL ? 12 : 0,
      alignItems: isRTL ? 'flex-end' : 'flex-start',
    },
    cardTitle: {
      fontFamily: F.bold,
      fontSize: 14,
      color: C.text,
      marginBottom: 2,
    },
    cardEmail: {
      fontFamily: F.regular,
      fontSize: 11,
      color: C.textMuted,
    },
    // Badges
    badgeRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 12,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.surfaceAlt,
    },
    badgeText: {
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
    proBadgeHealth: {
      backgroundColor: C.surfaceAlt,
    },
    proBadgeHealthText: {
      color: C.text,
    },
    proBadgeCommerce: {
      backgroundColor: C.surfaceAlt,
    },
    proBadgeCommerceText: {
      color: C.text,
    },
    // Info Rows
    infoSection: {
      borderTopWidth: 1,
      borderTopColor: C.divider,
      paddingTop: 12,
      gap: 6,
      marginBottom: 14,
    },
    infoRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 8,
    },
    infoLabel: {
      fontFamily: F.regular,
      fontSize: 12,
      color: C.textSub,
      flex: 1,
      textAlign: isRTL ? 'right' : 'left',
    },
    // Action Button
    actionRow: {
      flexDirection: isRTL ? 'row' : 'row-reverse',
    },
    viewBtn: {
      borderWidth: 1,
      borderColor: C.text,
      paddingVertical: 7,
      paddingHorizontal: 14,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'transparent',
    },
    viewBtnText: {
      fontFamily: F.semibold,
      fontSize: 11,
      color: C.text,
    },
    // Empty State
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      paddingVertical: 60,
    },
    emptyIllustration: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: C.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
      borderWidth: 1,
      borderColor: C.border,
    },
    emptyTitle: {
      fontFamily: F.bold,
      fontSize: 15,
      color: C.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    emptyDesc: {
      fontFamily: F.regular,
      fontSize: 12,
      color: C.textMuted,
      textAlign: 'center',
      lineHeight: 18,
    },
    // Skeleton Container
    skeletonCard: {
      backgroundColor: C.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: C.border,
      gap: 12,
    },
    // Modals Base
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
      backgroundColor: C.surface,
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
    sectionTitle: {
      fontFamily: F.bold,
      fontSize: 13,
      color: C.text,
      marginTop: 18,
      marginBottom: 10,
      textAlign: isRTL ? 'right' : 'left',
    },
    sectionTitleFirst: {
      marginTop: 0,
    },
    sectionCard: {
      backgroundColor: C.surfaceAlt,
      borderRadius: 10,
      padding: 12,
      gap: 8,
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
    sectionTextBio: {
      fontFamily: F.regular,
      fontSize: 12,
      color: C.text,
      lineHeight: 17,
      textAlign: isRTL ? 'right' : 'left',
    },
    // Document Card
    docCard: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      backgroundColor: C.surface,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: C.border,
      justifyContent: 'space-between',
    },
    docInfo: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    docName: {
      fontFamily: F.semibold,
      fontSize: 11,
      color: C.text,
    },
    docSize: {
      fontFamily: F.regular,
      fontSize: 10,
      color: C.textMuted,
      marginTop: 2,
    },
    viewDocBtn: {
      backgroundColor: C.surfaceAlt,
      borderRadius: 6,
      paddingVertical: 5,
      paddingHorizontal: 10,
    },
    viewDocText: {
      fontFamily: F.semibold,
      fontSize: 10,
      color: C.text,
    },
    // Modal Footer
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
    // Workflow Confirmation Modals
    confirmModalContainer: {
      width: '88%',
      backgroundColor: C.surface,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: C.border,
    },
    confirmHeader: {
      alignItems: 'center',
      marginBottom: 16,
    },
    confirmTitle: {
      fontFamily: F.bold,
      fontSize: 15,
      color: C.text,
      textAlign: 'center',
      marginTop: 8,
    },
    confirmSub: {
      fontFamily: F.regular,
      fontSize: 12,
      color: C.textSub,
      textAlign: 'center',
      marginTop: 4,
      lineHeight: 17,
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
    inputWrapper: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: C.inputBorder,
      borderRadius: 8,
      backgroundColor: C.inputBg,
      paddingHorizontal: 12,
      height: 44,
    },
    input: {
      flex: 1,
      fontFamily: F.regular,
      fontSize: 13,
      color: C.text,
      textAlign: isRTL ? 'right' : 'left',
      paddingVertical: 0,
      height: '100%',
    },
    inputEye: {
      padding: 4,
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
    errorText: {
      fontFamily: F.regular,
      fontSize: 11,
      color: C.red,
      marginTop: 4,
      textAlign: isRTL ? 'right' : 'left',
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
    // Document Preview modal
    docPreviewBody: {
      backgroundColor: C.surfaceAlt,
      borderRadius: 8,
      padding: 24,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 220,
      marginVertical: 10,
      marginHorizontal: 20,
    },
    docPreviewWatermark: {
      fontFamily: F.bold,
      fontSize: 18,
      color: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
      transform: [{ rotate: '-30deg' }],
      position: 'absolute',
      textAlign: 'center',
      width: '100%',
    },
    docPreviewIcon: {
      marginBottom: 12,
    },
    docPreviewTitle: {
      fontFamily: F.bold,
      fontSize: 13,
      color: C.text,
      textAlign: 'center',
      marginBottom: 4,
    },
    docPreviewSub: {
      fontFamily: F.regular,
      fontSize: 11,
      color: C.textMuted,
      textAlign: 'center',
    },
    docPreviewDummyText: {
      fontFamily: F.regular,
      fontSize: 10,
      color: C.textMuted,
      textAlign: 'center',
      marginTop: 20,
      lineHeight: 14,
    },
    // Success Notification Modal
    successHeaderIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: C.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
  }), [C, isRTL, isDark]);

  // ── Render Helpers ─────────────────────────────────────────────────────────

  const renderBadge = (app: Application) => {
    if (app.profileType === 'pro_health') {
      return (
        <View style={[s.badge, s.proBadgeHealth]}>
          <Text style={[s.badgeText, s.proBadgeHealthText]}>{t('Health Professional') || 'Health Professional'}</Text>
        </View>
      );
    } else {
      return (
        <View style={[s.badge, s.proBadgeCommerce]}>
          <Text style={[s.badgeText, s.proBadgeCommerceText]}>{t('Commercial Professional') || 'Commercial Professional'}</Text>
        </View>
      );
    }
  };

  const renderStatusBadge = (status: string) => {
    return (
      <View style={[s.badge, s.statusBadgePending]}>
        <Text style={[s.badgeText, s.statusBadgePendingText]}>{t('Pending Verification') || 'Pending Verification'}</Text>
      </View>
    );
  };

  // ── Render Items ───────────────────────────────────────────────────────────

  const renderCard = ({ item }: { item: Application }) => {
    return (
      <View style={s.card}>
        {/* Card Header (Avatar + Name) */}
        <View style={s.cardHeader}>
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={s.avatar} />
          ) : (
            <View style={s.avatarPlaceholder}>
              <MaterialCommunityIcons name="account" size={26} color={C.textMuted} />
            </View>
          )}
          <View style={s.headerText}>
            <Text style={s.cardTitle}>{item.fullName}</Text>
            <Text style={s.cardEmail}>{item.email}</Text>
          </View>
        </View>

        {/* Badges */}
        <View style={s.badgeRow}>
          {renderBadge(item)}
          {renderStatusBadge(item.status)}
        </View>

        {/* Info Area */}
        <View style={s.infoSection}>
          <View style={s.infoRow}>
            <MaterialCommunityIcons name="phone-outline" size={14} color={C.textMuted} />
            <Text style={s.infoLabel}>{item.phone}</Text>
          </View>
          <View style={s.infoRow}>
            <MaterialCommunityIcons name="calendar-range" size={14} color={C.textMuted} />
            <Text style={s.infoLabel}>
              {t('Registered') || 'Registered'}: {item.registrationDate}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={s.actionRow}>
          <TouchableOpacity
            style={s.viewBtn}
            activeOpacity={0.8}
            onPress={() => handleViewApplication(item)}
          >
            <Text style={s.viewBtnText}>{t('View Application') || 'View Application'}</Text>
            <MaterialCommunityIcons name={isRTL ? "arrow-left" : "arrow-right"} size={14} color={C.white} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSkeleton = () => (
    <View style={s.skeletonCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <SkeletonLoader width={52} height={52} borderRadius={26} />
        <View style={{ flex: 1, gap: 6 }}>
          <SkeletonLoader width="60%" height={16} borderRadius={4} />
          <SkeletonLoader width="45%" height={12} borderRadius={4} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
        <SkeletonLoader width={120} height={22} borderRadius={6} />
        <SkeletonLoader width={100} height={22} borderRadius={6} />
      </View>
      <View style={{ borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12, gap: 6 }}>
        <SkeletonLoader width="50%" height={12} borderRadius={4} />
        <SkeletonLoader width="40%" height={12} borderRadius={4} />
      </View>
      <View style={{ flexDirection: 'row-reverse', marginTop: 4 }}>
        <SkeletonLoader width={130} height={32} borderRadius={8} />
      </View>
    </View>
  );

  return (
    <AppScaffold
      title={t('Verification Queue') || 'Professional Verification'}
      activeTab="profile"
      onBack={() => navigation.goBack()}
      showBottomNav={false} // clean workspace since we are in details
    >
      <View style={s.container}>
        {isLoading ? (
          <ScrollView contentContainerStyle={s.listContent} showsVerticalScrollIndicator={false}>
            <View style={s.bannerCard}>
              <SkeletonLoader width="70%" height={18} borderRadius={4} style={{ marginBottom: 6 }} />
              <SkeletonLoader width="95%" height={12} borderRadius={4} style={{ marginBottom: 4 }} />
              <SkeletonLoader width="85%" height={12} borderRadius={4} />
            </View>
            {renderSkeleton()}
            {renderSkeleton()}
          </ScrollView>
        ) : applications.length === 0 ? (
          <View style={s.emptyContainer}>
            <View style={s.emptyIllustration}>
              <MaterialCommunityIcons name="shield-check" size={54} color={C.green} />
            </View>
            <Text style={s.emptyTitle}>{t('No professional accounts awaiting verification.') || 'No professional accounts awaiting verification.'}</Text>
            <Text style={s.emptyDesc}>
              {t('All professional applications have been processed. Great job!') || 'All professional applications have been processed. Great job!'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={applications}
            keyExtractor={(item) => item.id}
            renderItem={renderCard}
            contentContainerStyle={s.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={s.bannerCard}>
                <Text style={s.bannerTitle}>{t('Pending Applications') || 'Pending Applications'}</Text>
                <Text style={s.bannerDesc}>
                  {t('Review professional credentials, certifications, and licenses before granting network access.') || 'Review professional credentials, certifications, and licenses before granting network access.'}
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* ── Modal: Professional Details (View Application) ────────────────── */}
      <Modal
        visible={isDetailsVisible && !!selectedApp}
        animationType="slide"
        transparent
        onRequestClose={() => setIsDetailsVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContainer}>
            {/* Modal Header */}
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{t('Application Details') || 'Application Details'}</Text>
              <TouchableOpacity
                onPress={() => setIsDetailsVisible(false)}
                style={s.modalCloseBtn}
              >
                <MaterialCommunityIcons name="close" size={22} color={C.text} />
              </TouchableOpacity>
            </View>

            {/* Scrollable details */}
            {selectedApp && (
              <ScrollView style={s.modalScroll} showsVerticalScrollIndicator={false}>
                {/* Profile header in details */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18, gap: 12 }}>
                  {selectedApp.avatarUrl ? (
                    <Image source={{ uri: selectedApp.avatarUrl }} style={[s.avatar, { width: 60, height: 60, borderRadius: 30 }]} />
                  ) : (
                    <View style={[s.avatarPlaceholder, { width: 60, height: 60, borderRadius: 30 }]}>
                      <MaterialCommunityIcons name="account" size={32} color={C.textMuted} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[s.cardTitle, { fontSize: 16 }]}>{selectedApp.fullName}</Text>
                    <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                      {renderBadge(selectedApp)}
                    </View>
                  </View>
                </View>

                {/* Personal Information */}
                <Text style={[s.sectionTitle, s.sectionTitleFirst]}>{t('Personal Information') || 'Personal Information'}</Text>
                <View style={s.sectionCard}>
                  <View style={s.sectionRow}>
                    <Text style={s.sectionLabel}>{t('Email Address') || 'Email Address'}</Text>
                    <Text style={s.sectionValue}>{selectedApp.email}</Text>
                  </View>
                  <View style={s.sectionRow}>
                    <Text style={s.sectionLabel}>{t('Phone Number') || 'Phone Number'}</Text>
                    <Text style={s.sectionValue}>{selectedApp.phone}</Text>
                  </View>
                  <View style={s.sectionRow}>
                    <Text style={s.sectionLabel}>{t('Location') || 'Location'}</Text>
                    <Text style={s.sectionValue}>
                      {selectedApp.personalInfo.address}, {selectedApp.personalInfo.city}, {selectedApp.personalInfo.country}
                    </Text>
                  </View>
                  <View style={[s.sectionRow, { flexDirection: 'column', gap: 4, marginTop: 4 }]}>
                    <Text style={[s.sectionLabel, { width: '100%' }]}>{t('Short Bio') || 'Short Bio'}</Text>
                    <Text style={s.sectionTextBio}>{selectedApp.personalInfo.bio}</Text>
                  </View>
                </View>

                {/* Business Information (Commercial Pro) */}
                {selectedApp.profileType === 'pro_commerce' && selectedApp.businessInfo && (
                  <>
                    <Text style={s.sectionTitle}>{t('Business Information') || 'Business Information'}</Text>
                    <View style={s.sectionCard}>
                      <View style={s.sectionRow}>
                        <Text style={s.sectionLabel}>{t('Company Name') || 'Company Name'}</Text>
                        <Text style={s.sectionValue}>{selectedApp.businessInfo.companyName}</Text>
                      </View>
                      <View style={s.sectionRow}>
                        <Text style={s.sectionLabel}>{t('Tax ID') || 'Tax ID / VAT'}</Text>
                        <Text style={s.sectionValue}>{selectedApp.businessInfo.taxId}</Text>
                      </View>
                      <View style={s.sectionRow}>
                        <Text style={s.sectionLabel}>{t('Registration No') || 'Registration No'}</Text>
                        <Text style={s.sectionValue}>{selectedApp.businessInfo.registrationNumber}</Text>
                      </View>
                      <View style={s.sectionRow}>
                        <Text style={s.sectionLabel}>{t('Business Type') || 'Business Type'}</Text>
                        <Text style={s.sectionValue}>{selectedApp.businessInfo.businessType}</Text>
                      </View>
                    </View>
                  </>
                )}

                {/* Medical Information (Health Pro) */}
                {selectedApp.profileType === 'pro_health' && selectedApp.medicalInfo && (
                  <>
                    <Text style={s.sectionTitle}>{t('Medical Information') || 'Medical Professional Information'}</Text>
                    <View style={s.sectionCard}>
                      <View style={s.sectionRow}>
                        <Text style={s.sectionLabel}>{t('Specialty') || 'Specialty'}</Text>
                        <Text style={s.sectionValue}>{selectedApp.medicalInfo.specialty}</Text>
                      </View>
                      <View style={s.sectionRow}>
                        <Text style={s.sectionLabel}>{t('Clinic/Hospital') || 'Clinic/Hospital'}</Text>
                        <Text style={s.sectionValue}>{selectedApp.medicalInfo.clinicName}</Text>
                      </View>
                      <View style={s.sectionRow}>
                        <Text style={s.sectionLabel}>{t('License Number') || 'License Number'}</Text>
                        <Text style={s.sectionValue}>{selectedApp.medicalInfo.licenseNumber}</Text>
                      </View>
                      <View style={s.sectionRow}>
                        <Text style={s.sectionLabel}>{t('Experience') || 'Experience'}</Text>
                        <Text style={s.sectionValue}>
                          {selectedApp.medicalInfo.experienceYears} {selectedApp.medicalInfo.experienceYears === 1 ? t('year') || 'year' : t('years') || 'years'}
                        </Text>
                      </View>
                    </View>
                  </>
                )}

                {/* Uploaded Documents */}
                <Text style={s.sectionTitle}>{t('Uploaded Documents') || 'Uploaded Documents'}</Text>
                <View style={{ marginBottom: 24 }}>
                  {selectedApp.documents.map((doc) => (
                    <View key={doc.id} style={s.docCard}>
                      <View style={s.docInfo}>
                        <MaterialCommunityIcons name="file-pdf-box" size={20} color={C.textSub} />
                        <View style={{ flex: 1 }}>
                          <Text style={s.docName} numberOfLines={1}>
                            {doc.name}
                          </Text>
                          <Text style={s.docSize}>
                            {doc.type} • {doc.fileSize}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={s.viewDocBtn}
                        onPress={() => handleViewDocument(doc)}
                      >
                        <Text style={s.viewDocText}>{t('View Document') || 'View Document'}</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}

            {/* Modal Actions */}
            <View style={s.modalFooter}>
              <TouchableOpacity
                style={s.rejectBtn}
                onPress={handleOpenReject}
              >
                <Text style={s.rejectBtnText}>{t('Reject') || 'Reject'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.approveBtn}
                onPress={handleOpenApprove}
              >
                <Text style={s.approveBtnText}>{t('Approve') || 'Approve'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal: Approve confirmation dialog ────────────────────────────── */}
      <Modal
        visible={isApproveVisible && !!selectedApp}
        animationType="fade"
        transparent
        onRequestClose={() => setIsApproveVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.confirmModalContainer}>
            <View style={s.confirmHeader}>
              <View style={s.successHeaderIcon}>
                <MaterialCommunityIcons name="account-check-outline" size={24} color={C.text} />
              </View>
              <Text style={s.confirmTitle}>{t('Approve Professional Account') || 'Approve Professional Account'}</Text>
              {selectedApp && (
                <Text style={s.confirmSub}>
                  {t('Set a temporary password for') || 'Set a temporary password for'} <Text style={{ fontFamily: F.bold }}>{selectedApp.fullName}</Text>. {t('The applicant will receive their credentials via email.') || 'The applicant will receive their credentials via email.'}
                </Text>
              )}
            </View>

            {/* Form Fields */}
            <View style={{ marginVertical: 8 }}>
              {!!passwordError && (
                <View style={{ backgroundColor: C.redLight, padding: 8, borderRadius: 8, marginBottom: 12 }}>
                  <Text style={{ color: C.red, fontFamily: F.regular, fontSize: 11, textAlign: 'center' }}>{passwordError}</Text>
                </View>
              )}

              <View style={s.formField}>
                <Text style={s.formLabel}>{t('Temporary Password') || 'Temporary Password'}</Text>
                <View style={s.inputWrapper}>
                  <TextInput
                    style={s.input}
                    secureTextEntry={!showPassword}
                    placeholder={t('Enter temp password') || 'Enter temp password'}
                    placeholderTextColor={C.textMuted}
                    value={tempPassword}
                    onChangeText={setTempPassword}
                  />
                  <TouchableOpacity
                    style={s.inputEye}
                    onPress={() => setShowPassword((prev) => !prev)}
                  >
                    <MaterialCommunityIcons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={18}
                      color={C.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={s.formField}>
                <Text style={s.formLabel}>{t('Confirm Password') || 'Confirm Password'}</Text>
                <View style={s.inputWrapper}>
                  <TextInput
                    style={s.input}
                    secureTextEntry={!showPassword}
                    placeholder={t('Re-enter temp password') || 'Re-enter temp password'}
                    placeholderTextColor={C.textMuted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </View>
              </View>
            </View>

            {/* Buttons */}
            <View style={s.confirmFooter}>
              <TouchableOpacity
                style={s.confirmBtnCancel}
                onPress={() => setIsApproveVisible(false)}
              >
                <Text style={s.confirmBtnCancelText}>{t('Cancel') || 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.confirmBtnApprove}
                onPress={handleConfirmApprove}
              >
                <Text style={s.confirmBtnApproveText}>{t('Approve & Create Account') || 'Approve & Create'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal: Reject confirmation dialog ────────────────────────────── */}
      <Modal
        visible={isRejectVisible && !!selectedApp}
        animationType="fade"
        transparent
        onRequestClose={() => setIsRejectVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.confirmModalContainer}>
            <View style={s.confirmHeader}>
              <View style={s.successHeaderIcon}>
                <MaterialCommunityIcons name="account-cancel-outline" size={24} color={C.text} />
              </View>
              <Text style={s.confirmTitle}>{t('Reject Application') || 'Reject Application'}</Text>
              {selectedApp && (
                <Text style={s.confirmSub}>
                  {t('Are you sure you want to reject') || 'Are you sure you want to reject'} <Text style={{ fontFamily: F.bold }}>{selectedApp.fullName}</Text>'s {t('application?') || 'application?'}
                </Text>
              )}
            </View>

            {/* Form Fields */}
            <View style={s.formField}>
              <Text style={s.formLabel}>{t('Rejection Reason (Optional)') || 'Rejection Reason (Optional)'}</Text>
              <TextInput
                style={s.textarea}
                multiline
                numberOfLines={3}
                placeholder={t('Type the reason here...') || 'Provide feedback to the applicant on why their profile was rejected...'}
                placeholderTextColor={C.textMuted}
                value={rejectionReason}
                onChangeText={setRejectionReason}
              />
            </View>

            {/* Buttons */}
            <View style={s.confirmFooter}>
              <TouchableOpacity
                style={s.confirmBtnCancel}
                onPress={() => setIsRejectVisible(false)}
              >
                <Text style={s.confirmBtnCancelText}>{t('Cancel') || 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.confirmBtnReject}
                onPress={handleConfirmReject}
              >
                <Text style={s.confirmBtnRejectText}>{t('Reject Application') || 'Reject Application'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal: Success Notification Dialog ───────────────────────────── */}
      <Modal
        visible={successDialogVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setSuccessDialogVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={[s.confirmModalContainer, { alignItems: 'center' }]}>
            <View style={s.successHeaderIcon}>
              <MaterialCommunityIcons name="check-circle" size={24} color={C.text} />
            </View>
            <Text style={[s.confirmTitle, { marginTop: 0 }]}>{successDialogTitle}</Text>
            <Text style={[s.confirmSub, { marginVertical: 12 }]}>{successDialogMessage}</Text>
            <TouchableOpacity
              style={[s.approveBtn, { width: '100%', marginTop: 8 }]}
              onPress={() => setSuccessDialogVisible(false)}
            >
              <Text style={s.approveBtnText}>{t('OK') || 'OK'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Modal: Document Viewer Preview ─────────────────────────────────── */}
      <Modal
        visible={isDocViewerVisible && !!selectedDoc}
        animationType="fade"
        transparent
        onRequestClose={() => setIsDocViewerVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={[s.modalContainer, { width: '94%' }]}>
            {/* Header */}
            <View style={s.modalHeader}>
              <Text style={s.modalTitle} numberOfLines={1}>
                {selectedDoc?.name}
              </Text>
              <TouchableOpacity
                onPress={() => setIsDocViewerVisible(false)}
                style={s.modalCloseBtn}
              >
                <MaterialCommunityIcons name="close" size={22} color={C.text} />
              </TouchableOpacity>
            </View>

            {/* Document body preview */}
            <View style={s.docPreviewBody}>
              <Text style={s.docPreviewWatermark}>{t('VERIFICATION PREVIEW') || 'VERIFICATION PREVIEW'}</Text>
              <View style={s.docPreviewIcon}>
                <MaterialCommunityIcons name="file-document-outline" size={48} color={C.textMuted} />
              </View>
              <Text style={s.docPreviewTitle}>{selectedDoc?.type}</Text>
              <Text style={s.docPreviewSub}>
                {t('Size') || 'Size'}: {selectedDoc?.fileSize} • PDF Document
              </Text>
              <Text style={s.docPreviewDummyText}>
                [Mock Document Content Preview] {"\n"}
                Applicant Name: {selectedApp?.fullName} {"\n"}
                System Identifier: {selectedApp?.id} {"\n"}
                Document Hash Verification: Valid {"\n"}
                Certified Gluten-Free Network Verification Portal
              </Text>
            </View>

            {/* Footer */}
            <View style={s.modalFooter}>
              <TouchableOpacity
                style={[s.approveBtn, { backgroundColor: C.surfaceAlt }]}
                onPress={() => setIsDocViewerVisible(false)}
              >
                <Text style={[s.approveBtnText, { color: C.text }]}>{t('Close Preview') || 'Close Preview'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </AppScaffold>
  );
}
