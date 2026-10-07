import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Search, ShoppingCart, X, Star, Sparkles, TrendingUp, History } from "lucide-react";
import { ThemeToggle } from "@/components/navbar/Themetoggle";
import { NotificationMenu } from "@/components/navbar/NotificationMenu";
import { ProfileMenu } from "@/components/navbar/ProfileMenu";
import { MobileMenu } from "@/components/navbar/MobileMenu";
import { useCart } from "@/components/cart/useCart";
import { useAuth } from "@/components/auth/UseAuth";
import { CurrencySwitcher, useCurrency } from "@/components/navbar/CurrencySwitcher";
import {
  PRODUCTS,
  POPULAR_SEARCH_TERMS,
  getRecentlyViewedProducts,
  removeRecentlyViewedProduct,
  clearRecentlyViewedProducts,
  getTopRecommendedProducts,
  getRelatedProducts,
  getDiscountPercent,
  useMarketplaceProducts,
  useCategories,
  getRecentSearches,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
  type Product,
} from "@/lib/products";

export function MarketplaceHeader() {
  const { itemCount } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const { categories } = useCategories();
  const { products: marketplaceProducts } = useMarketplaceProducts(50);
  const allProducts = useMemo(
    () => (marketplaceProducts.length > 0 ? marketplaceProducts : PRODUCTS),
    [marketplaceProducts],
  );
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState(
    searchParams.get("category") ?? "all",
  );

  const categoryOptions = useMemo(
    () => [
      { value: "all", label: "Semua Kategori" },
      ...categories.map((c) => ({
        value: c.slug || c.uuid || c.id,
        label: c.label,
      })),
    ],
    [categories],
  );

  const urlQuery = searchParams.get("q") ?? "";
  const urlCategory = searchParams.get("category") ?? "all";

  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery);
  if (urlQuery !== prevUrlQuery) {
    setPrevUrlQuery(urlQuery);
    setQuery(urlQuery);
  }

  const [prevUrlCategory, setPrevUrlCategory] = useState(urlCategory);
  if (urlCategory !== prevUrlCategory) {
    setPrevUrlCategory(urlCategory);
    setCategory(urlCategory);
  }

 
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const inputColumnRef = useRef<HTMLDivElement>(null);
  const [dropdownRect, setDropdownRect] = useState<{
    left: number;
    width: number;
  } | null>(null);

  
  useEffect(() => {
    if (!isSearchOpen) return;

    function updateDropdownPosition() {
      if (!inputColumnRef.current || !searchWrapperRef.current) return;
      const inputRect = inputColumnRef.current.getBoundingClientRect();
      const wrapperRect = searchWrapperRef.current.getBoundingClientRect();
      setDropdownRect({
        left: inputRect.left - wrapperRect.left,
        width: inputRect.width,
      });
    }

    updateDropdownPosition();
    window.addEventListener("resize", updateDropdownPosition);
    return () => window.removeEventListener("resize", updateDropdownPosition);
  }, [isSearchOpen]);

  useEffect(() => {
    function loadRecentlyViewed() {
      setRecentlyViewed(getRecentlyViewedProducts(4));
    }
    loadRecentlyViewed();
    window.addEventListener("recently-viewed-updated", loadRecentlyViewed);
    return () =>
      window.removeEventListener("recently-viewed-updated", loadRecentlyViewed);
  }, []);

  useEffect(() => {
    function loadRecentSearches() {
      setRecentSearches(getRecentSearches());
    }
    loadRecentSearches();
    window.addEventListener("recent-searches-updated", loadRecentSearches);
    return () =>
      window.removeEventListener("recent-searches-updated", loadRecentSearches);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(e.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setIsSearchOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);
  // --- Akhir tambahan ---

  // --- Tambahan: hasil pencarian live & rekomendasi ---
  const trimmedQuery = query.trim().toLowerCase();

  const searchResults = useMemo(() => {
    if (!trimmedQuery) return [];
    return allProducts.filter((product) =>
      product.name.toLowerCase().includes(trimmedQuery),
    );
  }, [trimmedQuery, allProducts]);

  const topRecommended = useMemo(() => {
    return getTopRecommendedProducts(allProducts, 4, "best");
  }, [allProducts]);

  const relatedSearchResults = useMemo(() => {
    if (!trimmedQuery || searchResults.length === 0) return [];
    return getRelatedProducts({
      query: trimmedQuery,
      excludeIds: searchResults.map((p) => p.id),
      limit: 3,
      sourceProducts: allProducts,
    });
  }, [trimmedQuery, searchResults, allProducts]);
  // --- Akhir tambahan ---

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    const nextParams = new URLSearchParams(searchParams);

    if (trimmed) {
      addRecentSearch(trimmed);
      nextParams.set("q", trimmed);
    } else {
      nextParams.delete("q");
    }

    if (category && category !== "all") {
      nextParams.set("category", category);
    } else {
      nextParams.delete("category");
    }

    nextParams.set("page", "1");
    navigate({
      pathname: "/",
      search: nextParams.toString() ? `?${nextParams.toString()}` : "",
    });
    setIsSearchOpen(false);
  }

  function handleCategoryChange(nextCategory: string) {
    setCategory(nextCategory);
    setIsSearchOpen(false);

    if (nextCategory === "all") {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("category");
      nextParams.set("page", "1");
      navigate({
        pathname: "/",
        search: nextParams.toString() ? `?${nextParams.toString()}` : "",
      });
      return;
    }

    navigate(`/category/${encodeURIComponent(nextCategory)}`);
  }

  // --- Tambahan: handler klik term populer ---
  function handleTermClick(term: string) {
    setQuery(term);
    setIsSearchOpen(false);
    addRecentSearch(term);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("q", term);
    if (category && category !== "all") {
      nextParams.set("category", category);
    } else {
      nextParams.delete("category");
    }
    nextParams.set("page", "1");
    navigate({ pathname: "/", search: `?${nextParams.toString()}` });
  }
  // --- Akhir tambahan ---

  // --- Tambahan: handler hapus kata kunci dari search bar ---
  function handleClearQuery() {
    setQuery("");
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("q");
    nextParams.set("page", "1");
    navigate({
      pathname: "/",
      search: nextParams.toString() ? `?${nextParams.toString()}` : "",
    });
  }
  // --- Akhir tambahan ---

  function renderRecommendationSection(title: string, keyPrefix: string) {
    if (topRecommended.length === 0) return null;

    return (
      <div className="mt-4 border-t border-border pt-3">
        <div className="mb-2 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            {title}
          </p>
        </div>

        <div className="flex flex-col gap-1">
          {topRecommended.map((product) => {
            const discount = getDiscountPercent(product);
            const rating = product.rating ?? 0;
            const reviews = product.reviewCount ?? 0;

            let badgeText = "Pilihan Utama";
            let badgeClass = "bg-primary/10 text-primary";
            if (discount && discount >= 20) {
              badgeText = `Diskon ${discount}%`;
              badgeClass = "bg-red-500/10 text-red-600 dark:text-red-400";
            } else if (reviews >= 10) {
              badgeText = "Terlaris";
              badgeClass = "bg-amber-500/10 text-amber-700 dark:text-amber-400";
            } else if (rating >= 4.5) {
              badgeText = "Top Rated";
              badgeClass = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
            }

            return (
              <Link
                key={`${keyPrefix}-${product.id}`}
                to={`/product/${product.id}`}
                onClick={() => setIsSearchOpen(false)}
                className="group flex items-center justify-between gap-3 rounded-lg p-2 transition-colors hover:bg-border/40"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-border/20">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : null}
                    {discount ? (
                      <span className="absolute left-0 top-0 rounded-br bg-red-600 px-1 py-0.2 text-[9px] font-bold text-white">
                        -{discount}%
                      </span>
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text transition-colors group-hover:text-primary">
                      {product.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-primary">
                        {formatPrice(product.basePrice)}
                      </span>
                      {product.comparePrice &&
                      product.comparePrice > product.basePrice ? (
                        <span className="text-[11px] text-text-secondary line-through">
                          {formatPrice(product.comparePrice)}
                        </span>
                      ) : null}
                      <span
                        className={`rounded px-1.5 py-0.2 text-[10px] font-medium ${badgeClass}`}
                      >
                        {badgeText}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-0.5">
                  {rating > 0 ? (
                    <div className="flex items-center gap-1 text-[11px] font-medium text-amber-500">
                      <Star className="h-3 w-3 fill-current" />
                      <span>{rating.toFixed(1)}</span>
                      {reviews > 0 ? (
                        <span className="text-[10px] text-text-secondary">
                          ({reviews})
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="shrink-0">
          <img
            src="/logo/logo_nadrical.png"
            alt="Logo"
            className="h-10 w-auto object-contain"
          />
        </Link>

        {/* Wrapper luar: hanya untuk deteksi klik-di-luar, BUKAN pembungkus dropdown */}
        <div ref={searchWrapperRef} className="relative flex-1">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-1 items-stretch overflow-hidden rounded-lg border border-border bg-surface focus-within:border-primary">
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              aria-label="Filter kategori"
              className="hidden shrink-0 border-r border-border bg-surface px-3 text-sm text-text-secondary outline-none sm:block sm:max-w-[140px] lg:max-w-none">
              {categoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <div ref={inputColumnRef} className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="Cari produk..."
                className="w-full border-0 bg-transparent py-2.5 pl-10 pr-9 text-sm text-text outline-none placeholder:text-text-secondary"
              />
              <button
                type="submit"
                aria-label="Cari"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary">
                <Search className="h-4 w-4" />
              </button>

              {query && (
                <button
                  type="button"
                  onClick={handleClearQuery}
                  aria-label="Hapus kata kunci"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>

          {isSearchOpen && dropdownRect && (
            <div
              className="absolute top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-lg border border-border bg-surface p-4 shadow-lg"
              style={{ left: dropdownRect.left, width: dropdownRect.width }}>
              {trimmedQuery ? (
                <div>
                  {searchResults.length > 0 ? (
                    <div>
                      <div className="mb-2 flex items-center justify-between border-b border-border/60 pb-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                          Hasil Pencarian
                        </p>
                        <span className="text-xs text-text-secondary">
                          {searchResults.length} Produk Ditemukan
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        {searchResults.slice(0, 6).map((product) => {
                          const discount = getDiscountPercent(product);
                          return (
                            <Link
                              key={product.id}
                              to={`/product/${product.id}`}
                              onClick={() => setIsSearchOpen(false)}
                              className="group flex items-center justify-between gap-3 rounded-lg p-2 transition-colors hover:bg-border/40">
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-border/20">
                                  {product.image ? (
                                    <img
                                      src={product.image}
                                      alt={product.name}
                                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-[10px] text-text-secondary">
                                      No Img
                                    </div>
                                  )}
                                  {discount ? (
                                    <span className="absolute left-0 top-0 rounded-br bg-red-600 px-1 py-0.2 text-[9px] font-bold text-white">
                                      -{discount}%
                                    </span>
                                  ) : null}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-text transition-colors group-hover:text-primary">
                                    {product.name}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="font-semibold text-primary">
                                      {formatPrice(product.basePrice)}
                                    </span>
                                    {product.comparePrice &&
                                    product.comparePrice > product.basePrice ? (
                                      <span className="text-[11px] text-text-secondary line-through">
                                        {formatPrice(product.comparePrice)}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                              {(product.rating ?? 0) > 0 ? (
                                <div className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-amber-500">
                                  <Star className="h-3 w-3 fill-current" />
                                  <span>{(product.rating ?? 0).toFixed(1)}</span>
                                </div>
                              ) : null}
                            </Link>
                          );
                        })}
                      </div>

                      {/* Produk Terkait dalam pencarian jika ada */}
                      {relatedSearchResults.length > 0 && (
                        <div className="mt-4 border-t border-border pt-3">
                          <div className="mb-2 flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-primary" />
                            <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                              Produk Terkait yang Mungkin Anda Sukai
                            </p>
                          </div>
                          <div className="flex flex-col gap-1">
                            {relatedSearchResults.map((product) => (
                              <Link
                                key={`related-search-${product.id}`}
                                to={`/product/${product.id}`}
                                onClick={() => setIsSearchOpen(false)}
                                className="group flex items-center justify-between gap-3 rounded-lg p-2 transition-colors hover:bg-border/40">
                                <div className="flex min-w-0 items-center gap-3">
                                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-border/20">
                                    {product.image && (
                                      <img
                                        src={product.image}
                                        alt={product.name}
                                        className="h-full w-full object-cover"
                                      />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate text-xs font-medium text-text transition-colors group-hover:text-primary">
                                      {product.name}
                                    </p>
                                    <p className="text-xs font-semibold text-primary">
                                      {formatPrice(product.basePrice)}
                                    </p>
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="rounded-lg border border-dashed border-border/80 bg-surface/50 p-3 text-center">
                        <p className="text-sm font-semibold text-text">
                          Tidak ada produk yang cocok dengan &quot;{query}&quot;
                        </p>
                        <p className="mt-0.5 text-xs text-text-secondary">
                          Berikut rekomendasi produk terpopuler pilihan kami:
                        </p>
                      </div>

                      {renderRecommendationSection(
                        "Rekomendasi Terbaik Untuk Anda",
                        "rec-empty",
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {recentSearches.length > 0 && (
                    <div className="mb-4">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <History className="h-3.5 w-3.5 text-primary" />
                          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                            Pencarian Terakhir
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={clearRecentSearches}
                          className="text-[11px] font-medium text-red-500 transition-colors hover:text-red-600 hover:underline">
                          Hapus Semua
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((term) => (
                          <div
                            key={term}
                            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs text-text transition-colors hover:border-primary">
                            <button
                              type="button"
                              onClick={() => handleTermClick(term)}
                              className="font-medium hover:text-primary">
                              {term}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeRecentSearch(term);
                              }}
                              aria-label={`Hapus ${term}`}
                              className="rounded-full p-0.5 text-text-secondary hover:bg-border/60 hover:text-red-500">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="mb-2 flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-primary" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                        Kata Kunci Populer
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {POPULAR_SEARCH_TERMS.map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => handleTermClick(term)}
                          className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90">
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>

                  {recentlyViewed.length > 0 && (
                    <div className="mt-4 border-t border-border pt-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                          Baru Dilihat
                        </p>
                        <button
                          type="button"
                          onClick={clearRecentlyViewedProducts}
                          className="text-[11px] font-medium text-red-500 transition-colors hover:text-red-600 hover:underline">
                          Hapus Semua
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {recentlyViewed.map((product) => (
                          <div
                            key={product.id}
                            className="group relative w-28 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                removeRecentlyViewedProduct(product.id);
                              }}
                              aria-label={`Hapus ${product.name} dari baru dilihat`}
                              className="absolute right-1 top-1 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-background/80 text-text-secondary shadow-sm backdrop-blur-xs transition-colors hover:bg-background hover:text-red-500">
                              <X className="h-3 w-3" />
                            </button>

                            <Link
                              to={`/product/${product.id}`}
                              onClick={() => setIsSearchOpen(false)}
                              className="block">
                              <div className="aspect-square overflow-hidden rounded-lg bg-border/20">
                                {product.image && (
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                  />
                                )}
                              </div>
                              <p className="mt-1 line-clamp-2 text-xs text-text transition-colors group-hover:text-primary">
                                {product.name}
                              </p>
                              <p className="text-xs font-semibold text-primary">
                                {formatPrice(product.basePrice)}
                              </p>
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {renderRecommendationSection(
                    "Rekomendasi Populer",
                    "rec-blank",
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link
            to="/cart"
            aria-label="Keranjang"
            className="relative rounded-full p-2 text-text hover:bg-border/40">
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-white">
                {itemCount}
              </span>
            ) : null}
          </Link>

          <div className="hidden items-center gap-1 sm:gap-2 lg:flex">
            <NotificationMenu />
            <ThemeToggle />
            <CurrencySwitcher />
          </div>

          <div className="lg:hidden">
            <MobileMenu />
          </div>

          {isAuthenticated ? (
            <ProfileMenu name={user?.full_name || "User"} />
          ) : (
            <div className="hidden items-center gap-2 lg:flex">
              <Link
                to="/sign-in"
                className="rounded-lg px-4 py-2 text-sm font-medium text-text hover:bg-border/40 transition-colors">
                Masuk
              </Link>
              <Link
                to="/sign-up"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity">
                Daftar
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
