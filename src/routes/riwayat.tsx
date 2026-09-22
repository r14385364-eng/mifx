import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpFromLine,
  CheckCircle2,
  Clock,
  Filter,
  History,
  Search,
  TrendingDown,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/riwayat")({
  head: () => ({
    meta: [
      { title: "Riwayat Transaksi — Gotrade" },
      {
        name: "description",
        content:
          "Lihat catatan lengkap riwayat transaksi trading, deposit, dan withdraw di Gotrade.",
      },
      { property: "og:title", content: "Riwayat Transaksi — Gotrade" },
      {
        property: "og:description",
        content:
          "Lihat catatan lengkap riwayat transaksi trading, deposit, dan withdraw di Gotrade.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RiwayatPage,
});

type TransactionItem = {
  id: string;
  type: "Top Up" | "Withdraw" | "Buy" | "Sell";
  title: string;
  channel: string;
  amount: string;
  amountRaw: number;
  isPositive: boolean;
  date: string;
  status: "Selesai" | "Diproses" | "Gagal";
};

type ApiTransaction = {
  id?: number | string;
  type?: string;
  channel?: string;
  amount?: number;
  created_at?: string;
  status?: string;
};

const initialTransactions: TransactionItem[] = [
  {
    id: "TX-98421",
    type: "Top Up",
    title: "Deposit QRIS BCA",
    channel: "QRIS Bank BCA",
    amount: "+ Rp1.000.000",
    amountRaw: 1000000,
    isPositive: true,
    date: "21 Sep 2026, 14:20",
    status: "Selesai",
  },
  {
    id: "TX-98418",
    type: "Buy",
    title: "Buy 0.1 Lot XAUUSD",
    channel: "MetaTrader 5",
    amount: "+ $145.20",
    amountRaw: 145.2,
    isPositive: true,
    date: "21 Sep 2026, 11:05",
    status: "Selesai",
  },
  {
    id: "TX-98410",
    type: "Withdraw",
    title: "Penarikan ke Bank Mandiri",
    channel: "Bank Mandiri (•••• 8421)",
    amount: "- Rp500.000",
    amountRaw: 500000,
    isPositive: false,
    date: "20 Sep 2026, 18:45",
    status: "Selesai",
  },
  {
    id: "TX-98395",
    type: "Sell",
    title: "Sell 0.5 Lot EURUSD",
    channel: "MetaTrader 5",
    amount: "- $32.10",
    amountRaw: 32.1,
    isPositive: false,
    date: "20 Sep 2026, 09:30",
    status: "Selesai",
  },
  {
    id: "TX-98380",
    type: "Top Up",
    title: "Deposit Transfer Mandiri",
    channel: "Bank Mandiri",
    amount: "+ Rp2.500.000",
    amountRaw: 2500000,
    isPositive: true,
    date: "18 Sep 2026, 16:15",
    status: "Selesai",
  },
  {
    id: "TX-98350",
    type: "Withdraw",
    title: "Penarikan ke GoPay",
    channel: "GoPay (0812••••345)",
    amount: "- Rp250.000",
    amountRaw: 250000,
    isPositive: false,
    date: "15 Sep 2026, 13:10",
    status: "Diproses",
  },
];

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

function RiwayatPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"Semua" | "Trading" | "Top Up" | "Withdraw">("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [transactions, setTransactions] = useState<TransactionItem[]>(initialTransactions);

  useEffect(() => {
    async function loadApiTransactions() {
      try {
        const res = await fetch("/api/transactions");
        const data = (await res.json()) as { success?: boolean; transactions?: ApiTransaction[] };
        if (res.ok && data.success && Array.isArray(data.transactions)) {
          const apiItems: TransactionItem[] = data.transactions.map((t) => {
            const amountVal = t.amount ?? 0;
            const isWd = t.type === "Withdraw";
            return {
              id: `TX-${t.id || Math.floor(Math.random() * 100000)}`,
              type: t.type === "Top Up" ? "Top Up" : isWd ? "Withdraw" : "Buy",
              title: `${t.type || "Transaksi"} ${t.channel || ""}`.trim(),
              channel: t.channel || "Gotrade Wallet",
              amount: isWd ? `- ${formatRupiah(amountVal)}` : `+ ${formatRupiah(amountVal)}`,
              amountRaw: amountVal,
              isPositive: !isWd,
              date: t.created_at
                ? new Date(t.created_at).toLocaleString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Hari Ini",
              status:
                t.status === "Approved"
                  ? "Selesai"
                  : t.status === "Rejected"
                    ? "Gagal"
                    : "Diproses",
            };
          });

          if (apiItems.length > 0) {
            setTransactions((prev) => {
              const combined = [...apiItems, ...prev];
              return Array.from(new Map(combined.map((item) => [item.id, item])).values());
            });
          }
        }
      } catch {
        // use default state
      }
    }
    void loadApiTransactions();
  }, []);

  const balance = user?.balance != null ? `$${user.balance.toLocaleString()}` : "$10,000.00";

  const filteredTransactions = transactions.filter((tx) => {
    const matchesTab =
      activeTab === "Semua" ||
      (activeTab === "Trading" && (tx.type === "Buy" || tx.type === "Sell")) ||
      (activeTab === "Top Up" && tx.type === "Top Up") ||
      (activeTab === "Withdraw" && tx.type === "Withdraw");

    const matchesSearch =
      tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.channel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-muted/40">
      {/* Header */}
      <header className="flex items-center justify-between border-b bg-background px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            to="/order"
            aria-label="Kembali ke Order"
            className="rounded-full p-1 hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Link>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <h1 className="text-base font-bold text-foreground">Riwayat Transaksi</h1>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold tabular-nums text-foreground">{balance}</span>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="flex gap-1 border-b bg-card px-4 py-2 text-xs">
        {(["Semua", "Top Up", "Withdraw", "Trading"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-lg py-2 font-semibold transition-colors ${
              activeTab === tab
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="flex flex-1 flex-col gap-3 px-4 py-4 pb-8">
        {/* Search Bar */}
        <div className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2 shadow-xs">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari transaksi atau ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
          />
          <Filter className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Transaction Summary Header */}
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span>{filteredTransactions.length} Transaksi Ditemukan</span>
          <span>Urutkan: Terbaru</span>
        </div>

        {/* Transaction List */}
        <div className="flex flex-col gap-2.5">
          {filteredTransactions.map((tx) => {
            const isTopUp = tx.type === "Top Up";
            const isWithdraw = tx.type === "Withdraw";
            const isBuy = tx.type === "Buy";

            return (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-xl border bg-card p-3 shadow-xs transition-shadow hover:shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      isTopUp
                        ? "bg-primary/10 text-primary"
                        : isWithdraw
                          ? "bg-amber-500/10 text-amber-600"
                          : isBuy
                            ? "bg-blue-500/10 text-blue-600"
                            : "bg-rose-500/10 text-rose-600"
                    }`}
                  >
                    {isTopUp ? (
                      <ArrowDownToLine className="h-5 w-5" />
                    ) : isWithdraw ? (
                      <ArrowUpFromLine className="h-5 w-5" />
                    ) : isBuy ? (
                      <TrendingUp className="h-5 w-5" />
                    ) : (
                      <TrendingDown className="h-5 w-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-bold text-foreground">{tx.title}</h3>
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{tx.channel}</p>
                    <p className="text-[10px] text-muted-foreground">{tx.date}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-xs font-bold tabular-nums ${
                      tx.isPositive ? "text-emerald-600" : "text-foreground"
                    }`}
                  >
                    {tx.amount}
                  </span>
                  <div className="mt-1 flex items-center justify-end gap-1">
                    {tx.status === "Selesai" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" /> Selesai
                      </span>
                    ) : tx.status === "Diproses" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                        <Clock className="h-3 w-3" /> Diproses
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600">
                        <XCircle className="h-3 w-3" /> Gagal
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredTransactions.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
              <History className="h-10 w-10 text-muted-foreground/50" />
              <p className="mt-2 text-xs font-semibold text-foreground">
                Tidak Ada Riwayat Transaksi
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Belum ada transaksi pada kategori ini.
              </p>
            </div>
          )}
        </div>
      </main>

      <BottomNav active="Order" />
    </div>
  );
}
