import { useEffect, useMemo, useState } from "react";
import {
  Award,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Gift,
  Loader2,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  Trash2,
  Trophy,
  XCircle,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export interface RewardItem {
  id: number;
  title: string;
  category: string;
  points_required: number;
  stock: number;
  image_url: string;
  description: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RedemptionItem {
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
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function RewardsAdminPage() {
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [redemptions, setRedemptions] = useState<RedemptionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Create / Edit Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [editingReward, setEditingReward] = useState<RewardItem | null>(null);
  const [formTitle, setFormTitle] = useState<string>("");
  const [formCategory, setFormCategory] = useState<string>("Gadget");
  const [formPoints, setFormPoints] = useState<number>(10);
  const [formStock, setFormStock] = useState<number>(10);
  const [formImageUrl, setFormImageUrl] = useState<string>("");
  const [formDescription, setFormDescription] = useState<string>("");
  const [formActive, setFormActive] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Delete Alert state
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Redemption status dialog state
  const [selectedRedemption, setSelectedRedemption] = useState<RedemptionItem | null>(null);
  const [redemptionStatus, setRedemptionStatus] = useState<string>("PENDING");
  const [redemptionNotes, setRedemptionNotes] = useState<string>("");
  const [isUpdatingRedemption, setIsUpdatingRedemption] = useState<boolean>(false);

  const fetchAdminRewards = async () => {
    try {
      setIsLoading(true);
      const res = await secureFetch("/api/admin/rewards");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setRewards(data.rewards || []);
          setRedemptions(data.redemptions || []);
        }
      }
    } catch {
      toast.error("Gagal memuat data rewards.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchAdminRewards();
  }, []);

  const openCreateDialog = () => {
    setEditingReward(null);
    setFormTitle("");
    setFormCategory("Gadget");
    setFormPoints(10);
    setFormStock(10);
    setFormImageUrl("");
    setFormDescription("");
    setFormActive(true);
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: RewardItem) => {
    setEditingReward(item);
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormPoints(item.points_required);
    setFormStock(item.stock);
    setFormImageUrl(item.image_url || "");
    setFormDescription(item.description || "");
    setFormActive(item.active);
    setIsDialogOpen(true);
  };

  const handleSaveReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error("Judul hadiah wajib diisi.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: formTitle.trim(),
        category: formCategory,
        pointsRequired: Number(formPoints),
        stock: Number(formStock),
        imageUrl: formImageUrl.trim(),
        description: formDescription.trim(),
        active: formActive,
      };

      let res;
      if (editingReward) {
        res = await secureFetch("/api/admin/rewards", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingReward.id, ...payload }),
        });
      } else {
        res = await secureFetch("/api/admin/rewards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      setIsSaving(false);

      if (res.ok && data.success) {
        toast.success(editingReward ? "Hadiah Berhasil Diperbarui" : "Hadiah Baru Berhasil Dibuat");
        setIsDialogOpen(false);
        void fetchAdminRewards();
      } else {
        toast.error("Gagal Menyimpan Hadiah", { description: data.message });
      }
    } catch {
      setIsSaving(false);
      toast.error("Gagal terhubung ke database.");
    }
  };

  const handleDeleteReward = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const res = await secureFetch(`/api/admin/rewards?id=${deletingId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      setIsDeleting(false);
      setDeletingId(null);

      if (res.ok && data.success) {
        toast.success("Hadiah berhasil dihapus!");
        void fetchAdminRewards();
      } else {
        toast.error("Gagal Menghapus Hadiah", { description: data.message });
      }
    } catch {
      setIsDeleting(false);
      setDeletingId(null);
      toast.error("Gagal terhubung ke server.");
    }
  };

  const handleUpdateRedemptionStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRedemption) return;

    setIsUpdatingRedemption(true);
    try {
      const res = await secureFetch("/api/admin/rewards/redemptions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedRedemption.id,
          status: redemptionStatus,
          notes: redemptionNotes.trim(),
        }),
      });

      const data = await res.json();
      setIsUpdatingRedemption(false);

      if (res.ok && data.success) {
        toast.success("Status klaim berhasil diperbarui!");
        setSelectedRedemption(null);
        void fetchAdminRewards();
      } else {
        toast.error("Gagal Memperbarui Status", { description: data.message });
      }
    } catch {
      setIsUpdatingRedemption(false);
      toast.error("Gagal terhubung ke server.");
    }
  };

  const filteredRewards = useMemo(() => {
    return rewards.filter((r) => {
      const matchSearch =
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat =
        selectedCategory === "all" || r.category.toLowerCase() === selectedCategory.toLowerCase();
      return matchSearch && matchCat;
    });
  }, [rewards, searchQuery, selectedCategory]);

  const pendingClaimsCount = redemptions.filter((r) => r.status === "PENDING").length;
  const completedClaimsCount = redemptions.filter((r) => r.status === "COMPLETED").length;
  const totalPointsRedeemed = redemptions
    .filter((r) => r.status !== "REJECTED")
    .reduce((sum, r) => sum + Number(r.points_spent || 0), 0);

  return (
    <AdminLayout
      title="Manajemen Gotrade Rewards"
      subtitle="Kelola katalog hadiah pengguna (CRUD), stok, bobot poin reward, dan verifikasi penukaran klaim."
    >
      <div className="space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Hadiah Katalog
              </CardTitle>
              <Gift className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rewards.length} Item</div>
              <p className="mt-1 text-xs text-muted-foreground">
                {rewards.filter((r) => r.active).length} Hadiah aktif tayang
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Klaim Masuk
              </CardTitle>
              <Package className="size-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{redemptions.length} Klaim</div>
              <p className="mt-1 text-xs text-muted-foreground">
                <span className="font-semibold text-amber-600">{pendingClaimsCount} Pending</span> •{" "}
                {completedClaimsCount} Selesai
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Poin Ditukarkan
              </CardTitle>
              <Trophy className="size-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPointsRedeemed} Poin</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Setara modal {formatRupiah(totalPointsRedeemed * 1000000)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Rumus Poin Saldo
              </CardTitle>
              <Sparkles className="size-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                1 Poin = Rp 1.000.000
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Dihitung otomatis dari saldo akun live trader
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="katalog" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TabsList>
              <TabsTrigger value="katalog" className="gap-2">
                <Gift className="size-4" />
                Katalog Hadiah ({rewards.length})
              </TabsTrigger>
              <TabsTrigger value="klaim" className="gap-2">
                <Package className="size-4" />
                Daftar Klaim User ({redemptions.length})
                {pendingClaimsCount > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px]">
                    {pendingClaimsCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => void fetchAdminRewards()}
                disabled={isLoading}
                className="h-9 gap-1 text-xs"
              >
                <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
                Segarkan
              </Button>
              <Button
                size="sm"
                onClick={openCreateDialog}
                className="h-9 gap-1.5 bg-primary text-xs font-semibold"
              >
                <Plus className="size-4" />
                Tambah Hadiah Baru
              </Button>
            </div>
          </div>

          {/* TAB 1: KATALOG REWARDS (CRUD) */}
          <TabsContent value="katalog" className="space-y-4">
            <Card>
              <CardHeader className="p-4 pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-base font-bold">Daftar Katalog Hadiah</CardTitle>
                    <CardDescription className="text-xs">
                      Atur nama item, kategori, bobot poin penukaran, stok barang, gambar, dan
                      status publikasi.
                    </CardDescription>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Cari hadiah..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8 w-48 pl-8 text-xs"
                      />
                    </div>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="h-8 w-36 text-xs">
                        <SelectValue placeholder="Kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Kategori</SelectItem>
                        <SelectItem value="Gadget">Gadget</SelectItem>
                        <SelectItem value="Logam Mulia">Logam Mulia</SelectItem>
                        <SelectItem value="E-Wallet">E-Wallet</SelectItem>
                        <SelectItem value="Merchandise">Merchandise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12 text-center">ID</TableHead>
                        <TableHead>Hadiah & Detail</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead className="text-center">Biaya Poin</TableHead>
                        <TableHead className="text-center">Stok</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                            <Loader2 className="mx-auto size-6 animate-spin text-primary" />
                            <p className="mt-2 text-xs">Memuat katalog...</p>
                          </TableCell>
                        </TableRow>
                      ) : filteredRewards.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                            <Gift className="mx-auto size-8 text-muted-foreground/40" />
                            <p className="mt-2 text-sm font-semibold">Tidak ada hadiah ditemukan</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRewards.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="text-center font-mono text-xs text-muted-foreground">
                              {item.id}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <img
                                  src={
                                    item.image_url ||
                                    "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80"
                                  }
                                  alt={item.title}
                                  className="size-11 shrink-0 rounded-lg object-cover border bg-muted"
                                />
                                <div className="min-w-0 max-w-xs space-y-0.5">
                                  <p className="truncate text-xs font-bold">{item.title}</p>
                                  <p className="line-clamp-1 text-[11px] text-muted-foreground">
                                    {item.description || "Tidak ada deskripsi"}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px] font-semibold">
                                {item.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-extrabold text-amber-700 dark:text-amber-400">
                                {item.points_required} Poin
                              </span>
                            </TableCell>
                            <TableCell className="text-center font-semibold text-xs">
                              <span
                                className={
                                  item.stock > 0 ? "text-foreground" : "text-rose-500 font-bold"
                                }
                              >
                                {item.stock} unit
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              {item.active ? (
                                <Badge className="bg-emerald-500/10 text-emerald-600 text-[10px]">
                                  Aktif
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px]">
                                  Non-Aktif
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="size-8"
                                  onClick={() => openEditDialog(item)}
                                  title="Edit Hadiah"
                                >
                                  <Pencil className="size-3.5 text-blue-600" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="size-8 text-rose-500 hover:text-rose-600"
                                  onClick={() => setDeletingId(item.id)}
                                  title="Hapus Hadiah"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: DAFTAR KLAIM USER */}
          <TabsContent value="klaim" className="space-y-4">
            <Card>
              <CardHeader className="p-4 pb-3">
                <CardTitle className="text-base font-bold">
                  Daftar Penukaran & Klaim Hadiah Trader
                </CardTitle>
                <CardDescription className="text-xs">
                  Verifikasi pengajuan klaim hadiah, proses pengiriman paket / saldo digital, dan
                  perbarui status.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12 text-center">ID</TableHead>
                        <TableHead>User / Trader</TableHead>
                        <TableHead>Hadiah Diklaim</TableHead>
                        <TableHead className="text-center">Poin Terpakai</TableHead>
                        <TableHead>Alamat / Info Pengiriman</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {redemptions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                            <Package className="mx-auto size-8 text-muted-foreground/40" />
                            <p className="mt-2 text-sm font-semibold">Belum ada pengajuan klaim</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        redemptions.map((red) => {
                          const statusBadge =
                            red.status === "COMPLETED" ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 text-[10px]">
                                <CheckCircle2 className="mr-1 size-3" /> Selesai
                              </Badge>
                            ) : red.status === "PROCESSED" ? (
                              <Badge className="bg-blue-500/10 text-blue-600 text-[10px]">
                                <Clock className="mr-1 size-3" /> Diproses
                              </Badge>
                            ) : red.status === "REJECTED" ? (
                              <Badge className="bg-rose-500/10 text-rose-600 text-[10px]">
                                <XCircle className="mr-1 size-3" /> Ditolak
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-amber-500/10 text-amber-600 border-amber-300 text-[10px]"
                              >
                                <Clock className="mr-1 size-3" /> Pending
                              </Badge>
                            );

                          return (
                            <TableRow key={red.id}>
                              <TableCell className="text-center font-mono text-xs text-muted-foreground">
                                {red.id}
                              </TableCell>
                              <TableCell>
                                <div className="space-y-0.5">
                                  <p className="text-xs font-bold">{red.user_name}</p>
                                  <p className="text-[11px] text-muted-foreground">
                                    {red.user_email}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    {formatDate(red.created_at)}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <p className="text-xs font-bold">{red.reward_title}</p>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                                  {red.points_spent} Poin
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="max-w-xs space-y-1 text-xs">
                                  <p className="line-clamp-2 text-slate-700 dark:text-slate-300">
                                    {red.shipping_address || "Tidak ada detail"}
                                  </p>
                                  {red.notes && (
                                    <p className="text-[11px] text-muted-foreground">
                                      <em>Catatan:</em> {red.notes}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">{statusBadge}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs font-semibold"
                                  onClick={() => {
                                    setSelectedRedemption(red);
                                    setRedemptionStatus(red.status);
                                    setRedemptionNotes(red.notes || "");
                                  }}
                                >
                                  Kelola Status
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
        </Tabs>
      </div>

      {/* CREATE / EDIT REWARD DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingReward ? "Edit Hadiah Reward" : "Tambah Hadiah Reward Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Lengkapi informasi hadiah yang dapat ditukarkan oleh pengguna Gotrade.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveReward} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="formTitle" className="text-xs font-semibold">
                Nama / Judul Hadiah <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="formTitle"
                required
                placeholder="Contoh: iPhone 16 Pro Max 256GB"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="formCategory" className="text-xs font-semibold">
                  Kategori
                </Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger id="formCategory" className="h-9 text-xs">
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Gadget">Gadget</SelectItem>
                    <SelectItem value="Logam Mulia">Logam Mulia</SelectItem>
                    <SelectItem value="E-Wallet">E-Wallet</SelectItem>
                    <SelectItem value="Merchandise">Merchandise</SelectItem>
                    <SelectItem value="Voucher">Voucher</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="formPoints" className="text-xs font-semibold">
                  Bobot Poin (1 Poin = Rp 1 Juta) <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="formPoints"
                  type="number"
                  min={1}
                  required
                  value={formPoints}
                  onChange={(e) => setFormPoints(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="formStock" className="text-xs font-semibold">
                  Jumlah Stok
                </Label>
                <Input
                  id="formStock"
                  type="number"
                  min={0}
                  required
                  value={formStock}
                  onChange={(e) => setFormStock(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Status Publikasi</Label>
                <div className="flex h-9 items-center justify-between rounded-md border px-3">
                  <span className="text-xs text-muted-foreground">Aktif Ditampilkan</span>
                  <Switch checked={formActive} onCheckedChange={setFormActive} />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="formImageUrl" className="text-xs font-semibold">
                URL Gambar Hadiah
              </Label>
              <Input
                id="formImageUrl"
                placeholder="https://images.unsplash.com/..."
                value={formImageUrl}
                onChange={(e) => setFormImageUrl(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="formDescription" className="text-xs font-semibold">
                Deskripsi & Spesifikasi Hadiah
              </Label>
              <Textarea
                id="formDescription"
                rows={3}
                placeholder="Spesifikasi lengkap produk, garansi, atau petunjuk klaim..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSaving}
              >
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={isSaving} className="gap-2 font-semibold">
                {isSaving && <Loader2 className="size-4 animate-spin" />}
                {editingReward ? "Simpan Perubahan" : "Buat Hadiah"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE REWARD ALERT DIALOG */}
      <AlertDialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">
              Hapus Hadiah Reward?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Tindakan ini akan menghapus hadiah ini secara permanen dari katalog penukaran
              pengguna.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteReward}
              disabled={isDeleting}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              {isDeleting ? "Menghapus..." : "Ya, Hapus Hadiah"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* UPDATE REDEMPTION STATUS MODAL */}
      <Dialog
        open={selectedRedemption !== null}
        onOpenChange={(open) => !open && setSelectedRedemption(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Kelola Status Klaim</DialogTitle>
            <DialogDescription className="text-xs">
              Ubah status pengiriman dan berikan catatan konfirmasi kepada trader.
            </DialogDescription>
          </DialogHeader>

          {selectedRedemption && (
            <form onSubmit={handleUpdateRedemptionStatus} className="space-y-4 py-2">
              <div className="rounded-lg border bg-muted/30 p-3 space-y-1 text-xs">
                <p>
                  <strong>Trader:</strong> {selectedRedemption.user_name} (
                  {selectedRedemption.user_email})
                </p>
                <p>
                  <strong>Hadiah:</strong> {selectedRedemption.reward_title} (
                  {selectedRedemption.points_spent} Poin)
                </p>
                <p>
                  <strong>Tujuan:</strong> {selectedRedemption.shipping_address}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="statusSelect" className="text-xs font-semibold">
                  Status Klaim
                </Label>
                <Select value={redemptionStatus} onValueChange={setRedemptionStatus}>
                  <SelectTrigger id="statusSelect" className="h-9 text-xs">
                    <SelectValue placeholder="Pilih Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Menunggu Verifikasi (Pending)</SelectItem>
                    <SelectItem value="PROCESSED">Sedang Diproses / Dikirim</SelectItem>
                    <SelectItem value="COMPLETED">Selesai (Sudah Diterima)</SelectItem>
                    <SelectItem value="REJECTED">Tolak Klaim (Kembalikan Poin & Stok)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="redNotes" className="text-xs font-semibold">
                  Catatan Admin / No Resi Pengiriman
                </Label>
                <Input
                  id="redNotes"
                  placeholder="Contoh: No Resi JNE: JNE12345678 / Saldo Gopay telah ditransfer..."
                  value={redemptionNotes}
                  onChange={(e) => setRedemptionNotes(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedRedemption(null)}
                  disabled={isUpdatingRedemption}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isUpdatingRedemption}
                  className="gap-2 font-semibold"
                >
                  {isUpdatingRedemption && <Loader2 className="size-4 animate-spin" />}
                  Simpan Status
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
