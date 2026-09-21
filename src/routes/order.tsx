import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownToLine, Bell, ChevronRight, Users, Wallet } from "lucide-react";

import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/order")({
  head: () => ({
    meta: [
      { title: "Menu Transaksi — Gotrade" },
      {
        name: "description",
        content:
          "Akses menu Top up, Withdraw, dan Referral akun Gotrade Anda secara cepat dan aman.",
      },
      { property: "og:title", content: "Menu Transaksi — Gotrade" },
      {
        property: "og:description",
        content:
          "Akses menu Top up, Withdraw, dan Referral akun Gotrade Anda secara cepat dan aman.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OrderPage,
});

const quickMenus = [
  {
    title: "Top up",
    to: "/deposit",
    icon: Wallet,
    iconColor: "text-primary bg-primary/10",
    buttonColor: "bg-primary text-primary-foreground",
    buttonText: "Top Up Sekarang",
    description:
      "Isi saldo akun trading Gotrade Anda melalui QRIS, transfer bank, atau e-wallet resmi secara instan.",
  },
  {
    title: "Withdraw",
    to: "/withdraw",
    icon: ArrowDownToLine,
    iconColor: "text-emerald-600 bg-emerald-500/10",
    buttonColor: "bg-emerald-600 text-white",
    buttonText: "Withdraw Sekarang",
    description:
      "Tarik saldo trading atau keuntungan Anda langsung ke rekening bank atau e-wallet dengan aman.",
  },
  {
    title: "Referral",
    to: "/referral",
    icon: Users,
    iconColor: "text-amber-600 bg-amber-500/10",
    buttonColor: "bg-amber-600 text-white",
    buttonText: "Buka Menu Referral",
    description:
      "Ajak teman dan rekan Anda trading di MIFX dan kumpulkan komisi serta reward tambahan setiap transaksi.",
  },
];

function OrderPage() {
  const { user } = useAuth();
  const balance = user?.balance != null ? `$${user.balance.toLocaleString()}` : "$10,000.00";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-lg font-black tracking-tight text-primary">MIFX</span>
        <div className="flex flex-col items-center">
          <span className="text-base font-bold tabular-nums">{balance}</span>
        </div>
        <button
          type="button"
          aria-label="Notifikasi"
          className="relative rounded-full p-1 hover:bg-muted"
        >
          <Bell className="h-5 w-5" />
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
          to="/referral"
          className="flex items-center justify-center gap-1.5 py-3 font-semibold text-foreground transition-colors hover:bg-muted/60 hover:text-amber-600 active:bg-muted"
        >
          <Users className="h-4 w-4 text-amber-500" />
          <span>Referral</span>
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
              <p className="text-base font-bold tabular-nums">{balance}</p>
              <p className="text-xs text-muted-foreground">Equity</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t pt-3 text-sm">
            <span className="text-muted-foreground">Total Profit / Loss</span>
            <span className="font-semibold tabular-nums text-blue-600">$0.00</span>
          </div>
        </div>

        {/* 3 Menu Cards */}
        <div className="flex flex-col gap-3">
          {quickMenus.map((menu) => {
            const Icon = menu.icon;
            return (
              <div
                key={menu.title}
                className="rounded-xl border bg-card p-4 shadow-xs transition-shadow hover:shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${menu.iconColor}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-bold text-foreground">{menu.title}</h2>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{menu.description}</p>
                    <Link
                      to={menu.to}
                      className={`mt-3 inline-flex items-center justify-center rounded-lg px-4 py-2 text-xs font-semibold shadow-xs transition-opacity hover:opacity-90 active:opacity-80 ${menu.buttonColor}`}
                    >
                      {menu.buttonText}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <BottomNav active="Order" />
    </div>
  );
}
