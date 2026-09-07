import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { MarketplaceHeader } from "@/components/navbar/MarketplaceHeader";
import { MarketplaceFooter } from "@/components/MarketplaceFooter";
import { ProductCard } from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/skeleton/ProductCardSkeleton";
import { PromoBannerSection } from "@/components/PromoBannerSection";
import { Pagination } from "@/components/ui/pagination";
import { CATEGORY_DETAILS, PRODUCTS, getDiscountPercent } from "@/lib/products";
import { useCurrency } from "@/components/navbar/CurrencySwitcher";
// import { PromoModal } from "@/components/PromoModal";

const SORT_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "price-asc", label: "Harga Terendah" },
  { value: "price-desc", label: "Harga Tertinggi" },
  { value: "newest", label: "Terbaru" },
];

const PAGE_SIZE = 6;
const DEFAULT_MIN_PRICE = 0;

function formatRupiah(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function normalizePriceRange(
  minValue: number,
  maxValue: number,
  fallbackMax: number,
): [number, number] {
  const safeMin = Number.isFinite(minValue)
    ? Math.max(DEFAULT_MIN_PRICE, minValue)
    : DEFAULT_MIN_PRICE;
  const safeMax = Number.isFinite(maxValue)
    ? Math.max(safeMin, maxValue)
    : Math.max(safeMin, fallbackMax);

  return [safeMin, safeMax];
}

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currency, rate } = useCurrency();
  const searchQuery = (searchParams.get("q") ?? "").trim().toLowerCase();
  const requestedPage = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const page =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const convertPriceToCurrentCurrency = useCallback(
    (value: number) => (currency === "USD" && rate ? value * rate : value),
    [currency, rate],
  );

  const priceRangeDefaults = useMemo(() => {
    const convertedMin = Math.min(
      ...PRODUCTS.map((product) =>
        convertPriceToCurrentCurrency(product.basePrice),
      ),
    );
    const convertedMax = Math.max(
      ...PRODUCTS.map((product) =>
        convertPriceToCurrentCurrency(product.basePrice),
      ),
    );
    return [convertedMin, convertedMax] as [number, number];
  }, [convertPriceToCurrentCurrency]);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([
    0,
    priceRangeDefaults[1],
  ]);
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const previousCurrencyRef = useRef(currency);
  const [discountOnly, setDiscountOnly] = useState(false);
  const [sortBy, setSortBy] = useState("default");
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"pagination" | "infinite">(
    "pagination",
  );
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 900);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (previousCurrencyRef.current === currency) return;

    const previousCurrency = previousCurrencyRef.current;

    setPriceRange(([currentMin, currentMax]) => {
      const convertValue = (value: number) => {
        if (previousCurrency === currency) return value;
        if (previousCurrency === "IDR" && currency === "USD" && rate) {
          return value * rate;
        }
        if (previousCurrency === "USD" && currency === "IDR" && rate) {
          return value / rate;
        }
        return value;
      };

      const convertedRange = normalizePriceRange(
        convertValue(currentMin),
        convertValue(currentMax),
        priceRangeDefaults[1],
      );

      if (minPriceInput) {
        setMinPriceInput(String(convertedRange[0]));
      }
      if (maxPriceInput) {
        setMaxPriceInput(String(convertedRange[1]));
      }

      return convertedRange;
    });

    previousCurrencyRef.current = currency;
  }, [currency, rate, priceRangeDefaults, minPriceInput, maxPriceInput]);

  function resetToFirstPage() {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("page", "1");
    setSearchParams(nextParams, { replace: true });
  }

  function toggleCategory(id: string) {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
    resetToFirstPage();
  }

  function handleClearFilters() {
    setSelectedCategories([]);
    setPriceRange([0, priceRangeDefaults[1]]);
    setMinPriceInput("");
    setMaxPriceInput("");
    setDiscountOnly(false);
    setSortBy("default");
    resetToFirstPage();
  }

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    discountOnly ||
    minPriceInput !== "" ||
    maxPriceInput !== "" ||
    sortBy !== "default";

  const products = useMemo(() => {
    let filtered = selectedCategories.length
      ? PRODUCTS.filter((product) =>
          selectedCategories.includes(product.categoryId ?? ""),
        )
      : PRODUCTS;

    if (searchQuery) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchQuery),
      );
    }

    const effectiveMin = minPriceInput ? Number(minPriceInput) : 0;
    const effectiveMax = maxPriceInput
      ? Number(maxPriceInput)
      : priceRangeDefaults[1];

    filtered = filtered.filter((product) => {
      const productPrice = convertPriceToCurrentCurrency(product.basePrice);
      return (
        productPrice >= Math.min(effectiveMin, effectiveMax) &&
        productPrice <= Math.max(effectiveMin, effectiveMax)
      );
    });

    if (discountOnly) {
      filtered = filtered.filter(
        (product) => getDiscountPercent(product) !== undefined,
      );
    }

    const sorted = [...filtered];
    if (sortBy === "price-asc")
      sorted.sort(
        (a, b) =>
          convertPriceToCurrentCurrency(a.basePrice) -
          convertPriceToCurrentCurrency(b.basePrice),
      );
    if (sortBy === "price-desc")
      sorted.sort(
        (a, b) =>
          convertPriceToCurrentCurrency(b.basePrice) -
          convertPriceToCurrentCurrency(a.basePrice),
      );
    return sorted;
  }, [
    selectedCategories,
    sortBy,
    searchQuery,
    discountOnly,
    convertPriceToCurrentCurrency,
    maxPriceInput,
    minPriceInput,
    priceRangeDefaults,
  ]);

  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedProducts = products.slice(
    (safePage - 1) * PAGE_SIZE,
    (safePage - 1) * PAGE_SIZE + PAGE_SIZE,
  );

  const displayedProducts =
    viewMode === "infinite"
      ? products.length > 0
        ? Array.from(
            { length: visibleCount },
            (_, index) => products[index % products.length],
          )
        : []
      : pagedProducts;

  const filterKey = JSON.stringify({
    selectedCategories,
    sortBy,
    searchQuery,
    priceRange,
    discountOnly,
  });
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setVisibleCount(PAGE_SIZE);
  }

  useEffect(() => {
    if (viewMode !== "infinite") return;
    const el = sentinelRef.current;
    if (!el) return;
    if (products.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingMore) {
          setIsFetchingMore(true);

          setTimeout(() => {
            setVisibleCount((prev) => prev + PAGE_SIZE);
            setIsFetchingMore(false);
          }, 300);
        }
      },
      { rootMargin: "200px", threshold: 0 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [viewMode, products.length, visibleCount, isFetchingMore]);

  function handlePageChange(nextPage: number) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("page", String(nextPage));
    setSearchParams(nextParams);
  }

  // const [showPromo, setShowPromo] = useState(false);

  // useEffect(() => {
  //   const hasSeenPromo = sessionStorage.getItem("hasSeenPromo");

  //   if (!hasSeenPromo) {
  //     const timer = setTimeout(() => {
  //       setShowPromo(true);
  //     }, 500);

  //     return () => clearTimeout(timer);
  //   }
  // }, []);

  // const handleClosePromo = () => {
  //   setShowPromo(false);
  //   sessionStorage.setItem("hasSeenPromo", "true");
  // };

  return (
    <div className="min-h-screen bg-background transition-colors">
      <MarketplaceHeader />

      {/* {showPromo && <PromoModal onClose={handleClosePromo} />} */}

      <PromoBannerSection />
      {/* <PromoBannerSection images={["/banner/slide1.jpg"]} /> */}

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-text">Katalog Produk</h1>
        {searchQuery ? (
          <p className="mt-1 text-sm text-text-secondary">
            Menampilkan hasil pencarian untuk{" "}
            <span className="font-medium text-text">"{searchQuery}"</span>
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => setIsMobileFilterOpen((prev) => !prev)}
          className="mt-6 flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-text lg:hidden">
          <SlidersHorizontal className="h-4 w-4" />
          Filter
          {hasActiveFilters ? (
            <span className="ml-1 h-2 w-2 rounded-full bg-primary" />
          ) : null}
        </button>

        <div className="mt-6 flex flex-col gap-8 lg:mt-8 lg:flex-row">
          <aside
            className={`${
              isMobileFilterOpen ? "block" : "hidden"
            } w-full shrink-0 lg:sticky lg:top-24 lg:block lg:h-fit lg:max-h-[calc(100vh-7rem)] lg:w-64 lg:overflow-y-auto`}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-text">Filter</h2>
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                  <X className="h-3 w-3" />
                  Hapus Filter
                </button>
              ) : null}
            </div>

            <div className="mt-3 border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-text">Kategori</h3>
              <div className="mt-3 space-y-3">
                {CATEGORY_DETAILS.map((cat) => (
                  <label
                    key={cat.id}
                    className="flex cursor-pointer items-center gap-2.5 text-sm text-text-secondary">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat.id)}
                      onChange={() => toggleCategory(cat.id)}
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                    {cat.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-text">Rentang Harga</h3>
              <div className="mt-3 space-y-3">
                <div className="space-y-2">
                  <input
                    type="number"
                    min={0}
                    step={currency === "USD" ? 1 : 10000}
                    placeholder="Harga minimum"
                    value={minPriceInput}
                    onChange={(e) => {
                      const nextValue = e.target.value;
                      const nextMin = nextValue === "" ? 0 : Number(nextValue);
                      setMinPriceInput(nextValue);

                      const finalMin = Number.isFinite(nextMin)
                        ? Math.max(0, nextMin)
                        : 0;
                      const finalMax = maxPriceInput
                        ? Number(maxPriceInput)
                        : priceRangeDefaults[1];

                      setPriceRange(
                        normalizePriceRange(
                          finalMin,
                          finalMax,
                          priceRangeDefaults[1],
                        ),
                      );
                      resetToFirstPage();
                    }}
                    className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-text outline-none placeholder:text-text-secondary/80 focus:border-primary"
                  />
                  <input
                    type="number"
                    min={0}
                    step={currency === "USD" ? 1 : 10000}
                    placeholder="Harga maksimum"
                    value={maxPriceInput}
                    onChange={(e) => {
                      const nextValue = e.target.value;
                      const nextMax =
                        nextValue === ""
                          ? priceRangeDefaults[1]
                          : Number(nextValue);
                      setMaxPriceInput(nextValue);

                      const finalMin = minPriceInput
                        ? Number(minPriceInput)
                        : 0;
                      const finalMax = Number.isFinite(nextMax)
                        ? Math.max(0, nextMax)
                        : priceRangeDefaults[1];

                      setPriceRange(
                        normalizePriceRange(
                          finalMin,
                          finalMax,
                          priceRangeDefaults[1],
                        ),
                      );
                      resetToFirstPage();
                    }}
                    className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-text outline-none placeholder:text-text-secondary/80 focus:border-primary"
                  />
                </div>
                <p className="text-[11px] text-text-secondary">
                  {minPriceInput || maxPriceInput
                    ? currency === "USD" && rate
                      ? `$${Math.min(
                          Number(minPriceInput || 0),
                          Number(maxPriceInput || priceRangeDefaults[1]),
                        ).toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                        })} — $${Math.max(
                          Number(minPriceInput || 0),
                          Number(maxPriceInput || priceRangeDefaults[1]),
                        ).toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                        })}`
                      : `${formatRupiah(
                          Math.min(
                            Number(minPriceInput || 0),
                            Number(maxPriceInput || priceRangeDefaults[1]),
                          ),
                        )} — ${formatRupiah(
                          Math.max(
                            Number(minPriceInput || 0),
                            Number(maxPriceInput || priceRangeDefaults[1]),
                          ),
                        )}`
                    : "Pilih rentang harga sesuai kebutuhan"}
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-4">
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-text-secondary">
                <input
                  type="checkbox"
                  checked={discountOnly}
                  onChange={() => {
                    setDiscountOnly((prev) => !prev);
                    resetToFirstPage();
                  }}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                Hanya produk diskon
              </label>
            </div>
          </aside>

          <div className="hidden w-px bg-border lg:block" />

          <div className="min-w-0 flex-1">
            <div className="sticky top-16 z-20 -mx-1 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/95 px-1 py-3 backdrop-blur">
              <span className="text-xs text-text-secondary sm:text-sm">
                {viewMode === "infinite"
                  ? `Menampilkan ${displayedProducts.length} produk`
                  : `Menampilkan ${displayedProducts.length} dari ${products.length} produk`}
              </span>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center overflow-hidden rounded-full border border-border text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setViewMode("pagination")}
                    className={`px-3 py-1.5 transition-colors ${
                      viewMode === "pagination"
                        ? "bg-primary text-white"
                        : "bg-surface text-text-secondary"
                    }`}>
                    Halaman
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("infinite")}
                    className={`px-3 py-1.5 transition-colors ${
                      viewMode === "infinite"
                        ? "bg-primary text-white"
                        : "bg-surface text-text-secondary"
                    }`}>
                    Scroll
                  </button>
                </div>

                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      resetToFirstPage();
                    }}
                    className="appearance-none rounded-lg border border-border bg-surface py-2 pl-3 pr-9 text-sm text-text outline-none focus:border-primary">
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="mt-6">
                <ProductGridSkeleton count={PAGE_SIZE} />
              </div>
            ) : (
              <>
                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {displayedProducts.map((product, index) => (
                    <ProductCard
                      key={`${product.id}-${index}`}
                      product={product}
                    />
                  ))}
                </div>

                {products.length === 0 ? (
                  <p className="mt-12 text-center text-sm text-text-secondary">
                    Belum ada produk yang cocok dengan filter/pencarian ini.
                  </p>
                ) : viewMode === "pagination" ? (
                  <div className="mt-6 overflow-hidden rounded-xl border border-border bg-surface">
                    <Pagination
                      currentPage={safePage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                ) : (
                  <div ref={sentinelRef} className="mt-8 flex justify-center">
                    <p className="text-xs text-text-secondary">
                      Memuat produk lainnya...
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <MarketplaceFooter />
    </div>
  );
}
