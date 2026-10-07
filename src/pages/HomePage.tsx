import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Check,
  ChevronDown,
  SlidersHorizontal,
  X,
  Search,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { MarketplaceHeader } from "@/components/navbar/MarketplaceHeader";
import { MarketplaceFooter } from "@/components/MarketplaceFooter";
import { ProductCard } from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/skeleton/ProductCardSkeleton";
import { PromoBannerSection } from "@/components/PromoBannerSection";
import { Pagination } from "@/components/ui/pagination";
import {
  usePaginatedProducts,
  useCategories,
  useMarketplaceProducts,
  getTopRecommendedProducts,
  getRelatedProducts,
  PRODUCTS,
} from "@/lib/products";
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

// ---- UI-only filter options (belum ada di backend) ----
// Begitu backend expose field ini (misal attributes: { color, size, useCase, style }),
// sambungkan selectedColors/selectedSizes/selectedUseCases/selectedStyles
// sebagai parameter tambahan ke usePaginatedProducts, seperti minPrice/maxPrice/discountOnly.
const COLOR_OPTIONS = [
  { label: "Hitam", hex: "#111827" },
  { label: "Putih", hex: "#FFFFFF" },
  { label: "Abu-abu", hex: "#9CA3AF" },
  { label: "Merah", hex: "#EF4444" },
  { label: "Biru", hex: "#3B82F6" },
  { label: "Hijau", hex: "#22C55E" },
  { label: "Cokelat", hex: "#92400E" },
  { label: "Krem", hex: "#E5D3B3" },
];

const SIZE_OPTIONS = ["S", "M", "L", "XL", "8", "30", "32", "34", "36"];

const USE_CASE_OPTIONS = [
  "Olahraga",
  "Kerja / Formal",
  "Kasual Harian",
  "Outdoor",
  "Santai / Rumahan",
];

const STYLE_OPTIONS = ["Casual", "Sporty", "Formal", "Vintage", "Minimalis"];

