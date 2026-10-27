import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import {
  usePageSettings,
  resolveAssetUrl,
  sanitizeUrl,
  clampPx,
} from "@/hooks/usePageSettings";

export type BannerSlide = {
  image: string;
  imageMobile?: string;
  badge?: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  desktopTemplate?: string;
  desktopHeightPx?: number;
  mobileTemplate?: string;
  mobileHeightPx?: number;
};

interface RawSlideItem {
  image?: unknown;
  imageMobile?: unknown;
  mobileImage?: unknown;
  url?: unknown;
  src?: unknown;
  badge?: unknown;
  title?: unknown;
  subtitle?: unknown;
  ctaLabel?: unknown;
  ctaHref?: unknown;
  href?: unknown;
  desktopTemplate?: unknown;
  desktopHeightPx?: unknown;
  mobileTemplate?: unknown;
  mobileHeightPx?: unknown;
}

const DEFAULT_SLIDES: BannerSlide[] = [
  {
    image: "/banner/slide1.jpg",
    badge: "Promo Spesial",
    title: "Diskon Hingga 50% Untuk Produk Pilihan",
    subtitle:
      "Belanja hemat, kualitas terjamin. Penawaran terbatas hanya minggu ini!",
    ctaLabel: "Belanja Sekarang",
    ctaHref: "#catalog",
  },
  {
    image: "/banner/slide2.jpg",
    badge: "Gratis Ongkir",
    title: "Gratis Ongkir ke Seluruh Indonesia",
    subtitle: "Tanpa minimum belanja untuk pengguna baru. Yuk, mulai belanja!",
    ctaLabel: "Klaim Sekarang",
    ctaHref: "/profile?tab=voucher",
  },
  {
    image: "/banner/slide3.jpg",
    badge: "Produk Terbaru",
    title: "Temukan Koleksi Terbaru Kami",
    subtitle: "Update setiap hari. Jadilah yang pertama memilikinya.",
    ctaLabel: "Lihat Koleksi",
    ctaHref: "#catalog",
  },
];

function parseDynamicBannerSlides(rawValue?: string): BannerSlide[] | null {
  if (!rawValue) return null;

  const resolveBannerPath = (url: string): string => {
    if (!url) return "";
    return resolveAssetUrl(url);
  };

  try {
    const parsed: unknown = JSON.parse(rawValue);
    if (Array.isArray(parsed) && parsed.length > 0) {
      if (typeof parsed[0] === "object" && parsed[0] !== null) {
        const slidesFromApi = parsed
          .map((entry): BannerSlide | null => {
            if (typeof entry !== "object" || entry === null) return null;
            const item = entry as RawSlideItem;
            const rawImg =
              typeof item.image === "string"
                ? item.image
                : typeof item.url === "string"
                  ? item.url
                  : typeof item.src === "string"
                    ? item.src
                    : "";
            const img = resolveBannerPath(rawImg);
            if (!img) return null;
            const rawMobImg =
              typeof item.imageMobile === "string"
                ? item.imageMobile
                : typeof item.mobileImage === "string"
                  ? item.mobileImage
                  : "";
            const imgMob =
              rawMobImg && rawMobImg !== "pending"
                ? resolveBannerPath(rawMobImg)
                : undefined;
            const rawHref =
              typeof item.ctaHref === "string"
                ? item.ctaHref
                : typeof item.href === "string"
                  ? item.href
                  : "#catalog";
            return {
              image: img,
              imageMobile: imgMob,
              badge: typeof item.badge === "string" ? item.badge.trim() : "",
              title: typeof item.title === "string" ? item.title.trim() : "",
              subtitle:
                typeof item.subtitle === "string" ? item.subtitle.trim() : "",
              ctaLabel:
                typeof item.ctaLabel === "string" ? item.ctaLabel.trim() : "",
              ctaHref: sanitizeUrl(rawHref, "#catalog"),
              desktopTemplate:
                typeof item.desktopTemplate === "string" ? item.desktopTemplate : undefined,
              desktopHeightPx:
                typeof item.desktopHeightPx === "number"
                  ? clampPx(item.desktopHeightPx, 280, 900, 480)
                  : undefined,
              mobileTemplate:
                typeof item.mobileTemplate === "string" ? item.mobileTemplate : undefined,
              mobileHeightPx:
                typeof item.mobileHeightPx === "number"
                  ? clampPx(item.mobileHeightPx, 140, 500, 205)
                  : undefined,
            };
          })
          .filter((s): s is BannerSlide => s !== null);

        if (slidesFromApi.length > 0) {
          return slidesFromApi;
        }
      }

      if (typeof parsed[0] === "string") {
        const imgUrls = parsed
          .filter((u): u is string => typeof u === "string" && Boolean(u.trim()))
          .map(resolveBannerPath)
          .filter(Boolean);
        if (imgUrls.length > 0) {
          return imgUrls.map((img) => ({
            image: img,
            badge: "",
            title: "",
            subtitle: "",
            ctaLabel: "",
            ctaHref: "#catalog",
          }));
        }
      }
    } else if (typeof parsed === "string" && parsed.trim()) {
      const img = resolveBannerPath(parsed.trim());
      if (img) {
        return [
          {
            image: img,
            badge: "",
            title: "",
            subtitle: "",
            ctaLabel: "",
            ctaHref: "#catalog",
          },
        ];
      }
    }
  } catch {
    const img = resolveBannerPath(rawValue.trim());
    if (img) {
      return [
        {
          image: img,
          badge: "",
          title: "",
          subtitle: "",
          ctaLabel: "",
          ctaHref: "#catalog",
        },
      ];
    }
  }

  return null;
}

