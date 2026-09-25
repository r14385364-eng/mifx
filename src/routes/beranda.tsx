import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowDownToLine,
  Bell,
  ChevronDown,
  History,
  Users,
  Info,
  LineChart,
  Newspaper,
  Wallet,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BottomNav } from "@/components/BottomNav";
import { ShortcutMenu, type ShortcutItem } from "@/components/ShortcutMenu";
import { SymbolIcon } from "@/components/SymbolIcon";
import { newsArticles } from "@/lib/news-data";
import { usePopularInstruments } from "@/lib/popular-market";
import { defaultSignals, useHomeSignals, type TradingSignal } from "@/lib/signals-data";
import { useAuth } from "@/lib/auth-context";
import { AppLogo } from "@/components/AppLogo";
import { NotificationModal } from "@/components/NotificationModal";
import { useNotifications } from "@/lib/notifications";

export const Route = createFileRoute("/beranda")({
  head: () => ({
    meta: [
      { title: "Beranda — Gotrade" },
      {
        name: "description",
        content:
          "Pantau pasar, sinyal trading, berita terkini, dan event ekonomi penting di beranda Gotrade.",
      },
    ],
  }),
  component: BerandaPage,
});

/* ------------------------------- Data & Navigasi ------------------------------- */

const shortcuts: ShortcutItem[] = [
  { label: "Top Up", icon: Wallet, to: "/deposit" },
  { label: "Withdraw", icon: ArrowDownToLine, to: "/withdraw" },
  { label: "Trending", icon: LineChart },
  { label: "Referral", icon: Users, to: "/referral" },
  { label: "Berita", icon: Newspaper, to: "/berita" },
  { label: "Riwayat", icon: History, to: "/riwayat" },
];

const promos = [
  {
    title: "Kini Hadir Di Gotrade LEVERAGE 1:500",
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

/** Data standar yang selalu tampil jika belum ada sinyal yang diatur admin. */
const fallbackSignals = defaultSignals.filter((signal) => signal.showOnHome);

/* ------------------------------- Components ------------------------------ */

function Logo() {
  return <AppLogo size="sm" />;
}

function AccountCard() {
  const { user } = useAuth();
  const [dailyRate, setDailyRate] = useState<number>(5);
  const [infoModal, setInfoModal] = useState<{ title: string; desc: string } | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings?.global_daily_profit_rate) {
          const r = Number(data.settings.global_daily_profit_rate);
          if (!isNaN(r)) setDailyRate(r);
        }
      })
      .catch(() => {});
  }, []);

  const rawBalance = user?.balance != null ? Number(user.balance) : 0; // Total Saldo Gabungan
  const rawProfit = user?.profit != null ? Number(user.profit) : 0; // Akumulasi Profit Total
  const depositBalance = Math.max(0, rawBalance - rawProfit);
  const estimatedDailyGain = Math.round(depositBalance * (dailyRate / 100) * 100) / 100; // Estimasi Profit Hari Ini

  const formattedBalance = `$${rawBalance.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  const formattedEquity = `$${rawProfit.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  const formattedFreeMargin = `$${estimatedDailyGain.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  const formattedMarginLevel = `${dailyRate.toFixed(2)}%`;

  return (
    <section className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
      {/* Top Row: Balance & Equity */}
      <div className="flex items-start justify-between">
        <div className="grid grid-cols-2 gap-4 flex-1">
          <div>
            <p className="text-base font-bold text-foreground tabular-nums">{formattedBalance}</p>
            <p className="text-xs text-muted-foreground">Balance</p>
          </div>
          <div>
            <p className="text-base font-bold text-foreground tabular-nums">{formattedEquity}</p>
            <p className="text-xs text-muted-foreground">Equity</p>
          </div>
        </div>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary shrink-0 ml-2">
          {user?.role === "admin" ? "Admin" : "Live"}
        </span>
      </div>

      {/* Bottom Row: Free Margin, Margin, Margin Level */}
      <div className="grid grid-cols-3 gap-2 border-t pt-2.5 text-xs">
        <div>
          <p className="font-bold text-foreground tabular-nums">{formattedFreeMargin}</p>
          <button
            type="button"
            onClick={() =>
              setInfoModal({
                title: "Free Margin (Estimasi Profit Hari Ini)",
                desc: `Estimasi pertambahan profit trading hari ini sebesar $${estimatedDailyGain.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} dihitung berdasarkan rate profit harian global (${dailyRate}%).`,
              })
            }
            className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5 hover:text-foreground text-left cursor-pointer transition-colors"
          >
            <span>Free Margin</span>
            <Info className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
        <div>
          <p className="font-bold text-foreground tabular-nums">$0.00</p>
          <button
            type="button"
            onClick={() =>
              setInfoModal({
                title: "Margin",
                desc: "Jumlah jaminan margin dana saat posisi trading sedang aktif terbuka.",
              })
            }
            className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5 hover:text-foreground text-left cursor-pointer transition-colors"
          >
            <span>Margin</span>
            <Info className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
        <div>
          <p className="font-bold text-foreground tabular-nums">{formattedMarginLevel}</p>
          <button
            type="button"
            onClick={() =>
              setInfoModal({
                title: "Margin Level (Rate Profit Harian Global)",
                desc: `Persentase acuan rate profit harian global saat ini (${dailyRate.toFixed(2)}%) dari menu admin/profit untuk seluruh pengguna.`,
              })
            }
            className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5 hover:text-foreground text-left cursor-pointer transition-colors"
          >
            <span>Margin Level</span>
            <Info className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Info Dialog */}
      <Dialog open={!!infoModal} onOpenChange={(open) => !open && setInfoModal(null)}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">{infoModal?.title}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1.5 leading-relaxed">
              {infoModal?.desc}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
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
            Gotrade
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
  const displaySignals = homeSignals.length > 0 ? homeSignals : fallbackSignals;
  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-base font-semibold text-foreground">
          Signal Produk Terpopuler
          <Info className="h-3.5 w-3.5 text-muted-foreground" />
        </h2>
        <Link to="/pasar" className="text-xs font-medium text-primary hover:underline">
          Lihat Semua
        </Link>
      </div>
      {displaySignals.length > 0 ? (
        <div className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {displaySignals.map((signal) => (
            <SignalCard key={signal.id} signal={signal} />
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">
          Belum ada sinyal trading aktif.
        </p>
      )}
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
  const { user, isAdmin, isAuthenticated } = useAuth();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const { unreadCount } = useNotifications();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-muted/40">
      {/* Header */}
      <header className="flex items-center justify-between bg-background px-4 py-3">
        <Logo />
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              to="/admin"
              className="rounded-full bg-purple-500/15 px-2.5 py-1 text-xs font-bold text-purple-600 hover:bg-purple-500/25"
            >
              Admin Panel
            </Link>
          )}
          {!isAuthenticated && (
            <Link
              to="/login"
              className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20"
            >
              Masuk
            </Link>
          )}
          <button
            type="button"
            aria-label="Notifikasi"
            onClick={() => setIsNotifOpen(true)}
            className="relative rounded-full p-1.5 hover:bg-muted transition-colors cursor-pointer"
          >
            <Bell className="h-5 w-5 text-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-xs">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        </div>
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

      {/* User Notification Sheet/Modal */}
      <NotificationModal isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </div>
  );
}
