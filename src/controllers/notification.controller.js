import Notification from '../models/Notification.js';
import NotificationRead from '../models/NotificationRead.js';
import { ApiError } from '../utils/ApiError.js';
import { isObjectId, pick, toList } from '../utils/helpers.js';

const FIELDS = ['title', 'message', 'image', 'product', 'link', 'audience', 'recipients', 'showAsPopup', 'expiresAt', 'isActive'];
const FEED_LIMIT = 30;
const DEVICE_ID = /^[\w-]{8,64}$/;

const normalize = (data) => {
  if (data.product === '') data.product = null;
  if (data.expiresAt === '') data.expiresAt = null;
  if (data.recipients !== undefined) data.recipients = toList(data.recipients).filter(isObjectId);
  return data;
};

/**
 * Who is asking: a logged-in user, or a guest identified by the anonymous
 * `X-Device-Id` the store keeps in localStorage. Null when neither is present.
 */
function viewerOf(req) {
  if (req.user) return `u:${req.user._id}`;
  const device = req.get('x-device-id');
  return device && DEVICE_ID.test(device) ? `d:${device}` : null;
}

/** Active, unexpired notifications meant for this request's viewer. */
function feedFilter(req) {
  const audience = req.user
    ? { $or: [{ audience: { $in: ['all', 'registered'] } }, { audience: 'users', recipients: req.user._id }] }
    : { audience: { $in: ['all', 'guests'] } };
  return {
    isActive: true,
    $and: [audience, { $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] }],
  };
}

/** GET /api/notifications/feed — the current visitor's notifications, newest first, each with `read`. */
export async function getFeed(req, res) {
  const viewer = viewerOf(req);
  const items = await Notification.find(feedFilter(req))
    .select('title message image product link showAsPopup createdAt')
    .populate('product', 'name slug')
    .sort({ createdAt: -1 })
    .limit(FEED_LIMIT)
    .lean();

  const readIds = viewer
    ? new Set((await NotificationRead.find({ viewer, notification: { $in: items.map((n) => n._id) } }).distinct('notification')).map(String))
    : new Set();

  const feed = items.map((n) => ({ ...n, read: readIds.has(String(n._id)) }));
  res.json({ items: feed, unread: feed.filter((n) => !n.read).length });
}

/** POST /api/notifications/read { ids?: [] } — marks the given notifications (or all in the feed) as read. */
export async function markRead(req, res) {
  const viewer = viewerOf(req);
  if (!viewer) throw ApiError.badRequest('Missing device id.');

  const filter = feedFilter(req);
  if (req.body?.ids !== undefined) filter._id = { $in: toList(req.body.ids).filter(isObjectId) };
  const ids = (await Notification.find(filter).select('_id').sort({ createdAt: -1 }).limit(FEED_LIMIT).lean()).map((n) => n._id);

  if (ids.length) {
    await NotificationRead.bulkWrite(
      ids.map((notification) => ({
        updateOne: { filter: { notification, viewer }, update: { $setOnInsert: { readAt: new Date() } }, upsert: true },
      })),
      { ordered: false },
    );
  }
  res.json({ marked: ids.length });
}

/** GET /api/notifications (admin) ?page=&limit= — includes how many viewers have read each one. */
export async function listNotifications(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);

  const [items, total] = await Promise.all([
    Notification.find()
      .populate('product', 'name slug')
      .populate('recipients', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Notification.countDocuments(),
  ]);

  const counts = await NotificationRead.aggregate([
    { $match: { notification: { $in: items.map((n) => n._id) } } },
    { $group: { _id: '$notification', count: { $sum: 1 } } },
  ]);
  const readCount = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));

  res.json({
    items: items.map((n) => ({ ...n, readCount: readCount[String(n._id)] ?? 0 })),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}

/** POST /api/notifications (admin) — sends it: it shows up for the chosen audience right away. */
export async function createNotification(req, res) {
  const notification = await Notification.create({ ...normalize(pick(req.body, FIELDS)), createdBy: req.user._id });
  res.status(201).json(notification);
}

export async function updateNotification(req, res) {
  const notification = await Notification.findById(req.params.id);
  if (!notification) throw ApiError.notFound('Notification not found.');
  notification.set(normalize(pick(req.body, FIELDS)));
  await notification.save();
  res.json(notification);
}

export async function deleteNotification(req, res) {
  const deleted = await Notification.findByIdAndDelete(req.params.id);
  if (!deleted) throw ApiError.notFound('Notification not found.');
  await NotificationRead.deleteMany({ notification: deleted._id });
  res.json({ message: 'Notification deleted.' });
}
