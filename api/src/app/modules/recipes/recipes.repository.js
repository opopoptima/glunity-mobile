'use strict';

const Recipe = require('../../../database/models/recipe.model');

// Public listing query: only approved + public
const PUBLIC_QUERY = { isPublic: true, moderationStatus: 'approved' };

const recipesRepository = {
  create(data) {
    return Recipe.create(data);
  },

  findById(id) {
    return Recipe.findOne({ _id: id, ...PUBLIC_QUERY });
  },

  /**
   * Admin-only findById — no visibility restrictions.
   */
  findByIdForAdmin(id) {
    return Recipe.findById(id)
      .populate('authorId', 'fullName avatar email')
      .populate('approvedBy', 'fullName')
      .populate('moderatedBy', 'fullName');
  },

  async findMany({ category, search, page = 1, limit = 20 }) {
    const query = { ...PUBLIC_QUERY };

    if (category) query.category = category;
    if (search)   query.$text = { $search: search };

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Recipe.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Recipe.countDocuments(query),
    ]);

    return { items, total, page, limit };
  },

  /**
   * Admin-only listing — all statuses, with full population.
   */
  async findForAdmin(filter = {}, options = {}) {
    const { skip = 0, limit = 20, sort = { createdAt: -1 } } = options;

    const [items, total] = await Promise.all([
      Recipe.find(filter)
        .populate('authorId', 'fullName avatar email')
        .populate('approvedBy', 'fullName')
        .populate('moderatedBy', 'fullName')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Recipe.countDocuments(filter),
    ]);

    return { items, total };
  },

  updateByIdForAuthor(id, authorId, updates) {
    return Recipe.findOneAndUpdate(
      { _id: id, authorId },
      { $set: updates },
      { returnDocument: 'after', runValidators: true },
    );
  },

  deleteByIdForAuthor(id, authorId) {
    return Recipe.findOneAndDelete({ _id: id, authorId });
  },

  setFavorite(recipeId, userId, value) {
    return Recipe.findByIdAndUpdate(
      recipeId,
      value ? { $addToSet: { favoritedBy: userId } } : { $pull: { favoritedBy: userId } },
      { returnDocument: 'after' },
    );
  },
};

module.exports = recipesRepository;
