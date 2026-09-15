import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
} from "lucide-react";
import { useCart } from "@/components/cart/useCart";
import type { Product } from "@/lib/products";
import { showToast } from "@/lib/toast";
import { useCurrency } from "@/components/navbar/CurrencySwitcher";

interface ProductQuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

const DEFAULT_SCHEDULES = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
const DEFAULT_LEVELS = ["Pemula", "Menengah", "Tingkat Lanjut"];

function ProductQuickViewContent({
  product,
  onClose,
}: ProductQuickViewModalProps & { product: Product }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const schedules = product.schedules?.length
    ? product.schedules
    : DEFAULT_SCHEDULES;
  const levels = product.levels?.length ? product.levels : DEFAULT_LEVELS;

  const [selectedSchedule, setSelectedSchedule] = useState(schedules[0] ?? "");
  const [selectedLevel, setSelectedLevel] = useState(levels[0] ?? "");

  const images = product.images?.length
    ? product.images
    : product.image
      ? [product.image]
      : [];

  const nextImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (isPreviewOpen) {
          setIsPreviewOpen(false);
        } else {
          onClose();
        }
        return;
      }
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, nextImage, prevImage, isPreviewOpen]);

  const variantLabel = useMemo(() => {
    const parts = [selectedSchedule, selectedLevel].filter(Boolean);
    return parts.length > 0 ? parts.join(" • ") : "Standar";
  }, [selectedSchedule, selectedLevel]);
  const isOutOfStock = product.stock !== undefined && product.stock <= 0;

  function handleKeranjang() {
    if (isOutOfStock) return;
    addToCart(product, quantity, variantLabel);
    showToast(`${product.name} added to cart`);
    onClose();
  }

  function handleBeli() {
    if (isOutOfStock) return;
    onClose();
    navigate("/checkout", {
      state: {
        immediateBuy: { product, quantity, variant: variantLabel },
      },
    });
  }

  return (
    <div
      className="fixed inset-0 z-90 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-xl bg-surface shadow-xl sm:grid-cols-2">
        <div className="group relative aspect-square bg-background sm:aspect-auto">
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
                          idx === currentImageIndex ? "bg-white" : "bg-white/40"
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

        <div className="flex flex-col p-8">
          {isOutOfStock && (
            <span className="mb-2 w-fit rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-600 dark:bg-red-950/40 dark:text-red-400">
              Stok Habis
            </span>
          )}
          <h2 className="text-2xl font-bold text-text">{product.name}</h2>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-primary">
              {formatPrice(product.basePrice)}
            </span>
            {product.comparePrice &&
            product.comparePrice > product.basePrice ? (
              <span className="text-sm text-text-secondary line-through">
                {formatPrice(product.comparePrice)}
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

          {schedules.length > 0 && (
            <div className="mt-6">
              <span className="text-sm font-semibold text-text">Jadwal</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {schedules.map((day: string) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedSchedule(day)}
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

          {levels.length > 0 && (
            <div className="mt-4">
              <span className="text-sm font-semibold text-text">Tingkat</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {levels.map((level: string) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSelectedLevel(level)}
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
                  (product.stock !== undefined && quantity >= product.stock)
                }
                onClick={() => setQuantity((q) => q + 1)}
                className="p-2.5 text-text hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {product.stock !== undefined && (
              <span className="text-xs text-text-secondary">
                {isOutOfStock
                  ? "Stok tidak tersedia"
                  : `Tersisa ${product.stock} buah`}
              </span>
            )}
          </div>

          {isOutOfStock && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              <p className="font-semibold text-xs">Stok Habis</p>
              <p className="mt-0.5 text-xs text-red-700 dark:text-red-400">
                Produk ini sedang tidak tersedia. Anda tidak dapat menambahkan ke keranjang atau melakukan pembelian.
              </p>
            </div>
          )}

          <div className="mt-auto flex gap-3 pt-8">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-red-500 py-3 text-sm font-bold text-red-500 transition-colors hover:bg-red-50">
              Cancel
            </button>
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleKeranjang}
              className="flex-1 rounded-full border border-secondary py-3 text-sm font-bold text-secondary transition-colors hover:bg-secondary/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent">
              Keranjang
            </button>
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleBeli}
              className="flex-1 rounded-full bg-secondary py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:opacity-50">
              {isOutOfStock ? "Stok Habis" : "Beli"}
            </button>
          </div>
        </div>
      </div>

      {isPreviewOpen ? (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-black/80 p-10"
          onClick={(e) => {
            e.stopPropagation();
            setIsPreviewOpen(false);
          }}>
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
    </div>
  );
}

export function ProductQuickViewModal({
  product,
  onClose,
}: ProductQuickViewModalProps) {
  if (!product) return null;

  return (
    <ProductQuickViewContent
      key={product.id ?? "product"}
      product={product}
      onClose={onClose}
    />
  );
}
