import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownToLine, Bell, ChevronRight, History, Wallet } from "lucide-react";
import { useState } from "react";

import { BottomNav } from "@/components/BottomNav";
import { AppLogo } from "@/components/AppLogo";
import { NotificationModal } from "@/components/NotificationModal";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications";

export const Route = createFileRoute("/order")({
  head: () => ({
    meta: [
      { title: "Menu Transaksi — Gotrade" },
      {
        name: "description",
        content:
          "Akses menu Deposit, Withdraw, dan Riwayat Transaksi akun Gotrade Anda secara cepat dan aman.",
      },
    ],
  }),
  component: OrderPage,
});

function OrderPage() {
  const { user, refreshProfile } = useAuth();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const { unreadCount } = useNotifications();

  useEffect(() => {
    void refreshProfile?.();
  }, [refreshProfile]);

  const rawBalance = user?.balance != null ? Number(user.balance) : 0;
  const rawProfit = user?.profit != null ? Number(user.profit) : 0;
  const rawEquity = rawProfit;
  const balance = `$${rawBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const equity = `$${rawEquity.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const totalProfitLoss = `${rawProfit >= 0 ? "+$" : "-$"}${Math.abs(rawProfit).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-4 py-3">
        <Link to="/beranda" className="flex items-center">
          <AppLogo size="sm" />
        </Link>
        <div className="flex flex-col items-center">
          <span className="text-base font-bold tabular-nums">{balance}</span>
        </div>
        <button
          type="button"
          aria-label="Notifikasi"
          onClick={() => setIsNotifOpen(true)}
          className="relative rounded-full p-1.5 hover:bg-muted transition-colors cursor-pointer"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-xs">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </header>

      {/* 3 Nav Tabs that navigate directly to each respective page */}
      <nav className="grid grid-cols-3 border-b bg-card text-sm">
        <Link
          to="/deposit"
          className="flex items-center justify-center gap-1.5 py-3 font-semibold text-foreground transition-colors hover:bg-muted/60 hover:text-primary active:bg-muted"
        >
          <Wallet className="h-4 w-4 text-primary" />
          <span>Top up</span>
        </Link>
        <Link
          to="/withdraw"
          className="flex items-center justify-center gap-1.5 border-x py-3 font-semibold text-foreground transition-colors hover:bg-muted/60 hover:text-emerald-600 active:bg-muted"
        >
          <ArrowDownToLine className="h-4 w-4 text-emerald-600" />
          <span>Withdraw</span>
        </Link>
        <Link
          to="/riwayat"
          className="flex items-center justify-center gap-1.5 py-3 font-semibold text-foreground transition-colors hover:bg-muted/60 hover:text-primary active:bg-muted"
        >
          <History className="h-4 w-4 text-primary" />
          <span>Riwayat</span>
        </Link>
      </nav>

      <main className="flex flex-1 flex-col gap-4 px-4 py-4 pb-8">
        {/* Ringkasan Saldo */}
        <div className="rounded-xl border bg-card p-4 shadow-xs">
          <div className="flex justify-between">
            <div>
              <p className="text-base font-bold tabular-nums">{balance}</p>
              <p className="text-xs text-muted-foreground">Balance</p>
            </div>
            <div className="text-right">
              <p className="text-base font-bold tabular-nums">{equity}</p>
              <p className="text-xs text-muted-foreground">Equity</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t pt-3 text-sm">
            <span className="text-muted-foreground">Total Profit / Loss</span>
            <span
              className={`font-semibold tabular-nums ${rawProfit > 0 ? "text-emerald-600" : rawProfit < 0 ? "text-rose-600" : "text-muted-foreground"}`}
            >
              {rawProfit !== 0 ? totalProfitLoss : "$0.00"}
            </span>
          </div>
        </div>

        {/* Order Menu Section styled like Akun in /lainnya */}
        <div>
          <p className="mb-1.5 px-1 text-xs font-bold text-gray-700 dark:text-gray-300">Order</p>
          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-2xs divide-y divide-gray-100 dark:border-border dark:bg-card dark:divide-border">
            <Link
              to="/deposit"
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-muted/50"
            >
              <Wallet className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              <span className="flex-1 text-sm font-medium text-gray-900 dark:text-foreground">
                Deposit
              </span>
              <ChevronRight className="h-4 w-4 text-gray-400 dark:text-muted-foreground" />
            </Link>
            <Link
              to="/withdraw"
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-muted/50"
            >
              <ArrowDownToLine className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              <span className="flex-1 text-sm font-medium text-gray-900 dark:text-foreground">
                Withdraw
              </span>
              <ChevronRight className="h-4 w-4 text-gray-400 dark:text-muted-foreground" />
            </Link>
            <Link
              to="/riwayat"
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-muted/50"
            >
              <History className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              <span className="flex-1 text-sm font-medium text-gray-900 dark:text-foreground">
                Riwayat
              </span>
              <ChevronRight className="h-4 w-4 text-gray-400 dark:text-muted-foreground" />
            </Link>
          </div>
        </div>
      </main>

      <BottomNav active="Order" />
      <NotificationModal isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </div>
  );
}
