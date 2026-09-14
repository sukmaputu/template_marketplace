export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
}

export interface BackendCategory {
  uuid?: string;
  id?: string;
  name: string;
  slug?: string;
  description?: string | null;
  is_active?: boolean;
}

export interface BackendProductImage {
  id?: string;
  uuid?: string;
  product_uuid?: string;
  image_url?: string;
  url?: string;
  sort_order?: number;
}

export interface BackendProductVariant {
  id?: string;
  uuid?: string;
  name?: string;
  variant_name?: string;
  variant_sku?: string | null;
  stock?: number | null;
  price_delta?: number | null;
  override_price?: number | null;
  is_active?: boolean;
}

export interface BackendProduct {
  id?: string | number;
  uuid?: string;
  name: string;
  type?: string;
  base_price?: number | string;
  price?: number | string;
  compare_price?: number | string | null;
  original_price?: number | string | null;
  description?: string;
  summary?: string | null;
  image?: string;
  cover_image_url?: string | null;
  images?: (BackendProductImage | string)[];
  variants?: BackendProductVariant[];
  category?: BackendCategory;
  category_id?: string;
  category_uuid?: string;
  average_rating?: number | string;
  rating_count?: number;
  review_count?: number;
  stock?: number;
  discounts?: BackendProductDiscount[];
  is_featured?: boolean;
  status?: string;
}

export interface BackendProductDiscount {
  uuid?: string;
  id?: string;
  product_uuid?: string;
  variant_uuid?: string | null;
  discount_type: "percentage" | "nominal";
  discount: number;
}

export interface BackendAccount {
  id?: string;
  uuid?: string;
  full_name?: string;
  username?: string;
  email?: string;
  phone?: string;
  created_at?: string;
}

export interface BackendReview {
  id?: string;
  uuid?: string;
  product_uuid?: string;
  order_item_uuid?: string;
  account?: BackendAccount;
  rating: number;
  comment?: string;
  created_at?: string;
}

export interface BackendOrderItem {
  id?: string;
  uuid?: string;
  order_uuid?: string;
  product_uuid?: string;
  variant_uuid?: string;
  product_name_snapshot?: string;
  variant_name_snapshot?: string;
  price?: number | string;
  quantity?: number;
  line_total?: number | string;
  product?: {
    name?: string;
    cover_image_url?: string;
    images?: { image_url?: string }[];
  };
}

export interface BackendOrder {
  id?: string;
  uuid?: string;
  order_number?: string;
  order_status?: string;
  total?: number;
  grand_total?: number;
  subtotal?: number;
  shipping_cost?: number;
  service_fee?: number;
  created_at: string;
  shipping_courier?: string;
  shipping_method_id?: string;
  tracking_number?: string;
  recipient_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  shipping_province?: string;
  postal_code?: string;
  order_items?: BackendOrderItem[];
}

export interface BackendChatAttachment {
  uuid?: string;
  id?: string;
  chat_message_uuid?: string;
  type: "product" | "image";
  value: string;
  metadata?: Record<string, unknown>;
}

export interface BackendChatMessage {
  uuid?: string;
  id?: string;
  conversation_uuid: string;
  sender_user_id?: string;
  sender_role: "customer" | "agent" | "admin" | "bot";
  message: string;
  attachments?: BackendChatAttachment[];
  is_read?: boolean;
  created_at?: string;
}

export interface BackendAuthData {
  token?: string;
  access_token?: string;
  akun?: BackendAccount;
}
