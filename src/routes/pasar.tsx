import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownUp, ChevronDown, Loader2, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { BottomNav } from "@/components/BottomNav";
import { SymbolIcon } from "@/components/SymbolIcon";
import { useAuth } from "@/lib/auth-context";
import { nextPrice } from "@/lib/price-sim";

export const Route = createFileRoute("/pasar")({
  head: () => ({
    meta: [
      { title: "Pasar — Gotrade" },
      {
        name: "description",
        content:
          "Lihat harga bid dan ask untuk pasangan forex, komoditi, dan indeks di halaman Pasar Gotrade.",
      },
      { property: "og:title", content: "Pasar — Gotrade" },
      {
        property: "og:description",
        content: "Harga bid dan ask untuk forex, komoditi, dan indeks di Gotrade.",
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
  // Forex
  {
    symbol: "AUDCAD",
    flags: "🇦🇺🇨🇦",
    price: 0.99564,
    decimals: 5,
    spread: 147,
    percent: 92,
    category: "Forex",
  },
  {
    symbol: "AUDCHF",
    flags: "🇦🇺🇨🇭",
    price: 0.58522,
    decimals: 5,
    spread: 118,
    percent: 83,
    category: "Forex",
  },
  {
    symbol: "AUDJPY",
    flags: "🇦🇺🇯🇵",
    price: 111.696,
    decimals: 3,
    spread: 169,
    percent: 98,
    category: "Forex",
  },
  {
    symbol: "AUDNZD",
    flags: "🇦🇺🇳🇿",
    price: 1.24371,
    decimals: 5,
    spread: 257,
    percent: 68,
    category: "Forex",
  },
  {
    symbol: "AUDUSD",
    flags: "🇦🇺🇺🇸",
    price: 0.71217,
    decimals: 5,
    spread: 75,
    percent: 97,
    category: "Forex",
  },
  {
    symbol: "CHFJPY",
    flags: "🇨🇭🇯🇵",
    price: 190.771,
    decimals: 3,
    spread: 234,
    percent: 69,
    category: "Forex",
  },
  {
    symbol: "EURAUD",
    flags: "🇪🇺🇦🇺",
    price: 1.61083,
    decimals: 5,
    spread: 224,
    percent: 80,
    category: "Forex",
  },
  {
    symbol: "EURCAD",
    flags: "🇪🇺🇨🇦",
    price: 1.60519,
    decimals: 5,
    spread: 181,
    percent: 63,
    category: "Forex",
  },
  {
    symbol: "EURCHF",
    flags: "🇪🇺🇨🇭",
    price: 0.94218,
    decimals: 5,
    spread: 112,
    percent: 75,
    category: "Forex",
  },
  {
    symbol: "EURGBP",
    flags: "🇪🇺🇬🇧",
    price: 0.85781,
    decimals: 5,
    spread: 95,
    percent: 78,
    category: "Forex",
  },
  {
    symbol: "EURJPY",
    flags: "🇪🇺🇯🇵",
    price: 179.845,
    decimals: 3,
    spread: 145,
    percent: 89,
    category: "Forex",
  },
  {
    symbol: "EURNZD",
    flags: "🇪🇺🇳🇿",
    price: 2.00284,
    decimals: 5,
    spread: 260,
    percent: 65,
    category: "Forex",
  },
  {
    symbol: "EURUSD",
    flags: "🇪🇺🇺🇸",
    price: 1.14832,
    decimals: 5,
    spread: 69,
    percent: 74,
    category: "Forex",
  },
  {
    symbol: "GBPAUD",
    flags: "🇬🇧🇦🇺",
    price: 1.87824,
    decimals: 5,
    spread: 235,
    percent: 84,
    category: "Forex",
  },
  {
    symbol: "GBPCAD",
    flags: "🇬🇧🇨🇦",
    price: 1.87129,
    decimals: 5,
    spread: 210,
    percent: 70,
    category: "Forex",
  },
  {
    symbol: "GBPCHF",
    flags: "🇬🇧🇨🇭",
    price: 1.09842,
    decimals: 5,
    spread: 140,
    percent: 76,
    category: "Forex",
  },
  {
    symbol: "GBPJPY",
    flags: "🇬🇧🇯🇵",
    price: 209.681,
    decimals: 3,
    spread: 185,
    percent: 94,
    category: "Forex",
  },
  {
    symbol: "GBPNZD",
    flags: "🇬🇧🇳🇿",
    price: 2.33512,
    decimals: 5,
    spread: 290,
    percent: 62,
    category: "Forex",
  },
  {
    symbol: "GBPUSD",
    flags: "🇬🇧🇺🇸",
    price: 1.33862,
    decimals: 5,
    spread: 79,
    percent: 88,
    category: "Forex",
  },
  {
    symbol: "NZDUSD",
    flags: "🇳🇿🇺🇸",
    price: 0.57314,
    decimals: 5,
    spread: 92,
    percent: 82,
    category: "Forex",
  },
  {
    symbol: "USDCAD",
    flags: "🇺🇸🇨🇦",
    price: 1.39785,
    decimals: 5,
    spread: 88,
    percent: 86,
    category: "Forex",
  },
  {
    symbol: "USDCHF",
    flags: "🇺🇸🇨🇭",
    price: 0.82054,
    decimals: 5,
    spread: 85,
    percent: 79,
    category: "Forex",
  },
  {
    symbol: "USDJPY",
    flags: "🇺🇸🇯🇵",
    price: 156.612,
    decimals: 3,
    spread: 72,
    percent: 96,
    category: "Forex",
  },
  {
    symbol: "USDSGD",
    flags: "🇺🇸🇸🇬",
    price: 1.3125,
    decimals: 5,
    spread: 120,
    percent: 71,
    category: "Forex",
  },

  // Komoditi
  {
    symbol: "XAUUSD",
    flags: "🪙",
    price: 4377.23,
    decimals: 2,
    spread: 45,
    percent: 91,
    category: "Komoditi",
  },
  {
    symbol: "XAGUSD",
    flags: "🥈",
    price: 48.312,
    decimals: 3,
    spread: 53,
    percent: 72,
    category: "Komoditi",
  },
  {
    symbol: "OIL",
    flags: "🛢️",
    price: 99.51,
    decimals: 2,
    spread: 70,
    percent: 66,
    category: "Komoditi",
  },
  {
    symbol: "BRENT",
    flags: "🛢️",
    price: 104.28,
    decimals: 2,
    spread: 75,
    percent: 81,
    category: "Komoditi",
  },
  {
    symbol: "NGAS",
    flags: "🔥",
    price: 3.482,
    decimals: 3,
    spread: 60,
    percent: 65,
    category: "Komoditi",
  },
  {
    symbol: "COPPER",
    flags: "🧱",
    price: 4.892,
    decimals: 3,
    spread: 58,
    percent: 74,
    category: "Komoditi",
  },
  {
    symbol: "PLATINUM",
    flags: "⚪",
    price: 1085.4,
    decimals: 2,
    spread: 80,
    percent: 69,
    category: "Komoditi",
  },
  {
    symbol: "PALLADIUM",
    flags: "🪙",
    price: 1120.8,
    decimals: 2,
    spread: 95,
    percent: 63,
    category: "Komoditi",
  },

  // Index
  {
    symbol: "NASDAQ",
    flags: "🇺🇸",
    price: 29954,
    decimals: 0,
    spread: 60,
    percent: 95,
    category: "Index",
  },
  {
    symbol: "NIKKEI",
    flags: "🇯🇵",
    price: 64943,
    decimals: 0,
    spread: 150,
    percent: 77,
    category: "Index",
  },
  {
    symbol: "HANGSENG",
    flags: "🇭🇰",
    price: 25411,
    decimals: 0,
    spread: 140,
    percent: 61,
    category: "Index",
  },
  {
    symbol: "SP500",
    flags: "🇺🇸",
    price: 6042,
    decimals: 1,
    spread: 45,
    percent: 93,
    category: "Index",
  },
  {
    symbol: "DOWJONES",
    flags: "🇺🇸",
    price: 44820,
    decimals: 0,
    spread: 70,
    percent: 89,
    category: "Index",
  },
  {
    symbol: "DAX",
    flags: "🇪🇺",
    price: 20150,
    decimals: 1,
    spread: 80,
    percent: 84,
    category: "Index",
  },
  {
    symbol: "FTSE100",
    flags: "🇬🇧",
    price: 8430,
    decimals: 1,
    spread: 65,
    percent: 79,
    category: "Index",
  },
  {
    symbol: "CAC40",
    flags: "🇪🇺",
    price: 7620,
    decimals: 1,
    spread: 75,
    percent: 73,
    category: "Index",
  },
  {
    symbol: "ASX200",
    flags: "🇦🇺",
    price: 8540,
    decimals: 1,
    spread: 90,
    percent: 70,
    category: "Index",
  },
];

const tabs = ["Forex", "Komoditi", "Index"] as const;
const PAGE_SIZE = 6;

type Quote = { price: number; open: number; low: number; high: number };

/** Semua harga di halaman ini adalah simulasi yang bergerak naik-turun. */
function useQuotes() {
  const [quotes, setQuotes] = useState<Record<string, Quote>>(() =>
    Object.fromEntries(
      baseProducts.map((p) => [
        p.symbol,
        { price: p.price, open: p.price, low: p.price * 0.997, high: p.price * 1.003 },
      ]),
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
  const changeUsd = Math.abs(
    (quote.price - quote.open) * (base.decimals >= 3 ? 10000 : 10),
  ).toFixed(2);
  const action = up ? "Buy" : "Sell";

  return (
    <Link
      to="/trade"
      search={{ symbol: base.symbol }}
      className="relative isolate flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5 shadow-sm transition-colors hover:bg-muted/40"
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
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const { user } = useAuth();
  const balance = user?.balance != null ? `$${user.balance.toLocaleString()}` : "$10,000.00";
  const accountNumber = user?.accountNumber || "1006568912";
  const quotes = useQuotes();

  // Reset pagination when switching tabs or search query
  const handleTabChange = (newTab: (typeof tabs)[number]) => {
    setTab(newTab);
    setVisibleCount(PAGE_SIZE);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setVisibleCount(PAGE_SIZE);
  };

  const list = useMemo(() => {
    return baseProducts.filter((p) => {
      const matchCategory = p.category === tab;
      const matchSearch =
        !searchQuery.trim() || p.symbol.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchCategory && matchSearch;
    });
  }, [tab, searchQuery]);

  const visibleList = useMemo(() => {
    return list.slice(0, visibleCount);
  }, [list, visibleCount]);

  const hasMore = visibleCount < list.length;
  const remaining = Math.max(0, list.length - visibleCount);
  const nextLoadCount = Math.min(PAGE_SIZE, remaining);

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    // Smooth user feedback
    setTimeout(() => {
      setVisibleCount((prev) => prev + PAGE_SIZE);
      setIsLoadingMore(false);
    }, 250);
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-muted/40">
      <header className="sticky top-0 z-30 border-b bg-background/95 px-4 pb-2 pt-3 backdrop-blur-xs">
        <div className="flex items-center justify-between">
          <span className="flex items-end gap-[2px]" aria-label="MIFX">
            <span className="h-4 w-[4px] -skew-x-12 rounded-[1px] bg-primary" />
            <span className="h-3 w-[4px] -skew-x-12 rounded-[1px] bg-amber-400" />
            <span className="h-2 w-[4px] -skew-x-12 rounded-[1px] bg-slate-400" />
          </span>

          <div className="text-center">
            <p className="text-base font-bold leading-tight text-foreground">{balance}</p>
            <button
              type="button"
              className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground"
            >
              {accountNumber}
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>

          <button
            type="button"
            aria-label="Cari produk"
            onClick={() => setShowSearch((prev) => !prev)}
            className={`rounded-full p-1.5 transition-colors ${
              showSearch ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
            }`}
          >
            <Search className="h-5 w-5" />
          </button>
        </div>

        {/* Search Bar Collapsible */}
        {showSearch && (
          <div className="mt-2.5 flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-1.5">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Cari simbol (contoh: EUR, GOLD, US)..."
              className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="rounded p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        <div className="mt-3 flex items-center gap-2 text-sm">
          {tabs.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => handleTabChange(item)}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 font-medium transition-colors ${
                tab === item
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-2 px-3 py-3">
        {list.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="text-sm font-medium text-foreground">Tidak ada produk ditemukan</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Coba gunakan kata kunci pencarian atau kategori lain.
            </p>
          </div>
        ) : (
          <>
            {visibleList.map((base) => (
              <ProductRow key={base.symbol} base={base} quote={quotes[base.symbol]!} />
            ))}

            {/* Load More Button & Status */}
            {hasMore ? (
              <div className="mt-2 flex flex-col items-center gap-2 pt-1 pb-4">
                <button
                  type="button"
                  id="load-more-btn"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/25 bg-card py-3 px-4 text-sm font-semibold text-primary shadow-xs transition-all hover:bg-primary/5 active:scale-[0.99] disabled:opacity-60"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Memuat {nextLoadCount} kartu berikutnya...</span>
                    </>
                  ) : (
                    <>
                      <span>Muat Lebih Banyak (+{nextLoadCount})</span>
                      <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </button>
                <p className="text-[11px] text-muted-foreground">
                  Menampilkan {visibleList.length} dari {list.length} instrumen {tab}
                </p>
              </div>
            ) : list.length > PAGE_SIZE ? (
              <p className="py-3 text-center text-xs text-muted-foreground">
                Semua {list.length} produk {tab} telah ditampilkan
              </p>
            ) : null}
          </>
        )}
      </main>

      <BottomNav active="Pasar" />
    </div>
  );
}
