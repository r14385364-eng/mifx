import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDownToLine,
  Bell,
  ChevronDown,
  Gift,
  Users,
  Info,
  LineChart,
  Newspaper,
  Wallet,
} from "lucide-react";

import { BottomNav } from "@/components/BottomNav";
import { ShortcutMenu, type ShortcutItem } from "@/components/ShortcutMenu";
import { SymbolIcon } from "@/components/SymbolIcon";
import { newsArticles } from "@/lib/news-data";
import { usePopularInstruments } from "@/lib/popular-market";
import { defaultSignals, useHomeSignals, type TradingSignal } from "@/lib/signals-data";

export const Route = createFileRoute("/beranda")({
  head: () => ({
    meta: [
      { title: "Beranda — MIFX" },
      {
        name: "description",
        content:
          "Pantau pasar, sinyal trading, berita terkini, dan event ekonomi penting di beranda MIFX.",
      },
      { property: "og:title", content: "Beranda — MIFX" },
      {
        property: "og:description",
        content:
          "Pantau pasar, sinyal trading, berita terkini, dan event ekonomi penting di beranda MIFX.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BerandaPage,
});

/* ------------------------------- Mock data ------------------------------- */

const shortcuts: ShortcutItem[] = [
  { label: "Top Up", icon: Wallet, to: "/deposit" },
  { label: "Withdraw", icon: ArrowDownToLine, to: "/withdraw" },
  { label: "Trending", icon: LineChart },
  { label: "Referral", icon: Users, to: "/referral" },
  { label: "Berita", icon: Newspaper, to: "/berita" },
  { label: "Rewards", icon: Gift },
];

const promos = [
  {
    title: "Kini Hadir Di MIFX LEVERAGE 1:500",
    gradient: "from-sky-900 via-cyan-800 to-sky-950",
  },
  {
    title: "Promo Swap Free Trading Tanpa Biaya Inap",
    gradient: "from-emerald-800 via-teal-700 to-emerald-900",
  },
  {
    title: "Ajukan Akun Real & Dapatkan Bonus Deposit",
    gradient: "from-indigo-900 via-violet-800 to-indigo-950",
  },
];

const events = [
  {
    country: "Amerika Serikat",
    flag: "🇺🇸",
    time: "21:00",
    title: "Richmond Fed Manufacturing Index SEP",
    forecast: "5",
    previous: "4",
  },
  {
    country: "Amerika Serikat",
    flag: "🇺🇸",
    time: "21:00",
    title: "S&P Global Services PMI Flash SEP",
    forecast: "56",
    previous: "56",
  },
];

const news = newsArticles.slice(0, 4);

/** Data demo yang selalu tampil jika belum ada sinyal yang diatur admin. */
const demoSignals = defaultSignals.filter((signal) => signal.showOnHome);

/* ------------------------------- Components ------------------------------ */

function Logo() {
  return (
    <div className="flex items-center gap-1.5" aria-label="MIFX">
      <span className="flex items-end gap-[2px]">
        <span className="h-4 w-[4px] -skew-x-12 rounded-[1px] bg-primary" />
        <span className="h-3 w-[4px] -skew-x-12 rounded-[1px] bg-amber-400" />
        <span className="h-2 w-[4px] -skew-x-12 rounded-[1px] bg-slate-400" />
      </span>
      <span className="text-lg font-extrabold italic tracking-tight text-foreground">MIFX</span>
    </div>
  );
}

function AccountCard() {
  return (
    <section className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-foreground">1006568912</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-lg font-bold leading-tight text-foreground">$10,000.00</p>
          <p className="text-xs text-muted-foreground">Balance</p>
        </div>
        <div>
          <p className="text-lg font-bold leading-tight text-foreground">$10,000.00</p>
          <p className="text-xs text-muted-foreground">Equity</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { label: "Free Margin", value: "$10,000.00" },
          { label: "Margin", value: "$0.00" },
          { label: "Margin Level", value: "0.00%" },
        ].map((item) => (
          <div key={item.label}>
            <p className="text-sm font-semibold text-foreground">{item.value}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              {item.label}
              <Info className="h-3 w-3" />
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ShortcutGrid() {
  return <ShortcutMenu items={shortcuts} />;
}

function PopulerSection() {
  const popular = usePopularInstruments();

  return (
    <section>
      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-3 text-sm">
          <span className="font-semibold text-foreground">Populer</span>
          <span className="text-muted-foreground">Top Bullish</span>
          <span className="text-muted-foreground">Top Bearish</span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        {popular.map((inst) => (
          <Link
            key={inst.symbol}
            to="/trade"
            search={{ symbol: inst.symbol }}
            className="relative rounded-xl border bg-card p-3 shadow-sm transition-colors hover:bg-muted/40"
          >
            <SymbolIcon symbol={inst.symbol} size={24} />
            <p className="mt-2 text-sm font-semibold text-foreground">{inst.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {inst.price}{" "}
              <span className={inst.up ? "text-primary" : "text-red-500"}>{inst.change}</span>
            </p>
          </Link>
        ))}
        {popular.length === 0 ? (
          <p className="col-span-2 rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">
            Belum ada produk populer.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function PromoCarousel() {
  return (
    <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {promos.map((promo) => (
        <div
          key={promo.title}
          className={`relative flex h-32 w-[85%] shrink-0 snap-center flex-col justify-end overflow-hidden rounded-xl bg-gradient-to-br ${promo.gradient} p-4`}
        >
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">
            MIFX
          </span>
          <p className="max-w-[75%] text-sm font-bold leading-snug text-white">{promo.title}</p>
          <span className="absolute -right-4 -top-6 h-24 w-24 rounded-full bg-white/10" />
          <span className="absolute -bottom-8 right-10 h-20 w-20 rounded-full bg-white/5" />
        </div>
      ))}
    </div>
  );
}

function SignalCard({ signal }: { signal: TradingSignal }) {
  const isBuy = signal.variant === "buy";
  return (
    <div className="w-[240px] shrink-0 snap-start rounded-xl border bg-card p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <SymbolIcon symbol={signal.name} size={26} />
        <div>
          <p className="text-sm font-semibold leading-tight text-foreground">{signal.name}</p>
          <p className="text-[11px] text-muted-foreground">{signal.time}</p>
        </div>
      </div>

      {/* Chart placeholder */}
      <div className={`mt-2 h-24 rounded-lg ${isBuy ? "bg-sky-50" : "bg-rose-50"} p-2`}>
        <svg
          viewBox="0 0 200 80"
          className="h-full w-full"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {isBuy ? (
            <path
              d="M0 70 L25 55 L45 62 L70 40 L95 48 L120 28 L150 34 L175 15 L200 8"
              fill="none"
              stroke="#0891b2"
              strokeWidth="2"
            />
          ) : (
            <path
              d="M0 15 L25 25 L45 18 L70 38 L95 30 L120 48 L150 42 L175 62 L200 70"
              fill="none"
              stroke="#e11d48"
              strokeWidth="2"
            />
          )}
        </svg>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <p className="text-muted-foreground">Take Profit</p>
          <p className="font-semibold text-foreground">{signal.takeProfit}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Stop Loss</p>
          <p className="font-semibold text-foreground">{signal.stopLoss}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Sumber</p>
          <p className="font-semibold text-foreground">{signal.source}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Timeframe</p>
          <p className="font-semibold text-foreground">{signal.timeframe}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => e.preventDefault()}
        className={`mt-3 w-full rounded-lg py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 ${
          isBuy ? "bg-blue-500" : "bg-rose-500"
        }`}
      >
        {signal.action}
      </button>
    </div>
  );
}

function SignalSection() {
  const homeSignals = useHomeSignals();
  const displaySignals = homeSignals.length > 0 ? homeSignals : demoSignals;
  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-base font-semibold text-foreground">
          Signal Produk Terpopuler
          <Info className="h-3.5 w-3.5 text-muted-foreground" />
        </h2>
        <button type="button" className="text-xs font-medium text-primary">
          Lihat Semua
        </button>
      </div>
      <div className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {displaySignals.map((signal) => (
          <SignalCard key={signal.id} signal={signal} />
        ))}
      </div>
    </section>
  );
}

function EventSection() {
  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-base font-semibold text-foreground">
          Event Ekonomi Penting
          <Info className="h-3.5 w-3.5 text-muted-foreground" />
        </h2>
        <button
          type="button"
          className="flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium text-foreground"
        >
          Gold
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>
      <div className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {events.map((event) => (
          <div
            key={event.title}
            className="w-[280px] shrink-0 snap-start rounded-xl border bg-card p-3 shadow-sm"
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5">
                <span>{event.flag}</span>
                <span className="text-muted-foreground">{event.country}</span>
                <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                  Upcoming
                </span>
              </span>
              <span className="text-muted-foreground">{event.time}</span>
            </div>
            <p className="mt-2 text-sm font-semibold leading-snug text-foreground">{event.title}</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
              <div className="rounded-lg bg-muted py-2">
                <p className="text-muted-foreground">Actual</p>
                <p className="font-semibold text-foreground">-</p>
              </div>
              <div className="rounded-lg bg-muted py-2">
                <p className="text-muted-foreground">Forecast</p>
                <p className="font-semibold text-foreground">{event.forecast}</p>
              </div>
              <div className="rounded-lg bg-muted py-2">
                <p className="text-muted-foreground">Previous</p>
                <p className="font-semibold text-foreground">{event.previous}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function NewsSection() {
  return (
    <section>
      <h2 className="text-base font-semibold text-foreground">Berita Terkini</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Berita pasar terbaru yang membantu Anda tetap update dengan pergerakan harga produk dan
        kondisi pasar saat ini.
      </p>
      <div className="mt-3 flex flex-col gap-3">
        {news.map((item) => (
          <Link
            key={item.slug}
            to="/berita/$slug"
            params={{ slug: item.slug }}
            className="rounded-xl border bg-card p-3 shadow-sm transition-colors hover:bg-muted/40"
          >
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-600">
              ⚡ {item.tag}
            </span>
            <div className="mt-2 flex gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold leading-snug text-foreground">{item.title}</h3>
                <p className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  {item.tickers.map((t) => (
                    <span key={t.label}>
                      {t.label}{" "}
                      <span className={t.up ? "text-primary" : "text-red-500"}>{t.change}</span>
                    </span>
                  ))}
                </p>
              </div>
              <img
                src={item.image}
                alt={item.title}
                loading="lazy"
                className="h-16 w-20 shrink-0 rounded-lg object-cover"
              />
            </div>
            <p className="mt-2 text-right text-[11px] text-muted-foreground">{item.time}</p>
          </Link>
        ))}
      </div>
      <Link
        to="/berita"
        className="mt-4 block w-full rounded-xl border py-3 text-center text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        Lihat Semua
      </Link>
    </section>
  );
}

/* --------------------------------- Page ---------------------------------- */

function BerandaPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-muted/40">
      {/* Header */}
      <header className="flex items-center justify-between bg-background px-4 py-3">
        <Logo />
        <button
          type="button"
          aria-label="Notifikasi"
          className="relative rounded-full p-1.5 hover:bg-muted"
        >
          <Bell className="h-5 w-5 text-foreground" />
          <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-red-500" />
        </button>
      </header>

      {/* Content */}
      <main className="flex flex-col gap-5 px-4 py-4 pb-6">
        <AccountCard />
        <ShortcutGrid />
        <PopulerSection />
        <PromoCarousel />
        <SignalSection />
        <EventSection />
        <NewsSection />
      </main>

      <BottomNav active="Beranda" />
    </div>
  );
}
