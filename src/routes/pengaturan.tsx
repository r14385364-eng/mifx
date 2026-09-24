import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Moon,
  Sun,
  Laptop,
  Check,
  Bell,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Vibrate,
  ShieldCheck,
  Lock,
  Smartphone,
  Info,
  ChevronRight,
  Sparkles,
  HelpCircle,
  FileText,
} from "lucide-react";
import { useState, useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { useTheme, type ThemeMode } from "@/lib/theme-context";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/pengaturan")({
  head: () => ({
    meta: [
      { title: "Pengaturan & Tampilan — Gotrade" },
      {
        name: "description",
        content:
          "Atur tampilan aplikasi, aktifkan atau nonaktifkan mode gelap (dark mode), dan preferensi akun Gotrade.",
      },
    ],
  }),
  component: PengaturanPage,
});

export function PengaturanPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, resolvedTheme, isDark, setTheme, toggleDark } = useTheme();

  // Local preferences stored in localStorage
  const [hideBalance, setHideBalance] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("gotrade_pref_hide_balance") === "true";
    }
    return false;
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("gotrade_pref_sound") !== "false";
    }
    return true;
  });

  const [hapticEnabled, setHapticEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("gotrade_pref_haptic") !== "false";
    }
    return true;
  });

  const [orderConfirm, setOrderConfirm] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("gotrade_pref_order_confirm") !== "false";
    }
    return true;
  });

  const handleToggleHideBalance = () => {
    const next = !hideBalance;
    setHideBalance(next);
    localStorage.setItem("gotrade_pref_hide_balance", String(next));
    toast.info(next ? "Saldo utama akan disamarkan" : "Saldo utama ditampilkan");
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("gotrade_pref_sound", String(next));
    toast.info(next ? "Efek suara trading diaktifkan" : "Efek suara trading dimatikan");
  };

  const handleToggleHaptic = () => {
    const next = !hapticEnabled;
    setHapticEnabled(next);
    localStorage.setItem("gotrade_pref_haptic", String(next));
    toast.info(next ? "Getaran haptic diaktifkan" : "Getaran haptic dimatikan");
  };

  const handleToggleOrderConfirm = () => {
    const next = !orderConfirm;
    setOrderConfirm(next);
    localStorage.setItem("gotrade_pref_order_confirm", String(next));
    toast.info(next ? "Konfirmasi eksekusi order aktif" : "Konfirmasi eksekusi order nonaktif");
  };

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    if (newTheme === "dark") {
      toast.success("Mode Gelap diaktifkan", {
        description: "Tampilan aplikasi beralih ke tema gelap yang nyaman untuk mata.",
      });
    } else if (newTheme === "light") {
      toast.success("Mode Terang diaktifkan", {
        description: "Tampilan aplikasi kembali ke tema terang resmi Gotrade.",
      });
    } else {
      toast.success("Tema mengikuti sistem perangkat", {
        description: "Tampilan akan otomatis berganti sesuai preferensi OS Anda.",
      });
    }
  };

  const handleQuickToggleDark = () => {
    toggleDark();
    if (!isDark) {
      toast.success("Mode Gelap diaktifkan 🌙");
    } else {
      toast.success("Mode Terang diaktifkan ☀️");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f6f8] text-gray-900 transition-colors">
      {/* 1. Header Bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/lainnya" })}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            aria-label="Kembali ke Lainnya"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-tight">Pengaturan</h1>
            <p className="text-[11px] text-gray-500">Tampilan aplikasi & preferensi akun</p>
          </div>
        </div>

        {/* Quick Theme Pill in Header */}
        <button
          type="button"
          onClick={handleQuickToggleDark}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
            isDark
              ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          title={isDark ? "Beralih ke Mode Terang" : "Beralih ke Mode Gelap"}
        >
          {isDark ? (
            <>
              <Sun className="h-3.5 w-3.5 text-amber-400" />
              <span>Terang</span>
            </>
          ) : (
            <>
              <Moon className="h-3.5 w-3.5 text-indigo-600" />
              <span>Gelap</span>
            </>
          )}
        </button>
      </header>

      {/* Main Content */}
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 p-4 pb-24">
        {/* ======================================================== */}
        {/* SEKSI UTAMA: MODE GELAP (DARK MODE) & TAMPILAN APLIKASI */}
        {/* ======================================================== */}
        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-[#00a651]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">Tema & Tampilan</h2>
                <p className="text-xs text-gray-500">Sesuaikan mode pencahayaan aplikasi</p>
              </div>
            </div>

            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                isDark
                  ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30"
                  : "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30"
              }`}
            >
              {isDark ? (
                <>
                  <Moon className="h-3 w-3" />
                  Dark Mode ON
                </>
              ) : (
                <>
                  <Sun className="h-3 w-3" />
                  Light Mode ON
                </>
              )}
            </span>
          </div>

          {/* Quick Interactive Master Switch for Dark Mode */}
          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50/70 p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    isDark ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  <Moon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Mode Gelap (Dark Mode)</p>
                  <p className="text-xs text-gray-500">
                    {isDark
                      ? "Aktif — Menghemat baterai & nyaman di kondisi minim cahaya."
                      : "Nonaktif — Gunakan switch ini untuk mengaktifkan tema gelap."}
                  </p>
                </div>
              </div>

              {/* Toggle Switch Button */}
              <button
                type="button"
                role="switch"
                aria-checked={isDark}
                onClick={handleQuickToggleDark}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  isDark ? "bg-[#00a651]" : "bg-gray-300"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    isDark ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 3 Visual Option Cards: Light, Dark, System */}
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold text-gray-600">Pilihan Skema Tampilan:</p>
            <div className="grid grid-cols-3 gap-2.5">
              {/* Option 1: Light */}
              <button
                type="button"
                onClick={() => handleThemeChange("light")}
                className={`group relative flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all ${
                  theme === "light"
                    ? "border-[#00a651] bg-emerald-50/50 shadow-xs ring-2 ring-[#00a651]/20"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {theme === "light" && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#00a651] text-white">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                )}
                {/* Mockup Preview Card */}
                <div className="flex h-12 w-full flex-col justify-between rounded-lg border border-gray-200 bg-white p-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="h-1.5 w-6 rounded-full bg-[#00a651]" />
                    <div className="h-1.5 w-2 rounded-full bg-gray-300" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-1 w-full rounded-full bg-gray-200" />
                    <div className="h-1 w-3/4 rounded-full bg-gray-200" />
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Sun className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xs font-bold text-gray-900">Terang</span>
                </div>
              </button>

              {/* Option 2: Dark */}
              <button
                type="button"
                onClick={() => handleThemeChange("dark")}
                className={`group relative flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all ${
                  theme === "dark"
                    ? "border-[#00a651] bg-emerald-50/50 shadow-xs ring-2 ring-[#00a651]/20"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {theme === "dark" && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#00a651] text-white">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                )}
                {/* Mockup Preview Card */}
                <div className="flex h-12 w-full flex-col justify-between rounded-lg border border-gray-700 bg-gray-900 p-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="h-1.5 w-6 rounded-full bg-[#00a651]" />
                    <div className="h-1.5 w-2 rounded-full bg-gray-700" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-1 w-full rounded-full bg-gray-800" />
                    <div className="h-1 w-3/4 rounded-full bg-gray-800" />
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Moon className="h-3.5 w-3.5 text-indigo-500" />
                  <span className="text-xs font-bold text-gray-900">Gelap</span>
                </div>
              </button>

              {/* Option 3: System */}
              <button
                type="button"
                onClick={() => handleThemeChange("system")}
                className={`group relative flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all ${
                  theme === "system"
                    ? "border-[#00a651] bg-emerald-50/50 shadow-xs ring-2 ring-[#00a651]/20"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {theme === "system" && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#00a651] text-white">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                )}
                {/* Mockup Preview Card Split */}
                <div className="flex h-12 w-full overflow-hidden rounded-lg border border-gray-300 shadow-2xs">
                  <div className="flex flex-1 flex-col justify-between bg-white p-1.5">
                    <div className="h-1.5 w-4 rounded-full bg-[#00a651]" />
                    <div className="h-1 w-full rounded-full bg-gray-200" />
                  </div>
                  <div className="flex flex-1 flex-col justify-between bg-gray-900 p-1.5">
                    <div className="h-1.5 w-4 rounded-full bg-[#00a651]" />
                    <div className="h-1 w-full rounded-full bg-gray-800" />
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Laptop className="h-3.5 w-3.5 text-gray-500" />
                  <span className="text-xs font-bold text-gray-900">Otomatis</span>
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* SEKSI 2: PREFERENSI TRADING & PRIVASI */}
        {/* ======================================================== */}
        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-2xs">
          <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Preferensi & Privasi</h2>
              <p className="text-xs text-gray-500">Kenyamanan saat melihat data finansial</p>
            </div>
          </div>

          <div className="mt-3 divide-y divide-gray-100">
            {/* Sembunyikan Saldo */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-start gap-3 pr-2">
                <div className="mt-0.5 text-gray-500">
                  {hideBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Samarkan Saldo Utama</p>
                  <p className="text-[11px] text-gray-500">
                    Menampilkan simbol asterik (••••••) pada nominal saldo di halaman Beranda.
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={hideBalance}
                onClick={handleToggleHideBalance}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  hideBalance ? "bg-[#00a651]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    hideBalance ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Konfirmasi Order */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-start gap-3 pr-2">
                <div className="mt-0.5 text-gray-500">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Konfirmasi Eksekusi Order</p>
                  <p className="text-[11px] text-gray-500">
                    Tampilkan konfirmasi pop-up sebelum mengirimkan order BUY atau SELL.
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={orderConfirm}
                onClick={handleToggleOrderConfirm}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  orderConfirm ? "bg-[#00a651]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    orderConfirm ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* SEKSI 3: SUARA & NOTIFIKASI */}
        {/* ======================================================== */}
        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-2xs">
          <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Audio & Haptic Feedback</h2>
              <p className="text-xs text-gray-500">Respon suara saat bertransaksi</p>
            </div>
          </div>

          <div className="mt-3 divide-y divide-gray-100">
            {/* Suara Transaksi */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-start gap-3 pr-2">
                <div className="mt-0.5 text-gray-500">
                  {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Efek Suara Trading</p>
                  <p className="text-[11px] text-gray-500">
                    Memainkan nada singkat saat penutupan atau eksekusi order berhasil.
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={soundEnabled}
                onClick={handleToggleSound}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  soundEnabled ? "bg-[#00a651]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    soundEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Haptic Vibrate */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-start gap-3 pr-2">
                <div className="mt-0.5 text-gray-500">
                  <Vibrate className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Getaran Sentuh (Haptic)</p>
                  <p className="text-[11px] text-gray-500">
                    Getaran halus pada perangkat saat menekan tombol eksekusi trading.
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={hapticEnabled}
                onClick={handleToggleHaptic}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  hapticEnabled ? "bg-[#00a651]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    hapticEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* SEKSI 4: TAUTAN MENU TERKAIT & KEAMANAN */}
        {/* ======================================================== */}
        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-2xs">
          <h2 className="mb-2 text-sm font-bold text-gray-900">Keamanan & Informasi Lainnya</h2>
          <div className="divide-y divide-gray-100">
            <Link
              to="/profil"
              className="flex items-center justify-between py-3 text-left transition-colors hover:text-[#00a651]"
            >
              <div className="flex items-center gap-3">
                <Lock className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs font-semibold text-gray-900">Kata Sandi & Keamanan</p>
                  <p className="text-[11px] text-gray-400">Ganti password & proteksi akun</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Link>

            <Link
              to="/lainnya"
              className="flex items-center justify-between py-3 text-left transition-colors hover:text-[#00a651]"
            >
              <div className="flex items-center gap-3">
                <Smartphone className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs font-semibold text-gray-900">Informasi Rekening Bank</p>
                  <p className="text-[11px] text-gray-400">Kelola akun bank penarikan dana</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Link>

            {user?.role === "admin" && (
              <Link
                to="/admin/pengaturan"
                className="flex items-center justify-between py-3 text-left transition-colors text-emerald-700 font-semibold"
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <div>
                    <p className="text-xs font-bold text-emerald-700">Pengaturan Sistem Admin</p>
                    <p className="text-[11px] text-emerald-600/80">Kelola QRIS & Profit Harian</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-emerald-600" />
              </Link>
            )}
          </div>
        </section>

        {/* ======================================================== */}
        {/* SEKSI 5: INFO APLIKASI */}
        {/* ======================================================== */}
        <section className="flex flex-col items-center justify-center pt-2 text-center">
          <p className="text-xs font-bold text-gray-700">Gotrade Application v2.4.2</p>
          <p className="mt-0.5 text-[11px] text-gray-400">
            Platform Trading Legal, Aman & Terpercaya • Build 2026.09
          </p>
        </section>
      </main>

      {/* Bottom Navigation */}
      <BottomNav active="Lainnya" />
    </div>
  );
}

function Sliders(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" x2="4" y1="21" y2="14" />
      <line x1="4" x2="4" y1="10" y2="3" />
      <line x1="12" x2="12" y1="21" y2="12" />
      <line x1="12" x2="12" y1="8" y2="3" />
      <line x1="20" x2="20" y1="21" y2="16" />
      <line x1="20" x2="20" y1="12" y2="3" />
      <line x1="1" x2="7" y1="14" y2="14" />
      <line x1="9" x2="15" y1="8" y2="8" />
      <line x1="17" x2="23" y1="16" y2="16" />
    </svg>
  );
}
