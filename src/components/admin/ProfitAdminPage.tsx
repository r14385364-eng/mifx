import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  Coins,
  DollarSign,
  Edit,
  Percent,
  PlusCircle,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  User,
  Users,
  Wallet,
} from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UserProfitData {
  id: number;
  idCode: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  accountNumber: string;
  balance: number;
  profit: number;
  baseProfit: number;
  depositBalance: number;
}

const presetDailyRates = [3, 5, 8, 10, 12, 15, 20];
const presetProfits = [50, 100, 250, 500, 1000];

function formatUSD(val: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(val);
}

function formatRupiah(valUSD: number) {
  const rupiah = valUSD * 16000;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(rupiah);
}

export function ProfitAdminPage() {
  const [users, setUsers] = useState<UserProfitData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Global Daily Rate State
  const [globalRateInput, setGlobalRateInput] = useState<string>("5");
  const [applyingRate, setApplyingRate] = useState(false);

  // Modal State: Custom Profit Injection
  const [selectedUser, setSelectedUser] = useState<UserProfitData | null>(null);
  const [profitAmount, setProfitAmount] = useState<string>("100");
  const [note, setNote] = useState("");
  const [submittingProfit, setSubmittingProfit] = useState(false);

  // Modal State: Edit Base Profit Basis
  const [editBaseUser, setEditBaseUser] = useState<UserProfitData | null>(null);
  const [baseProfitInputUSD, setBaseProfitInputUSD] = useState<string>("");
  const [baseProfitInputIDR, setBaseProfitInputIDR] = useState<string>("");
  const [submittingBaseProfit, setSubmittingBaseProfit] = useState(false);

  const fetchUsersAndSettings = async () => {
    try {
      setLoading(true);

      // Fetch settings to get current global daily rate
      const settingsRes = await secureFetch("/api/settings");
      const settingsData = await settingsRes.json();
      if (settingsRes.ok && settingsData.settings?.global_daily_profit_rate) {
        setGlobalRateInput(settingsData.settings.global_daily_profit_rate);
      }

      // Fetch users
      const res = await secureFetch("/api/users");
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.users)) {
        type ApiUser = {
          id: number;
          name: string;
          email: string;
          phone: string;
          role: string;
          account_number: string;
          balance: number | string;
          profit: number | string;
          base_profit: number | string;
        };
        const mapped: UserProfitData[] = (data.users as ApiUser[]).map((u) => {
          const totalBal = u.balance !== undefined && u.balance !== null ? Number(u.balance) : 0;
          const profBal = Number(u.profit) || 0;
          let baseProf = Number(u.base_profit) || 0;
          const depBal = Math.max(0, totalBal - profBal);

          // Fallback: If baseProfit is 0 but deposit exists, base profit defaults to 10% of deposit
          if (baseProf <= 0 && depBal > 0) {
            baseProf = Math.round(depBal * 0.1 * 100) / 100;
          }

          return {
            id: u.id,
            idCode: `USR-${String(u.id).padStart(3, "0")}`,
            name: u.name,
            email: u.email,
            phone: u.phone || "-",
            role: u.role,
            accountNumber: u.account_number || "1006568912",
            balance: totalBal,
            profit: profBal,
            baseProfit: baseProf,
            depositBalance: depBal,
          };
        });
        setUsers(mapped.filter((u) => u.role !== "admin"));
      }
    } catch {
      toast.error("Gagal mengambil data user dan pengaturan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUsersAndSettings();
  }, []);

  const filteredUsers = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(kw) ||
        u.email.toLowerCase().includes(kw) ||
        u.idCode.toLowerCase().includes(kw) ||
        u.accountNumber.includes(kw),
    );
  }, [users, search]);

  const totalUsers = users.length;
  const totalDepositBalance = users.reduce((sum, u) => sum + u.depositBalance, 0);
  const totalBaseProfitBasis = users.reduce((sum, u) => sum + u.baseProfit, 0);
  const totalProfitDistributed = users.reduce((sum, u) => sum + u.profit, 0);
  const totalOverallBalance = users.reduce((sum, u) => sum + u.balance, 0);

  // Apply Global Daily Profit Rate (All users or single target)
  const handleApplyDailyRate = async (targetUser?: UserProfitData) => {
    const rateNum = parseFloat(globalRateInput);
    if (isNaN(rateNum) || rateNum <= 0) {
      toast.error("Masukkan persentase profit harian yang valid (> 0)");
      return;
    }

    setApplyingRate(true);
    try {
      const res = await secureFetch("/api/admin/profit/apply-daily-rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyRatePercent: rateNum,
          targetUserId: targetUser ? targetUser.id : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(
          data.message ||
            `Profit harian ${rateNum}% berhasil diterapkan ke ${data.affectedCount || "semua"} user!`,
          {
            description: "Persentase harian hanya dihitung terhadap nominal basis profit.",
          },
        );
        void fetchUsersAndSettings();
      } else {
        toast.error(data.message || "Gagal menerapkan rate profit harian");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem saat menerapkan profit harian");
    } finally {
      setApplyingRate(false);
    }
  };

  // Submit Base Profit Basis Edit
  const handleSaveBaseProfit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBaseUser) return;
    const baseValUSD = parseFloat(baseProfitInputUSD);
    if (isNaN(baseValUSD) || baseValUSD < 0) {
      toast.error("Nominal basis profit tidak valid");
      return;
    }

    setSubmittingBaseProfit(true);
    try {
      const res = await secureFetch("/api/admin/profit/update-base-profit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editBaseUser.id,
          baseProfit: baseValUSD,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Basis profit berhasil diperbarui!");
        setEditBaseUser(null);
        void fetchUsersAndSettings();
      } else {
        toast.error(data.message || "Gagal memperbarui basis profit");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setSubmittingBaseProfit(false);
    }
  };

  // Submit Manual Custom Profit Grant
  const handleGrantProfit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    const amountNum = parseFloat(profitAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Masukkan nominal profit yang valid (> 0)");
      return;
    }

    setSubmittingProfit(true);
    try {
      const res = await secureFetch("/api/admin/profit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          amount: amountNum,
          note: note.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || `Profit ${formatUSD(amountNum)} berhasil ditambahkan!`);
        setSelectedUser(null);
        setProfitAmount("100");
        setNote("");
        void fetchUsersAndSettings();
      } else {
        toast.error(data.message || "Gagal memberikan profit");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan saat memproses profit");
    } finally {
      setSubmittingProfit(false);
    }
  };

  const currentRateNum = parseFloat(globalRateInput) || 0;

  return (
    <AdminLayout
      title="Kelola Profit Trading User"
      subtitle="Atur persentase profit harian global, nominal basis profit, dan penyaluran profit instan"
    >
      <div className="flex flex-col gap-6">
        {/* Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground">
                Total Trader Active
              </CardTitle>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Users className="h-4 w-4" />
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-foreground">{totalUsers} User</div>
              <p className="mt-1 text-[11px] text-muted-foreground">Akun trader non-admin</p>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground">
                Total Saldo Deposit Utama
              </CardTitle>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Wallet className="h-4 w-4" />
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-foreground">
                {formatUSD(totalDepositBalance)}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                ~ {formatRupiah(totalDepositBalance)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-amber-500/30 bg-amber-500/5 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-amber-700 dark:text-amber-400">
                Nominal Basis Profit (10%)
              </CardTitle>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <Percent className="h-4 w-4" />
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
                {formatUSD(totalBaseProfitBasis)}
              </div>
              <p className="mt-1 text-[11px] font-medium text-amber-700/80 dark:text-amber-400/80">
                ~ {formatRupiah(totalBaseProfitBasis)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground">
                Total Akumulasi Profit
              </CardTitle>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Coins className="h-4 w-4" />
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-foreground">
                {formatUSD(totalProfitDistributed)}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                ~ {formatRupiah(totalProfitDistributed)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground">
                Total Saldo Gabungan
              </CardTitle>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <TrendingUp className="h-4 w-4" />
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-foreground">
                {formatUSD(totalOverallBalance)}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">Deposit + Profit Akumulasi</p>
            </CardContent>
          </Card>
        </div>

        {/* Global Daily Profit Rate Control Section */}
        <Card className="border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-background shadow-md">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white font-bold">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <CardTitle className="text-base font-bold text-foreground">
                    Pengaturan Profit Harian Global (Seluruh User)
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Atur persentase harian yang dapat diubah kapan saja (misal: Hari ini 5%, Besok
                    15%)
                  </CardDescription>
                </div>
              </div>
              <Badge
                variant="outline"
                className="w-fit border-amber-500/40 bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-xs"
              >
                Rate Aktif: {globalRateInput}% / Hari
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Rule Explanation Banner */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-foreground flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-amber-800 dark:text-amber-300">
                  Ketentuan Perhitungan Profit Harian:
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Ketika user deposit <strong>Rp 1.000.000</strong> dan disetujui, user langsung
                  mendapatkan nominal basis profit 10% = <strong>Rp 100.000</strong>. Persentase
                  profit harian di bawah ini (misal 5% atau 15%){" "}
                  <strong className="text-amber-600 dark:text-amber-400 underline">
                    HANYA dihitung dari nominal profit basis Rp 100.000 tersebut
                  </strong>
                  , BUKAN dari nominal deposit Rp 1 Juta.
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex flex-1 items-center gap-2">
                <div className="relative flex-1 max-w-xs">
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    max="100"
                    value={globalRateInput}
                    onChange={(e) => setGlobalRateInput(e.target.value)}
                    placeholder="Persentase harian (misal: 5)"
                    className="font-bold text-base pr-8 bg-background"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    %
                  </span>
                </div>

                <Button
                  onClick={() => handleApplyDailyRate()}
                  disabled={applyingRate}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs gap-1.5 px-4 shadow-sm"
                >
                  {applyingRate ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  )}
                  Terapkan Rate Hari Ini ke Semua User
                </Button>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-muted-foreground font-semibold mr-1">Preset:</span>
                {presetDailyRates.map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setGlobalRateInput(String(rate))}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition-all ${
                      globalRateInput === String(rate)
                        ? "border-amber-500 bg-amber-500 text-white shadow-sm"
                        : "border-border/60 bg-background hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search & Action Filter Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari username, email, ID account..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchUsersAndSettings()}
              className="text-xs gap-1"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh Data
            </Button>
            <p className="text-xs text-muted-foreground">
              Menampilkan{" "}
              <span className="font-semibold text-foreground">{filteredUsers.length}</span> trader
            </p>
          </div>
        </div>

        {/* User Profit Table */}
        <Card className="border-border/60 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/60 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-sm font-bold text-foreground">
                  Daftar Profit & Deposit Trader
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-xs bg-background">
                Auto-Calculated
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Memuat data user & basis profit...
                </div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <User className="h-10 w-10 text-muted-foreground/50 mb-2" />
                <p className="text-sm font-medium text-foreground">Trader Tidak Ditemukan</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Coba sesuaikan kata kunci pencarian Anda
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20 hover:bg-muted/20 text-xs">
                      <TableHead className="w-[90px]">ID User</TableHead>
                      <TableHead>Trader / Akun</TableHead>
                      <TableHead className="text-right">Saldo Deposit Utama</TableHead>
                      <TableHead className="text-right bg-amber-500/5">
                        <div className="flex items-center justify-end gap-1 text-amber-700 dark:text-amber-400">
                          <span>Basis Profit Nominal (10%)</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-right">
                        Estimasi Profit Hari Ini ({currentRateNum}%)
                      </TableHead>
                      <TableHead className="text-right">Akumulasi Profit Total</TableHead>
                      <TableHead className="text-right">Total Saldo Gabungan</TableHead>
                      <TableHead className="text-center w-[200px]">Aksi Admin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => {
                      const estimatedDailyGainUSD =
                        Math.round(user.baseProfit * (currentRateNum / 100) * 100) / 100;
                      return (
                        <TableRow key={user.id} className="hover:bg-muted/30">
                          <TableCell className="font-mono text-xs font-semibold text-muted-foreground">
                            {user.idCode}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-foreground text-sm">
                                {user.name}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                {user.email} • Akun: {user.accountNumber}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium text-foreground text-sm">
                            <div>{formatUSD(user.depositBalance)}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {formatRupiah(user.depositBalance)}
                            </div>
                          </TableCell>

                          {/* Basis Profit Basis Column */}
                          <TableCell className="text-right font-bold text-amber-600 dark:text-amber-400 bg-amber-500/5 text-sm">
                            <div className="flex items-center justify-end gap-1">
                              <span>{formatUSD(user.baseProfit)}</span>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  setEditBaseUser(user);
                                  setBaseProfitInputUSD(String(user.baseProfit));
                                  setBaseProfitInputIDR(String(user.baseProfit * 16000));
                                }}
                                className="h-6 w-6 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                                title="Ubah Nominal Basis Profit User Ini"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="text-[10px] font-normal text-muted-foreground">
                              {formatRupiah(user.baseProfit)}
                            </div>
                          </TableCell>

                          {/* Daily Profit Estimate Column */}
                          <TableCell className="text-right font-semibold text-emerald-600 dark:text-emerald-400 text-sm">
                            <div>+{formatUSD(estimatedDailyGainUSD)}</div>
                            <div className="text-[10px] font-normal text-muted-foreground">
                              +{formatRupiah(estimatedDailyGainUSD)}
                            </div>
                          </TableCell>

                          {/* Total Accumulated Profit */}
                          <TableCell className="text-right font-extrabold text-amber-600 dark:text-amber-400 text-sm">
                            <div>{formatUSD(user.profit)}</div>
                            <div className="text-[10px] font-normal text-muted-foreground">
                              {formatRupiah(user.profit)}
                            </div>
                          </TableCell>

                          {/* Total Balance */}
                          <TableCell className="text-right font-extrabold text-foreground text-sm">
                            <div>{formatUSD(user.balance)}</div>
                            <div className="text-[10px] font-normal text-muted-foreground">
                              {formatRupiah(user.balance)}
                            </div>
                          </TableCell>

                          {/* Actions Column */}
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApplyDailyRate(user)}
                                disabled={applyingRate}
                                className="h-7 text-[11px] font-semibold border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
                                title="Terapkan Profit Harian Hari Ini Hanya ke User Ini"
                              >
                                +{currentRateNum}%
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setProfitAmount("100");
                                }}
                                className="h-7 bg-amber-500 hover:bg-amber-600 text-white gap-1 text-[11px] font-semibold px-2.5"
                              >
                                <PlusCircle className="h-3 w-3" />
                                Inject Custom
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal 1: Edit Base Profit Basis */}
        <Dialog open={!!editBaseUser} onOpenChange={(open) => !open && setEditBaseUser(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Edit className="h-4 w-4" />
                </span>
                <div>
                  <DialogTitle className="text-base font-bold">
                    Ubah Nominal Basis Profit
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Persentase profit harian (misal 5%) akan dihitung dari nominal basis ini
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {editBaseUser && (
              <form onSubmit={handleSaveBaseProfit} className="flex flex-col gap-4 py-2">
                <div className="rounded-xl border border-border/80 bg-muted/40 p-3 text-xs flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Trader:</span>
                    <span className="font-bold text-foreground text-sm">{editBaseUser.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Saldo Deposit Utama:</span>
                    <span className="font-semibold text-foreground">
                      {formatUSD(editBaseUser.depositBalance)} (
                      {formatRupiah(editBaseUser.depositBalance)})
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="baseUSD" className="text-xs font-semibold text-foreground">
                    Nominal Basis Profit Baru ($ USD)
                  </label>
                  <div className="relative flex items-center">
                    <DollarSign className="absolute left-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="baseUSD"
                      type="number"
                      step="any"
                      min="0"
                      value={baseProfitInputUSD}
                      onChange={(e) => {
                        setBaseProfitInputUSD(e.target.value);
                        const valNum = parseFloat(e.target.value) || 0;
                        setBaseProfitInputIDR(String(valNum * 16000));
                      }}
                      className="pl-9 font-bold text-base"
                      required
                    />
                  </div>
                  {parseFloat(baseProfitInputUSD) >= 0 && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                      Setara {formatRupiah(parseFloat(baseProfitInputUSD) || 0)} IDR
                    </p>
                  )}
                </div>

                <DialogFooter className="mt-2 gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditBaseUser(null)}
                    disabled={submittingBaseProfit}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={submittingBaseProfit}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold gap-1"
                  >
                    {submittingBaseProfit ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      "Simpan Basis Profit"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal 2: Inject Custom Profit */}
        <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <DialogTitle className="text-base font-bold">
                    Injeksi Profit Custom User
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Tambah saldo profit langsung ke akun trader
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {selectedUser && (
              <form onSubmit={handleGrantProfit} className="flex flex-col gap-4 py-2">
                <div className="rounded-xl border border-border/80 bg-muted/40 p-3 text-xs flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Username:</span>
                    <span className="font-bold text-foreground text-sm">{selectedUser.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium text-foreground">{selectedUser.email}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-border/60">
                    <span className="text-muted-foreground">Profit Akumulasi Saat Ini:</span>
                    <span className="font-extrabold text-amber-600 dark:text-amber-400">
                      {formatUSD(selectedUser.profit)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="profitAmount" className="text-xs font-semibold text-foreground">
                    Nominal Profit Injeksi ($ USD)
                  </label>
                  <div className="relative flex items-center">
                    <DollarSign className="absolute left-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="profitAmount"
                      type="number"
                      step="any"
                      min="1"
                      placeholder="Contoh: 100"
                      value={profitAmount}
                      onChange={(e) => setProfitAmount(e.target.value)}
                      className="pl-9 font-bold text-base"
                      required
                    />
                  </div>
                  {parseFloat(profitAmount) > 0 && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Setara {formatRupiah(parseFloat(profitAmount))}
                    </p>
                  )}

                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {presetProfits.map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setProfitAmount(String(val))}
                        className={`rounded-lg border py-1.5 text-xs font-semibold transition-all ${
                          profitAmount === String(val)
                            ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "border-border/60 bg-background hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        +${val.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="note" className="text-xs font-medium text-foreground">
                    Catatan / Alasan (Opsional)
                  </label>
                  <Input
                    id="note"
                    placeholder="Contoh: Bonus Profit Trading Kemitraan"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <DialogFooter className="mt-2 gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedUser(null)}
                    disabled={submittingProfit}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={submittingProfit}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold gap-1"
                  >
                    {submittingProfit ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4" />
                    )}
                    Berikan Profit Now
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
