import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  Bell,
  ChevronDown,
  ChevronRight,
  Camera,
  Mail,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";

import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/profil")({
  head: () => ({
    meta: [
      { title: "Profil — MIFX" },
      {
        name: "description",
        content: "Kelola data diri, email, nomor handphone, dan keamanan akun MIFX Anda.",
      },
      { property: "og:title", content: "Profil — MIFX" },
      {
        property: "og:description",
        content: "Kelola data diri, email, nomor handphone, dan keamanan akun MIFX Anda.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border">
      <h2 className="border-b px-4 py-2.5 text-sm font-semibold">{title}</h2>
      <div className="divide-y">{children}</div>
    </section>
  );
}

function FieldRow({
  icon: Icon,
  label,
  value,
  editable,
}: {
  icon: typeof User;
  label: string;
  value: string;
  editable?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Icon className="h-5 w-5 text-muted-foreground" />
      <span className="flex-1">
        <span className="block text-xs text-muted-foreground">{label}</span>
        <span className="block text-sm font-medium">{value}</span>
      </span>
      {editable ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : null}
    </div>
  );
}

function ProfilePage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <Link to="/lainnya" aria-label="Kembali" className="rounded-full p-1 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="text-base font-bold">Profil</span>
        <button type="button" aria-label="Notifikasi" className="relative rounded-full p-1 hover:bg-muted">
          <Bell className="h-5 w-5" />
          <span className="absolute right-0.5 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white">
            5
          </span>
        </button>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 py-4">
        <section className="flex flex-col items-center rounded-xl border px-4 py-6">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
              <User className="h-10 w-10 text-emerald-700" />
            </div>
            <button
              type="button"
              aria-label="Ubah foto profil"
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm transition-opacity hover:opacity-90"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="text-lg font-bold">testing</span>
            <BadgeCheck className="h-4 w-4 text-blue-600" />
          </div>
          <button
            type="button"
            className="mt-1 flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground"
          >
            <span className="font-semibold text-emerald-600">Akun</span>
            1006568912
            <ChevronDown className="h-3 w-3" />
          </button>
        </section>

        <Section title="Data Diri">
          <FieldRow icon={User} label="Nama Lengkap" value="testing" editable />
          <FieldRow icon={Mail} label="Email" value="testing@mifx.com" editable />
          <FieldRow icon={Phone} label="Nomor Handphone" value="+62 821-1178-1198" editable />
        </Section>

        <Section title="Keamanan">
          <FieldRow icon={ShieldCheck} label="Verifikasi Akun" value="Terverifikasi" />
          <FieldRow icon={ShieldCheck} label="Verifikasi Email" value="Terverifikasi" />
          <FieldRow icon={ShieldCheck} label="Verifikasi Telepon" value="Terverifikasi" />
        </Section>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Simpan Perubahan
          </button>
          <button
            type="button"
            className="w-full rounded-lg border py-2.5 text-sm font-semibold transition-colors hover:bg-muted/50"
          >
            Ubah Password
          </button>
        </div>
      </main>

      <BottomNav active="Lainnya" />
    </div>
  );
}