type PromoBannerSectionProps = {
  slides?: BannerSlide[];
  images?: string[];
};

export function PromoBannerSection({
  slides,
  images,
}: PromoBannerSectionProps) {
  const { settingsMap } = usePageSettings();
  const [isPaused, setIsPaused] = useState(false);

  const dynamicSlides = useMemo(() => {
    const rawVal = settingsMap.home_hero_banners || settingsMap.hero_banner;
    return parseDynamicBannerSlides(rawVal);
  }, [settingsMap.home_hero_banners, settingsMap.hero_banner]);

  let bannerSlides: BannerSlide[] = DEFAULT_SLIDES;
  if (slides && slides.length > 0) {
    bannerSlides = slides;
  } else if (dynamicSlides && dynamicSlides.length > 0) {
    bannerSlides = dynamicSlides;
  } else if (images && images.length > 0) {
    bannerSlides = images.map((img) => ({
      image: img,
      badge: "",
      title: "",
      subtitle: "",
      ctaLabel: "",
      ctaHref: "#catalog",
    }));
  }

  const slideCount = bannerSlides.length;
  const isSlideshow = slideCount > 1;
  const [index, setIndex] = useState(0);

  // Clamp index if slide count decreases dynamically
  useEffect(() => {
    if (index >= slideCount) {
      setIndex(0);
    }
  }, [index, slideCount]);

  const safeIndex = index >= slideCount ? 0 : index;

  function goTo(i: number) {
    if (slideCount <= 0) return;
    setIndex(((i % slideCount) + slideCount) % slideCount);
  }

  function next() {
    goTo(safeIndex + 1);
  }

  function prev() {
    goTo(safeIndex - 1);
  }

  useEffect(() => {
    if (!isSlideshow || isPaused) return;
    const id = setInterval(() => {
      setIndex((prevIdx) => (prevIdx + 1) % slideCount);
    }, 5000);
    return () => clearInterval(id);
  }, [isSlideshow, isPaused, slideCount]);

  const currentSlide = bannerSlides[safeIndex] || bannerSlides[0];
  const mobileTemplate = currentSlide?.mobileTemplate || "widescreen_16_9";
  const desktopTemplate = currentSlide?.desktopTemplate;

  let mobileAspectClass = "aspect-[16/9]";
  let desktopAspectClass = "sm:h-[480px] sm:aspect-auto";
  const inlineStyles: Record<string, string> = {};

  if (mobileTemplate === "marketplace_2_1") {
    mobileAspectClass = "aspect-[2/1]";
  } else if (mobileTemplate === "showcase_4_3") {
    mobileAspectClass = "aspect-[4/3]";
  } else if (mobileTemplate === "editorial_4_5") {
    mobileAspectClass = "aspect-[4/5]";
  } else if (mobileTemplate === "custom") {
    mobileAspectClass = "h-[var(--banner-mobile-h)]";
    inlineStyles["--banner-mobile-h"] = `${currentSlide?.mobileHeightPx || 220}px`;
  }

  if (desktopTemplate === "compact") {
    desktopAspectClass = "sm:h-[380px] sm:aspect-auto";
  } else if (desktopTemplate === "standard") {
    desktopAspectClass = "sm:h-[480px] sm:aspect-auto";
  } else if (desktopTemplate === "large") {
    desktopAspectClass = "sm:h-[600px] sm:aspect-auto";
  } else if (desktopTemplate === "cinematic") {
    desktopAspectClass = "sm:h-[720px] sm:aspect-auto";
  } else if (desktopTemplate === "custom") {
    desktopAspectClass = "sm:h-[var(--banner-desktop-h)] sm:aspect-auto";
    inlineStyles["--banner-desktop-h"] = `${currentSlide?.desktopHeightPx || 480}px`;
  } else if (!desktopTemplate && mobileTemplate !== "custom") {
    desktopAspectClass = "sm:aspect-[16/9]";
  }

  return (
    <section className="w-full mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className={`group relative w-full ${mobileAspectClass} ${desktopAspectClass} overflow-hidden rounded-xl bg-neutral-200 dark:bg-neutral-700 select-none transition-all duration-300`}
        style={{
          width: "100%",
          ...(inlineStyles as React.CSSProperties),
        }}>
        <div
          className="flex h-full transition-transform duration-500 ease-out"
          style={{
            transform: isSlideshow ? `translateX(-${safeIndex * 100}%)` : "none",
          }}>
          {bannerSlides.map((slide, i) => {
            const hasContent = Boolean(
              slide.badge || slide.title || slide.subtitle || slide.ctaLabel
            );

            return (
              <div
                key={`${slide.image}-${i}`}
                className="relative flex h-full w-full shrink-0 items-center justify-center bg-neutral-200 dark:bg-neutral-700">
                <picture className="absolute inset-0 h-full w-full">
                  {slide.imageMobile && (
                    <source media="(max-width: 639px)" srcSet={slide.imageMobile} />
                  )}
                  <img
                    src={slide.image}
                    alt={`Banner promo ${i + 1}`}
                    className="h-full w-full object-cover object-center"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/banner/slide1.jpg";
                    }}
                  />
                </picture>

                {hasContent && <div className="absolute inset-0 bg-black/50" />}

                {hasContent && (
                  <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center px-6 text-center sm:px-10">
                    {slide.badge && (
                      <span className="mb-2 inline-block rounded-full bg-amber-400 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-neutral-900 sm:mb-3 sm:text-xs">
                        {slide.badge}
                      </span>
                    )}
                    {slide.title && (
                      <h2 className="text-lg font-extrabold leading-tight text-white sm:text-3xl lg:text-4xl">
                        {slide.title}
                      </h2>
                    )}
                    {slide.subtitle && (
                      <p className="mt-1.5 line-clamp-2 text-xs text-white/85 sm:mt-3 sm:text-base">
                        {slide.subtitle}
                      </p>
                    )}
                    {slide.ctaLabel && (
                      <a
                        href={sanitizeUrl(slide.ctaHref, "#catalog")}
                        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-neutral-900 shadow-lg transition hover:scale-105 hover:bg-amber-400 sm:mt-6 sm:px-6 sm:py-3 sm:text-sm">
                        {slide.ctaLabel}
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {isSlideshow && (
          <>
            <button
              onClick={prev}
              aria-label="Sebelumnya"
              className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/70 p-1.5 opacity-0 transition-opacity hover:bg-white group-hover:opacity-100 dark:bg-black/40 dark:hover:bg-black/60">
              <ChevronLeft className="h-4 w-4 text-neutral-700 dark:text-neutral-200" />
            </button>
            <button
              onClick={next}
              aria-label="Berikutnya"
              className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/70 p-1.5 opacity-0 transition-opacity hover:bg-white group-hover:opacity-100 dark:bg-black/40 dark:hover:bg-black/60">
              <ChevronRight className="h-4 w-4 text-neutral-700 dark:text-neutral-200" />
            </button>

            <div className="absolute bottom-2.5 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
              {bannerSlides.map((slide, i) => (
                <button
                  key={`${slide.image}-${i}`}
                  onClick={() => goTo(i)}
                  aria-label={`Ke slide ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === safeIndex
                      ? "w-5 bg-white"
                      : "w-1.5 bg-white/60 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
