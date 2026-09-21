import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, ImageOff } from "lucide-react";
import { useState } from "react";

import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/order")({
  head: () => ({
    meta: [
      { title: "Order — MIFX" },
      {
        name: "description",
        content: "Pantau posisi terbuka, order pending, dan riwayat transaksi Anda di MIFX.",
      },
      { property: "og:title", content: "Order — MIFX" },
      {
        property: "og:description",
        content: "Pantau posisi terbuka, order pending, dan riwayat transaksi Anda di MIFX.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OrderPage,
});

const tabs = ["Open", "Pending", "Riwayat"] as const;

const emptyCopy: Record<(typeof tabs)[number], { title: string; body: string }> = {
  Open: {
    title: "Anda Belum Memiliki Open Order",
    body: "Untuk mulai trading, silakan klik di bawah lalu pilih produk yang tersedia di market",
  },
  Pending: {
    title: "Anda Belum Memiliki Pending Order",
    body: "Buat order pending untuk masuk ke market secara otomatis di harga yang Anda tentukan",
  },
  Riwayat: {
    title: "Belum Ada Riwayat Transaksi",
    body: "Riwayat transaksi Anda akan muncul di sini setelah Anda mulai trading",
  },
};

function OrderPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Open");
  const empty = emptyCopy[tab];

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-lg font-black tracking-tight text-primary">MIFX</span>
        <div className="flex flex-col items-center">
          <span className="text-base font-bold tabular-nums">$10,000.00</span>
        </div>
        <button
          type="button"
          aria-label="Notifikasi"
          className="relative rounded-full p-1 hover:bg-muted"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-0.5 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white">
            5
          </span>
        </button>
      </header>

      <nav className="grid grid-cols-3 border-b text-sm">
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`border-b-2 py-2.5 font-medium transition-colors ${
              tab === item
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground"
            }`}
          >
            {item}
          </button>
        ))}
      </nav>

      <main className="flex flex-1 flex-col px-4 py-4">
        <div className="rounded-xl border p-4">
          <div className="flex justify-between">
            <div>
              <p className="text-base font-bold tabular-nums">$10,000.00</p>
              <p className="text-xs text-muted-foreground">Balance</p>
            </div>
            <div className="text-right">
              <p className="text-base font-bold tabular-nums">$10,000.00</p>
              <p className="text-xs text-muted-foreground">Equity</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t pt-3 text-sm">
            <span className="text-muted-foreground">Total Profit / Loss</span>
            <span className="font-semibold tabular-nums text-blue-600">$0.00</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted">
            <ImageOff className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-base font-bold">{empty.title}</h1>
          <p className="max-w-xs text-xs text-muted-foreground">{empty.body}</p>
          <Link
            to="/pasar"
            className="mt-2 rounded-lg bg-emerald-600 px-8 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Trading Sekarang
          </Link>
        </div>
      </main>

      <BottomNav active="Order" />
    </div>
  );
}
