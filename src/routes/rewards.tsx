import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  ExternalLink,
  Gift,
  HelpCircle,
  History,
  Info,
  Loader2,
  Package,
  PlusCircle,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trophy,
  Wallet,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { BottomNav } from "@/components/BottomNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { secureFetch } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/rewards")({
  head: () => ({
    meta: [
      { title: "Gotrade Rewards — Tukar Poin Saldo dengan Hadiah Eksklusif" },
      {
        name: "description",
        content:
          "Kumpulkan poin reward otomatis dari setiap saldo trading Anda. 1 Poin = Rp 1.000.000 saldo. Tukarkan dengan iPhone 16 Pro, MacBook, Emas Antam, dan Saldo E-Wallet.",
      },
    ],
  }),
  component: RewardsPage,
});

type RewardItem = {
  id: number;
  title: string;
  category: string;
  points_required: number;
  stock: number;
  image_url: string;
  description: string;
  active: boolean;
};

type RedemptionItem = {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  reward_id: number;
  reward_title: string;
  points_spent: number;
  status: "PENDING" | "PROCESSED" | "COMPLETED" | "REJECTED";
  shipping_address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
};

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTierInfo(points: number) {
  if (points >= 100)
    return {
      name: "Diamond Trader",
      color: "from-blue-500 to-indigo-600",
      next: 200,
      icon: Sparkles,
    };
  if (points >= 50)
    return {
      name: "Platinum Trader",
      color: "from-purple-500 to-indigo-500",
      next: 100,
      icon: Trophy,
    };
  if (points >= 20)
    return { name: "Gold Trader", color: "from-amber-500 to-yellow-600", next: 50, icon: Award };
  if (points >= 5)
    return {
      name: "Silver Trader",
      color: "from-slate-400 to-slate-600",
      next: 20,
      icon: ShieldCheck,
    };
  return { name: "Bronze Trader", color: "from-orange-500 to-amber-700", next: 5, icon: Gift };
}

