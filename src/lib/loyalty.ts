import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { websocketService } from "@/lib/websocket";

export interface LoyaltyTier {
  id: string;
  name: string;
  min_point: number;
  voucher_id?: string;
  voucher?: {
    uuid: string;
    code: string;
    discount_type: "PERCENTAGE" | "FIXED";
    discount_value: number;
    min_order_amount?: number;
    max_discount_amount?: number;
  };
}

export const loyaltyApi = {
  async getAll(): Promise<LoyaltyTier[]> {
    try {
      const res = await api.get<{
        success: boolean;
        message: string;
        data: LoyaltyTier[];
      }>("/ecommerce/loyalties");
      const list = res.data?.data;
      if (Array.isArray(list)) {
        return [...list].sort((a, b) => (a.min_point || 0) - (b.min_point || 0));
      }
      return [];
    } catch (err) {
      console.warn("[loyaltyApi.getAll] Failed to fetch loyalty tiers:", err);
      return [];
    }
  },
};

export function getCurrentTier(
  points: number,
  tiers: LoyaltyTier[],
): LoyaltyTier | null {
  if (!tiers.length) return null;
  const sortedDesc = [...tiers].sort((a, b) => b.min_point - a.min_point);
  const found = sortedDesc.find((t) => points >= t.min_point);
  return found || sortedDesc[sortedDesc.length - 1] || null;
}

export function getNextTier(
  points: number,
  tiers: LoyaltyTier[],
): LoyaltyTier | null {
  if (!tiers.length) return null;
  const sortedAsc = [...tiers].sort((a, b) => a.min_point - b.min_point);
  return sortedAsc.find((t) => t.min_point > points) || null;
}

export function calculateProgress(
  points: number,
  tiers: LoyaltyTier[],
): {
  currentTier: LoyaltyTier | null;
  nextTier: LoyaltyTier | null;
  progressPercent: number;
  pointsToNext: number;
  targetPoints: number;
} {
  const currentTier = getCurrentTier(points, tiers);
  const nextTier = getNextTier(points, tiers);

  if (!nextTier) {
    return {
      currentTier,
      nextTier: null,
      progressPercent: 100,
      pointsToNext: 0,
      targetPoints: currentTier?.min_point || 100,
    };
  }

  const basePoints = currentTier ? currentTier.min_point : 0;
  const targetPoints = nextTier.min_point;
  const diff = Math.max(1, targetPoints - basePoints);
  const currentDiff = Math.max(0, points - basePoints);
  const progressPercent = Math.min(100, Math.round((currentDiff / diff) * 100));
  const pointsToNext = Math.max(0, targetPoints - points);

  return {
    currentTier,
    nextTier,
    progressPercent,
    pointsToNext,
    targetPoints,
  };
}

export function useLoyalties() {
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTiers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await loyaltyApi.getAll();
      setTiers(data);
    } catch {
      // keep fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTiers();

    const unsubLoyalty = websocketService.on("loyalty_updated", () => {
      void fetchTiers();
    });
    const unsubData = websocketService.on("data_updated", (payload: any) => {
      if (
        !payload ||
        payload.resource === "loyalties" ||
        payload.resource === "loyalty"
      ) {
        void fetchTiers();
      }
    });

    const onSync = () => void fetchTiers();
    window.addEventListener("loyalties-updated", onSync);
    window.addEventListener("focus", onSync);

    return () => {
      unsubLoyalty();
      unsubData();
      window.removeEventListener("loyalties-updated", onSync);
      window.removeEventListener("focus", onSync);
    };
  }, [fetchTiers]);

  return { tiers, loading, refetch: fetchTiers };
}
