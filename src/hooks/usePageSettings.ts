import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { websocketService } from "@/lib/websocket";

export interface PageSettingItem {
  key?: string;
  value?: string;
}

export interface PageSettingsData {
  contactEmail: string;
  contactPhone: string;
  navbarLogo: string;
  popupBanner: string;
  siteTitle: string;
  siteTagline: string;
  settingsMap: Record<string, string>;
  loading: boolean;
  resolveImageUrl: (path?: string) => string;
}

/**
 * Sanitizes URL/href against dangerous URI schemes (javascript:, vbscript:, data:text/html).
 */
export function sanitizeUrl(raw?: string, fallback = "#catalog"): string {
  if (!raw) return fallback;
  const trimmed = raw.trim();
  if (!trimmed) return fallback;
  if (
    trimmed.startsWith("#") ||
    trimmed.startsWith("/") ||
    /^https?:\/\//i.test(trimmed)
  ) {
    return trimmed;
  }
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/i.test(trimmed)) {
    return fallback;
  }
  return trimmed;
}

export function resolveAssetUrl(url?: string): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed) || /^data:image\//i.test(trimmed)) {
    return trimmed;
  }
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/i.test(trimmed)) {
    return "";
  }
  const clean = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const baseUrl = (
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1"
  ).replace(/\/api\/v1\/?$/, "");
  return `${baseUrl}${clean}`;
}

// ─── Shared In-Memory Cache & Request Deduplication ─────────────
const CACHE_TTL_MS = 10_000;
let cachedSettingsMap: Record<string, string> | null = null;
let cacheTimestamp = 0;
let sharedSettingsPromise: Promise<Record<string, string>> | null = null;

export function invalidatePageSettingsCache(): void {
  cachedSettingsMap = null;
  cacheTimestamp = 0;
  sharedSettingsPromise = null;
}

export async function fetchPageSettingsMap(
  force = false
): Promise<Record<string, string>> {
  const now = Date.now();
  if (
    !force &&
    cachedSettingsMap &&
    now - cacheTimestamp < CACHE_TTL_MS
  ) {
    return cachedSettingsMap;
  }

  if (!force && sharedSettingsPromise) {
    return sharedSettingsPromise;
  }

  sharedSettingsPromise = api
    .get("/cms/page-settings")
    .then((res) => {
      const list: unknown = res.data?.data;
      const map: Record<string, string> = {};
      if (Array.isArray(list)) {
        list.forEach((raw) => {
          if (typeof raw === "object" && raw !== null) {
            const item = raw as PageSettingItem;
            if (typeof item.key === "string" && typeof item.value === "string") {
              map[item.key] = item.value;
            }
          }
        });
      }
      cachedSettingsMap = map;
      cacheTimestamp = Date.now();
      return map;
    })
    .finally(() => {
      sharedSettingsPromise = null;
    });

  return sharedSettingsPromise;
}

export function usePageSettings(): PageSettingsData {
  const [settingsMap, setSettingsMap] = useState<Record<string, string>>(
    () => cachedSettingsMap || {}
  );
  const [loading, setLoading] = useState<boolean>(!cachedSettingsMap);

  useEffect(() => {
    let cancelled = false;

    async function load(force = false) {
      try {
        if (!cachedSettingsMap) setLoading(true);
        const map = await fetchPageSettingsMap(force);
        if (!cancelled) {
          setSettingsMap(map);
        }
      } catch {
        // keep defaults
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load(false);

    const onFocus = () => {
      // Rely on TTL cooldown (10s) so rapid tab switching doesn't spam requests
      load(false);
    };

    const onRealtimeUpdate = () => {
      invalidatePageSettingsCache();
      load(true);
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("banners-updated", onRealtimeUpdate);
    const unsub1 = websocketService.on("settings_updated", onRealtimeUpdate);
    const unsub2 = websocketService.on("banners_updated", onRealtimeUpdate);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("banners-updated", onRealtimeUpdate);
      unsub1();
      unsub2();
    };
  }, []);

  const contactEmail = settingsMap.contact_email || "contact@nadrical.my.id";
  const contactPhone = settingsMap.contact_phone || "+6281234567890";
  const siteTitle = settingsMap.site_title || "Nadrical Official";
  const siteTagline =
    settingsMap.site_tagline || "Leading Corporate and E-Commerce Solutions";

  const rawLogo = settingsMap.site_navbar_logo || settingsMap.logo_url;
  const navbarLogo = rawLogo
    ? resolveAssetUrl(rawLogo)
    : "/logo/logo_nadrical.png";

  const rawPopup = settingsMap.site_popup_banner || settingsMap.popup_banner;
  const popupBanner = rawPopup ? resolveAssetUrl(rawPopup) : "";

  return {
    contactEmail,
    contactPhone,
    navbarLogo,
    popupBanner,
    siteTitle,
    siteTagline,
    settingsMap,
    loading,
    resolveImageUrl: resolveAssetUrl,
  };
}
