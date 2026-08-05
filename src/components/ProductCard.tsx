import type { Product } from "@/lib/products";

function formatRupiah(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

interface ProductCardProps {
  product: Product;
  onSelect?: (product: Product) => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  const { name, image, price, originalPrice, discountPercent } = product;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(product)}
      className="group block w-full rounded-xl border border-border bg-surface p-3 text-left transition-shadow hover:shadow-md">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-background">
        {discountPercent ? (
          <span className="absolute left-0 top-0 z-10 rounded-br-lg rounded-tl-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white">
            -{discountPercent}%
          </span>
        ) : null}

        {image ? (
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-lg font-medium text-text-secondary">
              No Image
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 space-y-1.5">
        <h3 className="line-clamp-2 text-sm font-semibold text-text">{name}</h3>

        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-primary">
            {formatRupiah(price)}
          </span>
          {originalPrice && originalPrice > price ? (
            <span className="text-sm text-text-secondary line-through">
              {formatRupiah(originalPrice)}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}
