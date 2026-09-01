import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Search, ShoppingCart } from "lucide-react";
import { ThemeToggle } from "@/components/navbar/Themetoggle";
import { NotificationMenu } from "@/components/navbar/NotificationMenu";
import { ProfileMenu } from "@/components/navbar/ProfileMenu";
import { MobileMenu } from "@/components/navbar/MobileMenu";
import { useCart } from "@/components/cart/useCart";
import { useAuth } from "@/components/auth/UseAuth";

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
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="shrink-0">
          <img
            src="/logo/logo.png"
            alt="Logo"
            className="h-10 w-auto object-contain"
          />
        </Link>

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

          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari produk..."
              className="w-full border-0 bg-transparent py-2.5 pl-10 pr-4 text-sm text-text outline-none placeholder:text-text-secondary"
            />
            <button
              type="submit"
              aria-label="Cari"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary">
              <Search className="h-4 w-4" />
            </button>
          </div>
        </form>

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
