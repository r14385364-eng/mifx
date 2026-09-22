import {
  Check,
  Clock3,
  ExternalLink,
  Eye,
  FileQuestion,
  Image as ImageIcon,
  RefreshCw,
  Search,
  WalletCards,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { secureFetch } from "@/lib/api-client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
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
  proofImage?: string | null;
};

const statusStyle = {
  Menunggu: "border-chart-4/30 bg-chart-4/15 text-foreground",
  Berhasil: "border-primary/25 bg-primary/10 text-primary",
  Ditolak: "border-destructive/25 bg-destructive/10 text-destructive",
};

const formatRupiah = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);

export function TransactionPage({
  type,
  transactions: initialTransactions = [],
}: {
  type: "Top Up" | "Withdraw";
  transactions?: Transaction[];
}) {
  const [items, setItems] = useState<Transaction[]>(initialTransactions);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Semua");
  const [selectedProofTx, setSelectedProofTx] = useState<Transaction | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await secureFetch("/api/transactions");
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.transactions)) {
        type RawTx = {
          id: string;
          user_name: string;
          account_number: string;
          type: string;
          channel: string;
          destination: string;
          amount: number | string;
          created_at: string;
          status: "Menunggu" | "Berhasil" | "Ditolak";
          proof_image?: string | null;
        };
        const mapped: Transaction[] = (data.transactions as RawTx[])
          .filter((t) => t.type === type)
          .map((t) => ({
            id: t.id,
            name: t.user_name || "Trader Gotrade",
            account: t.account_number || "88910243",
            channel: t.channel || "-",
            destination: t.destination || "-",
            amount: Number(t.amount),
            time: t.created_at ? new Date(t.created_at).toLocaleString("id-ID") : "Baru saja",
            status: t.status,
            proofImage: t.proof_image || null,
          }));

        if (mapped.length > 0 || initialTransactions.length === 0) {
          setItems(mapped);
        }
      }
    } catch {
      // Keep existing items if offline
    } finally {
      setLoading(false);
    }
  }, [type, initialTransactions.length]);

  useEffect(() => {
    void fetchTransactions();
  }, [fetchTransactions]);

  const handleUpdateStatus = async (id: string, newStatus: "Berhasil" | "Ditolak") => {
    try {
      const res = await secureFetch("/api/transactions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Transaksi ${id} ${newStatus === "Berhasil" ? "disetujui" : "ditolak"}`);
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item)),
        );
      } else {
        toast.error("Gagal mengubah status transaksi");
      }
    } catch {
      toast.error("Gagal terhubung ke database");
    }
  };

  const filtered = useMemo(
    () =>
      items.filter((transaction) => {
        const matchesQuery = `${transaction.name} ${transaction.account} ${transaction.id}`
          .toLowerCase()
          .includes(query.toLowerCase());
        return matchesQuery && (status === "Semua" || transaction.status === status);
      }),
    [query, status, items],
  );

  const pending = items.filter((transaction) => transaction.status === "Menunggu");
  const completed = items.filter((transaction) => transaction.status === "Berhasil");
  const pendingTotal = pending.reduce((total, transaction) => total + transaction.amount, 0);

  return (
    <AdminLayout title={type} subtitle={`Kelola permintaan ${type.toLowerCase()} pengguna`}>
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Total Permintaan" value={String(items.length)} icon={WalletCards} />
          <SummaryCard label="Perlu Diproses" value={String(pending.length)} icon={Clock3} accent />
          <SummaryCard label="Selesai Hari Ini" value={String(completed.length)} icon={Check} />
          <SummaryCard label="Nominal Menunggu" value={formatRupiah(pendingTotal)} icon={Clock3} />
        </section>

        <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <div className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="font-bold text-card-foreground">Permintaan {type}</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Daftar transaksi database PostgreSQL terbaru.
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={fetchTransactions}
                disabled={loading}
                title="Muat Ulang Transaksi"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
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
                <TableHead className="min-w-44">
                  {type === "Top Up" ? "Sumber Dana" : "Rekening Tujuan"}
                </TableHead>
                <TableHead className="min-w-36">Nominal</TableHead>
                {type === "Top Up" && <TableHead className="min-w-36">Bukti Transfer</TableHead>}
                <TableHead>Status</TableHead>
                <TableHead className="pr-4 text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="pl-4">
                    <p className="font-mono text-xs font-semibold text-foreground">
                      {transaction.id}
                    </p>
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
                  <TableCell className="font-bold tabular-nums text-foreground">
                    {formatRupiah(transaction.amount)}
                  </TableCell>
                  {type === "Top Up" && (
                    <TableCell>
                      {transaction.proofImage ? (
                        <button
                          type="button"
                          onClick={() => setSelectedProofTx(transaction)}
                          className="group flex items-center gap-2 rounded-lg border border-border/80 bg-background/80 p-1.5 transition-all hover:border-primary/50 hover:bg-muted/60"
                          title="Klik untuk melihat bukti transfer"
                        >
                          <img
                            src={transaction.proofImage}
                            alt={`Bukti ${transaction.id}`}
                            className="h-9 w-9 rounded-md border object-cover"
                          />
                          <div className="text-left">
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-foreground group-hover:text-primary">
                              <Eye className="h-3 w-3 text-primary" />
                              Lihat Resi
                            </span>
                            <span className="text-[10px] text-muted-foreground">Klik perbesar</span>
                          </div>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs italic text-muted-foreground">
                          <FileQuestion className="h-3.5 w-3.5 text-muted-foreground/60" />
                          Tanpa resi
                        </span>
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge variant="outline" className={statusStyle[transaction.status]}>
                      {transaction.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    {transaction.status === "Menunggu" ? (
                      <div className="flex justify-end gap-1.5">
                        <Button
                          size="icon"
                          variant="outline"
                          aria-label={`Tolak ${transaction.id}`}
                          title="Tolak"
                          onClick={() => handleUpdateStatus(transaction.id, "Ditolak")}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          aria-label={`Setujui ${transaction.id}`}
                          title="Setujui"
                          onClick={() => handleUpdateStatus(transaction.id, "Berhasil")}
                          className="text-primary hover:bg-primary/10"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground">Selesai</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={type === "Top Up" ? 7 : 6}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Tidak ada transaksi {type.toLowerCase()} yang ditemukan.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
          <div className="border-t px-4 py-3 text-xs text-muted-foreground">
            Menampilkan {filtered.length} dari {items.length} transaksi
          </div>
        </section>
      </div>

      {/* Dialog Pratinjau Bukti Transfer untuk Admin */}
      <Dialog
        open={Boolean(selectedProofTx)}
        onOpenChange={(open) => {
          if (!open) setSelectedProofTx(null);
        }}
      >
        <DialogContent className="max-w-2xl overflow-hidden p-0 sm:max-w-2xl">
          {selectedProofTx && (
            <div className="flex flex-col">
              <div className="border-b px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-base font-bold text-foreground">
                        Bukti Transfer Deposit
                      </DialogTitle>
                      <DialogDescription className="text-xs text-muted-foreground">
                        ID:{" "}
                        <span className="font-mono font-semibold text-foreground">
                          {selectedProofTx.id}
                        </span>{" "}
                        • {selectedProofTx.time}
                      </DialogDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className={statusStyle[selectedProofTx.status]}>
                    {selectedProofTx.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4 px-6 py-4">
                {/* Info Pengguna & Nominal */}
                <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3 text-xs sm:grid-cols-4">
                  <div>
                    <span className="text-muted-foreground">Pengguna</span>
                    <p className="font-semibold text-foreground">{selectedProofTx.name}</p>
                    <p className="text-[11px] text-muted-foreground">{selectedProofTx.account}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Metode Bayar</span>
                    <p className="font-semibold text-foreground">{selectedProofTx.channel}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {selectedProofTx.destination}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nominal (IDR)</span>
                    <p className="font-bold text-foreground">
                      {formatRupiah(selectedProofTx.amount)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nominal (USD)</span>
                    <p className="font-bold text-primary">
                      $
                      {(selectedProofTx.amount / 16000).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      USD
                    </p>
                  </div>
                </div>

                {/* Tampilan Gambar Resi */}
                <div className="relative flex max-h-[55vh] items-center justify-center overflow-auto rounded-xl border bg-black/5 p-2 dark:bg-black/50">
                  {selectedProofTx.proofImage ? (
                    <img
                      src={selectedProofTx.proofImage}
                      alt={`Bukti Transfer ${selectedProofTx.id}`}
                      className="max-h-[50vh] w-auto max-w-full rounded object-contain shadow-xs"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <FileQuestion className="h-10 w-10 text-muted-foreground/50" />
                      <p className="mt-2 text-xs">
                        Pengguna tidak melampirkan file gambar bukti transfer.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Tindakan */}
              <div className="flex flex-col-reverse gap-2 border-t bg-muted/20 px-6 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  {selectedProofTx.proofImage && (
                    <a
                      href={selectedProofTx.proofImage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Buka Gambar di Tab Baru
                    </a>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedProofTx(null)}>
                    Tutup
                  </Button>

                  {selectedProofTx.status === "Menunggu" && (
                    <>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          await handleUpdateStatus(selectedProofTx.id, "Ditolak");
                          setSelectedProofTx((prev) =>
                            prev ? { ...prev, status: "Ditolak" } : null,
                          );
                        }}
                      >
                        <X className="mr-1 h-3.5 w-3.5" />
                        Tolak Transaksi
                      </Button>
                      <Button
                        size="sm"
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={async () => {
                          await handleUpdateStatus(selectedProofTx.id, "Berhasil");
                          setSelectedProofTx((prev) =>
                            prev ? { ...prev, status: "Berhasil" } : null,
                          );
                        }}
                      >
                        <Check className="mr-1 h-3.5 w-3.5" />
                        Setujui Deposit
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
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
          <p className="mt-2 truncate text-xl font-bold tabular-nums text-card-foreground">
            {value}
          </p>
        </div>
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-md ${accent ? "bg-chart-4/20 text-foreground" : "bg-primary/10 text-primary"}`}
        >
          <Icon className="size-4" />
        </span>
      </div>
    </div>
  );
}
