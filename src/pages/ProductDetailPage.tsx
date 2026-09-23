import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  X,
  ZoomIn,
  MessageCircle,
  Star,
  Loader2,
} from "lucide-react";
import { MarketplaceHeader } from "@/components/navbar/MarketplaceHeader";
import { MarketplaceFooter } from "@/components/MarketplaceFooter";
import { useCart } from "@/components/cart/useCart";
import {
  PRODUCTS,
  CATEGORY_DETAILS,
  mapBackendToProduct,
  useCategories,
  type Product,
  addRecentlyViewedProduct,
  getVariantPrice,
  getDiscountPercent,
} from "@/lib/products";
import { api } from "@/lib/api";
import { showToast } from "@/lib/toast";
import { ProductCard } from "@/components/ProductCard";
import { useCurrency } from "@/components/navbar/CurrencySwitcher";
import type { WishlistItem } from "@/components/profile/types";
import { getProductRatingStats, getProductReviews } from "@/lib/products";
import { useAuth } from "@/components/auth/AuthContext";
import { getProductSpecs } from "@/lib/productSpecs";

// Khusus produk kelas (bukan barang fisik). Tetap dipertahankan, hanya
// ditampilkan kalau produk BUKAN bertipe "physical".
const DEFAULT_SCHEDULES = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
const DEFAULT_LEVELS = ["Pemula", "Menengah", "Tingkat Lanjut"];
const WISHLIST_STORAGE_KEY = "marketplace-wishlist";
const LOW_STOCK_THRESHOLD = 5;

