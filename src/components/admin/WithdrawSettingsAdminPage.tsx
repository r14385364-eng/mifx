import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpFromLine,
  CheckCircle2,
  Clock,
  Coins,
  Edit3,
  Filter,
  Percent,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  SlidersHorizontal,
  Sparkles,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { secureFetch } from "@/lib/api-client";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UserWithdrawalRule {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  accountNumber: string;
  balance: number;
  profit: number;
  profitIDR: number;
  maxWithdrawalPercent: number;
  maxDailyFrequency: number;
  todayWithdrawalCount: number;
  remainingQuota: number;
  maxWithdrawableUSD: number;
  maxWithdrawableIDR: number;
  adminFeeType: "free" | "flat" | "percent";
  adminFeeValue: number;
  minWithdrawalIDR: number;
  withdrawalStatus: "active" | "suspended" | "blocked";
  withdrawalNote: string;
  isQuotaResetToday: boolean;
  createdAt: string;
}

interface GlobalWithdrawalSettings {
  defaultMaxWithdrawalPercent: number;
  defaultMaxDailyFrequency: number;
  defaultAdminFeeType: string;
  defaultAdminFeeValue: number;
  defaultMinWithdrawalIDR: number;
}

function formatUSD(val: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(val);
}

function formatRupiah(val: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);
}

