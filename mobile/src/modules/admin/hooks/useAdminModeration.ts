import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { adminApi, ModerationItem, ModerationStatus } from '../api/admin.api';

export type TabType = 'products' | 'events' | 'recipes' | 'reels';
export type ActionType = 'approve' | 'reject' | 'revision';

export function useAdminModeration(initialTab: TabType = 'products') {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [statusFilter, setStatusFilter] = useState<ModerationStatus>('pending');
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  // ── Modal State ──────────────────────────────────────────────────────────────
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
  const [actionType, setActionType] = useState<ActionType>('approve');
  const [rejectReason, setRejectReason] = useState('');
  const [revisionNotes, setRevisionNotes] = useState('');

  // ── Detail Modal State ───────────────────────────────────────────────────────
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailItem, setDetailItem] = useState<ModerationItem | null>(null);

  // ── Per-item processing lock to prevent double-click without blocking other items
  const processingIdsRef = useRef<Set<string>>(new Set());

  const loadData = useCallback(async (resetPage = false) => {
    try {
      setLoading(true);
      setItems([]); // Clear stale items so tab switch shows skeleton immediately
      const currentPage = resetPage ? 1 : page;
      if (resetPage) setPage(1);
      const data = await adminApi.getModerationItems(activeTab, statusFilter, currentPage, search);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching moderation items:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, statusFilter, page, search]);

  useEffect(() => {
    loadData(true);
  }, [activeTab, statusFilter, search]);

  const handleOpenAction = (item: ModerationItem, type: ActionType) => {
    // Fast path: if approving, process directly without popup prompt if wanted, or open modal
    setSelectedItem(item);
    setActionType(type);
    setRejectReason('');
    setRevisionNotes('');
    setModalVisible(true);
  };

  const handleOpenDetail = (item: ModerationItem) => {
    setDetailItem(item);
    setDetailVisible(true);
  };

  // Direct fast-path approval (optimistic & non-blocking)
  const handleDirectApprove = async (item: ModerationItem) => {
    const itemId = item.id;
    if (processingIdsRef.current.has(itemId)) return;
    processingIdsRef.current.add(itemId);

    // Optimistic state update — 0ms latency
    const prevItems = [...items];
    setItems(prev => prev.filter(i => i.id !== itemId));

    try {
      const itemType = item.type as 'product' | 'recipe';
      await adminApi.approveItem(itemType, itemId);
    } catch (err: any) {
      // Revert on failure
      setItems(prevItems);
      Alert.alert('Erreur', err?.response?.data?.message || "Échec de la validation");
    } finally {
      processingIdsRef.current.delete(itemId);
    }
  };

  const handleConfirmAction = async () => {
    if (!selectedItem) return;
    const itemId = selectedItem.id;
    if (processingIdsRef.current.has(itemId)) return;

    if (actionType === 'reject' && !rejectReason.trim()) {
      Alert.alert('Motif requis', 'Veuillez préciser la raison du refus.');
      return;
    }
    if (actionType === 'revision' && !revisionNotes.trim()) {
      Alert.alert('Notes requises', 'Veuillez préciser les modifications demandées.');
      return;
    }

    processingIdsRef.current.add(itemId);
    const targetItem = selectedItem;
    const targetAction = actionType;
    const targetReason = rejectReason;
    const targetNotes = revisionNotes;

    // 1. Instantly close modal
    setModalVisible(false);

    // 2. Optimistic UI update — zero latency list update
    const newStatus: ModerationStatus =
      targetAction === 'approve' ? 'approved'
      : targetAction === 'reject' ? 'rejected'
      : 'revision_requested';

    const prevItems = [...items];
    setItems(prev =>
      !Array.isArray(prev) ? []
      : statusFilter === 'pending'
        ? prev.filter(i => i.id !== itemId)
        : prev.map(i => i.id === itemId ? { ...i, moderationStatus: newStatus } : i)
    );

    // 3. Background API request
    try {
      const itemType = targetItem.type as 'product' | 'recipe';
      if (targetAction === 'approve') {
        await adminApi.approveItem(itemType, itemId);
      } else if (targetAction === 'reject') {
        await adminApi.rejectItem(itemType, itemId, targetReason);
      } else if (targetAction === 'revision') {
        await adminApi.requestRevision(itemType, itemId, targetNotes);
      }
    } catch (err: any) {
      // Rollback on error
      setItems(prevItems);
      Alert.alert(
        'Erreur',
        err?.response?.data?.message || "Action non enregistrée.",
      );
    } finally {
      processingIdsRef.current.delete(itemId);
    }
  };

  const safeItems = Array.isArray(items) ? items : [];

  const filteredItems = safeItems.filter(i => {
    if (!i) return false;
    if (activeTab === 'products') return i.type === 'product';
    if (activeTab === 'events')   return i.type === 'event';
    if (activeTab === 'recipes')  return i.type === 'recipe';
    if (activeTab === 'reels')    return i.type === 'reel';
    return true;
  });

  return {
    activeTab,
    setActiveTab,
    statusFilter,
    setStatusFilter,
    loading,
    filteredItems,
    search,
    setSearch,
    refresh: () => loadData(true),
    handleDirectApprove,
    modal: {
      visible: modalVisible,
      setVisible: setModalVisible,
      selectedItem,
      actionType,
      rejectReason,
      setRejectReason,
      revisionNotes,
      setRevisionNotes,
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
