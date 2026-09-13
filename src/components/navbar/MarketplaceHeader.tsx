import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Search, ShoppingCart, X } from "lucide-react";
import { ThemeToggle } from "@/components/navbar/Themetoggle";
import { NotificationMenu } from "@/components/navbar/NotificationMenu";
import { ProfileMenu } from "@/components/navbar/ProfileMenu";
import { MobileMenu } from "@/components/navbar/MobileMenu";
import { useCart } from "@/components/cart/useCart";
import { useAuth } from "@/components/auth/UseAuth";
import { CurrencySwitcher } from "@/components/navbar/CurrencySwitcher";
import {
  PRODUCTS,
  POPULAR_SEARCH_TERMS,
  getRecentlyViewedProducts,
  type Product,
} from "@/lib/products";

const CATEGORY_OPTIONS = [
  { value: "all", label: "Semua Kategori" },
  { value: "teknologi-informasi", label: "Teknologi Informasi" },
  { value: "keuangan", label: "Keuangan" },
  { value: "asuransi", label: "Asuransi" },
  { value: "teknologi-mesin", label: "Teknologi Mesin" },
];

export function MarketplaceHeader() {
  const { itemCount } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState(
    searchParams.get("category") ?? "all",
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

  // --- Tambahan: state & ref untuk dropdown search ---
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const inputColumnRef = useRef<HTMLDivElement>(null);
  const [dropdownRect, setDropdownRect] = useState<{
    left: number;
    width: number;
  } | null>(null);

  // Dropdown diletakkan di luar <form> (yang punya overflow-hidden untuk
  // sudut rounded) supaya tidak ikut terpotong. Posisi & lebarnya dihitung
  // manual di sini supaya tetap presisi selebar kolom input saja.
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

  // --- Tambahan: hasil pencarian live saat mengetik ---
  const trimmedQuery = query.trim().toLowerCase();

  const searchResults = useMemo(() => {
    if (!trimmedQuery) return [];
    return PRODUCTS.filter((product) =>
      product.name.toLowerCase().includes(trimmedQuery),
    );
  }, [trimmedQuery]);
  // --- Akhir tambahan ---

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    const nextParams = new URLSearchParams(searchParams);

    if (trimmed) {
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

  // --- Tambahan: handler klik term populer ---
  function handleTermClick(term: string) {
    setQuery(term);
    setIsSearchOpen(false);
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
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Filter kategori"
              className="hidden shrink-0 border-r border-border bg-surface px-3 text-sm text-text-secondary outline-none sm:block sm:max-w-[140px] lg:max-w-none">
              {CATEGORY_OPTIONS.map((opt) => (
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

          {/* Dropdown DILUAR <form> (yang overflow-hidden) supaya tidak
              terpotong. Lebar & posisi kiri diambil dari dropdownRect,
              yang dihitung dari ukuran kolom input saja (inputColumnRef) */}
          {isSearchOpen && dropdownRect && (
            <div
              className="absolute top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-lg border border-border bg-surface p-4 shadow-lg"
              style={{ left: dropdownRect.left, width: dropdownRect.width }}>
              {trimmedQuery ? (
                <div>
                  <p className="text-sm font-semibold text-text">Produk</p>
                  <p className="mb-3 text-xs text-text-secondary">
                    {searchResults.length} Hasil Ditemukan
                  </p>

                  {searchResults.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {searchResults.map((product) => (
                        <Link
                          key={product.id}
                          to={`/product/${product.id}`}
                          onClick={() => setIsSearchOpen(false)}
                          className="flex items-center gap-3 rounded-lg p-2 hover:bg-border/40">
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-border/20">
                            {product.image && (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-text">
                              {product.name}
                            </p>
                            <p className="text-sm text-text-secondary">
                              Rp {product.basePrice}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-text-secondary">
                      Tidak ada produk yang cocok dengan &quot;{query}&quot;
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div>
                    <p className="mb-2 text-sm font-medium text-text">
                      Kata Kunci Populer
                    </p>
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
                    <div className="mt-4">
                      <p className="mb-2 text-sm font-medium text-text">
                        Baru Dilihat
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {recentlyViewed.map((product) => (
                          <Link
                            key={product.id}
                            to={`/product/${product.id}`}
                            onClick={() => setIsSearchOpen(false)}
                            className="group w-28 shrink-0">
                            <div className="aspect-square overflow-hidden rounded-lg bg-border/20">
                              {product.image && (
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                />
                              )}
                            </div>
                            <p className="mt-1 line-clamp-2 text-xs text-text">
                              {product.name}
                            </p>
                            <p className="text-xs font-semibold text-primary">
                              {product.basePrice}
                            </p>
                          </Link>
                        ))}
                      </div>
                    </div>
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
