'use strict';

const sellerService = require('./seller.service');

class SellerController {
  async submitVerification(req, res, next) {
    try {
      const sellerId = req.user._id || req.user.id;
      const { documents = [] } = req.body;
      const result = await sellerService.submitVerification(sellerId, documents);
      return res.status(200).json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async getShopInfo(req, res, next) {
    try {
      const sellerId = req.user._id || req.user.id;
      const result = await sellerService.getShopInfo(sellerId);
      return res.status(200).json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async submitShopUpdate(req, res, next) {
    try {
      const sellerId = req.user._id || req.user.id;
      const result = await sellerService.submitShopUpdate(sellerId, req.body);
      return res.status(201).json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async getMyShopPendingUpdate(req, res, next) {
    try {
      const sellerId = req.user._id || req.user.id;
      const pending = await sellerService.getMyShopPendingUpdate(sellerId);
      return res.status(200).json({ success: true, data: pending || null });
    } catch (err) { next(err); }
  }

  async getSellerProducts(req, res, next) {
    try {
      const sellerId = req.user._id || req.user.id;
      const result = await sellerService.getSellerProducts(sellerId, req.query);
      return res.status(200).json({ success: true, data: result });
    } catch (err) { next(err); }
  }
}

module.exports = new SellerController();
