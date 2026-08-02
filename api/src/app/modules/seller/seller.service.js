'use strict';

const User = require('../../../database/models/user.model');
const Product = require('../../../database/models/product.model');
const ShopModeration = require('../../../database/models/shop-moderation.model');
const ModerationHistory = require('../../../database/models/moderation-history.model');
const createHttpError = require('http-errors');

/**
 * Diff two plain objects and return an array of changed field descriptors.
 */
function diffObjects(current = {}, proposed = {}) {
  const allKeys = new Set([...Object.keys(current), ...Object.keys(proposed)]);
  const changed = [];
  for (const key of allKeys) {
    const oldVal = current[key];
    const newVal = proposed[key];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changed.push({ field: key, oldValue: oldVal ?? null, newValue: newVal ?? null });
    }
  }
  return changed;
}

class SellerService {
  /**
   * Submit a seller verification request.
   * Sets sellerVerificationStatus = 'pending' and saves uploaded document URLs.
   */
  async submitVerification(sellerId, documents = []) {
    const seller = await User.findById(sellerId).lean();
    if (!seller) throw createHttpError(404, 'Seller not found');
    if (seller.profileType !== 'pro_commerce') throw createHttpError(403, 'Only pro_commerce accounts can request verification');

    if (seller.sellerVerificationStatus === 'approved') {
      throw createHttpError(400, 'Your account is already verified');
    }

    const previousStatus = seller.sellerVerificationStatus || 'draft';

    const updated = await User.findByIdAndUpdate(
      sellerId,
      {
        sellerVerificationStatus: 'pending',
        sellerVerificationDocuments: documents,
        sellerVerificationReason: '',
        sellerVerificationNotes: '',
      },
      { new: true },
    );

    // Create history entry
    await ModerationHistory.create({
      entityType: 'seller_verification',
      entityId: sellerId,
      entityTitle: seller.storeInfo?.storeName || seller.fullName,
      action: previousStatus === 'revision_requested' ? 'resubmitted' : 'submitted',
      previousStatus,
      newStatus: 'pending',
      ownerId: sellerId,
      ownerName: seller.fullName,
    }).catch(err => console.warn('[seller-submit-history] failed:', err.message));

    return updated;
  }

  /**
   * Return the seller's current approved storeInfo.
   */
  async getShopInfo(sellerId) {
    const user = await User.findById(sellerId).select('storeInfo sellerVerificationStatus sellerBadge isVerifiedSeller').lean();
    if (!user) throw createHttpError(404, 'Seller not found');
    return {
      storeInfo: user.storeInfo || {},
      sellerVerificationStatus: user.sellerVerificationStatus,
      sellerBadge: user.sellerBadge,
      isVerifiedSeller: user.isVerifiedSeller,
    };
  }

  /**
   * Submit a shop update for admin review.
   * Diffs the proposed vs current storeInfo and creates a ShopModeration doc.
   * Does NOT apply the changes to storeInfo — admin must approve first.
   */
  async submitShopUpdate(sellerId, proposedData = {}) {
    const seller = await User.findById(sellerId).lean();
    if (!seller) throw createHttpError(404, 'Seller not found');
    if (seller.profileType !== 'pro_commerce') throw createHttpError(403, 'Only pro_commerce accounts can update shop info');

    // Block if there is already a pending update
    const existing = await ShopModeration.findOne({ sellerId, moderationStatus: 'pending' }).lean();
    if (existing) {
      throw createHttpError(409, 'A shop update is already pending admin review');
    }

    const currentData = seller.storeInfo?.toObject ? seller.storeInfo.toObject() : (seller.storeInfo || {});
    const changedFields = diffObjects(currentData, proposedData);

    if (changedFields.length === 0) {
      throw createHttpError(400, 'No changes detected compared to current shop information');
    }

    const submission = await ShopModeration.create({
      sellerId,
      shopId: sellerId,
      currentData,
      proposedData,
      changedFields,
      moderationStatus: 'pending',
    });

    // History
    await ModerationHistory.create({
      entityType: 'shop',
      entityId: submission._id,
      entityTitle: seller.storeInfo?.storeName || seller.fullName || 'Boutique',
      action: 'submitted',
      previousStatus: 'approved',
      newStatus: 'pending',
      ownerId: sellerId,
      ownerName: seller.fullName,
      shopId: sellerId,
      shopName: seller.storeInfo?.storeName || '',
      changedFields,
    }).catch(err => console.warn('[shop-submit-history] failed:', err.message));

    return submission;
  }

  /**
   * Get the seller's pending shop update (if any).
   */
  async getMyShopPendingUpdate(sellerId) {
    return ShopModeration.findOne({ sellerId, moderationStatus: 'pending' }).lean();
  }

  /**
   * Get all products owned by a seller (all moderation statuses).
   */
  async getSellerProducts(sellerId, query = {}) {
    const { page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = { sellerId };

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Product.countDocuments(filter),
    ]);

    return {
      products: products.map(p => ({
        id: p._id.toString(),
        name: p.name,
        category: p.category,
        price: p.price,
        images: p.images || [],
        moderationStatus: p.moderationStatus || 'pending',
        moderationReason: p.moderationReason || '',
        moderationNotes: p.moderationNotes || '',
        isPublic: p.isPublic || false,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    };
  }
}

module.exports = new SellerService();
