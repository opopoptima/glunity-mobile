import { useState, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import { adminApi, ModerationItem } from '../api/admin.api';
import { useSocket } from '../../../shared/context/socket.context';

export type TabType = 'products' | 'events' | 'recipes' | 'reels';

export function useAdminModeration(initialTab: TabType = 'products') {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleNewReel = (newReel: ModerationItem) => {
      setItems(prev => {
        if (prev.some(item => item.id === newReel.id)) return prev;
        return [newReel, ...prev];
      });
    };

    const handleReelReviewed = (payload: { id: string; reelId: string }) => {
      setItems(prev => prev.map(item => {
        if (item.id === payload.id || item.reelId === payload.reelId) {
          return { ...item, reviewStatus: 'reviewed' };
        }
        return item;
      }));
    };

    const handleReelRemoved = (payload: { id: string; reelId: string }) => {
      setItems(prev => prev.filter(item => item.id !== payload.id && item.reelId !== payload.reelId));
    };

    socket.on('NEW_REEL_PUBLISHED', handleNewReel);
    socket.on('REEL_REVIEWED', handleReelReviewed);
    socket.on('REEL_REMOVED', handleReelRemoved);

    return () => {
      socket.off('NEW_REEL_PUBLISHED', handleNewReel);
      socket.off('REEL_REVIEWED', handleReelReviewed);
      socket.off('REEL_REMOVED', handleReelRemoved);
    };
  }, [socket]);

  // Search & Filter & Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, approved, rejected
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [eventTypeFilter, setEventTypeFilter] = useState('all'); // all, online, presentiel
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, popularity

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [rejectReason, setRejectReason] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getModerationItems(activeTab);
      setItems(data);
    } catch (err) {
      console.error('Error fetching moderation items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset filters on tab change
    setSearchQuery('');
    setCategoryFilter('all');
    setEventTypeFilter('all');
    setStatusFilter('all');
    setSortBy('newest');
    loadData();
  }, [activeTab]);

  const handleOpenAction = (item: ModerationItem, type: 'approve' | 'reject') => {
    setSelectedItem(item);
    setActionType(type);
    setRejectReason('');
    setModalVisible(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedItem) return;
    if (actionType === 'reject' && selectedItem.type !== 'event' && !rejectReason.trim()) {
      Alert.alert('Motif requis', 'Veuillez préciser la raison du refus.');
      return;
    }

    try {
      await adminApi.moderateItem(selectedItem.id, selectedItem.type, actionType, rejectReason);
      
      const itemTitle = selectedItem.title;
      if (actionType === 'approve') {
        Alert.alert('Publication Validée', `"${itemTitle}" a été validé. Notifié par Email/In-App.`);
      } else {
        Alert.alert('Refus Enregistré', `Motif : "${rejectReason}". Utilisateur notifié.`);
      }

      setItems(items.filter((i) => i.id !== selectedItem.id));
      setModalVisible(false);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible d\'effectuer l\'action pour le moment.');
    }
  };

  const filteredItems = useMemo(() => {
    // 1. Category check
    let list = items.filter((i) => {
      if (activeTab === 'products') return i.type === 'product';
      if (activeTab === 'events') return i.type === 'event';
      if (activeTab === 'recipes') return i.type === 'recipe';
      if (activeTab === 'reels') return i.type === 'reel';
      return true;
    });

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.title?.toLowerCase().includes(q) ||
          i.authorOrSeller?.toLowerCase().includes(q) ||
          (i.location && typeof i.location === 'string' && i.location.toLowerCase().includes(q))
      );
    }

    // 3. Category filter (only for events)
    if (activeTab === 'events' && categoryFilter !== 'all') {
      list = list.filter((i: any) => i.category === categoryFilter);
    }

    // 4. Event type filter (online vs presentiel)
    if (activeTab === 'events' && eventTypeFilter !== 'all') {
      list = list.filter((i: any) => {
        if (eventTypeFilter === 'online') return i.format === 'online';
        if (eventTypeFilter === 'presentiel') return i.format === 'presentiel' || i.format === 'in-person';
        return true;
      });
    }

    // 5. Status filter (since queue is mostly pending, we map status check)
    if (statusFilter !== 'all') {
      list = list.filter((i: any) => (i.status || 'pending') === statusFilter);
    }

    // 6. Sorting
    list = [...list].sort((a: any, b: any) => {
      const aDate = new Date(a.date).getTime();
      const bDate = new Date(b.date).getTime();
      
      if (sortBy === 'newest') {
        return bDate - aDate;
      }
      if (sortBy === 'oldest') {
        return aDate - bDate;
      }
      if (sortBy === 'popularity') {
        // Sort by simulated popularity/price
        const aVal = a.price || 0;
        const bVal = b.price || 0;
        return bVal - aVal;
      }
      return 0;
    });

    return list;
  }, [items, activeTab, searchQuery, categoryFilter, eventTypeFilter, statusFilter, sortBy]);

  return {
    activeTab,
    setActiveTab,
    loading,
    filteredItems,
    refresh: loadData,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    eventTypeFilter,
    setEventTypeFilter,
    sortBy,
    setSortBy,
    modal: {
      visible: modalVisible,
      setVisible: setModalVisible,
      selectedItem,
      actionType,
      rejectReason,
      setRejectReason,
      handleOpenAction,
      handleConfirmAction
    }
  };
}

