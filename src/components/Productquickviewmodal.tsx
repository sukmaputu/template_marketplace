import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
} from "lucide-react";
import { useCart } from "@/components/useCart";
import type { Product } from "@/lib/products";

interface ProductQuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

const DEFAULT_SCHEDULES = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
const DEFAULT_LEVELS = ["Pemula", "Menengah", "Tingkat Lanjut"];

function formatRupiah(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function ProductQuickViewContent({
  product,
  onClose,
}: ProductQuickViewModalProps & { product: Product }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const schedules = product.schedules?.length
    ? product.schedules
    : DEFAULT_SCHEDULES;
  const levels = product.levels?.length ? product.levels : DEFAULT_LEVELS;

  const [selectedSchedule, setSelectedSchedule] = useState(schedules[0]);
  const [selectedLevel, setSelectedLevel] = useState(levels[0]);

  // Ambil daftar gambar dari product.images
  const images = product.images?.length
    ? product.images
    : product.image
      ? [product.image]
      : [];

  // Fungsi Navigasi Carousel
  const nextImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Handle Keyboard (Escape dan Arrow Keys)
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

  const variantLabel = `${selectedSchedule} • ${selectedLevel}`;

  function handleKeranjang() {
    addToCart(product, quantity, variantLabel);
    onClose();
  }

  function handleBeli() {
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
        {/* BAGIAN KIRI: CAROUSEL */}
        <div className="group relative aspect-square bg-background sm:aspect-auto">
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

              {/* Tombol Navigasi Kiri Kanan (Hanya muncul jika gambar > 1) */}
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

                  {/* Pagination Garis --- */}
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

        {/* BAGIAN KANAN: DESKRIPSI */}
        <div className="flex flex-col p-8">
          <h2 className="text-2xl font-bold text-text">{product.name}</h2>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-primary">
              {formatRupiah(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price ? (
              <span className="text-sm text-text-secondary line-through">
                {formatRupiah(product.originalPrice)}
              </span>
            ) : null}
          </div>

          <p className="mt-6 text-sm leading-relaxed text-text-secondary">
            {product.description ?? "Belum ada deskripsi untuk produk ini."}
          </p>

          {/* Pilihan Jadwal */}
          <div className="mt-6">
            <span className="text-sm font-semibold text-text">Jadwal</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {schedules.map((day) => (
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

          {/* Pilihan Tingkat */}
          <div className="mt-4">
            <span className="text-sm font-semibold text-text">Tingkat</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {levels.map((level) => (
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

          <div className="mt-6 flex items-center gap-4">
            <span className="text-sm font-semibold text-text">Pesan</span>
            <div className="flex items-center rounded-full border border-border">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-2.5 text-text hover:text-primary">
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center text-sm font-bold text-text">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="p-2.5 text-text hover:text-primary">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-auto flex gap-3 pt-8">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-red-500 py-3 text-sm font-bold text-red-500 transition-colors hover:bg-red-50">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleKeranjang}
              className="flex-1 rounded-full border border-secondary py-3 text-sm font-bold text-secondary transition-colors hover:bg-secondary/10">
              Keranjang
            </button>
            <button
              type="button"
              onClick={handleBeli}
              className="flex-1 rounded-full bg-secondary py-3 text-sm font-bold text-white transition-opacity hover:opacity-90">
              Beli
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox — preview gambar penuh, tidak menutupi seluruh layar */}
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
      key={product.id ?? product.name ?? "product"}
      product={product}
      onClose={onClose}
    />
  );
}
