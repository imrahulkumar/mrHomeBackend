import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex } from '../utils/helpers.js';

/** GET /api/users (admin) ?q=&role=&page=&limit= */
export async function listUsers(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const filter = {};
  if (['user', 'admin'].includes(req.query.role)) filter.role = req.query.role;
  if (req.query.q?.trim()) {
    const rx = new RegExp(escapeRegex(req.query.q.trim()), 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }

  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) });
}

/** POST /api/users (admin) — e.g. to add another admin */
export async function createUser(req, res) {
  const { name, email, password, phone, role } = req.body;
  if (await User.exists({ email: String(email ?? '').toLowerCase() })) throw ApiError.conflict('An account with this email already exists.');
  const user = await User.create({ name, email, password, phone, role });
  res.status(201).json(user.toPublic());
}

/** PATCH /api/users/:id (admin) — change role or enable/disable */
export async function updateUser(req, res) {
  if (String(req.params.id) === String(req.user._id) && (req.body.role === 'user' || req.body.isActive === false)) {
    throw ApiError.badRequest('You cannot remove your own admin access or disable your own account.');
  }
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found.');
  if (req.body.role !== undefined) user.role = req.body.role;
  if (req.body.isActive !== undefined) user.isActive = req.body.isActive;
  if (req.body.name !== undefined) user.name = req.body.name;
  if (req.body.phone !== undefined) user.phone = req.body.phone;
  await user.save();
  res.json(user.toPublic());
}
