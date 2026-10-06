import Category from '../models/Category.js';
import Product from '../models/Product.js';
import SubCategory from '../models/SubCategory.js';
import Video from '../models/Video.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex, isAdminRequest, isObjectId, pick, toList, uniqueSlug } from '../utils/helpers.js';

const FIELDS = ['name', 'description', 'category', 'subCategory', 'material', 'price', 'mrp', 'images', 'stock', 'rating', 'tags', 'isFeatured', 'isActive'];

const SORTS = {
  featured: { isFeatured: -1, createdAt: -1 },
  newest: { createdAt: -1 },
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
  rating: { rating: -1 },
  name: { name: 1 },
};

const POPULATE = [
  { path: 'category', select: 'name slug icon' },
  { path: 'subCategory', select: 'name slug icon' },
];

/**
 * GET /api/products
 * Query: category (slug|id), sub (comma slugs|ids), material (comma), minPrice, maxPrice,
 *        minRating, q, featured, sort, page, limit, status (admin: all|active|inactive)
 */
export async function listProducts(req, res) {
  const { category, sub, material, minPrice, maxPrice, minRating, q, featured, sort = 'featured', status } = req.query;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 24));
  const filter = {};

  if (isAdminRequest(req)) {
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;
  } else {
    filter.isActive = true;
  }

  if (category) {
    const cat = await Category.findOne(isObjectId(category) ? { _id: category } : { slug: category }).select('_id').lean();
    if (!cat) return res.json({ items: [], total: 0, page, pages: 0 });
    filter.category = cat._id;
  }

  const subs = toList(sub);
  if (subs.length) {
    const ids = subs.filter(isObjectId);
    const slugs = subs.filter((s) => !isObjectId(s));
    const found = await SubCategory.find({
      $or: [{ _id: { $in: ids } }, { slug: { $in: slugs }, ...(filter.category && { category: filter.category }) }],
    }).select('_id').lean();
    filter.subCategory = { $in: found.map((s) => s._id) };
  }

  const materials = toList(material);
  if (materials.length) filter.material = { $in: materials };

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lt = Number(maxPrice);
  }
  if (minRating) filter.rating = { $gte: Number(minRating) };
  if (featured === 'true') filter.isFeatured = true;

  if (q?.trim()) {
    const rx = new RegExp(escapeRegex(q.trim()), 'i');
    filter.$or = [{ name: rx }, { material: rx }, { tags: rx }, { description: rx }];
  }

  const [items, total] = await Promise.all([
    Product.find(filter).populate(POPULATE).sort(SORTS[sort] ?? SORTS.featured).skip((page - 1) * limit).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);

  res.json({ items, total, page, pages: Math.ceil(total / limit) });
}

/** GET /api/products/:idOrSlug — includes linked YouTube videos and related products. */
export async function getProduct(req, res) {
  const { idOrSlug } = req.params;
  const product = await Product.findOne({
    ...(isObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug }),
    ...(!isAdminRequest(req) && { isActive: true }),
  })
    .populate(POPULATE)
    .lean();
  if (!product) throw ApiError.notFound('Product not found.');

  const [videos, related] = await Promise.all([
    Video.find({ product: product._id, isActive: true }).sort({ order: 1 }).lean(),
    Product.find({
      _id: { $ne: product._id },
      isActive: true,
      ...(product.subCategory ? { subCategory: product.subCategory._id } : { category: product.category._id }),
    })
      .populate(POPULATE)
      .limit(4)
      .lean(),
  ]);

  res.json({ ...product, videos, related });
}

async function validateRelations(data) {
  if (data.category !== undefined && !(await Category.exists({ _id: data.category }))) {
    throw ApiError.badRequest('Please choose a valid category.');
  }
  if (data.subCategory) {
    const sub = await SubCategory.findById(data.subCategory).select('category').lean();
    if (!sub || String(sub.category) !== String(data.category)) {
      throw ApiError.badRequest('Sub-category does not belong to the selected category.');
    }
  }
}

const normalize = (data) => {
  if (data.subCategory === '') data.subCategory = null;
  if (data.mrp === '' || data.mrp === 0) data.mrp = null;
  if (typeof data.tags === 'string') data.tags = toList(data.tags);
  if (Array.isArray(data.images)) data.images = data.images.filter(Boolean);
  return data;
};

export async function createProduct(req, res) {
  const data = normalize(pick(req.body, FIELDS));
  await validateRelations(data);
  data.slug = await uniqueSlug(Product, req.body.slug || data.name);
  const product = await Product.create(data);
  res.status(201).json(await product.populate(POPULATE));
}

export async function updateProduct(req, res) {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found.');

  const data = normalize(pick(req.body, FIELDS));
  await validateRelations({ category: product.category, subCategory: product.subCategory, ...data });

  product.set(data);
  if (req.body.slug && req.body.slug !== product.slug) {
    product.slug = await uniqueSlug(Product, req.body.slug, { excludeId: product._id });
  }
  await product.save();
  res.json(await product.populate(POPULATE));
}

export async function deleteProduct(req, res) {
  const deleted = await Product.findByIdAndDelete(req.params.id);
  if (!deleted) throw ApiError.notFound('Product not found.');
  await Video.updateMany({ product: deleted._id }, { product: null });
  res.json({ message: 'Product deleted.' });
}
