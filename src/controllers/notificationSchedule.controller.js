import { env } from '../config/env.js';
import NotificationSchedule from '../models/NotificationSchedule.js';
import { dispatchDueSchedules, dispatchQuietly, sendFromSchedule } from '../services/notificationDispatch.service.js';
import { ApiError } from '../utils/ApiError.js';
import { isObjectId, pick, toList } from '../utils/helpers.js';

const FIELDS = [
  'title', 'message', 'image', 'product', 'link', 'audience', 'recipients',
  'repeat', 'weekdays', 'time', 'timezone', 'startDate', 'endDate', 'replacePrevious', 'isActive',
];

const normalize = (data) => {
  if (data.product === '') data.product = null;
  if (data.endDate === '') data.endDate = null;
  if (data.recipients !== undefined) data.recipients = toList(data.recipients).filter(isObjectId);
  if (data.weekdays !== undefined) data.weekdays = toList(data.weekdays).map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
  return data;
};

/** GET /api/notifications/schedules (admin) */
export async function listSchedules(_req, res) {
  await dispatchQuietly();
  const schedules = await NotificationSchedule.find()
    .populate('product', 'name slug')
    .populate('recipients', 'name email')
    .sort({ isActive: -1, nextRunAt: 1, createdAt: -1 })
    .lean();
  res.json(schedules);
}

export async function createSchedule(req, res) {
  const schedule = await NotificationSchedule.create({ ...normalize(pick(req.body, FIELDS)), createdBy: req.user._id });
  res.status(201).json(schedule);
}

export async function updateSchedule(req, res) {
  const schedule = await NotificationSchedule.findById(req.params.id);
  if (!schedule) throw ApiError.notFound('Schedule not found.');
  schedule.set(normalize(pick(req.body, FIELDS)));
  await schedule.save();
  res.json(schedule);
}

export async function deleteSchedule(req, res) {
  const deleted = await NotificationSchedule.findByIdAndDelete(req.params.id);
  if (!deleted) throw ApiError.notFound('Schedule not found.');
  res.json({ message: 'Schedule deleted. Notifications it already sent are kept.' });
}

/** POST /api/notifications/schedules/:id/send (admin) — send one now without changing the timetable. */
export async function sendScheduleNow(req, res) {
  const schedule = await NotificationSchedule.findById(req.params.id);
  if (!schedule) throw ApiError.notFound('Schedule not found.');
  const notification = await sendFromSchedule(schedule);
  await NotificationSchedule.updateOne({ _id: schedule._id }, { $set: { lastRunAt: notification.createdAt }, $inc: { runCount: 1 } });
  res.status(201).json(notification);
}

/**
 * GET /api/notifications/cron — optional external trigger (e.g. Vercel Cron or cron-job.org) so
 * schedules fire on time even when nobody is browsing. Needs `Authorization: Bearer <CRON_SECRET>`.
 */
export async function runCron(req, res) {
  if (!env.cronSecret || req.get('authorization') !== `Bearer ${env.cronSecret}`) throw ApiError.unauthorized('Invalid cron secret.');
  res.json({ sent: await dispatchDueSchedules({ force: true }) });
}
