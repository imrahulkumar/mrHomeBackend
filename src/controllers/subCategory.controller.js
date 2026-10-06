import Category from '../models/Category.js';
import Product from '../models/Product.js';
import SubCategory from '../models/SubCategory.js';
import { ApiError } from '../utils/ApiError.js';
import { isAdminRequest, pick, uniqueSlug } from '../utils/helpers.js';

const FIELDS = ['name', 'category', 'icon', 'image', 'order', 'isActive'];

/** GET /api/subcategories?category=<id> */
export async function listSubCategories(req, res) {
  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  if (!isAdminRequest(req)) filter.isActive = true;

  const subs = await SubCategory.find(filter).populate('category', 'name slug').sort({ order: 1, name: 1 }).lean();

  if (isAdminRequest(req)) {
    const rows = await Product.aggregate([{ $group: { _id: '$subCategory', count: { $sum: 1 } } }]);
    const counts = Object.fromEntries(rows.map((r) => [String(r._id), r.count]));
    return res.json(subs.map((s) => ({ ...s, productCount: counts[String(s._id)] ?? 0 })));
  }
  res.json(subs);
}

export async function createSubCategory(req, res) {
  const data = pick(req.body, FIELDS);
  if (!data.category || !(await Category.exists({ _id: data.category }))) throw ApiError.badRequest('Please choose a valid parent category.');
  data.slug = await uniqueSlug(SubCategory, req.body.slug || data.name, { scope: { category: data.category } });
  const sub = await SubCategory.create(data);
  res.status(201).json(sub);
}

export async function updateSubCategory(req, res) {
  const sub = await SubCategory.findById(req.params.id);
  if (!sub) throw ApiError.notFound('Sub-category not found.');

  const data = pick(req.body, FIELDS);
  const movingCategory = data.category && String(data.category) !== String(sub.category);
  if (movingCategory) {
    if (!(await Category.exists({ _id: data.category }))) throw ApiError.badRequest('Please choose a valid parent category.');
    if (await Product.exists({ subCategory: sub._id })) {
      throw ApiError.badRequest('Cannot move a sub-category that has products. Reassign its products first.');
    }
  }

  sub.set(data);
  if (movingCategory || (req.body.slug && req.body.slug !== sub.slug)) {
    sub.slug = await uniqueSlug(SubCategory, req.body.slug || sub.slug, { excludeId: sub._id, scope: { category: sub.category } });
  }
  await sub.save();
  res.json(sub);
}

export async function deleteSubCategory(req, res) {
  const count = await Product.countDocuments({ subCategory: req.params.id });
  if (count) throw ApiError.badRequest(`Cannot delete: ${count} products use this sub-category. Reassign them first or mark it inactive.`);
  const deleted = await SubCategory.findByIdAndDelete(req.params.id);
  if (!deleted) throw ApiError.notFound('Sub-category not found.');
  res.json({ message: 'Sub-category deleted.' });
}
