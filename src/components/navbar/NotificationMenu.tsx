import { useState } from "react";
import { Bell } from "lucide-react";
import { Dropdown } from "@/components/ui/dropdown";
import {
  NOTIFICATIONS,
  type Notification,
} from "@/components/navbar/notifications-data";

interface NotificationListProps {
  notifications?: Notification[];
  onNotificationClick?: (id: Notification["id"]) => void;
}

export function NotificationList({
  notifications = NOTIFICATIONS,
  onNotificationClick = () => {},
}: NotificationListProps) {
  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <div>
      <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-4 py-3">
        <h3 className="text-sm font-semibold text-[color:var(--color-text)]">
          Notifikasi
        </h3>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-[color:var(--color-text-secondary)]">
            Belum ada notifikasi.
          </p>
        ) : (
          notifications.map((n) => (
            <a
              key={n.id}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onNotificationClick(n.id);
              }}
              className="flex flex-col gap-0.5 border-b border-[color:var(--color-border)] px-4 py-3 last:border-0 hover:bg-[color:var(--color-background)]">
              <div className="flex items-center gap-2">
                {!n.is_read ? (
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  />
                ) : null}
                <span className="text-sm font-medium text-[color:var(--color-text)]">
                  {n.title}
                </span>
              </div>
              <p className="text-xs text-[color:var(--color-text-secondary)]">
                {n.description}
              </p>
              <span className="text-[11px] text-[color:var(--color-text-secondary)]">
                {n.time}
              </span>
            </a>
          ))
        )}
      </div>

      <a
        href="#"
        className="block px-4 py-2.5 text-center text-sm font-medium"
        style={{
          color: "var(--color-primary)",
          opacity: hasUnread ? 1 : 0.5,
          pointerEvents: hasUnread ? "auto" : "none",
        }}>
        Lihat semua notifikasi
      </a>
    </div>
  );
}

export function NotificationMenu() {
  const [notifications, setNotifications] =
    useState<Notification[]>(NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  function markAllAsRead() {
    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        is_read: true,
        read_at: new Date().toISOString(),
      })),
    );
  }

  function markOneAsRead(id: Notification["id"]) {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
              ...n,
              is_read: true,
              read_at: new Date().toISOString(),
            }
          : n,
      ),
    );
  }

  return (
    <Dropdown
      panelClassName="w-80"
      trigger={({ toggle }) => (
        <button
          onClick={() => {
            markAllAsRead();
            toggle();
          }}
          aria-label="Notifikasi"
          className="relative rounded-full p-2 text-[color:var(--color-text)] hover:bg-[color:var(--color-border)]/40">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 ? (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold text-white"
              style={{ backgroundColor: "var(--color-accent)" }}>
              {unreadCount}
            </span>
          ) : null}
        </button>
      )}>
      {() => (
        <NotificationList
          notifications={notifications}
          onNotificationClick={markOneAsRead}
        />
      )}
    </Dropdown>
  );
}
