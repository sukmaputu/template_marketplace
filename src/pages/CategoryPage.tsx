import { useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronDown, Loader2, RotateCcw, SlidersHorizontal, Tag } from "lucide-react";
import { MarketplaceHeader } from "@/components/navbar/MarketplaceHeader";
import { MarketplaceFooter } from "@/components/MarketplaceFooter";
import { ProductCard } from "@/components/ProductCard";
import { Pagination } from "@/components/ui/pagination";
import {
  useCategories,
  usePaginatedProducts,
  useProductFilterOptions,
} from "@/lib/products";

const SORT_OPTIONS = [
  { value: "default", label: "Bawaan" },
  { value: "price-asc", label: "Harga Terendah" },
  { value: "price-desc", label: "Harga Tertinggi" },
  { value: "newest", label: "Terbaru" },
];

export default function CategoryPage() {
  const params = useParams();
  const categoryId = params.categoryId ?? "teknologi-informasi";
  const [pagination, setPagination] = useState({ categoryId, page: 1 });
  const currentPage =
    pagination.categoryId === categoryId ? pagination.page : 1;
  const setCurrentPage = (page: number) => setPagination({ categoryId, page });
  const [sortBy, setSortBy] = useState("default");
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [discountInput, setDiscountInput] = useState(false);
  const [minPrice, setMinPrice] = useState<number>();
  const [maxPrice, setMaxPrice] = useState<number>();
  const [discountOnly, setDiscountOnly] = useState(false);
  const [filterError, setFilterError] = useState("");

  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string[]>>({});
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});

  const [prevCategoryId, setPrevCategoryId] = useState(categoryId);
  if (categoryId !== prevCategoryId) {
    setPrevCategoryId(categoryId);
    setSelectedSpecs({});
    setSelectedOptions({});
    setMinPriceInput("");
    setMaxPriceInput("");
    setDiscountInput(false);
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setDiscountOnly(false);
    setFilterError("");
  }

  const { categories } = useCategories();
  const filterCategory = categories.find(
    (item) =>
      item.slug === categoryId ||
      item.id === categoryId ||
      item.uuid === categoryId,
  );

  const { filterOptions } = useProductFilterOptions({
    category: categoryId,
    categoryUuid: filterCategory?.uuid,
  });

  const {
    products: serverProducts,
    totalPages,
    currentPage: serverCurrentPage,
    loading,
  } = usePaginatedProducts({
    page: currentPage,
    category: categoryId,
    categoryUuid: filterCategory?.uuid,
    minPrice,
    maxPrice,
    discountOnly,
    specs: selectedSpecs,
    options: selectedOptions,
    limit: 12,
  });

  const products = useMemo(() => {
    const sorted = [...serverProducts];
    if (sortBy === "price-asc")
      sorted.sort((a, b) => a.basePrice - b.basePrice);
    if (sortBy === "price-desc")
      sorted.sort((a, b) => b.basePrice - a.basePrice);
    return sorted;
  }, [sortBy, serverProducts]);

  const category = filterCategory;

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextMinPrice = minPriceInput ? Number(minPriceInput) : undefined;
    const nextMaxPrice = maxPriceInput ? Number(maxPriceInput) : undefined;

    if (
      (nextMinPrice !== undefined && !Number.isFinite(nextMinPrice)) ||
      (nextMaxPrice !== undefined && !Number.isFinite(nextMaxPrice))
    ) {
      setFilterError("Masukkan rentang harga yang valid.");
      return;
    }

    if (
      nextMinPrice !== undefined &&
      nextMaxPrice !== undefined &&
      nextMinPrice > nextMaxPrice
    ) {
      setFilterError("Harga minimum tidak boleh melebihi harga maksimum.");
      return;
    }

    setFilterError("");
    setMinPrice(nextMinPrice);
    setMaxPrice(nextMaxPrice);
    setDiscountOnly(discountInput);
    setCurrentPage(1);
  }

  const toggleSpec = (specName: string, value: string) => {
    setSelectedSpecs((prev) => {
      const current = prev[specName] || [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      if (updated.length === 0) {
        const next = { ...prev };
        delete next[specName];
        return next;
      }
      return { ...prev, [specName]: updated };
    });
    setCurrentPage(1);
  };

  const toggleOption = (groupName: string, value: string) => {
    setSelectedOptions((prev) => {
      const current = prev[groupName] || [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      if (updated.length === 0) {
        const next = { ...prev };
        delete next[groupName];
        return next;
      }
      return { ...prev, [groupName]: updated };
    });
    setCurrentPage(1);
  };

  function resetFilters() {
    setMinPriceInput("");
    setMaxPriceInput("");
    setDiscountInput(false);
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setDiscountOnly(false);
    setSelectedSpecs({});
    setSelectedOptions({});
    setFilterError("");
    setCurrentPage(1);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background transition-colors">
      <MarketplaceHeader />

      <div className="mx-auto max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
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
            {category?.description ? (
              <p className="mt-2 max-w-2xl text-sm text-text-secondary">
                {category.description}
              </p>
            ) : null}
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

        <form
          onSubmit={applyFilters}
          className="mt-6 flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-end">
          <div className="flex items-center gap-2 text-sm font-semibold text-text">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            Filter
          </div>
          <label className="flex-1 text-xs font-medium text-text-secondary">
            Harga minimum
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={minPriceInput}
              onChange={(event) => setMinPriceInput(event.target.value)}
              placeholder="Contoh: 50000"
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-primary"
            />
          </label>
          <label className="flex-1 text-xs font-medium text-text-secondary">
            Harga maksimum
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={maxPriceInput}
              onChange={(event) => setMaxPriceInput(event.target.value)}
              placeholder="Contoh: 500000"
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-primary"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-text">
            <input
              type="checkbox"
              checked={discountInput}
              onChange={(event) => setDiscountInput(event.target.checked)}
              className="h-4 w-4 rounded accent-primary"
            />
            Sedang diskon
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">
              Terapkan
            </button>
            <button
              type="button"
              onClick={resetFilters}
              aria-label="Reset filter"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-text-secondary hover:bg-background">
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
          {filterError && (
            <p role="alert" className="text-xs text-red-600 sm:basis-full">
              {filterError}
            </p>
          )}
        </form>

        {/* Dynamic Variant & Spec Filters */}
        {((filterOptions?.variant_groups &&
          filterOptions.variant_groups.length > 0) ||
          (filterOptions?.specifications &&
            filterOptions.specifications.length > 0)) && (
          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
              <Tag className="h-3.5 w-3.5 text-primary" />
              Filter Karakteristik & Varian
            </div>

            {/* Varian Multi-Dimensi */}
            {filterOptions?.variant_groups?.map((group) => {
              const opts = (group.options || group.values || []) as any[];
              if (opts.length === 0) return null;
              return (
                <div
                  key={group.name}
                  className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="min-w-[70px] font-semibold text-text">
                    {group.name}:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {opts.map((v) => {
                      const val =
                        typeof v === "string" ? v : v.value || v.name || "";
                      const isSelected = selectedOptions[group.name]?.includes(val);
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => toggleOption(group.name, val)}
                          className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                            isSelected
                              ? "border-primary bg-primary text-white"
                              : "border-border bg-background text-text hover:border-primary"
                          }`}>
                          {val}
                          {typeof v.count === "number" && (
                            <span className="ml-1 opacity-60">({v.count})</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Spesifikasi Kategori */}
            {filterOptions?.specifications?.map((spec) => {
              const specName = spec.name;
              if (!specName || !spec.values || spec.values.length === 0)
                return null;
              return (
                <div
                  key={specName}
                  className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="min-w-[70px] font-semibold text-text">
                    {specName}:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {spec.values.map((v: any) => {
                      const val =
                        typeof v === "string" ? v : v.value || v.name || "";
                      const isSelected = selectedSpecs[specName]?.includes(val);
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => toggleSpec(specName, val)}
                          className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                            isSelected
                              ? "border-primary bg-primary text-white"
                              : "border-border bg-background text-text hover:border-primary"
                          }`}>
                          {val}
                          {typeof v.count === "number" && (
                            <span className="ml-1 opacity-60">({v.count})</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="mt-6 overflow-hidden rounded-xl border border-border bg-surface">
              <Pagination
                currentPage={serverCurrentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        ) : (
          <p className="mt-12 text-center text-sm text-text-secondary">
            Belum ada produk di kategori ini.
          </p>
        )}
      </div>

      <MarketplaceFooter />
    </div>
  );
}
