import { PRODUCTS } from "./productData";
import type { Product, ProductVariant } from "./productTypes";

export function getVariantPrice(
  product: Product,
  variant?: ProductVariant,
): number {
  if (!variant) return product.basePrice;
  if (variant.overridePrice !== undefined) return variant.overridePrice;
  if (variant.priceDelta !== undefined)
    return product.basePrice + variant.priceDelta;
  return product.basePrice;
}

export function getDiscountPercent(product: Product): number | undefined {
  if (!product.comparePrice || product.comparePrice <= product.basePrice) {
    return undefined;
  }
  return Math.round(
    ((product.comparePrice - product.basePrice) / product.comparePrice) * 100,
  );
}

const RECENTLY_VIEWED_STORAGE_KEY = "marketplace-recently-viewed";
const RECENTLY_VIEWED_PRODUCTS_STORAGE_KEY =
  "marketplace-recently-viewed-products";
const MAX_RECENTLY_VIEWED = 4;

export function getRecentlyViewedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export function addRecentlyViewedProduct(product: Product) {
  if (typeof window === "undefined") return;
  const ids = getRecentlyViewedIds().filter((id) => id !== product.id);
  ids.unshift(product.id);
  window.localStorage.setItem(
    RECENTLY_VIEWED_STORAGE_KEY,
    JSON.stringify(ids.slice(0, MAX_RECENTLY_VIEWED)),
  );

  let storedProducts: Product[] = [];
  try {
    const raw = window.localStorage.getItem(
      RECENTLY_VIEWED_PRODUCTS_STORAGE_KEY,
    );
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    if (Array.isArray(parsed)) storedProducts = parsed as Product[];
  } catch {
    storedProducts = [];
  }

  window.localStorage.setItem(
    RECENTLY_VIEWED_PRODUCTS_STORAGE_KEY,
    JSON.stringify(
      [
        product,
        ...storedProducts.filter((item) => item.id !== product.id),
      ].slice(0, MAX_RECENTLY_VIEWED),
    ),
  );
  window.dispatchEvent(new Event("recently-viewed-updated"));
}

export function getRecentlyViewedProducts(
  limit = MAX_RECENTLY_VIEWED,
): Product[] {
  let storedProducts: Product[] = [];
  try {
    const raw = window.localStorage.getItem(
      RECENTLY_VIEWED_PRODUCTS_STORAGE_KEY,
    );
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    if (Array.isArray(parsed)) storedProducts = parsed as Product[];
  } catch {
    storedProducts = [];
  }

  const storedProductsById = new Map(
    storedProducts.map((product) => [product.id, product]),
  );
  return getRecentlyViewedIds()
    .map(
      (id) =>
        storedProductsById.get(id) ??
        PRODUCTS.find((product) => product.id === id),
    )
    .filter((product): product is Product => Boolean(product))
    .slice(0, limit);
}

export function removeRecentlyViewedProduct(productId: string) {
  if (typeof window === "undefined") return;

  const ids = getRecentlyViewedIds().filter((id) => id !== productId);
  window.localStorage.setItem(
    RECENTLY_VIEWED_STORAGE_KEY,
    JSON.stringify(ids),
  );

  let storedProducts: Product[] = [];
  try {
    const raw = window.localStorage.getItem(
      RECENTLY_VIEWED_PRODUCTS_STORAGE_KEY,
    );
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    if (Array.isArray(parsed)) storedProducts = parsed as Product[];
  } catch {
    storedProducts = [];
  }

  const nextStored = storedProducts.filter((item) => item.id !== productId);
  window.localStorage.setItem(
    RECENTLY_VIEWED_PRODUCTS_STORAGE_KEY,
    JSON.stringify(nextStored),
  );

  window.dispatchEvent(new Event("recently-viewed-updated"));
}

export function clearRecentlyViewedProducts() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(RECENTLY_VIEWED_STORAGE_KEY);
  window.localStorage.removeItem(RECENTLY_VIEWED_PRODUCTS_STORAGE_KEY);
  window.dispatchEvent(new Event("recently-viewed-updated"));
}


const RECENT_SEARCHES_STORAGE_KEY = "marketplace-recent-searches";
const MAX_RECENT_SEARCHES = 6;

