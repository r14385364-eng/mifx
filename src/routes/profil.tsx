import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
  LogOut,
  ShieldAlert,
  Wallet,
  LogIn,
} from "lucide-react";

import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/profil")({
  head: () => ({
    meta: [
      { title: "Profil — Gotrade" },
      {
        name: "description",
        content: "Kelola data diri, email, nomor handphone, dan keamanan akun Gotrade Anda.",
      },
      { property: "og:title", content: "Profil — Gotrade" },
      {
        property: "og:description",
        content: "Kelola data diri, email, nomor handphone, dan keamanan akun Gotrade Anda.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card">
      <h2 className="border-b border-border px-4 py-2.5 text-sm font-semibold text-foreground">
        {title}
      </h2>
      <div className="divide-y divide-border/60">{children}</div>
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
        <span className="block text-sm font-medium text-foreground">{value}</span>
      </span>
      {editable ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : null}
    </div>
  );
}

function ProfilePage() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success("Berhasil keluar", {
      description: "Anda telah keluar dari akun.",
    });
    void navigate({ to: "/login" });
  };

  const displayName = user?.name || "Pengguna Gotrade";
  const displayEmail = user?.email || "Belum masuk akun";
  const displayPhone = user?.phone || "+62 821-1178-1198";
  const displayAccountNumber = user?.accountNumber || "1006568912";
  const displayBalance =
    user?.balance != null
      ? `$${user.balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : "$0.00";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background pb-20">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <Link to="/lainnya" aria-label="Kembali" className="rounded-full p-1 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="text-base font-bold text-foreground">Profil Pengguna</span>
        <button
          type="button"
          aria-label="Notifikasi"
          className="relative rounded-full p-1 hover:bg-muted"
        >
          <Bell className="h-5 w-5" />
        </button>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 py-4">
        {/* User Card */}
        <section className="flex flex-col items-center rounded-xl border border-border bg-card px-4 py-6 shadow-xs">
          <div className="relative">
            <div
              className={`flex h-20 w-20 items-center justify-center rounded-full ${
                isAdmin ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {isAdmin ? <ShieldAlert className="h-10 w-10" /> : <User className="h-10 w-10" />}
            </div>
            <button
              type="button"
              aria-label="Ubah foto profil"
              className={`absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full text-white shadow-sm transition-opacity hover:opacity-90 ${
                isAdmin ? "bg-purple-600" : "bg-emerald-600"
              }`}
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="text-lg font-bold text-foreground">{displayName}</span>
            <BadgeCheck className="h-4 w-4 text-blue-600" />
          </div>

          <div className="mt-2 flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                isAdmin
                  ? "bg-purple-500/10 text-purple-600 border border-purple-500/30"
                  : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
              }`}
            >
              {isAdmin ? "Super Admin" : "Trader Gotrade"}
            </span>

            <button
              type="button"
              className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground"
            >
              <span className="font-semibold text-foreground">Akun:</span>
              {displayAccountNumber}
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>

          {/* Balance Preview */}
          <div className="mt-4 flex w-full items-center justify-between rounded-lg bg-muted/40 p-3 text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
              <Wallet className="h-4 w-4 text-primary" /> Saldo Akun:
            </span>
            <span className="text-sm font-bold text-foreground font-mono">{displayBalance}</span>
          </div>
        </section>

        {/* Admin Shortcut Banner if user is Admin */}
        {isAdmin && (
          <Link
            to="/admin"
            className="flex items-center justify-between rounded-xl border border-purple-500/40 bg-purple-500/10 p-4 transition-colors hover:bg-purple-500/20"
          >
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-6 w-6 text-purple-600" />
              <div>
                <p className="text-sm font-bold text-purple-900 dark:text-purple-200">
                  Panel Administrator
                </p>
                <p className="text-xs text-purple-700 dark:text-purple-300">
                  Kelola Pengguna, Sinyal, Berita, dan Transaksi
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-purple-600" />
          </Link>
        )}

        {/* Data Diri */}
        <Section title="Informasi Akun">
          <FieldRow icon={User} label="Nama Lengkap" value={displayName} editable />
          <FieldRow icon={Mail} label="Email Terdaftar" value={displayEmail} editable />
          <FieldRow icon={Phone} label="Nomor Handphone" value={displayPhone} editable />
        </Section>

        <Section title="Keamanan & Status">
          <FieldRow icon={ShieldCheck} label="Verifikasi Akun" value="Terverifikasi Resmi" />
          <FieldRow
            icon={ShieldCheck}
            label="Status Sesi"
            value={isAuthenticated ? "Aktif" : "Tamu"}
          />
          <FieldRow icon={ShieldCheck} label="Peran (Role)" value={user?.role || "user"} />
        </Section>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-2">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" /> Keluar dari Akun
            </button>
          ) : (
            <Link
              to="/login"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <LogIn className="h-4 w-4" /> Masuk ke Akun
            </Link>
          )}
        </div>
      </main>

      <BottomNav active="Lainnya" />
    </div>
  );
}
