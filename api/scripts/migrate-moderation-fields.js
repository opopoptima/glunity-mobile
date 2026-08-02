/**
 * Migration: backfill moderationStatus and isPublic fields on existing data.
 *
 * Usage:
 *   cd api && node scripts/migrate-moderation-fields.js
 *
 * This script is idempotent — re-running it will not double-apply changes.
 */

'use strict';

require('../src/app/bootstrap/env.bootstrap');

const connectDB = require('../src/app/bootstrap/db.bootstrap');
const Product = require('../src/database/models/product.model');
const Recipe  = require('../src/database/models/recipe.model');
const User    = require('../src/database/models/user.model');

async function migrateProducts() {
  console.log('\n📦 Migrating Products...');

  // All products without a moderationStatus: assume they are live/approved
  const result = await Product.updateMany(
    { moderationStatus: { $exists: false } },
    { $set: { moderationStatus: 'approved', isPublic: true } },
  );
  console.log(`  ✅ Set ${result.modifiedCount} products to approved + isPublic=true`);
}

async function migrateRecipes() {
  console.log('\n🍽️  Migrating Recipes...');

  // Published recipes → approved + public
  const r1 = await Recipe.updateMany(
    { moderationStatus: { $exists: false }, isPublished: true },
    { $set: { moderationStatus: 'approved', isPublic: true } },
  );
  console.log(`  ✅ Set ${r1.modifiedCount} published recipes to approved + isPublic=true`);

  // Unpublished recipes → approved + public (assume existing content is live)
  const r2 = await Recipe.updateMany(
    { moderationStatus: { $exists: false } },
    { $set: { moderationStatus: 'approved', isPublic: true } },
  );
  console.log(`  ✅ Set ${r2.modifiedCount} remaining recipes to approved + isPublic=true`);
}

async function migrateSellers() {
  console.log('\n🏪 Migrating Sellers...');

  // Already verified sellers: set approved + badge
  const r1 = await User.updateMany(
    {
      profileType: 'pro_commerce',
      sellerVerificationStatus: { $exists: false },
      $or: [{ 'storeInfo.isVerified': true }, { isSellerVerified: true }],
    },
    {
      $set: {
        sellerVerificationStatus: 'approved',
        sellerBadge: 'verified',
        isVerifiedSeller: true,
      },
    },
  );
  console.log(`  ✅ Set ${r1.modifiedCount} verified sellers to approved status`);

  // All remaining pro_commerce without a status → draft
  const r2 = await User.updateMany(
    {
      profileType: 'pro_commerce',
      sellerVerificationStatus: { $exists: false },
    },
    {
      $set: {
        sellerVerificationStatus: 'draft',
        sellerBadge: 'none',
        isVerifiedSeller: false,
      },
    },
  );
  console.log(`  ✅ Set ${r2.modifiedCount} unverified sellers to draft status`);
}

async function main() {
  console.log('🔄 Starting moderation field migration...');
  await connectDB();

  await migrateProducts();
  await migrateRecipes();
  await migrateSellers();

  console.log('\n✅ Migration complete.\n');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
