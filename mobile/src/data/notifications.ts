/**
 * Yerel (cihaz içi) bildirimler — 2. El fiyat takibi demo için.
 * Forum / mesaj bildirimleri Firestore: `src/api/notifications.ts`
 */
export type NotifType = 'priceDown' | 'priceUp' | 'forum' | 'system' | 'message';

export type AppNotification = {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  time: number;
  isRead: boolean;
};

let notifications: AppNotification[] = [];

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function subscribeNotifications(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getNotifications(): AppNotification[] {
  return notifications;
}

export function getUnreadCount(): number {
  return notifications.filter((n) => !n.isRead).length;
}

export function addNotification(
  notif: Omit<AppNotification, 'isRead'> & { isRead?: boolean },
) {
  notifications = [{ isRead: false, ...notif }, ...notifications];
  emit();
}

export function markAllRead() {
  notifications = notifications.map((n) => ({ ...n, isRead: true }));
  emit();
}

export function markRead(id: string) {
  notifications = notifications.map((n) =>
    n.id === id ? { ...n, isRead: true } : n,
  );
  emit();
}

export function removeNotification(id: string) {
  notifications = notifications.filter((n) => n.id !== id);
  emit();
}

export { timeAgo } from '../api/notifications';
