import { useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Plus, Search, Trash2, UserCheck, Users, Wallet, UserX } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type UserStatus = "aktif" | "nonaktif";

interface ManagedUser {
  id: string;
  numericId: number;
  name: string;
  email: string;
  phone: string;
  registeredAt: string;
  status: UserStatus;
  balance: number;
  accountType: string;
  role: "user" | "admin";
}

const initialUsers: ManagedUser[] = [
  {
    id: "USR-001",
    numericId: 1,
    name: "Trader Gotrade",
    email: "user@gotrade.com",
    phone: "0812-3456-7890",
    registeredAt: "2026-03-01",
    status: "aktif",
    balance: 10000,
    accountType: "MT5",
    role: "user",
  },
  {
    id: "ADM-002",
    numericId: 2,
    name: "Administrator Gotrade",
    email: "admin@gotrade.com",
    phone: "0811-9876-5432",
    registeredAt: "2026-01-01",
    status: "aktif",
    balance: 999999,
    accountType: "MT5",
    role: "admin",
  },
];

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
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

type UserFormState = {
  name: string;
  email: string;
  password?: string;
  phone: string;
  balance: number;
  accountType: string;
  role: "user" | "admin";
  status: UserStatus;
};

const emptyForm: UserFormState = {
  name: "",
  email: "",
  password: "user123",
  phone: "0812-3456-7890",
  balance: 0,
  accountType: "MT5",
  role: "user",
  status: "aktif",
};

