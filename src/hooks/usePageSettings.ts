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
  contactAddress: string;
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
  if (!force && cachedSettingsMap && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedSettingsMap;
  }

  if (!force && sharedSettingsPromise) {
    return sharedSettingsPromise;
  }

  sharedSettingsPromise = api
    .get("/cms/page-settings")
    .then((res) => {
      const rawPayload = res.data?.data ?? res.data?.result ?? res.data;
      const list = Array.isArray(rawPayload)
        ? rawPayload
        : Array.isArray(rawPayload?.result)
        ? rawPayload.result
        : [];

      const map: Record<string, string> = {};
      list.forEach((raw: unknown) => {
        if (typeof raw === "object" && raw !== null) {
          const item = raw as Record<string, unknown>;
          const key = String(item.key ?? item.nama_key ?? item.name ?? "").trim();
          if (key) {
            const val = item.value ?? item.val ?? "";
            map[key] = typeof val === "string" ? val : String(val ?? "");
          }
        }
      });

      cachedSettingsMap = map;
      cacheTimestamp = Date.now();
      return map;
    })
    .catch((err) => {
      console.warn("[PageSettings] Failed to fetch settings from API:", err);
      return cachedSettingsMap || {};
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
    const unsub3 = websocketService.on("data_updated", (payload: unknown) => {
      const p = payload as { resource?: string } | undefined;
      if (
        !p ||
        p.resource === "settings" ||
        p.resource === "banners" ||
        p.resource === "page-settings" ||
        p.resource === "page-setting"
      ) {
        onRealtimeUpdate();
      }
    });

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("banners-updated", onRealtimeUpdate);
      unsub1();
      unsub2();
      unsub3();
    };
  }, []);

  const contactEmail =
    (
      settingsMap.contact_email ||
      settingsMap.site_email ||
      settingsMap.email ||
      ""
    ).trim() || "contact@nadrical.my.id";

  const contactPhone =
    (
      settingsMap.contact_phone ||
      settingsMap.site_phone ||
      settingsMap.phone ||
      settingsMap.contact_whatsapp ||
      ""
    ).trim() || "+6281234567890";

  const contactAddress =
    (
      settingsMap.contact_address ||
      settingsMap.site_address ||
      settingsMap.address ||
      settingsMap.alamat ||
      ""
    ).trim() || "Jln Testing Jawa Barat no 19 RT 12";

  const siteTitle =
    (
      settingsMap.site_title ||
      settingsMap.title ||
      settingsMap.app_name ||
      ""
    ).trim() || "Nadrical";

  const siteTagline =
    (
      settingsMap.site_tagline ||
      settingsMap.tagline ||
      settingsMap.description ||
      ""
    ).trim() ||
    "Solusi e-commerce terpercaya untuk semua kebutuhan template, produk digital, dan gaya hidup Anda.";

  const rawLogo =
    settingsMap.site_navbar_logo ||
    settingsMap.logo_url ||
    settingsMap.site_logo;
  const navbarLogo = rawLogo
    ? resolveAssetUrl(rawLogo)
    : "/logo/logo_nadrical.png";

  const rawPopup =
    settingsMap.site_popup_banner ||
    settingsMap.popup_banner ||
    settingsMap.site_popup;
  const popupBanner = rawPopup ? resolveAssetUrl(rawPopup) : "";

  return {
    contactEmail,
    contactPhone,
    contactAddress,
    navbarLogo,
    popupBanner,
    siteTitle,
    siteTagline,
    settingsMap,
    loading,
    resolveImageUrl: resolveAssetUrl,
  };
}
