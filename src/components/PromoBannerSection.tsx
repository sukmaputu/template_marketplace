import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

export type BannerSlide = {
  image: string;
  badge?: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
};

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

type PromoBannerSectionProps = {
  slides?: BannerSlide[];
};

export function PromoBannerSection({
  slides = DEFAULT_SLIDES,
}: PromoBannerSectionProps) {
  const bannerSlides = slides.length > 0 ? slides : DEFAULT_SLIDES;
  const slideCount = bannerSlides.length;
  const isSlideshow = slideCount > 1;
  const [index, setIndex] = useState(0);

  function goTo(i: number) {
    setIndex(((i % slideCount) + slideCount) % slideCount);
  }

  function next() {
    goTo(index + 1);
  }

  function prev() {
    goTo(index - 1);
  }

  useEffect(() => {
    if (!isSlideshow) return;
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % slideCount);
    }, 5000);
    return () => clearInterval(id);
  }, [isSlideshow, slideCount]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="group relative aspect-16/9 w-full overflow-hidden rounded-xl bg-neutral-200 dark:bg-neutral-700">
        <div
          className="flex h-full transition-transform duration-500 ease-out"
          style={{
            transform: isSlideshow ? `translateX(-${index * 100}%)` : "none",
          }}>
          {bannerSlides.map((slide, i) => (
            <div
              key={slide.image}
              className="relative flex h-full w-full shrink-0 items-center justify-center bg-neutral-200 dark:bg-neutral-700">
              <img
                src={slide.image}
                alt={`Banner promo ${i + 1}`}
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-black/50" />

              <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center px-6 text-center sm:px-10">
                {slide.badge && (
                  <span className="mb-2 inline-block rounded-full bg-amber-400 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-neutral-900 sm:mb-3 sm:text-xs">
                    {slide.badge}
                  </span>
                )}
                <h2 className="text-lg font-extrabold leading-tight text-white sm:text-3xl lg:text-4xl">
                  {slide.title}
                </h2>
                <p className="mt-1.5 line-clamp-2 text-xs text-white/85 sm:mt-3 sm:text-base">
                  {slide.subtitle}
                </p>
                <a
                  href={slide.ctaHref}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-neutral-900 shadow-lg transition hover:scale-105 hover:bg-amber-400 sm:mt-6 sm:px-6 sm:py-3 sm:text-sm">
                  {slide.ctaLabel}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          ))}
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
                  key={slide.image}
                  onClick={() => goTo(i)}
                  aria-label={`Ke slide ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index
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
