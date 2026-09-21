import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDownToLine,
  Building2,
  ChevronDown,
  ChevronRight,
  Gift,
  HelpCircle,
  IdCard,
  Landmark,
  LineChart,
  LogOut,
  Newspaper,
  Settings,
  Share2,
  User,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import type { ReactNode } from "react";

import { BottomNav } from "@/components/BottomNav";
import { ShortcutMenu, type ShortcutItem } from "@/components/ShortcutMenu";

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
      { title: "Lainnya — MIFX" },
      {
        name: "description",
        content: "Ringkasan akun, program, pengaturan, dan bantuan MIFX dalam satu halaman.",
      },
      { property: "og:title", content: "Lainnya — MIFX" },
      {
        property: "og:description",
        content: "Ringkasan akun, program, pengaturan, dan bantuan MIFX dalam satu halaman.",
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

function Row({
  icon: Icon,
  label,
  sub,
  trailing,
}: {
  icon: typeof User;
  label: string;
  sub?: string;
  trailing?: ReactNode;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50"
    >
      <Icon className="h-5 w-5 text-muted-foreground" />
      <span className="flex-1">
        <span className="block text-sm font-medium">{label}</span>
        {sub ? <span className="block text-xs text-muted-foreground">{sub}</span> : null}
      </span>
      {trailing}
    </button>
  );
}

function InfoRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 text-sm">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {label}
        <HelpCircle className="h-3.5 w-3.5" />
      </span>
      <span className={`font-semibold tabular-nums ${accent ? "text-blue-600" : ""}`}>{value}</span>
    </div>
  );
}

function LainnyaPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-lg font-black tracking-tight text-primary">MIFX</span>
        <div className="flex flex-col items-center">
          <span className="text-base font-bold tabular-nums">$10,000.00</span>
          <button
            type="button"
            className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground"
          >
            <span className="font-semibold text-emerald-600">Akun</span>
            1006568912
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 py-4">
        <section className="rounded-xl border p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <User className="h-4 w-4 text-muted-foreground" />
            testing
          </div>
          <div className="mt-3 flex justify-between">
            <div>
              <p className="text-base font-bold tabular-nums">$10,000.00</p>
              <p className="text-xs text-muted-foreground">Balance</p>
            </div>
            <div className="text-right">
              <p className="text-base font-bold tabular-nums">$10,000.00</p>
              <p className="text-xs text-muted-foreground">Equity</p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border p-2">
          <ShortcutMenu items={shortcuts} />
        </section>

        <Section title="Ringkasan Akun">
          <InfoRow label="Margin" value="$0.00" />
          <InfoRow label="Free Margin" value="$10,000.00" />
          <InfoRow label="Margin Level" value="0.00%" />
          <InfoRow label="Credits" value="$0.00" />
          <InfoRow label="Floating P/L" value="$0.00" />
          <div className="flex items-center justify-between px-4 py-2.5 text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              Win Rate
              <HelpCircle className="h-3.5 w-3.5" />
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                <span className="block h-full w-0 bg-rose-600" />
              </span>
              <span className="font-semibold tabular-nums text-blue-600">0%</span>
            </span>
          </div>
        </Section>

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
          <Row icon={IdCard} label="Akun Saya" />
          <Row icon={Landmark} label="Informasi Bank" />
          <Row icon={Settings} label="Pengaturan" />
        </Section>

        <Section title="Bantuan">
          <Row
            icon={HelpCircle}
            label="Pusat Bantuan"
            sub="Temukan jawaban untuk pertanyaan Anda."
          />
          <Row
            icon={Building2}
            label="Laporkan Masalah"
            sub="Ceritakan lebih detail masalah yang Anda hadapi."
          />
          <Row icon={Share2} label="Ikuti Kami di Media Sosial" />
        </Section>

        <Link
          to="/login"
          className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-muted/50"
        >
          <LogOut className="h-5 w-5" />
          Keluar
        </Link>

        <p className="pb-2 text-center text-xs text-muted-foreground">App Version 4.1.0 CPB: 0</p>
      </main>

      <BottomNav active="Lainnya" />
    </div>
  );
}
