import Notification from '../models/Notification.js';
import NotificationSchedule from '../models/NotificationSchedule.js';
import { pick } from '../utils/helpers.js';
import { nextRun } from './schedule.service.js';

const CONTENT = ['title', 'message', 'image', 'product', 'link', 'audience', 'recipients'];
const MIN_CHECK_INTERVAL_MS = 5_000; // short enough for the 15-second test schedules
let lastCheck = 0;

/** Sends one notification from a schedule's template. `at` becomes its sent time. */
export async function sendFromSchedule(schedule, at = new Date()) {
  if (schedule.replacePrevious) {
    await Notification.updateMany({ schedule: schedule._id, isActive: true }, { isActive: false });
  }
  return Notification.create({ ...pick(schedule, CONTENT), schedule: schedule._id, createdBy: schedule.createdBy, createdAt: at });
}

/**
 * Sends every schedule whose time has come. There is no always-on process on serverless hosts,
 * so this runs at the start of store/admin notification requests (throttled per instance) and
 * from the optional cron endpoint. If several runs were missed, only one notification is sent.
 */
export async function dispatchDueSchedules({ force = false } = {}) {
  const now = new Date();
  if (!force && now - lastCheck < MIN_CHECK_INTERVAL_MS) return 0;
  lastCheck = now.getTime();

  const due = await NotificationSchedule.find({ isActive: true, nextRunAt: { $lte: now } }).limit(50).lean();
  let sent = 0;
  for (const schedule of due) {
    const next = nextRun(schedule, now);
    // Claim this run atomically so two server instances never send the same one twice.
    const claimed = await NotificationSchedule.findOneAndUpdate(
      { _id: schedule._id, nextRunAt: schedule.nextRunAt },
      { $set: { nextRunAt: next, lastRunAt: schedule.nextRunAt, isActive: Boolean(next) }, $inc: { runCount: 1 } },
    );
    if (!claimed) continue;
    await sendFromSchedule(schedule, schedule.nextRunAt);
    sent++;
  }
  return sent;
}

/** Same as dispatchDueSchedules, but never lets a scheduling problem break the request that triggered it. */
export const dispatchQuietly = () => dispatchDueSchedules().catch((err) => console.error('Notification schedule dispatch failed:', err));
