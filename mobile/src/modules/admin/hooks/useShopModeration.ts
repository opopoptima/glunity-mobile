import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { adminApi, ShopModerationItem, PaginatedResult } from '../api/admin.api';

export type ShopModerationStatus = 'pending' | 'approved' | 'rejected' | 'all';

export function useShopModeration() {
  const [statusFilter, setStatusFilter] = useState<ShopModerationStatus>('pending');
  const [items, setItems] = useState<ShopModerationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Modal
  const [selectedItem, setSelectedItem] = useState<ShopModerationItem | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [rejectReason, setRejectReason] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  // Detail Modal
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailItem, setDetailItem] = useState<ShopModerationItem | null>(null);

  const processingIdsRef = useRef<Set<string>>(new Set());

  const loadData = useCallback(async (resetPage = false) => {
    try {
      setLoading(true);
      const currentPage = resetPage ? 1 : page;
      if (resetPage) setPage(1);
      const result: PaginatedResult<ShopModerationItem> = await adminApi.getShopModerations(statusFilter, currentPage);
      setItems(result.items ?? []);
      setTotal(result.total ?? 0);
    } catch (err) {
      console.error('Error fetching shop moderation items:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    loadData(true);
  }, [statusFilter]);

  const handleOpenAction = (item: ShopModerationItem, type: 'approve' | 'reject') => {
    setSelectedItem(item);
    setActionType(type);
    setRejectReason('');
    setModalVisible(true);
  };

  const handleOpenDetail = (item: ShopModerationItem) => {
    setDetailItem(item);
    setDetailVisible(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedItem) return;
    const itemId = selectedItem.id;
    if (processingIdsRef.current.has(itemId)) return;

    if (actionType === 'reject' && !rejectReason.trim()) {
      Alert.alert('Motif requis', 'Veuillez préciser la raison du refus.');
      return;
    }

    processingIdsRef.current.add(itemId);
    const targetItem = selectedItem;
    const targetAction = actionType;
    const targetReason = rejectReason;

    // 1. Instantly close modal
    setModalVisible(false);

    // 2. Optimistic UI update — 0ms latency
    const prevItems = [...items];
    setItems(prev => prev.filter(i => i.id !== itemId));

    // 3. Background API request
    try {
      if (targetAction === 'approve') {
        await adminApi.approveShopUpdate(itemId);
      } else {
        await adminApi.rejectShopUpdate(itemId, targetReason);
      }
    } catch (err: any) {
      // Rollback on error
      setItems(prevItems);
      Alert.alert('Erreur', err?.response?.data?.message || "Impossible de traiter la demande.");
    } finally {
      processingIdsRef.current.delete(itemId);
    }
  };

  return {
    items,
    total,
    loading,
    statusFilter,
    setStatusFilter,
    refresh: () => loadData(true),
    modal: {
      visible: modalVisible,
      setVisible: setModalVisible,
      selectedItem,
      actionType,
      rejectReason,
      setRejectReason,
      handleOpenAction,
      handleConfirmAction,
    },
    detail: {
      visible: detailVisible,
      setVisible: setDetailVisible,
      item: detailItem,
      open: handleOpenDetail,
    },
  };
}
