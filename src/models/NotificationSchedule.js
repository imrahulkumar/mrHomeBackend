import mongoose from 'mongoose';
import { isValidTimeZone, nextRun } from '../services/schedule.service.js';
import { AUDIENCES } from './Notification.js';

export const REPEATS = ['once', 'daily', 'alternate', 'weekly'];
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const TIMING_FIELDS = ['repeat', 'weekdays', 'time', 'timezone', 'startDate', 'endDate', 'isActive'];

/** A notification template that is sent automatically on a repeating timetable. */
const scheduleSchema = new mongoose.Schema(
  {
    // What gets sent: same fields as a Notification.
    title: { type: String, required: [true, 'Title is required.'], trim: true, maxlength: 120 },
    message: { type: String, required: [true, 'Message is required.'], trim: true, maxlength: 1000 },
    image: { type: String, trim: true, default: '' },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    link: { type: String, trim: true, default: '' },
    audience: { type: String, enum: AUDIENCES, default: 'all' },
    recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // When: once / every day / every other day (counted from startDate) / weekly on `weekdays`.
    repeat: { type: String, enum: REPEATS, default: 'daily' },
    weekdays: [{ type: Number, min: 0, max: 6 }], // 0 = Sunday
    time: { type: String, required: true, match: [TIME, 'Time must be HH:mm.'] },
    timezone: { type: String, default: 'Asia/Kolkata' },
    startDate: { type: String, required: [true, 'Start date is required.'], match: [DATE, 'Start date must be YYYY-MM-DD.'] },
    endDate: { type: String, default: null, match: [DATE, 'End date must be YYYY-MM-DD.'] },
    replacePrevious: { type: Boolean, default: true }, // hide the last one sent by this schedule when sending a new one

    isActive: { type: Boolean, default: true },
    nextRunAt: { type: Date, default: null },
    lastRunAt: { type: Date, default: null },
    runCount: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

scheduleSchema.pre('validate', function check() {
  if (this.audience === 'users' && !this.recipients?.length) this.invalidate('recipients', 'Pick at least one customer to send to.');
  if (this.audience !== 'users') this.recipients = [];
  if (this.repeat === 'weekly' && !this.weekdays?.length) this.invalidate('weekdays', 'Pick at least one day of the week.');
  if (this.repeat !== 'weekly') this.weekdays = [];
  if (!isValidTimeZone(this.timezone)) this.invalidate('timezone', 'Unknown time zone.');
  if (this.endDate && this.startDate && this.endDate < this.startDate) this.invalidate('endDate', 'End date must be after the start date.');
  if (this.errors) return;

  // Re-plan only when the timing changed, so editing the text doesn't skip a send that is due.
  if (this.isNew || TIMING_FIELDS.some((f) => this.isModified(f))) {
    this.nextRunAt = this.isActive ? nextRun(this) : null;
    if (this.isActive && !this.nextRunAt) {
      this.invalidate(this.repeat === 'once' ? 'time' : 'endDate', 'This schedule has no future send time. Pick a later date or time.');
    }
  }
});

scheduleSchema.index({ isActive: 1, nextRunAt: 1 });

export default mongoose.model('NotificationSchedule', scheduleSchema);
