import express from 'express';
import webpush from 'web-push';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const vapidConfigured = process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY;
if (vapidConfigured) {
  webpush.setVapidDetails(
    'mailto:' + (process.env.VAPID_EMAIL || 'admin@airtripplanner.com'),
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// In-memory subscription store — replace with DB collection in production
const subscriptions = new Map(); // userId → subscription

router.use(protect);

// POST /api/notifications/subscribe
router.post('/subscribe', async (req, res) => {
  if (!vapidConfigured) return res.status(503).json({ message: 'Push notifications not configured on this server.' });
  const { subscription } = req.body;
  if (!subscription?.endpoint) return res.status(400).json({ message: 'Invalid subscription' });
  subscriptions.set(req.user._id.toString(), subscription);
  res.json({ message: 'Subscribed' });
});

// DELETE /api/notifications/subscribe
router.delete('/subscribe', async (req, res) => {
  subscriptions.delete(req.user._id.toString());
  res.json({ message: 'Unsubscribed' });
});

// POST /api/notifications/test — send a test notification to the current user
router.post('/test', async (req, res) => {
  const sub = subscriptions.get(req.user._id.toString());
  if (!sub) return res.status(404).json({ message: 'No subscription found. Enable notifications first.' });

  try {
    await webpush.sendNotification(sub, JSON.stringify({
      title: 'AI Trip Planner',
      body: '🌍 Notifications are working! You\'ll get trip reminders here.',
      icon: '/icons/icon-192.png',
      url: '/dashboard',
    }));
    res.json({ message: 'Notification sent' });
  } catch (err) {
    subscriptions.delete(req.user._id.toString());
    res.status(500).json({ message: 'Failed to send notification' });
  }
});

// Export helper for sending notifications from other routes
export async function sendPushNotification(userId, payload) {
  const sub = subscriptions.get(userId.toString());
  if (!sub) return;
  try {
    await webpush.sendNotification(sub, JSON.stringify(payload));
  } catch { subscriptions.delete(userId.toString()); }
}

export default router;
