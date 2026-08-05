import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { MarketplaceHeader } from "@/components/MarketplaceHeader";
import { MarketplaceFooter } from "@/components/MarketplaceFooter";
import { ProductCard } from "@/components/ProductCard";
import { ProductQuickViewModal } from "@/components/Productquickviewmodal";
import { PromoBannerSection } from "@/components/PromoBannerSection";
import { CATEGORY_DETAILS, PRODUCTS } from "@/lib/products";
import type { Product } from "@/lib/products";

const SORT_OPTIONS = [
  { value: "default", label: "Bawaan" },
  { value: "price-asc", label: "Harga Terendah" },
  { value: "price-desc", label: "Harga Tertinggi" },
  { value: "newest", label: "Terbaru" },
];

export default function HomePage() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("default");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  function toggleCategory(id: string) {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  const products = useMemo(() => {
    const filtered = selectedCategories.length
      ? PRODUCTS.filter((product) =>
          selectedCategories.includes(product.categoryId ?? ""),
        )
      : PRODUCTS;

    const sorted = [...filtered];
    if (sortBy === "price-asc") sorted.sort((a, b) => a.price - b.price);
    if (sortBy === "price-desc") sorted.sort((a, b) => b.price - a.price);
    return sorted;
  }, [selectedCategories, sortBy]);

  return (
    <div className="min-h-screen bg-background transition-colors">
      <MarketplaceHeader />

      <PromoBannerSection />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-text">Katalog Produk</h1>

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

          <div className="hidden w-px bg-border lg:block" />

          <div className="flex-1">
            <div className="flex items-center justify-end gap-2">
              <span className="text-sm text-text-secondary">Urutan:</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
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
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={setSelectedProduct}
                />
              ))}
            </div>

            {products.length === 0 ? (
              <p className="mt-12 text-center text-sm text-text-secondary">
                Belum ada produk di kategori ini.
              </p>
            ) : null}
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