export function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(term: string) {
  if (typeof window === "undefined") return;
  const cleanTerm = term.trim();
  if (!cleanTerm) return;

  const current = getRecentSearches().filter(
    (item) => item.toLowerCase() !== cleanTerm.toLowerCase(),
  );
  const next = [cleanTerm, ...current].slice(0, MAX_RECENT_SEARCHES);
  window.localStorage.setItem(
    RECENT_SEARCHES_STORAGE_KEY,
    JSON.stringify(next),
  );
  window.dispatchEvent(new Event("recent-searches-updated"));
}

export function removeRecentSearch(term: string) {
  if (typeof window === "undefined") return;
  const current = getRecentSearches().filter(
    (item) => item.toLowerCase() !== term.toLowerCase(),
  );
  window.localStorage.setItem(
    RECENT_SEARCHES_STORAGE_KEY,
    JSON.stringify(current),
  );
  window.dispatchEvent(new Event("recent-searches-updated"));
}

export function clearRecentSearches() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(RECENT_SEARCHES_STORAGE_KEY);
  window.dispatchEvent(new Event("recent-searches-updated"));
}


export type RecommendationMode = "best" | "popular" | "discount" | "rating";

export function calculateRecommendationScore(product: Product): number {
  const rating = product.rating ?? 0;
  const reviews = product.reviewCount ?? 0;
  const discount = getDiscountPercent(product) ?? 0;

  // 1. Kualitas / Rating Terbobot (Damped Bayesian: 0 - 100)
  // Mencegah produk baru dengan 1 ulasan bintang 5 langsung mengalahkan produk bintang 4.8 dari ratusan ulasan
  const dampedRating =
    reviews > 0
      ? (rating * reviews + 4.0 * 3) / (reviews + 3)
      : rating > 0
        ? rating * 0.7
        : 3.0;
  const qualityScore = Math.min(100, Math.max(0, (dampedRating / 5) * 100));

  // 2. Popularitas / Social Proof (Yang Ramai: 0 - 100)
  // Skala logaritmik ulasan pembeli
  const popularityScore = Math.min(100, Math.log10(reviews + 1) * 32);

  // 3. Penawaran / Diskon (0 - 100)
  // Diskon di atas 50% mendapat nilai maksimal
  const discountScore = Math.min(100, (discount / 50) * 100);

  // 4. Composite Hybrid Score (0 - 100)
  // 40% Popularitas (Yang Ramai) + 35% Kualitas (Rating) + 25% Diskon Promo
  const totalScore =
    popularityScore * 0.4 + qualityScore * 0.35 + discountScore * 0.25;

  return Math.round(totalScore * 100) / 100;
}