function FilterSection({
  title,
  count = 0,
  isOpen = true,
  onToggle,
  children,
}: {
  title: string;
  count?: number;
  isOpen?: boolean;
  onToggle?: () => void;
  children: React.ReactNode;
}) {
  const header = (
    <>
      <span className="flex items-center gap-2">
        <span className="text-[13px] font-semibold text-text">{title}</span>
        {count > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
            {count}
          </span>
        )}
      </span>
      {onToggle && (
        <ChevronDown
          className={`h-4 w-4 text-text-secondary transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      )}
    </>
  );

  return (
    <div className="border-t border-border py-4 first:border-t-0 first:pt-0">
      {onToggle ? (
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center justify-between">
          {header}
        </button>
      ) : (
        <div className="flex items-center justify-between">{header}</div>
      )}
      {isOpen && <div className="mt-3">{children}</div>}
    </div>
  );
}

function FilterCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-background">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-border bg-surface text-transparent transition-all peer-checked:border-primary peer-checked:bg-primary peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40">
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
      <span className="text-sm text-text-secondary transition-colors peer-checked:font-medium peer-checked:text-text">
        {label}
      </span>
    </label>
  );
}

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
    return [0, convertPriceToCurrentCurrency(20000000)] as [number, number];
  }, [convertPriceToCurrentCurrency]);

  const { categories } = useCategories();
  const initialCategory = searchParams.get("category");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    if (initialCategory && initialCategory !== "all") {
      return [initialCategory];
    }
    return [];
  });
  const [priceRange, setPriceRange] = useState<[number, number]>([
    0,
    priceRangeDefaults[1],
  ]);
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const previousCurrencyRef = useRef(currency);
  const [discountOnly, setDiscountOnly] = useState(false);
  const [sortBy, setSortBy] = useState("default");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"pagination" | "infinite">(
    "pagination",
  );
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // ---- Filter atribut (UI-only, belum tersambung ke data produk) ----
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [isColorDropdownOpen, setIsColorDropdownOpen] = useState(false);
  const [isSizeFilterOpen, setIsSizeFilterOpen] = useState(true);
  const [isUseCaseFilterOpen, setIsUseCaseFilterOpen] = useState(true);
  const [isStyleFilterOpen, setIsStyleFilterOpen] = useState(true);

  function toggleColor(color: string) {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color],
    );
    resetToFirstPage();
  }

  function toggleSize(size: string) {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
    );
    resetToFirstPage();
  }

  function toggleUseCase(useCase: string) {
    setSelectedUseCases((prev) =>
      prev.includes(useCase)
        ? prev.filter((u) => u !== useCase)
        : [...prev, useCase],
    );
    resetToFirstPage();
  }

  function toggleStyle(style: string) {
    setSelectedStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style],
    );
    resetToFirstPage();
  }

  // Sinkronisasi kategori dari URL, dilakukan saat render (bukan di useEffect)
  // supaya tidak memicu setState di dalam effect body.
  const categoryFromUrl = searchParams.get("category");
  const [prevCategoryFromUrl, setPrevCategoryFromUrl] =
    useState(categoryFromUrl);
  if (categoryFromUrl !== prevCategoryFromUrl) {
    setPrevCategoryFromUrl(categoryFromUrl);
    if (categoryFromUrl && categoryFromUrl !== "all") {
      setSelectedCategories((prev) =>
        prev.includes(categoryFromUrl) ? prev : [categoryFromUrl],
      );
    }
  }

  const effectiveMinPrice = useMemo(() => {
    if (!minPriceInput) return undefined;
    const val = Number(minPriceInput);
    if (!Number.isFinite(val) || val <= 0) return undefined;
    return currency === "USD" && rate ? Math.round(val / rate) : val;
  }, [minPriceInput, currency, rate]);

  const effectiveMaxPrice = useMemo(() => {
    if (!maxPriceInput) return undefined;
    const val = Number(maxPriceInput);
    if (!Number.isFinite(val) || val <= 0) return undefined;
    return currency === "USD" && rate ? Math.round(val / rate) : val;
  }, [maxPriceInput, currency, rate]);

  const categoryParam =
    selectedCategories.length > 0 ? selectedCategories.join(",") : undefined;

  const {
    products: serverProducts,
    total: serverTotal,
    totalPages: serverTotalPages,
    currentPage: serverCurrentPage,
    loading: isServerLoading,
  } = usePaginatedProducts({
    page,
    limit: PAGE_SIZE,
    search: searchQuery,
    category: categoryParam,
    minPrice: effectiveMinPrice,
    maxPrice: effectiveMaxPrice,
    discountOnly,
    // TODO: sambungkan selectedColors / selectedSizes / selectedUseCases / selectedStyles
    // ke sini begitu backend menyediakan field & query param yang sesuai.
  });

  const isLoading = isServerLoading;

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
    setSelectedColors([]);
    setSelectedSizes([]);
    setSelectedUseCases([]);
    setSelectedStyles([]);
    const nextParams = new URLSearchParams();
    nextParams.set("page", "1");
    setSearchParams(nextParams, { replace: true });
  }

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    discountOnly ||
    minPriceInput !== "" ||
    maxPriceInput !== "" ||
    sortBy !== "default" ||
    selectedColors.length > 0 ||
    selectedSizes.length > 0 ||
    selectedUseCases.length > 0 ||
    selectedStyles.length > 0;

  const products = useMemo(() => {
    const list = [...serverProducts];
    if (sortBy === "price-asc")
      list.sort(
        (a, b) =>
          convertPriceToCurrentCurrency(a.basePrice) -
          convertPriceToCurrentCurrency(b.basePrice),
      );
    if (sortBy === "price-desc")
      list.sort(
        (a, b) =>
          convertPriceToCurrentCurrency(b.basePrice) -
          convertPriceToCurrentCurrency(a.basePrice),
      );
    return list;
  }, [serverProducts, sortBy, convertPriceToCurrentCurrency]);

  const totalPages = serverTotalPages;
  const safePage = serverCurrentPage;
  const pagedProducts = products;

  const displayedProducts =
    viewMode === "infinite"
      ? products.length > 0
        ? Array.from(
            { length: visibleCount },
            (_, index) => products[index % products.length],
          )
        : []
      : pagedProducts;

  const { products: allMarketplaceProducts } = useMarketplaceProducts(50);
  const catalogPool = useMemo(
    () =>
      allMarketplaceProducts.length > 0 ? allMarketplaceProducts : PRODUCTS,
    [allMarketplaceProducts],
  );

  const topRecommendedProducts = useMemo(() => {
    return getTopRecommendedProducts(catalogPool, 6);
  }, [catalogPool]);

  const relatedProducts = useMemo(() => {
    if (!searchQuery) return [];
    const currentProductIds = products.map((p) => p.id);
    return getRelatedProducts({
      query: searchQuery,
      categoryId: selectedCategories[0],
      excludeIds: currentProductIds,
      limit: 3,
      sourceProducts: catalogPool,
    });
  }, [searchQuery, selectedCategories, products, catalogPool]);

  const filterKey = JSON.stringify({
    selectedCategories,
    sortBy,
    searchQuery,
    priceRange,
    discountOnly,
    selectedColors,
    selectedSizes,
    selectedUseCases,
    selectedStyles,
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
    if (nextPage === page) return;
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
            } w-full shrink-0 lg:sticky lg:top-24 lg:block lg:h-fit lg:w-64`}>
            <div className="bg-background lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-bold text-text">
                  <SlidersHorizontal className="h-4 w-4 text-primary" />
                  Filter
                </h2>
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/20">
                    <X className="h-3 w-3" />
                    Hapus
                  </button>
                ) : null}
              </div>

              <FilterSection title="Kategori" count={selectedCategories.length}>
                <div className="space-y-0.5">
                  {categories.map((cat) => {
                    const keyVal = cat.slug || cat.uuid || cat.id;
                    return (
                      <FilterCheckbox
                        key={keyVal}
                        label={cat.label}
                        checked={selectedCategories.includes(keyVal)}
                        onChange={() => toggleCategory(keyVal)}
                      />
                    );
                  })}
                </div>
              </FilterSection>

              <FilterSection title="Rentang Harga">
                <div className="grid grid-cols-1 gap-2">
                  <input
                    type="number"
                    min={0}
                    step={currency === "USD" ? 1 : 10000}
                    placeholder="Minimum"
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
                    className="w-full min-w-0 rounded-md border border-border bg-background px-3 py-2 text-xs text-text outline-none transition-colors placeholder:text-text-secondary/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    type="number"
                    min={0}
                    step={currency === "USD" ? 1 : 10000}
                    placeholder="Maksimum"
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
                    className="w-full min-w-0 rounded-md border border-border bg-background px-3 py-2 text-xs text-text outline-none transition-colors placeholder:text-text-secondary/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <p className="mt-2 text-[11px] text-text-secondary">
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
              </FilterSection>

              <FilterSection title="Warna" count={selectedColors.length}>
                <div className="relative">
                  <button
                    type="button"
                    aria-expanded={isColorDropdownOpen}
                    onClick={() => setIsColorDropdownOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-left text-xs text-text transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                    <span className="truncate">
                      {selectedColors.length > 0
                        ? selectedColors.join(", ")
                        : "Pilih warna"}
                    </span>
                    <ChevronDown
                      className={`ml-2 h-4 w-4 shrink-0 text-text-secondary transition-transform ${
                        isColorDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isColorDropdownOpen && (
                    <div className="mt-1 space-y-0.5 rounded-md border border-border bg-background p-1">
                      {COLOR_OPTIONS.map((color) => {
                        const isSelected = selectedColors.includes(color.label);
                        return (
                          <button
                            key={color.label}
                            type="button"
                            onClick={() => toggleColor(color.label)}
                            aria-pressed={isSelected}
                            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs text-text transition-colors hover:bg-surface">
                            <span
                              style={{ backgroundColor: color.hex }}
                              className={`h-4 w-4 shrink-0 rounded-sm border ${
                                isSelected ? "border-primary" : "border-border"
                              }`}></span>
                            <span className="flex-1">{color.label}</span>
                            {isSelected && (
                              <Check
                                className="h-3.5 w-3.5 text-primary"
                                strokeWidth={3}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </FilterSection>

              <FilterSection
                title="Ukuran"
                count={selectedSizes.length}
                isOpen={isSizeFilterOpen}
                onToggle={() => setIsSizeFilterOpen((prev) => !prev)}>
                <div className="flex flex-wrap gap-2">
                  {SIZE_OPTIONS.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(size)}
                      className={`min-w-10 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                        selectedSizes.includes(size)
                          ? "border-primary bg-primary text-white shadow-sm"
                          : "border-border bg-background text-text hover:border-primary hover:text-primary"
                      }`}>
                      {size}
                    </button>
                  ))}
                </div>
              </FilterSection>

              <FilterSection
                title="Kegunaan"
                count={selectedUseCases.length}
                isOpen={isUseCaseFilterOpen}
                onToggle={() => setIsUseCaseFilterOpen((prev) => !prev)}>
                <div className="space-y-0.5">
                  {USE_CASE_OPTIONS.map((useCase) => (
                    <FilterCheckbox
                      key={useCase}
                      label={useCase}
                      checked={selectedUseCases.includes(useCase)}
                      onChange={() => toggleUseCase(useCase)}
                    />
                  ))}
                </div>
              </FilterSection>

              <FilterSection
                title="Style"
                count={selectedStyles.length}
                isOpen={isStyleFilterOpen}
                onToggle={() => setIsStyleFilterOpen((prev) => !prev)}>
                <div className="flex flex-wrap gap-2">
                  {STYLE_OPTIONS.map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => toggleStyle(style)}
                      className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                        selectedStyles.includes(style)
                          ? "border-primary bg-primary text-white shadow-sm"
                          : "border-border bg-background text-text hover:border-primary hover:text-primary"
                      }`}>
                      {style}
                    </button>
                  ))}
                </div>
              </FilterSection>

              <FilterSection title="Promo">
                <FilterCheckbox
                  label="Hanya produk diskon"
                  checked={discountOnly}
                  onChange={() => {
                    setDiscountOnly((prev) => !prev);
                    resetToFirstPage();
                  }}
                />
              </FilterSection>
            </div>
          </aside>

          <div className="hidden w-px bg-border lg:block" />

          <div className="min-w-0 flex-1">
            <div className="sticky top-16 z-20 -mx-1 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/95 px-1 py-3 backdrop-blur">
              <span className="text-xs text-text-secondary sm:text-sm">
                {viewMode === "infinite"
                  ? `Menampilkan ${displayedProducts.length} produk`
                  : `Menampilkan ${displayedProducts.length} dari ${serverTotal} produk`}
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
            ) : products.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface/50 p-6 text-center sm:p-10">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Search className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-text sm:text-lg">
                  {searchQuery
                    ? `Tidak ada produk yang cocok dengan "${searchQuery}"`
                    : "Belum ada produk yang cocok dengan filter ini"}
                </h3>
                <p className="mx-auto mt-2 max-w-md text-xs text-text-secondary sm:text-sm">
                  {searchQuery
                    ? "Coba periksa ejaan Anda, gunakan kata kunci yang lebih umum, atau jelajahi rekomendasi produk terbaik kami di bawah ini."
                    : "Coba ubah atau reset filter untuk melihat koleksi produk lainnya."}
                </p>
                <div className="mt-5 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 sm:text-sm">
                    <X className="h-4 w-4" />
                    Reset Filter & Pencarian
                  </button>
                </div>

                {topRecommendedProducts.length > 0 && (
                  <div className="mt-10 border-t border-border pt-8 text-left">
                    <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <h4 className="text-base font-bold text-text sm:text-lg">
                          Rekomendasi Produk Terbaik Untuk Anda
                        </h4>
                      </div>
                      <span className="text-xs text-text-secondary">
                        Pilihan terpopuler dengan rating & ulasan tertinggi
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                      {topRecommendedProducts.slice(0, 3).map((product) => (
                        <ProductCard
                          key={`empty-rec-${product.id}`}
                          product={product}
                        />
                      ))}
                    </div>
                  </div>
                )}
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

                {viewMode === "pagination" ? (
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

                {/* Bagian Produk Terkait ketika pencarian aktif dan ada hasil */}
                {searchQuery && relatedProducts.length > 0 && (
                  <section className="mt-14 border-t border-border pt-8">
                    <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-primary" />
                          <h2 className="text-lg font-bold text-text sm:text-xl">
                            Produk Terkait yang Mungkin Anda Sukai
                          </h2>
                        </div>
                        <p className="mt-1 text-xs text-text-secondary sm:text-sm">
                          Rekomendasi berdasarkan pencarian &quot;{searchQuery}&quot;
                        </p>
                      </div>
                      <Link
                        to="/"
                        onClick={handleClearFilters}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                        Lihat Semua Katalog
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                      {relatedProducts.map((product) => (
                        <ProductCard
                          key={`related-${product.id}`}
                          product={product}
                        />
                      ))}
                    </div>
                  </section>
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