function getWishlistItems(): WishlistItem[] {
  if (typeof window === "undefined") return [];

  try {
    const saved = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!saved) return [];

    const parsed = JSON.parse(saved) as WishlistItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setWishlistItems(items: WishlistItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
}

export default function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();
  const { isAuthenticated } = useAuth();
  const [isLoginRequiredOpen, setIsLoginRequiredOpen] = useState(false);
  const [backendProduct, setBackendProduct] = useState<Product | null>(null);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);

  useEffect(() => {
    if (!productId) {
      return;
    }

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsFetchingDetail(true);
    api
      .get(`/ecommerce/products/${productId}`)
      .then((res) => {
        const data = res.data?.data;
        if (data && !cancelled) {
          setBackendProduct(mapBackendToProduct(data));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) {
          setIsFetchingDetail(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [productId]);

  const product = useMemo(() => {
    if (backendProduct && backendProduct.id === productId) {
      return backendProduct;
    }
    return PRODUCTS.find((p) => String(p.id) === String(productId)) || null;
  }, [backendProduct, productId]);

  const isLoading = isFetchingDetail && !product;

  useEffect(() => {
    if (product) addRecentlyViewedProduct(product);
  }, [product]);

  const images = useMemo(() => {
    if (product?.images?.length) return product.images;
    if (product?.image) return [product.image];
    return [];
  }, [product]);

  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);
  const [wishlistVersion, setWishlistVersion] = useState(0);
  const [reviewRefreshKey, setReviewRefreshKey] = useState(0);
  const [manualSchedule, setManualSchedule] = useState<string | null>(null);
  const [manualLevel, setManualLevel] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null,
  );

  const [prevProductId, setPrevProductId] = useState(productId);
  if (productId !== prevProductId) {
    setPrevProductId(productId);
    setQuantity(1);
    setCurrentImageIndex(0);
    setManualSchedule(null);
    setManualLevel(null);
    setSelectedVariantId(null);
  }

  const ratingStats = useMemo(() => {
    void reviewRefreshKey;
    return getProductRatingStats(product?.id ?? "");
  }, [product?.id, reviewRefreshKey]);

  const reviews = useMemo(() => {
    void reviewRefreshKey;
    return product ? getProductReviews(product.id).slice(0, 5) : [];
  }, [product, reviewRefreshKey]);

  // Pakai review lokal kalau ada, kalau tidak pakai rating dari backend
  const displayRating =
    ratingStats.reviewCount > 0 ? ratingStats.rating : (product?.rating ?? 0);
  const displayCount =
    ratingStats.reviewCount > 0
      ? ratingStats.reviewCount
      : (product?.reviewCount ?? 0);

  const isInWishlist = useMemo(() => {
    void wishlistVersion;
    if (!product) return false;
    return getWishlistItems().some((item) => item.product.id === product.id);
  }, [product, wishlistVersion]);

  // ---- Opsi khusus produk kelas (disembunyikan untuk barang fisik) ----
  const schedules = product?.schedules?.length
    ? product.schedules
    : DEFAULT_SCHEDULES;
  const levels = product?.levels?.length ? product.levels : DEFAULT_LEVELS;

  const selectedSchedule =
    manualSchedule && schedules.includes(manualSchedule)
      ? manualSchedule
      : (schedules[0] ?? "");

  const selectedLevel =
    manualLevel && levels.includes(manualLevel)
      ? manualLevel
      : (levels[0] ?? "");

  // ---- Opsi khusus barang fisik ----
  const isPhysical = product?.type === "physical";

  const variants = useMemo(() => product?.variants ?? [], [product]);

  // Spesifikasi: pakai data backend kalau suatu saat tersedia,
  // kalau tidak pakai data hardcode di lib/productSpecs.ts
  const specs = useMemo(
    () =>
      product?.specs?.length ? product.specs : getProductSpecs(product?.sku),
    [product],
  );
  const selectedVariant =
    variants.find((v) => v.id === selectedVariantId) ?? variants[0] ?? null;

  const unitPrice = product
    ? getVariantPrice(product, selectedVariant ?? undefined)
    : 0;

  const discountPercent = product ? getDiscountPercent(product) : undefined;

  // Stok mengikuti varian yang dipilih, fallback ke stok produk
  const availableStock = selectedVariant?.stock ?? product?.stock;

  const variantLabel = useMemo(() => {
    if (isPhysical) return selectedVariant?.variantName ?? "Standar";
    const parts = [selectedSchedule, selectedLevel].filter(Boolean);
    return parts.length > 0 ? parts.join(" • ") : "Standar";
  }, [isPhysical, selectedVariant, selectedSchedule, selectedLevel]);

  const [recommendations, setRecommendations] = useState<Product[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function fetchRecommendations() {
      try {
        const res = await api.get("/ecommerce/products", {
          params: { limit: 6 },
        });
        const items = res.data?.data;
        if (Array.isArray(items) && !cancelled) {
          const mapped = items
            .map(mapBackendToProduct)
            .filter((p) => p.id !== productId)
            .slice(0, 4);
          if (mapped.length > 0) {
            setRecommendations(mapped);
            return;
          }
        }
      } catch {
        // Fallback to static PRODUCTS
      }

      if (!cancelled) {
        const fallback = PRODUCTS.filter((p) => p.id !== productId).slice(0, 4);
        setRecommendations(fallback);
      }
    }

    fetchRecommendations();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const { categories } = useCategories();
  const categoryLabel = useMemo(() => {
    if (product?.categoryName) return product.categoryName;
    return (
      categories.find(
        (c) =>
          c.slug === product?.categoryId ||
          c.id === product?.categoryId ||
          c.uuid === product?.categoryId,
      )?.label ||
      CATEGORY_DETAILS.find((c) => c.id === product?.categoryId)?.label
    );
  }, [product, categories]);

  const isOutOfStock = availableStock !== undefined && availableStock <= 0;
  const isLowStock =
    !isOutOfStock &&
    availableStock !== undefined &&
    availableStock <= LOW_STOCK_THRESHOLD;

  const nextImage = useCallback(() => {
    if (!images.length) return;
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback(() => {
    if (!images.length) return;
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (isPreviewOpen) {
          setIsPreviewOpen(false);
          return;
        }
        if (isWishlistModalOpen) {
          setIsWishlistModalOpen(false);
          return;
        }
      }
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [nextImage, prevImage, isPreviewOpen, isWishlistModalOpen]);

  useEffect(() => {
    const handleReviewsUpdate = () => setReviewRefreshKey((prev) => prev + 1);
    window.addEventListener("product-reviews-updated", handleReviewsUpdate);
    return () =>
      window.removeEventListener(
        "product-reviews-updated",
        handleReviewsUpdate,
      );
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [productId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <MarketplaceHeader />
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-text-secondary">
            Memuat produk...
          </p>
        </div>
        <MarketplaceFooter />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <MarketplaceHeader />
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <h1 className="text-xl font-bold text-text">
            Produk tidak ditemukan
          </h1>
          <Link
            to="/"
            className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
            Kembali ke katalog
          </Link>
        </div>
        <MarketplaceFooter />
      </div>
    );
  }

  function handleKeranjang() {
    if (!product || isOutOfStock) return;
    addToCart(product, quantity, variantLabel);
    showToast(`${product.name} added to cart`);
  }

  function handleBeli() {
    if (!product || isOutOfStock) return;
    navigate("/checkout", {
      state: {
        immediateBuy: { product, quantity, variant: variantLabel },
      },
    });
  }

  function handleTanyaAdmin() {
    if (!product) return;
    window.dispatchEvent(
      new CustomEvent("open-chat-widget", {
        detail: {
          product: {
            id: product.id,
            name: product.name,
            image: images[0],
            priceLabel: formatPrice(unitPrice),
          },
        },
      }),
    );
  }

  function handleWishlistClick() {
    if (!isAuthenticated) {
      setIsLoginRequiredOpen(true);
      return;
    }
    setIsWishlistModalOpen(true);
  }

  function confirmWishlist() {
    if (!product) return;

    const existingItems = getWishlistItems();
    const alreadyExists = existingItems.some(
      (item) => item.product.id === product.id,
    );

    if (alreadyExists) {
      setWishlistItems(
        existingItems.filter((item) => item.product.id !== product.id),
      );
      setWishlistVersion((version) => version + 1);
      showToast(`${product.name} dihapus dari wishlist`);
      setIsWishlistModalOpen(false);
      return;
    }

    const nextItems: WishlistItem[] = [
      {
        id: `wishlist-${product.id}`,
        product,
        added_at: new Date().toISOString(),
      },
      ...existingItems,
    ];

    setWishlistItems(nextItems);
    setWishlistVersion((version) => version + 1);
    showToast(`${product.name} ditambahkan ke wishlist`);
    setIsWishlistModalOpen(false);
  }

  function cancelWishlist() {
    setIsWishlistModalOpen(false);
  }

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-1 text-sm font-medium text-text-secondary hover:text-text">
          <ChevronLeft className="h-4 w-4" />
          Kembali
        </button>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div className="group relative aspect-square overflow-hidden rounded-xl bg-surface">
            {isOutOfStock && (
              <span className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 text-sm font-bold tracking-wider text-text backdrop-blur-[2px]">
                SOLD OUT
              </span>
            )}
            {images.length > 0 ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="relative h-full w-full cursor-zoom-in"
                  aria-label="Perbesar gambar">
                  <img
                    src={images[currentImageIndex]}
                    alt={`${product.name} ${currentImageIndex + 1}`}
                    className="h-full w-full object-cover transition-opacity duration-300"
                  />
                  <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                    <ZoomIn className="h-3.5 w-3.5" />
                    Perbesar
                  </span>
                </button>

                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        prevImage();
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-black shadow-md opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white">
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        nextImage();
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-black shadow-md opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white">
                      <ChevronRight className="h-5 w-5" />
                    </button>

                    <div className="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
                      {images.map((_, idx) => (
                        <div
                          key={idx}
                          className={`h-1 w-6 rounded-full transition-all ${
                            idx === currentImageIndex
                              ? "bg-white"
                              : "bg-white/40"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-text-secondary">
                No Image
              </div>
            )}
          </div>

          <div className="flex flex-col">
            {(categoryLabel || isLowStock || isOutOfStock) && (
              <div className="mb-1 flex items-center gap-2">
                {categoryLabel ? (
                  <Link
                    to={`/category/${product.categorySlug || product.categoryId || ""}`}
                    className="text-xs font-semibold uppercase tracking-wide text-primary hover:underline">
                    {categoryLabel}
                  </Link>
                ) : null}
                {isOutOfStock ? (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                    Stok Habis
                  </span>
                ) : isLowStock ? (
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-600">
                    Stok Menipis
                  </span>
                ) : null}
              </div>
            )}
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl font-bold text-text">{product.name}</h1>
              <button
                type="button"
                onClick={handleWishlistClick}
                aria-label="Add to Wishlist"
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  isInWishlist
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-text hover:border-primary hover:text-primary"
                }`}>
                {isInWishlist ? "Sudah di Wishlist" : "Add to Wishlist"}
              </button>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-bold text-primary">
                {formatPrice(unitPrice)}
              </span>
              {product.comparePrice &&
              product.comparePrice > product.basePrice ? (
                <span className="text-sm text-text-secondary line-through">
                  {formatPrice(product.comparePrice)}
                </span>
              ) : null}
              {discountPercent ? (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                  -{discountPercent}%
                </span>
              ) : null}
            </div>

            {product.description?.startsWith("<") ? (
              <div
                className="mt-6 text-sm leading-relaxed text-text-secondary [&_p]:mb-2"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            ) : (
              <p className="mt-6 text-sm leading-relaxed text-text-secondary">
                {product.description ?? "Belum ada deskripsi untuk produk ini."}
              </p>
            )}

            {/* Khusus produk kelas: disembunyikan untuk barang fisik */}
            {!isPhysical && schedules.length > 0 && (
              <div className="mt-6">
                <span className="text-sm font-semibold text-text">Jadwal</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {schedules.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setManualSchedule(day)}
                      className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                        selectedSchedule === day
                          ? "border-primary bg-primary text-white"
                          : "border-border text-text hover:border-primary"
                      }`}>
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!isPhysical && levels.length > 0 && (
              <div className="mt-4">
                <span className="text-sm font-semibold text-text">Tingkat</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {levels.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setManualLevel(level)}
                      className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                        selectedLevel === level
                          ? "border-primary bg-primary text-white"
                          : "border-border text-text hover:border-primary"
                      }`}>
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Khusus barang fisik: pilihan varian */}
            {isPhysical && variants.length > 0 && (
              <div className="mt-6">
                <span className="text-sm font-semibold text-text">Varian</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      disabled={v.stock !== undefined && v.stock <= 0}
                      onClick={() => {
                        setSelectedVariantId(v.id);
                        setQuantity(1);
                      }}
                      className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                        selectedVariant?.id === v.id
                          ? "border-primary bg-primary text-white"
                          : "border-border text-text hover:border-primary"
                      }`}>
                      {v.variantName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center gap-4">
              <span className="text-sm font-semibold text-text">Pesan</span>
              <div className="flex items-center rounded-full border border-border">
                <button
                  type="button"
                  disabled={isOutOfStock || quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-2.5 text-text hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center text-sm font-bold text-text">
                  {isOutOfStock ? 0 : quantity}
                </span>
                <button
                  type="button"
                  disabled={
                    isOutOfStock ||
                    (availableStock !== undefined && quantity >= availableStock)
                  }
                  onClick={() => setQuantity((q) => q + 1)}
                  className="p-2.5 text-text hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {availableStock !== undefined && (
                <span className="text-xs text-text-secondary">
                  {isOutOfStock
                    ? "Stok tidak tersedia"
                    : `Tersisa ${availableStock} buah`}
                </span>
              )}
            </div>

            {isOutOfStock && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                <p className="text-sm font-semibold">Stok Habis</p>
                <p className="mt-1 text-xs text-red-700 dark:text-red-400">
                  Produk ini saat ini sedang habis. Anda tidak dapat menambahkan
                  ke keranjang atau melakukan pembelian.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleTanyaAdmin}
              className="mt-6 flex w-fit items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
              <MessageCircle className="h-4 w-4" />
              Tanya Admin tentang produk ini
            </button>

            <div className="mt-auto flex gap-3 pt-8">
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleKeranjang}
                className="flex-1 rounded-full border border-primary py-3 text-sm font-bold text-primary transition-colors hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent">
                Keranjang
              </button>
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleBeli}
                className="flex-1 rounded-full bg-primary py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:opacity-50">
                {isOutOfStock ? "Stok Habis" : "Beli"}
              </button>
            </div>
          </div>
        </div>

        {/* Khusus barang fisik: spesifikasi produk */}
        {isPhysical && (
          <div className="mt-10 rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <h2 className="text-base font-bold text-text">
              Spesifikasi Produk
            </h2>
            <dl className="mt-4 grid grid-cols-[8rem_1fr] gap-x-6 gap-y-4 text-sm sm:grid-cols-[12rem_1fr]">
              {categoryLabel ? (
                <div className="contents">
                  <dt className="text-text-secondary">Kategori</dt>
                  <dd>
                    <Link
                      to={`/category/${product.categorySlug || product.categoryId || ""}`}
                      className="text-primary hover:underline">
                      {categoryLabel}
                    </Link>
                  </dd>
                </div>
              ) : null}
              {availableStock !== undefined ? (
                <div className="contents">
                  <dt className="text-text-secondary">Stok</dt>
                  <dd className="text-text">{availableStock}</dd>
                </div>
              ) : null}
              {specs.map((spec) => (
                <div key={spec.label} className="contents">
                  <dt className="text-text-secondary">{spec.label}</dt>
                  <dd className="text-text">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <div className="mt-10 rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Rating & Review
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex items-center gap-1 text-amber-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= Math.round(displayRating)
                          ? "fill-current"
                          : "text-text-secondary"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-lg font-bold text-text">
                  {displayRating > 0 ? displayRating.toFixed(1) : "0.0"}
                </span>
                <span className="text-xs text-text-secondary">
                  ({displayCount} review)
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-text">
                        {review.userName}
                      </p>
                      <p className="text-[11px] text-text-secondary">
                        {new Date(review.createdAt).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3.5 w-3.5 ${
                            star <= review.rating
                              ? "fill-current"
                              : "text-text-secondary"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    {review.comment}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-text-secondary">
                Belum ada review untuk produk ini.
              </p>
            )}
          </div>
        </div>

        {recommendations.length > 0 ? (
          <div className="mt-12">
            <h2 className="text-lg font-bold text-text">Produk Lainnya</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {recommendations.map((rec) => (
                <ProductCard key={rec.id} product={rec} />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <MarketplaceFooter />

      {isPreviewOpen ? (
        <div
          className="fixed inset-0 z-95 flex items-center justify-center bg-black/80 p-10"
          onClick={() => setIsPreviewOpen(false)}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsPreviewOpen(false);
            }}
            aria-label="Tutup preview"
            className="absolute right-6 top-6 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
            <X className="h-5 w-5" />
          </button>

          <img
            src={images[currentImageIndex]}
            alt={`${product.name} - preview penuh`}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[80vh] max-w-3xl rounded-lg object-contain shadow-2xl"
          />

          {images.length > 1 ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                aria-label="Gambar sebelumnya"
                className="absolute left-6 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                aria-label="Gambar berikutnya"
                className="absolute right-6 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20">
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          ) : null}
        </div>
      ) : null}

      {isWishlistModalOpen ? (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4"
          onClick={cancelWishlist}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="wishlist-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-background p-6 text-center shadow-xl">
            <h2
              id="wishlist-modal-title"
              className="text-base font-bold text-text">
              {isInWishlist ? "Hapus dari wishlist?" : "Tambahkan ke wishlist?"}
            </h2>
            <p className="mt-1.5 text-sm text-text-secondary">
              {isInWishlist
                ? `${product.name} akan dihapus dari daftar wishlist kamu.`
                : `${product.name} akan disimpan ke daftar wishlist kamu.`}
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={cancelWishlist}
                className="flex-1 rounded-full border border-border py-2.5 text-sm font-bold text-text transition-colors hover:bg-surface">
                Tidak
              </button>
              <button
                type="button"
                onClick={confirmWishlist}
                className={`flex-1 rounded-full py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 ${
                  isInWishlist ? "bg-red-600" : "bg-primary"
                }`}>
                Ya
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isLoginRequiredOpen ? (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsLoginRequiredOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-required-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-background p-6 text-center shadow-xl">
            <h2
              id="login-required-modal-title"
              className="text-base font-bold text-text">
              Anda harus login terlebih dahulu
            </h2>
            <p className="mt-1.5 text-sm text-text-secondary">
              Silakan masuk ke akun Anda untuk menambahkan produk ini ke
              wishlist.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setIsLoginRequiredOpen(false)}
                className="flex-1 rounded-full border border-border py-2.5 text-sm font-bold text-text transition-colors hover:bg-surface">
                Batal
              </button>
              <button
                type="button"
                onClick={() => navigate("/sign-in")}
                className="flex-1 rounded-full bg-primary py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90">
                Login
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
