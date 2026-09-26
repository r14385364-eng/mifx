import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AtSign,
  Bell,
  Building2,
  Check,
  ChevronRight,
  Copy,
  Edit3,
  ExternalLink,
  FileText,
  Gift,
  Headphones,
  HelpCircle,
  Info,
  Landmark,
  Link2,
  Loader2,
  LogOut,
  Mail,
  Moon,
  Phone,
  Plus,
  Send,
  Settings,
  Sparkles,
  Sun,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";

import { BottomNav } from "@/components/BottomNav";
import { AppLogo } from "@/components/AppLogo";
import { useAuth } from "@/lib/auth-context";
import { NotificationModal } from "@/components/NotificationModal";
import { useNotifications } from "@/lib/notifications";
import { useTheme } from "@/lib/theme-context";

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

interface ContactPersonItem {
  id: string;
  name: string;
  role: string;
  whatsappLabel?: string;
  whatsappNumber: string;
  email?: string;
  active?: boolean;
}

const defaultContactPersons: ContactPersonItem[] = [
  {
    id: "contact_aksay",
    name: "AKSAY",
    role: "Gotrade Dedicated Account Support",
    whatsappLabel: "Whatsapp",
    whatsappNumber: "082329157278",
    email: "support@gotrade.com",
    active: true,
  },
];

function formatWaUrl(phone: string): string {
  const cleaned = phone.replace(/[^0-9]/g, "");
  if (!cleaned) return "https://wa.me/6282329157278";
  if (cleaned.startsWith("62")) return `https://wa.me/${cleaned}`;
  if (cleaned.startsWith("0")) return `https://wa.me/62${cleaned.slice(1)}`;
  return `https://wa.me/${cleaned}`;
}

type UserBankAccount = {
  id: number;
  user_id: number;
  bank_name: string;
  account_number: string;
  account_holder: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
};

const POPULAR_BANKS = [
  "Bank BCA",
  "Bank Mandiri",
  "Bank BRI",
  "Bank BNI",
  "Bank CIMB Niaga",
  "Bank Permata",
  "Bank Danamon",
  "Bank Syariah Indonesia (BSI)",
  "DANA",
  "OVO",
  "GoPay",
  "ShopeePay",
  "Lainnya",
];

function HeaderLogo() {
  return <AppLogo size="sm" />;
}

