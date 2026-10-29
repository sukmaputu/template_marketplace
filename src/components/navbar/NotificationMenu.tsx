import { useState, useMemo, useEffect } from "react";
import { Bell, Megaphone, CheckCheck } from "lucide-react";
import { Dropdown } from "@/components/ui/dropdown";
import {
  NOTIFICATIONS,
  getReadNotificationIds,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/components/navbar/notifications-data";
import { useAnnouncements, type Announcement } from "@/lib/announcements";
import { fetchOrdersFromBackend, getStoredOrders } from "@/lib/orderHistory";
import type { Order } from "@/components/profile/types";
import { useAuth } from "@/components/auth/UseAuth";
import { websocketService } from "@/lib/websocket";

export interface UnifiedNotificationItem {
  id: string | number;
  title: string;
  description: string;
  time: string;
  is_read: boolean;
  notification_type: "announcement" | "order" | "promo" | "payment" | "system";
  announcement?: Announcement;
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return "Baru saja";
  try {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return "Baru saja";
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} hari lalu`;
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "Baru saja";
  }
}

interface NotificationListProps {
  notifications?: UnifiedNotificationItem[];
  onNotificationClick?: (item: UnifiedNotificationItem) => void;
  onMarkAllAsRead?: () => void;
}

export function NotificationList({
  notifications = [],
  onNotificationClick = () => {},
  onMarkAllAsRead = () => {},
}: NotificationListProps) {
  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <div>
      <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-4 py-3">
        <h3 className="text-sm font-semibold text-[color:var(--color-text)]">
          Notifikasi & Siaran
        </h3>
        {hasUnread && (
          <button
            type="button"
            onClick={onMarkAllAsRead}
            className="flex items-center gap-1 text-[11px] font-medium transition-opacity hover:opacity-80"
            style={{ color: "var(--color-primary)" }}>
            <CheckCheck className="h-3 w-3" />
            <span>Tandai dibaca</span>
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-[color:var(--color-border)]">
        {notifications.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-[color:var(--color-text-secondary)]">
            Belum ada notifikasi atau pengumuman.
          </p>
        ) : (
          notifications.map((n) => {
            const isAnnouncement = n.notification_type === "announcement";
            return (
              <a
                key={n.id}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onNotificationClick(n);
                }}
                className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[color:var(--color-background)] ${
                  !n.is_read ? "bg-[color:var(--color-primary)]/5" : ""
                }`}>
                {/* Icon indicator */}
                <div
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs ${
                    isAnnouncement
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold"
                      : "bg-[color:var(--color-border)]/60 text-[color:var(--color-text-secondary)]"
                  }`}>
                  {isAnnouncement ? (
                    <Megaphone className="h-3.5 w-3.5" />
                  ) : (
                    <Bell className="h-3.5 w-3.5" />
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {!n.is_read && (
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: "var(--color-accent)" }}
                        />
                      )}
                      <span className="truncate text-sm font-medium text-[color:var(--color-text)]">
                        {n.title}
                      </span>
                    </div>
                    {isAnnouncement && (
                      <span className="shrink-0 rounded bg-amber-500/15 px-1.5 py-0.2 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                        Pengumuman
                      </span>
                    )}
                  </div>

                  <p className="line-clamp-2 text-xs text-[color:var(--color-text-secondary)]">
                    {n.description}
                  </p>

                  <span className="text-[10px] text-[color:var(--color-text-secondary)]/80">
                    {n.time}
                  </span>
                </div>
              </a>
            );
          })
        )}
      </div>

      <div className="border-t border-[color:var(--color-border)] p-2 text-center">
        <span className="text-[11px] text-[color:var(--color-text-secondary)]">
          Real-time updates aktif
        </span>
      </div>
    </div>
  );
}

export function NotificationMenu() {
  const { announcements, readIds, markRead, markAllRead } = useAnnouncements();
  const { user } = useAuth();
  const [readNotifIds, setReadNotifIds] = useState<Set<string>>(() => getReadNotificationIds());
  const [userOrders, setUserOrders] = useState<Order[]>(() =>
    user ? getStoredOrders() : [],
  );

  useEffect(() => {
    let cancelled = false;
    async function loadUserOrders() {
      if (!user) {
        if (!cancelled) setUserOrders([]);
        return;
      }
      try {
        const fetched = await fetchOrdersFromBackend();
        if (!cancelled) {
          setUserOrders(fetched);
          return;
        }
      } catch {
        // ignore
      }
      if (!cancelled) {
        setUserOrders(getStoredOrders());
      }
    }
    void loadUserOrders();

    const onOrdersUpdated = () => void loadUserOrders();
    window.addEventListener("order-history-updated", onOrdersUpdated);
    window.addEventListener("focus", onOrdersUpdated);
    const unsubOrder = websocketService.on("order_updated", onOrdersUpdated);
    const unsubStatus = websocketService.on("order_status_updated", onOrdersUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener("order-history-updated", onOrdersUpdated);
      window.removeEventListener("focus", onOrdersUpdated);
      unsubOrder();
      unsubStatus();
    };
  }, [user?.id, user?.email]);

  useEffect(() => {
    const handleSync = () => {
      setReadNotifIds(getReadNotificationIds());
    };
    window.addEventListener("notifications-read-updated", handleSync);
    window.addEventListener("announcement-read-updated", handleSync);
    window.addEventListener("storage", handleSync);
    window.addEventListener("focus", handleSync);
    return () => {
      window.removeEventListener("notifications-read-updated", handleSync);
      window.removeEventListener("announcement-read-updated", handleSync);
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("focus", handleSync);
    };
  }, []);

  // Combine live announcements with real order notifications
  const items: UnifiedNotificationItem[] = useMemo(() => {
    const liveItems: UnifiedNotificationItem[] = announcements.map((ann) => {
      const lowerUuid = (ann.uuid || "").toLowerCase();
      const isRead =
        readIds.has(ann.uuid) ||
        readIds.has(lowerUuid) ||
        readNotifIds.has(lowerUuid) ||
        readNotifIds.has(`ann-${lowerUuid}`);

      return {
        id: `ann-${ann.uuid}`,
        title: ann.title,
        description: ann.content,
        time: formatRelativeTime(ann.created_at),
        is_read: isRead,
        notification_type: "announcement",
        announcement: ann,
      };
    });

    const orderItems: UnifiedNotificationItem[] = userOrders.map((o) => {
      const orderIdStr = String(o.orderNumber || o.id);
      const id = `order-${orderIdStr}`;
      const isRead =
        readNotifIds.has(id.toLowerCase()) ||
        readNotifIds.has(orderIdStr.toLowerCase());

      let title = "Pesanan Diproses";
      let description = `Pesanan #${orderIdStr} sedang diproses penjual.`;

      if (o.status === "completed") {
        title = "Pesanan Selesai";
        description = `Pesanan #${orderIdStr} telah selesai.`;
      } else if (o.status === "shipping") {
        title = "Pesanan Dikirim";
        description = `Pesanan #${orderIdStr} sedang dikirim.${o.trackingNumber ? ` Resi: ${o.trackingNumber}` : ""}`;
      } else if (o.status === "pending_payment") {
        title = "Menunggu Pembayaran";
        description = `Pesanan #${orderIdStr} menunggu konfirmasi pembayaran.`;
      } else if (o.status === "cancelled") {
        title = "Pesanan Dibatalkan";
        description = `Pesanan #${orderIdStr} telah dibatalkan.`;
      }

      return {
        id,
        title,
        description,
        time: o.date || "Baru saja",
        is_read: isRead,
        notification_type: "order",
      };
    });

    const mockItems: UnifiedNotificationItem[] =
      orderItems.length > 0 || user
        ? []
        : NOTIFICATIONS.map((m) => {
            const idStr = String(m.id).toLowerCase();
            const isRead = readNotifIds.has(idStr) || m.is_read;
            return {
              id: m.id,
              title: m.title,
              description: m.description,
              time: m.time,
              is_read: isRead,
              notification_type: (m.notification_type as any) || "system",
            };
          });

    return [...liveItems, ...orderItems, ...mockItems];
  }, [announcements, readIds, readNotifIds, userOrders, user]);

  const unreadCount = useMemo(() => {
    return items.filter((n) => !n.is_read).length;
  }, [items]);

  function handleMarkAllAsRead() {
    const allIds = items.map((i) => i.id);
    markAllNotificationsAsRead(allIds);
    markAllRead();
    setReadNotifIds((prev) => {
      const next = new Set(prev);
      allIds.forEach((id) => {
        const str = String(id).toLowerCase();
        next.add(str);
        if (str.startsWith("ann-")) {
          next.add(str.replace(/^ann-/, ""));
        } else {
          next.add(`ann-${str}`);
        }
      });
      return next;
    });
  }

  function handleNotificationClick(item: UnifiedNotificationItem) {
    markNotificationAsRead(item.id);
    if (item.announcement) {
      markRead(item.announcement.uuid);
    }
    setReadNotifIds((prev) => {
      const next = new Set(prev);
      const str = String(item.id).toLowerCase();
      next.add(str);
      if (str.startsWith("ann-")) {
        next.add(str.replace(/^ann-/, ""));
      } else {
        next.add(`ann-${str}`);
      }
      return next;
    });
  }

  return (
    <Dropdown
      panelClassName="w-80 sm:w-96"
      trigger={({ toggle }) => (
        <button
          onClick={toggle}
          aria-label="Notifikasi"
          className="relative rounded-full p-2 text-[color:var(--color-text)] hover:bg-[color:var(--color-border)]/40">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 ? (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold text-white animate-in zoom-in"
              style={{ backgroundColor: "var(--color-accent)" }}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </button>
      )}>
      {() => (
        <NotificationList
          notifications={items}
          onNotificationClick={handleNotificationClick}
          onMarkAllAsRead={handleMarkAllAsRead}
        />
      )}
    </Dropdown>
  );
}
