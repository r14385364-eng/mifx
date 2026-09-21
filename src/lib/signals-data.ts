import { useSyncExternalStore } from "react";

export type TradingSignal = {
  id: number;
  name: string;
  flag: string;
  time: string;
  takeProfit: string;
  stopLoss: string;
  source: string;
  timeframe: string;
  action: string;
  variant: "buy" | "sell";
  showOnHome: boolean;
};

export const defaultSignals: TradingSignal[] = [
  {
    id: 1,
    name: "Gold",
    flag: "🪙",
    time: "03:06",
    takeProfit: "4418.20",
    stopLoss: "4342.80",
    source: "Autochartist",
    timeframe: "30 menit",
    action: "Potensi Buy",
    variant: "buy",
    showOnHome: true,
  },
  {
    id: 2,
    name: "EURUSD",
    flag: "🇪🇺",
    time: "02:35",
    takeProfit: "1.14520",
    stopLoss: "1.15120",
    source: "Trading Central",
    timeframe: "30 menit",
    action: "Potensi Sell",
    variant: "sell",
    showOnHome: true,
  },
  {
    id: 3,
    name: "USDJPY",
    flag: "🇯🇵",
    time: "01:10",
    takeProfit: "158.400",
    stopLoss: "157.900",
    source: "Trading Central",
    timeframe: "30 menit",
    action: "Potensi Sell",
    variant: "sell",
    showOnHome: true,
  },
  {
    id: 4,
    name: "NASDAQ",
    flag: "🇺🇸",
    time: "00:42",
    takeProfit: "30150.00",
    stopLoss: "29720.00",
    source: "Autochartist",
    timeframe: "1 jam",
    action: "Potensi Buy",
    variant: "buy",
    showOnHome: false,
  },
];

let currentSignals: TradingSignal[] = defaultSignals;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

async function loadFromApi() {
  try {
    const res = await fetch("/api/signals");
    const data = await res.json();
    if (res.ok && data.success && Array.isArray(data.signals) && data.signals.length > 0) {
      type RawSignal = {
        id: string;
        symbol: string;
        action: string;
        entry_price: number | string;
        tp1: number | string;
        sl: number | string;
        timeframe: string;
        status: string;
      };
      const mapped: TradingSignal[] = (data.signals as RawSignal[]).map((s, idx) => ({
        id: idx + 1,
        name: s.symbol || "Asset",
        flag: s.symbol?.includes("EUR") ? "🇪🇺" : s.symbol?.includes("JPY") ? "🇯🇵" : "🪙",
        time: "Baru saja",
        takeProfit: String(s.tp1 || "0.00"),
        stopLoss: String(s.sl || "0.00"),
        source: "Autochartist",
        timeframe: s.timeframe || "30 menit",
        action: s.action?.toLowerCase().includes("buy") ? "Potensi Buy" : "Potensi Sell",
        variant: s.action?.toLowerCase().includes("buy") ? "buy" : "sell",
        showOnHome: true,
      }));
      if (mapped.length > 0) {
        currentSignals = mapped;
        emit();
      }
    }
  } catch {
    // keep current signals
  }
}

// Initial fetch from API
if (typeof window !== "undefined") {
  void loadFromApi();
}

export function saveSignals(signals: TradingSignal[]) {
  currentSignals = signals;
  emit();
  // Asynchronously push changes to backend
  void fetch("/api/signals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      symbol: signals[0]?.name || "XAUUSD",
      category: "Forex",
      action: signals[0]?.variant === "buy" ? "BUY" : "SELL",
      entryPrice: 1.0,
      tp1: parseFloat(signals[0]?.takeProfit || "0") || 1.1,
      tp2: 1.2,
      sl: parseFloat(signals[0]?.stopLoss || "0") || 0.9,
    }),
  }).catch(() => {});
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function useSignals(): TradingSignal[] {
  return useSyncExternalStore(
    subscribe,
    () => currentSignals,
    () => defaultSignals,
  );
}

export function useHomeSignals(): TradingSignal[] {
  const signals = useSignals();
  return signals.filter((signal) => signal.showOnHome);
}