export function LainnyaPage() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, refreshProfile } = useAuth();

  // Dynamic user data & states
  const [demoBalance, setDemoBalance] = useState<number>(user?.balance ?? 0);

  useEffect(() => {
    void refreshProfile?.();
  }, [refreshProfile]);

  useEffect(() => {
    if (user?.balance !== undefined && user?.balance !== null) {
      setDemoBalance(user.balance);
    }
  }, [user?.balance]);

  // Modals state
  const { isDark } = useTheme();
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

  // Dynamic Contact Persons from Admin Settings (CRUD)
  const [contactPersons, setContactPersons] = useState<ContactPersonItem[]>(defaultContactPersons);

  useEffect(() => {
    async function loadContactSettings() {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (res.ok && data.success && data.settings) {
          if (data.settings.contact_persons_list) {
            try {
              const list = JSON.parse(data.settings.contact_persons_list);
              if (Array.isArray(list) && list.length > 0) {
                setContactPersons(list);
                return;
              }
            } catch {
              // fallback to single fields
            }
          }

          if (data.settings.contact_person_name) {
            setContactPersons([
              {
                id: "contact_primary",
                name: data.settings.contact_person_name || "AKSAY",
                role: data.settings.contact_person_role || "Gotrade Dedicated Account Support",
                whatsappLabel: data.settings.contact_person_wa_label || "Whatsapp",
                whatsappNumber: data.settings.contact_person_phone || "082329157278",
                email: data.settings.contact_person_email || "support@gotrade.com",
                active: true,
              },
            ]);
          }
        }
      } catch {
        // use default state
      }
    }
    void loadContactSettings();
  }, []);

  // Bank accounts states & handlers
  const [bankAccounts, setBankAccounts] = useState<UserBankAccount[]>([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState<boolean>(false);
  const [bankFormMode, setBankFormMode] = useState<"list" | "add" | "edit">("list");
  const [editingBankId, setEditingBankId] = useState<number | null>(null);
  const [bankFormInput, setBankFormInput] = useState<{
    bankName: string;
    customBankName: string;
    accountNumber: string;
    accountHolder: string;
    isPrimary: boolean;
  }>({
    bankName: "Bank BCA",
    customBankName: "",
    accountNumber: "",
    accountHolder: "",
    isPrimary: false,
  });
  const [isSubmittingBank, setIsSubmittingBank] = useState<boolean>(false);
  const [deleteBankConfirmId, setDeleteBankConfirmId] = useState<number | null>(null);
  const [copiedBankId, setCopiedBankId] = useState<number | null>(null);

  const fetchBankAccounts = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingBanks(true);
    try {
      const res = await fetch("/api/user/bank-accounts");
      const data = await res.json();
      if (data.success && Array.isArray(data.bankAccounts)) {
        setBankAccounts(data.bankAccounts);
      }
    } catch (err) {
      console.error("Failed to fetch bank accounts:", err);
    } finally {
      setIsLoadingBanks(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeModal === "informasiBank") {
      fetchBankAccounts();
      setBankFormMode("list");
      setDeleteBankConfirmId(null);
    }
  }, [activeModal, isAuthenticated, fetchBankAccounts]);

  const openAddBankForm = () => {
    setBankFormInput({
      bankName: "Bank BCA",
      customBankName: "",
      accountNumber: "",
      accountHolder: user?.name || "",
      isPrimary: bankAccounts.length === 0,
    });
    setEditingBankId(null);
    setBankFormMode("add");
  };

  const openEditBankForm = (bank: UserBankAccount) => {
    const isKnown = POPULAR_BANKS.includes(bank.bank_name);
    setBankFormInput({
      bankName: isKnown ? bank.bank_name : "Lainnya",
      customBankName: isKnown ? "" : bank.bank_name,
      accountNumber: bank.account_number,
      accountHolder: bank.account_holder,
      isPrimary: bank.is_primary,
    });
    setEditingBankId(bank.id);
    setBankFormMode("edit");
  };

  const handleSaveBankAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalBankName =
      bankFormInput.bankName === "Lainnya"
        ? bankFormInput.customBankName.trim()
        : bankFormInput.bankName.trim();

    if (!finalBankName) {
      toast.error("Pilih atau isi nama bank / e-wallet");
      return;
    }
    if (!bankFormInput.accountNumber.trim()) {
      toast.error("Nomor rekening / e-wallet wajib diisi");
      return;
    }
    if (!bankFormInput.accountHolder.trim()) {
      toast.error("Nama pemilik rekening wajib diisi");
      return;
    }

    setIsSubmittingBank(true);
    try {
      const method = bankFormMode === "edit" ? "PUT" : "POST";
      const payload = {
        id: editingBankId,
        bankName: finalBankName,
        accountNumber: bankFormInput.accountNumber.trim(),
        accountHolder: bankFormInput.accountHolder.trim(),
        isPrimary: bankFormInput.isPrimary,
      };

      const res = await fetch("/api/user/bank-accounts", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Gagal menyimpan rekening bank");
        return;
      }

      toast.success(
        bankFormMode === "edit"
          ? "Rekening bank berhasil diperbarui!"
          : "Rekening bank berhasil ditambahkan!",
      );
      setBankFormMode("list");
      setEditingBankId(null);
      fetchBankAccounts();
    } catch {
      toast.error("Terjadi kesalahan jaringan saat menyimpan rekening.");
    } finally {
      setIsSubmittingBank(false);
    }
  };

  const handleDeleteBankAccount = async (id: number) => {
    try {
      const res = await fetch(`/api/user/bank-accounts?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Gagal menghapus rekening bank.");
        return;
      }

      toast.success("Rekening bank berhasil dihapus.");
      setDeleteBankConfirmId(null);
      fetchBankAccounts();
    } catch {
      toast.error("Terjadi kesalahan jaringan saat menghapus rekening.");
    }
  };

  const copyAccountNumber = (id: number, accNum: string) => {
    navigator.clipboard.writeText(accNum);
    setCopiedBankId(id);
    toast.success("Nomor rekening tersalin ke clipboard!");
    setTimeout(() => setCopiedBankId(null), 2000);
  };

  const displayName = user?.name || user?.email?.split("@")[0] || "testing";

  const currentBalance = Number(user?.balance ?? demoBalance ?? 0);
  const currentProfit = Number(user?.profit ?? 0);
  const currentEquity = currentProfit;
  const hasFunds = currentBalance > 0 || currentProfit > 0;

  const formattedBalance = `$${currentBalance.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const formattedEquity = `$${currentEquity.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  // Deterministic account simulation metrics: Inactive when user balance & equity are $0.00
  const accountSimulation = useMemo(() => {
    if (!hasFunds) {
      return {
        isActive: false,
        margin: 0,
        freeMargin: 0,
        marginLevel: 0,
        credits: 0,
        floatingPL: 0,
        winRate: 0,
      };
    }

    const accountIdentifier = String(user?.accountNumber || user?.id || user?.email || "88910243");
    let h = 2166136261;
    for (let i = 0; i < accountIdentifier.length; i++) {
      h ^= accountIdentifier.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const seed = Math.abs(h);

    const r1 = (seed % 1000) / 1000;
    const r3 = (Math.floor(seed / 1000000) % 1000) / 1000;
    const r4 = ((((seed >> 3) ^ 0x5bf03635) >>> 0) % 1000) / 1000;

    const winRate = Math.round(64 + r1 * 22);
    const creditTiers = [50, 100, 150, 200, 250];
    const credits = creditTiers[seed % creditTiers.length];

    const effectiveBase = currentBalance > 0 ? currentBalance : currentEquity;
    const marginRatio = 0.025 + r3 * 0.03;
    const margin = Math.round(effectiveBase * marginRatio * 100) / 100;
    const floatingPL = Math.round((25 + r4 * 140) * 100) / 100;
    const freeMargin = Math.max(0, Math.round((effectiveBase + floatingPL - margin) * 100) / 100);
    const marginLevel =
      margin > 0 ? Math.round(((effectiveBase + floatingPL) / margin) * 10000) / 100 : 0;

    return {
      isActive: true,
      margin,
      freeMargin,
      marginLevel,
      credits,
      floatingPL,
      winRate,
    };
  }, [user?.accountNumber, user?.id, user?.email, currentBalance, currentEquity, hasFunds]);

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
    toast.success("Laporan masalah berhasil dikirim ke tim dukungan Gotrade!");
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
                {formattedEquity}
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
              <span className="tabular-nums font-bold text-gray-900">
                $
                {accountSimulation.margin.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
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
              <span className="tabular-nums font-bold text-gray-900">
                $
                {accountSimulation.freeMargin.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
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
              <span
                className={`tabular-nums font-bold ${
                  accountSimulation.marginLevel > 0 ? "text-emerald-600" : "text-gray-900"
                }`}
              >
                {accountSimulation.marginLevel.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                %
              </span>
            </div>

            {/* Credits */}
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Credits</span>
              <span className="tabular-nums font-bold text-gray-900">
                $
                {accountSimulation.credits.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
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
              <span
                className={`tabular-nums font-bold ${
                  accountSimulation.floatingPL > 0
                    ? "text-emerald-600"
                    : accountSimulation.floatingPL < 0
                      ? "text-rose-600"
                      : "text-gray-900"
                }`}
              >
                {accountSimulation.floatingPL > 0 ? "+$" : "$"}
                {Math.abs(accountSimulation.floatingPL).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
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
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${accountSimulation.winRate}%` }}
                  />
                </div>
                <span
                  className={`tabular-nums font-bold ${
                    accountSimulation.winRate > 0 ? "text-[#0088cc]" : "text-gray-400"
                  }`}
                >
                  {accountSimulation.winRate}%
                </span>
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
              to="/pengaturan"
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50"
            >
              <Settings className="h-5 w-5 text-gray-700" />
              <div className="flex flex-1 items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Pengaturan</span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isDark
                      ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20"
                      : "bg-amber-500/15 text-amber-700 border border-amber-500/20"
                  }`}
                >
                  {isDark ? (
                    <>
                      <Moon className="h-3 w-3" />
                      Mode Gelap
                    </>
                  ) : (
                    <>
                      <Sun className="h-3 w-3" />
                      Mode Terang
                    </>
                  )}
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Link>
            {user?.role === "admin" && (
              <Link
                to="/admin/pengaturan"
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-emerald-50/40 text-emerald-700"
              >
                <Settings className="h-5 w-5 text-emerald-600" />
                <span className="flex-1 text-sm font-semibold">
                  Pengaturan Admin (Rekening Deposit & Profit)
                </span>
                <ChevronRight className="h-4 w-4 text-emerald-600" />
              </Link>
            )}
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
          <div className="space-y-3">
            {contactPersons.filter((c) => c.active !== false).length === 0 ? (
              <div className="rounded-xl border border-gray-100 bg-white p-4 text-center text-xs text-gray-500 shadow-2xs">
                Tidak ada contact person yang aktif saat ini.
              </div>
            ) : (
              contactPersons
                .filter((c) => c.active !== false)
                .map((contact) => (
                  <div
                    key={contact.id}
                    className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-2xs"
                  >
                    {/* Header Contact */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#00a651]/20 bg-[#e6f7ef] text-[#00a651]">
                        <Headphones className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-base font-extrabold tracking-wide text-gray-900">
                          {contact.name}
                        </span>
                        <span className="text-xs text-gray-400">{contact.role}</span>
                      </div>
                    </div>

                    {/* Contact details */}
                    <div className="flex flex-col gap-2.5 border-t border-gray-100 pt-3">
                      {contact.whatsappNumber && (
                        <a
                          href={formatWaUrl(contact.whatsappNumber)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-start gap-3 transition-colors hover:text-[#00a651]"
                        >
                          <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gray-600" />
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-gray-900">
                              {contact.whatsappLabel || "Whatsapp"}
                            </span>
                            <span className="text-xs font-medium text-gray-500">
                              {contact.whatsappNumber}
                            </span>
                          </div>
                        </a>
                      )}

                      {contact.email && (
                        <a
                          href={`mailto:${contact.email}`}
                          className="flex items-start gap-3 transition-colors hover:text-[#00a651]"
                        >
                          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gray-600" />
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-gray-900">Email</span>
                            <span className="text-xs font-medium text-gray-500">
                              {contact.email}
                            </span>
                          </div>
                        </a>
                      )}
                    </div>
                  </div>
                ))
            )}
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

      {/* Modal 9: Informasi Rekening Bank (CRUD) */}
      {activeModal === "informasiBank" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#00a651]" />
                <h3 className="text-base font-bold text-gray-900">
                  {bankFormMode === "add"
                    ? "Tambah Rekening Bank"
                    : bankFormMode === "edit"
                      ? "Edit Rekening Bank"
                      : "Informasi Rekening Bank"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (bankFormMode !== "list") {
                    setBankFormMode("list");
                  } else {
                    setActiveModal(null);
                  }
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="mt-4 flex-1 overflow-y-auto pr-1">
              {bankFormMode === "list" && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      Rekening tersimpan untuk penarikan dana (withdraw):
                    </p>
                    <button
                      type="button"
                      onClick={openAddBankForm}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#00a651] px-2.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#008f45] transition-colors cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Tambah
                    </button>
                  </div>

                  {isLoadingBanks ? (
                    <div className="flex items-center justify-center py-8 text-gray-400">
                      <Loader2 className="h-6 w-6 animate-spin text-[#00a651]" />
                      <span className="ml-2 text-xs font-medium">Memuat data rekening...</span>
                    </div>
                  ) : bankAccounts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/70 p-6 text-center my-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-[#00a651]">
                        <Landmark className="h-6 w-6" />
                      </div>
                      <p className="mt-3 text-sm font-bold text-gray-900">
                        Belum Ada Rekening Bank
                      </p>
                      <p className="mt-1 text-xs text-gray-500 max-w-[240px]">
                        Anda belum mendaftarkan rekening bank. Tambahkan sekarang untuk kemudahan
                        penarikan dana.
                      </p>
                      <button
                        type="button"
                        onClick={openAddBankForm}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#00a651] px-4 py-2 text-xs font-semibold text-white hover:bg-[#008f45] transition-colors shadow-xs cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                        Tambah Rekening Baru
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {bankAccounts.map((bank) => (
                        <div
                          key={bank.id}
                          className={`relative rounded-xl border p-3.5 transition-all ${
                            bank.is_primary
                              ? "border-emerald-500/40 bg-emerald-50/40 shadow-2xs"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900 text-xs">
                                  {bank.bank_name}
                                </span>
                                {bank.is_primary && (
                                  <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-bold text-white">
                                    Utama
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 font-mono text-sm font-bold text-gray-900 tracking-wide flex items-center gap-1.5">
                                {bank.account_number}
                                <button
                                  type="button"
                                  onClick={() => copyAccountNumber(bank.id, bank.account_number)}
                                  className="text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                                  title="Salin Nomor Rekening"
                                >
                                  {copiedBankId === bank.id ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </p>
                              <p className="mt-0.5 text-[11px] text-gray-500">
                                Atas Nama:{" "}
                                <span className="font-semibold text-gray-800">
                                  {bank.account_holder}
                                </span>
                              </p>
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openEditBankForm(bank)}
                                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
                                title="Edit Rekening"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteBankConfirmId(bank.id)}
                                className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                                title="Hapus Rekening"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {/* Delete confirm inline dialog */}
                          {deleteBankConfirmId === bank.id && (
                            <div className="mt-3 border-t border-red-100 pt-2.5 animate-in fade-in duration-150">
                              <p className="text-[11px] font-semibold text-red-600">
                                Yakin ingin menghapus rekening ini?
                              </p>
                              <div className="mt-2 flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBankAccount(bank.id)}
                                  className="rounded-lg bg-red-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-red-700 cursor-pointer"
                                >
                                  Ya, Hapus
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteBankConfirmId(null)}
                                  className="rounded-lg border border-gray-200 px-3 py-1 text-[11px] font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                                >
                                  Batal
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {(bankFormMode === "add" || bankFormMode === "edit") && (
                <form onSubmit={handleSaveBankAccount} className="flex flex-col gap-3 text-xs">
                  {/* Bank Name Select */}
                  <div>
                    <label className="font-semibold text-gray-700">Bank / E-Wallet</label>
                    <select
                      value={bankFormInput.bankName}
                      onChange={(e) =>
                        setBankFormInput((prev) => ({ ...prev, bankName: e.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs focus:border-[#00a651] focus:outline-none"
                    >
                      {POPULAR_BANKS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Custom Bank Name if "Lainnya" */}
                  {bankFormInput.bankName === "Lainnya" && (
                    <div>
                      <label className="font-semibold text-gray-700">
                        Nama Bank / E-Wallet Lainnya
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Bank Neo Commerce / SeaBank"
                        value={bankFormInput.customBankName}
                        onChange={(e) =>
                          setBankFormInput((prev) => ({ ...prev, customBankName: e.target.value }))
                        }
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-[#00a651] focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Account Number */}
                  <div>
                    <label className="font-semibold text-gray-700">Nomor Rekening / E-Wallet</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Contoh: 1234567890"
                      value={bankFormInput.accountNumber}
                      onChange={(e) =>
                        setBankFormInput((prev) => ({ ...prev, accountNumber: e.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs font-mono focus:border-[#00a651] focus:outline-none"
                    />
                  </div>

                  {/* Account Holder */}
                  <div>
                    <label className="font-semibold text-gray-700">
                      Atas Nama Pemilik Rekening
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Budi Santoso"
                      value={bankFormInput.accountHolder}
                      onChange={(e) =>
                        setBankFormInput((prev) => ({ ...prev, accountHolder: e.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-[#00a651] focus:outline-none"
                    />
                    <p className="mt-1 text-[10px] text-gray-400">
                      Pastikan nama pemilik sesuai dengan nama pada buku tabungan / e-wallet.
                    </p>
                  </div>

                  {/* Primary checkbox */}
                  <label className="mt-1 flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={bankFormInput.isPrimary}
                      onChange={(e) =>
                        setBankFormInput((prev) => ({ ...prev, isPrimary: e.target.checked }))
                      }
                      className="h-4 w-4 rounded border-gray-300 text-[#00a651] focus:ring-[#00a651]"
                    />
                    <span className="text-xs font-medium text-gray-700">
                      Jadikan sebagai Rekening Utama (WD Default)
                    </span>
                  </label>

                  {/* Action buttons */}
                  <div className="mt-3 flex gap-2 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setBankFormMode("list")}
                      className="flex-1 rounded-xl border border-gray-200 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingBank}
                      className="flex-1 rounded-xl bg-[#00a651] py-2.5 text-xs font-semibold text-white hover:bg-[#008f45] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmittingBank ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Simpan Rekening"
                      )}
                    </button>
                  </div>
                </form>
              )}
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
