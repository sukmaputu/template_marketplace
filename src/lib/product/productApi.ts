import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { websocketService } from "@/lib/websocket";
import { PRODUCTS, CATEGORY_DETAILS } from "./productData";
import { getDiscountPercent } from "./productDomain";
import { mapBackendToProduct } from "./productTransformers";
import type {
  CategoryItem,
  Product,
  ProductFilterOptions,
  UsePaginatedProductsOptions,
  UsePaginatedProductsResult,
  UseProductFilterOptions,
} from "./productTypes";

export function useMarketplaceProducts(limit = 6) {
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setRefreshKey((k) => k + 1);
    window.addEventListener("products-updated", handleUpdate);
    window.addEventListener("categories-updated", handleUpdate);
    window.addEventListener("focus", handleUpdate);
    const unsub = websocketService.on("products_updated", handleUpdate);
    return () => {
      window.removeEventListener("products-updated", handleUpdate);
      window.removeEventListener("categories-updated", handleUpdate);
      window.removeEventListener("focus", handleUpdate);
      unsub();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchProducts() {
      try {
        const res = await api.get("/ecommerce/products", {
          params: { limit },
        });
        const items = res.data?.data;
        if (Array.isArray(items) && !cancelled) {
          const backendItems = items.map(mapBackendToProduct);
          setProducts(backendItems);
        }
      } catch {
        // Fallback to static PRODUCTS
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProducts();
    return () => {
      cancelled = true;
    };
  }, [limit, refreshKey]);

  return { products, loading };
}

interface BackendCategory {
  uuid?: string;
  slug?: string;
  name: string;
  description?: string | null;
  is_active?: boolean;
}

export function useCategories() {
  const [categories, setCategories] = useState<CategoryItem[]>(() =>
    CATEGORY_DETAILS.map((c) => ({
      id: c.id,
      slug: c.id,
      label: c.label,
      description: c.description,
    })),
  );
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setRefreshKey((k) => k + 1);
    window.addEventListener("categories-updated", handleUpdate);
    window.addEventListener("focus", handleUpdate);
    const unsub1 = websocketService.on("categories_updated", handleUpdate);
    const unsub2 = websocketService.on("category_updated", handleUpdate);
    return () => {
      window.removeEventListener("categories-updated", handleUpdate);
      window.removeEventListener("focus", handleUpdate);
      unsub1();
      unsub2();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchCategories() {
      try {
        const res = await api.get("/ecommerce/categories");
        const items = res.data?.data;
        if (Array.isArray(items) && !cancelled) {
          const mapped: CategoryItem[] = (items as BackendCategory[])
            .filter((cat) => cat.is_active !== false)
            .map((cat) => {
              const categoryId = cat.slug || cat.uuid || "uncategorized";
              return {
                id: categoryId,
                uuid: cat.uuid,
                slug: categoryId,
                label: cat.name,
                description: cat.description || "",
              };
            });
          setCategories(mapped);
        }
      } catch {
        // Fallback to static CATEGORY_DETAILS
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCategories();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return { categories, loading };
}

export function useProductFilterOptions({
  search = "",
  category,
  categoryUuid,
  status,
}: UseProductFilterOptions = {}) {
  const [filterOptions, setFilterOptions] =
    useState<ProductFilterOptions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function fetchFilterOptions() {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search.trim()) params.search = search.trim();
      if (category?.trim()) params.category = category.trim();
      if (categoryUuid?.trim()) params.category_uuid = categoryUuid.trim();
      if (status?.trim()) params.status = status.trim();

      try {
        const response = await api.get<{ data?: ProductFilterOptions }>(
          "/ecommerce/products/filters",
          { params, signal: controller.signal },
        );
        if (!cancelled && response.data?.data) {
          setFilterOptions(response.data.data);
        }
      } catch (error) {
        if ((error as { name?: string })?.name !== "CanceledError") {
          console.warn("Failed to load product filter options:", error);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchFilterOptions();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [search, category, categoryUuid, status]);

  return { filterOptions, loading };
}

export function usePaginatedProducts({
  page = 1,
  limit = 6,
  search = "",
  category,
  categoryUuid,
  minPrice,
  maxPrice,
  discountOnly = false,
}: UsePaginatedProductsOptions = {}): UsePaginatedProductsResult {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(page);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setRefreshKey((k) => k + 1);
    window.addEventListener("products-updated", handleUpdate);
    window.addEventListener("categories-updated", handleUpdate);
    window.addEventListener("focus", handleUpdate);
    const unsub = websocketService.on("products_updated", handleUpdate);
    return () => {
      window.removeEventListener("products-updated", handleUpdate);
      window.removeEventListener("categories-updated", handleUpdate);
      window.removeEventListener("focus", handleUpdate);
      unsub();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function fetchProducts() {
      try {
        const params: Record<string, string | number | boolean> = {
          page,
          limit,
        };
        if (search && search.trim()) {
          params.search = search.trim();
        }
        if (typeof minPrice === "number" && minPrice >= 0) {
          params.min_price = minPrice;
        }
        if (typeof maxPrice === "number" && maxPrice >= 0) {
          params.max_price = maxPrice;
        }
        if (categoryUuid && categoryUuid.trim()) {
          params.category_uuid = categoryUuid.trim();
        }
        if (discountOnly) {
          params.discount_only = true;
        }

        const res = await api.get("/ecommerce/products", {
          params,
          signal: controller.signal,
        });
        const data = res.data;
        const items = data?.data;
        const meta = data?.meta;

        if (!cancelled && Array.isArray(items)) {
          const backendItems = items.map(mapBackendToProduct);
          const serverTotal = Number(meta?.total ?? backendItems.length);
          const serverPages = Number(
            meta?.total_pages ?? Math.max(1, Math.ceil(serverTotal / limit)),
          );
          const serverCurrent = Number(meta?.current_page ?? page);

          setProducts(backendItems);
          setTotal(serverTotal);
          setTotalPages(serverPages);
          setCurrentPage(serverCurrent);
          setLoading(false);
          return;
        }
      } catch (err: unknown) {
        if ((err as { name?: string })?.name === "CanceledError") {
          return;
        }
        // Fallback to static PRODUCTS
      }

      if (!cancelled) {
        let filtered = PRODUCTS;
        if (search && search.trim()) {
          const q = search.trim().toLowerCase();
          filtered = filtered.filter((p) => p.name.toLowerCase().includes(q));
        }
        if (category && category.trim()) {
          const catTerms = category
            .split(",")
            .map((c) => c.trim().toLowerCase())
            .filter(Boolean);
          if (catTerms.length > 0) {
            filtered = filtered.filter((p) =>
              catTerms.includes((p.categoryId ?? "").toLowerCase()),
            );
          }
        }
        if (discountOnly) {
          filtered = filtered.filter(
            (p) => getDiscountPercent(p) !== undefined,
          );
        }
        if (typeof minPrice === "number" && minPrice >= 0) {
          filtered = filtered.filter((p) => p.basePrice >= minPrice);
        }
        if (typeof maxPrice === "number" && maxPrice >= 0) {
          filtered = filtered.filter((p) => p.basePrice <= maxPrice);
        }

        const fallbackTotal = filtered.length;
        const fallbackPages = Math.max(1, Math.ceil(fallbackTotal / limit));
        const safePage = Math.min(Math.max(1, page), fallbackPages);
        const sliced = filtered.slice((safePage - 1) * limit, safePage * limit);

        setProducts(sliced);
        setTotal(fallbackTotal);
        setTotalPages(fallbackPages);
        setCurrentPage(safePage);
        setLoading(false);
      }
    }

    fetchProducts();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [
    page,
    limit,
    search,
    category,
    categoryUuid,
    minPrice,
    maxPrice,
    discountOnly,
    refreshKey,
  ]);

  return { products, total, totalPages, currentPage, loading };
}
