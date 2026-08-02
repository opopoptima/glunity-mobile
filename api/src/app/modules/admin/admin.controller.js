'use strict';

const adminService = require('./admin.service');

class AdminController {
  /**
   * GET /api/admin/stats?period=7d
   */
  async getDashboardStats(req, res, next) {
    try {
      const period = req.query.period || '7d';
      const stats = await adminService.getDashboardStats(period);
      return res.status(200).json({ success: true, data: stats });
    } catch (err) { next(err); }
  }

  /**
   * GET /api/admin/moderation/stats
   */
  async getModerationStats(req, res, next) {
    try {
      const stats = await adminService.getModerationStats();
      return res.status(200).json({ success: true, data: stats });
    } catch (err) { next(err); }
  }

  /**
   * GET /api/admin/moderation?type=products&status=pending&page=1&search=
   */
  async getModerationItems(req, res, next) {
    try {
      const { type = 'all', status = 'pending', page = 1, limit = 20, search = '' } = req.query;
      const items = await adminService.getModerationItems(type, status, page, limit, search);
      return res.status(200).json({ success: true, data: items });
    } catch (err) { next(err); }
  }

  /**
   * GET /api/admin/moderation/:type/:id
   */
  async getModerationItemById(req, res, next) {
    try {
      const { type, id } = req.params;
      const item = await adminService.getModerationItemById(type, id);
      if (!item) return res.status(404).json({ success: false, message: 'Not found' });
      return res.status(200).json({ success: true, data: item });
    } catch (err) { next(err); }
  }

  /**
   * PATCH /api/admin/moderation/:type/:id/approve
   * PATCH /api/admin/moderation/:type/:id/reject
   * PATCH /api/admin/moderation/:type/:id/request-revision
   * Legacy: POST /api/admin/moderation/:type/:id/:action
   */
  async moderateItem(req, res, next) {
    try {
      const adminId = req.user._id || req.user.id;
      const { type, id, action } = req.params;
      const { reason, notes } = req.body || {};
      // Normalize action names
      const normalizedAction = action === 'approve' ? 'approve'
        : action === 'reject' ? 'reject'
        : (action === 'request-revision' || action === 'revision') ? 'revision'
        : action;
      const result = await adminService.moderateItem(adminId, id, type, normalizedAction, reason, notes);
      return res.status(200).json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  // ── Users ──────────────────────────────────────────────────────────────────

  async getUsers(req, res, next) {
    try {
      const { filter, search } = req.query;
      const users = await adminService.getUsers(filter, search);
      return res.status(200).json({ success: true, data: users });
    } catch (err) { next(err); }
  }

  async toggleUserStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const user = await adminService.toggleUserStatus(id, status);
      return res.status(200).json({ success: true, data: user });
    } catch (err) { next(err); }
  }

  // ── Sellers ────────────────────────────────────────────────────────────────

  /**
   * GET /api/admin/sellers/pending → kept for legacy compat
   * GET /api/admin/seller-verifications?status=pending&page=1&search=
   */
  async getSellerVerifications(req, res, next) {
    try {
      const { status = 'pending', page = 1, search = '' } = req.query;
      const result = await adminService.getSellerVerifications(status, page, search);
      return res.status(200).json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  /**
   * POST /api/admin/sellers/:id/:action  (legacy)
   * PATCH /api/admin/seller-verifications/:id/approve
   * PATCH /api/admin/seller-verifications/:id/reject
   * PATCH /api/admin/seller-verifications/:id/request-revision
   * PATCH /api/admin/seller-verifications/:id/revoke-badge
   */
  async processSellerBadge(req, res, next) {
    try {
      const adminId = req.user._id || req.user.id;
      const { id, action } = req.params;
      const { reason, remarks } = req.body || {};
      const normalizedAction = action === 'approve' ? 'approve'
        : action === 'reject' ? 'reject'
        : (action === 'request-revision' || action === 'revision') ? 'revision'
        : action === 'revoke-badge' ? 'revoke'
        : action;
      const result = await adminService.processSellerBadge(adminId, id, normalizedAction, reason || remarks);
      return res.status(200).json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  // ── Shop Moderation ────────────────────────────────────────────────────────

  async getShopModerations(req, res, next) {
    try {
      const { status = 'pending', page = 1 } = req.query;
      const result = await adminService.getShopModerations(status, page);
      return res.status(200).json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async processShopUpdate(req, res, next) {
    try {
      const adminId = req.user._id || req.user.id;
      const { id, action } = req.params;
      const { reason } = req.body || {};
      const result = await adminService.processShopUpdate(adminId, id, action, reason);
      return res.status(200).json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  // ── Moderation History ─────────────────────────────────────────────────────

  async getModerationHistory(req, res, next) {
    try {
      const { entityType, action, adminId, ownerId, from, to, page = 1, limit = 20 } = req.query;
      const result = await adminService.getModerationHistory(
        { entityType, action, adminId, ownerId, from, to },
        page,
        limit,
      );
      return res.status(200).json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async getModerationHistoryById(req, res, next) {
    try {
      const { id } = req.params;
      const entry = await adminService.getModerationHistoryById(id);
      if (!entry) return res.status(404).json({ success: false, message: 'History entry not found' });
      return res.status(200).json({ success: true, data: entry });
    } catch (err) { next(err); }
  }

  // ── Patient Resources ──────────────────────────────────────────────────────

  async getPatientResources(req, res, next) {
    try {
      const { category, type, status } = req.query;
      const resources = await adminService.getPatientResources({ category, type, status });
      return res.status(200).json({ success: true, data: resources });
    } catch (err) { next(err); }
  }

  async createPatientResource(req, res, next) {
    try {
      const resource = await adminService.createPatientResource(req.body);
      return res.status(201).json({ success: true, data: resource });
    } catch (err) { next(err); }
  }

  async updatePatientResource(req, res, next) {
    try {
      const { id } = req.params;
      const resource = await adminService.updatePatientResource(id, req.body);
      return res.status(200).json({ success: true, data: resource });
    } catch (err) { next(err); }
  }

  async deletePatientResource(req, res, next) {
    try {
      const { id } = req.params;
      await adminService.deletePatientResource(id);
      return res.status(200).json({ success: true, message: 'Deleted successfully' });
    } catch (err) { next(err); }
  }

  async getPatientResourceAnalytics(req, res, next) {
    try {
      const analytics = await adminService.getPatientResourceAnalytics();
      return res.status(200).json({ success: true, data: analytics });
    } catch (err) { next(err); }
  }
}

module.exports = new AdminController();
