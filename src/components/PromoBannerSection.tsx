import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SLIDE_IMAGES = [
  "/banner/slide1.jpg",
  "/banner/slide2.jpg",
  "/banner/slide3.jpg",
];

type PromoBannerSectionProps = {
  images?: string[];
};

export function PromoBannerSection({
  images = SLIDE_IMAGES,
}: PromoBannerSectionProps) {
  const bannerImages = images.length > 0 ? images : SLIDE_IMAGES;
  const slideCount = bannerImages.length;
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
    }, 4000);
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
          {bannerImages.map((src, i) => (
            <div
              key={src}
              className="flex h-full w-full shrink-0 items-center justify-center bg-neutral-200 dark:bg-neutral-700">
              <img
                src={src}
                alt={`Banner promo ${i + 1}`}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>

        {isSlideshow && (
          <>
            <button
              onClick={prev}
              aria-label="Sebelumnya"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/70 p-1.5 opacity-0 transition-opacity hover:bg-white group-hover:opacity-100 dark:bg-black/40 dark:hover:bg-black/60">
              <ChevronLeft className="h-4 w-4 text-neutral-700 dark:text-neutral-200" />
            </button>
            <button
              onClick={next}
              aria-label="Berikutnya"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/70 p-1.5 opacity-0 transition-opacity hover:bg-white group-hover:opacity-100 dark:bg-black/40 dark:hover:bg-black/60">
              <ChevronRight className="h-4 w-4 text-neutral-700 dark:text-neutral-200" />
            </button>

            <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5">
              {bannerImages.map((src, i) => (
                <button
                  key={src}
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
