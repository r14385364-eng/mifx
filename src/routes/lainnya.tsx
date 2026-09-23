import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AtSign,
  Bell,
  Building2,
  ChevronRight,
  ExternalLink,
  FileText,
  Gift,
  Headphones,
  HelpCircle,
  Info,
  Landmark,
  Link2,
  LogOut,
  Mail,
  Phone,
  Send,
  Settings,
  Sparkles,
  User,
  Users,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { BottomNav } from "@/components/BottomNav";
import { AppLogo } from "@/components/AppLogo";
import { useAuth } from "@/lib/auth-context";
import { NotificationModal } from "@/components/NotificationModal";
import { useNotifications } from "@/lib/notifications";

export const Route = createFileRoute("/lainnya")({
  head: () => ({
    meta: [
      { title: "Lainnya — Gotrade" },
      {
        name: "description",
        content: "Menu program, profil akun, dan ringkasan Gotrade.",
      },
    ],
  }),
  component: LainnyaPage,
});

function HeaderLogo() {
  return <AppLogo size="sm" />;
}

export function LainnyaPage() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  // Dynamic user data & states
  const [demoBalance, setDemoBalance] = useState<number>(user?.balance ?? 0);

  useEffect(() => {
    if (user?.balance !== undefined && user?.balance !== null) {
      setDemoBalance(user.balance);
    }
  }, [user?.balance]);

  // Modals state
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const { unreadCount } = useNotifications();
  const [customBalanceInput, setCustomBalanceInput] = useState<string>("");
  const [issueSubject, setIssueSubject] = useState<string>("");
  const [issueDetail, setIssueDetail] = useState<string>("");
  const [infoModalContent, setInfoModalContent] = useState<{
    title: string;
    desc: string;
  } | null>(null);

  const displayName = user?.name || user?.email?.split("@")[0] || "testing";
  const formattedBalance = `$${demoBalance.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const handleUpdateBalance = (amount: number) => {
    setDemoBalance(amount);
    toast.success(`Balance Akun Demo berhasil diubah menjadi $${amount.toLocaleString()}`);
    setActiveModal(null);
    setCustomBalanceInput("");
  };

  const handleCustomBalanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(customBalanceInput);
    if (!isNaN(val) && val >= 100) {
      handleUpdateBalance(val);
    } else {
      toast.error("Masukkan nominal balance minimal $100");
    }
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueSubject || !issueDetail) {
      toast.error("Mohon isi semua bidang formulir");
      return;
    }
    toast.success("Laporan masalah berhasil dikirim ke tim dukungan MIRA!");
    setIssueSubject("");
    setIssueDetail("");
    setActiveModal(null);
  };

  const handleLogoutConfirm = () => {
    logout();
    toast.info("Anda telah keluar dari akun");
    setActiveModal(null);
    navigate({ to: "/login" });
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-[#f5f6f8] pb-16 font-sans text-gray-900">
      {/* 1. Header Bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-2.5 shadow-2xs">
        {/* Left: Gotrade Logo */}
        <Link to="/beranda" className="flex items-center">
          <HeaderLogo />
        </Link>

        {/* Center: Balance */}
        <div className="flex flex-col items-center">
          <span className="tabular-nums text-sm font-bold tracking-tight text-gray-900">
            {formattedBalance}
          </span>
        </div>

        {/* Right: Notifications Bell */}
        <button
          type="button"
          onClick={() => setIsNotifOpen(true)}
          className="relative flex h-8 w-8 items-center justify-center rounded-full text-gray-800 transition-colors hover:bg-gray-100 cursor-pointer"
          title="Notifikasi"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-xs">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex flex-1 flex-col gap-3.5 px-3.5 py-3">
        {/* 2. User Account Balance Card */}
        <div className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-2xs">
          {/* User Row */}
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-700">
              <User className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold text-gray-900">{displayName}</span>
          </div>

          {/* Balance & Equity Grid */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <p className="tabular-nums text-lg font-bold tracking-tight text-gray-900">
                {formattedBalance}
              </p>
              <p className="text-xs font-normal text-gray-400">Balance</p>
            </div>
            <div>
              <p className="tabular-nums text-lg font-bold tracking-tight text-gray-900">
                {formattedBalance}
              </p>
              <p className="text-xs font-normal text-gray-400">Equity</p>
            </div>
          </div>
        </div>

        {/* 3. Ringkasan Akun Card */}
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-2xs">
          <h2 className="mb-3 text-sm font-bold text-gray-900">Ringkasan Akun</h2>
          <div className="flex flex-col gap-2.5 text-xs">
            {/* Margin */}
            <div className="flex items-center justify-between">
              <div className="flex items-center text-gray-600">
                <span>Margin</span>
                <button
                  type="button"
                  onClick={() =>
                    setInfoModalContent({
                      title: "Margin",
                      desc: "Jumlah dana yang ditahan sebagai jaminan untuk mempertahankan posisi trading yang sedang terbuka.",
                    })
                  }
                  className="ml-1 text-gray-400 hover:text-gray-600"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </div>
              <span className="font-bold text-gray-900">$0.00</span>
            </div>

            {/* Free Margin */}
            <div className="flex items-center justify-between">
              <div className="flex items-center text-gray-600">
                <span>Free Margin</span>
                <button
                  type="button"
                  onClick={() =>
                    setInfoModalContent({
                      title: "Free Margin",
                      desc: "Sisa dana yang tersedia pada akun Anda yang dapat digunakan untuk membuka posisi trading baru.",
                    })
                  }
                  className="ml-1 text-gray-400 hover:text-gray-600"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </div>
              <span className="font-bold text-gray-900">{formattedBalance}</span>
            </div>

            {/* Margin Level */}
            <div className="flex items-center justify-between">
              <div className="flex items-center text-gray-600">
                <span>Margin Level</span>
                <button
                  type="button"
                  onClick={() =>
                    setInfoModalContent({
                      title: "Margin Level",
                      desc: "Rasio antara Equity dan Margin dalam persen. Indikator kesehatan ketahanan dana akun Anda.",
                    })
                  }
                  className="ml-1 text-gray-400 hover:text-gray-600"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </div>
              <span className="font-bold text-gray-900">0.00%</span>
            </div>

            {/* Credits */}
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Credits</span>
              <span className="font-bold text-gray-900">$0.00</span>
            </div>

            {/* Floating P/L */}
            <div className="flex items-center justify-between">
              <div className="flex items-center text-gray-600">
                <span>Floating P/L</span>
                <button
                  type="button"
                  onClick={() =>
                    setInfoModalContent({
                      title: "Floating P/L",
                      desc: "Total keuntungan atau kerugian belum terealisasi dari semua posisi yang masih aktif.",
                    })
                  }
                  className="ml-1 text-gray-400 hover:text-gray-600"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </div>
              <span className="font-bold text-gray-900">$0.00</span>
            </div>

            {/* Win Rate */}
            <div className="flex items-center justify-between pt-0.5">
              <div className="flex items-center text-gray-600">
                <span>Win Rate</span>
                <button
                  type="button"
                  onClick={() =>
                    setInfoModalContent({
                      title: "Win Rate",
                      desc: "Persentase transaksi profit berbanding total transaksi yang telah ditutup.",
                    })
                  }
                  className="ml-1 text-gray-400 hover:text-gray-600"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-28 overflow-hidden rounded-full bg-gray-200">
                  <div className="h-full w-0 rounded-full bg-[#d93856]" />
                </div>
                <span className="font-bold text-[#0088cc]">0%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Program Section */}
        <div>
          <p className="mb-1.5 px-1 text-xs font-bold text-gray-700">Program</p>
          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-2xs divide-y divide-gray-100">
            <Link
              to="/rewards"
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50"
            >
              <Gift className="h-5 w-5 text-[#00a651]" />
              <span className="flex-1 text-sm font-medium text-gray-900">Gotrade Rewards</span>
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                1 Poin / 1 Juta
              </span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Link>
            <Link
              to="/referral"
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50"
            >
              <Link2 className="h-5 w-5 text-gray-700" />
              <span className="flex-1 text-sm font-medium text-gray-900">Referral</span>
              <ExternalLink className="h-4 w-4 text-gray-600" />
            </Link>
          </div>
        </div>

        {/* 5. Akun Section */}
        <div>
          <p className="mb-1.5 px-1 text-xs font-bold text-gray-700">Akun</p>
          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-2xs divide-y divide-gray-100">
            <Link
              to="/profil"
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50"
            >
              <User className="h-5 w-5 text-gray-700" />
              <span className="flex-1 text-sm font-medium text-gray-900">Profil</span>
            </Link>
            <button
              type="button"
              onClick={() => setActiveModal("akunSaya")}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50"
            >
              <Users className="h-5 w-5 text-gray-700" />
              <span className="flex-1 text-sm font-medium text-gray-900">Akun Saya</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveModal("informasiBank")}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50"
            >
              <Landmark className="h-5 w-5 text-gray-700" />
              <span className="flex-1 text-sm font-medium text-gray-900">Informasi Bank</span>
            </button>
            <button
              type="button"
              onClick={() => setIsNotifOpen(true)}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50"
            >
              <Bell className="h-5 w-5 text-gray-700" />
              <span className="flex-1 text-sm font-medium text-gray-900">
                Pusat Notifikasi & Siaran
              </span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  {unreadCount} baru
                </span>
              )}
            </button>
            <Link
              to="/admin/pengaturan"
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50"
            >
              <Settings className="h-5 w-5 text-gray-700" />
              <span className="flex-1 text-sm font-medium text-gray-900">Pengaturan</span>
            </Link>
          </div>
        </div>

        {/* 6. Bantuan Section */}
        <div>
          <p className="mb-1.5 px-1 text-xs font-bold text-gray-700">Bantuan</p>
          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-2xs divide-y divide-gray-100">
            <button
              type="button"
              onClick={() => setActiveModal("pusatBantuan")}
              className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50"
            >
              <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-gray-700" />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">Pusat Bantuan</span>
                <span className="text-xs text-gray-400">
                  Temukan jawaban untuk pertanyaan Anda.
                </span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setActiveModal("laporkanMasalah")}
              className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50"
            >
              <FileText className="mt-0.5 h-5 w-5 shrink-0 text-gray-700" />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">Laporkan Masalah</span>
                <span className="text-xs text-gray-400">
                  Ceritakan lebih detail masalah yang Anda hadapi.
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* 7. Ikuti Kami di Media Sosial */}
        <button
          type="button"
          onClick={() => setActiveModal("socialMedia")}
          className="flex w-full items-center justify-between rounded-xl border border-gray-100 bg-white p-3.5 shadow-2xs transition-colors hover:bg-gray-50/80"
        >
          <div className="flex items-center gap-3">
            <AtSign className="h-5 w-5 text-gray-700" />
            <span className="text-sm font-medium text-gray-900">Ikuti Kami di Media Sosial</span>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </button>

        {/* 8. Contact Person Gotrade Anda */}
        <div>
          <p className="mb-1.5 px-1 text-xs font-bold text-gray-700">Contact Person Gotrade Anda</p>
          <div className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-2xs">
            {/* Header MIRA */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#00a651]/20 bg-[#e6f7ef] text-[#00a651]">
                <Headphones className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-extrabold tracking-wide text-gray-900">MIRA</span>
                <span className="text-xs text-gray-400">
                  Gotrade Intelligent Response Assistant
                </span>
              </div>
            </div>

            {/* Contact details */}
            <div className="flex flex-col gap-2.5 border-t border-gray-100 pt-3">
              <a
                href="https://wa.me/6282111781198"
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-3 transition-colors hover:text-[#00a651]"
              >
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gray-600" />
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-gray-900">Whatsapp</span>
                  <span className="text-xs font-medium text-gray-500">6282111781198</span>
                </div>
              </a>

              <a
                href="mailto:support@gotrade.com"
                className="flex items-start gap-3 transition-colors hover:text-[#00a651]"
              >
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gray-600" />
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-gray-900">Email</span>
                  <span className="text-xs font-medium text-gray-500">support@gotrade.com</span>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* 9. Keluar Button */}
        {isAuthenticated ? (
          <button
            type="button"
            onClick={() => setActiveModal("confirmLogout")}
            className="flex w-full items-center gap-3 rounded-xl border border-gray-100 bg-white p-3.5 shadow-2xs transition-colors hover:bg-red-50/50"
          >
            <LogOut className="h-5 w-5 text-red-500" />
            <span className="text-sm font-semibold text-red-500">Keluar</span>
          </button>
        ) : (
          <Link
            to="/login"
            className="flex w-full items-center gap-3 rounded-xl border border-gray-100 bg-white p-3.5 shadow-2xs transition-colors hover:bg-gray-50"
          >
            <LogOut className="h-5 w-5 text-[#00a651]" />
            <span className="text-sm font-semibold text-[#00a651]">Masuk ke Akun</span>
          </Link>
        )}

        {/* 10. App Version */}
        <p className="py-2 text-center text-xs font-normal text-gray-400">
          App Version 4.1.0 CPB: 0
        </p>
      </main>

      {/* MODAL DIALOGS */}

      {/* Modal 1: Ubah Balance Akun Demo */}
      {activeModal === "ubahBalance" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-gray-900">Ubah Balance Akun Demo</h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <p className="text-xs text-gray-500">
                Pilih atau masukkan nominal balance baru untuk simulasi trading akun demo Anda:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[10000, 25000, 50000, 100000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleUpdateBalance(amt)}
                    className={`rounded-lg border py-2 text-xs font-semibold transition-colors ${
                      demoBalance === amt
                        ? "border-[#00a651] bg-[#e6f7ef] text-[#00a651]"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    ${amt.toLocaleString()}
                  </button>
                ))}
              </div>

              <form onSubmit={handleCustomBalanceSubmit} className="mt-2 flex flex-col gap-2">
                <label className="text-xs font-medium text-gray-700">Nominal Custom ($ USD)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="100"
                    step="500"
                    placeholder="Contoh: 15000"
                    value={customBalanceInput}
                    onChange={(e) => setCustomBalanceInput(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-[#00a651] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-[#00a651] px-4 py-2 text-xs font-semibold text-white hover:bg-[#008f45]"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Laporkan Masalah */}
      {activeModal === "laporkanMasalah" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-gray-900">Laporkan Masalah</h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="mt-4 flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700">Subjek Masalah</label>
                <input
                  type="text"
                  placeholder="Contoh: Kendala Eksekusi Order / Top Up"
                  value={issueSubject}
                  onChange={(e) => setIssueSubject(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-[#00a651] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Detail Masalah</label>
                <textarea
                  rows={3}
                  placeholder="Jelaskan secara singkat kendala yang Anda alami..."
                  value={issueDetail}
                  onChange={(e) => setIssueDetail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-[#00a651] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-[#00a651] py-2.5 text-xs font-semibold text-white hover:bg-[#008f45]"
              >
                <Send className="h-4 w-4" />
                Kirim Laporan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 5: Informational Popup */}
      {infoModalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 text-center shadow-xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e6f7ef] text-[#00a651]">
              <Info className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-base font-bold text-gray-900">{infoModalContent.title}</h3>
            <p className="mt-2 text-xs leading-relaxed text-gray-600">{infoModalContent.desc}</p>
            <button
              type="button"
              onClick={() => setInfoModalContent(null)}
              className="mt-4 w-full rounded-lg bg-[#00a651] py-2 text-xs font-semibold text-white hover:bg-[#008f45]"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}

      {/* Modal 7: Buka Akun Live */}
      {activeModal === "bukaLive" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 text-center shadow-xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e6f7ef] text-[#00a651]">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-base font-bold text-gray-900">Buka Akun Live Gotrade</h3>
            <p className="mt-2 text-xs leading-relaxed text-gray-600">
              Nikmati eksekusi pasar cepat 0.1 detik, spread mulai dari 0 pips, dan dukungan penuh
              legalitas resmi.
            </p>

            <div className="mt-4 flex flex-col gap-2">
              <Link
                to="/deposit"
                onClick={() => setActiveModal(null)}
                className="w-full rounded-lg bg-[#00a651] py-2.5 text-center text-xs font-semibold text-white hover:bg-[#008f45]"
              >
                Lanjutkan Deposit Akun Live
              </Link>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-full rounded-lg border border-gray-200 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Nanti Saja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 8: Akun Saya */}
      {activeModal === "akunSaya" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[#00a651]" />
                <h3 className="text-base font-bold text-gray-900">Akun Saya</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              {/* Single Live Account Card */}
              <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/40 p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs">
                      <span className="size-1.5 rounded-full bg-white animate-pulse" />
                      Live
                    </span>
                    <span className="text-xs font-semibold text-emerald-800">
                      {user?.accountType || "Standard MT5"}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold text-gray-900">
                    #{user?.accountNumber || "88910243"}
                  </span>
                </div>

                <div className="mt-3.5 space-y-1">
                  <p className="text-[11px] font-medium text-gray-500">Saldo Riil Akun</p>
                  <p className="tabular-nums text-2xl font-black tracking-tight text-gray-900">
                    {formattedBalance}
                  </p>
                  <p className="text-xs font-semibold text-emerald-700">
                    ≈ Rp {(Number(user?.balance ?? 0) * 16000).toLocaleString("id-ID")}
                  </p>
                </div>

                <div className="mt-3.5 grid grid-cols-2 gap-2 border-t border-emerald-500/20 pt-3 text-[11px]">
                  <div>
                    <span className="text-gray-500">Nama Pemilik:</span>
                    <p className="font-semibold text-gray-900 truncate">{displayName}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Status Akun:</span>
                    <p className="font-semibold text-emerald-700">Aktif & Terverifikasi</p>
                  </div>
                </div>
              </div>

              {/* Quick Action Navigation */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/deposit"
                  onClick={() => setActiveModal(null)}
                  className="flex items-center justify-center rounded-xl bg-[#00a651] py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#008f45]"
                >
                  Deposit Dana
                </Link>
                <Link
                  to="/withdraw"
                  onClick={() => setActiveModal(null)}
                  className="flex items-center justify-center rounded-xl border border-gray-200 bg-white py-2.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Tarik Dana
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 9: Informasi Bank */}
      {activeModal === "informasiBank" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#00a651]" />
                <h3 className="text-base font-bold text-gray-900">Informasi Rekening Bank</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3 text-xs">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <p className="font-bold text-gray-900">Bank Central Asia (BCA)</p>
                <p className="mt-1 text-gray-600">
                  No. Rekening:{" "}
                  <span className="font-mono font-bold text-gray-900">8891024391</span>
                </p>
                <p className="text-gray-600">
                  Atas Nama:{" "}
                  <span className="font-semibold text-gray-900">
                    PT Gotrade Indonesia Berjangka
                  </span>
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <p className="font-bold text-gray-900">Bank Mandiri</p>
                <p className="mt-1 text-gray-600">
                  No. Rekening:{" "}
                  <span className="font-mono font-bold text-gray-900">1220009871234</span>
                </p>
                <p className="text-gray-600">
                  Atas Nama:{" "}
                  <span className="font-semibold text-gray-900">
                    PT Gotrade Indonesia Berjangka
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 10: Pusat Bantuan FAQ */}
      {activeModal === "pusatBantuan" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-[#00a651]" />
                <h3 className="text-base font-bold text-gray-900">Pusat Bantuan</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-3 flex max-h-64 flex-col gap-2 overflow-y-auto pr-1 text-xs">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="font-bold text-gray-900">Bagaimana cara deposit akun?</p>
                <p className="mt-1 text-gray-600">
                  Masuk ke menu Deposit, pilih metode pembayaran QRIS atau Transfer Bank, lalu
                  masukkan nominal.
                </p>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="font-bold text-gray-900">
                  Berapa lama proses penarikan dana (withdraw)?
                </p>
                <p className="mt-1 text-gray-600">
                  Proses withdraw diproses secara otomatis dalam kurun waktu 1x24 jam pada jam kerja
                  operasional bank.
                </p>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="font-bold text-gray-900">Apakah trading di Gotrade aman & legal?</p>
                <p className="mt-1 text-gray-600">
                  Ya, Gotrade beroperasi secara terdaftar dan menginduk pada regulasi resmi
                  perdagangan berjangka.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 11: Media Sosial Links */}
      {activeModal === "socialMedia" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <AtSign className="h-5 w-5 text-[#00a651]" />
                <h3 className="text-base font-bold text-gray-900">Media Sosial Resmi</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-2.5 text-xs">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-xl border border-gray-100 p-3 transition-colors hover:bg-gray-50"
              >
                <span className="font-semibold text-gray-900">Instagram (@gotrade.id)</span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </a>

              <a
                href="https://telegram.org"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-xl border border-gray-100 p-3 transition-colors hover:bg-gray-50"
              >
                <span className="font-semibold text-gray-900">Telegram Channel Sinyal</span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </a>

              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-xl border border-gray-100 p-3 transition-colors hover:bg-gray-50"
              >
                <span className="font-semibold text-gray-900">YouTube Official Gotrade</span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal 12: Logout Confirmation */}
      {activeModal === "confirmLogout" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 text-center shadow-xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <LogOut className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-base font-bold text-gray-900">Konfirmasi Keluar</h3>
            <p className="mt-1 text-xs text-gray-600">
              Apakah Anda yakin ingin keluar dari akun ini?
            </p>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="flex-1 rounded-lg border border-gray-300 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleLogoutConfirm}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-xs font-semibold text-white hover:bg-red-700"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Navigation */}
      <BottomNav active="Lainnya" />

      {/* User Notifications Modal */}
      <NotificationModal isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </div>
  );
}