function RewardsPage() {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [myRedemptions, setMyRedemptions] = useState<RedemptionItem[]>([]);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [availablePoints, setAvailablePoints] = useState<number>(0);
  const [totalSpent, setTotalSpent] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Redeem modal state
  const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null);
  const [isRedeemOpen, setIsRedeemOpen] = useState<boolean>(false);
  const [shippingAddress, setShippingAddress] = useState<string>("");
  const [redeemNotes, setRedeemNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchRewardsData = async () => {
    try {
      setIsLoading(true);
      const res = await secureFetch("/api/rewards");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setRewards(data.rewards || []);
          setUserPoints(Number(data.userPoints) || 0);
          setAvailablePoints(Number(data.availablePoints) || 0);
          setTotalSpent(Number(data.totalSpent) || 0);
          setMyRedemptions(data.myRedemptions || []);
        }
      }
    } catch {
      toast.error("Gagal memuat katalog rewards.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchRewardsData();
  }, [user]);

  const categories = ["Semua", "Gadget", "Logam Mulia", "E-Wallet", "Merchandise"];

  const filteredRewards = rewards.filter((item) => {
    const matchCat =
      selectedCategory === "Semua" ||
      item.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleOpenRedeem = (item: RewardItem) => {
    if (availablePoints < item.points_required) {
      toast.error(
        `Poin tidak cukup. Anda membutuhkan ${item.points_required} Poin (Poin tersedia: ${availablePoints} Poin).`,
      );
      return;
    }
    if (item.stock <= 0) {
      toast.error("Stok barang ini sedang habis.");
      return;
    }
    setSelectedReward(item);
    setShippingAddress(user?.phone ? `Penerima: ${user.name}\nNo HP: ${user.phone}\nAlamat: ` : "");
    setRedeemNotes("");
    setIsRedeemOpen(true);
  };

  const handleSubmitRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReward) return;

    if (!shippingAddress.trim()) {
      toast.error("Mohon lengkapi alamat pengiriman atau detail nomor akun e-wallet.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await secureFetch("/api/rewards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rewardId: selectedReward.id,
          shippingAddress: shippingAddress.trim(),
          notes: redeemNotes.trim(),
        }),
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (res.ok && data.success) {
        toast.success("Klaim Reward Berhasil Diajukan!", {
          description: `Klaim "${selectedReward.title}" akan segera diverifikasi oleh tim Gotrade.`,
        });
        setIsRedeemOpen(false);
        setSelectedReward(null);
        void fetchRewardsData();
      } else {
        toast.error("Gagal Mengajukan Klaim", {
          description: data.message || "Terjadi kesalahan saat memproses klaim.",
        });
      }
    } catch {
      setIsSubmitting(false);
      toast.error("Gagal terhubung ke server database.");
    }
  };

  const userBalanceUSD = Number(user?.balance || 0);
  const userBalanceIDR = userBalanceUSD * 16000;
  const tier = getTierInfo(userPoints);
  const TierIcon = tier.icon;

  return (
    <div className="min-h-dvh bg-muted/40 pb-24 text-foreground">
      {/* 1. Header Bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-background px-4 py-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            to="/lainnya"
            aria-label="Kembali"
            className="flex size-9 items-center justify-center rounded-full border bg-card text-foreground transition-colors hover:bg-muted"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="text-base font-bold tracking-tight text-foreground">Gotrade Rewards</h1>
            <p className="text-[11px] text-muted-foreground">Katalog Penukaran Poin Saldo</p>
          </div>
        </div>

        <Link to="/deposit">
          <Button
            size="sm"
            className="h-8 gap-1.5 rounded-full bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90 shadow-xs"
          >
            <PlusCircle className="size-3.5" />
            Top Up Saldo
          </Button>
        </Link>
      </header>

      <div className="mx-auto max-w-4xl space-y-5 p-4">
        {/* 2. Hero Points & Tier Summary Banner (Bright Emerald Theme) */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 p-6 text-white shadow-md">
          {/* Subtle decoration elements */}
          <div className="absolute -right-12 -top-12 size-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-12 -left-12 size-48 rounded-full bg-emerald-400/20 blur-2xl" />

          <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white backdrop-blur">
                  <TierIcon className="size-3.5" />
                  {tier.name}
                </span>
                <span className="rounded-full bg-black/15 px-2 py-0.5 text-[10px] font-medium text-emerald-100">
                  Akun: {user?.accountNumber || "88910243"}
                </span>
              </div>

              <div>
                <p className="text-xs font-medium text-emerald-100">Poin Hadiah Tersedia</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tracking-tight text-white drop-shadow-xs">
                    {availablePoints.toLocaleString("id-ID")}
                  </span>
                  <span className="text-sm font-semibold text-emerald-100">Poin</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-emerald-100">
                <span>
                  Saldo Akun:{" "}
                  <strong className="text-white">
                    ${userBalanceUSD.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </strong>{" "}
                  ({formatRupiah(userBalanceIDR)})
                </span>
                <span>•</span>
                <span>
                  Total Poin: <strong className="text-white">{userPoints} Poin</strong>
                </span>
                {totalSpent > 0 && (
                  <>
                    <span>•</span>
                    <span>
                      Terpakai: <strong className="text-emerald-200">{totalSpent} Poin</strong>
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Point Rule Box */}
            <div className="rounded-xl border border-white/20 bg-white/15 p-4 backdrop-blur md:max-w-xs">
              <div className="flex items-start gap-2.5">
                <Gift className="mt-0.5 size-5 shrink-0 text-white" />
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-white">Aturan Perhitungan Poin</p>
                  <p className="text-emerald-50">
                    Setiap <span className="font-bold text-white">Rp 1.000.000 saldo</span> di akun
                    Anda menghasilkan <span className="font-bold text-white">1 Poin Rewards</span>.
                  </p>
                  <p className="text-[11px] text-emerald-200">
                    Poin otomatis bertambah seiring bertambahnya saldo trading Anda!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Main Tabs: Katalog vs Riwayat Klaim */}
        <Tabs defaultValue="katalog" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="grid w-full grid-cols-2 sm:w-auto bg-card border shadow-2xs">
              <TabsTrigger
                value="katalog"
                className="gap-1.5 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Gift className="size-4" />
                Katalog Hadiah
              </TabsTrigger>
              <TabsTrigger
                value="riwayat"
                className="gap-1.5 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <History className="size-4" />
                Riwayat Klaim ({myRedemptions.length})
              </TabsTrigger>
            </TabsList>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cari hadiah..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full bg-card pl-9 text-xs sm:w-64"
              />
            </div>
          </div>

          {/* TAB 1: KATALOG HADIAH */}
          <TabsContent value="katalog" className="space-y-4">
            {/* Category Filter Pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Rewards Cards Grid */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="mt-2 text-xs font-medium">Memuat katalog hadiah...</p>
              </div>
            ) : filteredRewards.length === 0 ? (
              <Card className="p-8 text-center bg-card">
                <Gift className="mx-auto size-10 text-muted-foreground/50" />
                <h3 className="mt-3 text-sm font-bold">Tidak ada hadiah ditemukan</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Coba ubah kata kunci pencarian atau kategori yang dipilih.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredRewards.map((item) => {
                  const canRedeem = availablePoints >= item.points_required && item.stock > 0;
                  return (
                    <Card
                      key={item.id}
                      className="group flex flex-col overflow-hidden border bg-card text-card-foreground shadow-2xs transition-all hover:shadow-md"
                    >
                      {/* Image Preview Container */}
                      <div className="relative aspect-video w-full overflow-hidden bg-muted">
                        <img
                          src={
                            item.image_url ||
                            "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80"
                          }
                          alt={item.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                        <Badge
                          variant="secondary"
                          className="absolute left-2.5 top-2.5 bg-black/60 text-[10px] font-bold text-white backdrop-blur"
                        >
                          {item.category}
                        </Badge>
                        <div className="absolute right-2.5 top-2.5 rounded-full bg-primary px-2.5 py-1 text-xs font-extrabold text-primary-foreground shadow-xs">
                          {item.points_required} Poin
                        </div>
                      </div>

                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="line-clamp-1 text-sm font-bold leading-snug text-foreground">
                            {item.title}
                          </CardTitle>
                        </div>
                        <CardDescription className="line-clamp-2 text-xs">
                          {item.description}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="flex-1 px-4 py-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            Sisa Stok:{" "}
                            <strong
                              className={
                                item.stock > 0 ? "text-foreground font-bold" : "text-rose-500"
                              }
                            >
                              {item.stock} unit
                            </strong>
                          </span>
                          <span>
                            Setara:{" "}
                            <strong className="text-foreground">
                              Rp {(item.points_required * 1000000).toLocaleString("id-ID")}
                            </strong>
                          </span>
                        </div>
                      </CardContent>

                      <CardFooter className="p-4 pt-3">
                        <Button
                          type="button"
                          onClick={() => handleOpenRedeem(item)}
                          disabled={!canRedeem}
                          className={`w-full text-xs font-bold ${
                            canRedeem
                              ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
                              : "bg-muted text-muted-foreground cursor-not-allowed"
                          }`}
                        >
                          {item.stock <= 0
                            ? "Stok Habis"
                            : availablePoints < item.points_required
                              ? `Kurang ${item.points_required - availablePoints} Poin`
                              : "Tukar Poin Sekarang"}
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* TAB 2: RIWAYAT KLAIM */}
          <TabsContent value="riwayat" className="space-y-4">
            <Card className="bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold">Riwayat Penukaran Hadiah</CardTitle>
                <CardDescription className="text-xs">
                  Pantau status pengiriman dan verifikasi hadiah yang telah Anda klaim.
                </CardDescription>
              </CardHeader>
              <CardContent
                className={myRedemptions.length > 0 ? "divide-y p-0" : "p-8 text-center"}
              >
                {myRedemptions.length === 0 ? (
                  <div className="py-6 text-center">
                    <Package className="mx-auto size-10 text-muted-foreground/40" />
                    <h4 className="mt-2 text-sm font-bold">Belum Ada Riwayat Klaim</h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Kumpulkan poin dengan memperbanyak saldo trading Anda dan tukarkan dengan
                      hadiah impian!
                    </p>
                  </div>
                ) : (
                  myRedemptions.map((red) => {
                    const statusBadge =
                      red.status === "COMPLETED" ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400">
                          <CheckCircle2 className="mr-1 size-3" /> Selesai / Terkirim
                        </Badge>
                      ) : red.status === "PROCESSED" ? (
                        <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 dark:text-blue-400">
                          <Clock className="mr-1 size-3" /> Sedang Diproses
                        </Badge>
                      ) : red.status === "REJECTED" ? (
                        <Badge className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 dark:text-rose-400">
                          <XCircle className="mr-1 size-3" /> Ditolak
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-amber-500/10 text-amber-600 border-amber-300 dark:text-amber-400"
                        >
                          <Clock className="mr-1 size-3" /> Menunggu Verifikasi
                        </Badge>
                      );

                    return (
                      <div
                        key={red.id}
                        className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">
                              {red.reward_title}
                            </span>
                            <Badge variant="secondary" className="text-[10px] font-bold">
                              {red.points_spent} Poin
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Diajukan pada: {formatDate(red.created_at)}
                          </p>
                          {red.shipping_address && (
                            <p className="text-xs text-muted-foreground">
                              <strong className="text-foreground">Tujuan:</strong>{" "}
                              {red.shipping_address}
                            </p>
                          )}
                          {red.notes && (
                            <p className="text-xs text-muted-foreground">
                              <em>Catatan Admin:</em> {red.notes}
                            </p>
                          )}
                        </div>

                        <div className="shrink-0">{statusBadge}</div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* 4. Modal Dialog: Redeem Reward Form */}
      <Dialog open={isRedeemOpen} onOpenChange={setIsRedeemOpen}>
        <DialogContent className="sm:max-w-md bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <Gift className="size-5 text-primary" />
              Konfirmasi Klaim Hadiah
            </DialogTitle>
            <DialogDescription className="text-xs">
              Pastikan informasi alamat atau data akun pengiriman di bawah ini sudah akurat.
            </DialogDescription>
          </DialogHeader>

          {selectedReward && (
            <form onSubmit={handleSubmitRedeem} className="space-y-4 py-2">
              <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-3">
                <img
                  src={selectedReward.image_url}
                  alt={selectedReward.title}
                  className="size-14 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate text-sm font-bold text-foreground">
                    {selectedReward.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Kategori: {selectedReward.category}
                  </p>
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <span className="text-primary font-bold">
                      Biaya: {selectedReward.points_required} Poin
                    </span>
                    <span>•</span>
                    <span className="text-muted-foreground">
                      Sisa Poin Anda: {availablePoints - selectedReward.points_required} Poin
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shippingAddress" className="text-xs font-semibold">
                  Alamat Pengiriman / Detail Nomor E-Wallet <span className="text-rose-500">*</span>
                </Label>
                <Textarea
                  id="shippingAddress"
                  required
                  rows={3}
                  placeholder="Nama Lengkap, No HP, Alamat lengkap / No Akun DANA, GoPay, OVO..."
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="text-xs bg-background"
                />
                <p className="text-[11px] text-muted-foreground">
                  Untuk hadiah fisik (iPhone/Emas/Merchandise), cantumkan alamat rumah lengkap.
                  Untuk E-Wallet, cantumkan nomor HP terdaftar.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="redeemNotes" className="text-xs font-semibold">
                  Catatan Tambahan (Opsional)
                </Label>
                <Input
                  id="redeemNotes"
                  placeholder="Contoh: Warna favorit, ukuran baju XL..."
                  value={redeemNotes}
                  onChange={(e) => setRedeemNotes(e.target.value)}
                  className="h-9 text-xs bg-background"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRedeemOpen(false)}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                >
                  {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                  Konfirmasi Tukar {selectedReward.points_required} Poin
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <BottomNav active="Lainnya" />
    </div>
  );
}
