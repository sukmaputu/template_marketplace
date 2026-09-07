import { Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getDiscountPercent,
  getProductRatingStats,
  type Product,
} from "@/lib/products";
import { useCurrency } from "@/components/navbar/CurrencySwitcher";

interface ProductCardProps {
  product: Product;
  onSelect?: (product: Product) => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const { id, name, image, basePrice, comparePrice } = product;
  const discountPercent = getDiscountPercent(product);
  const ratingStats = getProductRatingStats(id);

  return (
    <button
      type="button"
      onClick={() => {
        if (onSelect) {
          onSelect(product);
          return;
        }
        navigate(`/product/${id}`);
      }}
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

        <div className="flex items-center gap-1 text-[11px] text-amber-500">
          <Star className="h-3.5 w-3.5 fill-current" />
          <span className="font-medium text-text">
            {ratingStats.rating > 0 ? ratingStats.rating.toFixed(1) : "Baru"}
          </span>
          <span className="text-text-secondary">
            ({ratingStats.reviewCount})
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-primary">
            {formatPrice(basePrice)}
          </span>
          {comparePrice && comparePrice > basePrice ? (
            <span className="text-sm text-text-secondary line-through">
              {formatPrice(comparePrice)}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}
