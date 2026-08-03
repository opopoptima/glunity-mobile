const Establishment = require('../../../database/models/establishment.model');

/**
 * Migration helper to ensure all existing registered pro sellers automatically have an Establishment record.
 */
exports.migrateLegacySellerEstablishments = async () => {
  try {
    const User = require('../../../database/models/user.model');
    const sellers = await User.find({
      $or: [
        { role: 'seller' },
        { profileType: { $regex: 'pro', $options: 'i' } },
        { 'storeInfo.storeName': { $exists: true, $ne: '' } },
      ],
    });

    let migratedCount = 0;
    for (const seller of sellers) {
      const existing = await Establishment.findOne({ owner: seller._id });
      if (!existing) {
        const storeInfo = seller.storeInfo || {};
        await Establishment.create({
          owner: seller._id,
          name: storeInfo.storeName || seller.fullName || 'Magasin Sans Gluten',
          category: 'Supermarket',
          description: storeInfo.description || '',
          address: storeInfo.address || '',
          phone: storeInfo.phone || seller.phone || '',
          coverImageUrl: storeInfo.imageUrl || seller.avatar || '',
          openTime: '08:00',
          closeTime: '19:00',
          daysClosed: ['Sunday'],
          coordinates: { latitude: 36.8065, longitude: 10.1815 },
        });
        migratedCount++;
      }
    }
    if (migratedCount > 0) {
      console.log(`[Establishment Migration] Automatically migrated ${migratedCount} legacy pro seller stores to map establishments.`);
    }
  } catch (err) {
    console.error('[Establishment Migration Error]', err.message);
  }
};

/**
 * Get public establishments list for Map and Search
 */
exports.getEstablishments = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const filter = {};

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const establishments = await Establishment.find(filter)
      .populate('owner', 'fullName email avatar phone')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: establishments,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get single establishment by ID
 */
