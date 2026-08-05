import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { MarketplaceHeader } from "@/components/MarketplaceHeader";
import { MarketplaceFooter } from "@/components/MarketplaceFooter";
import { ProductCard } from "@/components/ProductCard";
import { CATEGORY_DETAILS, PRODUCTS } from "@/lib/products";
import { ProductQuickViewModal } from "@/components/Productquickviewmodal";
import type { Product } from "@/lib/products";

const SORT_OPTIONS = [
  { value: "default", label: "Bawaan" },
  { value: "price-asc", label: "Harga Terendah" },
  { value: "price-desc", label: "Harga Tertinggi" },
  { value: "newest", label: "Terbaru" },
];

export default function CategoryPage() {
  const params = useParams();
  const categoryId = params.categoryId ?? "teknologi-informasi";
  const [sortBy, setSortBy] = useState("default");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const category = CATEGORY_DETAILS.find((item) => item.id === categoryId);

  const products = useMemo(() => {
    const filtered = PRODUCTS.filter(
      (product) => product.categoryId === categoryId,
    );
    const sorted = [...filtered];
    if (sortBy === "price-asc") sorted.sort((a, b) => a.price - b.price);
    if (sortBy === "price-desc") sorted.sort((a, b) => b.price - a.price);
    return sorted;
  }, [categoryId, sortBy]);

  return (
    <div className="min-h-screen bg-background transition-colors">
      <MarketplaceHeader />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
          <Link to="/" className="hover:text-primary">
            Beranda
          </Link>
          <span>/</span>
          <span className="font-medium text-text">
            {category?.label ?? "Kategori"}
          </span>
        </div>

        <div className="mt-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-text">
              {category?.label ?? "Kategori"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-text-secondary">
              {category?.description}
            </p>
          </div>

          <div className="flex items-center gap-2">
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
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
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

      <MarketplaceFooter />
      <ProductQuickViewModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}
