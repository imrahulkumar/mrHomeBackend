import crypto from 'node:crypto';
import Order, { ORDER_STATUSES, PAYMENT_METHODS } from '../models/Order.js';
import Product from '../models/Product.js';
import Setting from '../models/Setting.js';
import { chargePayment } from '../services/payment.service.js';
import { ApiError } from '../utils/ApiError.js';

const newOrderNumber = () => `ORD-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

/**
 * POST /api/orders
 * Body: { items: [{ product, qty }], address, payment: { method, cardLast4?, upiId? } }
 * Prices and totals are always recalculated from the database — never trusted from the client.
 */
export async function createOrder(req, res) {
  const { items = [], address = {}, payment = {} } = req.body;
  if (!Array.isArray(items) || items.length === 0) throw ApiError.badRequest('Your cart is empty.');
  const missing = ['fullName', 'phone', 'line1', 'city', 'state', 'pincode'].filter((k) => !String(address[k] ?? '').trim());
  if (missing.length) throw ApiError.badRequest(`Please fill in your shipping address (${missing.join(', ')}).`);

  const settings = await Setting.getSingleton();
  if (!PAYMENT_METHODS.includes(payment.method) || !settings.paymentMethods?.[payment.method]) {
    throw ApiError.badRequest('Please choose an available payment method.');
  }

  const ids = items.map((i) => i.product);
  const products = await Product.find({ _id: { $in: ids }, isActive: true }).lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const orderItems = items.map(({ product: id, qty }) => {
    const p = byId.get(String(id));
    const quantity = Math.floor(Number(qty));
    if (!p) throw ApiError.badRequest('One of the items in your cart is no longer available.');
    if (!(quantity >= 1)) throw ApiError.badRequest(`Invalid quantity for ${p.name}.`);
    if (p.stock < quantity) throw ApiError.badRequest(`Only ${p.stock} left in stock for ${p.name}.`);
    return { product: p._id, name: p.name, image: p.images?.[0] ?? '', price: p.price, qty: quantity };
  });

  const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  const gst = Math.round((subtotal * settings.gstRate) / 100);
  const shipping = subtotal >= settings.freeShippingThreshold ? 0 : settings.shippingFee;
  const total = subtotal + gst + shipping;

  // Reserve stock atomically before charging, so a sold-out item never results in a paid-but-failed order.
  const reserved = [];
  const releaseStock = () => Promise.all(reserved.map((r) => Product.updateOne({ _id: r.product }, { $inc: { stock: r.qty } })));
  for (const item of orderItems) {
    const ok = await Product.updateOne({ _id: item.product, stock: { $gte: item.qty } }, { $inc: { stock: -item.qty } });
    if (!ok.modifiedCount) {
      await releaseStock();
      throw ApiError.badRequest(`${item.name} just went out of stock.`);
    }
    reserved.push(item);
  }

  let charge;
  try {
    charge = await chargePayment({ method: payment.method, amount: total, details: payment });
  } catch (err) {
    await releaseStock();
    throw err;
  }

  const order = await Order.create({
    orderNumber: newOrderNumber(),
    user: req.user._id,
    items: orderItems,
    address,
    subtotal,
    gst,
    shipping,
    total,
    payment: {
      method: payment.method,
      status: charge.status,
      transactionId: charge.transactionId,
      paidAt: charge.status === 'paid' ? new Date() : null,
    },
    status: charge.status === 'paid' ? 'confirmed' : 'pending',
  });

  res.status(201).json(order);
}

/** GET /api/orders/mine */
export async function myOrders(req, res) {
  res.json(await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).lean());
}

/** GET /api/orders (admin) ?status=&q=&page=&limit= */
export async function listOrders(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const filter = {};
  if (ORDER_STATUSES.includes(req.query.status)) filter.status = req.query.status;
  if (req.query.q) filter.orderNumber = { $regex: req.query.q.trim().replace(/[^\w-]/g, ''), $options: 'i' };

  const [items, total] = await Promise.all([
    Order.find(filter).populate('user', 'name email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) });
}

/** GET /api/orders/:id — owner or admin */
export async function getOrder(req, res) {
  const order = await Order.findById(req.params.id).populate('user', 'name email').lean();
  if (!order) throw ApiError.notFound('Order not found.');
  if (req.user.role !== 'admin' && String(order.user._id) !== String(req.user._id)) throw ApiError.notFound('Order not found.');
  res.json(order);
}

/** PATCH /api/orders/:id/status (admin) */
export async function updateOrderStatus(req, res) {
  const { status, paymentStatus } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found.');

  if (status) {
    if (!ORDER_STATUSES.includes(status)) throw ApiError.badRequest('Invalid status.');
    if (status === 'cancelled' && order.status !== 'cancelled') {
      await Promise.all(order.items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.qty } })));
    }
    order.status = status;
  }
  if (paymentStatus) {
    order.payment.status = paymentStatus;
    if (paymentStatus === 'paid' && !order.payment.paidAt) order.payment.paidAt = new Date();
  }
  await order.save();
  res.json(await order.populate('user', 'name email'));
}
