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

const productsCache = new Map<number, { data: Product[]; timestamp: number }>();
const PRODUCTS_CACHE_TTL_MS = 15_000;
const inflightProductsPromises = new Map<number, Promise<Product[]>>();

export function invalidateProductsCache(): void {
  productsCache.clear();
}

export async function fetchMarketplaceProducts(
  limit = 6,
  forceRefresh = false,
): Promise<Product[]> {
  const cached = productsCache.get(limit);
  if (
    !forceRefresh &&
    cached &&
    Date.now() - cached.timestamp < PRODUCTS_CACHE_TTL_MS
  ) {
    return cached.data;
  }

  const existingInflight = inflightProductsPromises.get(limit);
  if (existingInflight) return existingInflight;

  const request = (async () => {
    try {
      const response = await api.get("/ecommerce/products", {
        params: { limit },
      });
      const items = response.data?.data;
      if (Array.isArray(items)) {
        const products = items.map(mapBackendToProduct);
        productsCache.set(limit, { data: products, timestamp: Date.now() });
        return products;
      }
    } catch {
      // Use cached or bundled products when the catalog request fails.
    } finally {
      inflightProductsPromises.delete(limit);
    }

    return cached?.data ?? PRODUCTS;
  })();
  inflightProductsPromises.set(limit, request);
  return request;
}

export function useMarketplaceProducts(limit = 6) {
  const [products, setProducts] = useState<Product[]>(() => {
    return productsCache.get(limit)?.data ?? PRODUCTS;
  });
  const [loading, setLoading] = useState(() => !productsCache.has(limit));
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const handleRemoteUpdate = () => {
      invalidateProductsCache();
      setRefreshKey((key) => key + 1);
    };
    const handleSoftUpdate = () => setRefreshKey((key) => key + 1);

    window.addEventListener("products-updated", handleRemoteUpdate);
    window.addEventListener("categories-updated", handleRemoteUpdate);
    window.addEventListener("focus", handleSoftUpdate);
    const unsub = websocketService.on("products_updated", handleRemoteUpdate);
    return () => {
      window.removeEventListener("products-updated", handleRemoteUpdate);
      window.removeEventListener("categories-updated", handleRemoteUpdate);
      window.removeEventListener("focus", handleSoftUpdate);
      unsub();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      const fetchedProducts = await fetchMarketplaceProducts(limit);
      if (!cancelled) {
        setProducts(fetchedProducts);
        setLoading(false);
      }
    }

    void loadProducts();
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

interface CategoryCache {
  data: CategoryItem[];
  timestamp: number;
}

let categoriesCache: CategoryCache | null = null;
const CATEGORIES_CACHE_TTL_MS = 60_000;
let inflightCategoriesPromise: Promise<CategoryItem[]> | null = null;

export function invalidateCategoriesCache(): void {
  categoriesCache = null;
}

export async function fetchCategoriesCached(
  forceRefresh = false,
): Promise<CategoryItem[]> {
  if (
    !forceRefresh &&
    categoriesCache &&
    Date.now() - categoriesCache.timestamp < CATEGORIES_CACHE_TTL_MS
  ) {
    return categoriesCache.data;
  }
  if (inflightCategoriesPromise) return inflightCategoriesPromise;

  inflightCategoriesPromise = (async () => {
    try {
      const response = await api.get("/ecommerce/categories");
      const items = response.data?.data;
      if (Array.isArray(items)) {
        const categories = (items as BackendCategory[])
          .filter((category) => category.is_active !== false)
          .map((category) => {
            const categoryId =
              category.slug || category.uuid || "uncategorized";
            return {
              id: categoryId,
              uuid: category.uuid,
              slug: categoryId,
              label: category.name,
              description: category.description || "",
            };
          });
        categoriesCache = { data: categories, timestamp: Date.now() };
        return categories;
      }
    } catch {
      // Use cached or bundled categories when the category request fails.
    } finally {
      inflightCategoriesPromise = null;
    }

    return (
      categoriesCache?.data ??
      CATEGORY_DETAILS.map((category) => ({
        id: category.id,
        slug: category.id,
        label: category.label,
        description: category.description,
      }))
    );
  })();
  return inflightCategoriesPromise;
}

export function useCategories() {
  const [categories, setCategories] = useState<CategoryItem[]>(() => {
    return (
      categoriesCache?.data ??
      CATEGORY_DETAILS.map((category) => ({
        id: category.id,
        slug: category.id,
        label: category.label,
        description: category.description,
      }))
    );
  });
  const [loading, setLoading] = useState(() => !categoriesCache);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const handleRemoteUpdate = () => {
      invalidateCategoriesCache();
      setRefreshKey((key) => key + 1);
    };
    const handleSoftUpdate = () => setRefreshKey((key) => key + 1);

    window.addEventListener("categories-updated", handleRemoteUpdate);
    window.addEventListener("focus", handleSoftUpdate);
    const unsub1 = websocketService.on(
      "categories_updated",
      handleRemoteUpdate,
    );
    const unsub2 = websocketService.on("category_updated", handleRemoteUpdate);
    return () => {
      window.removeEventListener("categories-updated", handleRemoteUpdate);
      window.removeEventListener("focus", handleSoftUpdate);
      unsub1();
      unsub2();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      const fetchedCategories = await fetchCategoriesCached();
      if (!cancelled) {
        setCategories(fetchedCategories);
        setLoading(false);
      }
    }

    void loadCategories();
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
