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
      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  }

  async getModerationItems(req, res, next) {
    try {
      const type = req.query.type || 'all';
      const items = await adminService.getModerationItems(type);
      return res.status(200).json({ success: true, data: items });
    } catch (err) { next(err); }
  }

  async moderateItem(req, res, next) {
    try {
      const { type, id, action } = req.params;
      const { reason } = req.body;
      const adminId = req.user ? req.user._id : 'unknown';
      const result = await adminService.moderateItem(id, type, action, reason, adminId);
      return res.status(200).json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async getUsers(req, res, next) {
    try {
      const { filter, search } = req.query;
      const users = await adminService.getUsers(filter, search);
      return res.status(200).json({ success: true, data: users });
    } catch (err) { next(err); }
  }

  async getUserModerationDetails(req, res, next) {
    try {
      const { id } = req.params;
      const details = await adminService.getUserModerationDetails(id);
      return res.status(200).json({ success: true, data: details });
    } catch (err) { next(err); }
  }

  async toggleUserStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, reason, duration, notes } = req.body;
      const adminId = req.user ? req.user._id : null;
      const adminName = req.user ? req.user.fullName : 'Administrateur';
      const user = await adminService.toggleUserStatus(id, status, adminId, adminName, reason, duration, notes);
      return res.status(200).json({ success: true, data: user });
    } catch (err) { next(err); }
  }

  async warnUser(req, res, next) {
    try {
      const { id } = req.params;
      const { message } = req.body;
      const adminId = req.user ? req.user._id : null;
      const adminName = req.user ? req.user.fullName : 'Administrateur';
      const log = await adminService.warnUser(id, message, adminId, adminName);
      return res.status(200).json({ success: true, data: log });
    } catch (err) { next(err); }
  }

  async resetUserPassword(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user ? req.user._id : null;
      const adminName = req.user ? req.user.fullName : 'Administrateur';
      const result = await adminService.resetUserPassword(id, adminId, adminName);
      return res.status(200).json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async exportUserData(req, res, next) {
    try {
      const { id } = req.params;
      const data = await adminService.exportUserData(id);
      return res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      await adminService.deleteUser(id);
      return res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (err) { next(err); }
  }

  async getSellerVerifications(req, res, next) {
    try {
      const sellers = await adminService.getSellerVerifications();
      return res.status(200).json({ success: true, data: sellers });
    } catch (err) { next(err); }
  }

  async processSellerBadge(req, res, next) {
    try {
      const { id, action } = req.params;
      const { remarks } = req.body;
      const result = await adminService.processSellerBadge(id, action, remarks);
      return res.status(200).json({ success: true, data: result });
    } catch (err) { next(err); }
  }

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