export function WithdrawSettingsAdminPage() {
  const [users, setUsers] = useState<UserWithdrawalRule[]>([]);
  const [globalSettings, setGlobalSettings] = useState<GlobalWithdrawalSettings>({
    defaultMaxWithdrawalPercent: 10,
    defaultMaxDailyFrequency: 1,
    defaultAdminFeeType: "free",
    defaultAdminFeeValue: 0,
    defaultMinWithdrawalIDR: 100000,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("rules");

  // Edit User Modal State
  const [selectedUser, setSelectedUser] = useState<UserWithdrawalRule | null>(null);
  const [formMaxPercent, setFormMaxPercent] = useState<string>("10");
  const [formMaxFrequency, setFormMaxFrequency] = useState<string>("1");
  const [formAdminFeeType, setFormAdminFeeType] = useState<"free" | "flat" | "percent">("free");
  const [formAdminFeeValue, setFormAdminFeeValue] = useState<string>("0");
  const [formMinIDR, setFormMinIDR] = useState<string>("100000");
  const [formStatus, setFormStatus] = useState<"active" | "suspended" | "blocked">("active");
  const [formNote, setFormNote] = useState<string>("");
  const [savingRule, setSavingRule] = useState(false);

  // Global Settings Form State
  const [globalPercent, setGlobalPercent] = useState<string>("10");
  const [globalFrequency, setGlobalFrequency] = useState<string>("1");
  const [globalFeeType, setGlobalFeeType] = useState<string>("free");
  const [globalFeeValue, setGlobalFeeValue] = useState<string>("0");
  const [globalMinIDR, setGlobalMinIDR] = useState<string>("100000");
  const [applyToAllUsers, setApplyToAllUsers] = useState(false);
  const [savingGlobal, setSavingGlobal] = useState(false);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await secureFetch("/api/admin/withdrawal-rules");
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(data.users || []);
        if (data.globalSettings) {
          setGlobalSettings(data.globalSettings);
          setGlobalPercent(String(data.globalSettings.defaultMaxWithdrawalPercent || 10));
          setGlobalFrequency(String(data.globalSettings.defaultMaxDailyFrequency || 1));
          setGlobalFeeType(data.globalSettings.defaultAdminFeeType || "free");
          setGlobalFeeValue(String(data.globalSettings.defaultAdminFeeValue || 0));
          setGlobalMinIDR(String(data.globalSettings.defaultMinWithdrawalIDR || 100000));
        }
      } else {
        toast.error(data.message || "Gagal memuat aturan penarikan");
      }
    } catch {
      toast.error("Terjadi kesalahan saat memuat data penarikan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRules();
  }, []);

  const handleOpenEdit = (u: UserWithdrawalRule) => {
    setSelectedUser(u);
    setFormMaxPercent(String(u.maxWithdrawalPercent));
    setFormMaxFrequency(String(u.maxDailyFrequency));
    setFormAdminFeeType(u.adminFeeType);
    setFormAdminFeeValue(String(u.adminFeeValue));
    setFormMinIDR(String(u.minWithdrawalIDR));
    setFormStatus(u.withdrawalStatus);
    setFormNote(u.withdrawalNote || "");
  };

  const handleSaveUserRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSavingRule(true);
    try {
      const res = await secureFetch("/api/admin/withdrawal-rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          maxWithdrawalPercent: Number(formMaxPercent),
          maxDailyFrequency: Number(formMaxFrequency),
          adminFeeType: formAdminFeeType,
          adminFeeValue: Number(formAdminFeeValue),
          minWithdrawalIDR: Number(formMinIDR),
          withdrawalStatus: formStatus,
          withdrawalNote: formNote,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Gagal menyimpan aturan penarikan");
        return;
      }
      toast.success(`Aturan penarikan untuk ${selectedUser.name} berhasil diperbarui!`);
      setSelectedUser(null);
      void fetchRules();
    } catch {
      toast.error("Terjadi kesalahan saat menghubungi server");
    } finally {
      setSavingRule(false);
    }
  };

  const handleResetQuota = async (userId: number, userName: string) => {
    try {
      const res = await secureFetch("/api/admin/withdrawal-rules/reset-quota", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Gagal me-reset kuota");
        return;
      }
      toast.success(`Kuota penarikan harian ${userName} berhasil di-reset untuk hari ini!`);
      void fetchRules();
    } catch {
      toast.error("Gagal menghubungi server");
    }
  };

  const handleSaveGlobalSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGlobal(true);
    try {
      const res = await secureFetch("/api/admin/withdrawal-rules/global", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultMaxWithdrawalPercent: Number(globalPercent),
          defaultMaxDailyFrequency: Number(globalFrequency),
          defaultAdminFeeType: globalFeeType,
          defaultAdminFeeValue: Number(globalFeeValue),
          defaultMinWithdrawalIDR: Number(globalMinIDR),
          applyToAllUsers,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Gagal memperbarui aturan global");
        return;
      }
      toast.success(data.message || "Aturan global berhasil diperbarui!");
      void fetchRules();
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setSavingGlobal(false);
    }
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(kw) ||
        u.email.toLowerCase().includes(kw) ||
        u.accountNumber.includes(kw) ||
        u.phone.includes(kw);
      const matchesStatus = statusFilter === "all" || u.withdrawalStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [users, search, statusFilter]);

  // Aggregate Stats
  const totalProfitUSD = users.reduce((acc, u) => acc + (u.profit || 0), 0);
  const totalProfitIDR = totalProfitUSD * 16000;
  const activeCount = users.filter((u) => u.withdrawalStatus === "active").length;
  const suspendedCount = users.filter((u) => u.withdrawalStatus !== "active").length;

  return (
    <AdminLayout
      title="Pengaturan Withdraw"
      subtitle="Atur setiap user yang terdaftar: biaya admin, batas frekuensi, batas maksimal penarikan dari profit, dan kuota harian."
    >
      <div className="flex flex-col gap-6">
        {/* Top Action & Navigation Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">
                Konfigurasi Penarikan Tiap Pengguna (Withdraw Rules)
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sumber dana penarikan trader terkunci murni berasal dari data{" "}
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Akumulasi Profit Total (/admin/profit)
                </span>
                , bukan dari modal awal deposit.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="h-9 text-xs gap-1.5 font-medium">
              <Link to="/admin/withdraw">
                <ArrowUpFromLine className="h-3.5 w-3.5" />
                Buka Antrean Transaksi Withdraw
                <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>
        </div>

        {/* KPI Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-xs border-border/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Akumulasi Profit Trader
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Coins className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-extrabold text-foreground">
                {formatRupiah(totalProfitIDR)}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                setara {formatUSD(totalProfitUSD)} (Sumber penarikan /admin/profit)
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-xs border-border/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Status Izin Penarikan
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold text-foreground">{activeCount}</span>
                <span className="text-xs text-emerald-600 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200">
                  Aktif
                </span>
                {suspendedCount > 0 && (
                  <span className="text-xs text-amber-600 font-medium bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200">
                    {suspendedCount} Dibatasi
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Total {users.length} akun trader terdaftar
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-xs border-border/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Aturan Global Default
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Sliders className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-extrabold text-foreground">
                {globalSettings.defaultMaxWithdrawalPercent}% Profit
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Frekuensi: {globalSettings.defaultMaxDailyFrequency}x/hari • Biaya:{" "}
                {globalSettings.defaultAdminFeeType === "free" ? "Gratis" : "Berbayar"}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-xs border-border/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Sumber Dana Penarikan
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Sparkles className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold text-foreground">Akumulasi Profit Total</div>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                Terkunci ketat: modal awal deposit aman dan tidak dapat ditarik trader.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs Container */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md h-auto p-1 bg-muted/60">
            <TabsTrigger value="rules" className="text-xs py-2 flex items-center gap-1.5 font-bold">
              <Sliders className="h-3.5 w-3.5" />
              Aturan Per Pengguna ({users.length})
            </TabsTrigger>
            <TabsTrigger
              value="global"
              className="text-xs py-2 flex items-center gap-1.5 font-bold"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              Aturan Global Default
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: User Withdrawal Rules */}
          <TabsContent value="rules" className="mt-4 flex flex-col gap-4">
            <Card className="shadow-xs border-border/80">
              <CardHeader className="pb-3 border-b">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Daftar Aturan Penarikan Pengguna
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Atur persentase maksimal dari Akumulasi Profit Total, batas frekuensi harian,
                      biaya admin, dan status izin penarikan untuk setiap akun.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchRules}
                    disabled={loading}
                    className="h-8 text-xs gap-1.5"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                    Refresh Data
                  </Button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                  <div className="relative sm:col-span-2">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Cari trader berdasarkan nama, username, email, atau no akun..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 h-9 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Semua Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Status Akun</SelectItem>
                        <SelectItem value="active">Aktif (Bisa Withdraw)</SelectItem>
                        <SelectItem value="suspended">Ditangguhkan (Suspended)</SelectItem>
                        <SelectItem value="blocked">Dibekukan (Blocked)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="text-xs font-semibold">Pengguna & Akun</TableHead>
                      <TableHead className="text-xs font-semibold">
                        Akumulasi Profit (/admin/profit)
                      </TableHead>
                      <TableHead className="text-xs font-semibold">
                        Batas Maksimal (% Profit)
                      </TableHead>
                      <TableHead className="text-xs font-semibold">Frekuensi Harian</TableHead>
                      <TableHead className="text-xs font-semibold">Biaya Admin</TableHead>
                      <TableHead className="text-xs font-semibold">Min. WD</TableHead>
                      <TableHead className="text-xs font-semibold">Status Izin</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                          <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                          Memuat data aturan penarikan trader...
                        </TableCell>
                      </TableRow>
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                          <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          Tidak ada pengguna yang cocok dengan kriteria pencarian.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((u) => {
                        const hasProfit = u.profit > 0;
                        const isBlocked = u.withdrawalStatus === "blocked";
                        const isSuspended = u.withdrawalStatus === "suspended";

                        return (
                          <TableRow key={u.id} className="hover:bg-muted/30">
                            {/* User & Account */}
                            <TableCell className="align-middle py-3">
                              <div className="flex flex-col">
                                <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                                  {u.name}
                                </span>
                                <span className="text-[11px] text-muted-foreground">{u.email}</span>
                                <span className="text-[10px] font-mono text-muted-foreground/80">
                                  No Akun: {u.accountNumber}
                                </span>
                              </div>
                            </TableCell>

                            {/* Profit Source */}
                            <TableCell className="align-middle py-3">
                              <div className="flex flex-col">
                                <span
                                  className={`text-xs font-bold ${
                                    hasProfit
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {formatUSD(u.profit)}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {formatRupiah(u.profitIDR)}
                                </span>
                                <span className="text-[10px] text-muted-foreground/70">
                                  Saldo: {formatUSD(u.balance)}
                                </span>
                              </div>
                            </TableCell>

                            {/* Max % Limit */}
                            <TableCell className="align-middle py-3">
                              <div className="flex flex-col">
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-foreground">
                                  <Badge
                                    variant="outline"
                                    className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[11px] font-bold"
                                  >
                                    {u.maxWithdrawalPercent}%
                                  </Badge>
                                </span>
                                <span className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                                  Maks: {formatRupiah(u.maxWithdrawableIDR)}
                                </span>
                              </div>
                            </TableCell>

                            {/* Daily Frequency & Quota */}
                            <TableCell className="align-middle py-3">
                              <div className="flex flex-col gap-1">
                                <span className="text-xs font-medium">
                                  {u.maxDailyFrequency}x per hari
                                </span>
                                <div className="flex items-center gap-1">
                                  <Badge
                                    variant="secondary"
                                    className={`text-[10px] font-mono px-1.5 py-0 ${
                                      u.remainingQuota > 0
                                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                                        : "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                                    }`}
                                  >
                                    Sisa: {u.remainingQuota}/{u.maxDailyFrequency}
                                  </Badge>
                                  {u.todayWithdrawalCount > 0 && (
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => handleResetQuota(u.id, u.name)}
                                      title="Reset Kuota Hari Ini"
                                      className="h-5 w-5 text-muted-foreground hover:text-foreground"
                                    >
                                      <RotateCcw className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </TableCell>

                            {/* Admin Fee */}
                            <TableCell className="align-middle py-3">
                              <div className="flex flex-col">
                                {u.adminFeeType === "free" ? (
                                  <Badge
                                    variant="outline"
                                    className="bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 w-fit text-[10px]"
                                  >
                                    Gratis
                                  </Badge>
                                ) : u.adminFeeType === "flat" ? (
                                  <span className="text-xs font-medium text-foreground">
                                    {formatRupiah(u.adminFeeValue)} Flat
                                  </span>
                                ) : (
                                  <span className="text-xs font-medium text-foreground">
                                    {u.adminFeeValue}% dari WD
                                  </span>
                                )}
                              </div>
                            </TableCell>

                            {/* Min Withdrawal */}
                            <TableCell className="align-middle py-3 text-xs font-mono text-muted-foreground">
                              {formatRupiah(u.minWithdrawalIDR)}
                            </TableCell>

                            {/* Status */}
                            <TableCell className="align-middle py-3">
                              <div className="flex flex-col gap-0.5">
                                {isBlocked ? (
                                  <Badge
                                    variant="destructive"
                                    className="text-[10px] w-fit flex items-center gap-1"
                                  >
                                    <XCircle className="h-3 w-3" />
                                    Dibekukan
                                  </Badge>
                                ) : isSuspended ? (
                                  <Badge
                                    variant="outline"
                                    className="bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300 text-[10px] w-fit flex items-center gap-1"
                                  >
                                    <AlertCircle className="h-3 w-3" />
                                    Ditangguhkan
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300 text-[10px] w-fit flex items-center gap-1"
                                  >
                                    <CheckCircle2 className="h-3 w-3" />
                                    Aktif
                                  </Badge>
                                )}
                                {u.withdrawalNote && (
                                  <span
                                    className="text-[10px] text-muted-foreground truncate max-w-[120px]"
                                    title={u.withdrawalNote}
                                  >
                                    {u.withdrawalNote}
                                  </span>
                                )}
                              </div>
                            </TableCell>

                            {/* Actions */}
                            <TableCell className="align-middle py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenEdit(u)}
                                  className="h-7 text-xs px-2.5 gap-1"
                                >
                                  <Edit3 className="h-3 w-3" />
                                  Atur Rule
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: Global Settings Form */}
          <TabsContent value="global" className="mt-4">
            <Card className="shadow-xs border-border/80 max-w-2xl">
              <CardHeader className="border-b">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-purple-600" />
                  Konfigurasi Aturan Bawaan (Global Default Settings)
                </CardTitle>
                <CardDescription className="text-xs">
                  Aturan default ini akan otomatis diterapkan ke setiap akun trader yang baru
                  mendaftar. Anda juga dapat menerapkannya langsung ke seluruh user yang ada.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSaveGlobalSettings} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">
                        Batas Maksimal Penarikan (% dari Akumulasi Profit)
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          value={globalPercent}
                          onChange={(e) => setGlobalPercent(e.target.value)}
                          className="h-9 text-xs pr-8"
                          required
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">
                          %
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Standar platform adalah 10% dari Akumulasi Profit Total.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">
                        Batas Frekuensi Penarikan per Hari
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          min={1}
                          max={50}
                          value={globalFrequency}
                          onChange={(e) => setGlobalFrequency(e.target.value)}
                          className="h-9 text-xs pr-12"
                          required
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">
                          x/hari
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Default: 1 kali per hari kalender WIB (reset pukul 00:00 WIB).
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Model Biaya Admin (Fee)</Label>
                      <Select value={globalFeeType} onValueChange={setGlobalFeeType}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Bebas Biaya (Gratis)</SelectItem>
                          <SelectItem value="flat">Nominal Tetap (Flat IDR)</SelectItem>
                          <SelectItem value="percent">Persentase (%) dari Penarikan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">
                        Nilai Biaya Admin {globalFeeType === "percent" ? "(%)" : "(Rp IDR)"}
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        disabled={globalFeeType === "free"}
                        value={globalFeeType === "free" ? "0" : globalFeeValue}
                        onChange={(e) => setGlobalFeeValue(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Batas Minimal Penarikan (Rupiah IDR)
                    </Label>
                    <Input
                      type="number"
                      min={10000}
                      step={5000}
                      value={globalMinIDR}
                      onChange={(e) => setGlobalMinIDR(e.target.value)}
                      className="h-9 text-xs"
                      required
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Batas minimal penarikan per transaksi (bawaan: Rp 100.000 IDR).
                    </p>
                  </div>

                  <div className="pt-2 border-t">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={applyToAllUsers}
                        onChange={(e) => setApplyToAllUsers(e.target.checked)}
                        className="rounded border-border mt-0.5 text-primary focus:ring-primary"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground">
                          Terapkan Aturan Ini ke Seluruh Trader yang Ada
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Jika dicentang, semua user yang terdaftar akan langsung diperbarui
                          menggunakan batas persen, frekuensi, dan biaya admin ini.
                        </span>
                      </div>
                    </label>
                  </div>

                  <div className="pt-3 flex justify-end">
                    <Button
                      type="submit"
                      disabled={savingGlobal}
                      className="h-9 text-xs font-bold gap-1.5"
                    >
                      {savingGlobal && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                      Simpan Konfigurasi Default Global
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* EDIT USER RULE DIALOG */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Sliders className="h-4 w-4 text-primary" />
              Atur Ketentuan Penarikan — {selectedUser?.name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Atur parameter limit penarikan khusus untuk akun ini. Dana penarikan hanya berasal
              dari Akumulasi Profit Total akun.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <form onSubmit={handleSaveUserRule} className="space-y-4 pt-1">
              {/* Account Quick Info */}
              <div className="p-3 rounded-lg bg-muted/50 border flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-foreground">{selectedUser.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    No Akun: {selectedUser.accountNumber} • {selectedUser.email}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-600 dark:text-emerald-400">
                    Profit: {formatUSD(selectedUser.profit)}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {formatRupiah(selectedUser.profitIDR)}
                  </div>
                </div>
              </div>

              {/* Limit Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Batas Maksimal (% Profit)</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={formMaxPercent}
                      onChange={(e) => setFormMaxPercent(e.target.value)}
                      className="h-9 text-xs pr-8"
                      required
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">
                      %
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Maks: Rp{" "}
                    {Math.floor(
                      selectedUser.profitIDR * (Number(formMaxPercent) / 100),
                    ).toLocaleString("id-ID")}
                  </p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Frekuensi Harian</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      value={formMaxFrequency}
                      onChange={(e) => setFormMaxFrequency(e.target.value)}
                      className="h-9 text-xs pr-12"
                      required
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">
                      x/hari
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Reset otomatis setiap 00:00 WIB
                  </p>
                </div>
              </div>

              {/* Admin Fee Settings */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Model Biaya Admin</Label>
                  <Select
                    value={formAdminFeeType}
                    onValueChange={(val: "free" | "flat" | "percent") => setFormAdminFeeType(val)}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Bebas Biaya (Gratis)</SelectItem>
                      <SelectItem value="flat">Nominal Tetap (Flat IDR)</SelectItem>
                      <SelectItem value="percent">Persentase (%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">
                    Besaran Biaya {formAdminFeeType === "percent" ? "(%)" : "(Rp)"}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    disabled={formAdminFeeType === "free"}
                    value={formAdminFeeType === "free" ? "0" : formAdminFeeValue}
                    onChange={(e) => setFormAdminFeeValue(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Min Withdrawal & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Minimal Penarikan (IDR)</Label>
                  <Input
                    type="number"
                    min={10000}
                    step={5000}
                    value={formMinIDR}
                    onChange={(e) => setFormMinIDR(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Status Izin Penarikan</Label>
                  <Select
                    value={formStatus}
                    onValueChange={(val: "active" | "suspended" | "blocked") => setFormStatus(val)}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktif (Diizinkan)</SelectItem>
                      <SelectItem value="suspended">Ditangguhkan Sementara</SelectItem>
                      <SelectItem value="blocked">Dibekukan (Dilarang)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Admin Note */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold">
                  Catatan Khusus untuk User (Opsional)
                </Label>
                <Input
                  placeholder="Misal: Penarikan dibatasi sementara untuk verifikasi dokumen KYC..."
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  className="h-9 text-xs"
                />
                <p className="text-[10px] text-muted-foreground">
                  Catatan ini akan tampil pada banner aplikasi trader jika status dibatasi.
                </p>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedUser(null)}
                  className="h-9 text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={savingRule}
                  className="h-9 text-xs font-bold gap-1.5"
                >
                  {savingRule && <RefreshCw className="h-3 w-3 animate-spin" />}
                  Simpan Aturan User
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
