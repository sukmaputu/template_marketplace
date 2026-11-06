import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createCartItem, type CartItem } from "@/lib/cart";
import type { Product } from "@/lib/products";
import { CartContext } from "@/components/cart/cartContext";
import { api, getAuthToken } from "@/lib/api";
import { showToast } from "@/lib/toast";

const CART_STORAGE_KEY = "marketplace-cart";
let inFlightCartSyncPromise: Promise<void> | null = null;

function loadSavedCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => loadSavedCart());
  const isInitialMount = useRef(true);

  useEffect(() => {
    let cancelled = false;
    async function syncBackendCartIds() {
      if (!getAuthToken()) {
        setItems((current) =>
          current.map((item) => {
            const {
              backendCartItemId: backendId,
              ...itemWithoutBackendId
            } = item;
            void backendId;
            return itemWithoutBackendId;
          }),
        );
        return;
      }

      if (inFlightCartSyncPromise) return inFlightCartSyncPromise;

      inFlightCartSyncPromise = (async () => {
        try {
          const response = await api.get("/ecommerce/cart");
          const data = response.data?.data;
          const remoteItems: unknown[] = Array.isArray(data)
            ? data
            : data && typeof data === "object"
              ? ((data as { items?: unknown[]; cart_items?: unknown[] }).items ??
                (data as { cart_items?: unknown[] }).cart_items ??
                [])
              : [];
          if (cancelled) return;

          setItems((current) =>
            current.map((item) => {
              const match = remoteItems.find((remote) => {
                if (!remote || typeof remote !== "object") return false;
                const row = remote as {
                  uuid?: string;
                  id?: string;
                  product_uuid?: string;
                  product_id?: string;
                  variant_uuid?: string;
                  variant_name?: string;
                  product?: { uuid?: string; id?: string };
                };
                const productId =
                  row.product_uuid ||
                  row.product_id ||
                  row.product?.uuid ||
                  row.product?.id;
                const variantMatches = item.variantUuid
                  ? row.variant_uuid === item.variantUuid
                  : !row.variant_uuid || row.variant_name === item.variant;
                return productId === item.productId && variantMatches;
              });
              if (!match || typeof match !== "object") return item;
              const row = match as { uuid?: string; id?: string };
              const backendCartItemId = row.uuid || row.id;
              return backendCartItemId
                ? { ...item, backendCartItemId }
                : item;
            }),
          );
        } catch {
          if (!cancelled) {
            showToast("Keranjang belum dapat disinkronkan dengan server.");
          }
        } finally {
          inFlightCartSyncPromise = null;
        }
      })();

      return inFlightCartSyncPromise;
    }

    void syncBackendCartIds();
    window.addEventListener("auth_updated", syncBackendCartIds);
    return () => {
      cancelled = true;
      window.removeEventListener("auth_updated", syncBackendCartIds);
    };
  }, []);

  // Sync to localStorage whenever items change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  // Listen for cart changes from other tabs via native storage event
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === CART_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setItems((curr) => {
              if (JSON.stringify(curr) === e.newValue) return curr;
              return parsed;
            });
          }
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const addToCart = useCallback(
    (
      product: Product,
      quantity = 1,
      variant?: string,
      variantUuid?: string,
    ) => {
    const resolvedVariant = variant ?? "Varian standar";
    const selectedVariant =
      product.variants?.find((item) => item.id === variantUuid) ??
      product.variants?.find(
        (item) => item.variantName === resolvedVariant,
      );
    const availableStock = selectedVariant?.stock ?? product.stock;
    if (availableStock !== undefined && availableStock <= 0) {
      return;
    }

    const cartItemId = `${product.id}::${resolvedVariant}`;
    const existing = items.find((item) => item.id === cartItemId);
    const maxQuantity = existing?.stock ?? availableStock ?? 999;
    const nextQuantity = Math.min(
      (existing?.quantity ?? 0) + quantity,
      maxQuantity,
    );
    if (existing && nextQuantity === existing.quantity) return;

    setItems((prev) => {
      if (existing) {
        return prev.map((item) => {
          if (item.id !== cartItemId) return item;
          const maxQty =
            item.stock ?? 999;
          return {
            ...item,
            quantity: Math.min(item.quantity + quantity, maxQty),
          };
        });
      }
      return [
        ...prev,
        createCartItem(
        product,
        nextQuantity,
        resolvedVariant,
        selectedVariant?.id,
        ),
      ];
    });

    if (getAuthToken()) {
      const request = existing?.backendCartItemId
        ? api.put(
            `/ecommerce/cart/items/${encodeURIComponent(existing.backendCartItemId)}`,
            { quantity: nextQuantity },
          )
        : api.post("/ecommerce/cart", {
            product_id: product.id,
            product_uuid: product.id,
            quantity: existing ? nextQuantity - existing.quantity : nextQuantity,
            variant_uuid: selectedVariant?.id,
          });
      void request
        .then((response) => {
          const data = response.data?.data;
          const remoteId =
            data && typeof data === "object"
              ? (data.uuid as string | undefined) ||
                (data.id as string | undefined) ||
                (data.cart_item_uuid as string | undefined)
              : undefined;
          if (remoteId) {
            setItems((current) =>
              current.map((item) =>
                item.id === cartItemId
                  ? { ...item, backendCartItemId: remoteId }
                  : item,
              ),
            );
          }
        })
        .catch(() => {
          showToast("Item tersimpan di perangkat, tetapi gagal disinkronkan ke server.");
        });
    }
    },
    [items],
  );

  const updateQuantity = useCallback(
    (id: CartItem["id"], delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const maxQty =
          item.stock !== undefined && item.stock > 0 ? item.stock : 999;
        const nextQty = Math.max(1, Math.min(item.quantity + delta, maxQty));
        return { ...item, quantity: nextQty };
      }),
    );
    const item = items.find((current) => current.id === id);
    if (item?.backendCartItemId && getAuthToken()) {
      const maxQty =
        item.stock !== undefined && item.stock > 0 ? item.stock : 999;
      const quantity = Math.max(1, Math.min(item.quantity + delta, maxQty));
      void api
        .put(
          `/ecommerce/cart/items/${encodeURIComponent(item.backendCartItemId)}`,
          { quantity },
        )
        .catch(() => showToast("Gagal memperbarui jumlah item di server."));
    }
    },
    [items],
  );

  const removeItem = useCallback(
    (id: CartItem["id"]) => {
    const item = items.find((current) => current.id === id);
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (item?.backendCartItemId && getAuthToken()) {
      void api
        .delete(
          `/ecommerce/cart/items/${encodeURIComponent(item.backendCartItemId)}`,
        )
        .catch(() => showToast("Item dihapus dari perangkat, tetapi gagal dihapus di server."));
    }
    },
    [items],
  );

  const clearSelected = useCallback(() => {
    const selectedWithBackendIds = items.filter(
      (item) => item.selected && item.backendCartItemId,
    );
    setItems((prev) => prev.filter((item) => !item.selected));
    if (getAuthToken()) {
      void Promise.all(
        selectedWithBackendIds.map((item) =>
          api.delete(
            `/ecommerce/cart/items/${encodeURIComponent(item.backendCartItemId!)}`,
          ),
        ),
      ).catch(() => showToast("Beberapa item gagal dihapus dari keranjang server."));
    }
  }, [items]);

  const toggleSelectItem = useCallback((id: CartItem["id"]) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item,
      ),
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    setItems((prev) => {
      const hasUnselected = prev.some((item) => !item.selected);
      return prev.map((item) => ({ ...item, selected: hasUnselected }));
    });
  }, []);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      addToCart,
      updateQuantity,
      removeItem,
      clearSelected,
      toggleSelectItem,
      toggleSelectAll,
      itemCount,
    }),
    [
      items,
      itemCount,
      addToCart,
      updateQuantity,
      removeItem,
      clearSelected,
      toggleSelectItem,
      toggleSelectAll,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
