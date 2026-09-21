import { Pencil, Plus, Search, Trash2, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { saveSignals, useSignals, type TradingSignal } from "@/lib/signals-data";

import { AdminLayout } from "./AdminLayout";

const sources = ["Autochartist", "Trading Central"];
const timeframes = ["15 menit", "30 menit", "1 jam", "4 jam", "1 hari"];

type FormState = {
  name: string;
  flag: string;
  time: string;
  takeProfit: string;
  stopLoss: string;
  source: string;
  timeframe: string;
  variant: "buy" | "sell";
  showOnHome: boolean;
};

const emptyForm: FormState = {
  name: "",
  flag: "🪙",
  time: "09:00",
  takeProfit: "",
  stopLoss: "",
  source: "Autochartist",
  timeframe: "30 menit",
  variant: "buy",
  showOnHome: true,
};

export function SignalAdminPage() {
  const signals = useSignals();
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const filtered = useMemo(
    () => signals.filter((signal) => signal.name.toLowerCase().includes(query.toLowerCase())),
    [signals, query],
  );

  const onHome = signals.filter((signal) => signal.showOnHome).length;

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (signal: TradingSignal) => {
    setEditingId(signal.id);
    setForm({
      name: signal.name,
      flag: signal.flag,
      time: signal.time,
      takeProfit: signal.takeProfit,
      stopLoss: signal.stopLoss,
      source: signal.source,
      timeframe: signal.timeframe,
      variant: signal.variant,
      showOnHome: signal.showOnHome,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const action = form.variant === "buy" ? "Potensi Buy" : "Potensi Sell";
    if (editingId === null) {
      const id = Math.max(0, ...signals.map((signal) => signal.id)) + 1;
      saveSignals([{ id, action, ...form }, ...signals]);
      toast.success("Sinyal baru ditambahkan");
    } else {
      saveSignals(
        signals.map((signal) =>
          signal.id === editingId ? { ...signal, action, ...form } : signal,
        ),
      );
      toast.success("Sinyal berhasil diperbarui");
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    saveSignals(signals.filter((signal) => signal.id !== deletingId));
    toast.success("Sinyal dihapus");
    setDeletingId(null);
  };

  const toggleShowOnHome = (signal: TradingSignal, checked: boolean) => {
    saveSignals(
      signals.map((item) => (item.id === signal.id ? { ...item, showOnHome: checked } : item)),
    );
    toast.success(
      checked ? `${signal.name} tampil di beranda` : `${signal.name} disembunyikan dari beranda`,
    );
  };

  return (
    <AdminLayout title="Sinyal" subtitle="Kelola sinyal trading yang tampil di beranda pengguna">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">Total Sinyal</p>
            <p className="mt-2 text-xl font-bold tabular-nums text-card-foreground">
              {signals.length}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">Tampil di Beranda</p>
            <p className="mt-2 text-xl font-bold tabular-nums text-primary">{onHome}</p>
          </div>
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">Disembunyikan</p>
            <p className="mt-2 text-xl font-bold tabular-nums text-card-foreground">
              {signals.length - onHome}
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <div className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-card-foreground">Daftar Sinyal</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Tambah, ubah, hapus sinyal, dan atur mana yang tampil di komponen Signal Produk
                Terpopuler di beranda.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative sm:w-64">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Cari produk..."
                  className="pl-9"
                />
              </div>
              <Button onClick={openCreate}>
                <Plus />
                Tambah Sinyal
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader className="bg-muted/60">
              <TableRow>
                <TableHead className="min-w-40 pl-4">Produk</TableHead>
                <TableHead className="min-w-28">Arah</TableHead>
                <TableHead className="min-w-28">Take Profit</TableHead>
                <TableHead className="min-w-28">Stop Loss</TableHead>
                <TableHead className="min-w-36">Sumber</TableHead>
                <TableHead className="min-w-28">Timeframe</TableHead>
                <TableHead className="min-w-36">Di Beranda</TableHead>
                <TableHead className="pr-4 text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((signal) => (
                <TableRow key={signal.id}>
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl leading-none">{signal.flag}</span>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">{signal.name}</p>
                        <p className="text-xs text-muted-foreground">{signal.time}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        signal.variant === "buy"
                          ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600"
                          : "border-rose-500/25 bg-rose-500/10 text-rose-600"
                      }
                    >
                      {signal.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm tabular-nums text-foreground">
                    {signal.takeProfit}
                  </TableCell>
                  <TableCell className="text-sm tabular-nums text-foreground">
                    {signal.stopLoss}
                  </TableCell>
                  <TableCell className="text-sm text-foreground">{signal.source}</TableCell>
                  <TableCell className="text-sm text-foreground">{signal.timeframe}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={signal.showOnHome}
                        onCheckedChange={(checked) => toggleShowOnHome(signal, checked)}
                        aria-label={`Tampilkan ${signal.name} di beranda`}
                      />
                      <span className="text-xs text-muted-foreground">
                        {signal.showOnHome ? "Ya" : "Tidak"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        size="icon"
                        variant="outline"
                        aria-label={`Ubah ${signal.name}`}
                        title="Ubah"
                        onClick={() => openEdit(signal)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        aria-label={`Hapus ${signal.name}`}
                        title="Hapus"
                        onClick={() => setDeletingId(signal.id)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <TrendingUp className="size-6" />
                      Tidak ada sinyal yang sesuai.
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
          <div className="border-t px-4 py-3 text-xs text-muted-foreground">
            Menampilkan {filtered.length} dari {signals.length} sinyal
          </div>
        </section>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId === null ? "Tambah Sinyal" : "Ubah Sinyal"}</DialogTitle>
            <DialogDescription>Isi detail sinyal trading di bawah ini.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="signal-name">Nama Produk</Label>
                <Input
                  id="signal-name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Contoh: Gold, EURUSD"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signal-flag">Ikon / Bendera (Emoji)</Label>
                <Input
                  id="signal-flag"
                  value={form.flag}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, flag: event.target.value }))
                  }
                  placeholder="🪙"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="signal-time">Jam</Label>
                <Input
                  id="signal-time"
                  value={form.time}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, time: event.target.value }))
                  }
                  placeholder="03:06"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signal-tp">Take Profit</Label>
                <Input
                  id="signal-tp"
                  value={form.takeProfit}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, takeProfit: event.target.value }))
                  }
                  placeholder="4418.20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signal-sl">Stop Loss</Label>
                <Input
                  id="signal-sl"
                  value={form.stopLoss}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, stopLoss: event.target.value }))
                  }
                  placeholder="4342.80"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Sumber</Label>
                <Select
                  value={form.source}
                  onValueChange={(value) => setForm((current) => ({ ...current, source: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sources.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Timeframe</Label>
                <Select
                  value={form.timeframe}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, timeframe: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeframes.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Arah Sinyal</Label>
                <Select
                  value={form.variant}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, variant: value as "buy" | "sell" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">Potensi Buy</SelectItem>
                    <SelectItem value="sell">Potensi Sell</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">Tampilkan di Beranda</p>
                <p className="text-xs text-muted-foreground">
                  Sinyal muncul di komponen Signal Produk Terpopuler.
                </p>
              </div>
              <Switch
                checked={form.showOnHome}
                onCheckedChange={(checked) =>
                  setForm((current) => ({ ...current, showOnHome: checked }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={!form.name.trim()}>
              {editingId === null ? "Simpan Sinyal" : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus sinyal ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Sinyal yang dihapus tidak dapat dikembalikan dan akan hilang dari beranda pengguna.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
