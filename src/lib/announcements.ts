import { useEffect, useState, useCallback, useMemo } from "react";
import api from "@/lib/api";
import { websocketService } from "@/lib/websocket";

export interface Announcement {
  uuid: string;
  created_by_user_id?: string;
  title: string;
  content: string;
  target_scope?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: {
    uuid: string;
    email?: string;
    username?: string;
    full_name?: string;
  };
}

const READ_ANNOUNCEMENTS_STORAGE_KEY = "marketplace_read_announcements";

// Get list of read announcement UUIDs from localStorage
export function getReadAnnouncementIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const ids = new Set<string>();
    const rawAnn = localStorage.getItem(READ_ANNOUNCEMENTS_STORAGE_KEY);
    const rawNotif = localStorage.getItem("marketplace_notifications_read");

    if (rawAnn) {
      const parsed = JSON.parse(rawAnn);
      if (Array.isArray(parsed)) {
        parsed.forEach((id) => {
          const str = String(id).toLowerCase();
          ids.add(str);
          ids.add(`ann-${str}`);
        });
      }
    }

    if (rawNotif) {
      const parsedNotif = JSON.parse(rawNotif);
      if (Array.isArray(parsedNotif)) {
        parsedNotif.forEach((id) => {
          const str = String(id).toLowerCase();
          ids.add(str);
          if (str.startsWith("ann-")) {
            ids.add(str.replace(/^ann-/, ""));
          }
        });
      }
    }

    return ids;
  } catch {
    return new Set();
  }
}

// Check if an announcement has been read
export function isAnnouncementRead(uuid: string): boolean {
  if (!uuid) return false;
  const norm = uuid.toLowerCase();
  const set = getReadAnnouncementIds();
  return set.has(norm) || set.has(`ann-${norm}`);
}

// Mark a single announcement as read
export function markAnnouncementAsRead(uuid: string): void {
  if (typeof window === "undefined" || !uuid) return;
  try {
    const current = getReadAnnouncementIds();
    const norm = uuid.toLowerCase();
    if (!current.has(norm)) {
      current.add(norm);
      current.add(`ann-${norm}`);
      localStorage.setItem(
        READ_ANNOUNCEMENTS_STORAGE_KEY,
        JSON.stringify(Array.from(current)),
      );
      localStorage.setItem(
        "marketplace_notifications_read",
        JSON.stringify(Array.from(current)),
      );
      window.dispatchEvent(new CustomEvent("announcement-read-updated"));
      window.dispatchEvent(new CustomEvent("notifications-read-updated"));
    }
  } catch (err) {
    console.error("Failed to mark announcement as read:", err);
  }
}

// Mark multiple announcements as read
export function markAllAnnouncementsAsRead(announcements: Announcement[]): void {
  if (typeof window === "undefined") return;
  try {
    const current = getReadAnnouncementIds();
    let changed = false;
    for (const a of announcements) {
      if (!a.uuid) continue;
      const norm = a.uuid.toLowerCase();
      if (!current.has(norm)) {
        current.add(norm);
        current.add(`ann-${norm}`);
        changed = true;
      }
    }
    if (changed) {
      localStorage.setItem(
        READ_ANNOUNCEMENTS_STORAGE_KEY,
        JSON.stringify(Array.from(current)),
      );
      localStorage.setItem(
        "marketplace_notifications_read",
        JSON.stringify(Array.from(current)),
      );
      window.dispatchEvent(new CustomEvent("announcement-read-updated"));
      window.dispatchEvent(new CustomEvent("notifications-read-updated"));
    }
  } catch (err) {
    console.error("Failed to mark all announcements as read:", err);
  }
}

// API methods
export const announcementApi = {
  async getActive(): Promise<Announcement[]> {
    try {
      const res = await api.get<{
        success: boolean;
        message: string;
        data?: Announcement[];
      }>("/cms/announcements/active");
      if (res.data?.data && Array.isArray(res.data.data)) {
        return res.data.data;
      }
    } catch (err) {
      console.warn("[announcementApi.getActive] Primary API failed, trying localhost fallback:", err);
    }

    try {
      const fallbackRes = await fetch("http://localhost:8080/api/v1/cms/announcements/active");
      if (fallbackRes.ok) {
        const json = await fallbackRes.json();
        return json.data ?? [];
      }
    } catch {
      // ignore
    }

    return [];
  },

  async getAll(): Promise<Announcement[]> {
    try {
      const res = await api.get<{
        success: boolean;
        message: string;
        data?: Announcement[];
      }>("/cms/announcements");
      return res.data?.data ?? [];
    } catch (err) {
      console.warn("[announcementApi.getAll] Failed:", err);
      return [];
    }
  },

  async getById(id: string): Promise<Announcement | null> {
    try {
      const res = await api.get<{
        success: boolean;
        message: string;
        data?: Announcement;
      }>(`/cms/announcements/${id}`);
      return res.data?.data ?? null;
    } catch (err) {
      console.warn(`[announcementApi.getById] Failed for id ${id}:`, err);
      return null;
    }
  },
};

// React hook for active announcements with real-time WebSocket syncing
export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(() => getReadAnnouncementIds());

  const fetchActive = useCallback(async () => {
    try {
      const data = await announcementApi.getActive();
      setAnnouncements(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat pengumuman");
    } finally {
      setLoading(false);
    }
  }, []);

  const syncReadStatus = useCallback(() => {
    setReadIds(getReadAnnouncementIds());
  }, []);

  useEffect(() => {
    // Initial fetch
    void fetchActive();

    // 1. WebSocket listeners
    const unsubUpdate = websocketService.on("announcement_updated", () => {
      void fetchActive();
    });
    const unsubAnnounce = websocketService.on("announcement", () => {
      void fetchActive();
    });
    const unsubData = websocketService.on("data_updated", (payload: any) => {
      if (!payload || payload.resource === "announcements" || payload.resource === "pengumuman") {
        void fetchActive();
      }
    });

    // 2. DOM Custom events for multi-tab & window sync
    const handleSync = () => void fetchActive();
    const handleReadSync = () => syncReadStatus();
    window.addEventListener("announcements-updated", handleSync);
    window.addEventListener("announcement-read-updated", handleReadSync);
    window.addEventListener("notifications-read-updated", handleReadSync);
    window.addEventListener("focus", handleSync);
    window.addEventListener("storage", handleReadSync);

    return () => {
      unsubUpdate();
      unsubAnnounce();
      unsubData();
      window.removeEventListener("announcements-updated", handleSync);
      window.removeEventListener("announcement-read-updated", handleReadSync);
      window.removeEventListener("notifications-read-updated", handleReadSync);
      window.removeEventListener("focus", handleSync);
      window.removeEventListener("storage", handleReadSync);
    };
  }, [fetchActive, syncReadStatus]);

  const unreadCount = useMemo(() => {
    return announcements.filter((a) => !readIds.has(a.uuid)).length;
  }, [announcements, readIds]);

  const markRead = useCallback((uuid: string) => {
    markAnnouncementAsRead(uuid);
    setReadIds((prev) => new Set(prev).add(uuid));
  }, []);

  const markAllRead = useCallback(() => {
    markAllAnnouncementsAsRead(announcements);
    setReadIds(new Set(announcements.map((a) => a.uuid)));
  }, [announcements]);

  return {
    announcements,
    loading,
    error,
    readIds,
    unreadCount,
    markRead,
    markAllRead,
    refetch: fetchActive,
  };
}
