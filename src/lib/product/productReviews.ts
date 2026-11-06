import { api } from "@/lib/api";
import { PRODUCTS } from "./productData";
import type { ProductReview } from "./productTypes";

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

export async function fetchProductReviews(
  productId: string,
  params?: {
    page?: number;
    limit?: number;
    rating?: number;
    sort?: string;
  },
): Promise<{
  items: ProductReview[];
  total: number;
  stats?: {
    average_rating?: number;
    total_reviews?: number;
    distribution?: Record<string, number>;
    percentages?: Record<string, number>;
  };
}> {
  try {
    const res = await api.get<{
      success: boolean;
      data?: Array<{
        uuid?: string;
        id?: string;
        product_uuid?: string;
        product_id?: string;
        order_item_uuid?: string;
        rating: number;
        comment: string;
        image_urls?: string[];
        is_verified_purchase?: boolean;
        author?: { name?: string; username?: string };
        account?: { full_name?: string; username?: string };
        created_at: string;
      }>;
      meta?: {
        total?: number;
        stats?: {
          average_rating?: number;
          total_reviews?: number;
          distribution?: Record<string, number>;
          percentages?: Record<string, number>;
        };
      };
    }>(`/ecommerce/products/${productId}/reviews`, { params });

    const rawItems = res.data?.data || [];
    const items: ProductReview[] = rawItems.map((item) => {
      const authorName =
        item.author?.name ||
        item.author?.username ||
        item.account?.full_name ||
        item.account?.username ||
        "Pelanggan";

      return {
        id: item.uuid || item.id || `rev-${Date.now()}`,
        productId: item.product_uuid || item.product_id || productId,
        orderItemUuid: item.order_item_uuid,
        userName: authorName,
        rating: Number(item.rating) || 5,
        comment: item.comment || "",
        createdAt: item.created_at || new Date().toISOString(),
        isVerified: Boolean(item.is_verified_purchase || item.order_item_uuid),
        imageUrls: item.image_urls || [],
      };
    });

    return {
      items,
      total: res.data?.meta?.total ?? items.length,
      stats: res.data?.meta?.stats,
    };
  } catch {
    const local = getProductReviews(productId);
    return { items: local, total: local.length };
  }
}

export async function submitProductReview(
  productId: string,
  payload: {
    rating: number;
    comment: string;
    order_item_uuid?: string;
    image_urls?: string[];
  },
) {
  const res = await api.post(
    `/ecommerce/products/${encodeURIComponent(productId)}/reviews`,
    payload,
  );
  return res.data?.data;
}
