'use strict';

const Product = require('../../../database/models/product.model');

class ProductsRepository {
  async create(productData) {
    const product = new Product(productData);
    return product.save();
  }

  async findById(id) {
    return Product.findById(id).populate('sellerId', 'fullName avatar storeInfo');
  }

  async findOne(filter) {
    return Product.findOne(filter).populate('sellerId', 'fullName avatar storeInfo');
  }

  /**
   * Public product listing — filters to approved + public only by default.
   */
  async find(filter = {}, options = {}) {
    const { skip = 0, limit = 20, sort = { createdAt: -1 } } = options;

    const safeFilter = { isPublic: true, moderationStatus: 'approved', ...filter };

    const [products, total] = await Promise.all([
      Product.find(safeFilter)
        .populate('sellerId', 'fullName avatar storeInfo')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      Product.countDocuments(safeFilter),
    ]);

    return { products, total };
  }

  /**
   * Admin-only listing — no visibility restrictions.
   */
  async findForAdmin(filter = {}, options = {}) {
    const { skip = 0, limit = 20, sort = { createdAt: -1 } } = options;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('sellerId', 'fullName avatar email storeInfo')
        .populate('approvedBy', 'fullName')
        .populate('moderatedBy', 'fullName')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      Product.countDocuments(filter),
    ]);

    return { products, total };
  }

  async updateById(id, updateData) {
    return Product.findByIdAndUpdate(id, updateData, { returnDocument: 'after' })
      .populate('sellerId', 'fullName avatar storeInfo');
  }

  async deleteById(id) {
    return Product.findByIdAndDelete(id);
  }

  async incrementViews(id) {
    return Product.findByIdAndUpdate(id, { $inc: { views: 1 } }, { returnDocument: 'after' });
  }
}

module.exports = new ProductsRepository();
