import { useMemo, useState } from "react";
import { Eye, Gift, Search, UserPlus, Users } from "lucide-react";

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
  id: string;
  name: string;
  email: string;
  code: string;
  referredBy: string | null;
  joinedAt: string;
  commission: number;
  invitees: Invitee[];
}

const referralUsers: ReferralUser[] = [
  {
    id: "USR-001",
    name: "Andi Pratama",
    email: "andi.pratama@gmail.com",
    code: "MIFX-AND12",
    referredBy: null,
    joinedAt: "2026-01-12",
    commission: 500000,
    invitees: [
      { name: "Siti Rahmawati", joinedAt: "2026-08-02", status: "Aktif" },
      { name: "Budi Santoso", joinedAt: "2026-08-14", status: "Aktif" },
      { name: "Dewi Lestari", joinedAt: "2026-08-27", status: "Belum deposit" },
      { name: "Rizky Ramadhan", joinedAt: "2026-09-08", status: "Aktif" },
      { name: "Maya Anggraini", joinedAt: "2026-09-16", status: "Belum deposit" },
    ],
  },
  {
    id: "USR-002",
    name: "Siti Rahmawati",
    email: "siti.rahma@yahoo.com",
    code: "MIFX-SIT77",
    referredBy: "MIFX-AND12",
    joinedAt: "2026-01-28",
    commission: 300000,
    invitees: [
      { name: "Fajar Nugroho", joinedAt: "2026-08-20", status: "Aktif" },
      { name: "Putri Ayudia", joinedAt: "2026-09-01", status: "Aktif" },
    ],
  },
  {
    id: "USR-003",
    name: "Budi Santoso",
    email: "budi.santoso@gmail.com",
    code: "MIFX-BUD45",
    referredBy: "MIFX-AND12",
    joinedAt: "2026-02-03",
    commission: 0,
    invitees: [],
  },
  {
    id: "USR-004",
    name: "Dewi Lestari",
    email: "dewi.lestari@outlook.com",
    code: "MIFX-DEW09",
    referredBy: "MIFX-AND12",
    joinedAt: "2026-02-19",
    commission: 150000,
    invitees: [{ name: "Hendra Wijaya", joinedAt: "2026-09-12", status: "Aktif" }],
  },
  {
    id: "USR-005",
    name: "Rizky Ramadhan",
    email: "rizky.rmdhn@gmail.com",
    code: "MIFX-RIZ31",
    referredBy: "MIFX-SIT77",
    joinedAt: "2026-03-05",
    commission: 0,
    invitees: [],
  },
  {
    id: "USR-006",
    name: "Fajar Nugroho",
    email: "fajar.nugroho@gmail.com",
    code: "MIFX-FAJ88",
    referredBy: "MIFX-SIT77",
    joinedAt: "2026-04-10",
    commission: 450000,
    invitees: [
      { name: "Lia Kusuma", joinedAt: "2026-08-30", status: "Aktif" },
      { name: "Tono Saputra", joinedAt: "2026-09-05", status: "Aktif" },
      { name: "Nadia Safira", joinedAt: "2026-09-18", status: "Belum deposit" },
    ],
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
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

export function ReferralAdminPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ReferralUser | null>(null);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return referralUsers;
    return referralUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword) ||
        user.code.toLowerCase().includes(keyword),
    );
  }, [search]);

  const totalInvites = referralUsers.reduce((sum, u) => sum + u.invitees.length, 0);
  const totalCommission = referralUsers.reduce((sum, u) => sum + u.commission, 0);

  return (
    <AdminLayout
      title="Manajemen Referral"
      subtitle="Lihat kode referral tiap user dan berapa orang yang sudah mereka ajak"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">User dengan Kode</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{referralUsers.length}</p>
            <p className="text-xs text-muted-foreground">Semua user punya kode referral</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Undangan</CardTitle>
            <UserPlus className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalInvites}</p>
            <p className="text-xs text-muted-foreground">Pendaftar lewat kode referral</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Komisi</CardTitle>
            <Gift className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatRupiah(totalCommission)}</p>
            <p className="text-xs text-muted-foreground">Komisi yang sudah dibagikan</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari nama, email, atau kode referral..."
          className="pl-9"
        />
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
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    Tidak ada data referral yang cocok.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((user) => (
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
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">{user.code}</Badge>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {user.referredBy ?? "—"}
                    </TableCell>
                    <TableCell className="text-center text-sm font-semibold tabular-nums">
                      {user.invitees.length} orang
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold tabular-nums">
                      {formatRupiah(user.commission)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Lihat referral ${user.name}`}
                        onClick={() => setSelected(user)}
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

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detail Referral {selected?.name}</DialogTitle>
            <DialogDescription>
              Kode {selected?.code} · bergabung {selected ? formatDate(selected.joinedAt) : ""}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Jumlah diajak</p>
                  <p className="text-lg font-bold">{selected.invitees.length} orang</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Total komisi</p>
                  <p className="text-lg font-bold">{formatRupiah(selected.commission)}</p>
                </div>
              </div>
              <div className="divide-y rounded-lg border">
                {selected.invitees.length === 0 ? (
                  <p className="p-4 text-center text-sm text-muted-foreground">
                    Belum ada orang yang diajak dengan kode ini.
                  </p>
                ) : (
                  selected.invitees.map((invitee) => (
                    <div key={invitee.name} className="flex items-center justify-between gap-3 p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{invitee.name}</p>
                        <p className="text-xs text-muted-foreground">Gabung {formatDate(invitee.joinedAt)}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{invitee.status}</Badge>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
