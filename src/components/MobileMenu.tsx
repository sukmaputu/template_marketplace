import { useState } from "react";
import { Bell, Menu, MessageCircle, Moon, Sun } from "lucide-react";
import { Dropdown } from "@/components/ui/dropdown";
import { useTheme } from "@/hooks/use-theme";
import { NotificationList } from "./NotificationMenu";
import { NOTIFICATIONS } from "./notifications-data";

export function MobileMenu() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = NOTIFICATIONS.filter((item) => item.isUnread).length;

  return (
    <Dropdown
      panelClassName="w-64"
      trigger={({ toggle }) => (
        <button
          onClick={toggle}
          aria-label="Menu"
          className="rounded-full p-2 text-[color:var(--color-text)] hover:bg-[color:var(--color-border)]/40">
          <Menu className="h-5 w-5" />
        </button>
      )}>
      {() => (
        <div className="py-2">
          <button
            onClick={toggleTheme}
            className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-sm text-[color:var(--color-text)] hover:bg-[color:var(--color-background)]">
            <span className="flex items-center gap-3">
              {isDark ? (
                <Sun className="h-4 w-4 text-[color:var(--color-text-secondary)]" />
              ) : (
                <Moon className="h-4 w-4 text-[color:var(--color-text-secondary)]" />
              )}
              Tema
            </span>
            <span className="text-xs text-[color:var(--color-text-secondary)]">
              {isDark ? "Gelap" : "Terang"}
            </span>
          </button>

          <div className="my-1 border-t border-[color:var(--color-border)]" />

          <button
            type="button"
            onClick={() => setShowNotifications((prev) => !prev)}
            className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-sm text-[color:var(--color-text)] hover:bg-[color:var(--color-background)]">
            <span className="flex items-center gap-3">
              <Bell className="h-4 w-4 text-[color:var(--color-text-secondary)]" />
              Notifikasi
            </span>
            <span
              className="rounded-full px-1.5 py-0.5 text-[11px] font-semibold text-white"
              style={{ backgroundColor: "var(--color-accent)" }}>
              {unreadCount}
            </span>
          </button>

          {showNotifications ? (
            <div className="mx-2 mb-2 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
              <NotificationList />
            </div>
          ) : null}

          <a
            href="/message"
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[color:var(--color-text)] hover:bg-[color:var(--color-background)]">
            <MessageCircle className="h-4 w-4 text-[color:var(--color-text-secondary)]" />
            Chat
          </a>
          <div className="my-1 border-t border-[color:var(--color-border)]" />
        </div>
      )}
    </Dropdown>
  );
}