export function getTopRecommendedProducts(limit?: number): Product[];
export function getTopRecommendedProducts(
  sourceProducts?: Product[],
  limit?: number,
  mode?: RecommendationMode,
): Product[];
export function getTopRecommendedProducts(
  sourceOrLimit: Product[] | number = PRODUCTS,
  limitArg = 6,
  modeArg: RecommendationMode = "best",
): Product[] {
  let sourceProducts = PRODUCTS;
  let limit = limitArg;
  const mode = modeArg;

  if (typeof sourceOrLimit === "number") {
    limit = sourceOrLimit;
    sourceProducts = PRODUCTS;
  } else if (Array.isArray(sourceOrLimit)) {
    sourceProducts = sourceOrLimit;
  }

  const list = [...sourceProducts].filter(
    (product) => product.stock === undefined || product.stock > 0,
  );

  return list
    .sort((a, b) => {
      if (mode === "popular") {
        // Mode Paling Ramai: ulasan terbanyak, rating tinggi, lalu diskon
        const revDiff = (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
        if (revDiff !== 0) return revDiff;
        const rateDiff = (b.rating ?? 0) - (a.rating ?? 0);
        if (rateDiff !== 0) return rateDiff;
        const discDiff =
          (getDiscountPercent(b) ?? 0) - (getDiscountPercent(a) ?? 0);
        if (discDiff !== 0) return discDiff;
      } else if (mode === "discount") {
        // Mode Diskon Spesial: diskon terbesar, lalu rating & ulasan
        const discDiff =
          (getDiscountPercent(b) ?? 0) - (getDiscountPercent(a) ?? 0);
        if (discDiff !== 0) return discDiff;
        const revDiff = (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
        if (revDiff !== 0) return revDiff;
        const rateDiff = (b.rating ?? 0) - (a.rating ?? 0);
        if (rateDiff !== 0) return rateDiff;
      } else if (mode === "rating") {
        // Mode Rating Tertinggi: rating riil berbobot ulasan
        const rateDiff = (b.rating ?? 0) - (a.rating ?? 0);
        if (rateDiff !== 0) return rateDiff;
        const revDiff = (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
        if (revDiff !== 0) return revDiff;
        const discDiff =
          (getDiscountPercent(b) ?? 0) - (getDiscountPercent(a) ?? 0);
        if (discDiff !== 0) return discDiff;
      } else {
        // Mode Default ("best"): Composite Hybrid Score (Ramai + Rating Bagus + Diskon)
        const scoreDiff =
          calculateRecommendationScore(b) - calculateRecommendationScore(a);
        if (scoreDiff !== 0) return scoreDiff;
      }

      // Fallback alfabetis stabil
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit);
}

export interface GetRelatedProductsOptions {
  query?: string;
  categoryId?: string;
  categorySlug?: string;
  excludeIds?: string[];
  limit?: number;
  sourceProducts?: Product[];
}

export function getRelatedProducts({
  query = "",
  categoryId = "",
  categorySlug = "",
  excludeIds = [],
  limit = 4,
  sourceProducts = PRODUCTS,
}: GetRelatedProductsOptions = {}): Product[] {
  const excludeSet = new Set(excludeIds);
  const candidates = sourceProducts.filter(
    (product) =>
      !excludeSet.has(product.id) &&
      (product.stock === undefined || product.stock > 0),
  );

  const targetCategory = (categoryId || categorySlug).toLowerCase().trim();
  const searchTokens = query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 1);

  const scoredCandidates = candidates.map((product) => {
    let score = 0;
    const name = product.name.toLowerCase();
    const desc = (product.description ?? "").toLowerCase();
    const prodCat = (
      product.categorySlug ??
      product.categoryId ??
      ""
    ).toLowerCase();

    // 1. Kesesuaian kategori
    if (
      targetCategory &&
      prodCat &&
      (prodCat === targetCategory ||
        prodCat.includes(targetCategory) ||
        targetCategory.includes(prodCat))
    ) {
      score += 10;
    }

    // 2. Kecocokan kata kunci pencarian (token match)
    if (searchTokens.length > 0) {
      for (const token of searchTokens) {
        if (name.includes(token)) {
          score += 6;
        } else if (prodCat.includes(token)) {
          score += 4;
        } else if (desc.includes(token)) {
          score += 2;
        }
      }
    }

    // 3. Poin kualitas produk (rating & diskon)
    if ((product.rating ?? 0) > 0) {
      score += (product.rating ?? 0) * 0.5;
    }
    if ((getDiscountPercent(product) ?? 0) > 0) {
      score += 1;
    }

    return { product, score };
  });

  // Urutkan berdasarkan skor relevansi tertinggi
  scoredCandidates.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    const ratingDiff = (b.product.rating ?? 0) - (a.product.rating ?? 0);
    if (ratingDiff !== 0) return ratingDiff;
    return (b.product.reviewCount ?? 0) - (a.product.reviewCount ?? 0);
  });

  const results: Product[] = [];
  for (const item of scoredCandidates) {
    if (item.score > 0 && results.length < limit) {
      results.push(item.product);
    }
  }

  // Jika hasil relevan masih kurang dari limit, lengkapi dengan produk rekomendasi teratas
  if (results.length < limit) {
    const currentResultIds = new Set([
      ...excludeIds,
      ...results.map((r) => r.id),
    ]);
    const fallbackProducts = getTopRecommendedProducts(
      sourceProducts.filter((p) => !currentResultIds.has(p.id)),
      limit - results.length,
    );
    results.push(...fallbackProducts);
  }

  return results.slice(0, limit);
}
