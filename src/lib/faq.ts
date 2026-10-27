import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { websocketService } from "@/lib/websocket";

export interface FAQItem {
  uuid: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export const faqApi = {
  async getActive(): Promise<FAQItem[]> {
    try {
      const res = await api.get<{
        success: boolean;
        message: string;
        data: FAQItem[];
      }>("/cms/faqs?status=ACTIVE");
      return res.data?.data ?? [];
    } catch (err) {
      console.warn("[faqApi.getActive] Failed to load FAQs:", err);
      return [];
    }
  },
};

export function useFAQs() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFaqs = useCallback(async () => {
    try {
      setLoading(true);
      const items = await faqApi.getActive();
      setFaqs(items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load FAQs"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFaqs();

    // Listen to websocket updates
    const unsub = websocketService.on("faq_updated", () => {
      fetchFaqs();
    });

    return () => {
      unsub();
    };
  }, [fetchFaqs]);

  return { faqs, loading, error, refetch: fetchFaqs };
}
