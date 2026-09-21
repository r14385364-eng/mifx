import { useSyncExternalStore } from "react";

export type PopularInstrument = {
  symbol: string;
  name: string;
  flag: string;
  price: string;
  change: string;
  up: boolean;
};

const STORAGE_KEY = "mifx.popular-instruments";

export const flagBySymbol: Record<string, string> = {
  EURUSD: "🇪🇺",
  GBPUSD: "🇬🇧",
  USDJPY: "🇯🇵",
  NIKKEI: "🇯🇵",
  NASDAQ: "🇺🇸",
  XAUUSD: "🪙",
  OIL: "🛢️",
  BTCUSD: "₿",
};

export const defaultPopular: PopularInstrument[] = [
  { symbol: "NIKKEI", name: "Nikkei", flag: "🇯🇵", price: "64943", change: "+0.29%", up: true },
  { symbol: "NASDAQ", name: "Nasdaq", flag: "🇺🇸", price: "29954", change: "+0.79%", up: true },
  { symbol: "GBPUSD", name: "GBPUSD", flag: "🇬🇧", price: "1.33862", change: "+0.26%", up: true },
  { symbol: "EURUSD", name: "EURUSD", flag: "🇪🇺", price: "1.14832", change: "-0.09%", up: false },
];

let current: PopularInstrument[] = defaultPopular;
let hydrated = false;
const listeners = new Set<() => void>();

function readStorage(): PopularInstrument[] {
  if (typeof window === "undefined") return defaultPopular;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPopular;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PopularInstrument[]) : defaultPopular;
  } catch {
    return defaultPopular;
  }
}

function emit() {
  listeners.forEach((listener) => listener());
}

export function getPopularInstruments(): PopularInstrument[] {
  if (!hydrated && typeof window !== "undefined") {
    hydrated = true;
    current = readStorage();
  }
  return current;
}

export function setPopularInstruments(next: PopularInstrument[]) {
  hydrated = true;
  current = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }
  emit();
}

export function togglePopularInstrument(instrument: PopularInstrument, popular: boolean) {
  const rest = getPopularInstruments().filter((item) => item.symbol !== instrument.symbol);
  setPopularInstruments(popular ? [...rest, instrument] : rest);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function usePopularInstruments(): PopularInstrument[] {
  return useSyncExternalStore(subscribe, getPopularInstruments, () => defaultPopular);
}
