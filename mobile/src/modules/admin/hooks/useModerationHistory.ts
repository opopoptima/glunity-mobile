import { useState, useEffect, useCallback } from 'react';
import { adminApi, ModerationHistoryEntry, PaginatedResult } from '../api/admin.api';

export interface HistoryFilters {
  entityType?: string;
  action?: string;
  adminId?: string;
  from?: string;
  to?: string;
}

export function useModerationHistory() {
  const [filters, setFilters] = useState<HistoryFilters>({});
  const [items, setItems] = useState<ModerationHistoryEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const loadData = useCallback(async (resetPage = false) => {
    try {
      setLoading(true);
      const currentPage = resetPage ? 1 : page;
      if (resetPage) setPage(1);
      const result: PaginatedResult<ModerationHistoryEntry> = await adminApi.getModerationHistory(filters, currentPage, limit);
      setItems(result.items ?? []);
      setTotal(result.total ?? 0);
    } catch (err) {
      console.error('Error fetching moderation history:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, page, limit]);

  useEffect(() => {
    loadData(true);
  }, [filters]);

  const setFilter = (key: keyof HistoryFilters, value: string | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value || undefined }));
  };

  const clearFilters = () => setFilters({});

  const hasMore = items.length < total;

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(p => p + 1);
      loadData(false);
    }
  };

  return {
    items,
    total,
    loading,
    filters,
    setFilter,
    clearFilters,
    hasMore,
    loadMore,
    refresh: () => loadData(true),
  };
}
