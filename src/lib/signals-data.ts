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

const STORAGE_KEY = "mifx.trading-signals";
const EVENT = "mifx-signals-changed";

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

let cache: TradingSignal[] | null = null;

function load(): TradingSignal[] {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as TradingSignal[]) : defaultSignals;
  } catch {
    cache = defaultSignals;
  }
  return cache;
}

export function saveSignals(signals: TradingSignal[]) {
  cache = signals;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(signals));
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function useSignals(): TradingSignal[] {
  return useSyncExternalStore(subscribe, load, () => defaultSignals);
}

export function useHomeSignals(): TradingSignal[] {
  const signals = useSignals();
  return signals.filter((signal) => signal.showOnHome);
}
