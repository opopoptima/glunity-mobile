import http from '../../../core/network/http.client';

import {
  AdminDashboardStats,
  ModerationItem,
  ModerationStatus,
  ModerationStats,
  SellerVerificationDossier,
  ShopModerationItem,
  ModerationHistoryEntry,
  ModerationHistoryDetail,
  PaginatedResult,
  AdminUserListItem,
  PatientResourceItem,
  EnrichedUserDetail,
} from './admin.types';
export * from './admin.types';

export const adminApi = {
  // ── Dashboard ──────────────────────────────────────────────────────────────
  async getDashboardStats(period: 'today' | '7d' | '30d' | '3m' | '1y' = '7d'): Promise<AdminDashboardStats> {
    const res = await http.get(`/admin/stats?period=${period}`);
    return res.data?.data || res.data;
  },

  // ── Moderation Stats ───────────────────────────────────────────────────────
  async getModerationStats(): Promise<ModerationStats> {
    const res = await http.get('/admin/moderation/stats');
    return res.data?.data || res.data;
  },

  // ── Moderation Queue ───────────────────────────────────────────────────────
  async getModerationItems(
    type: 'all' | 'products' | 'events' | 'recipes' | 'reels' = 'all',
    status: ModerationStatus = 'pending',
    page: number = 1,
    search: string = '',
  ): Promise<ModerationItem[]> {
    const res = await http.get('/admin/moderation', { params: { type, status, page, search } });
    const raw = res.data?.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(res.data)) return res.data;
    return [];
  },

  async getModerationItemById(type: 'product' | 'recipe', id: string): Promise<ModerationItem | null> {
    const res = await http.get(`/admin/moderation/${type}/${id}`);
    return res.data?.data || null;
  },

  // Approve a content item
  async approveItem(type: 'product' | 'recipe', id: string): Promise<boolean> {
    const res = await http.patch(`/admin/moderation/${type}/${id}/approve`, {});
    return res.data?.success;
  },

  // Reject a content item with required reason
  async rejectItem(type: 'product' | 'recipe', id: string, reason: string): Promise<boolean> {
    const res = await http.patch(`/admin/moderation/${type}/${id}/reject`, { reason });
    return res.data?.success;
  },

  // Request revision with notes
  async requestRevision(type: 'product' | 'recipe', id: string, notes: string): Promise<boolean> {
    const res = await http.patch(`/admin/moderation/${type}/${id}/request-revision`, { notes });
    return res.data?.success;
  },

  // Legacy compat — kept for existing callers
  async moderateItem(
    id: string,
    type: 'product' | 'event' | 'recipe' | 'reel',
    action: 'approve' | 'reject',
    reason?: string,
  ): Promise<boolean> {
    const res = await http.patch(`/admin/moderation/${type}/${id}/${action}`, { reason });
    return res.data?.success;
  },

  // ── Seller Verifications ───────────────────────────────────────────────────
  async getSellerVerifications(
    status: ModerationStatus = 'pending',
    page: number = 1,
    search: string = '',
  ): Promise<PaginatedResult<SellerVerificationDossier>> {
    const res = await http.get('/admin/seller-verifications', { params: { status, page, search } });
    return res.data?.data || { items: [], total: 0, page: 1, limit: 20 };
  },

  async approveSellerVerification(id: string): Promise<boolean> {
    const res = await http.patch(`/admin/seller-verifications/${id}/approve`);
    return res.data?.success;
  },

  async rejectSellerVerification(id: string, reason: string): Promise<boolean> {
    const res = await http.patch(`/admin/seller-verifications/${id}/reject`, { reason });
    return res.data?.success;
  },

  async requestSellerRevision(id: string, notes: string): Promise<boolean> {
    const res = await http.patch(`/admin/seller-verifications/${id}/request-revision`, { reason: notes });
    return res.data?.success;
  },

  async revokeSellerBadge(id: string, reason: string): Promise<boolean> {
    const res = await http.patch(`/admin/seller-verifications/${id}/revoke-badge`, { reason });
    return res.data?.success;
  },

  // Legacy compat
  async processSellerVerification(id: string, action: 'approve' | 'reject', reason?: string): Promise<boolean> {
    const res = await http.post(`/admin/sellers/${id}/${action}`, { reason });
    return res.data?.success;
  },

  // ── Shop Moderation ────────────────────────────────────────────────────────
  async getShopModerations(
    status: 'pending' | 'approved' | 'rejected' | 'all' = 'pending',
    page: number = 1,
  ): Promise<PaginatedResult<ShopModerationItem>> {
    const res = await http.get('/admin/shop-moderation', { params: { status, page } });
    return res.data?.data || { items: [], total: 0, page: 1, limit: 20 };
  },

  async approveShopUpdate(id: string): Promise<boolean> {
    const res = await http.patch(`/admin/shop-moderation/${id}/approve`);
    return res.data?.success;
  },

  async rejectShopUpdate(id: string, reason: string): Promise<boolean> {
    const res = await http.patch(`/admin/shop-moderation/${id}/reject`, { reason });
    return res.data?.success;
  },

  // ── Moderation History ─────────────────────────────────────────────────────
  async getModerationHistory(
    filters: {
      entityType?: string;
      action?: string;
      adminId?: string;
      ownerId?: string;
      from?: string;
      to?: string;
    } = {},
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResult<ModerationHistoryEntry>> {
    const res = await http.get('/admin/moderation-history', { params: { ...filters, page, limit } });
    return res.data?.data || { items: [], total: 0, page: 1, limit: 20 };
  },

  async getModerationHistoryById(id: string): Promise<ModerationHistoryDetail | null> {
    const res = await http.get(`/admin/moderation-history/${id}`);
    return res.data?.data || null;
  },

  // ── Users ──────────────────────────────────────────────────────────────────
  async getUsers(filter: string = 'all', search: string = ''): Promise<AdminUserListItem[]> {
    const res = await http.get(`/admin/users?filter=${filter}&search=${search}`);
    return res.data?.data || res.data;
  },

  async getUserModerationDetails(id: string): Promise<EnrichedUserDetail> {
    const res = await http.get(`/admin/users/${id}`);
    return res.data?.data || res.data;
  },

  async toggleUserStatus(
    id: string,
    status: 'active' | 'suspended',
    reason?: string,
    duration?: string,
    notes?: string,
  ) {
    return http.patch(`/admin/users/${id}/status`, { status, reason, duration, notes });
  },

  async warnUser(id: string, warningMessage: string, notes?: string): Promise<boolean> {
    const res = await http.post(`/admin/users/${id}/warn`, { warningMessage, notes });
    return res.data?.success ?? true;
  },

  async resetUserPassword(id: string): Promise<{ success: boolean; tempPassword?: string }> {
    const res = await http.post(`/admin/users/${id}/reset-password`);
    return res.data?.data || res.data;
  },

  async deleteUser(id: string, reason?: string): Promise<boolean> {
    const res = await http.delete(`/admin/users/${id}`, { data: { reason } });
    return res.data?.success ?? true;
  },

  async exportUserData(id: string): Promise<any> {
    const res = await http.get(`/admin/users/${id}/export`);
    return res.data?.data || res.data;
  },

  // ── Patient Resources ──────────────────────────────────────────────────────
  async getPatientResources(params?: { category?: string; type?: string; status?: string }): Promise<PatientResourceItem[]> {
    const res = await http.get('/admin/resources', { params });
    return res.data?.data || res.data;
  },

  async createPatientResource(data: Partial<PatientResourceItem> & { content?: string; author?: string }): Promise<PatientResourceItem> {
    const res = await http.post('/admin/resources', data);
    return res.data?.data;
  },

  async updatePatientResource(id: string, data: Partial<PatientResourceItem> & { content?: string; author?: string }): Promise<PatientResourceItem> {
    const res = await http.put(`/admin/resources/${id}`, data);
    return res.data?.data;
  },

  async deletePatientResource(id: string): Promise<boolean> {
    const res = await http.delete(`/admin/resources/${id}`);
    return res.data?.success;
  },

  async getResourceAnalytics() {
    const res = await http.get('/admin/resources/analytics');
    return res.data?.data || res.data;
  },
};
