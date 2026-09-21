import { useMemo, useState } from "react";
import { Eye, Search, UserCheck, Users, Wallet, UserX } from "lucide-react";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
  name: string;
  email: string;
  phone: string;
  registeredAt: string;
  status: UserStatus;
  balance: number;
  accountType: "MT4" | "MT5";
}

const initialUsers: ManagedUser[] = [
  {
    id: "USR-001",
    name: "Andi Pratama",
    email: "andi.pratama@gmail.com",
    phone: "0812-3456-7890",
    registeredAt: "2026-01-12",
    status: "aktif",
    balance: 15750000,
    accountType: "MT5",
  },
  {
    id: "USR-002",
    name: "Siti Rahmawati",
    email: "siti.rahma@yahoo.com",
    phone: "0813-9876-5432",
    registeredAt: "2026-01-28",
    status: "aktif",
    balance: 8200000,
    accountType: "MT4",
  },
  {
    id: "USR-003",
    name: "Budi Santoso",
    email: "budi.santoso@gmail.com",
    phone: "0821-1122-3344",
    registeredAt: "2026-02-03",
    status: "nonaktif",
    balance: 0,
    accountType: "MT5",
  },
  {
    id: "USR-004",
    name: "Dewi Lestari",
    email: "dewi.lestari@outlook.com",
    phone: "0857-6677-8899",
    registeredAt: "2026-02-19",
    status: "aktif",
    balance: 43500000,
    accountType: "MT5",
  },
  {
    id: "USR-005",
    name: "Rizky Ramadhan",
    email: "rizky.rmdhn@gmail.com",
    phone: "0819-2233-4455",
    registeredAt: "2026-03-05",
    status: "aktif",
    balance: 2750000,
    accountType: "MT4",
  },
  {
    id: "USR-006",
    name: "Maya Anggraini",
    email: "maya.anggraini@gmail.com",
    phone: "0852-7788-9900",
    registeredAt: "2026-03-22",
    status: "nonaktif",
    balance: 150000,
    accountType: "MT4",
  },
  {
    id: "USR-007",
    name: "Fajar Nugroho",
    email: "fajar.nugroho@gmail.com",
    phone: "0815-3344-5566",
    registeredAt: "2026-04-10",
    status: "aktif",
    balance: 12875000,
    accountType: "MT5",
  },
  {
    id: "USR-008",
    name: "Putri Ayudia",
    email: "putri.ayudia@gmail.com",
    phone: "0877-8899-0011",
    registeredAt: "2026-05-02",
    status: "aktif",
    balance: 6600000,
    accountType: "MT5",
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
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function UsersAdminPage() {
  const [users] = useState<ManagedUser[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"semua" | UserStatus>("semua");
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);

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
      subtitle="Lihat pengguna terdaftar dan saldo akun masing-masing"
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
            <p className="text-2xl font-bold">{formatRupiah(totalBalance)}</p>
            <p className="text-xs text-muted-foreground">Akumulasi saldo seluruh user</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
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

      {/* Tabel user */}
      <Card className="mt-4">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="hidden md:table-cell">Terdaftar</TableHead>
                <TableHead className="hidden sm:table-cell">Akun</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead className="w-12" />
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
                      <Badge variant="outline">{user.accountType}</Badge>
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
                      {formatRupiah(user.balance)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Lihat detail ${user.name}`}
                        onClick={() => setSelectedUser(user)}
                      >
                        <Eye className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail user */}
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
                <p className="text-xs font-medium text-muted-foreground">Saldo Akun</p>
                <p className="mt-1 text-2xl font-extrabold tabular-nums text-primary">
                  {formatRupiah(selectedUser.balance)}
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
    </AdminLayout>
  );
}
