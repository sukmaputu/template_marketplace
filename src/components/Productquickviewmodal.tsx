import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Minus, Plus } from "lucide-react";
import { useCart } from "@/components/useCart";
import type { Product } from "@/lib/products";

interface ProductQuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

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

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const images = product.images?.length
    ? product.images
    : product.image
      ? [product.image]
      : [];
  const mainImage = images[0];

  function handleKeranjang() {
    addToCart(product, quantity);
    onClose();
  }

  function handleBeli() {
    onClose();
    navigate("/checkout", {
      state: {
        immediateBuy: {
          product,
          quantity,
        },
      },
    });
  }

  return (
    <div
      className="fixed inset-0 z-90 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative grid w-full max-w-3xl grid-cols-1 overflow-hidden rounded-xl bg-surface shadow-xl sm:grid-cols-2">
        <div className="relative aspect-square bg-background sm:aspect-auto">
          {mainImage ? (
            <img
              src={mainImage}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-sm font-medium text-text-secondary">
                No Image
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-col p-6">
          <h2 className="text-2xl font-bold text-text">{product.name}</h2>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg font-bold text-primary">
              {formatRupiah(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price ? (
              <span className="text-sm text-text-secondary line-through">
                {formatRupiah(product.originalPrice)}
              </span>
            ) : null}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-text-secondary">
            {product.description ?? "Belum ada deskripsi untuk produk ini."}
          </p>

          <div className="mt-6 flex items-center gap-3">
            <span className="text-sm font-medium text-text">Pesan</span>
            <div className="flex items-center rounded-full border border-border">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Kurangi jumlah"
                className="p-2 text-text hover:text-primary">
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-6 text-center text-sm font-medium text-text">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Tambah jumlah"
                className="p-2 text-text hover:text-primary">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-auto flex gap-3 pt-6">
            <button
              onClick={onClose}
              className="flex-1 rounded-full border border-red-600 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50">
              Cancel
            </button>
            <button
              onClick={handleKeranjang}
              className="flex-1 rounded-full border border-secondary py-2.5 text-sm font-semibold text-secondary hover:bg-secondary/10">
              Keranjang
            </button>
            <button
              onClick={handleBeli}
              className="flex-1 rounded-full bg-secondary py-2.5 text-sm font-semibold text-white hover:opacity-90">
              Beli
            </button>
          </div>
        </div>
      </div>
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