export function UsersAdminPage() {
  const [users, setUsers] = useState<ManagedUser[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"semua" | UserStatus>("semua");
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);

  // Form state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await secureFetch("/api/users");
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.users)) {
        type ApiUser = {
          id: number;
          name: string;
          email: string;
          phone: string;
          created_at: string;
          balance: number | string;
          role: string;
          account_type: string;
        };
        const mapped: ManagedUser[] = (data.users as ApiUser[]).map((u) => ({
          id: `USR-${String(u.id).padStart(3, "0")}`,
          numericId: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone || "0812-xxxx-xxxx",
          registeredAt: u.created_at ? u.created_at.split("T")[0] : "2026-03-01",
          status: "aktif",
          balance: u.balance !== undefined && u.balance !== null ? Number(u.balance) : 0,
          accountType: u.account_type || "MT5",
          role: u.role === "admin" ? "admin" : "user",
        }));
        if (mapped.length > 0) {
          setUsers(mapped);
        }
      }
    } catch {
      // keep fallback
    }
  };

  useEffect(() => {
    void fetchUsers();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (user: ManagedUser) => {
    setEditingId(user.numericId);
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      balance: user.balance,
      accountType: user.accountType,
      role: user.role,
      status: user.status,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) {
      toast.error("Nama dan Email wajib diisi");
      return;
    }

    setLoading(true);
    try {
      if (editingId === null) {
        // Create user
        const res = await secureFetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password || "user123",
            phone: form.phone,
            role: form.role,
            balance: form.balance,
            accountType: form.accountType,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          toast.success("User berhasil ditambahkan!");
          await fetchUsers();
          setDialogOpen(false);
        } else {
          toast.error(data.message || "Gagal menambah user");
        }
      } else {
        // Edit user
        const res = await secureFetch("/api/users", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingId,
            name: form.name,
            email: form.email,
            phone: form.phone,
            role: form.role,
            balance: form.balance,
            accountType: form.accountType,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          toast.success("User berhasil diperbarui!");
          await fetchUsers();
          setDialogOpen(false);
        } else {
          toast.error(data.message || "Gagal memperbarui user");
        }
      }
    } catch {
      toast.error("Terjadi kesalahan koneksi server");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setLoading(true);
    try {
      const res = await secureFetch(`/api/users?id=${deletingId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("User berhasil dihapus");
        setUsers((current) => current.filter((u) => u.numericId !== deletingId));
      } else {
        toast.error(data.message || "Gagal menghapus user");
      }
    } catch {
      toast.error("Gagal menghapus user");
    } finally {
      setDeletingId(null);
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchKeyword =
        keyword.length === 0 ||
        user.name.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword) ||
        user.id.toLowerCase().includes(keyword);
      const matchStatus = statusFilter === "semua" || user.status === statusFilter;
      return matchKeyword && matchStatus;
    });
  }, [users, search, statusFilter]);

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === "aktif").length;
  const totalBalance = users.reduce((sum, u) => sum + u.balance, 0);

  return (
    <AdminLayout
      title="Manajemen User"
      subtitle="Kelola data pengguna terdaftar, peran, saldo, dan akses akun"
    >
      {/* Statistik */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total User</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalUsers}</p>
            <p className="text-xs text-muted-foreground">Pengguna terdaftar di aplikasi</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">User Aktif</CardTitle>
            <UserCheck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeUsers}</p>
            <p className="text-xs text-muted-foreground">
              {totalUsers - activeUsers} user nonaktif
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Saldo</CardTitle>
            <Wallet className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatUSD(totalBalance)}</p>
            <p className="text-xs text-muted-foreground">
              ≈ {formatRupiah(totalBalance)} (Kurs 1 USD = Rp 16.000)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Action */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama, email, atau ID user..."
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as "semua" | UserStatus)}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Status</SelectItem>
              <SelectItem value="aktif">Aktif</SelectItem>
              <SelectItem value="nonaktif">Nonaktif</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="size-4" />
          User Baru
        </Button>
      </div>

      {/* Tabel user */}
      <Card className="mt-4">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="hidden md:table-cell">Terdaftar</TableHead>
                <TableHead className="hidden sm:table-cell">Role & Akun</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead className="w-28 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    Tidak ada user yang cocok dengan pencarian.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
                          {initials(user.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{user.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {formatDate(user.registeredAt)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Badge variant={user.role === "admin" ? "default" : "outline"}>
                          {user.role.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">{user.accountType}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          user.status === "aktif"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-400"
                            : "border-muted bg-muted text-muted-foreground",
                        )}
                      >
                        {user.status === "aktif" ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold tabular-nums">
                      <div>{formatUSD(user.balance)}</div>
                      <div className="text-[11px] font-normal text-muted-foreground">
                        ≈ {formatRupiah(user.balance)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Detail User"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Edit User"
                          onClick={() => openEdit(user)}
                        >
                          <Pencil className="size-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Hapus User"
                          onClick={() => setDeletingId(user.numericId)}
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

      {/* Detail user modal */}
      <Dialog open={selectedUser !== null} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle>Detail User</DialogTitle>
                <DialogDescription>Informasi akun dan saldo {selectedUser.name}</DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-4 rounded-lg border bg-muted/40 p-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground">
                  {initials(selectedUser.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{selectedUser.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{selectedUser.email}</p>
                  <p className="text-xs text-muted-foreground">{selectedUser.id}</p>
                </div>
              </div>

              <div className="rounded-lg border bg-primary/5 p-4 text-center">
                <p className="text-xs font-medium text-muted-foreground">Saldo Akun (Trading)</p>
                <p className="mt-1 text-2xl font-extrabold tabular-nums text-primary">
                  {formatUSD(selectedUser.balance)}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground font-medium">
                  ≈ {formatRupiah(selectedUser.balance)}
                </p>
              </div>

              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">No. Telepon</dt>
                  <dd className="font-medium">{selectedUser.phone}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Terdaftar Sejak</dt>
                  <dd className="font-medium">{formatDate(selectedUser.registeredAt)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Role</dt>
                  <dd>
                    <Badge>{selectedUser.role.toUpperCase()}</Badge>
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Jenis Akun</dt>
                  <dd>
                    <Badge variant="outline">{selectedUser.accountType}</Badge>
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>
                    <Badge
                      variant="outline"
                      className={cn(
                        "gap-1",
                        selectedUser.status === "aktif"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-400"
                          : "border-muted bg-muted text-muted-foreground",
                      )}
                    >
                      {selectedUser.status === "aktif" ? (
                        <UserCheck className="size-3" />
                      ) : (
                        <UserX className="size-3" />
                      )}
                      {selectedUser.status === "aktif" ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </dd>
                </div>
              </dl>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Add / Edit User */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId === null ? "Tambah User Baru" : "Edit Data User"}</DialogTitle>
            <DialogDescription>
              {editingId === null
                ? "Isi formulir berikut untuk mendaftarkan akun trader baru."
                : "Perbarui informasi profil dan saldo akun pengguna."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="u-name">Nama Lengkap</Label>
              <Input
                id="u-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Contoh: Budi Santoso"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="u-email">Email Address</Label>
                <Input
                  id="u-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="budi@example.com"
                />
              </div>
              {editingId === null && (
                <div className="grid gap-2">
                  <Label htmlFor="u-password">Password</Label>
                  <Input
                    id="u-password"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Minimal 6 karakter"
                  />
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="u-phone">No. Telepon</Label>
                <Input
                  id="u-phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="0812-xxxx-xxxx"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="u-role">Role Akses</Label>
                <Select
                  value={form.role}
                  onValueChange={(val) => setForm({ ...form, role: val as "user" | "admin" })}
                >
                  <SelectTrigger id="u-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">USER (Trader)</SelectItem>
                    <SelectItem value="admin">ADMINISTRATOR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="u-balance">Saldo Awal / Deposit ($ USD)</Label>
                <Input
                  id="u-balance"
                  type="number"
                  value={form.balance}
                  onChange={(e) => setForm({ ...form, balance: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="u-type">Tipe Akun Trading</Label>
                <Select
                  value={form.accountType}
                  onValueChange={(val) => setForm({ ...form, accountType: val })}
                >
                  <SelectTrigger id="u-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MT5">MetaTrader 5 (MT5)</SelectItem>
                    <SelectItem value="MT4">MetaTrader 4 (MT4)</SelectItem>
                    <SelectItem value="Standard Live">Standard Live Account</SelectItem>
                    <SelectItem value="Raw Spread">Raw Spread Account</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Hapus User */}
      <AlertDialog open={deletingId !== null} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus User Pengguna?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini permanen. Akun pengguna dan data saldo akan dihapus dari sistem database
              secara menyeluruh.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              {loading ? "Menghapus..." : "Ya, Hapus Permanen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
