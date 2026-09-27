import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export type ProductType = "physical" | "digital" | "service";

export type ProductStatus = "draft" | "published" | "archived";

export interface ProductCategoryRow {
  id: string;
  parent_id?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface ProductImageRow {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
  created_at?: string;
}

export interface ProductSpecRow {
  id: string;
  product_id: string;
  spec_name: string;
  spec_value: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProductVariantRow {
  id: string;
  product_id: string;
  variant_sku?: string | null;
  variant_name: string;
  price_delta?: number | null;
  override_price?: number | null;
  stock?: number | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductRow {
  id: string;
  category_id: string;
  type: ProductType;
  sku?: string | null;
  name: string;
  slug?: string | null;
  summary?: string | null;
  description?: string | null;
  cover_image_url?: string | null;
  base_price: number;
  compare_price?: number | null;
  stock?: number | null;
  is_featured: boolean;
  status: ProductStatus;
  average_rating: number;
  review_count: number;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  images?: ProductImageRow[];
  specs?: ProductSpecRow[];
  variants?: ProductVariantRow[];
}

export interface ProductVariant {
  id: string;
  sku?: string; // BARU: variant_sku dari backend
  variantName: string;
  stock?: number;
  overridePrice?: number;
  priceDelta?: number;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  sku?: string; // BARU: sku produk dari backend (dipakai sebagai kunci spesifikasi hardcode)
  name: string;
  description?: string;
  image?: string;
  images?: string[];
  type: ProductType;
  basePrice: number;
  comparePrice?: number;
  stock?: number;
  variants?: ProductVariant[];
  specs?: ProductSpec[];
  rating?: number;
  reviewCount?: number;
  categoryId?: string;
  categoryName?: string;
  categorySlug?: string;
  schedules?: string[];
  levels?: string[];
}

export interface ProductReview {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

const PRODUCT_REVIEW_STORAGE_KEY = "marketplace-product-reviews";

const MOCK_PRODUCT_REVIEWS: ProductReview[] = [
  {
    id: "mock-review-1",
    productId: "3",
    userName: "Nadia",
    rating: 5,
    comment: "Materi jelas, tutor responsif, dan gampang dipahami.",
    createdAt: "2026-08-10T09:00:00.000Z",
  },
  {
    id: "mock-review-2",
    productId: "3",
    userName: "Andre",
    rating: 4,
    comment: "Kontennya cukup lengkap untuk pemula, cocok untuk belajar dasar.",
    createdAt: "2026-08-12T12:30:00.000Z",
  },
  {
    id: "mock-review-3",
    productId: "1",
    userName: "Rina",
    rating: 5,
    comment:
      "Desainnya menarik dan praktiknya sangat membantu untuk proyek saya.",
    createdAt: "2026-08-15T08:20:00.000Z",
  },
  {
    id: "mock-review-4",
    productId: "2",
    userName: "Bima",
    rating: 4,
    comment:
      "Dashboard Power BI yang diajarkan cukup aplikatif dan masuk akal.",
    createdAt: "2026-08-18T11:45:00.000Z",
  },
];

export function getStoredProductReviews(): ProductReview[] {
  if (typeof window === "undefined") return MOCK_PRODUCT_REVIEWS;

  try {
    const raw = window.localStorage.getItem(PRODUCT_REVIEW_STORAGE_KEY);
    if (!raw) return MOCK_PRODUCT_REVIEWS;

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return MOCK_PRODUCT_REVIEWS;

    return parsed as ProductReview[];
  } catch {
    return MOCK_PRODUCT_REVIEWS;
  }
}

export function saveProductReview(review: ProductReview) {
  if (typeof window === "undefined") return;

  const reviews = getStoredProductReviews();
  const nextReviews = [
    review,
    ...reviews.filter((item) => item.id !== review.id),
  ];
  window.localStorage.setItem(
    PRODUCT_REVIEW_STORAGE_KEY,
    JSON.stringify(nextReviews),
  );
  window.dispatchEvent(new Event("product-reviews-updated"));
}

export function getProductReviews(productId: string): ProductReview[] {
  return getStoredProductReviews().filter(
    (review) => review.productId === productId,
  );
}

export function getProductRatingStats(productId: string) {
  const reviews = getProductReviews(productId);

  if (!reviews.length) {
    const fallbackProduct = PRODUCTS.find(
      (product) => product.id === productId,
    );
    return {
      rating: fallbackProduct?.rating ?? 0,
      reviewCount: fallbackProduct?.reviewCount ?? 0,
    };
  }

  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return {
    rating: Number((total / reviews.length).toFixed(1)),
    reviewCount: reviews.length,
  };
}

export function mapProductRow(row: ProductRow): Product {
  return {
    id: row.id,
    sku: row.sku ?? undefined,
    name: row.name,
    description: row.description ?? row.summary ?? undefined,
    image: row.cover_image_url ?? row.images?.[0]?.image_url ?? undefined,
    images: row.images
      ?.slice()
      .sort((first, second) => first.sort_order - second.sort_order)
      .map((image) => image.image_url),
    type: row.type,
    basePrice: row.base_price,
    comparePrice: row.compare_price ?? undefined,
    stock: row.stock ?? undefined,
    variants: row.variants
      ?.filter((variant) => variant.is_active)
      .map((variant) => ({
        id: variant.id,
        sku: variant.variant_sku ?? undefined,
        variantName: variant.variant_name,
        stock: variant.stock ?? undefined,
        overridePrice: variant.override_price ?? undefined,
        priceDelta: variant.price_delta ?? undefined,
      })),
    rating: row.average_rating,
    reviewCount: row.review_count,
    categoryId: row.category_id,
  };
}

export function getVariantPrice(
  product: Product,
  variant?: ProductVariant,
): number {
  if (!variant) return product.basePrice;
  if (variant.overridePrice !== undefined) return variant.overridePrice;
  if (variant.priceDelta !== undefined)
    return product.basePrice + variant.priceDelta;
  return product.basePrice;
}

export function getDiscountPercent(product: Product): number | undefined {
  if (!product.comparePrice || product.comparePrice <= product.basePrice) {
    return undefined;
  }
  return Math.round(
    ((product.comparePrice - product.basePrice) / product.comparePrice) * 100,
  );
}

const PRODUCT_SEEDS: Product[] = [
  {
    id: "1",
    name: "Pelatihan Desain Grafis",
    description:
      "Belajar dasar hingga mahir desain grafis untuk kebutuhan branding, sosial media, dan promosi bisnis.",
    image: "/products/desin.jpg",
    images: [
      "/products/desin.jpg",
      "/products/data.jpg",
      "/products/desin.jpg",
    ],
    type: "digital",
    basePrice: 50000,
    comparePrice: 100000,
    stock: 18,
    rating: 0,
    reviewCount: 0,
    categoryId: "teknologi-informasi",
  },
  {
    id: "2",
    name: "Pelatihan Power BI Data Analyst",
    description:
      "Kuasai analisis data dan visualisasi dashboard menggunakan Power BI dari dasar sampai studi kasus nyata.",
    image: "/products/data.jpg",
    images: ["/products/data.jpg", "/products/desin.jpg"],
    type: "digital",
    basePrice: 100000,
    stock: 24,
    rating: 0,
    reviewCount: 0,
    categoryId: "teknologi-informasi",
  },
  {
    id: "3",
    name: "Kelas UI/UX Design Sprint",
    description:
      "Bangun design system, wireframe, dan prototipe interaktif untuk produk digital modern.",
    image: "/products/data.jpg",
    images: ["/products/data.jpg", "/products/desin.jpg", "/products/data.jpg"],
    type: "digital",
    basePrice: 120000,
    comparePrice: 150000,
    stock: 4,
    rating: 4,
    reviewCount: 14,
    categoryId: "teknologi-informasi",
  },

  {
    id: "4",
    name: "Manajemen Pajak",
    description:
      "Pahami dasar perpajakan bisnis, perhitungan, dan pelaporan pajak yang benar sesuai regulasi terbaru.",
    image: "/products/data.jpg",
    type: "digital",
    basePrice: 90000,
    comparePrice: 120000,
    stock: 32,
    rating: 0,
    reviewCount: 0,
    categoryId: "keuangan",
  },
  {
    id: "5",
    name: "RAB (Rencana Anggaran Biaya)",
    description:
      "Belajar menyusun rencana anggaran biaya proyek secara akurat, dari estimasi hingga kontrol anggaran.",
    image: "/products/data.jpg",
    type: "digital",
    basePrice: 110000,
    stock: 3,
    rating: 0,
    reviewCount: 0,
    categoryId: "keuangan",
  },
  {
    id: "6",
    name: "Akuntansi Dasar untuk Bisnis",
    description:
      "Kuasai pencatatan transaksi, neraca, dan laporan laba rugi untuk kebutuhan bisnis kecil-menengah.",
    image: "/products/data.jpg",
    type: "digital",
    basePrice: 85000,
    comparePrice: 100000,
    stock: 27,
    rating: 0,
    reviewCount: 0,
    categoryId: "keuangan",
  },
  {
    id: "7",
    name: "Perencanaan Keuangan Pribadi",
    description:
      "Strategi mengatur pemasukan, tabungan, investasi, dan dana darurat untuk keuangan pribadi yang sehat.",
    image: "/products/data.jpg",
    type: "digital",
    basePrice: 75000,
    stock: 2,
    rating: 0,
    reviewCount: 0,
    categoryId: "keuangan",
  },
  {
    id: "8",
    name: "Analisis Laporan Keuangan",
    description:
      "Belajar membaca dan menganalisis laporan keuangan perusahaan untuk pengambilan keputusan bisnis.",
    image: "/products/data.jpg",
    type: "digital",
    basePrice: 130000,
    comparePrice: 160000,
    stock: 40,
    rating: 0,
    reviewCount: 0,
    categoryId: "keuangan",
  },

  {
    id: "9",
    name: "Manajemen Asuransi",
    description:
      "Pelajari prinsip dasar manajemen risiko dan pengelolaan produk asuransi secara menyeluruh.",
    image: "/products/desin.jpg",
    type: "digital",
    basePrice: 95000,
    stock: 5,
    rating: 0,
    reviewCount: 0,
    categoryId: "asuransi",
  },
  {
    id: "10",
    name: "Dasar-Dasar Underwriting Asuransi",
    description:
      "Pahami proses penilaian risiko dan penentuan premi dalam industri asuransi.",
    image: "/products/desin.jpg",
    type: "digital",
    basePrice: 105000,
    comparePrice: 130000,
    stock: 21,
    rating: 0,
    reviewCount: 0,
    categoryId: "asuransi",
  },
  {
    id: "11",
    name: "Klaim dan Penanganan Asuransi",
    description:
      "Kuasai alur proses klaim, verifikasi, hingga penyelesaian klaim asuransi secara profesional.",
    image: "/products/desin.jpg",
    type: "digital",
    basePrice: 88000,
    stock: 4,
    rating: 0,
    reviewCount: 0,
    categoryId: "asuransi",
  },
  {
    id: "12",
    name: "Perencanaan Asuransi Jiwa & Kesehatan",
    description:
      "Strategi memilih dan merencanakan proteksi asuransi jiwa dan kesehatan sesuai kebutuhan.",
    image: "/products/desin.jpg",
    type: "digital",
    basePrice: 99000,
    comparePrice: 115000,
    stock: 16,
    rating: 0,
    reviewCount: 0,
    categoryId: "asuransi",
  },

  {
    id: "13",
    name: "Gambar Teknik",
    description:
      "Belajar membaca dan membuat gambar teknik mesin sesuai standar industri.",
    image: "/products/data.jpg",
    type: "digital",
    basePrice: 115000,
    stock: 1,
    rating: 0,
    reviewCount: 0,
    categoryId: "teknologi-mesin",
  },
  {
    id: "14",
    name: "Dasar Mekanika Mesin",
    description:
      "Pahami prinsip kerja mesin, gaya, dan sistem mekanik dasar untuk aplikasi industri.",
    image: "/products/data.jpg",
    type: "digital",
    basePrice: 100000,
    comparePrice: 125000,
    stock: 29,
    rating: 0,
    reviewCount: 0,
    categoryId: "teknologi-mesin",
  },
  {
    id: "15",
    name: "Perawatan & Perbaikan Mesin Industri",
    description:
      "Pelajari teknik maintenance preventif dan troubleshooting mesin industri.",
    image: "/products/data.jpg",
    type: "digital",
    basePrice: 140000,
    stock: 5,
    rating: 0,
    reviewCount: 0,
    categoryId: "teknologi-mesin",
  },
  {
    id: "16",
    name: "Pengantar CNC dan Manufaktur",
    description:
      "Kenali dasar pemrograman dan pengoperasian mesin CNC untuk proses manufaktur modern.",
    image: "/products/data.jpg",
    type: "digital",
    basePrice: 150000,
    comparePrice: 180000,
    stock: 33,
    rating: 0,
    reviewCount: 0,
    categoryId: "teknologi-mesin",
  },
];

export function toProductRow(product: Product): ProductRow {
  const productId = product.id;
  const images = product.images ?? (product.image ? [product.image] : []);

  return {
    id: productId,
    category_id: product.categoryId ?? "uncategorized",
    type: product.type,
    sku: `SKU-${productId.padStart(4, "0")}`,
    name: product.name,
    slug: product.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, ""),
    summary: product.description,
    description: product.description,
    cover_image_url: product.image,
    base_price: product.basePrice,
    compare_price: product.comparePrice,
    stock: product.stock ?? 0,
    is_featured: false,
    status: "published",
    average_rating: product.rating ?? 0,
    review_count: product.reviewCount ?? 0,
    images: images.map((imageUrl, index) => ({
      id: `${productId}-image-${index + 1}`,
      product_id: productId,
      image_url: imageUrl,
      sort_order: index,
    })),
    variants: product.variants?.map((variant) => ({
      id: variant.id,
      product_id: productId,
      variant_sku: variant.sku,
      variant_name: variant.variantName,
      price_delta: variant.priceDelta,
      override_price: variant.overridePrice,
      stock: variant.stock,
      is_active: true,
    })),
  };
}

export const PRODUCT_ROWS: ProductRow[] = PRODUCT_SEEDS.map(toProductRow);
export const PRODUCTS: Product[] = PRODUCT_ROWS.map(mapProductRow);

export const CATEGORY_DETAILS = [
  {
    id: "teknologi-informasi",
    label: "Teknologi Informasi",
    description:
      "Koleksi kelas dan pelatihan digital populer untuk skill Anda.",
  },
  {
    id: "keuangan",
    label: "Keuangan",
    description:
      "Kelas seputar manajemen keuangan, pajak, dan perencanaan anggaran.",
  },
  {
    id: "asuransi",
    label: "Asuransi",
    description:
      "Pelatihan manajemen risiko dan produk asuransi untuk kebutuhan profesional.",
  },
  {
    id: "teknologi-mesin",
    label: "Teknologi Mesin",
    description:
      "Kelas teknik mesin, gambar teknik, hingga manufaktur dan CNC.",
  },
  {
    id: "electronics",
    label: "Electronics",
    description:
      "Audio devices, smart gadgets, keyboards, and modern workstation gear.",
  },
  {
    id: "apparel",
    label: "Apparel",
    description:
      "Premium clothing, everyday streetwear, tees, hoodies, and lifestyle fashion.",
  },
  {
    id: "home-living",
    label: "Home & Living",
    description:
      "Modern home decor, lighting, cookware, bedding sets, and living essentials.",
  },
  {
    id: "accessories",
    label: "Accessories",
    description:
      "Everyday carry essentials, backpacks, aviator sunglasses, and leather totes.",
  },
  {
    id: "outdoors",
    label: "Outdoors",
    description:
      "Camping tents, insulated steel bottles, rechargeable lanterns, and adventure equipment.",
  },
];

export const POPULAR_SEARCH_TERMS = [
  "desain grafis",
  "power bi",
  "ui/ux",
  "pajak",
  "asuransi",
  "cnc",
  "akuntansi",
];

const RECENTLY_VIEWED_STORAGE_KEY = "marketplace-recently-viewed";
const RECENTLY_VIEWED_PRODUCTS_STORAGE_KEY =
  "marketplace-recently-viewed-products";
const MAX_RECENTLY_VIEWED = 4;

export function getRecentlyViewedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export function addRecentlyViewedProduct(product: Product) {
  if (typeof window === "undefined") return;
  const ids = getRecentlyViewedIds().filter((id) => id !== product.id);
  ids.unshift(product.id);
  window.localStorage.setItem(
    RECENTLY_VIEWED_STORAGE_KEY,
    JSON.stringify(ids.slice(0, MAX_RECENTLY_VIEWED)),
  );

  let storedProducts: Product[] = [];
  try {
    const raw = window.localStorage.getItem(
      RECENTLY_VIEWED_PRODUCTS_STORAGE_KEY,
    );
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    if (Array.isArray(parsed)) storedProducts = parsed as Product[];
  } catch {
    storedProducts = [];
  }

  window.localStorage.setItem(
    RECENTLY_VIEWED_PRODUCTS_STORAGE_KEY,
    JSON.stringify(
      [
        product,
        ...storedProducts.filter((item) => item.id !== product.id),
      ].slice(0, MAX_RECENTLY_VIEWED),
    ),
  );
  window.dispatchEvent(new Event("recently-viewed-updated"));
}

export function getRecentlyViewedProducts(
  limit = MAX_RECENTLY_VIEWED,
): Product[] {
  let storedProducts: Product[] = [];
  try {
    const raw = window.localStorage.getItem(
      RECENTLY_VIEWED_PRODUCTS_STORAGE_KEY,
    );
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    if (Array.isArray(parsed)) storedProducts = parsed as Product[];
  } catch {
    storedProducts = [];
  }

  const storedProductsById = new Map(
    storedProducts.map((product) => [product.id, product]),
  );
  return getRecentlyViewedIds()
    .map(
      (id) =>
        storedProductsById.get(id) ??
        PRODUCTS.find((product) => product.id === id),
    )
    .filter((product): product is Product => Boolean(product))
    .slice(0, limit);
}

// BARU: bentuk varian dari response backend
interface BackendVariant {
  uuid?: string;
  id?: string | number;
  variant_sku?: string | null;
  variant_name: string;
  price_delta?: number | null;
  override_price?: number | null;
  stock?: number | null;
  is_active?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapBackendToProduct(p: any): Product {
  const basePrice = Number(p.price ?? p.original_price ?? 0);
  const comparePrice =
    p.original_price && Number(p.original_price) > basePrice
      ? Number(p.original_price)
      : undefined;
  const img = p.image || p.cover_image_url || undefined;

  // BARU: petakan varian aktif dari backend
  const variants: ProductVariant[] | undefined = Array.isArray(p.variants)
    ? (p.variants as BackendVariant[])
        .filter((v) => v.is_active !== false)
        .map((v) => ({
          id: v.uuid || String(v.id),
          sku: v.variant_sku || undefined,
          variantName: v.variant_name,
          stock: v.stock ?? undefined,
          overridePrice: v.override_price ?? undefined,
          priceDelta: v.price_delta ?? undefined,
        }))
    : undefined;

  return {
    id: p.uuid || String(p.id),
    sku: p.sku || undefined,
    name: p.name,
    description: p.description || p.summary || undefined,
    image: img,
    images: img ? [img] : [],
    type: p.type === "digital" || p.type === "service" ? p.type : "physical",
    basePrice,
    comparePrice,
    stock: p.stock ?? 0,
    variants,
    // BARU: kalau backend suatu saat mengirim `specs`, otomatis dipakai
    specs: Array.isArray(p.specs)
      ? p.specs.map((s: { spec_name: string; spec_value: string }) => ({
          label: s.spec_name,
          value: s.spec_value,
        }))
      : undefined,
    rating: Number(p.average_rating || 0),
    reviewCount: Number(p.rating_count || p.review_count || 0),
    categoryId: p.category?.slug || p.category_uuid || "teknologi-informasi",
    categoryName: p.category?.name,
    categorySlug: p.category?.slug,
  };
}

export function useMarketplaceProducts(limit = 6) {
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setRefreshKey((k) => k + 1);
    window.addEventListener("products-updated", handleUpdate);
    return () => window.removeEventListener("products-updated", handleUpdate);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchProducts() {
      try {
        const res = await api.get("/ecommerce/products", {
          params: { limit },
        });
        const items = res.data?.data;
        if (Array.isArray(items) && items.length > 0 && !cancelled) {
          const backendItems = items.map(mapBackendToProduct);
          const backendIdSet = new Set(backendItems.map((b) => b.id));
          const combined = [
            ...backendItems,
            ...PRODUCTS.filter((p) => !backendIdSet.has(p.id)),
          ];
          setProducts(combined);
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

export interface CategoryItem {
  id: string;
  uuid?: string;
  label: string;
  slug: string;
  description?: string;
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

  useEffect(() => {
    let cancelled = false;

    async function fetchCategories() {
      try {
        const res = await api.get("/ecommerce/categories");
        const items = res.data?.data;
        if (Array.isArray(items) && items.length > 0 && !cancelled) {
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
  }, []);

  return { categories, loading };
}

export interface UsePaginatedProductsOptions {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  discountOnly?: boolean;
}

export interface UsePaginatedProductsResult {
  products: Product[];
  total: number;
  totalPages: number;
  currentPage: number;
  loading: boolean;
}

export function usePaginatedProducts({
  page = 1,
  limit = 6,
  search = "",
  category,
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
    return () => window.removeEventListener("products-updated", handleUpdate);
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
        if (typeof minPrice === "number" && minPrice > 0) {
          params.min_price = minPrice;
        }
        if (typeof maxPrice === "number" && maxPrice > 0) {
          params.max_price = maxPrice;
        }
        if (category && category.trim()) {
          params.category = category.trim();
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
        if (typeof minPrice === "number" && minPrice > 0) {
          filtered = filtered.filter((p) => p.basePrice >= minPrice);
        }
        if (typeof maxPrice === "number" && maxPrice > 0) {
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
  }, [page, limit, search, category, minPrice, maxPrice, discountOnly, refreshKey]);

  return { products, total, totalPages, currentPage, loading };
}
