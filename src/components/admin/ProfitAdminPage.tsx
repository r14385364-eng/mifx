import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Coins,
  DollarSign,
  PlusCircle,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  depositBalance: number;
}

const presetProfits = [50, 100, 250, 500, 1000, 5000];

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
  const [selectedUser, setSelectedUser] = useState<UserProfitData | null>(null);
  const [profitAmount, setProfitAmount] = useState<string>("100");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
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
        };
        const mapped: UserProfitData[] = (data.users as ApiUser[]).map((u) => {
          const totalBal = u.balance !== undefined && u.balance !== null ? Number(u.balance) : 0;
          const profBal = Number(u.profit) || 0;
          const depBal = Math.max(0, totalBal - profBal);
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
            depositBalance: depBal,
          };
        });
        setUsers(mapped);
      }
    } catch {
      toast.error("Gagal mengambil data user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUsers();
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
  const totalProfitDistributed = users.reduce((sum, u) => sum + u.profit, 0);
  const totalDepositBalance = users.reduce((sum, u) => sum + u.depositBalance, 0);
  const totalOverallBalance = users.reduce((sum, u) => sum + u.balance, 0);

  const handleGrantProfit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    const amountNum = parseFloat(profitAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Masukkan nominal profit yang valid (> 0)");
      return;
    }

    setSubmitting(true);
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
        void fetchUsers();
      } else {
        toast.error(data.message || "Gagal memberikan profit");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan saat memproses profit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout
      title="Kelola Profit User"
      subtitle="Atur dan berikan profit trading secara instan ke saldo pengguna terdaftar"
    >
      <div className="flex flex-col gap-6">
        {/* Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              <p className="mt-1 text-[11px] text-muted-foreground">Pengguna terdaftar sistem</p>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground">
                Total Saldo Deposit
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

          <Card className="border-border/60 bg-amber-500/5 border-amber-500/30 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-amber-700 dark:text-amber-400">
                Total Profit Diberikan
              </CardTitle>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <Coins className="h-4 w-4" />
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
                {formatUSD(totalProfitDistributed)}
              </div>
              <p className="mt-1 text-[11px] font-medium text-amber-700/80 dark:text-amber-400/80">
                ~ {formatRupiah(totalProfitDistributed)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground">
                Total Akumulasi Saldo
              </CardTitle>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <TrendingUp className="h-4 w-4" />
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-foreground">
                {formatUSD(totalOverallBalance)}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">Deposit + Total Profit User</p>
            </CardContent>
          </Card>
        </div>

        {/* Search & Actions Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari username, email, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Menampilkan{" "}
            <span className="font-semibold text-foreground">{filteredUsers.length}</span> pengguna
          </p>
        </div>

        {/* User Profit Table */}
        <Card className="border-border/60 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/60 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-sm font-bold text-foreground">
                  Daftar Saldo Deposit & Profit User
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-xs bg-background">
                Auto-Sync DB
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Memuat data user...
                </div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <User className="h-10 w-10 text-muted-foreground/50 mb-2" />
                <p className="text-sm font-medium text-foreground">Pengguna Tidak Ditemukan</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Coba sesuaikan kata kunci pencarian Anda
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20 hover:bg-muted/20">
                      <TableHead className="w-[100px]">ID User</TableHead>
                      <TableHead>Username / Nama</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Saldo Deposit</TableHead>
                      <TableHead className="text-right">Saldo Profit</TableHead>
                      <TableHead className="text-right">Total Saldo</TableHead>
                      <TableHead className="text-center w-[140px]">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
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
                              No. Akun: {user.accountNumber}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {user.email}
                        </TableCell>
                        <TableCell className="text-right font-medium text-foreground text-sm">
                          <div>{formatUSD(user.depositBalance)}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {formatRupiah(user.depositBalance)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold text-amber-600 dark:text-amber-400 text-sm">
                          <div>{formatUSD(user.profit)}</div>
                          <div className="text-[10px] font-normal text-muted-foreground">
                            {formatRupiah(user.profit)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-extrabold text-foreground text-sm">
                          <div>{formatUSD(user.balance)}</div>
                          <div className="text-[10px] font-normal text-muted-foreground">
                            {formatRupiah(user.balance)}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setProfitAmount("100");
                            }}
                            className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm gap-1 text-xs font-semibold px-3 py-1.5"
                          >
                            <PlusCircle className="h-3.5 w-3.5" />
                            Tambah Profit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal Inject Profit */}
        <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <DialogTitle className="text-base font-bold">Injeksi Profit User</DialogTitle>
                  <DialogDescription className="text-xs">
                    Tambah saldo profit langsung ke rekening trading trader
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {selectedUser && (
              <form onSubmit={handleGrantProfit} className="flex flex-col gap-4 py-2">
                {/* User Header Info Card */}
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
                    <span className="text-muted-foreground">Saldo Profit Saat Ini:</span>
                    <span className="font-extrabold text-amber-600 dark:text-amber-400">
                      {formatUSD(selectedUser.profit)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Saldo Akun:</span>
                    <span className="font-bold text-foreground">
                      {formatUSD(selectedUser.balance)}
                    </span>
                  </div>
                </div>

                {/* Input Amount */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="profitAmount" className="text-xs font-semibold text-foreground">
                    Nominal Profit Baru ($ USD)
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

                  {/* Preset Buttons */}
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

                {/* Note / Keterangan */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="note" className="text-xs font-medium text-foreground">
                    Catatan / Alasan (Opsional)
                  </label>
                  <Input
                    id="note"
                    placeholder="Contoh: Profit Trading Emas Harian"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="text-xs"
                  />
                </div>

                {/* Live Preview Calculation */}
                {parseFloat(profitAmount) > 0 && (
                  <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-xs flex flex-col gap-1">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Profit Sesudah Injeksi:</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {formatUSD(selectedUser.profit + (parseFloat(profitAmount) || 0))}
                      </span>
                    </div>
                    <div className="flex justify-between text-foreground font-semibold">
                      <span>Total Saldo Sesudah:</span>
                      <span className="font-extrabold text-foreground">
                        {formatUSD(selectedUser.balance + (parseFloat(profitAmount) || 0))}
                      </span>
                    </div>
                  </div>
                )}

                <DialogFooter className="mt-2 gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedUser(null)}
                    disabled={submitting}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold gap-1"
                  >
                    {submitting ? (
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
