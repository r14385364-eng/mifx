import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowDownToLine,
  ChevronRight,
  Gift,
  LineChart,
  LogOut,
  Newspaper,
  User,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import type { ReactNode } from "react";

import { BottomNav } from "@/components/BottomNav";
import { ShortcutMenu, type ShortcutItem } from "@/components/ShortcutMenu";
import { useAuth } from "@/lib/auth-context";
import { AppLogo } from "@/components/AppLogo";

/**
 * Menu pintasan seperti di Beranda. Ikon disesuaikan agar tidak ada yang sama
 * dengan ikon lain di halaman ini (mis. Referral memakai UserPlus, bukan Users).
 */
const shortcuts: ShortcutItem[] = [
  { label: "Top Up", icon: Wallet, to: "/deposit" },
  { label: "Withdraw", icon: ArrowDownToLine, to: "/withdraw" },
  { label: "Trending", icon: LineChart },
  { label: "Referral", icon: UserPlus, to: "/referral" },
  { label: "Berita", icon: Newspaper, to: "/berita" },
  { label: "Rewards", icon: Gift },
];

export const Route = createFileRoute("/lainnya")({
  head: () => ({
    meta: [
      { title: "Lainnya — Gotrade" },
      {
        name: "description",
        content: "Menu program, profil akun, dan pintasan Gotrade.",
      },
      { property: "og:title", content: "Lainnya — Gotrade" },
      {
        property: "og:description",
        content: "Menu program, profil akun, dan pintasan Gotrade.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LainnyaPage,
});

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border">
      <h2 className="border-b px-4 py-2.5 text-sm font-semibold">{title}</h2>
      <div className="divide-y">{children}</div>
    </section>
  );
}

function LainnyaPage() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const displayName = user?.fullName || user?.username || "Pengguna Gotrade";
  const balance = user?.balance != null ? `$${user.balance.toLocaleString()}` : "$10,000.00";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <AppLogo size="sm" />
        <div className="flex flex-col items-center">
          <span className="text-base font-bold tabular-nums">{balance}</span>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 py-4">
        <section className="rounded-xl border p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <User className="h-4 w-4 text-muted-foreground" />
            {displayName}
          </div>
          <div className="mt-3 flex justify-between">
            <div>
              <p className="text-base font-bold tabular-nums">{balance}</p>
              <p className="text-xs text-muted-foreground">Balance</p>
            </div>
            <div className="text-right">
              <p className="text-base font-bold tabular-nums">{balance}</p>
              <p className="text-xs text-muted-foreground">Equity</p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border p-2">
          <ShortcutMenu items={shortcuts} />
        </section>

        <Section title="Program">
          <Link
            to="/referral"
            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50"
          >
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium">Referral</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </Section>

        <Section title="Akun">
          <Link
            to="/profil"
            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50"
          >
            <User className="h-5 w-5 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium">Profil</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </Section>

        {isAuthenticated ? (
          <button
            type="button"
            onClick={() => {
              logout();
              navigate({ to: "/login" });
            }}
            className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-muted/50"
          >
            <LogOut className="h-5 w-5" />
            Keluar
          </button>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold text-primary hover:bg-muted/50"
          >
            <LogOut className="h-5 w-5" />
            Masuk
          </Link>
        )}

        <p className="pb-2 text-center text-xs text-muted-foreground">App Version 4.1.0 CPB: 0</p>
      </main>

      <BottomNav active="Lainnya" />
    </div>
  );
}
