import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function PromoBannerSection() {
  const slideCount = 3;
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

  // Siapkan array URL/import gambar di atas komponen
  const SLIDE_IMAGES = [
    "/banner/slide1.jpg",
    "/banner/slide2.jpg",
    "/banner/slide3.jpg",
  ];

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % slideCount);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-6 sm:px-6 lg:grid-cols-3 lg:px-8">
      <div className="group relative aspect-[3/1] w-full overflow-hidden rounded-xl bg-neutral-200 lg:col-span-2 dark:bg-neutral-700">
        <div
          className="flex h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}>
          {Array.from({ length: slideCount }).map((_, i) => (
            <div
              key={i}
              className="flex h-full w-full shrink-0 items-center justify-center bg-neutral-200 dark:bg-neutral-700">
              <img
                src={SLIDE_IMAGES[i]}
                alt={`Banner promo ${i + 1}`}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>

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
          {Array.from({ length: slideCount }).map((_, i) => (
            <button
              key={i}
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
      </div>

      <div className="grid grid-cols-2 gap-4 lg:flex lg:flex-col">
        <div className="flex aspect-[3/1] w-full items-center justify-center rounded-xl bg-neutral-200 dark:bg-neutral-700">
          <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-neutral-200 dark:bg-neutral-700 lg:aspect-[3/1]">
            <img
              src="/banner/slide4.jpg"
              alt="Banner A"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
        <div className="flex aspect-[3/1] w-full items-center justify-center rounded-xl bg-neutral-200 dark:bg-neutral-700">
          <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-neutral-200 dark:bg-neutral-700 lg:aspect-[3/1]">
            <img
              src="/banner/slide5.jpg"
              alt="Banner B"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
