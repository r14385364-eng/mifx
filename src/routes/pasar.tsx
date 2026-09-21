import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownUp, ChevronDown, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { BottomNav } from "@/components/BottomNav";
import { SymbolIcon } from "@/components/SymbolIcon";
import { nextPrice } from "@/lib/price-sim";

export const Route = createFileRoute("/pasar")({
  head: () => ({
    meta: [
      { title: "Pasar — MIFX" },
      {
        name: "description",
        content:
          "Lihat harga bid dan ask untuk pasangan forex, komoditi, dan indeks di halaman Pasar MIFX.",
      },
      { property: "og:title", content: "Pasar — MIFX" },
      {
        property: "og:description",
        content: "Harga bid dan ask untuk forex, komoditi, dan indeks di MIFX.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PasarPage,
});

type Base = {
  symbol: string;
  flags: string;
  price: number;
  decimals: number;
  spread: number;
  percent: number;
  category: "Forex" | "Komoditi" | "Index";
};

const baseProducts: Base[] = [
  { symbol: "AUDCAD", flags: "🇦🇺🇨🇦", price: 0.99564, decimals: 5, spread: 147, percent: 92, category: "Forex" },
  { symbol: "AUDCHF", flags: "🇦🇺🇨🇭", price: 0.58522, decimals: 5, spread: 118, percent: 83, category: "Forex" },
  { symbol: "AUDJPY", flags: "🇦🇺🇯🇵", price: 111.696, decimals: 3, spread: 169, percent: 98, category: "Forex" },
  { symbol: "AUDNZD", flags: "🇦🇺🇳🇿", price: 1.24371, decimals: 5, spread: 257, percent: 68, category: "Forex" },
  { symbol: "AUDUSD", flags: "🇦🇺🇺🇸", price: 0.71217, decimals: 5, spread: 75, percent: 97, category: "Forex" },
  { symbol: "CHFJPY", flags: "🇨🇭🇯🇵", price: 190.771, decimals: 3, spread: 234, percent: 69, category: "Forex" },
  { symbol: "EURAUD", flags: "🇪🇺🇦🇺", price: 1.61083, decimals: 5, spread: 224, percent: 80, category: "Forex" },
  { symbol: "EURCAD", flags: "🇪🇺🇨🇦", price: 1.60519, decimals: 5, spread: 181, percent: 63, category: "Forex" },
  { symbol: "EURUSD", flags: "🇪🇺🇺🇸", price: 1.14832, decimals: 5, spread: 69, percent: 74, category: "Forex" },
  { symbol: "GBPUSD", flags: "🇬🇧🇺🇸", price: 1.33862, decimals: 5, spread: 79, percent: 88, category: "Forex" },
  { symbol: "XAUUSD", flags: "🪙", price: 4377.23, decimals: 2, spread: 45, percent: 91, category: "Komoditi" },
  { symbol: "XAGUSD", flags: "🥈", price: 48.312, decimals: 3, spread: 53, percent: 72, category: "Komoditi" },
  { symbol: "OIL", flags: "🛢️", price: 99.51, decimals: 2, spread: 70, percent: 66, category: "Komoditi" },
  { symbol: "NASDAQ", flags: "🇺🇸", price: 29954, decimals: 0, spread: 60, percent: 95, category: "Index" },
  { symbol: "NIKKEI", flags: "🇯🇵", price: 64943, decimals: 0, spread: 150, percent: 77, category: "Index" },
  { symbol: "HANGSENG", flags: "🇭🇰", price: 25411, decimals: 0, spread: 140, percent: 61, category: "Index" },
];

const tabs = ["Forex", "Komoditi", "Index"] as const;

type Quote = { price: number; open: number; low: number; high: number };

/** Semua harga di halaman ini adalah simulasi yang bergerak naik-turun. */
function useQuotes() {
  const [quotes, setQuotes] = useState<Record<string, Quote>>(() =>
    Object.fromEntries(
      baseProducts.map((p) => [p.symbol, { price: p.price, open: p.price, low: p.price * 0.997, high: p.price * 1.003 }]),
    ),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setQuotes((prev) => {
        const next: Record<string, Quote> = {};
        for (const [symbol, q] of Object.entries(prev)) {
          const price = nextPrice(q.price);
          next[symbol] = {
            ...q,
            price,
            low: Math.min(q.low, price),
            high: Math.max(q.high, price),
          };
        }
        return next;
      });
    }, 1200);
    return () => clearInterval(id);
  }, []);

  return quotes;
}

function ProductRow({ base, quote }: { base: Base; quote: Quote }) {
  const bid = quote.price;
  const ask = quote.price * (1 + base.spread / 1_000_000);
  const changePct = ((quote.price - quote.open) / quote.open) * 100;
  const up = changePct >= 0;
  const changeUsd = Math.abs((quote.price - quote.open) * (base.decimals >= 3 ? 10000 : 10)).toFixed(2);
  const action = up ? "Buy" : "Sell";

  return (
    <Link
      to="/trade"
      search={{ symbol: base.symbol }}
      className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5 shadow-sm transition-colors hover:bg-muted/40"
    >
      <SymbolIcon symbol={base.symbol} size={26} />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-foreground">{base.symbol}</p>
        <p className="mt-0.5 flex items-center gap-1 text-[11px]">
          <span className={up ? "text-primary" : "text-red-500"}>●</span>
          <span className={up ? "text-primary" : "text-red-500"}>${changeUsd}</span>
          <span className="text-muted-foreground">/ 0.1 Lot</span>
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Bid: <span className="font-medium text-foreground">{bid.toFixed(base.decimals)}</span>
          <span className="ml-2">
            Ask: <span className="font-medium text-foreground">{ask.toFixed(base.decimals)}</span>
          </span>
        </p>
        <p className="text-[10px] text-muted-foreground">
          L: {quote.low.toFixed(base.decimals)} &nbsp; H: {quote.high.toFixed(base.decimals)}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-md bg-muted px-1.5 py-1 text-[11px] font-medium text-foreground">
            <ArrowDownUp className="h-3 w-3" />
            {base.spread}
          </span>
          <span
            className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold text-white ${
              up ? "bg-blue-500" : "bg-rose-500"
            }`}
          >
            {action} {base.percent}%
          </span>
        </div>
      </div>
    </Link>
  );
}

function PasarPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Forex");
  const quotes = useQuotes();
  const list = useMemo(() => baseProducts.filter((p) => p.category === tab), [tab]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-muted/40">
      <header className="sticky top-0 z-10 bg-background px-4 pb-2 pt-3">
        <div className="flex items-center justify-between">
          <span className="flex items-end gap-[2px]" aria-label="MIFX">
            <span className="h-4 w-[4px] -skew-x-12 rounded-[1px] bg-primary" />
            <span className="h-3 w-[4px] -skew-x-12 rounded-[1px] bg-amber-400" />
            <span className="h-2 w-[4px] -skew-x-12 rounded-[1px] bg-slate-400" />
          </span>

          <div className="text-center">
            <p className="text-base font-bold leading-tight text-foreground">$10,000.00</p>
            <button type="button" className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              1006568912
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>

          <button type="button" aria-label="Cari produk" className="rounded-full p-1.5 hover:bg-muted">
            <Search className="h-5 w-5 text-foreground" />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2 text-sm">
          {tabs.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 font-medium transition-colors ${
                tab === item ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-2 px-3 py-3">
        {list.length === 0 ? (
          <p className="mt-16 text-center text-sm text-muted-foreground">Belum ada produk di kategori ini.</p>
        ) : (
          list.map((base) => <ProductRow key={base.symbol} base={base} quote={quotes[base.symbol]!} />)
        )}
      </main>

      <BottomNav active="Pasar" />
    </div>
  );
}
