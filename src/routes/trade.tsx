import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown, ChevronLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { BottomNav } from "@/components/BottomNav";
import { seedCandles, tickCandles, type Candle } from "@/lib/price-sim";

export const Route = createFileRoute("/trade")({
  validateSearch: (search: Record<string, unknown>) => ({
    symbol: typeof search["symbol"] === "string" ? (search["symbol"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Trade — MIFX" },
      {
        name: "description",
        content: "Grafik harga, harga jual dan beli, serta alat analisa untuk transaksi di MIFX.",
      },
      { property: "og:title", content: "Trade — MIFX" },
      {
        property: "og:description",
        content: "Grafik harga bergerak, harga jual dan beli, serta alat analisa di MIFX.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TradePage,
});

const instruments: Record<
  string,
  { label: string; price: number; decimals: number; spread: number }
> = {
  // Forex
  AUDCAD: { label: "AUDCAD", price: 0.99564, decimals: 5, spread: 0.00015 },
  AUDCHF: { label: "AUDCHF", price: 0.58522, decimals: 5, spread: 0.00012 },
  AUDJPY: { label: "AUDJPY", price: 111.696, decimals: 3, spread: 0.017 },
  AUDNZD: { label: "AUDNZD", price: 1.24371, decimals: 5, spread: 0.00026 },
  AUDUSD: { label: "AUDUSD", price: 0.71217, decimals: 5, spread: 0.00008 },
  CHFJPY: { label: "CHFJPY", price: 190.771, decimals: 3, spread: 0.023 },
  EURAUD: { label: "EURAUD", price: 1.61083, decimals: 5, spread: 0.00022 },
  EURCAD: { label: "EURCAD", price: 1.60519, decimals: 5, spread: 0.00018 },
  EURUSD: { label: "EURUSD", price: 1.14832, decimals: 5, spread: 0.00008 },
  GBPUSD: { label: "GBPUSD", price: 1.33862, decimals: 5, spread: 0.00009 },
  USDJPY: { label: "USDJPY", price: 157.42, decimals: 3, spread: 0.015 },
  // Komoditi
  XAUUSD: { label: "Gold", price: 4377.23, decimals: 2, spread: 1.53 },
  XAGUSD: { label: "Silver", price: 48.312, decimals: 3, spread: 0.025 },
  OIL: { label: "Oil", price: 99.51, decimals: 2, spread: 0.06 },
  BTCUSD: { label: "Bitcoin", price: 112400, decimals: 0, spread: 45 },
  // Index
  NASDAQ: { label: "Nasdaq", price: 29954, decimals: 0, spread: 6 },
  NIKKEI: { label: "Nikkei", price: 64943, decimals: 0, spread: 15 },
  HANGSENG: { label: "Hang Seng", price: 25411, decimals: 0, spread: 14 },
};

const tabs = ["Grafik", "Info Produk", "Signal", "Sentiment", "Berita", "Kalender"] as const;
const timeframes = ["1m", "5m", "30m", "1H", "1D"] as const;

// Setelan simulasi tiap timeframe: jumlah candle, volatilitas, kecepatan tick,
// dan berapa tick sebelum candle baru dibuat.
const timeframeConfig: Record<
  (typeof timeframes)[number],
  { count: number; volatility: number; tickMs: number; ticksPerCandle: number }
> = {
  "1m": { count: 60, volatility: 0.0004, tickMs: 700, ticksPerCandle: 4 },
  "5m": { count: 54, volatility: 0.0009, tickMs: 900, ticksPerCandle: 6 },
  "30m": { count: 48, volatility: 0.0015, tickMs: 1000, ticksPerCandle: 8 },
  "1H": { count: 42, volatility: 0.0024, tickMs: 1200, ticksPerCandle: 10 },
  "1D": { count: 36, volatility: 0.0055, tickMs: 1500, ticksPerCandle: 14 },
};

function Chart({ candles, decimals }: { candles: Candle[]; decimals: number }) {
  const width = 360;
  const height = 300;
  const padRight = 46;
  const plotWidth = width - padRight;

  const { min, max } = useMemo(() => {
    const lows = candles.map((c) => c.low);
    const highs = candles.map((c) => c.high);
    const lo = Math.min(...lows);
    const hi = Math.max(...highs);
    const pad = (hi - lo) * 0.12 || 1;
    return { min: lo - pad, max: hi + pad };
  }, [candles]);

  const y = (value: number) => height - ((value - min) / (max - min)) * height;
  const step = plotWidth / Math.max(candles.length, 1);
  const bodyWidth = Math.max(step * 0.6, 1.5);
  const last = candles[candles.length - 1]!;
  const gridValues = Array.from({ length: 6 }, (_, i) => min + ((max - min) / 5) * i);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-[300px] w-full"
      role="img"
      aria-label="Grafik harga simulasi"
    >
      {gridValues.map((value) => (
        <g key={value}>
          <line
            x1={0}
            x2={plotWidth}
            y1={y(value)}
            y2={y(value)}
            className="stroke-border"
            strokeWidth={0.5}
          />
          <text x={plotWidth + 4} y={y(value) + 3} className="fill-muted-foreground" fontSize={8}>
            {value.toFixed(decimals)}
          </text>
        </g>
      ))}

      {candles.map((candle, index) => {
        const x = index * step + step / 2;
        const up = candle.close >= candle.open;
        const color = up ? "#12a76b" : "#e04b4b";
        const top = y(Math.max(candle.open, candle.close));
        const bottom = y(Math.min(candle.open, candle.close));
        return (
          <g key={candle.time}>
            <line
              x1={x}
              x2={x}
              y1={y(candle.high)}
              y2={y(candle.low)}
              stroke={color}
              strokeWidth={1}
            />
            <rect
              x={x - bodyWidth / 2}
              y={top}
              width={bodyWidth}
              height={Math.max(bottom - top, 1)}
              fill={color}
            />
          </g>
        );
      })}

      <line
        x1={0}
        x2={plotWidth}
        y1={y(last.close)}
        y2={y(last.close)}
        stroke="#e04b4b"
        strokeWidth={0.6}
        strokeDasharray="3 3"
      />
      <rect
        x={plotWidth}
        y={y(last.close) - 7}
        width={padRight}
        height={14}
        fill="#e04b4b"
        rx={2}
      />
      <text x={plotWidth + 3} y={y(last.close) + 3.5} fill="#ffffff" fontSize={8}>
        {last.close.toFixed(decimals)}
      </text>
    </svg>
  );
}

function TradePage() {
  const { symbol } = Route.useSearch();
  const key = symbol && instruments[symbol] ? symbol : "XAUUSD";
  const instrument = instruments[key]!;

  const [tab, setTab] = useState<(typeof tabs)[number]>("Grafik");
  const [timeframe, setTimeframe] = useState<(typeof timeframes)[number]>("30m");
  const config = timeframeConfig[timeframe];
  const [candles, setCandles] = useState<Candle[]>(() =>
    seedCandles(instrument.price, timeframeConfig["30m"].count, timeframeConfig["30m"].volatility),
  );

  // Ganti timeframe atau produk: bangun ulang grafik sesuai setelan.
  useEffect(() => {
    setCandles(seedCandles(instrument.price, config.count, config.volatility));
  }, [instrument.price, config.count, config.volatility]);

  // Simulasi: harga bergerak naik-turun mengikuti kecepatan timeframe.
  useEffect(() => {
    let ticks = 0;
    const id = setInterval(() => {
      ticks += 1;
      setCandles((prev) =>
        tickCandles(prev, ticks % config.ticksPerCandle === 0, config.volatility / 2),
      );
    }, config.tickMs);
    return () => clearInterval(id);
  }, [key, config.tickMs, config.ticksPerCandle, config.volatility]);

  const last = candles[candles.length - 1]!;
  const first = candles[0]!;
  const price = last.close;
  const change = price - first.open;
  const changePct = (change / first.open) * 100;
  const up = change >= 0;

  const sell = price - instrument.spread / 2;
  const buy = price + instrument.spread / 2;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <header className="flex items-center justify-between border-b px-3 py-3">
        <div className="flex items-center gap-2">
          <Link
            to="/pasar"
            aria-label="Kembali ke Pasar"
            className="rounded-full p-1 hover:bg-muted"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <button type="button" className="flex items-center gap-1 text-base font-semibold">
            {instrument.label}
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </header>

      <nav className="flex gap-4 overflow-x-auto border-b px-3 text-sm">
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`whitespace-nowrap border-b-2 py-2.5 font-medium transition-colors ${
              tab === item
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground"
            }`}
          >
            {item}
          </button>
        ))}
      </nav>

      <div className="grid grid-cols-2 gap-2 px-3 py-3">
        <button
          type="button"
          className="rounded-md bg-rose-600 py-2 text-center text-white transition-opacity hover:opacity-90"
        >
          <span className="block text-xs font-semibold">SELL</span>
          <span className="block text-sm font-bold tabular-nums">
            {sell.toFixed(instrument.decimals)}
          </span>
        </button>
        <button
          type="button"
          className="rounded-md bg-blue-600 py-2 text-center text-white transition-opacity hover:opacity-90"
        >
          <span className="block text-xs font-semibold">BUY</span>
          <span className="block text-sm font-bold tabular-nums">
            {buy.toFixed(instrument.decimals)}
          </span>
        </button>
      </div>

      <main className="flex-1 px-3 pb-3">
        {tab === "Grafik" ? (
          <>
            <p className="text-xs text-muted-foreground">
              {instrument.label} · {timeframe} · MT5
            </p>
            <p className={`text-xs font-medium ${up ? "text-emerald-600" : "text-rose-600"}`}>
              {price.toFixed(instrument.decimals)} {up ? "+" : ""}
              {change.toFixed(instrument.decimals)} ({changePct.toFixed(2)}%)
            </p>
            <Chart candles={candles} decimals={instrument.decimals} />
            <p className="text-center text-[10px] text-muted-foreground">
              Pergerakan harga pada grafik ini merupakan simulasi.
            </p>
          </>
        ) : (
          <div className="flex h-56 items-center justify-center rounded-xl border text-sm text-muted-foreground">
            {tab} belum tersedia.
          </div>
        )}
      </main>

      <div className="flex items-center justify-between gap-2 border-t px-3 py-2">
        <div className="flex gap-1">
          {timeframes.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTimeframe(item)}
              className={`rounded-md border px-2 py-1 text-[11px] font-medium ${
                timeframe === item ? "border-primary text-primary" : "text-muted-foreground"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground">Timeframe: {timeframe}</span>
      </div>

      <BottomNav active="Trade" />
    </div>
  );
}
