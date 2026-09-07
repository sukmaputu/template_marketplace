/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChevronDown } from "lucide-react";

export const CURRENCIES = [
  { code: "IDR", label: "Rupiah", flag: "🇮🇩" },
  { code: "USD", label: "US Dollar", flag: "🇺🇸" },
] as const;

type CurrencyCode = (typeof CURRENCIES)[number]["code"];

interface CurrencyContextValue {
  currency: CurrencyCode;
  rate: number | null;
  isLoading: boolean;
  error: string | null;
  setCurrency: (currency: CurrencyCode) => void;
  formatPrice: (value: number) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    const saved = localStorage.getItem("marketplace-currency");
    return saved === "USD" ? "USD" : "IDR";
  });
  const [rate, setRate] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isLoading = currency === "USD" && rate === null && error === null;

  useEffect(() => {
    if (currency !== "USD") return;

    const controller = new AbortController();

    fetch("https://api.frankfurter.dev/v2/rate/IDR/USD", {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Gagal mengambil kurs mata uang");
        return (await response.json()) as { rate?: number };
      })
      .then((data) => {
        if (typeof data.rate !== "number" || !Number.isFinite(data.rate)) {
          throw new Error("Kurs mata uang tidak valid");
        }
        setRate(data.rate);
      })
      .catch((requestError: unknown) => {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        ) {
          return;
        }
        setError("Kurs USD tidak tersedia");
      });

    return () => controller.abort();
  }, [currency]);

  function setCurrency(nextCurrency: CurrencyCode) {
    setCurrencyState(nextCurrency);
    setError(null);
    localStorage.setItem("marketplace-currency", nextCurrency);
  }

  function formatPrice(value: number) {
    const convertedValue = currency === "USD" && rate ? value * rate : value;
    return new Intl.NumberFormat(currency === "USD" ? "en-US" : "id-ID", {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "USD" ? 2 : 0,
    }).format(convertedValue);
  }

  return (
    <CurrencyContext.Provider
      value={{ currency, rate, isLoading, error, setCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
}

export function CurrencySwitcher() {
  const { currency, isLoading, error, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected =
    CURRENCIES.find((item) => item.code === currency) ?? CURRENCIES[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Ganti mata uang"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full px-2.5 py-2 text-sm text-text hover:bg-border/40">
        <span className="text-base leading-none">{selected.flag}</span>
        <span className="hidden font-medium sm:inline">{selected.code}</span>
        <ChevronDown className="h-3.5 w-3.5 text-text-secondary" />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-40 rounded-lg border border-border bg-surface py-1 shadow-lg">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => {
                setCurrency(c.code);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text hover:bg-border/40">
              <span className="text-base leading-none">{c.flag}</span>
              <span>{c.label}</span>
              {currency === c.code ? (
                <span className="ml-auto text-xs text-primary">✓</span>
              ) : null}
            </button>
          ))}
          {isLoading || error ? (
            <p className="border-t border-border px-3 py-2 text-xs text-text-secondary">
              {isLoading ? "Memuat kurs..." : error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
