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
  orderItemUuid?: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  isVerified?: boolean;
  imageUrls?: string[];
}

export interface CategoryItem {
  id: string;
  uuid?: string;
  label: string;
  slug: string;
  description?: string;
}

export interface UsePaginatedProductsOptions {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  categoryUuid?: string;
  minPrice?: number;
  maxPrice?: number;
  discountOnly?: boolean;
}

export interface ProductFilterOptions {
  categories: Array<{
    uuid: string;
    name: string;
    slug: string;
    product_count: number;
  }>;
  price_range?: {
    min_price: number;
    max_price: number;
    currency?: string;
  };
  ratings: Array<{
    rating: number;
    label: string;
    count: number;
  }>;
  specifications: Array<{
    name?: string;
    values?: string[];
    [key: string]: unknown;
  }>;
  variants: Array<{
    name: string;
    count: number;
  }>;
  summary: {
    total_products: number;
    in_stock_count: number;
    on_sale_count: number;
    featured_count: number;
  };
  sort_options: Array<{
    label: string;
    value: string;
  }>;
}

export interface UseProductFilterOptions {
  search?: string;
  category?: string;
  categoryUuid?: string;
  status?: string;
}

export interface UsePaginatedProductsResult {
  products: Product[];
  total: number;
  totalPages: number;
  currentPage: number;
  loading: boolean;
}
