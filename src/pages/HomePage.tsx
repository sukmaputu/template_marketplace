import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { MarketplaceHeader } from "@/components/MarketplaceHeader";
import { MarketplaceFooter } from "@/components/MarketplaceFooter";
import { ProductCard } from "@/components/ProductCard";
import { ProductQuickViewModal } from "@/components/Productquickviewmodal";
import { PromoBannerSection } from "@/components/PromoBannerSection";
import { Pagination } from "@/components/ui/pagination";
import { CATEGORY_DETAILS, PRODUCTS } from "@/lib/products";
import { PromoModal } from "@/components/PromoModal";
import type { Product } from "@/lib/products";

const SORT_OPTIONS = [
  { value: "default", label: "Bawaan" },
  { value: "price-asc", label: "Harga Terendah" },
  { value: "price-desc", label: "Harga Tertinggi" },
  { value: "newest", label: "Terbaru" },
];

const PAGE_SIZE = 8;

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = (searchParams.get("q") ?? "").trim().toLowerCase();
  const requestedPage = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const page =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("default");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  function toggleCategory(id: string) {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("page", "1");
    setSearchParams(nextParams, { replace: true });
  }

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

    const sorted = [...filtered];
    if (sortBy === "price-asc") sorted.sort((a, b) => a.price - b.price);
    if (sortBy === "price-desc") sorted.sort((a, b) => b.price - a.price);
    return sorted;
  }, [selectedCategories, sortBy, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedProducts = products.slice(
    (safePage - 1) * PAGE_SIZE,
    (safePage - 1) * PAGE_SIZE + PAGE_SIZE,
  );

  function handlePageChange(nextPage: number) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("page", String(nextPage));
    setSearchParams(nextParams);
  }

  const [showPromo, setShowPromo] = useState(false);

  useEffect(() => {
    const hasSeenPromo = sessionStorage.getItem("hasSeenPromo");

    if (!hasSeenPromo) {
      const timer = setTimeout(() => {
        setShowPromo(true);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClosePromo = () => {
    setShowPromo(false);
    sessionStorage.setItem("hasSeenPromo", "true");
  };

  return (
    <div className="min-h-screen bg-background transition-colors">
      <MarketplaceHeader />

      {showPromo && <PromoModal onClose={handleClosePromo} />}

      <PromoBannerSection />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-text">Katalog Produk</h1>
        {searchQuery ? (
          <p className="mt-1 text-sm text-text-secondary">
            Menampilkan hasil pencarian untuk{" "}
            <span className="font-medium text-text">"{searchQuery}"</span>
          </p>
        ) : null}

        <div className="mt-8 flex flex-col gap-8 lg:flex-row">
          <aside className="w-full shrink-0 lg:w-56">
            <h2 className="text-sm font-bold text-text">Kategori</h2>
            <div className="mt-3 space-y-3 border-t border-border pt-3">
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
          </aside>

          {/* Divider (desktop) */}
          <div className="hidden w-px bg-border lg:block" />

          {/* Main content */}
          <div className="flex-1">
            <div className="flex items-center justify-end gap-2">
              <span className="text-sm text-text-secondary">Urutan:</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    const nextParams = new URLSearchParams(searchParams);
                    nextParams.set("page", "1");
                    setSearchParams(nextParams, { replace: true });
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

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {pagedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={setSelectedProduct}
                />
              ))}
            </div>

            {products.length === 0 ? (
              <p className="mt-12 text-center text-sm text-text-secondary">
                Belum ada produk yang cocok dengan filter/pencarian ini.
              </p>
            ) : (
              <div className="mt-6 overflow-hidden rounded-xl border border-border bg-surface">
                <Pagination
                  currentPage={safePage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <MarketplaceFooter />

      <ProductQuickViewModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}
