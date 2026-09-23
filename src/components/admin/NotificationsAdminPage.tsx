import {
  Bell,
  CheckCircle2,
  Edit,
  ExternalLink,
  Info,
  Megaphone,
  Pin,
  PinOff,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Trash2,
  Users,
  AlertTriangle,
  Flame,
  ShieldAlert,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { secureFetch } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { broadcastNotificationUpdate } from "@/lib/notifications";

import { AdminLayout } from "./AdminLayout";
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
import { Textarea } from "@/components/ui/textarea";

export interface AdminNotification {
  id: number;
  title: string;
  message: string;
  type: "info" | "promo" | "alert" | "system" | "trading" | string;
  target: string;
  is_pinned: boolean;
  badge: string | null;
  author: string;
  action_url: string | null;
  created_at: string;
  updated_at: string;
}

interface Stats {
  total: number;
  pinned: number;
  promos: number;
  alerts: number;
  broadcastAudience: string;
}

export function NotificationsAdminPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("ALL");

  // Create / Edit Modal State
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [editingNotif, setEditingNotif] = useState<AdminNotification | null>(null);
  const [formTitle, setFormTitle] = useState<string>("");
  const [formMessage, setFormMessage] = useState<string>("");
  const [formType, setFormType] = useState<string>("info");
  const [formTarget, setFormTarget] = useState<string>("all");
  const [formBadge, setFormBadge] = useState<string>("");
  const [formIsPinned, setFormIsPinned] = useState<boolean>(false);
  const [formActionUrl, setFormActionUrl] = useState<string>("");

  // Delete Alert State
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await secureFetch("/api/admin/notifications");
      const data = await res.json();
      if (res.ok && data.success) {
        setNotifications(data.notifications || []);
        if (data.stats) setStats(data.stats);
      } else {
        toast.error("Gagal memuat notifikasi", {
          description: data.message || "Periksa hak akses administrator Anda.",
        });
      }
    } catch {
      toast.error("Koneksi gagal saat memuat daftar notifikasi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotifications();
  }, []);

  const openCreateDialog = () => {
    setEditingNotif(null);
    setFormTitle("");
    setFormMessage("");
    setFormType("info");
    setFormTarget("all");
    setFormBadge("Pengumuman");
    setFormIsPinned(false);
    setFormActionUrl("");
    setIsDialogOpen(true);
  };

  const openEditDialog = (notif: AdminNotification) => {
    setEditingNotif(notif);
    setFormTitle(notif.title);
    setFormMessage(notif.message);
    setFormType(notif.type);
    setFormTarget(notif.target);
    setFormBadge(notif.badge || "");
    setFormIsPinned(notif.is_pinned);
    setFormActionUrl(notif.action_url || "");
    setIsDialogOpen(true);
  };

  const handleSaveNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error("Judul notifikasi tidak boleh kosong");
      return;
    }
    if (!formMessage.trim()) {
      toast.error("Isi pesan notifikasi tidak boleh kosong");
      return;
    }

    setSubmitting(true);
    try {
      if (editingNotif) {
        // Update existing notification
        const res = await secureFetch("/api/admin/notifications", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingNotif.id,
            title: formTitle,
            message: formMessage,
            type: formType,
            target: formTarget,
            badge: formBadge || null,
            is_pinned: formIsPinned,
            action_url: formActionUrl || null,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          toast.success("Notifikasi Berhasil Diperbarui!", {
            description: `Pesan "${data.notification.title}" telah diperbarui.`,
          });
          setIsDialogOpen(false);
          void loadNotifications();
        } else {
          toast.error(data.message || "Gagal memperbarui notifikasi");
        }
      } else {
        // Broadcast new notification
        const res = await secureFetch("/api/admin/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formTitle,
            message: formMessage,
            type: formType,
            target: formTarget,
            badge: formBadge || null,
            is_pinned: formIsPinned,
            action_url: formActionUrl || null,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          toast.success("Notifikasi Berhasil Disiarkan!", {
            description: `Pesan disiarkan ke seluruh pengguna aplikasi Gotrade.`,
          });
          setIsDialogOpen(false);
          void loadNotifications();
          broadcastNotificationUpdate();
        } else {
          toast.error(data.message || "Gagal menyiarkan notifikasi");
        }
      }
    } catch {
      toast.error("Terjadi kendala jaringan saat menyimpan notifikasi.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePin = async (notif: AdminNotification) => {
    try {
      const res = await secureFetch("/api/admin/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: notif.id,
          is_pinned: !notif.is_pinned,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(!notif.is_pinned ? "Notifikasi Disematkan!" : "Sematkan Notifikasi Dicabut");
        void loadNotifications();
        broadcastNotificationUpdate();
      } else {
        toast.error(data.message || "Gagal mengubah status sematan.");
      }
    } catch {
      toast.error("Gagal terhubung ke server.");
    }
  };

  const confirmDelete = (id: number) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteNotification = async () => {
    if (!deletingId) return;
    try {
      const res = await secureFetch(`/api/admin/notifications?id=${deletingId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Notifikasi Dihapus", {
          description: "Pesan telah dihapus dari sistem pengumuman.",
        });
        setDeleteDialogOpen(false);
        setDeletingId(null);
        void loadNotifications();
        broadcastNotificationUpdate();
      } else {
        toast.error(data.message || "Gagal menghapus notifikasi");
      }
    } catch {
      toast.error("Gagal terhubung ke server untuk menghapus.");
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (filterType !== "ALL" && item.type !== filterType) return false;
      if (!searchQuery.trim()) return true;
      const lower = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(lower) ||
        item.message.toLowerCase().includes(lower) ||
        (item.badge && item.badge.toLowerCase().includes(lower)) ||
        item.author.toLowerCase().includes(lower)
      );
    });
  }, [notifications, filterType, searchQuery]);

  const getTypeStyle = (type: string) => {
    switch (type) {
      case "promo":
        return {
          badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
          icon: Flame,
          label: "Promo & Bonus",
          border: "border-l-amber-500",
        };
      case "alert":
        return {
          badge: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
          icon: AlertTriangle,
          label: "Peringatan Risiko",
          border: "border-l-rose-500",
        };
      case "system":
        return {
          badge: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
          icon: ShieldAlert,
          label: "Sistem & Keamanan",
          border: "border-l-purple-500",
        };
      case "trading":
        return {
          badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
          icon: Sparkles,
          label: "Sinyal / Pasar",
          border: "border-l-emerald-500",
        };
      default:
        return {
          badge: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
          icon: Info,
          label: "Informasi Umum",
          border: "border-l-blue-500",
        };
    }
  };

  return (
    <AdminLayout
      title="Manajemen Notifikasi & Broadcast"
      subtitle="Siarkan pesan pengumuman, promo, sinyal, dan peringatan langsung ke seluruh pengguna aplikasi Gotrade."
    >
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-primary/20 bg-primary/5 shadow-xs">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Megaphone className="size-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">Total Notifikasi</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats?.total ?? notifications.length}
                </p>
                <p className="text-[11px] text-primary font-medium">Aktif di platform</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-500/20 bg-amber-500/5 shadow-xs">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Pin className="size-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">Disematkan (Pinned)</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats?.pinned ?? notifications.filter((n) => n.is_pinned).length}
                </p>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  Tampil prioritas di atas
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-500/20 bg-emerald-500/5 shadow-xs">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Users className="size-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">Target Broadcast</p>
                <p className="text-sm font-bold text-foreground">Semua Pengguna</p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Trader & Akun Live Gotrade
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-500/20 bg-purple-500/5 shadow-xs">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Bell className="size-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">Promo & Alerts</p>
                <p className="text-2xl font-bold text-foreground">
                  {(stats?.promos ?? 0) + (stats?.alerts ?? 0)}
                </p>
                <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                  Event aktif & kampanye
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Card with Action Controls */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="size-5 text-primary" />
                  Daftar Siaran & Notifikasi Pengguna
                </CardTitle>
                <CardDescription>
                  Kelola konten pesan yang akan diterima oleh seluruh pengguna pada menu notifikasi
                  aplikasi.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void loadNotifications()}
                  disabled={loading}
                  className="gap-1.5 text-xs h-9"
                >
                  <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
                  Muat Ulang
                </Button>

                <Button
                  onClick={openCreateDialog}
                  size="sm"
                  className="gap-1.5 text-xs h-9 font-medium shadow-xs"
                >
                  <Plus className="size-4" />
                  Siarkan Notifikasi Baru
                </Button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 pt-3">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Cari berdasarkan judul, pesan, badge, atau penulis..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-xs h-9"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                <Button
                  variant={filterType === "ALL" ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-9"
                  onClick={() => setFilterType("ALL")}
                >
                  Semua ({notifications.length})
                </Button>
                <Button
                  variant={filterType === "info" ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-9"
                  onClick={() => setFilterType("info")}
                >
                  Info
                </Button>
                <Button
                  variant={filterType === "promo" ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-9"
                  onClick={() => setFilterType("promo")}
                >
                  Promo
                </Button>
                <Button
                  variant={filterType === "alert" ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-9"
                  onClick={() => setFilterType("alert")}
                >
                  Peringatan
                </Button>
                <Button
                  variant={filterType === "system" ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-9"
                  onClick={() => setFilterType("system")}
                >
                  Sistem
                </Button>
                <Button
                  variant={filterType === "trading" ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-9"
                  onClick={() => setFilterType("trading")}
                >
                  Trading
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <RefreshCw className="size-6 animate-spin text-primary mb-2" />
                <p className="text-xs">Memuat daftar notifikasi...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border rounded-xl border-dashed">
                <Bell className="size-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm font-semibold text-foreground">Tidak Ada Notifikasi</p>
                <p className="text-xs text-muted-foreground max-w-sm mt-1">
                  {searchQuery || filterType !== "ALL"
                    ? "Tidak ditemukan notifikasi yang cocok dengan filter atau kata kunci pencarian Anda."
                    : "Belum ada notifikasi yang disiarkan. Klik tombol di atas untuk membuat siaran pertama."}
                </p>
                <Button
                  onClick={openCreateDialog}
                  variant="outline"
                  size="sm"
                  className="mt-4 text-xs gap-1.5"
                >
                  <Plus className="size-3.5" /> Buat Siaran Baru
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notif) => {
                  const style = getTypeStyle(notif.type);
                  const IconComp = style.icon;
                  const dateStr = new Date(notif.created_at).toLocaleString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={notif.id}
                      className={`relative flex flex-col md:flex-row md:items-start justify-between gap-4 p-4 rounded-xl border bg-card hover:bg-muted/20 transition-colors border-l-4 ${style.border}`}
                    >
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        <div
                          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${style.badge}`}
                        >
                          <IconComp className="size-5" />
                        </div>

                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {notif.is_pinned && (
                              <Badge className="bg-amber-500 text-white hover:bg-amber-500 text-[10px] gap-1 px-1.5 py-0 h-4">
                                <Pin className="size-2.5 fill-current" /> Disematkan
                              </Badge>
                            )}
                            <Badge variant="outline" className={`text-[10px] ${style.badge}`}>
                              {style.label}
                            </Badge>
                            {notif.badge && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                {notif.badge}
                              </Badge>
                            )}
                            <span className="text-[11px] text-muted-foreground">
                              Target:{" "}
                              <strong className="text-foreground">
                                {notif.target === "all" ? "Semua Pengguna" : notif.target}
                              </strong>
                            </span>
                          </div>

                          <h3 className="text-sm font-bold text-foreground leading-snug">
                            {notif.title}
                          </h3>

                          <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                            {notif.message}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-muted-foreground">
                            <span>
                              Pengirim: <strong className="text-foreground">{notif.author}</strong>
                            </span>
                            <span>•</span>
                            <span>{dateStr}</span>
                            {notif.action_url && (
                              <>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1 text-primary font-medium">
                                  <ExternalLink className="size-3" />
                                  Link: {notif.action_url}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 self-end md:self-start shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void handleTogglePin(notif)}
                          title={notif.is_pinned ? "Lepas Sematan" : "Sematkan di Atas"}
                          className={`h-8 px-2 text-xs gap-1 ${
                            notif.is_pinned
                              ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                              : ""
                          }`}
                        >
                          {notif.is_pinned ? (
                            <>
                              <PinOff className="size-3.5" />
                              <span className="hidden sm:inline">Lepas Pin</span>
                            </>
                          ) : (
                            <>
                              <Pin className="size-3.5" />
                              <span className="hidden sm:inline">Sematkan</span>
                            </>
                          )}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(notif)}
                          className="h-8 px-2.5 text-xs gap-1"
                        >
                          <Edit className="size-3.5" />
                          <span>Ubah</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => confirmDelete(notif.id)}
                          className="h-8 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="size-3.5" />
                          <span className="sr-only">Hapus</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* CREATE / EDIT NOTIFICATION DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleSaveNotification}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Send className="size-5 text-primary" />
                {editingNotif ? "Ubah Pesan Notifikasi" : "Siarkan Notifikasi Baru ke Pengguna"}
              </DialogTitle>
              <DialogDescription>
                {editingNotif
                  ? "Perbarui konten pesan notifikasi yang telah disiarkan sebelumnya."
                  : "Pesan ini akan langsung muncul di panel notifikasi seluruh pengguna aplikasi Gotrade."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-xs font-semibold">
                    Judul Notifikasi <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="Contoh: Bonus Deposit 20% Minggu Ini"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="badge" className="text-xs font-semibold">
                    Label Badge Singkat (Opsional)
                  </Label>
                  <Input
                    id="badge"
                    placeholder="Contoh: Hot Promo, Penting, Update"
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-xs font-semibold">
                    Kategori Notifikasi
                  </Label>
                  <Select value={formType} onValueChange={setFormType}>
                    <SelectTrigger id="type" className="text-xs h-9">
                      <SelectValue placeholder="Pilih Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Informasi Umum (Biru)</SelectItem>
                      <SelectItem value="promo">Promo & Bonus (Kuning/Emas)</SelectItem>
                      <SelectItem value="alert">Peringatan Risiko (Merah)</SelectItem>
                      <SelectItem value="system">Sistem & Keamanan (Ungu)</SelectItem>
                      <SelectItem value="trading">Sinyal / Pasar (Hijau)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target" className="text-xs font-semibold">
                    Target Penerima
                  </Label>
                  <Select value={formTarget} onValueChange={setFormTarget}>
                    <SelectTrigger id="target" className="text-xs h-9">
                      <SelectValue placeholder="Pilih Target" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Pengguna (Broadcast)</SelectItem>
                      <SelectItem value="trader">Khusus Akun Real</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actionUrl" className="text-xs font-semibold">
                    Tautan Tujuan (Opsional)
                  </Label>
                  <Input
                    id="actionUrl"
                    placeholder="Contoh: /trade, /deposit"
                    value={formActionUrl}
                    onChange={(e) => setFormActionUrl(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-xs font-semibold">
                  Isi Pesan Siaran <span className="text-rose-500">*</span>
                </Label>
                <Textarea
                  id="message"
                  placeholder="Tuliskan isi pesan pengumuman atau notifikasi secara jelas kepada pengguna..."
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  rows={4}
                  required
                  className="text-xs resize-none"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-muted/40 rounded-lg border">
                <input
                  type="checkbox"
                  id="isPinned"
                  checked={formIsPinned}
                  onChange={(e) => setFormIsPinned(e.target.checked)}
                  className="size-4 rounded text-primary focus:ring-primary"
                />
                <Label htmlFor="isPinned" className="text-xs font-medium cursor-pointer">
                  Sematkan (Pin) notifikasi ini di posisi paling atas agar langsung dilihat
                  pengguna.
                </Label>
              </div>

              {/* Live Preview Section */}
              <div className="space-y-1.5 pt-2 border-t">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Pratinjau Tampilan Pengguna (Live In-App Preview)
                </p>
                <div className="p-3.5 rounded-xl border bg-background shadow-xs space-y-2">
                  <div className="flex items-center gap-2">
                    {formIsPinned && (
                      <Badge className="bg-amber-500 text-white text-[9px] px-1.5 py-0 h-4">
                        <Pin className="size-2 fill-current" /> Pinned
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                      {formBadge || formType.toUpperCase()}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground ml-auto">Baru saja</span>
                  </div>
                  <h4 className="text-xs font-bold text-foreground">
                    {formTitle || "Judul notifikasi akan muncul di sini..."}
                  </h4>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {formMessage ||
                      "Isi pesan notifikasi akan terlihat seperti ini pada ponsel trader..."}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button type="submit" disabled={submitting} className="text-xs gap-1.5">
                {submitting ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <Send className="size-3.5" />
                    {editingNotif ? "Simpan Perubahan" : "Siarkan Sekarang"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION ALERT DIALOG */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-rose-600 flex items-center gap-2">
              <Trash2 className="size-5" /> Hapus Notifikasi?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Notifikasi ini akan langsung dihapus dari pusat
              pesan seluruh pengguna aplikasi Gotrade.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDeleteNotification()}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs"
            >
              Ya, Hapus Notifikasi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
