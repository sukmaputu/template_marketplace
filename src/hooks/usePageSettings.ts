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
  popupMobileImage: string;
  popupBannerLink: string;
  isPopupEnabled: boolean;
  popupDesktopTemplate: string;
  popupDesktopMaxWidth: number;
  popupDesktopAspectRatio: string;
  popupMobileTemplate: string;
  popupMobileMaxWidth: number;
  popupMobileAspectRatio: string;
  popupObjectFit: "cover" | "contain";
  logoNavbarMobileHeightPx: number;
  logoNavbarDesktopHeightPx: number;
  logoFooterMobileHeightPx: number;
  logoFooterDesktopHeightPx: number;
  logoMaxWidthPx: number;
  siteTitle: string;
  siteTagline: string;
  settingsMap: Record<string, string>;
  loading: boolean;
  resolveImageUrl: (path?: string) => string;
}

export function stripHtmlTags(str?: string): string {
  if (!str) return "";
  return str.replace(/<[^>]*>/g, "").trim();
}

const ALLOWED_ASPECT_RATIOS = new Set([
  "1 / 1",
  "4 / 3",
  "4 / 5",
  "3 / 4",
  "16 / 9",
  "9 / 16",
  "2 / 1",
  "auto",
]);

export function clampPx(val: unknown, min: number, max: number, fallback: number): number {
  const num = typeof val === "number" ? val : Number(val);
  if (isNaN(num)) return fallback;
  return Math.min(Math.max(Math.round(num), min), max);
}

export function sanitizeAspectRatio(val: unknown, fallback = "1 / 1"): string {
  if (typeof val !== "string") return fallback;
  const clean = val.trim();
  if (ALLOWED_ASPECT_RATIOS.has(clean)) return clean;
  return fallback;
}

/**
 * Sanitizes URL/href against dangerous URI schemes (javascript:, vbscript:, data:text/html) and protocol-relative URLs.
 */
