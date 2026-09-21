import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CircleDollarSign,
  Dices,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AdminLayout } from "@/components/admin/AdminLayout";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { flagBySymbol, togglePopularInstrument, usePopularInstruments } from "@/lib/popular-market";
import { cn } from "@/lib/utils";

type MarketCategory = "Forex" | "Komoditi" | "Indeks" | "Kripto";
type SimulationDirection = "Naik" | "Turun" | "Acak";

type MarketInstrument = {
  id: number;
  symbol: string;
  name: string;
  category: MarketCategory;
  price: number;
  decimals: number;
  spread: number;
  direction: SimulationDirection;
  volatility: number;
  active: boolean;
  trend: number[];
};

const categories: MarketCategory[] = ["Forex", "Komoditi", "Indeks", "Kripto"];

const initialInstruments: MarketInstrument[] = [
  {
    id: 1,
    symbol: "EURUSD",
    name: "Euro / US Dollar",
    category: "Forex",
    price: 1.14832,
    decimals: 5,
    spread: 69,
    direction: "Naik",
    volatility: 35,
    active: true,
    trend: [25, 31, 28, 40, 37, 49, 55, 52, 66, 72],
  },
  {
    id: 2,
    symbol: "GBPUSD",
    name: "British Pound / US Dollar",
    category: "Forex",
    price: 1.33862,
    decimals: 5,
    spread: 79,
    direction: "Acak",
    volatility: 52,
    active: true,
    trend: [49, 43, 57, 45, 61, 52, 68, 55, 63, 59],
  },
  {
    id: 3,
    symbol: "USDJPY",
    name: "US Dollar / Japanese Yen",
    category: "Forex",
    price: 149.762,
    decimals: 3,
    spread: 92,
    direction: "Turun",
    volatility: 29,
    active: true,
    trend: [76, 71, 66, 70, 58, 53, 46, 49, 37, 31],
  },
  {
    id: 4,
    symbol: "XAUUSD",
    name: "Emas / US Dollar",
    category: "Komoditi",
    price: 4377.23,
    decimals: 2,
    spread: 45,
    direction: "Naik",
    volatility: 68,
    active: true,
    trend: [32, 36, 44, 39, 51, 57, 54, 65, 70, 82],
  },
  {
    id: 5,
    symbol: "OIL",
    name: "Crude Oil",
    category: "Komoditi",
    price: 99.51,
    decimals: 2,
    spread: 70,
    direction: "Turun",
    volatility: 44,
    active: false,
    trend: [72, 66, 69, 58, 62, 49, 43, 46, 35, 29],
  },
  {
    id: 6,
    symbol: "NASDAQ",
    name: "Nasdaq 100",
    category: "Indeks",
    price: 29954,
    decimals: 0,
    spread: 60,
    direction: "Acak",
    volatility: 48,
    active: true,
    trend: [44, 51, 47, 59, 54, 62, 57, 69, 63, 71],
  },
  {
    id: 8,
    symbol: "NIKKEI",
    name: "Nikkei 225",
    category: "Indeks",
    price: 64943,
    decimals: 0,
    spread: 55,
    direction: "Naik",
    volatility: 40,
    active: true,
    trend: [30, 35, 33, 42, 48, 45, 55, 60, 58, 68],
  },
  {
    id: 7,
    symbol: "BTCUSD",
    name: "Bitcoin / US Dollar",
    category: "Kripto",
    price: 112450.8,
    decimals: 2,
    spread: 125,
    direction: "Naik",
    volatility: 82,
    active: true,
    trend: [23, 29, 38, 34, 48, 56, 51, 67, 74, 88],
  },
];

type InstrumentForm = Omit<MarketInstrument, "id" | "trend">;

const emptyForm: InstrumentForm = {
  symbol: "",
  name: "",
  category: "Forex",
  price: 1,
  decimals: 5,
  spread: 50,
  direction: "Acak",
  volatility: 40,
  active: true,
};

function makeTrend(direction: SimulationDirection) {
  const values: number[] = [];
  let current = direction === "Turun" ? 78 : 30;
  for (let index = 0; index < 10; index += 1) {
    const delta = direction === "Naik" ? 5 : direction === "Turun" ? -5 : index % 2 === 0 ? 8 : -6;
    current = Math.max(14, Math.min(90, current + delta));
    values.push(current);
  }
  return values;
}

function formatPrice(instrument: MarketInstrument) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: instrument.decimals,
    maximumFractionDigits: instrument.decimals,
  }).format(instrument.price);
}

