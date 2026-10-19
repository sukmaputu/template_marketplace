import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Sun,
  User,
  UserPlus,
  X,
} from "lucide-react";
import { Dropdown } from "@/components/ui/dropdown";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/components/auth/UseAuth";
import { CURRENCIES, useCurrency } from "@/components/navbar/CurrencySwitcher";
import { ConfirmSignOutModal } from "@/components/navbar/ConfirmSignOutModal";
import {
  NotificationList,
  type UnifiedNotificationItem,
} from "./NotificationMenu";
import {
  NOTIFICATIONS,
  getReadNotificationIds,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "./notifications-data";
import { useAnnouncements } from "@/lib/announcements";

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

export function MobileMenu() {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const { currency, setCurrency } = useCurrency();
  const isDark = theme === "dark";
  const [showNotifications, setShowNotifications] = useState(false);
  const [showConfirmSignOut, setShowConfirmSignOut] = useState(false);

  const { announcements, readIds, markRead, markAllRead } = useAnnouncements();
  const [readNotifIds, setReadNotifIds] = useState<Set<string>>(() => getReadNotificationIds());

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

    const mockItems: UnifiedNotificationItem[] = NOTIFICATIONS.map((m) => {
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

    return [...liveItems, ...mockItems];
  }, [announcements, readIds, readNotifIds]);

  const unreadCount = useMemo(() => {
    return items.filter((item) => !item.is_read).length;
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
    <>
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
        {({ close }) => (
          <div className="relative py-2">
            {isAuthenticated && (
              <div className="px-4 py-3 mb-1">
                <p className="text-xs font-semibold text-[color:var(--color-text-secondary)] uppercase tracking-wider">
                  Akun
                </p>
                <p className="text-sm font-bold text-[color:var(--color-text)] truncate">
                  {user?.full_name}
                </p>
              </div>
            )}

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

            <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-[color:var(--color-text)]">
              <span className="flex items-center gap-3">
                <span className="text-base leading-none">
                  {CURRENCIES.find((c) => c.code === currency)?.flag}
                </span>
                Mata Uang
              </span>
              <div className="flex overflow-hidden rounded-md border border-[color:var(--color-border)]">
                {CURRENCIES.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setCurrency(c.code)}
                    className={`px-2 py-1 text-xs font-medium transition-colors ${
                      currency === c.code
                        ? "bg-[color:var(--color-primary)] text-white"
                        : "text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-background)]"
                    }`}>
                    {c.code}
                  </button>
                ))}
              </div>
            </div>

            <div className="my-1 border-t border-[color:var(--color-border)]" />

            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[color:var(--color-text)] hover:bg-[color:var(--color-background)]">
                  <User className="h-4 w-4 text-[color:var(--color-text-secondary)]" />
                  Profil Saya
                </Link>

                <button
                  type="button"
                  onClick={() => setShowNotifications(true)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-sm text-[color:var(--color-text)] hover:bg-[color:var(--color-background)]">
                  <span className="flex items-center gap-3">
                    <Bell className="h-4 w-4 text-[color:var(--color-text-secondary)]" />
                    Notifikasi
                  </span>
                  {unreadCount > 0 && (
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[11px] font-semibold text-white"
                      style={{ backgroundColor: "var(--color-accent)" }}>
                      {unreadCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    close();
                    setShowConfirmSignOut(true);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-[color:var(--color-background)]">
                  <LogOut className="h-4 w-4" />
                  Keluar
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/sign-in"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[color:var(--color-text)] hover:bg-[color:var(--color-background)]">
                  <LogIn className="h-4 w-4 text-[color:var(--color-text-secondary)]" />
                  Masuk
                </Link>
                <Link
                  to="/sign-up"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[color:var(--color-text)] hover:bg-[color:var(--color-background)]">
                  <UserPlus className="h-4 w-4 text-[color:var(--color-text-secondary)]" />
                  Daftar Akun
                </Link>
              </>
            )}

            {showNotifications && (
              <div className="absolute right-0 top-0 z-50 flex h-fit w-[280px] sm:w-[320px] flex-col rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between border-b border-[color:var(--color-border)] p-3">
                  <span className="text-sm font-bold text-[color:var(--color-text)]">
                    Notifikasi & Pengumuman
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowNotifications(false);
                    }}
                    className="rounded-md p-1 hover:bg-[color:var(--color-background)]">
                    <X className="h-4 w-4 text-[color:var(--color-text-secondary)]" />
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto p-1">
                  <NotificationList
                    notifications={items}
                    onNotificationClick={handleNotificationClick}
                    onMarkAllAsRead={handleMarkAllAsRead}
                  />
                </div>
              </div>
            )}

            <div className="my-1 border-t border-[color:var(--color-border)]" />
          </div>
        )}
      </Dropdown>

      <ConfirmSignOutModal
        open={showConfirmSignOut}
        onCancel={() => setShowConfirmSignOut(false)}
        onConfirm={() => {
          setShowConfirmSignOut(false);
          logout();
          navigate("/", { replace: true });
        }}
      />
    </>
  );
}
