'use client';
import { useState, useEffect } from 'react';
import { Bell, BellOff, Check } from 'lucide-react';
import api from '@/lib/api';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export default function NotificationBell() {
  const [status, setStatus] = useState('unknown'); // unknown | unsupported | default | granted | denied | subscribed
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setStatus('unsupported'); return;
    }
    setStatus(Notification.permission === 'granted' ? 'granted' : Notification.permission);
  }, []);

  async function subscribe() {
    if (!VAPID_PUBLIC_KEY) return;
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { setStatus('denied'); return; }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      await api.post('/api/notifications/subscribe', { subscription: sub.toJSON() });
      setStatus('subscribed');
      setFlash(true);
      setTimeout(() => setFlash(false), 2000);
    } catch { setStatus('denied'); } finally { setLoading(false); }
  }

  async function unsubscribe() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      await sub?.unsubscribe();
      await api.delete('/api/notifications/subscribe');
      setStatus('default');
    } catch { /* silent */ } finally { setLoading(false); }
  }

  if (status === 'unsupported') return null;

  const isOn = status === 'subscribed' || status === 'granted';

  return (
    <button
      onClick={isOn ? unsubscribe : subscribe}
      disabled={loading || status === 'denied'}
      title={
        status === 'denied' ? 'Notifications blocked in browser settings'
        : isOn ? 'Disable notifications'
        : 'Enable trip notifications'
      }
      className={`relative p-2 rounded-full border transition-all ${
        flash ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
        : isOn ? 'bg-violet-500/15 border-violet-500/30 text-violet-400 hover:bg-violet-500/25'
        : status === 'denied' ? 'bg-white/5 border-white/10 text-white/20 cursor-not-allowed'
        : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70 hover:border-white/20'
      }`}
    >
      {flash ? <Check className="w-4 h-4" /> : isOn ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
      {isOn && (
        <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-violet-400 rounded-full" />
      )}
    </button>
  );
}
