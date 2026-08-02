'use strict';

const { Router } = require('express');
const adminController = require('./admin.controller');
const authenticate = require('../../common/middleware/auth.middleware');
const authorize = require('../../common/middleware/role.middleware');

const router = Router();

// Protect all admin routes
router.use(authenticate);
router.use(authorize('admin'));

// ── Dashboard Stats ───────────────────────────────────────────────────────────
router.get('/stats', (req, res, next) => adminController.getDashboardStats(req, res, next));

// ── Moderation Stats ──────────────────────────────────────────────────────────
router.get('/moderation/stats', (req, res, next) => adminController.getModerationStats(req, res, next));

// ── Moderation Queue ──────────────────────────────────────────────────────────
// GET  /api/admin/moderation?type=products&status=pending&page=1&search=
router.get('/moderation', (req, res, next) => adminController.getModerationItems(req, res, next));

// GET  /api/admin/moderation/:type/:id  — single item detail
router.get('/moderation/:type/:id', (req, res, next) => adminController.getModerationItemById(req, res, next));

// PATCH actions on a specific item
router.patch('/moderation/:type/:id/approve', (req, res, next) => {
  req.params.action = 'approve';
  return adminController.moderateItem(req, res, next);
});
router.patch('/moderation/:type/:id/reject', (req, res, next) => {
  req.params.action = 'reject';
  return adminController.moderateItem(req, res, next);
});
router.patch('/moderation/:type/:id/request-revision', (req, res, next) => {
  req.params.action = 'revision';
  return adminController.moderateItem(req, res, next);
});

// Legacy POST route kept for backwards compatibility
router.post('/moderation/:type/:id/:action', (req, res, next) => adminController.moderateItem(req, res, next));

// ── Users ──────────────────────────────────────────────────────────────────────
router.get('/users',              (req, res, next) => adminController.getUsers(req, res, next));
router.get('/users/:id',          (req, res, next) => adminController.getUserModerationDetails(req, res, next));
router.patch('/users/:id/status', (req, res, next) => adminController.toggleUserStatus(req, res, next));
router.post('/users/:id/warn', (req, res, next) => adminController.warnUser(req, res, next));
router.post('/users/:id/reset-password', (req, res, next) => adminController.resetUserPassword(req, res, next));
router.get('/users/:id/export', (req, res, next) => adminController.exportUserData(req, res, next));
router.delete('/users/:id', (req, res, next) => adminController.deleteUser(req, res, next));

// ── Seller Verifications ───────────────────────────────────────────────────────
// GET /api/admin/seller-verifications?status=pending&page=1&search=
router.get('/seller-verifications',              (req, res, next) => adminController.getSellerVerifications(req, res, next));
router.patch('/seller-verifications/:id/approve', (req, res, next) => {
  req.params.action = 'approve';
  return adminController.processSellerBadge(req, res, next);
});
router.patch('/seller-verifications/:id/reject', (req, res, next) => {
  req.params.action = 'reject';
  return adminController.processSellerBadge(req, res, next);
});
router.patch('/seller-verifications/:id/request-revision', (req, res, next) => {
  req.params.action = 'revision';
  return adminController.processSellerBadge(req, res, next);
});
router.patch('/seller-verifications/:id/revoke-badge', (req, res, next) => {
  req.params.action = 'revoke-badge';
  return adminController.processSellerBadge(req, res, next);
});

// Legacy sellers routes kept for backwards compatibility
router.get('/sellers/pending',      (req, res, next) => adminController.getSellerVerifications(req, res, next));
router.post('/sellers/:id/:action', (req, res, next) => adminController.processSellerBadge(req, res, next));

// ── Shop Moderation ────────────────────────────────────────────────────────────
router.get('/shop-moderation',              (req, res, next) => adminController.getShopModerations(req, res, next));
router.patch('/shop-moderation/:id/approve', (req, res, next) => {
  req.params.action = 'approve';
  return adminController.processShopUpdate(req, res, next);
});
router.patch('/shop-moderation/:id/reject',  (req, res, next) => {
  req.params.action = 'reject';
  return adminController.processShopUpdate(req, res, next);
});

// ── Moderation History ─────────────────────────────────────────────────────────
router.get('/moderation-history',     (req, res, next) => adminController.getModerationHistory(req, res, next));
router.get('/moderation-history/:id', (req, res, next) => adminController.getModerationHistoryById(req, res, next));

// ── Patient Resources ──────────────────────────────────────────────────────────
router.get('/resources',           (req, res, next) => adminController.getPatientResources(req, res, next));
router.get('/resources/analytics', (req, res, next) => adminController.getPatientResourceAnalytics(req, res, next));
router.post('/resources',          (req, res, next) => adminController.createPatientResource(req, res, next));
router.put('/resources/:id',       (req, res, next) => adminController.updatePatientResource(req, res, next));
router.delete('/resources/:id',    (req, res, next) => adminController.deletePatientResource(req, res, next));

module.exports = router;
