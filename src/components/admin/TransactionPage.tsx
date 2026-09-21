import { Check, Clock3, Search, WalletCards, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { AdminLayout } from "./AdminLayout";

export type Transaction = {
  id: string;
  name: string;
  account: string;
  channel: string;
  destination: string;
  amount: number;
  time: string;
  status: "Menunggu" | "Berhasil" | "Ditolak";
};

const statusStyle = {
  Menunggu: "border-chart-4/30 bg-chart-4/15 text-foreground",
  Berhasil: "border-primary/25 bg-primary/10 text-primary",
  Ditolak: "border-destructive/25 bg-destructive/10 text-destructive",
};

const formatRupiah = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);

export function TransactionPage({
  type,
  transactions,
}: {
  type: "Top Up" | "Withdraw";
  transactions: Transaction[];
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Semua");
  const filtered = useMemo(
    () =>
      transactions.filter((transaction) => {
        const matchesQuery = `${transaction.name} ${transaction.account} ${transaction.id}`
          .toLowerCase()
          .includes(query.toLowerCase());
        return matchesQuery && (status === "Semua" || transaction.status === status);
      }),
    [query, status, transactions],
  );

  const pending = transactions.filter((transaction) => transaction.status === "Menunggu");
  const completed = transactions.filter((transaction) => transaction.status === "Berhasil");
  const pendingTotal = pending.reduce((total, transaction) => total + transaction.amount, 0);

  return (
    <AdminLayout title={type} subtitle={`Kelola permintaan ${type.toLowerCase()} pengguna`}>
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Total Permintaan" value={String(transactions.length)} icon={WalletCards} />
          <SummaryCard label="Perlu Diproses" value={String(pending.length)} icon={Clock3} accent />
          <SummaryCard label="Selesai Hari Ini" value={String(completed.length)} icon={Check} />
          <SummaryCard label="Nominal Menunggu" value={formatRupiah(pendingTotal)} icon={Clock3} />
        </section>

        <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <div className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-card-foreground">Permintaan {type}</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Daftar transaksi terbaru yang masuk ke sistem.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative sm:w-64">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Cari nama atau ID..."
                  className="pl-9"
                />
              </div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Semua">Semua status</SelectItem>
                  <SelectItem value="Menunggu">Menunggu</SelectItem>
                  <SelectItem value="Berhasil">Berhasil</SelectItem>
                  <SelectItem value="Ditolak">Ditolak</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Table>
            <TableHeader className="bg-muted/60">
              <TableRow>
                <TableHead className="min-w-36 pl-4">ID & Waktu</TableHead>
                <TableHead className="min-w-44">Pengguna</TableHead>
                <TableHead className="min-w-44">{type === "Top Up" ? "Sumber Dana" : "Rekening Tujuan"}</TableHead>
                <TableHead className="min-w-36">Nominal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-4 text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="pl-4">
                    <p className="font-mono text-xs font-semibold text-foreground">{transaction.id}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{transaction.time}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold text-foreground">{transaction.name}</p>
                    <p className="text-xs text-muted-foreground">{transaction.account}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-foreground">{transaction.channel}</p>
                    <p className="text-xs text-muted-foreground">{transaction.destination}</p>
                  </TableCell>
                  <TableCell className="font-bold tabular-nums text-foreground">{formatRupiah(transaction.amount)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusStyle[transaction.status]}>
                      {transaction.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    {transaction.status === "Menunggu" ? (
                      <div className="flex justify-end gap-1.5">
                        <Button size="icon" variant="outline" aria-label={`Tolak ${transaction.id}`} title="Tolak">
                          <X />
                        </Button>
                        <Button size="icon" aria-label={`Setujui ${transaction.id}`} title="Setujui">
                          <Check />
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="ghost">Detail</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    Tidak ada transaksi yang sesuai.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
          <div className="border-t px-4 py-3 text-xs text-muted-foreground">
            Menampilkan {filtered.length} dari {transactions.length} transaksi
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string;
  icon: typeof WalletCards;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 truncate text-xl font-bold tabular-nums text-card-foreground">{value}</p>
        </div>
        <span className={`flex size-9 shrink-0 items-center justify-center rounded-md ${accent ? "bg-chart-4/20 text-foreground" : "bg-primary/10 text-primary"}`}>
          <Icon className="size-4" />
        </span>
      </div>
    </div>
  );
}