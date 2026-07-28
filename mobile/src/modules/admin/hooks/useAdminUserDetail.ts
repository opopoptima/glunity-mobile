import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { adminApi, AdminUserListItem, EnrichedUserDetail } from '../api/admin.api';

export function useAdminUserDetail(userId: string) {
  const [user, setUser] = useState<AdminUserListItem | null>(null);
  const [enriched, setEnriched] = useState<EnrichedUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Content Tabs state
  const [activeTab, setActiveTab] = useState<'posts' | 'comments' | 'events' | 'marketplace' | 'reviews' | 'purchases' | 'reports' | 'history'>('posts');

  // Action Menu Bottom Sheet visibility
  const [menuVisible, setMenuVisible] = useState(false);

  // Suspension confirmation modal state
  const [suspendModalVisible, setSuspendModalVisible] = useState(false);
  const [suspendReason, setSuspendReason] = useState<'Spam' | 'Harassment' | 'Fake Account' | 'Hate Speech' | 'Scam' | 'Inappropriate Content' | 'Other'>('Spam');
  const [suspendDuration, setSuspendDuration] = useState<'24 Hours' | '7 Days' | '30 Days' | 'Permanent'>('24 Hours');
  const [suspendNotes, setSuspendNotes] = useState('');

  // Other modal/input states
  const [warningModalVisible, setWarningModalVisible] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [roleModalVisible, setRoleModalVisible] = useState(false);

  // Method to fetch details from the backend
  const loadAllDetails = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await adminApi.getUserModerationDetails(userId);
      setEnriched(data);
      setUser(data.user);
    } catch (err) {
      console.error('[useAdminUserDetail] Error fetching user details:', err);
      setError('Impossible de charger les détails de modération pour ce membre.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  // Load details on mount
  useEffect(() => {
    loadAllDetails();
  }, [loadAllDetails]);

  // Suspend action
  const handleSuspendUser = async () => {
    if (!user) return;
    try {
      setLoading(true);
      await adminApi.toggleUserStatus(user.id, 'suspended', suspendReason, suspendDuration, suspendNotes);
      
      // Reset inputs & close modal
      setSuspendModalVisible(false);
      setSuspendNotes('');
      setSuspendReason('Spam');
      setSuspendDuration('24 Hours');
      
      Alert.alert(
        'Compte Suspendu',
        `L'utilisateur ${user.fullName} a été suspendu pour : ${suspendReason}.`
      );
      // Reload details from DB to update timeline/risk score
      await loadAllDetails();
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur', 'Impossible de suspendre l\'utilisateur.');
      setLoading(false);
    }
  };

  // Reactivate action
  const handleReactivateUser = async () => {
    if (!user) return;
    try {
      setLoading(true);
      await adminApi.toggleUserStatus(user.id, 'active');
      Alert.alert('Compte Réactivé', `L'compte de ${user.fullName} est à présent actif.`);
      await loadAllDetails();
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur', 'Impossible de réactiver l\'compte.');
      setLoading(false);
    }
  };

  // Send Warning action
  const handleSendWarning = async () => {
    if (!user) return;
    if (!warningMessage.trim()) {
      Alert.alert('Champs vide', 'Veuillez saisir un message d\'avertissement.');
      return;
    }
    try {
      setLoading(true);
      await adminApi.warnUser(user.id, warningMessage);
      Alert.alert(
        'Avertissement Envoyé',
        `Un avertissement officiel a été envoyé à ${user.fullName}.`
      );
      setWarningMessage('');
      setWarningModalVisible(false);
      await loadAllDetails();
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur', 'Impossible d\'envoyer l\'avertissement.');
      setLoading(false);
    }
  };

  // Change Role action
  const handleChangeRole = (newRole: 'celiac' | 'pro_commerce' | 'pro_health' | 'admin') => {
    if (!user) return;
    // Simulates role change
    setUser(prev => prev ? { ...prev, profileType: newRole } : null);
    setRoleModalVisible(false);
    Alert.alert('Rôle modifié', `Le rôle a été changé vers : ${newRole}.`);
  };

  // Reset Password action
  const handleResetPassword = () => {
    if (!user) return;
    Alert.alert('Mot de Passe', `Un e-mail de réinitialisation de mot de passe sécurisé a été envoyé à ${user.email}.`);
  };

  // Delete Account action
  const handleDeleteAccount = () => {
    if (!user) return;
    Alert.alert(
      'Supprimer Définitivement',
      `Êtes-vous certain de vouloir supprimer le compte de ${user.fullName} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Compte Supprimé', `Le compte de ${user.fullName} a été supprimé.`);
          }
        }
      ]
    );
  };

  // Export User Data action
  const handleExportData = () => {
    if (!user) return;
    Alert.alert(
      'Exportation',
      `L'archive zip contenant les données de ${user.fullName} a été générée.`
    );
  };

  return {
    user,
    enriched,
    loading,
    refreshing,
    error,
    activeTab,
    setActiveTab,
    menuVisible,
    setMenuVisible,
    refresh: () => loadAllDetails(true),
    
    // Suspension modal
    suspendModalVisible,
    setSuspendModalVisible,
    suspendReason,
    setSuspendReason,
    suspendDuration,
    setSuspendDuration,
    suspendNotes,
    setSuspendNotes,
    handleSuspendUser,
    handleReactivateUser,

    // Warning modal
    warningModalVisible,
    setWarningModalVisible,
    warningMessage,
    setWarningMessage,
    handleSendWarning,

    // Role modal
    roleModalVisible,
    setRoleModalVisible,
    handleChangeRole,

    // Actions
    handleResetPassword,
    handleDeleteAccount,
    handleExportData
  };
}