export function CurrencyAdminPage() {
  const [instruments, setInstruments] = useState<MarketInstrument[]>(initialInstruments);
  const popular = usePopularInstruments();
  const popularSymbols = useMemo(() => new Set(popular.map((item) => item.symbol)), [popular]);

  const setPopular = (instrument: MarketInstrument, checked: boolean) => {
    const changeValue = (instrument.volatility / 100).toFixed(2);
    togglePopularInstrument(
      {
        symbol: instrument.symbol,
        name: instrument.name.split("/")[0]?.trim() || instrument.symbol,
        flag: flagBySymbol[instrument.symbol] ?? "🌐",
        price: formatPrice(instrument),
        change: `${instrument.direction === "Turun" ? "-" : "+"}${changeValue}%`,
        up: instrument.direction !== "Turun",
      },
      checked,
    );
    toast.success(
      checked
        ? `${instrument.symbol} ditampilkan di beranda`
        : `${instrument.symbol} dihapus dari populer`,
    );
  };
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Semua");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form, setForm] = useState<InstrumentForm>(emptyForm);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return instruments.filter((instrument) => {
      const matchesQuery = `${instrument.symbol} ${instrument.name}`
        .toLowerCase()
        .includes(keyword);
      return matchesQuery && (category === "Semua" || instrument.category === category);
    });
  }, [category, instruments, query]);

  const activeCount = instruments.filter((instrument) => instrument.active).length;
  const upCount = instruments.filter((instrument) => instrument.direction === "Naik").length;
  const downCount = instruments.filter((instrument) => instrument.direction === "Turun").length;

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (instrument: MarketInstrument) => {
    setEditingId(instrument.id);
    setForm({
      symbol: instrument.symbol,
      name: instrument.name,
      category: instrument.category,
      price: instrument.price,
      decimals: instrument.decimals,
      spread: instrument.spread,
      direction: instrument.direction,
      volatility: instrument.volatility,
      active: instrument.active,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const normalized = {
      ...form,
      symbol: form.symbol.trim().toUpperCase(),
      name: form.name.trim(),
    };
    if (editingId === null) {
      setInstruments((current) => [
        {
          ...normalized,
          id: Math.max(0, ...current.map((item) => item.id)) + 1,
          trend: makeTrend(form.direction),
        },
        ...current,
      ]);
      toast.success("Mata uang berhasil ditambahkan");
    } else {
      setInstruments((current) =>
        current.map((item) =>
          item.id === editingId
            ? {
                ...item,
                ...normalized,
                trend: item.direction === form.direction ? item.trend : makeTrend(form.direction),
              }
            : item,
        ),
      );
      toast.success("Mata uang berhasil diperbarui");
    }
    setDialogOpen(false);
  };

  const setDirection = (id: number, direction: SimulationDirection) => {
    setInstruments((current) =>
      current.map((item) =>
        item.id === id ? { ...item, direction, trend: makeTrend(direction) } : item,
      ),
    );
    toast.success(`Simulasi diatur ke ${direction.toLowerCase()}`);
  };

  const toggleActive = (id: number, active: boolean) => {
    setInstruments((current) =>
      current.map((item) => (item.id === id ? { ...item, active } : item)),
    );
  };

  const handleDelete = () => {
    setInstruments((current) => current.filter((item) => item.id !== deletingId));
    setDeletingId(null);
    toast.success("Mata uang dihapus");
  };

  return (
    <AdminLayout
      title="Mata Uang"
      subtitle="Kelola produk pasar dan arah pergerakan harga simulasi"
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Total Instrumen" value={instruments.length} icon={CircleDollarSign} />
          <SummaryCard label="Aktif di Pasar" value={activeCount} icon={Activity} />
          <SummaryCard label="Simulasi Naik" value={upCount} icon={ArrowUpRight} tone="up" />
          <SummaryCard label="Simulasi Turun" value={downCount} icon={ArrowDownRight} tone="down" />
        </section>

        <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <div className="flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-bold text-card-foreground">Daftar Mata Uang</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Atur kategori, harga, dan pola pergerakan setiap produk.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative sm:w-60">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Cari simbol atau nama..."
                  className="pl-9"
                />
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="sm:w-40">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Semua">Semua kategori</SelectItem>
                  {categories.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={openCreate}>
                <Plus />
                Tambah
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/60">
                <TableRow>
                  <TableHead className="min-w-52 pl-4">Instrumen</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="min-w-32">Harga Awal</TableHead>
                  <TableHead className="min-w-32">Pratinjau Tren</TableHead>
                  <TableHead className="min-w-44">Arah Simulasi</TableHead>
                  <TableHead>Populer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-4 text-right">Tindakan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((instrument) => (
                  <TableRow key={instrument.id}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-extrabold text-primary">
                          {instrument.symbol.slice(0, 2)}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-foreground">{instrument.symbol}</p>
                          <p className="max-w-40 truncate text-xs text-muted-foreground">
                            {instrument.name}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{instrument.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <p className="font-mono text-sm font-semibold tabular-nums">
                        {formatPrice(instrument)}
                      </p>
                      <p className="text-xs text-muted-foreground">Spread {instrument.spread}</p>
                    </TableCell>
                    <TableCell>
                      <div
                        className="flex h-9 w-28 items-end gap-1"
                        aria-label={`Tren ${instrument.direction.toLowerCase()}`}
                      >
                        {instrument.trend.map((height, index) => (
                          <span
                            key={`${instrument.id}-${index}`}
                            className={cn(
                              "w-2 rounded-sm",
                              instrument.direction === "Naik" && "bg-primary/70",
                              instrument.direction === "Turun" && "bg-destructive/70",
                              instrument.direction === "Acak" && "bg-chart-4/80",
                            )}
                            style={{ height: `${height}%` }}
                          />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant={instrument.direction === "Naik" ? "default" : "outline"}
                          aria-label={`Atur ${instrument.symbol} naik`}
                          title="Naik"
                          onClick={() => setDirection(instrument.id, "Naik")}
                        >
                          <ArrowUpRight />
                        </Button>
                        <Button
                          size="icon"
                          variant={instrument.direction === "Turun" ? "destructive" : "outline"}
                          aria-label={`Atur ${instrument.symbol} turun`}
                          title="Turun"
                          onClick={() => setDirection(instrument.id, "Turun")}
                        >
                          <ArrowDownRight />
                        </Button>
                        <Button
                          size="icon"
                          variant={instrument.direction === "Acak" ? "secondary" : "outline"}
                          aria-label={`Atur ${instrument.symbol} acak`}
                          title="Acak"
                          onClick={() => setDirection(instrument.id, "Acak")}
                        >
                          <Dices />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={popularSymbols.has(instrument.symbol)}
                          onCheckedChange={(checked) => setPopular(instrument, checked)}
                          aria-label={`Populer ${instrument.symbol}`}
                        />
                        <span className="text-xs text-muted-foreground">
                          {popularSymbols.has(instrument.symbol) ? "Di beranda" : "Tidak"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={instrument.active}
                          onCheckedChange={(checked) => toggleActive(instrument.id, checked)}
                          aria-label={`Status ${instrument.symbol}`}
                        />
                        <span className="text-xs text-muted-foreground">
                          {instrument.active ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          size="icon"
                          variant="outline"
                          aria-label={`Ubah ${instrument.symbol}`}
                          title="Ubah"
                          onClick={() => openEdit(instrument)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          aria-label={`Hapus ${instrument.symbol}`}
                          title="Hapus"
                          onClick={() => setDeletingId(instrument.id)}
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
                      Tidak ada instrumen yang sesuai.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
          <div className="border-t px-4 py-3 text-xs text-muted-foreground">
            Menampilkan {filtered.length} dari {instruments.length} instrumen
          </div>
        </section>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId === null ? "Tambah Mata Uang" : "Ubah Mata Uang"}</DialogTitle>
            <DialogDescription>
              Atur informasi produk dan perilaku harga simulasinya.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="instrument-symbol">Simbol</Label>
                <Input
                  id="instrument-symbol"
                  value={form.symbol}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, symbol: event.target.value }))
                  }
                  placeholder="Contoh: EURUSD"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instrument-name">Nama</Label>
                <Input
                  id="instrument-name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Euro / US Dollar"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Kategori Pasar</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, category: value as MarketCategory }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Arah Simulasi</Label>
                <Select
                  value={form.direction}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, direction: value as SimulationDirection }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Naik">Naik</SelectItem>
                    <SelectItem value="Turun">Turun</SelectItem>
                    <SelectItem value="Acak">Acak</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="instrument-price">Harga Awal</Label>
                <Input
                  id="instrument-price"
                  type="number"
                  min="0"
                  step="any"
                  value={form.price}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, price: Number(event.target.value) }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instrument-decimals">Desimal</Label>
                <Input
                  id="instrument-decimals"
                  type="number"
                  min="0"
                  max="8"
                  value={form.decimals}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, decimals: Number(event.target.value) }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instrument-spread">Spread</Label>
                <Input
                  id="instrument-spread"
                  type="number"
                  min="0"
                  value={form.spread}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, spread: Number(event.target.value) }))
                  }
                />
              </div>
            </div>
            <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label>Tingkat Pergerakan</Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Menentukan seberapa cepat harga simulasi berubah.
                  </p>
                </div>
                <span className="text-sm font-bold tabular-nums">{form.volatility}%</span>
              </div>
              <Slider
                value={[form.volatility]}
                min={1}
                max={100}
                step={1}
                onValueChange={(values) =>
                  setForm((current) => ({
                    ...current,
                    volatility: values[0] ?? current.volatility,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="instrument-active">Tampilkan di pasar</Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Produk aktif akan tersedia pada daftar pasar.
                </p>
              </div>
              <Switch
                id="instrument-active"
                checked={form.active}
                onCheckedChange={(checked) =>
                  setForm((current) => ({ ...current, active: checked }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.symbol.trim() || !form.name.trim() || form.price <= 0}
            >
              {editingId === null ? "Simpan Mata Uang" : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus mata uang ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Produk akan hilang dari daftar simulasi admin.
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

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: number;
  icon: typeof Activity;
  tone?: "default" | "up" | "down";
}) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-xl font-bold tabular-nums text-card-foreground">{value}</p>
        </div>
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-md",
            tone === "down"
              ? "bg-destructive/10 text-destructive"
              : tone === "up"
                ? "bg-primary/10 text-primary"
                : "bg-secondary text-secondary-foreground",
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>
    </div>
  );
}
