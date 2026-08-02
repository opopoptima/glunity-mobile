'use strict';

const createHttpError = require('http-errors');
const productsRepository = require('./products.repository');
const Notification = require('../../../database/models/notification.model');

// Fields sellers must never be allowed to set directly
const PROTECTED_FIELDS = [
  'moderationStatus', 'isPublic', 'approvedAt', 'approvedBy',
  'moderatedAt', 'moderatedBy', 'moderationReason', 'moderationNotes',
  'sellerId', 'views',
];

function stripProtectedFields(data) {
  const safe = { ...data };
  PROTECTED_FIELDS.forEach((f) => delete safe[f]);
  return safe;
}

// Fields whose change triggers a re-moderation cycle
const RE_MODERATION_FIELDS = ['name', 'ingredients', 'price', 'images', 'category', 'certifiedGF', 'isGlutenFree'];

class ProductsService {
  async create(productData, userId) {
    const safe = stripProtectedFields(productData);

    const newProduct = {
      ...safe,
      sellerId: userId,
      moderationStatus: 'pending',
      isPublic: false,
    };

    const product = await productsRepository.create(newProduct);
    return product;
  }

  async getById(id) {
    const product = await productsRepository.findById(id);
    if (!product) {
      throw createHttpError(404, 'Product not found');
    }
    return product;
  }

  async incrementViews(id) {
    return productsRepository.incrementViews(id);
  }

  async list(query = {}) {
    const { page = 1, limit = 20, category, search, sellerId } = query;

    // Public listing: only approved public products
    const filter = { isPublic: true, moderationStatus: 'approved' };

    if (category)  filter.category = category;
    if (sellerId)  filter.sellerId = sellerId;
    if (search)    filter.$text = { $search: search };

    const skip = (page - 1) * limit;
    const options = { skip, limit, sort: { createdAt: -1 } };

    const { products, total } = await productsRepository.find(filter, options);

    return {
      products,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async update(id, updateData, userId) {
    const product = await productsRepository.findById(id);
    if (!product) throw createHttpError(404, 'Product not found');

    const sellerIdStr = product.sellerId._id
      ? product.sellerId._id.toString()
      : product.sellerId.toString();

    if (sellerIdStr !== userId.toString()) {
      throw createHttpError(403, 'You are not authorized to update this product');
    }

    const safe = stripProtectedFields(updateData);

    // Any seller edit resets to pending — content must be re-approved
    safe.moderationStatus = 'pending';
    safe.isPublic = false;
    safe.moderationReason = '';
    safe.moderationNotes = '';

    return productsRepository.updateById(id, safe);
  }

  async remove(id, userId) {
    const product = await productsRepository.findById(id);
    if (!product) throw createHttpError(404, 'Product not found');

    const sellerIdStr = product.sellerId._id
      ? product.sellerId._id.toString()
      : product.sellerId.toString();

    if (sellerIdStr !== userId.toString()) {
      throw createHttpError(403, 'You are not authorized to delete this product');
    }

    await productsRepository.deleteById(id);
    return { success: true };
  }
}

module.exports = new ProductsService();
