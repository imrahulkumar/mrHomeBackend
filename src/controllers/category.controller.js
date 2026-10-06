import Category from '../models/Category.js';
import Product from '../models/Product.js';
import SubCategory from '../models/SubCategory.js';
import Video from '../models/Video.js';
import { ApiError } from '../utils/ApiError.js';
import { isAdminRequest, isObjectId, pick, uniqueSlug } from '../utils/helpers.js';

const FIELDS = ['name', 'icon', 'image', 'tagline', 'order', 'showInNav', 'isActive'];

/** GET /api/categories — categories with their sub-categories nested. Admins also get inactive ones + counts. */
export async function listCategories(req, res) {
  const admin = isAdminRequest(req);
  const filter = admin ? {} : { isActive: true };

  const [categories, subCategories] = await Promise.all([
    Category.find(filter).sort({ order: 1, name: 1 }).lean(),
    SubCategory.find(filter).sort({ order: 1, name: 1 }).lean(),
  ]);

  let counts = {};
  if (admin) {
    const rows = await Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
    counts = Object.fromEntries(rows.map((r) => [String(r._id), r.count]));
  }

  res.json(
    categories.map((c) => ({
      ...c,
      subCategories: subCategories.filter((s) => String(s.category) === String(c._id)),
      ...(admin && { productCount: counts[String(c._id)] ?? 0 }),
    })),
  );
}

/** GET /api/categories/:idOrSlug — one category + sub-categories + filter facets for the shop page. */
export async function getCategory(req, res) {
  const { idOrSlug } = req.params;
  const admin = isAdminRequest(req);
  const category = await Category.findOne({
    ...(isObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug }),
    ...(!admin && { isActive: true }),
  }).lean();
  if (!category) throw ApiError.notFound('Category not found.');

  const productMatch = { category: category._id, isActive: true };
  const [subCategories, subCounts, materials, priceRange, videos] = await Promise.all([
    SubCategory.find({ category: category._id, ...(!admin && { isActive: true }) }).sort({ order: 1, name: 1 }).lean(),
    Product.aggregate([{ $match: productMatch }, { $group: { _id: '$subCategory', count: { $sum: 1 } } }]),
    Product.aggregate([
      { $match: { ...productMatch, material: { $ne: '' } } },
      { $group: { _id: '$material', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Product.aggregate([{ $match: productMatch }, { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } }]),
    Video.find({ category: category._id, isActive: true }).sort({ order: 1, createdAt: -1 }).lean(),
  ]);

  const countBySub = Object.fromEntries(subCounts.map((r) => [String(r._id), r.count]));
  res.json({
    ...category,
    subCategories: subCategories.map((s) => ({ ...s, productCount: countBySub[String(s._id)] ?? 0 })),
    facets: {
      materials: materials.map((m) => ({ value: m._id, count: m.count })),
      price: { min: priceRange[0]?.min ?? 0, max: priceRange[0]?.max ?? 0 },
    },
    videos,
  });
}

export async function createCategory(req, res) {
  const data = pick(req.body, FIELDS);
  data.slug = await uniqueSlug(Category, req.body.slug || data.name);
  const category = await Category.create(data);
  res.status(201).json(category);
}

export async function updateCategory(req, res) {
  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound('Category not found.');

  category.set(pick(req.body, FIELDS));
  if (req.body.slug && req.body.slug !== category.slug) {
    category.slug = await uniqueSlug(Category, req.body.slug, { excludeId: category._id });
  }
  await category.save();
  res.json(category);
}

export async function deleteCategory(req, res) {
  const { id } = req.params;
  const [subs, products] = await Promise.all([SubCategory.countDocuments({ category: id }), Product.countDocuments({ category: id })]);
  if (subs || products) {
    throw ApiError.badRequest(`Cannot delete: this category still has ${subs} sub-categories and ${products} products. Move or delete them first, or mark the category inactive.`);
  }
  const deleted = await Category.findByIdAndDelete(id);
  if (!deleted) throw ApiError.notFound('Category not found.');
  await Video.updateMany({ category: id }, { category: null });
  res.json({ message: 'Category deleted.' });
}