export function sanitizeUrl(raw?: string, fallback = "#catalog"): string {
  if (!raw) return fallback;
  const clean = raw.replace(/[\u0000-\u001F\u007F]/g, "").trim();
  if (!clean) return fallback;
  if (clean.startsWith("//")) return fallback;
  if (/^https?:\/\//i.test(clean)) return clean;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/i.test(clean)) return fallback;
  if (clean.startsWith("#") || clean.startsWith("/")) return clean;
  return `/${clean}`;
}

export function resolveAssetUrl(url?: string): string {
  if (!url) return "";
  const cleanUrl = url.replace(/[\u0000-\u001F\u007F]/g, "").trim();
  if (!cleanUrl) return "";
  if (cleanUrl.startsWith("//")) return "";
  if (/^https?:\/\//i.test(cleanUrl)) return cleanUrl;
  if (/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(cleanUrl)) return cleanUrl;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/i.test(cleanUrl)) return "";
  const clean = cleanUrl.startsWith("/") ? cleanUrl : `/${cleanUrl}`;
  if (
    clean.startsWith("/banner/") ||
    clean.startsWith("/logo/") ||
    clean.startsWith("/products/") ||
    clean.startsWith("/favicon") ||
    clean.startsWith("/icons")
  ) {
    return clean;
  }
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
            let strVal = typeof val === "string" ? val : String(val ?? "");
            if (strVal.startsWith("<p>") && strVal.endsWith("</p>")) {
              strVal = strVal.replace(/^<p>/i, "").replace(/<\/p>$/i, "").trim();
            }
            map[key] = strVal;
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
    stripHtmlTags(
      settingsMap.contact_email ||
      settingsMap.site_email ||
      settingsMap.email ||
      ""
    ) || "contact@nadrical.my.id";

  const contactPhone =
    stripHtmlTags(
      settingsMap.contact_phone ||
      settingsMap.site_phone ||
      settingsMap.phone ||
      settingsMap.contact_whatsapp ||
      ""
    ) || "+6281234567890";

  const contactAddress =
    stripHtmlTags(
      settingsMap.contact_address ||
      settingsMap.site_address ||
      settingsMap.address ||
      settingsMap.alamat ||
      ""
    ) || "Jln Testing Jawa Barat no 19 RT 12";

  const siteTitle =
    stripHtmlTags(
      settingsMap.site_title ||
      settingsMap.title ||
      settingsMap.app_name ||
      ""
    ) || "Nadrical";

  const siteTagline =
    stripHtmlTags(
      settingsMap.site_tagline ||
      settingsMap.tagline ||
      settingsMap.description ||
      ""
    ) ||
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

  const rawPopupEnabled =
    settingsMap.site_popup_enabled ??
    settingsMap.popup_enabled ??
    "true";
  const isPopupEnabled =
    rawPopupEnabled === "true" ||
    rawPopupEnabled === "1";

  let popupImageRaw = "";
  let popupMobileImageRaw = "";
  let popupLinkRaw = "";
  let popupDesktopTemplate = "square";
  let popupDesktopMaxWidth = 480;
  let popupDesktopAspectRatio = "1 / 1";
  let popupMobileTemplate = "square";
  let popupMobileMaxWidth = 320;
  let popupMobileAspectRatio = "1 / 1";
  let popupObjectFit: "cover" | "contain" = "cover";

  if (rawPopup) {
    try {
      const parsed = JSON.parse(rawPopup);
      if (typeof parsed === "object" && parsed !== null) {
        popupImageRaw = parsed.image || parsed.img || parsed.url || "";
        const rawMob = parsed.mobileImage || parsed.imageMobile || "";
        popupMobileImageRaw = rawMob && rawMob !== "pending" ? rawMob : "";
        popupLinkRaw = parsed.link || parsed.url_target || parsed.href || "";

        if (typeof parsed.desktopTemplate === "string" && parsed.desktopTemplate) {
          popupDesktopTemplate = parsed.desktopTemplate;
        }
        popupDesktopMaxWidth = clampPx(parsed.desktopMaxWidth, 360, 800, 480);
        if (popupDesktopTemplate === "custom") {
          popupDesktopAspectRatio = "auto";
        } else if (popupDesktopTemplate === "landscape") {
          popupDesktopAspectRatio = sanitizeAspectRatio(parsed.desktopAspectRatio, "4 / 3");
        } else if (popupDesktopTemplate === "portrait") {
          popupDesktopAspectRatio = sanitizeAspectRatio(parsed.desktopAspectRatio, "4 / 5");
        } else if (popupDesktopTemplate === "wide") {
          popupDesktopAspectRatio = sanitizeAspectRatio(parsed.desktopAspectRatio, "16 / 9");
        } else {
          popupDesktopAspectRatio = sanitizeAspectRatio(parsed.desktopAspectRatio, "1 / 1");
        }

        if (typeof parsed.mobileTemplate === "string" && parsed.mobileTemplate) {
          popupMobileTemplate = parsed.mobileTemplate;
        }
        popupMobileMaxWidth = clampPx(parsed.mobileMaxWidth, 240, 420, 320);
        if (popupMobileTemplate === "custom") {
          popupMobileAspectRatio = "auto";
        } else if (popupMobileTemplate === "portrait_ig" || popupMobileTemplate === "portrait") {
          popupMobileAspectRatio = sanitizeAspectRatio(parsed.mobileAspectRatio, "4 / 5");
        } else if (popupMobileTemplate === "poster_tall") {
          popupMobileAspectRatio = sanitizeAspectRatio(parsed.mobileAspectRatio, "3 / 4");
        } else if (popupMobileTemplate === "compact_landscape" || popupMobileTemplate === "landscape") {
          popupMobileAspectRatio = sanitizeAspectRatio(parsed.mobileAspectRatio, "4 / 3");
        } else if (popupMobileTemplate === "story_full") {
          popupMobileAspectRatio = sanitizeAspectRatio(parsed.mobileAspectRatio, "9 / 16");
        } else {
          popupMobileAspectRatio = sanitizeAspectRatio(parsed.mobileAspectRatio, "1 / 1");
        }
        if (parsed.objectFit === "contain") {
          popupObjectFit = "contain";
        }
      } else if (typeof parsed === "string") {
        popupImageRaw = parsed;
      }
    } catch {
      popupImageRaw = rawPopup;
    }
  }

  // Parse Logo Sizing Config from site_logo_config
  let logoNavbarMobileHeightPx = 32;
  let logoNavbarDesktopHeightPx = 40;
  let logoFooterMobileHeightPx = 36;
  let logoFooterDesktopHeightPx = 44;
  let logoMaxWidthPx = 220;

  if (settingsMap.site_logo_config) {
    try {
      const parsedConfig = JSON.parse(settingsMap.site_logo_config);
      if (typeof parsedConfig === "object" && parsedConfig !== null) {
        const navMobPresetMap: Record<string, number> = {
          compact: 24,
          standard: 32,
          large: 40,
          prominent: 48,
        };
        const navDeskPresetMap: Record<string, number> = {
          compact: 32,
          standard: 40,
          large: 52,
        };
        const footMobPresetMap: Record<string, number> = {
          compact: 28,
          standard: 36,
          large: 48,
        };
        const footDeskPresetMap: Record<string, number> = {
          compact: 36,
          standard: 44,
          large: 60,
        };

        if (
          typeof parsedConfig.navbarMobilePreset === "string" &&
          parsedConfig.navbarMobilePreset in navMobPresetMap
        ) {
          logoNavbarMobileHeightPx = navMobPresetMap[parsedConfig.navbarMobilePreset];
        } else if (Number(parsedConfig.navbarMobileHeightPx) > 0) {
          logoNavbarMobileHeightPx = Number(parsedConfig.navbarMobileHeightPx);
        }

        if (
          typeof parsedConfig.navbarDesktopPreset === "string" &&
          parsedConfig.navbarDesktopPreset in navDeskPresetMap
        ) {
          logoNavbarDesktopHeightPx = navDeskPresetMap[parsedConfig.navbarDesktopPreset];
        } else if (Number(parsedConfig.navbarDesktopHeightPx) > 0) {
          logoNavbarDesktopHeightPx = Number(parsedConfig.navbarDesktopHeightPx);
        } else if (logoNavbarMobileHeightPx > 40) {
          logoNavbarDesktopHeightPx = Math.max(40, logoNavbarMobileHeightPx);
        }

        if (parsedConfig.footerMobilePreset === "sync") {
          logoFooterMobileHeightPx = logoNavbarMobileHeightPx;
        } else if (
          typeof parsedConfig.footerMobilePreset === "string" &&
          parsedConfig.footerMobilePreset in footMobPresetMap
        ) {
          logoFooterMobileHeightPx = footMobPresetMap[parsedConfig.footerMobilePreset];
        } else if (Number(parsedConfig.footerMobileHeightPx) > 0) {
          logoFooterMobileHeightPx = Number(parsedConfig.footerMobileHeightPx);
        }

        if (parsedConfig.footerDesktopPreset === "sync") {
          logoFooterDesktopHeightPx = logoNavbarDesktopHeightPx;
        } else if (
          typeof parsedConfig.footerDesktopPreset === "string" &&
          parsedConfig.footerDesktopPreset in footDeskPresetMap
        ) {
          logoFooterDesktopHeightPx = footDeskPresetMap[parsedConfig.footerDesktopPreset];
        } else if (Number(parsedConfig.footerDesktopHeightPx) > 0) {
          logoFooterDesktopHeightPx = Number(parsedConfig.footerDesktopHeightPx);
        } else if (parsedConfig.footerMobilePreset === "sync") {
          logoFooterDesktopHeightPx = logoNavbarDesktopHeightPx;
        } else if (logoFooterMobileHeightPx > 44) {
          logoFooterDesktopHeightPx = Math.max(44, logoFooterMobileHeightPx);
        }

        logoMaxWidthPx = clampPx(parsedConfig.maxWidthPx, 100, 400, 220);
      }
    } catch {
      // fallback defaults
    }
  }

  const popupBanner = (popupImageRaw && isPopupEnabled) ? resolveAssetUrl(popupImageRaw) : "";
  const popupMobileImage = (popupMobileImageRaw && isPopupEnabled) ? resolveAssetUrl(popupMobileImageRaw) : "";
  let rawCleanLink = popupLinkRaw ? sanitizeUrl(popupLinkRaw, "#catalog") : "#catalog";
  if (rawCleanLink === "/products" || rawCleanLink === "/products/") {
    rawCleanLink = "/#catalog";
  }
  const popupBannerLink = rawCleanLink;

  return {
    contactEmail,
    contactPhone,
    contactAddress,
    navbarLogo,
    popupBanner,
    popupMobileImage,
    popupBannerLink,
    isPopupEnabled,
    popupDesktopTemplate,
    popupDesktopMaxWidth,
    popupDesktopAspectRatio,
    popupMobileTemplate,
    popupMobileMaxWidth,
    popupMobileAspectRatio,
    popupObjectFit,
    logoNavbarMobileHeightPx,
    logoNavbarDesktopHeightPx,
    logoFooterMobileHeightPx,
    logoFooterDesktopHeightPx,
    logoMaxWidthPx,
    siteTitle,
    siteTagline,
    settingsMap,
    loading,
    resolveImageUrl: resolveAssetUrl,
  };
}
