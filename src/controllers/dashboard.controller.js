import Category from '../models/Category.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Video from '../models/Video.js';

/** GET /api/dashboard (admin) — headline numbers for the admin home page. */
export async function getStats(_req, res) {
  const [products, categories, customers, videos, orders, revenue, byStatus, recentOrders, lowStock] = await Promise.all([
    Product.countDocuments(),
    Category.countDocuments(),
    User.countDocuments({ role: 'user' }),
    Video.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([{ $match: { status: { $ne: 'cancelled' } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(5).lean(),
    Product.find({ stock: { $lte: 3 } }).select('name stock').sort({ stock: 1 }).limit(5).lean(),
  ]);

  res.json({
    counts: { products, categories, customers, videos, orders },
    revenue: revenue[0]?.total ?? 0,
    ordersByStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
    recentOrders,
    lowStock,
  });
}
