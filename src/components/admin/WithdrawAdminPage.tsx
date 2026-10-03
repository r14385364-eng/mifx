import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDownToLine,
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
  Sparkles,
  User,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { secureFetch } from "@/lib/api-client";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { TransactionPage } from "@/components/admin/TransactionPage";
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

export function WithdrawAdminPage() {
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
          setGlobalPercent(String(data.globalSettings.defaultMaxWithdrawalPercent));
          setGlobalFrequency(String(data.globalSettings.defaultMaxDailyFrequency));
          setGlobalFeeType(data.globalSettings.defaultAdminFeeType || "free");
          setGlobalFeeValue(String(data.globalSettings.defaultAdminFeeValue || 0));
          setGlobalMinIDR(String(data.globalSettings.defaultMinWithdrawalIDR || 100000));
        }
      } else {
        toast.error(data.message || "Gagal memuat aturan penarikan");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan saat mengambil data aturan penarikan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRules();
  }, []);

  const openEditModal = (u: UserWithdrawalRule) => {
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
          withdrawalNote: formNote.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Gagal menyimpan aturan");
        return;
      }

      toast.success("Aturan penarikan user berhasil diperbarui!");
      setSelectedUser(null);
      void fetchRules();
    } catch {
      toast.error("Terjadi kesalahan jaringan saat menyimpan aturan user");
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
        toast.error(data.message || "Gagal mereset kuota");
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
      title="Kelola Penarikan Dana (Withdraw)"
      subtitle="Atur batas maksimal penarikan, frekuensi harian, biaya admin per user, serta tinjau permintaan penarikan."
    >
      <div className="flex flex-col gap-6">
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
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 max-w-xl h-auto p-1 bg-muted/60">
            <TabsTrigger value="rules" className="text-xs py-2 flex items-center gap-1.5 font-bold">
              <Sliders className="h-3.5 w-3.5" />
              Aturan Per Pengguna ({users.length})
            </TabsTrigger>
            <TabsTrigger
              value="transactions"
              className="text-xs py-2 flex items-center gap-1.5 font-bold"
            >
              <ArrowUpFromLine className="h-3.5 w-3.5" />
              Antrean Permintaan Withdraw
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
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari trader berdasarkan nama, email, no. akun, atau HP..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 text-xs h-9"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue placeholder="Semua Status Izin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status Izin</SelectItem>
                      <SelectItem value="active">Diizinkan (Aktif)</SelectItem>
                      <SelectItem value="suspended">Ditangguhkan</SelectItem>
                      <SelectItem value="blocked">Dibekukan (Blocked)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="text-xs">Trader / Akun</TableHead>
                        <TableHead className="text-xs">Akumulasi Profit (/admin/profit)</TableHead>
                        <TableHead className="text-xs">Batas Maksimal (% & Nominal)</TableHead>
                        <TableHead className="text-xs">Frekuensi / Hari</TableHead>
                        <TableHead className="text-xs">Biaya Admin</TableHead>
                        <TableHead className="text-xs">Status Izin</TableHead>
                        <TableHead className="text-xs text-right">Aksi Kontrol</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center py-10 text-xs text-muted-foreground"
                          >
                            <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                            Memuat data konfigurasi penarikan user...
                          </TableCell>
                        </TableRow>
                      ) : filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center py-10 text-xs text-muted-foreground"
                          >
                            Tidak ada akun trader yang cocok dengan filter pencarian.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map((u) => {
                          const profitRupiah = u.profit * 16000;
                          const maxRupiah = Math.floor(
                            profitRupiah * (u.maxWithdrawalPercent / 100),
                          );
                          const maxUSD =
                            Math.round(u.profit * (u.maxWithdrawalPercent / 100) * 100) / 100;

                          return (
                            <TableRow key={u.id} className="hover:bg-muted/20">
                              <TableCell className="text-xs py-3">
                                <div className="font-bold text-foreground flex items-center gap-1.5">
                                  {u.name}
                                </div>
                                <div className="text-[11px] text-muted-foreground">{u.email}</div>
                                <div className="text-[10px] font-mono text-muted-foreground">
                                  No. Akun: {u.accountNumber}
                                </div>
                              </TableCell>

                              <TableCell className="text-xs py-3">
                                <div className="font-extrabold text-emerald-600 dark:text-emerald-400">
                                  {formatRupiah(profitRupiah)}
                                </div>
                                <div className="text-[10px] text-muted-foreground font-medium">
                                  setara {formatUSD(u.profit)}
                                </div>
                                <div className="text-[9px] text-muted-foreground/80 mt-0.5">
                                  Total Saldo: {formatUSD(u.balance)}
                                </div>
                              </TableCell>

                              <TableCell className="text-xs py-3">
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold text-xs">
                                  <Percent className="h-3 w-3" />
                                  {u.maxWithdrawalPercent}% Profit
                                </div>
                                <div className="text-[11px] font-semibold text-foreground mt-1">
                                  Maks. {formatRupiah(maxRupiah)}
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                  setara {formatUSD(maxUSD)}
                                </div>
                              </TableCell>

                              <TableCell className="text-xs py-3">
                                <div className="font-bold text-foreground">
                                  {u.maxDailyFrequency}x per hari
                                </div>
                                <div className="text-[11px] text-muted-foreground mt-0.5">
                                  {u.remainingQuota > 0 ? (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                      Sisa Kuota: {u.remainingQuota}x
                                    </span>
                                  ) : (
                                    <span className="text-rose-500 font-bold">Kuota Habis</span>
                                  )}
                                </div>
                                {u.isQuotaResetToday && (
                                  <span className="text-[9px] bg-amber-500/10 text-amber-600 px-1.5 py-0.2 rounded font-medium">
                                    Di-reset Hari Ini
                                  </span>
                                )}
                              </TableCell>

                              <TableCell className="text-xs py-3">
                                {u.adminFeeType === "free" ? (
                                  <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                                    Gratis (0%)
                                  </span>
                                ) : u.adminFeeType === "flat" ? (
                                  <span className="font-bold text-foreground">
                                    {formatRupiah(u.adminFeeValue)}
                                  </span>
                                ) : (
                                  <span className="font-bold text-foreground">
                                    {u.adminFeeValue}% per Tarik
                                  </span>
                                )}
                                <div className="text-[10px] text-muted-foreground mt-0.5">
                                  Min: {formatRupiah(u.minWithdrawalIDR)}
                                </div>
                              </TableCell>

                              <TableCell className="text-xs py-3">
                                {u.withdrawalStatus === "active" ? (
                                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] hover:bg-emerald-500/20">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Diizinkan
                                  </Badge>
                                ) : u.withdrawalStatus === "suspended" ? (
                                  <Badge
                                    variant="outline"
                                    className="border-amber-500 text-amber-600 text-[10px]"
                                  >
                                    <Clock className="h-3 w-3 mr-1" />
                                    Ditangguhkan
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive" className="text-[10px]">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Dibekukan
                                  </Badge>
                                )}
                                {u.withdrawalNote && (
                                  <p
                                    className="text-[10px] text-muted-foreground truncate max-w-[120px] mt-1"
                                    title={u.withdrawalNote}
                                  >
                                    {u.withdrawalNote}
                                  </p>
                                )}
                              </TableCell>

                              <TableCell className="text-xs text-right py-3 space-x-1 whitespace-nowrap">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleResetQuota(u.id, u.name)}
                                  className="h-8 text-[11px] gap-1 px-2 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
                                  title="Beri kuota tambahan atau reset penarikan hari ini"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                  Reset Kuota
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => openEditModal(u)}
                                  className="h-8 text-[11px] gap-1 px-2.5 font-bold"
                                >
                                  <Edit3 className="h-3 w-3" />
                                  Atur Ketentuan
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: Withdraw Transactions Queue (Approve / Reject) */}
          <TabsContent value="transactions" className="mt-4">
            <TransactionPage type="Withdraw" transactions={[]} />
          </TabsContent>

          {/* TAB 3: Global Default Settings */}
          <TabsContent value="global" className="mt-4">
            <Card className="max-w-2xl shadow-xs border-border/80">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-primary" />
                  Konfigurasi Aturan Global Penarikan
                </CardTitle>
                <CardDescription className="text-xs">
                  Aturan default ini diterapkan secara otomatis kepada semua akun trader baru yang
                  mendaftar. Anda juga dapat menerapkan perubahan ini ke seluruh akun pengguna aktif
                  sekaligus.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5">
                <form onSubmit={handleSaveGlobalSettings} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="globalPercent" className="text-xs font-semibold">
                        Batas Maksimal Penarikan Default (% Profit)
                      </Label>
                      <div className="relative">
                        <Input
                          id="globalPercent"
                          type="number"
                          min="1"
                          max="100"
                          value={globalPercent}
                          onChange={(e) => setGlobalPercent(e.target.value)}
                          className="h-9 text-xs pr-8 font-bold"
                          required
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-bold">
                          %
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Standar platform: 10% dari Akumulasi Profit Total.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="globalFrequency" className="text-xs font-semibold">
                        Batas Frekuensi Penarikan (Per Hari)
                      </Label>
                      <Input
                        id="globalFrequency"
                        type="number"
                        min="1"
                        max="20"
                        value={globalFrequency}
                        onChange={(e) => setGlobalFrequency(e.target.value)}
                        className="h-9 text-xs font-bold"
                        required
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Standar platform: 1 kali per hari kalender (WIB).
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="globalFeeType" className="text-xs font-semibold">
                        Model Biaya Admin
                      </Label>
                      <Select value={globalFeeType} onValueChange={setGlobalFeeType}>
                        <SelectTrigger id="globalFeeType" className="h-9 text-xs">
                          <SelectValue placeholder="Pilih Model Biaya" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Bebas Biaya (Gratis / Rp 0)</SelectItem>
                          <SelectItem value="flat">Nominal Tetap (Rupiah IDR)</SelectItem>
                          <SelectItem value="percent">Persentase (%) dari Nominal Tarik</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {globalFeeType !== "free" && (
                      <div className="space-y-1.5">
                        <Label htmlFor="globalFeeValue" className="text-xs font-semibold">
                          {globalFeeType === "flat"
                            ? "Nominal Biaya (IDR)"
                            : "Persentase Biaya (%)"}
                        </Label>
                        <Input
                          id="globalFeeValue"
                          type="number"
                          min="0"
                          value={globalFeeValue}
                          onChange={(e) => setGlobalFeeValue(e.target.value)}
                          className="h-9 text-xs font-bold"
                          required
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="globalMinIDR" className="text-xs font-semibold">
                      Minimal Nominal Penarikan (IDR)
                    </Label>
                    <Input
                      id="globalMinIDR"
                      type="number"
                      min="10000"
                      step="10000"
                      value={globalMinIDR}
                      onChange={(e) => setGlobalMinIDR(e.target.value)}
                      className="h-9 text-xs font-bold"
                      required
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Standar: Rp 100.000 (~$6.25 USD).
                    </p>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-muted/40 rounded-xl border border-border/80">
                    <input
                      type="checkbox"
                      id="applyAll"
                      checked={applyToAllUsers}
                      onChange={(e) => setApplyToAllUsers(e.target.checked)}
                      className="size-4 rounded text-primary focus:ring-primary cursor-pointer"
                    />
                    <Label htmlFor="applyAll" className="text-xs font-semibold cursor-pointer">
                      Terapkan aturan ini langsung ke SELURUH akun pengguna yang telah terdaftar
                      saat ini.
                    </Label>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      type="submit"
                      disabled={savingGlobal}
                      className="text-xs font-bold gap-1.5"
                    >
                      {savingGlobal ? (
                        <>
                          <RefreshCw className="size-3.5 animate-spin" /> Menyimpan...
                        </>
                      ) : (
                        "Simpan Perubahan Aturan Global"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* MODAL: ATUR KETENTUAN PENARIKAN USER */}
        <Dialog
          open={selectedUser !== null}
          onOpenChange={(open) => !open && setSelectedUser(null)}
        >
          <DialogContent className="max-w-lg max-h-[88vh] sm:max-h-[90vh] flex flex-col p-0 overflow-hidden">
            {selectedUser && (
              <form
                onSubmit={handleSaveUserRule}
                className="flex flex-col h-full max-h-[88vh] sm:max-h-[90vh]"
              >
                <DialogHeader className="p-4 sm:p-6 pb-3 border-b shrink-0 text-left">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Sliders className="h-5 w-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-base font-bold">
                        Atur Ketentuan Penarikan Trader
                      </DialogTitle>
                      <DialogDescription className="text-xs">
                        Ubah batas penarikan khusus untuk {selectedUser.name} ({selectedUser.email})
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div
                  className="flex-1 overflow-y-auto overscroll-contain touch-pan-y p-4 sm:p-6 space-y-4"
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
                  {/* Trader Snapshot */}
                  <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Akun Trader:</span>
                      <span className="font-bold text-foreground">
                        {selectedUser.name} • {selectedUser.accountNumber}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-t pt-1.5">
                      <span className="text-muted-foreground flex items-center gap-1 font-medium">
                        <Coins className="h-3.5 w-3.5 text-emerald-600" />
                        Akumulasi Profit Total:
                      </span>
                      <div className="text-right">
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                          {formatRupiah(selectedUser.profit * 16000)}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          setara {formatUSD(selectedUser.profit)} (data /admin/profit)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Batas Maksimal % Profit */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="formMaxPercent" className="text-xs font-bold text-foreground">
                        Batas Maksimal Penarikan (% dari Akumulasi Profit)
                      </Label>
                      <span className="text-xs font-extrabold text-primary">
                        {formMaxPercent}% Profit
                      </span>
                    </div>
                    <div className="relative">
                      <Input
                        id="formMaxPercent"
                        type="number"
                        min="1"
                        max="100"
                        value={formMaxPercent}
                        onChange={(e) => setFormMaxPercent(e.target.value)}
                        className="h-10 text-sm font-bold pr-8"
                        required
                      />
                      <span className="absolute right-3 top-2.5 text-sm font-bold text-muted-foreground">
                        %
                      </span>
                    </div>

                    {/* Presets */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[5, 10, 15, 20, 30, 50, 100].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setFormMaxPercent(String(p))}
                          className={`px-2.5 py-1 rounded-md text-xs font-bold border transition-colors ${
                            formMaxPercent === String(p)
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background border-border/80 hover:bg-muted text-muted-foreground"
                          }`}
                        >
                          {p}%
                        </button>
                      ))}
                    </div>

                    {/* Live Preview Limit */}
                    <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs flex justify-between items-center">
                      <span className="text-emerald-800 dark:text-emerald-300 font-medium">
                        Nominal Maksimal Penarikan Hari Ini:
                      </span>
                      <span className="font-extrabold text-emerald-700 dark:text-emerald-300">
                        {formatRupiah(
                          Math.floor(
                            (selectedUser.profit * 16000 * Number(formMaxPercent || 10)) / 100,
                          ),
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Frekuensi Per Hari */}
                  <div className="space-y-1.5">
                    <Label htmlFor="formMaxFrequency" className="text-xs font-bold text-foreground">
                      Batas Frekuensi Penarikan (Berapa Kali Per Hari)
                    </Label>
                    <Input
                      id="formMaxFrequency"
                      type="number"
                      min="1"
                      max="50"
                      value={formMaxFrequency}
                      onChange={(e) => setFormMaxFrequency(e.target.value)}
                      className="h-9 text-xs font-bold"
                      required
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Contoh: 1x sehari, 2x sehari, dst. Kuota di-reset otomatis setiap pukul 00:00
                      WIB.
                    </p>
                  </div>

                  {/* Biaya Admin */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="formAdminFeeType"
                        className="text-xs font-bold text-foreground"
                      >
                        Biaya Admin
                      </Label>
                      <Select
                        value={formAdminFeeType}
                        onValueChange={(val: "free" | "flat" | "percent") =>
                          setFormAdminFeeType(val)
                        }
                      >
                        <SelectTrigger id="formAdminFeeType" className="h-9 text-xs">
                          <SelectValue placeholder="Tipe Biaya" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Bebas Biaya (Gratis)</SelectItem>
                          <SelectItem value="flat">Nominal Tetap (Rp)</SelectItem>
                          <SelectItem value="percent">Persentase (%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formAdminFeeType !== "free" && (
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="formAdminFeeValue"
                          className="text-xs font-bold text-foreground"
                        >
                          {formAdminFeeType === "flat" ? "Nominal Biaya (IDR)" : "Persentase (%)"}
                        </Label>
                        <Input
                          id="formAdminFeeValue"
                          type="number"
                          min="0"
                          value={formAdminFeeValue}
                          onChange={(e) => setFormAdminFeeValue(e.target.value)}
                          className="h-9 text-xs font-bold"
                          required
                        />
                      </div>
                    )}
                  </div>

                  {/* Minimal Penarikan */}
                  <div className="space-y-1.5">
                    <Label htmlFor="formMinIDR" className="text-xs font-bold text-foreground">
                      Batas Minimal Penarikan (IDR)
                    </Label>
                    <Input
                      id="formMinIDR"
                      type="number"
                      min="10000"
                      step="10000"
                      value={formMinIDR}
                      onChange={(e) => setFormMinIDR(e.target.value)}
                      className="h-9 text-xs font-bold"
                      required
                    />
                  </div>

                  {/* Status Izin Penarikan */}
                  <div className="space-y-1.5">
                    <Label htmlFor="formStatus" className="text-xs font-bold text-foreground">
                      Status Izin Penarikan Pengguna
                    </Label>
                    <Select
                      value={formStatus}
                      onValueChange={(val: "active" | "suspended" | "blocked") =>
                        setFormStatus(val)
                      }
                    >
                      <SelectTrigger id="formStatus" className="h-9 text-xs">
                        <SelectValue placeholder="Status Izin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Diizinkan (Normal)</SelectItem>
                        <SelectItem value="suspended">
                          Ditangguhkan Sementara (Suspended)
                        </SelectItem>
                        <SelectItem value="blocked">Dibekukan Total (Blocked)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Catatan Admin */}
                  <div className="space-y-1.5">
                    <Label htmlFor="formNote" className="text-xs font-medium text-foreground">
                      Catatan / Pesan untuk Trader (Muncul di layar /withdraw jika ditangguhkan)
                    </Label>
                    <Input
                      id="formNote"
                      placeholder="Contoh: Harap lengkapi verifikasi KTP sebelum menarik dana."
                      value={formNote}
                      onChange={(e) => setFormNote(e.target.value)}
                      className="text-xs h-9"
                    />
                  </div>
                </div>

                <DialogFooter className="p-4 sm:p-6 pt-3 pb-3 border-t bg-background shrink-0 gap-2 flex-row justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedUser(null)}
                    disabled={savingRule}
                    className="text-xs"
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={savingRule} className="text-xs font-bold gap-1.5">
                    {savingRule ? (
                      <>
                        <RefreshCw className="size-3.5 animate-spin" /> Menyimpan...
                      </>
                    ) : (
                      "Simpan Aturan Trader"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
