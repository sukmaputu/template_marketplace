import { resolveAssetUrl } from "@/hooks/usePageSettings";
import type { Product, ProductRow, ProductVariant } from "./productTypes";

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
        options: variant.options,
      })),
    rating: row.average_rating,
    reviewCount: row.review_count,
    categoryId: row.category_id,
  };
}

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
      options: variant.options,
    })),
  };
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
  options?: Record<string, string>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapBackendToProduct(p: any): Product {
  const basePrice = Number(p.price ?? p.original_price ?? 0);
  const comparePrice =
    p.original_price && Number(p.original_price) > basePrice
      ? Number(p.original_price)
      : undefined;

  const rawImg = p.image || p.cover_image_url || undefined;
  const img = rawImg ? resolveAssetUrl(rawImg) : undefined;

  let allImages: string[] = [];
  if (Array.isArray(p.images) && p.images.length > 0) {
    allImages = (p.images as Array<
      string | { image_url?: string; url?: string }
    >)
      .map((item) => {
        const u =
          typeof item === "string" ? item : item.image_url || item.url;
        return u ? resolveAssetUrl(u) : "";
      })
      .filter(Boolean);
  }
  if (allImages.length === 0 && img) {
    allImages = [img];
  }

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
          options:
            v.options && typeof v.options === "object"
              ? v.options
              : undefined,
        }))
    : undefined;

  return {
    id: p.uuid || String(p.id),
    sku: p.sku || undefined,
    name: p.name,
    description: p.description || p.summary || undefined,
    image: img,
    images: allImages,
    type: p.type === "digital" || p.type === "service" ? p.type : "physical",
    basePrice,
    comparePrice,
    stock: p.stock ?? 0,
    variants,
    variantOptions: Array.isArray(p.variant_options)
      ? p.variant_options
      : undefined,
    // Pemetaan spesifikasi ganda (mendukung GORM `specifications` dan flat `specs`)
    specs: (() => {
      if (Array.isArray(p.specifications) && p.specifications.length > 0) {
        return p.specifications
          .map((s: any) => {
            const val =
              Array.isArray(s.values) && s.values.length > 0
                ? s.values[0].value || s.values[0].name || ""
                : s.spec_value || s.value || "";
            return {
              label: s.name || s.spec_name || "",
              value: String(val),
            };
          })
          .filter((s: { label: string; value: string }) => s.label && s.value);
      }
      if (Array.isArray(p.specs) && p.specs.length > 0) {
        return p.specs
          .map((s: any) => ({
            label: s.spec_name || s.name || "",
            value: String(s.spec_value || s.value || ""),
          }))
          .filter((s: { label: string; value: string }) => s.label && s.value);
      }
      return undefined;
    })(),
    rating: Number(p.average_rating || 0),
    reviewCount: Number(p.rating_count || p.review_count || 0),
    categoryId: p.category?.slug || p.category_uuid || "teknologi-informasi",
    categoryName: p.category?.name,
    categorySlug: p.category?.slug,
  };
}
