import { signToken } from '../middleware/auth.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

const authResponse = (user) => ({ token: signToken(user), user: user.toPublic() });

export async function register(req, res) {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) throw ApiError.badRequest('Name, email and password are required.');
  if (await User.exists({ email: String(email).toLowerCase() })) throw ApiError.conflict('An account with this email already exists.');

  const user = await User.create({ name, email, password, phone }); // role always defaults to 'user'
  res.status(201).json(authResponse(user));
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) throw ApiError.badRequest('Email and password are required.');

  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) throw ApiError.unauthorized('Invalid email or password.');
  if (!user.isActive) throw ApiError.forbidden('Your account has been disabled. Please contact support.');

  res.json(authResponse(user));
}

export async function me(req, res) {
  const user = await User.findById(req.user._id);
  res.json({ user: user.toPublic() });
}

export async function updateProfile(req, res) {
  const user = await User.findById(req.user._id).select('+password');
  const { name, phone, currentPassword, newPassword } = req.body;
  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (newPassword) {
    if (!(await user.matchPassword(currentPassword ?? ''))) throw ApiError.badRequest('Current password is incorrect.');
    user.password = newPassword;
  }
  await user.save();
  res.json({ user: user.toPublic() });
}
