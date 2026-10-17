export interface Notification {
  id: string | number;
  title: string;
  description: string;
  time: string;
  is_read: boolean;
  read_at?: string | null;
  notification_type?: string;
}

export const NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    title: "Pesanan dikonfirmasi",
    description: "Pesanan #12345 sedang diproses penjual.",
    time: "10 menit lalu",
    is_read: false,
    notification_type: "order",
  },
  {
    id: 2,
    title: "Promo spesial untukmu",
    description: "Diskon 20% untuk kategori Business & Promotion.",
    time: "2 jam lalu",
    is_read: false,
    notification_type: "promo",
  },
  {
    id: 3,
    title: "Pembayaran berhasil",
    description: "Pembayaran pesanan #12210 telah diterima.",
    time: "1 hari lalu",
    is_read: true,
    notification_type: "payment",
  },
];

const READ_NOTIFICATIONS_STORAGE_KEY = "marketplace_notifications_read";

/**
 * Get the set of all read notification IDs from localStorage (case-insensitive string IDs).
 */
export function getReadNotificationIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(READ_NOTIFICATIONS_STORAGE_KEY);
    const rawAnn = localStorage.getItem("marketplace_read_announcements");
    const ids = new Set<string>();

    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((id) => ids.add(String(id).toLowerCase()));
      }
    }

    if (rawAnn) {
      const parsedAnn = JSON.parse(rawAnn);
      if (Array.isArray(parsedAnn)) {
        parsedAnn.forEach((id) => {
          const str = String(id).toLowerCase();
          ids.add(str);
          ids.add(`ann-${str}`);
        });
      }
    }

    return ids;
  } catch {
    return new Set();
  }
}

/**
 * Mark a single notification ID as read and persist to localStorage.
 */
export function markNotificationAsRead(id: string | number): void {
  if (typeof window === "undefined") return;
  try {
    const ids = getReadNotificationIds();
    const str = String(id).toLowerCase();
    ids.add(str);
    if (str.startsWith("ann-")) {
      ids.add(str.replace(/^ann-/, ""));
    } else {
      ids.add(`ann-${str}`);
    }

    localStorage.setItem(
      READ_NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify(Array.from(ids)),
    );
    window.dispatchEvent(new CustomEvent("notifications-read-updated"));
  } catch (err) {
    console.error("Failed to mark notification as read:", err);
  }
}

/**
 * Mark a list of notification IDs as read and persist to localStorage.
 */
export function markAllNotificationsAsRead(ids: (string | number)[]): void {
  if (typeof window === "undefined") return;
  try {
    const current = getReadNotificationIds();
    for (const id of ids) {
      const str = String(id).toLowerCase();
      current.add(str);
      if (str.startsWith("ann-")) {
        current.add(str.replace(/^ann-/, ""));
      } else {
        current.add(`ann-${str}`);
      }
    }

    localStorage.setItem(
      READ_NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify(Array.from(current)),
    );
    window.dispatchEvent(new CustomEvent("notifications-read-updated"));
  } catch (err) {
    console.error("Failed to mark all notifications as read:", err);
  }
}
