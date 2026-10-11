import { Router } from 'express';
import {
  createNotification,
  deleteNotification,
  getFeed,
  listNotifications,
  markRead,
  updateNotification,
} from '../controllers/notification.controller.js';
import {
  createSchedule,
  deleteSchedule,
  listSchedules,
  runCron,
  sendScheduleNow,
  updateSchedule,
} from '../controllers/notificationSchedule.controller.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// Store side: logged-in customers are identified by their token, guests by the X-Device-Id header.
router.get('/feed', getFeed);
router.post('/read', markRead);
router.get('/cron', runCron);

// Repeating / scheduled notifications
router.get('/schedules', requireAdmin, listSchedules);
router.post('/schedules', requireAdmin, createSchedule);
router.put('/schedules/:id', requireAdmin, updateSchedule);
router.delete('/schedules/:id', requireAdmin, deleteSchedule);
router.post('/schedules/:id/send', requireAdmin, sendScheduleNow);

router.get('/', requireAdmin, listNotifications);
router.post('/', requireAdmin, createNotification);
router.put('/:id', requireAdmin, updateNotification);
router.delete('/:id', requireAdmin, deleteNotification);

export default router;
