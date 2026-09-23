import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronLeft,
  Activity,
  CandlestickChart,
  LineChart,
  AreaChart,
  BarChart,
  Pencil,
  Settings,
  Clock,
  Check,
  RotateCcw,
  Sliders,
  Maximize2,
  Crosshair,
  TrendingUp,
  Minus,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useCallback, useState } from "react";

import { BottomNav } from "@/components/BottomNav";
import { seedCandles, tickCandles, type Candle } from "@/lib/price-sim";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/trade")({
  validateSearch: (search: Record<string, unknown>) => ({
    symbol: typeof search["symbol"] === "string" ? (search["symbol"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Trade — Gotrade" },
      {
        name: "description",
        content:
          "Grafik harga, harga jual dan beli, serta alat analisa untuk transaksi di Gotrade.",
      },
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
const timeframes = ["1m", "5m", "15m", "30m", "1H", "4H", "1D"] as const;

type ChartType = "Candlestick" | "Garis" | "Area" | "Bar" | "HeikinAshi";

const timeframeConfig: Record<
  string,
  { count: number; volatility: number; tickMs: number; ticksPerCandle: number }
> = {
  "1m": { count: 60, volatility: 0.0004, tickMs: 700, ticksPerCandle: 4 },
  "5m": { count: 54, volatility: 0.0009, tickMs: 900, ticksPerCandle: 6 },
  "15m": { count: 50, volatility: 0.0012, tickMs: 950, ticksPerCandle: 7 },
  "30m": { count: 48, volatility: 0.0015, tickMs: 1000, ticksPerCandle: 8 },
  "1H": { count: 42, volatility: 0.0024, tickMs: 1200, ticksPerCandle: 10 },
  "4H": { count: 38, volatility: 0.0038, tickMs: 1400, ticksPerCandle: 12 },
  "1D": { count: 36, volatility: 0.0055, tickMs: 1500, ticksPerCandle: 14 },
};

function InteractiveChart({
  candles,
  decimals,
  chartType,
  showMA,
  showEMA,
  showBollinger,
  showGrid,
  activeDrawingTool,
}: {
  candles: Candle[];
  decimals: number;
  chartType: ChartType;
  showMA: boolean;
  showEMA: boolean;
  showBollinger: boolean;
  showGrid: boolean;
  activeDrawingTool: string | null;
}) {
  const width = 360;
  const height = 380;
  const padRight = 50;
  const plotWidth = width - padRight;

  const { min, max } = useMemo(() => {
    const lows = candles.map((c) => c.low);
    const highs = candles.map((c) => c.high);
    const lo = Math.min(...lows);
    const hi = Math.max(...highs);
    const pad = (hi - lo) * 0.12 || 1;
    return { min: lo - pad, max: hi + pad };
  }, [candles]);

  const y = useCallback(
    (value: number) => height - ((value - min) / (max - min)) * height,
    [min, max],
  );
  const step = plotWidth / Math.max(candles.length, 1);
  const bodyWidth = Math.max(step * 0.6, 1.8);
  const last = candles[candles.length - 1]!;
  const gridValues = Array.from({ length: 8 }, (_, i) => min + ((max - min) / 7) * i);

  // Compute Moving Average 14
  const ma14Points = useMemo(() => {
    const period = 10;
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < candles.length; i++) {
      if (i < period - 1) continue;
      const slice = candles.slice(i - period + 1, i + 1);
      const avg = slice.reduce((sum, c) => sum + c.close, 0) / period;
      const x = i * step + step / 2;
      points.push({ x, y: y(avg) });
    }
    return points;
  }, [candles, step, y]);

  // Compute EMA 20
  const emaPoints = useMemo(() => {
    const period = 20;
    const points: { x: number; y: number }[] = [];
    let prevEma = candles[0].close;
    const k = 2 / (period + 1);

    for (let i = 0; i < candles.length; i++) {
      const close = candles[i].close;
      const currentEma = close * k + prevEma * (1 - k);
      prevEma = currentEma;
      if (i >= 5) {
        const x = i * step + step / 2;
        points.push({ x, y: y(currentEma) });
      }
    }
    return points;
  }, [candles, step, y]);

  const pathD = useMemo(() => {
    return candles
      .map((c, i) => `${i === 0 ? "M" : "L"} ${i * step + step / 2} ${y(c.close)}`)
      .join(" ");
  }, [candles, step, y]);

  const areaD = useMemo(() => {
    if (candles.length === 0) return "";
    const firstX = step / 2;
    const lastX = (candles.length - 1) * step + step / 2;
    return `${pathD} L ${lastX} ${height} L ${firstX} ${height} Z`;
  }, [pathD, candles, step]);

  return (
    <div className="relative w-full overflow-hidden rounded-md border bg-card/60 p-1">
      {/* TradingView TV Watermark / Badge Top Left */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 rounded-full bg-background/90 px-2 py-0.5 text-[11px] font-bold shadow-xs border text-foreground">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-black text-white">
          TV
        </span>
        <span>TradingView</span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[380px] w-full"
        role="img"
        aria-label="Grafik TradingView Interaktif"
      >
        {/* Grid lines */}
        {showGrid &&
          gridValues.map((value) => (
            <g key={value}>
              <line
                x1={0}
                x2={plotWidth}
                y1={y(value)}
                y2={y(value)}
                className="stroke-border/60"
                strokeWidth={0.5}
                strokeDasharray="2 2"
              />
              <text
                x={plotWidth + 4}
                y={y(value) + 3}
                className="fill-muted-foreground font-mono"
                fontSize={8}
              >
                {value.toFixed(decimals)}
              </text>
            </g>
          ))}

        {/* Chart Types */}
        {chartType === "Area" && (
          <>
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#2563eb" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <path d={areaD} fill="url(#areaGradient)" />
            <path d={pathD} fill="none" stroke="#2563eb" strokeWidth={1.8} />
          </>
        )}

        {chartType === "Garis" && <path d={pathD} fill="none" stroke="#10b981" strokeWidth={1.8} />}

        {(chartType === "Candlestick" || chartType === "HeikinAshi") &&
          candles.map((candle, index) => {
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
                  rx={0.5}
                />
              </g>
            );
          })}

        {chartType === "Bar" &&
          candles.map((candle, index) => {
            const x = index * step + step / 2;
            const up = candle.close >= candle.open;
            const color = up ? "#12a76b" : "#e04b4b";
            return (
              <g key={candle.time}>
                <line
                  x1={x}
                  x2={x}
                  y1={y(candle.high)}
                  y2={y(candle.low)}
                  stroke={color}
                  strokeWidth={1.2}
                />
                {/* Left tick open */}
                <line
                  x1={x - 2}
                  x2={x}
                  y1={y(candle.open)}
                  y2={y(candle.open)}
                  stroke={color}
                  strokeWidth={1.2}
                />
                {/* Right tick close */}
                <line
                  x1={x}
                  x2={x + 2}
                  y1={y(candle.close)}
                  y2={y(candle.close)}
                  stroke={color}
                  strokeWidth={1.2}
                />
              </g>
            );
          })}

        {/* Indicators Overlay */}
        {showMA && ma14Points.length > 1 && (
          <path
            d={ma14Points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={1.5}
          />
        )}

        {showEMA && emaPoints.length > 1 && (
          <path
            d={emaPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")}
            fill="none"
            stroke="#8b5cf6"
            strokeWidth={1.5}
            strokeDasharray="4 2"
          />
        )}

        {showBollinger && ma14Points.length > 1 && (
          <>
            <path
              d={ma14Points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y - 14}`).join(" ")}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={1}
              strokeDasharray="2 2"
            />
            <path
              d={ma14Points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y + 14}`).join(" ")}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={1}
              strokeDasharray="2 2"
            />
          </>
        )}

        {/* Drawing Tools Overlay */}
        {activeDrawingTool === "trendline" && (
          <line
            x1={10}
            y1={height - 50}
            x2={plotWidth - 10}
            y2={50}
            stroke="#3b82f6"
            strokeWidth={1.5}
          />
        )}

        {activeDrawingTool === "horizontal" && (
          <line
            x1={0}
            x2={plotWidth}
            y1={y(last.close)}
            y2={y(last.close)}
            stroke="#10b981"
            strokeWidth={1.2}
          />
        )}

        {/* Price Tracking Line & Label */}
        <line
          x1={0}
          x2={plotWidth}
          y1={y(last.close)}
          y2={y(last.close)}
          stroke="#e04b4b"
          strokeWidth={0.8}
          strokeDasharray="3 3"
        />
        <rect
          x={plotWidth}
          y={y(last.close) - 8}
          width={padRight}
          height={16}
          fill="#e04b4b"
          rx={3}
        />
        <text
          x={plotWidth + 4}
          y={y(last.close) + 3.5}
          fill="#ffffff"
          fontSize={8}
          fontWeight="bold"
        >
          {last.close.toFixed(decimals)}
        </text>
      </svg>
    </div>
  );
}

function TradePage() {
  const { symbol } = Route.useSearch();
  const key = symbol && instruments[symbol] ? symbol : "XAUUSD";
  const instrument = instruments[key]!;

  const [tab, setTab] = useState<(typeof tabs)[number]>("Grafik");
  const [timeframe, setTimeframe] = useState<string>("30m");
  const [chartType, setChartType] = useState<ChartType>("Candlestick");

  // Chart Indicators & Settings
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showMA, setShowMA] = useState(true);
  const [showEMA, setShowEMA] = useState(false);
  const [showBollinger, setShowBollinger] = useState(false);
  const [activeDrawingTool, setActiveDrawingTool] = useState<string | null>(null);

  // Dialog State Popups for Toolbar Items
  const [activeDialog, setActiveDialog] = useState<
    "timeframe" | "chartType" | "indicators" | "drawing" | "settings" | null
  >(null);

  const config = timeframeConfig[timeframe] || timeframeConfig["30m"];
  const [candles, setCandles] = useState<Candle[]>(() =>
    seedCandles(instrument.price, config.count, config.volatility),
  );

  // Regenerate candles when timeframe or instrument changes
  useEffect(() => {
    setCandles(seedCandles(instrument.price, config.count, config.volatility));
  }, [instrument.price, config.count, config.volatility]);

  // Real-time tick simulation (toggled by top-left switch)
  useEffect(() => {
    if (!isAutoScroll) return;
    let ticks = 0;
    const id = setInterval(() => {
      ticks += 1;
      setCandles((prev) =>
        tickCandles(prev, ticks % config.ticksPerCandle === 0, config.volatility / 2),
      );
    }, config.tickMs);
    return () => clearInterval(id);
  }, [key, isAutoScroll, config.tickMs, config.ticksPerCandle, config.volatility]);

  const last = candles[candles.length - 1]!;
  const first = candles[0]!;
  const price = last.close;
  const change = price - first.open;
  const changePct = (change / first.open) * 100;
  const up = change >= 0;

  const sell = price - instrument.spread / 2;
  const buy = price + instrument.spread / 2;

  // Formatting date and time for scale header
  const now = new Date();
  const dayDate = now.getDate().toString();
  const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

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

      {/* Sell / Buy quick execution */}
      <div className="grid grid-cols-2 gap-2 px-3 py-3">
        <button
          type="button"
          className="rounded-md bg-rose-600 py-2 text-center text-white transition-opacity hover:opacity-90 shadow-xs"
        >
          <span className="block text-xs font-semibold">SELL</span>
          <span className="block text-sm font-bold tabular-nums">
            {sell.toFixed(instrument.decimals)}
          </span>
        </button>
        <button
          type="button"
          className="rounded-md bg-blue-600 py-2 text-center text-white transition-opacity hover:opacity-90 shadow-xs"
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
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  {instrument.label} · {timeframe} · MT5
                </p>
                <p className={`text-xs font-medium ${up ? "text-emerald-600" : "text-rose-600"}`}>
                  {price.toFixed(instrument.decimals)} {up ? "+" : ""}
                  {change.toFixed(instrument.decimals)} ({changePct.toFixed(2)}%)
                </p>
              </div>
            </div>

            {/* Main Interactive Chart */}
            <InteractiveChart
              candles={candles}
              decimals={instrument.decimals}
              chartType={chartType}
              showMA={showMA}
              showEMA={showEMA}
              showBollinger={showBollinger}
              showGrid={showGrid}
              activeDrawingTool={activeDrawingTool}
            />

            {/* ========================================================================= */}
            {/* TRADINGVIEW CHART TOOLBAR (MATCHING USER screenshot)                       */}
            {/* ========================================================================= */}
            <div className="mt-2 rounded-xl border bg-card p-2 shadow-xs space-y-2">
              {/* TOP SUB-ROW: Toggle switch, date 22, time 12:00, reset icon */}
              <div className="flex items-center justify-between border-b pb-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  {/* Green Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => setIsAutoScroll(!isAutoScroll)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      isAutoScroll ? "bg-emerald-600" : "bg-muted-foreground/30"
                    }`}
                    title="Toggle auto-scroll & realtime tick"
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        isAutoScroll ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Date & Time Markers */}
                <div className="flex items-center gap-6 font-mono text-xs font-semibold text-foreground">
                  <span>{dayDate}</span>
                  <span>{timeStr}</span>
                </div>

                {/* Reset Crosshair / Clock Target Icon */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveDrawingTool(null);
                    setCandles(seedCandles(instrument.price, config.count, config.volatility));
                  }}
                  className="rounded-full p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Reset Skala & Grafik"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>

              {/* BOTTOM SUB-ROW: Floating Toolbar Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-0.5">
                {/* 1. Timeframe Button: [ 30m ] */}
                <button
                  type="button"
                  onClick={() => setActiveDialog("timeframe")}
                  className="inline-flex items-center justify-center rounded-lg border bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-2xs hover:bg-accent transition-colors"
                >
                  {timeframe}
                </button>

                {/* 2. Chart Type Button: [ 🕯 Tipe Grafik ] */}
                <button
                  type="button"
                  onClick={() => setActiveDialog("chartType")}
                  className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-2xs hover:bg-accent transition-colors"
                >
                  <CandlestickChart className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Tipe Grafik</span>
                </button>

                {/* 3. Indicators Button: [ 〰 Indikator ] */}
                <button
                  type="button"
                  onClick={() => setActiveDialog("indicators")}
                  className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-2xs hover:bg-accent transition-colors"
                >
                  <Activity className="h-3.5 w-3.5 text-blue-600" />
                  <span>Indikator</span>
                </button>

                {/* 4. Drawing Tools Button: [ ✎ ] */}
                <button
                  type="button"
                  onClick={() => setActiveDialog("drawing")}
                  className={`inline-flex items-center justify-center rounded-lg border px-2.5 py-1.5 text-xs shadow-2xs transition-colors ${
                    activeDrawingTool
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-background text-foreground hover:bg-accent"
                  }`}
                  title="Alat Gambar / Drawing Tools"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>

                {/* 5. Chart Settings Button: [ ⚙ ] */}
                <button
                  type="button"
                  onClick={() => setActiveDialog("settings")}
                  className="inline-flex items-center justify-center rounded-lg border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground shadow-2xs hover:bg-accent transition-colors"
                  title="Pengaturan Grafik"
                >
                  <Settings className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              Pergerakan harga pada grafik ini merupakan simulasi pasar.
            </p>
          </>
        ) : (
          <div className="flex h-56 items-center justify-center rounded-xl border text-sm text-muted-foreground">
            {tab} belum tersedia.
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* DIALOG POPUPS FOR TOOLBAR ITEMS                                           */}
      {/* ========================================================================= */}

      {/* 1. Timeframe Dialog */}
      <Dialog
        open={activeDialog === "timeframe"}
        onOpenChange={(open) => !open && setActiveDialog(null)}
      >
        <DialogContent className="max-w-xs rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-primary" />
              Pilih Timeframe
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2 py-2">
            {timeframes.map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => {
                  setTimeframe(tf);
                  setActiveDialog(null);
                }}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                  timeframe === tf ? "border-primary bg-primary/10 text-primary" : "hover:bg-accent"
                }`}
              >
                <span>{tf}</span>
                {timeframe === tf && <Check className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. Chart Type Dialog */}
      <Dialog
        open={activeDialog === "chartType"}
        onOpenChange={(open) => !open && setActiveDialog(null)}
      >
        <DialogContent className="max-w-xs rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <CandlestickChart className="h-4 w-4 text-emerald-600" />
              Tipe Grafik Harga
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-1 py-2">
            {[
              {
                id: "Candlestick",
                label: "Candlestick (Lilin)",
                icon: CandlestickChart,
              },
              { id: "Garis", label: "Garis (Line)", icon: LineChart },
              { id: "Area", label: "Area Gradient", icon: AreaChart },
              { id: "Bar", label: "OHLC Bar Chart", icon: BarChart },
              { id: "HeikinAshi", label: "Heikin-Ashi", icon: Sparkles },
            ].map((item) => {
              const IconComp = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setChartType(item.id as ChartType);
                    setActiveDialog(null);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    chartType === item.id ? "bg-primary/10 text-primary" : "hover:bg-accent"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <IconComp className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  {chartType === item.id && <Check className="h-4 w-4" />}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* 3. Indicators Dialog */}
      <Dialog
        open={activeDialog === "indicators"}
        onOpenChange={(open) => !open && setActiveDialog(null)}
      >
        <DialogContent className="max-w-xs rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-blue-600" />
              Indikator Teknikal
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <button
              type="button"
              onClick={() => setShowMA(!showMA)}
              className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                showMA ? "border-amber-500 bg-amber-500/10 text-amber-600" : "hover:bg-accent"
              }`}
            >
              <span>Moving Average (MA 14)</span>
              {showMA ? <Check className="h-4 w-4" /> : <PlusIcon />}
            </button>

            <button
              type="button"
              onClick={() => setShowEMA(!showEMA)}
              className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                showEMA ? "border-purple-500 bg-purple-500/10 text-purple-600" : "hover:bg-accent"
              }`}
            >
              <span>Exponential MA (EMA 20)</span>
              {showEMA ? <Check className="h-4 w-4" /> : <PlusIcon />}
            </button>

            <button
              type="button"
              onClick={() => setShowBollinger(!showBollinger)}
              className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                showBollinger ? "border-blue-500 bg-blue-500/10 text-blue-600" : "hover:bg-accent"
              }`}
            >
              <span>Bollinger Bands</span>
              {showBollinger ? <Check className="h-4 w-4" /> : <PlusIcon />}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 4. Drawing Tools Dialog */}
      <Dialog
        open={activeDialog === "drawing"}
        onOpenChange={(open) => !open && setActiveDialog(null)}
      >
        <DialogContent className="max-w-xs rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Pencil className="h-4 w-4 text-primary" />
              Alat Gambar & Analisis
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            {[
              { id: "trendline", label: "Garis Tren (Trendline)", icon: TrendingUp },
              { id: "horizontal", label: "Garis Horizontal Level", icon: Minus },
              { id: "crosshair", label: "Crosshair Pointer", icon: Crosshair },
            ].map((tool) => {
              const IconComp = tool.icon;
              const isActive = activeDrawingTool === tool.id;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => {
                    setActiveDrawingTool(isActive ? null : tool.id);
                    setActiveDialog(null);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? "border-primary bg-primary/10 text-primary" : "hover:bg-accent"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <IconComp className="h-4 w-4" />
                    <span>{tool.label}</span>
                  </div>
                  {isActive && <Check className="h-4 w-4" />}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* 5. Settings Dialog */}
      <Dialog
        open={activeDialog === "settings"}
        onOpenChange={(open) => !open && setActiveDialog(null)}
      >
        <DialogContent className="max-w-xs rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Settings className="h-4 w-4 text-foreground" />
              Pengaturan Grafik
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm">
            <div className="flex items-center justify-between border-b pb-2">
              <span>Tampilkan Grid Line</span>
              <button
                type="button"
                onClick={() => setShowGrid(!showGrid)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  showGrid ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                    showGrid ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between border-b pb-2">
              <span>Update Realtime</span>
              <button
                type="button"
                onClick={() => setIsAutoScroll(!isAutoScroll)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  isAutoScroll ? "bg-emerald-600" : "bg-muted"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                    isAutoScroll ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav active="Trade" />
    </div>
  );
}

function PlusIcon() {
  return <span className="text-xs font-semibold text-muted-foreground">+ Add</span>;
}