exports.getEstablishmentById = async (req, res, next) => {
  try {
    const establishment = await Establishment.findById(req.params.id).populate('owner', 'fullName email avatar phone');

    if (!establishment) {
      return res.status(404).json({
        success: false,
        message: 'Établissement non trouvé',
      });
    }

    return res.json({
      success: true,
      data: establishment,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get all establishments owned by current logged in seller (multi-store support)
 * Strictly deduplicated so each boutique appears only once.
 */
exports.getMyEstablishments = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const ShopModeration = require('../../../database/models/shop-moderation.model');

    const [rawEstablishments, shopModerations] = await Promise.all([
      Establishment.find({ owner: userId }).sort({ createdAt: -1 }),
      ShopModeration.find({ sellerId: userId }).sort({ updatedAt: -1 }).lean().catch(() => []),
    ]);

    const moderationMap = new Map();
    for (const mod of shopModerations) {
      if (mod.establishmentId && !moderationMap.has(mod.establishmentId.toString())) {
        moderationMap.set(mod.establishmentId.toString(), mod);
      }
      if (mod.proposedData?.storeName && !moderationMap.has(mod.proposedData.storeName.trim().toLowerCase())) {
        moderationMap.set(mod.proposedData.storeName.trim().toLowerCase(), mod);
      }
    }

    const seen = new Set();
    const uniqueEstablishments = [];

    for (const est of rawEstablishments) {
      const nameKey = (est.name || '').trim().toLowerCase();
      const idKey = est._id.toString();

      if (!seen.has(nameKey) && !seen.has(idKey)) {
        seen.add(nameKey);
        seen.add(idKey);

        const mod = moderationMap.get(idKey) || moderationMap.get(nameKey);
        const estObj = est.toObject ? est.toObject() : { ...est };

        if (mod) {
          estObj.moderationStatus = mod.moderationStatus;
          estObj.moderationReason = mod.reason || mod.moderationReason || '';
          estObj.moderationNotes = mod.notes || mod.moderationNotes || '';
        }

        uniqueEstablishments.push(estObj);
      }
    }

    return res.json({
      success: true,
      data: uniqueEstablishments,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Create or update an establishment
 */
exports.upsertEstablishment = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const {
      id,
      name,
      category,
      description,
      address,
      phone,
      openTime,
      closeTime,
      daysClosed,
      latitude,
      longitude,
      coverImageUrl,
      logoUrl,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Le nom du magasin est obligatoire',
      });
    }

    const payload = {
      owner: userId,
      name: name.trim(),
      category: category || 'Other',
      description: description ? description.trim() : '',
      address: address ? address.trim() : '',
      phone: phone ? phone.trim() : '',
      openTime: openTime || '08:00',
      closeTime: closeTime || '19:00',
      daysClosed: Array.isArray(daysClosed) ? daysClosed : ['Sunday'],
      coordinates: {
        latitude: typeof latitude === 'number' ? latitude : 36.8065,
        longitude: typeof longitude === 'number' ? longitude : 10.1815,
      },
    };

    if (coverImageUrl) payload.coverImageUrl = coverImageUrl;
    if (logoUrl) payload.logoUrl = logoUrl;

    let establishment;
    if (id) {
      // Update existing store owned by user
      establishment = await Establishment.findOneAndUpdate(
        { _id: id, owner: userId },
        { $set: payload },
        { new: true, runValidators: true }
      );
      if (!establishment) {
        return res.status(404).json({
          success: false,
          message: 'Magasin non trouvé ou non autorisé',
        });
      }
    } else {
      // Create new store for seller
      establishment = await Establishment.create(payload);
    }

    // Upsert ShopModeration (update existing pending or create new) — prevents duplicates in admin queue
    try {
      const ShopModeration = require('../../../database/models/shop-moderation.model');
      const ModerationHistory = require('../../../database/models/moderation-history.model');
      const User = require('../../../database/models/user.model');

      const seller = await User.findById(userId).select('fullName email storeInfo').lean();

      const proposedData = {
        storeName: payload.name,
        category: payload.category,
        description: payload.description,
        address: payload.address,
        phone: payload.phone,
        openTime: payload.openTime,
        closeTime: payload.closeTime,
        coverImageUrl: payload.coverImageUrl,
      };

      const currentData = seller?.storeInfo || {};

      const changedFields = [
        { field: 'Nom du magasin', oldValue: currentData.storeName ?? null, newValue: payload.name },
        { field: 'Catégorie', oldValue: currentData.category ?? null, newValue: payload.category },
        { field: 'Adresse', oldValue: currentData.address ?? null, newValue: payload.address },
        { field: 'Téléphone', oldValue: currentData.phone ?? null, newValue: payload.phone },
      ].filter(cf => JSON.stringify(cf.oldValue) !== JSON.stringify(cf.newValue));

      const finalChangedFields = changedFields.length > 0
        ? changedFields
        : [{ field: id ? 'Modification boutique' : 'Nouveau point de vente', oldValue: null, newValue: payload.name }];

      // Upsert: update existing pending submission OR create new one (prevents duplicate entries)
      const submission = await ShopModeration.findOneAndUpdate(
        { sellerId: userId, moderationStatus: 'pending' },
        {
          $set: {
            shopId: userId,
            establishmentId: establishment._id,
            currentData,
            proposedData,
            changedFields: finalChangedFields,
            moderationStatus: 'pending',
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      await ModerationHistory.create({
        entityType: 'shop',
        entityId: submission._id,
        entityTitle: payload.name || 'Boutique',
        action: 'submitted',
        previousStatus: 'approved',
        newStatus: 'pending',
        ownerId: userId,
        ownerName: seller?.fullName || '',
        shopId: userId,
        shopName: payload.name || '',
        changedFields: finalChangedFields,
      }).catch(err => console.warn('[shop-history] failed:', err.message));
    } catch (modErr) {
      console.warn('[Shop Moderation Upsert Warning]', modErr.message);
    }

    // Sync corresponding Location record for map rendering
    try {
      const Location = require('../../../database/models/location.model');
      let locCat = 'other';
      const c = (establishment.category || '').toLowerCase();
      if (c.includes('restaurant')) locCat = 'restaurant';
      else if (c.includes('bakery') || c.includes('boulangerie')) locCat = 'bakery';
      else if (c.includes('supermarket') || c.includes('grocery') || c.includes('supermarché')) locCat = 'grocery';
      else if (c.includes('pharmacy') || c.includes('pharmacie')) locCat = 'pharmacy';
      else if (c.includes('bio') || c.includes('cafe')) locCat = 'cafe';

      await Location.findOneAndUpdate(
        { $or: [{ establishmentId: establishment._id }, { name: establishment.name, createdBy: userId }] },
        {
          $set: {
            establishmentId: establishment._id,
            name: establishment.name,
            category: locCat,
            description: establishment.description,
            address: establishment.address,
            phone: establishment.phone,
            glutenFree: true,
            certified: establishment.verified || false,
            location: {
              type: 'Point',
              coordinates: [establishment.coordinates.longitude, establishment.coordinates.latitude],
            },
            images: establishment.coverImageUrl ? [{ url: establishment.coverImageUrl }] : [],
            createdBy: userId,
          }
        },
        { upsert: true, new: true }
      );
    } catch (locErr) {
      console.warn('[Location Sync Warning]', locErr.message);
    }

    return res.status(id ? 200 : 201).json({
      success: true,
      message: id ? 'Magasin mis à jour avec succès' : 'Nouveau magasin créé avec succès',
      data: establishment,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Delete an establishment
 */
exports.deleteEstablishment = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const estId = req.params.id;

    const establishment = await Establishment.findOneAndDelete({ _id: estId, owner: userId });

    if (!establishment) {
      return res.status(404).json({
        success: false,
        message: 'Magasin non trouvé ou non autorisé',
      });
    }

    // Delete any duplicate establishment records with the same store name for this owner
    if (establishment.name) {
      await Establishment.deleteMany({
        owner: userId,
        name: { $regex: `^${establishment.name.trim()}$`, $options: 'i' },
      }).catch(err => console.warn('[deleteEstablishment duplicates warning]', err.message));
    }

    // Clean up corresponding ShopModeration and Location records
    try {
      const ShopModeration = require('../../../database/models/shop-moderation.model');
      const Location = require('../../../database/models/location.model');

      await Promise.all([
        ShopModeration.deleteMany({ $or: [{ establishmentId: estId }, { sellerId: userId, 'proposedData.storeName': establishment.name }] }),
        Location.deleteMany({ $or: [{ establishmentId: estId }, { name: establishment.name, createdBy: userId }] }),
      ]);
    } catch (cleanErr) {
      console.warn('[deleteEstablishment cleanup warning]', cleanErr.message);
    }

    return res.json({
      success: true,
      message: 'Magasin supprimé avec succès',
    });
  } catch (error) {
    return next(error);
  }
};
