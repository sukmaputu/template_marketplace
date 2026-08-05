import { Bell } from "lucide-react";
import { Dropdown } from "@/components/ui/dropdown";
import { NOTIFICATIONS } from "@/components/notifications-data";

export function NotificationList() {
  return (
    <div>
      <div className="border-b border-[color:var(--color-border)] px-4 py-3">
        <h3 className="text-sm font-semibold text-[color:var(--color-text)]">
          Notifikasi
        </h3>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {NOTIFICATIONS.map((n) => (
          <a
            key={n.id}
            href="#"
            className="flex flex-col gap-0.5 border-b border-[color:var(--color-border)] px-4 py-3 last:border-0 hover:bg-[color:var(--color-background)]">
            <div className="flex items-center gap-2">
              {n.isUnread ? (
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
        ))}
      </div>

      <a
        href="#"
        className="block px-4 py-2.5 text-center text-sm font-medium"
        style={{ color: "var(--color-primary)" }}>
        Lihat semua notifikasi
      </a>
    </div>
  );
}

export function NotificationMenu() {
  const unreadCount = NOTIFICATIONS.filter((n) => n.isUnread).length;

  return (
    <Dropdown
      panelClassName="w-80"
      trigger={({ toggle }) => (
        <button
          onClick={toggle}
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
      {() => <NotificationList />}
    </Dropdown>
  );
}
