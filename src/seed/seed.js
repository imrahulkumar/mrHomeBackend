/**
 * Seeds the database with settings, an admin account and a sample catalogue.
 *   npm run seed         → only fills empty collections (safe to re-run)
 *   npm run seed:reset   → wipes categories, sub-categories, products and videos first
 * Users and orders are never deleted.
 */
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { env } from '../config/env.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Setting from '../models/Setting.js';
import SubCategory from '../models/SubCategory.js';
import User from '../models/User.js';
import Video from '../models/Video.js';
import { slugify } from '../utils/helpers.js';
import { categories, products } from './seedData.js';

const reset = process.argv.includes('--reset');

async function seedAdmin() {
  const { name, email, password } = env.admin;
  if (!email || !password) return console.log('• ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin user.');
  if (await User.exists({ email: email.toLowerCase() })) return console.log(`• Admin ${email} already exists.`);
  await User.create({ name, email, password, role: 'admin' });
  console.log(`✓ Admin created: ${email}`);
}

async function seedCatalogue() {
  if (reset) {
    await Promise.all([Category.deleteMany({}), SubCategory.deleteMany({}), Product.deleteMany({}), Video.deleteMany({})]);
    console.log('✓ Catalogue cleared.');
  } else if (await Category.exists({})) {
    return console.log('• Catalogue already has data — skipping (use `npm run seed:reset` to replace it).');
  }

  const catIds = {};
  const subIds = {};
  for (const { subCategories, ...cat } of categories) {
    const created = await Category.create(cat);
    catIds[cat.slug] = created._id;
    for (const [i, sub] of subCategories.entries()) {
      const s = await SubCategory.create({ ...sub, category: created._id, order: i + 1 });
      subIds[`${cat.slug}/${sub.slug}`] = s._id;
    }
  }

  await Product.insertMany(
    products.map((prod) => ({
      ...prod,
      slug: slugify(prod.name),
      category: catIds[prod.category],
      subCategory: subIds[`${prod.category}/${prod.subCategory}`],
      stock: 10,
    })),
  );
  console.log(`✓ Seeded ${categories.length} categories and ${products.length} products.`);
}

try {
  await connectDB();
  await Setting.getSingleton();
  console.log('✓ Site settings ready.');
  await seedAdmin();
  await seedCatalogue();
} catch (err) {
  console.error('Seed failed:', err);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
