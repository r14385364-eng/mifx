import { useEffect, useMemo, useState } from "react";
import { Eye, Gift, Pencil, Plus, Search, Trash2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Invitee {
  name: string;
  joinedAt: string;
  status: "Aktif" | "Belum deposit";
}

interface ReferralUser {
  id: number;
  userName: string;
  email: string;
  code: string;
  referredBy: string | null;
  joinedAt: string;
  commission: number;
  inviteesCount: number;
  invitees: Invitee[];
}

const defaultReferrals: ReferralUser[] = [
  {
    id: 1,
    userName: "Trader Gotrade",
    email: "user@gotrade.com",
    code: "GOTRADE88",
    referredBy: "GOTRADE-OFFICIAL",
    joinedAt: "2026-03-01",
    commission: 150000,
    inviteesCount: 3,
    invitees: [
      { name: "Budi Santoso", joinedAt: "2026-03-05", status: "Aktif" },
      { name: "Siti Rahma", joinedAt: "2026-03-10", status: "Aktif" },
      { name: "Andi Wijaya", joinedAt: "2026-03-15", status: "Belum deposit" },
    ],
  },
  {
    id: 2,
    userName: "Administrator Gotrade",
    email: "admin@gotrade.com",
    code: "ADMINVIP",
    referredBy: null,
    joinedAt: "2026-01-01",
    commission: 500000,
    inviteesCount: 8,
    invitees: [],
  },
];

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
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

type FormState = {
  userName: string;
  email: string;
  code: string;
  referredBy: string;
  commission: number;
  inviteesCount: number;
};

const emptyForm: FormState = {
  userName: "",
  email: "",
  code: "",
  referredBy: "",
  commission: 50000,
  inviteesCount: 0,
};

export function ReferralAdminPage() {
  const [referrals, setReferrals] = useState<ReferralUser[]>(defaultReferrals);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ReferralUser | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(false);

  const fetchReferrals = async () => {
    try {
      const res = await fetch("/api/referrals");
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.referrals)) {
        type ApiRef = {
          id: number;
          user_name: string;
          email: string;
          code: string;
          referred_by: string;
          commission: number | string;
          invitees_count: number;
          created_at: string;
        };
        const mapped: ReferralUser[] = (data.referrals as ApiRef[]).map((r) => ({
          id: r.id,
          userName: r.user_name,
          email: r.email,
          code: r.code,
          referredBy: r.referred_by || null,
          joinedAt: r.created_at ? r.created_at.split("T")[0] : "2026-03-01",
          commission: Number(r.commission) || 0,
          inviteesCount: r.invitees_count || 0,
          invitees: [],
        }));
        if (mapped.length > 0) {
          setReferrals(mapped);
        }
      }
    } catch {
      // keep default
    }
  };

  useEffect(() => {
    void fetchReferrals();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      code: "REF" + Math.floor(1000 + Math.random() * 9000),
    });
    setDialogOpen(true);
  };

  const openEdit = (ref: ReferralUser) => {
    setEditingId(ref.id);
    setForm({
      userName: ref.userName,
      email: ref.email,
      code: ref.code,
      referredBy: ref.referredBy || "",
      commission: ref.commission,
      inviteesCount: ref.inviteesCount,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.userName || !form.email || !form.code) {
      toast.error("Nama, Email, dan Kode Referral wajib diisi");
      return;
    }

    setLoading(true);
    try {
      if (editingId === null) {
        const res = await fetch("/api/referrals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userName: form.userName,
            email: form.email,
            code: form.code,
            referredBy: form.referredBy,
            commission: form.commission,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          toast.success("Kode Referral baru berhasil dibuat!");
          await fetchReferrals();
          setDialogOpen(false);
        } else {
          toast.error(data.message || "Gagal membuat referral");
        }
      } else {
        const res = await fetch("/api/referrals", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingId,
            userName: form.userName,
            email: form.email,
            code: form.code,
            referredBy: form.referredBy,
            commission: form.commission,
            inviteesCount: form.inviteesCount,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          toast.success("Data referral berhasil diperbarui!");
          await fetchReferrals();
          setDialogOpen(false);
        } else {
          toast.error(data.message || "Gagal memperbarui referral");
        }
      }
    } catch {
      toast.error("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/referrals?id=${deletingId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Referral berhasil dihapus");
        setReferrals((prev) => prev.filter((r) => r.id !== deletingId));
      } else {
        toast.error(data.message || "Gagal menghapus referral");
      }
    } catch {
      toast.error("Gagal menghapus referral");
    } finally {
      setDeletingId(null);
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return referrals;
    return referrals.filter(
      (user) =>
        user.userName.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword) ||
        user.code.toLowerCase().includes(keyword),
    );
  }, [referrals, search]);

  const totalInvites = referrals.reduce(
    (sum, u) => sum + (u.inviteesCount || u.invitees.length),
    0,
  );
  const totalCommission = referrals.reduce((sum, u) => sum + u.commission, 0);

  return (
    <AdminLayout
      title="Manajemen Referral"
      subtitle="Kelola kode referral unik user, komisi pendaftaran, dan data pendaftar"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              User dengan Kode
            </CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{referrals.length}</p>
            <p className="text-xs text-muted-foreground">User terdaftar dengan kode referral</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Undangan
            </CardTitle>
            <UserPlus className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalInvites}</p>
            <p className="text-xs text-muted-foreground">Pendaftar lewat kode referral</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Komisi
            </CardTitle>
            <Gift className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatRupiah(totalCommission)}</p>
            <p className="text-xs text-muted-foreground">Komisi yang sudah dibagikan</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama, email, atau kode referral..."
            className="pl-9"
          />
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="size-4" />
          Referral Baru
        </Button>
      </div>

      <Card className="mt-4">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Kode Referral</TableHead>
                <TableHead className="hidden md:table-cell">Diajak Oleh</TableHead>
                <TableHead className="text-center">Jumlah Diajak</TableHead>
                <TableHead className="text-right">Komisi</TableHead>
                <TableHead className="w-24 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    Tidak ada data referral yang cocok.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
                          {initials(user.userName)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{user.userName}</p>
                          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs font-semibold">
                        {user.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {user.referredBy ?? "—"}
                    </TableCell>
                    <TableCell className="text-center text-sm font-semibold tabular-nums">
                      {user.inviteesCount || user.invitees.length} orang
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold tabular-nums">
                      {formatRupiah(user.commission)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Detail Referral"
                          onClick={() => setSelected(user)}
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Edit Referral"
                          onClick={() => openEdit(user)}
                        >
                          <Pencil className="size-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Hapus Referral"
                          onClick={() => setDeletingId(user.id)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detail Referral {selected?.userName}</DialogTitle>
            <DialogDescription>
              Kode {selected?.code} · bergabung {selected ? formatDate(selected.joinedAt) : ""}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Jumlah diajak</p>
                  <p className="text-lg font-bold">
                    {selected.inviteesCount || selected.invitees.length} orang
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Total komisi</p>
                  <p className="text-lg font-bold">{formatRupiah(selected.commission)}</p>
                </div>
              </div>
              <div className="divide-y rounded-lg border">
                {selected.invitees.length === 0 ? (
                  <p className="p-4 text-center text-sm text-muted-foreground">
                    Tercatat {selected.inviteesCount || 0} orang pendaftar dengan kode ini.
                  </p>
                ) : (
                  selected.invitees.map((invitee) => (
                    <div key={invitee.name} className="flex items-center justify-between gap-3 p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{invitee.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Gabung {formatDate(invitee.joinedAt)}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {invitee.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Add/Edit Referral */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId === null ? "Buat Kode Referral Baru" : "Edit Data Referral"}
            </DialogTitle>
            <DialogDescription>
              {editingId === null
                ? "Tambahkan kode referral khusus untuk user baru."
                : "Perbarui informasi dan komisi referral pengguna."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="ref-name">Nama Pemilik Kode</Label>
              <Input
                id="ref-name"
                value={form.userName}
                onChange={(e) => setForm({ ...form, userName: e.target.value })}
                placeholder="Nama user"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ref-email">Email Pemilik</Label>
              <Input
                id="ref-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="ref-code">Kode Referral Unik</Label>
                <Input
                  id="ref-code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="GOTRADE88"
                  className="font-mono"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ref-by">Diajak Oleh (Kode)</Label>
                <Input
                  id="ref-by"
                  value={form.referredBy}
                  onChange={(e) => setForm({ ...form, referredBy: e.target.value })}
                  placeholder="Opsional (misal: GOTRADE-OFFICIAL)"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="ref-comm">Nominal Komisi (IDR)</Label>
                <Input
                  id="ref-comm"
                  type="number"
                  value={form.commission}
                  onChange={(e) => setForm({ ...form, commission: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ref-inv">Jumlah Pendaftar Diajak</Label>
                <Input
                  id="ref-inv"
                  type="number"
                  value={form.inviteesCount}
                  onChange={(e) => setForm({ ...form, inviteesCount: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Referral"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Hapus Referral */}
      <AlertDialog open={deletingId !== null} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kode Referral?</AlertDialogTitle>
            <AlertDialogDescription>
              Kode referral ini akan dihapus dari sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              {loading ? "Menghapus..." : "Ya, Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
