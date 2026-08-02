import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { adminApi, SellerVerificationDossier, ModerationStatus, PaginatedResult } from '../api/admin.api';

export type ActionKind = 'approve' | 'revision' | 'reject' | 'revoke';
export type ModalType = 'details' | 'action' | null;

export function useSellerVerification() {
  const [statusFilter, setStatusFilter] = useState<ModerationStatus>('pending');
  const [sellers, setSellers] = useState<SellerVerificationDossier[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedSeller, setSelectedSeller] = useState<SellerVerificationDossier | null>(null);
  const [actionKind, setActionKind] = useState<ActionKind>('approve');
  const [remarks, setRemarks] = useState('');

  const processingIdsRef = useRef<Set<string>>(new Set());

  const loadData = useCallback(async (resetPage = false) => {
    try {
      setLoading(true);
      const currentPage = resetPage ? 1 : page;
      if (resetPage) setPage(1);
      const result: PaginatedResult<SellerVerificationDossier> = await adminApi.getSellerVerifications(
        statusFilter,
        currentPage,
        search,
      );
      setSellers(result.items ?? []);
      setTotal(result.total ?? 0);
    } catch (err) {
      console.error('Error fetching seller verifications:', err);
      setSellers([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page, search]);

  useEffect(() => {
    loadData(true);
  }, [statusFilter, search]);

  const handleOpenDetails = (seller: SellerVerificationDossier) => {
    setSelectedSeller(seller);
    setModalType('details');
  };

  const handleOpenAction = (seller: SellerVerificationDossier, kind: ActionKind) => {
    setSelectedSeller(seller);
    setActionKind(kind);
    setRemarks('');
    setModalType('action');
  };

  const handleConfirmAction = async () => {
    if (!selectedSeller) return;
    const sellerId = selectedSeller.id;
    if (processingIdsRef.current.has(sellerId)) return;

    if (actionKind !== 'approve' && !remarks.trim()) {
      Alert.alert('Motif requis', 'Veuillez préciser la raison (révision, refus ou révocation).');
      return;
    }

    processingIdsRef.current.add(sellerId);
    const targetSeller = selectedSeller;
    const targetKind = actionKind;
    const targetRemarks = remarks;

    // 1. Instantly close modal
    setModalType(null);

    // 2. Optimistic UI update — 0ms latency
    const newStatus: SellerVerificationDossier['sellerVerificationStatus'] =
      targetKind === 'approve' ? 'approved'
      : targetKind === 'revision' ? 'revision_requested'
      : 'rejected';

    const prevSellers = [...sellers];
    setSellers(prev =>
      statusFilter === 'pending'
        ? prev.filter(s => s.id !== sellerId)
        : prev.map(s => s.id === sellerId ? { ...s, sellerVerificationStatus: newStatus } : s)
    );

    // 3. Background API request
    try {
      if (targetKind === 'approve') {
        await adminApi.approveSellerVerification(sellerId);
      } else if (targetKind === 'revision') {
        await adminApi.requestSellerRevision(sellerId, targetRemarks);
      } else if (targetKind === 'reject') {
        await adminApi.rejectSellerVerification(sellerId, targetRemarks);
      } else if (targetKind === 'revoke') {
        await adminApi.revokeSellerBadge(sellerId, targetRemarks);
      }
    } catch (err: any) {
      // Rollback on error
      setSellers(prevSellers);
      Alert.alert('Erreur', err?.response?.data?.message || 'Impossible de traiter la demande.');
    } finally {
      processingIdsRef.current.delete(sellerId);
    }
  };

  return {
    sellers,
    total,
    loading,
    statusFilter,
    setStatusFilter,
    search,
    setSearch,
    refresh: () => loadData(true),
    modal: {
      type: modalType,
      setType: setModalType,
      selectedSeller,
      actionKind,
      remarks,
      setRemarks,
      handleOpenDetails,
      handleOpenAction,
      handleConfirmAction,
    },
  };
}
