import { useState, useEffect, useCallback } from 'react';
import { Share, Platform, Clipboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { adminApi, AdminUserListItem, EnrichedUserDetail } from '../api/admin.api';
import { DialogButton } from '../../../shared/components/CustomDialog';

export function useAdminUserDetail(userId: string) {
  const navigation = useNavigation<any>();

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

  // Processing state to disable buttons and prevent duplicate taps
  const [isProcessing, setIsProcessing] = useState(false);

  // Temporary password state for Reset Password success screen
  const [tempPassword, setTempPassword] = useState('');

  // Reusable custom dialog state
  const [dialog, setDialog] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    icon?: string;
    iconColor?: string;
    loading?: boolean;
    loadingMessage?: string;
    buttons?: DialogButton[];
    showInput?: boolean;
    inputValue?: string;
    inputPlaceholder?: string;
  }>({
    visible: false,
    title: '',
  });

  // Reusable custom toast state
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    visible: false,
    message: '',
    type: 'success',
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 2500);
  };

  const closeDialog = () => {
    setDialog(prev => ({ ...prev, visible: false }));
  };

  const handleDialogInputChange = (text: string) => {
    setDialog(prev => {
      const updatedButtons = prev.buttons?.map(btn => {
        if (btn.text === 'Delete' || btn.text === 'Supprimer' || btn.type === 'destructive') {
          return {
            ...btn,
            disabled: text !== 'DELETE',
          };
        }
        return btn;
      });

      return {
        ...prev,
        inputValue: text,
        buttons: updatedButtons,
      };
    });
  };

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
    if (!user || isProcessing) return;
    try {
      setIsProcessing(true);
      await adminApi.toggleUserStatus(user.id, 'suspended', suspendReason, suspendDuration, suspendNotes);
      
      // Reset inputs & close modal
      setSuspendModalVisible(false);
      setSuspendNotes('');
      setSuspendReason('Spam');
      setSuspendDuration('24 Hours');
      
      setDialog({
        visible: true,
        title: 'Compte Suspendu',
        message: `L'utilisateur ${user.fullName} a été suspendu pour : ${suspendReason}.`,
        icon: 'user-x',
        iconColor: '#EF4444',
        buttons: [{ text: 'OK', onPress: closeDialog, type: 'primary' }]
      });
      showToast('Compte suspendu !', 'success');
      await loadAllDetails();
    } catch (err) {
      console.error(err);
      setDialog({
        visible: true,
        title: 'Erreur',
        message: 'Impossible de suspendre l\'utilisateur.',
        icon: 'alert-triangle',
        iconColor: '#C8102E',
        buttons: [{ text: 'Fermer', onPress: closeDialog }]
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Reactivate action
  const handleReactivateUser = async () => {
    if (!user || isProcessing) return;
    try {
      setIsProcessing(true);
      await adminApi.toggleUserStatus(user.id, 'active');
      
      setDialog({
        visible: true,
        title: 'Compte Réactivé',
        message: `Le compte de ${user.fullName} est à présent actif.`,
        icon: 'check-circle',
        iconColor: '#6DAE3F',
        buttons: [{ text: 'OK', onPress: closeDialog, type: 'primary' }]
      });
      showToast('Compte réactivé !', 'success');
      await loadAllDetails();
    } catch (err) {
      console.error(err);
      setDialog({
        visible: true,
        title: 'Erreur',
        message: 'Impossible de réactiver le compte.',
        icon: 'alert-triangle',
        iconColor: '#C8102E',
        buttons: [{ text: 'Fermer', onPress: closeDialog }]
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Send Warning action
  const handleSendWarning = async () => {
    if (!user || isProcessing) return;
    if (!warningMessage.trim()) {
      setDialog({
        visible: true,
        title: 'Champs vide',
        message: "Veuillez saisir un message d'avertissement.",
        icon: 'alert-circle',
        iconColor: '#F59E0B',
        buttons: [{ text: 'OK', onPress: closeDialog }]
      });
      return;
    }
    try {
      setIsProcessing(true);
      await adminApi.warnUser(user.id, warningMessage);
      
      setDialog({
        visible: true,
        title: 'Avertissement Envoyé',
        message: `Un avertissement officiel a été envoyé à ${user.fullName}.`,
        icon: 'bell',
        iconColor: '#F59E0B',
        buttons: [{ text: 'OK', onPress: closeDialog, type: 'primary' }]
      });
      showToast('Avertissement envoyé !', 'success');
      setWarningMessage('');
      setWarningModalVisible(false);
      await loadAllDetails();
    } catch (err) {
      console.error(err);
      setDialog({
        visible: true,
        title: 'Erreur',
        message: "Impossible d'envoyer l'avertissement.",
        icon: 'alert-triangle',
        iconColor: '#C8102E',
        buttons: [{ text: 'Fermer', onPress: closeDialog }]
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset Password action
  const handleResetPassword = () => {
    if (!user || isProcessing) return;

    setDialog({
      visible: true,
      title: 'Reset Password',
      message: "Are you sure you want to reset this user's password?",
      icon: 'key',
      iconColor: '#6DAE3F',
      buttons: [
        {
          text: 'Cancel',
          onPress: closeDialog,
        },
        {
          text: 'Reset Password',
          type: 'primary',
          onPress: async () => {
            setDialog(prev => ({
              ...prev,
              loading: true,
              loadingMessage: 'Resetting password...',
            }));

            try {
              setIsProcessing(true);
              const res = await adminApi.resetUserPassword(user.id);
              const tempPass = res.tempPassword || '';
              setTempPassword(tempPass);

              setDialog({
                visible: true,
                title: 'Password Reset Successfully',
                icon: 'check-circle',
                iconColor: '#6DAE3F',
                buttons: [
                  {
                    text: 'Copy Password',
                    type: 'primary',
                    onPress: () => {
                      Clipboard.setString(tempPass);
                      showToast('Password copied to clipboard!', 'success');
                    },
                  },
                  {
                    text: 'Close',
                    onPress: () => {
                      closeDialog();
                      setTempPassword('');
                    },
                  },
                ],
              });
              await loadAllDetails();
            } catch (err: any) {
              console.error(err);
              const errMsg = err?.response?.data?.message || 'Failed to reset password.';
              setDialog({
                visible: true,
                title: 'Error',
                message: errMsg,
                icon: 'alert-triangle',
                iconColor: '#C8102E',
                buttons: [
                  {
                    text: 'Close',
                    onPress: closeDialog,
                  },
                ],
              });
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ],
    });
  };

  // Delete Account action (Multi-step confirmation dialog)
  const handleDeleteAccount = () => {
    if (!user || isProcessing) return;

    // Step 1: First dialog
    setDialog({
      visible: true,
      title: 'Delete User',
      message: 'This action is permanent and cannot be undone.',
      icon: 'trash-2',
      iconColor: '#C8102E',
      buttons: [
        {
          text: 'Cancel',
          onPress: closeDialog,
        },
        {
          text: 'Continue',
          type: 'destructive',
          onPress: () => {
            // Step 2: Second dialog
            setDialog({
              visible: true,
              title: 'Final Confirmation',
              message: 'Type DELETE to confirm permanent deletion.',
              icon: 'alert-triangle',
              iconColor: '#C8102E',
              showInput: true,
              inputValue: '',
              inputPlaceholder: 'Saisissez "DELETE" pour confirmer',
              buttons: [
                {
                  text: 'Cancel',
                  onPress: closeDialog,
                },
                {
                  text: 'Delete',
                  type: 'destructive',
                  disabled: true,
                  onPress: async () => {
                    setDialog(prev => ({
                      ...prev,
                      loading: true,
                      loadingMessage: 'Deleting user account...',
                    }));

                    try {
                      setIsProcessing(true);
                      await adminApi.deleteUser(user.id);
                      showToast('User deleted successfully!', 'success');

                      // Step 3: Success Dialog
                      setDialog({
                        visible: true,
                        title: 'User Deleted',
                        message: 'The account has been permanently removed.',
                        icon: 'check-circle',
                        iconColor: '#6DAE3F',
                        buttons: [
                          {
                            text: 'Done',
                            type: 'primary',
                            onPress: () => {
                              closeDialog();
                              navigation.goBack();
                            },
                          },
                        ],
                      });
                    } catch (err: any) {
                      console.error(err);
                      const errMsg = err?.response?.data?.message || 'Failed to delete user account.';
                      setDialog({
                        visible: true,
                        title: 'Error',
                        message: errMsg,
                        icon: 'alert-triangle',
                        iconColor: '#C8102E',
                        buttons: [
                          {
                            text: 'Close',
                            onPress: closeDialog,
                          },
                        ],
                      });
                    } finally {
                      setIsProcessing(false);
                    }
                  },
                },
              ],
            });
          },
        },
      ],
    });
  };

  // Export User Data action
  const handleExportData = () => {
    if (!user || isProcessing) return;

    setDialog({
      visible: true,
      title: 'Export User Data',
      message: 'Do you want to export all user data in compliance with GDPR?',
      icon: 'download',
      iconColor: '#6DAE3F',
      buttons: [
        {
          text: 'Cancel',
          onPress: closeDialog,
        },
        {
          text: 'Export',
          type: 'primary',
          onPress: async () => {
            setDialog(prev => ({
              ...prev,
              loading: true,
              loadingMessage: 'Exporting user data...',
            }));

            try {
              setIsProcessing(true);
              const data = await adminApi.exportUserData(user.id);
              const formattedJSON = JSON.stringify(data, null, 2);

              const handleShare = async () => {
                try {
                  await Share.share({
                    message: formattedJSON,
                    title: `GlUnity GDPR Export - ${user.fullName}`,
                  });
                } catch (shareErr) {
                  console.error(shareErr);
                }
              };

              const handleDownload = () => {
                if (Platform.OS === 'web') {
                  const element = document.createElement('a');
                  const file = new Blob([formattedJSON], { type: 'application/json' });
                  element.href = URL.createObjectURL(file);
                  element.download = `gdpr-export-${user.fullName.replace(/\s+/g, '-').toLowerCase()}-${user.id}.json`;
                  document.body.appendChild(element);
                  element.click();
                  document.body.removeChild(element);
                  showToast('Export file downloaded!', 'success');
                } else {
                  handleShare();
                }
              };

              // First trigger the share screen
              await Share.share({
                message: formattedJSON,
                title: `GlUnity GDPR Export - ${user.fullName}`,
              });

              showToast('Data exported successfully!', 'success');

              // Show success dialog
              setDialog({
                visible: true,
                title: 'Export Complete',
                message: 'The user data has been exported successfully.',
                icon: 'check-circle',
                iconColor: '#6DAE3F',
                buttons: [
                  {
                    text: 'Share',
                    type: 'primary',
                    onPress: handleShare,
                  },
                  {
                    text: 'Download',
                    type: 'primary',
                    onPress: handleDownload,
                  },
                  {
                    text: 'Close',
                    onPress: closeDialog,
                  },
                ],
              });
            } catch (err: any) {
              console.error(err);
              const errMsg = err?.response?.data?.message || 'Failed to export data.';
              setDialog({
                visible: true,
                title: 'Error',
                message: errMsg,
                icon: 'alert-triangle',
                iconColor: '#C8102E',
                buttons: [
                  {
                    text: 'Close',
                    onPress: closeDialog,
                  },
                ],
              });
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ],
    });
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

    // Reusable Custom Dialog state & callbacks
    dialog,
    toast,
    tempPassword,
    handleDialogInputChange,
    closeDialog,

    // Processing state
    isProcessing,

    // Actions
    handleResetPassword,
    handleDeleteAccount,
    handleExportData
  };
}
