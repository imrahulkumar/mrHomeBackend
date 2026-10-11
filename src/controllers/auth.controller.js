import bcrypt from 'bcryptjs';
import { signToken } from '../middleware/auth.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

const authResponse = (user) => ({ token: signToken(user), user: user.toPublic() });

// Compared against when the email is unknown, so a failed login takes the same time either way
// and response timing can't reveal which emails have accounts.
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser-not-a-real-password', 12);

const isText = (...values) => values.every((v) => typeof v === 'string' && v.length > 0);

export async function register(req, res) {
  const { name, email, password, phone } = req.body;
  if (!isText(name, email, password)) throw ApiError.badRequest('Name, email and password are required.');
  if (phone !== undefined && typeof phone !== 'string') throw ApiError.badRequest('Invalid phone number.');
  if (await User.exists({ email: email.toLowerCase().trim() })) throw ApiError.conflict('An account with this email already exists.');

  const user = await User.create({ name, email, password, phone }); // role always defaults to 'user'
  res.status(201).json(authResponse(user));
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (!isText(email, password)) throw ApiError.badRequest('Email and password are required.');

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  const ok = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);
  if (!user || !ok) throw ApiError.unauthorized('Invalid email or password.');
  if (!user.isActive) throw ApiError.forbidden('Your account has been disabled. Please contact support.');

  res.json(authResponse(user));
}

export async function me(req, res) {
  const user = await User.findById(req.user._id);
  res.json({ user: user.toPublic() });
}

/** PATCH /api/auth/me — changing the password signs out every other session and returns a fresh token. */
export async function updateProfile(req, res) {
  const user = await User.findById(req.user._id).select('+password');
  const { name, phone, currentPassword, newPassword } = req.body;
  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (newPassword) {
    if (!isText(newPassword)) throw ApiError.badRequest('Invalid new password.');
    if (!isText(currentPassword) || !(await user.matchPassword(currentPassword))) throw ApiError.badRequest('Current password is incorrect.');
    user.password = newPassword;
  }
  await user.save();
  res.json(newPassword ? authResponse(user) : { user: user.toPublic() });
}
