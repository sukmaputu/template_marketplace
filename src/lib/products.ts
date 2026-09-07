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
  variantName: string;
  stock?: number;
  overridePrice?: number;
  priceDelta?: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  image?: string;
  images?: string[];
  type: ProductType;
  basePrice: number;
  comparePrice?: number;
  stock?: number;
  variants?: ProductVariant[];
  rating?: number;
  reviewCount?: number;
  categoryId?: string;
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
];
