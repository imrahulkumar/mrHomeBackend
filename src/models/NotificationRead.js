import mongoose from 'mongoose';

/**
 * One row per (notification, viewer) once the viewer has read it.
 * `viewer` is `u:<userId>` for logged-in customers or `d:<deviceId>` for guests.
 */
const notificationReadSchema = new mongoose.Schema({
  notification: { type: mongoose.Schema.Types.ObjectId, ref: 'Notification', required: true },
  viewer: { type: String, required: true },
  readAt: { type: Date, default: Date.now },
});

notificationReadSchema.index({ notification: 1, viewer: 1 }, { unique: true });
notificationReadSchema.index({ viewer: 1 });

export default mongoose.model('NotificationRead', notificationReadSchema);
