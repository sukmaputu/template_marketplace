import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Menu,
  MessageCircle,
  Moon,
  Sun,
  X,
  User,
  LogIn,
  UserPlus,
} from "lucide-react";
import { Dropdown } from "@/components/ui/dropdown";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/components/auth/UseAuth";
import { NotificationList } from "./NotificationMenu";
import { NOTIFICATIONS } from "./notifications-data";

export function MobileMenu() {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const isDark = theme === "dark";
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = NOTIFICATIONS.filter((item) => !item.is_read).length;

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

              <Link
                to="/message"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-[color:var(--color-text)] hover:bg-[color:var(--color-background)]">
                <MessageCircle className="h-4 w-4 text-[color:var(--color-text-secondary)]" />
                Chat
              </Link>
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
            <div className="absolute right-0 top-0 z-50 flex h-fit w-[280px] flex-col rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between border-b border-[color:var(--color-border)] p-3">
                <span className="text-sm font-bold text-[color:var(--color-text)]">
                  Notifikasi
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
                <NotificationList />
              </div>
            </div>
          )}

          <div className="my-1 border-t border-[color:var(--color-border)]" />
        </div>
      )}
    </Dropdown>
  );
}
