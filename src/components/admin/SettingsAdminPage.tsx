import {
  Check,
  CreditCard,
  Copy,
  Edit2,
  Eye,
  Info,
  Landmark,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  Smartphone,
  Trash2,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export interface PaymentSourceItem {
  id: string;
  label: string;
  category: "Bank" | "E-Wallet";
  active: boolean;
}

const defaultPaymentSources: PaymentSourceItem[] = [
  { id: "bca", label: "Bank BCA", category: "Bank", active: true },
  { id: "mandiri", label: "Bank Mandiri", category: "Bank", active: true },
  { id: "bri", label: "Bank BRI", category: "Bank", active: true },
  { id: "bni", label: "Bank BNI", category: "Bank", active: true },
  { id: "cimb", label: "Bank CIMB Niaga", category: "Bank", active: true },
  { id: "permata", label: "Bank Permata", category: "Bank", active: true },
  { id: "gopay", label: "GoPay", category: "E-Wallet", active: true },
  { id: "ovo", label: "OVO", category: "E-Wallet", active: true },
  { id: "dana", label: "DANA", category: "E-Wallet", active: true },
  { id: "shopeepay", label: "ShopeePay", category: "E-Wallet", active: true },
];

export function SettingsAdminPage() {
  const [bankName, setBankName] = useState<string>("Keb Hana Bank");
  const [accountNumber, setAccountNumber] = useState<string>("11628950560");
  const [accountName, setAccountName] = useState<string>("AKSAY S.PUTRA");
  const [initialProfitPct, setInitialProfitPct] = useState<string>("10");
  const [paymentSources, setPaymentSources] = useState<PaymentSourceItem[]>(defaultPaymentSources);

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Search & Filter state for payment sources CRUD
  const [sourceSearch, setSourceSearch] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "Bank" | "E-Wallet">("ALL");

  // Modal State for Add / Edit Source
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<PaymentSourceItem | null>(null);
  const [formLabel, setFormLabel] = useState<string>("");
  const [formCategory, setFormCategory] = useState<"Bank" | "E-Wallet">("Bank");
  const [formActive, setFormActive] = useState<boolean>(true);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const res = await secureFetch("/api/settings");
        const data = await res.json();
        if (res.ok && data.success && data.settings) {
          if (data.settings.deposit_bank_name) setBankName(data.settings.deposit_bank_name);
          if (data.settings.deposit_account_number)
            setAccountNumber(data.settings.deposit_account_number);
          if (data.settings.deposit_account_name)
            setAccountName(data.settings.deposit_account_name);
          if (data.settings.initial_profit_percentage)
            setInitialProfitPct(data.settings.initial_profit_percentage);
          if (data.settings.deposit_payment_sources) {
            try {
              const parsed = JSON.parse(data.settings.deposit_payment_sources);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setPaymentSources(parsed);
              }
            } catch {
              // fallback to defaults
            }
          }
        }
      } catch {
        // use default state
      } finally {
        setLoading(false);
      }
    }
    void loadSettings();
  }, []);

  const persistSettings = async (
    customSources?: PaymentSourceItem[],
    customBankName?: string,
    customAccountNum?: string,
    customAccountName?: string,
  ) => {
    const bName = (customBankName ?? bankName).trim();
    const aNum = (customAccountNum ?? accountNumber).trim();
    const aName = (customAccountName ?? accountName).trim();
    const sourcesToSave = customSources ?? paymentSources;

    if (!bName || !aNum || !aName) {
      toast.error("Mohon lengkapi seluruh data nama bank, nomor rekening, dan atas nama.");
      return false;
    }

    setSaving(true);
    try {
      const payload = {
        deposit_bank_name: bName,
        deposit_account_number: aNum,
        deposit_account_name: aName,
        initial_profit_percentage: initialProfitPct,
        deposit_payment_sources: JSON.stringify(sourcesToSave),
      };

      const res = await secureFetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        return true;
      } else {
        toast.error("Gagal menyimpan pengaturan.");
        return false;
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan saat menyimpan.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    const success = await persistSettings();
    if (success) {
      toast.success("Pengaturan berhasil disimpan ke Database!", {
        description:
          "Rekening tujuan & pilihan sumber dana telah ter-update di halaman deposit trader.",
      });
    }
  };

  // Payment Sources CRUD Handlers
  const openAddModal = () => {
    setEditingItem(null);
    setFormLabel("");
    setFormCategory("Bank");
    setFormActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (item: PaymentSourceItem) => {
    setEditingItem(item);
    setFormLabel(item.label);
    setFormCategory(item.category);
    setFormActive(item.active !== false);
    setIsModalOpen(true);
  };

  const handleSaveSourceModal = async () => {
    if (!formLabel.trim()) {
      toast.error("Nama sumber dana wajib diisi.");
      return;
    }

    let updatedSources: PaymentSourceItem[];
    if (editingItem) {
      // Update
      updatedSources = paymentSources.map((item) =>
        item.id === editingItem.id
          ? { ...item, label: formLabel.trim(), category: formCategory, active: formActive }
          : item,
      );
      toast.success(`"${formLabel.trim()}" berhasil diperbarui`);
    } else {
      // Create
      const generatedId =
        formLabel
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
          .slice(0, 15) + `_${Date.now().toString().slice(-4)}`;
      const newItem: PaymentSourceItem = {
        id: generatedId,
        label: formLabel.trim(),
        category: formCategory,
        active: formActive,
      };
      updatedSources = [...paymentSources, newItem];
      toast.success(`"${formLabel.trim()}" berhasil ditambahkan`);
    }

    setPaymentSources(updatedSources);
    setIsModalOpen(false);
    void persistSettings(updatedSources);
  };

  const handleDeleteSource = (item: PaymentSourceItem) => {
    const updated = paymentSources.filter((s) => s.id !== item.id);
    setPaymentSources(updated);
    toast.success(`"${item.label}" telah dihapus.`);
    void persistSettings(updated);
  };

  const handleToggleSourceActive = (item: PaymentSourceItem) => {
    const updated = paymentSources.map((s) => (s.id === item.id ? { ...s, active: !s.active } : s));
    setPaymentSources(updated);
    toast.info(`Status "${item.label}" diubah menjadi ${!item.active ? "Aktif" : "Nonaktif"}.`);
    void persistSettings(updated);
  };

  const handleResetSourcesDefault = async () => {
    if (
      confirm("Kembalikan daftar sumber dana ke pilihan bank & e-wallet standar default Gotrade?")
    ) {
      setPaymentSources(defaultPaymentSources);
      await persistSettings(defaultPaymentSources);
      toast.success("Daftar sumber dana telah di-reset ke standar default.");
    }
  };

  const handleCopyPreview = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(accountNumber).catch(() => {});
    }
    setCopied(true);
    toast.success("Nomor rekening berhasil disalin!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Filtered payment sources for table
  const filteredSources = paymentSources.filter((s) => {
    const matchesCategory = categoryFilter === "ALL" || s.category === categoryFilter;
    const matchesSearch = s.label.toLowerCase().includes(sourceSearch.toLowerCase().trim());
    return matchesCategory && matchesSearch;
  });

  const activeBanks = paymentSources.filter((s) => s.category === "Bank" && s.active !== false);
  const activeEWallets = paymentSources.filter(
    (s) => s.category === "E-Wallet" && s.active !== false,
  );

  return (
    <AdminLayout
      title="Pengaturan Sistem"
      subtitle="Kelola rekening bank tujuan deposit, sumber dana, dan konfigurasi platform"
    >
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header Action Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
              <Landmark className="mr-1.5 h-3.5 w-3.5" /> Konfigurasi Rekening & Deposit
            </Badge>
          </div>
          <Button
            onClick={handleSaveAll}
            disabled={saving || loading}
            className="flex items-center gap-2 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Simpan Pengaturan
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Main Controls (7 cols) */}
          <div className="space-y-6 lg:col-span-7">
            {/* Rekening Tujuan Deposit Gotrade */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Rekening Bank Tujuan Deposit Gotrade
                </CardTitle>
                <CardDescription>
                  Atur nomor rekening, nama bank, dan atas nama resmi yang ditampilkan pada halaman
                  /deposit untuk menerima transfer dana dari trader.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Nama Bank */}
                <div className="space-y-1.5">
                  <Label htmlFor="bank-name" className="text-xs font-semibold">
                    Nama Bank Tujuan
                  </Label>
                  <Input
                    id="bank-name"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Contoh: Keb Hana Bank"
                    className="font-medium"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Nama bank yang akan ditampilkan pada kartu rekening trader.
                  </p>
                </div>

                {/* Nomor Rekening */}
                <div className="space-y-1.5">
                  <Label htmlFor="account-number" className="text-xs font-semibold">
                    Nomor Rekening
                  </Label>
                  <Input
                    id="account-number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Contoh: 11628950560"
                    className="font-mono font-bold tracking-wider"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Nomor rekening yang dapat disalin satu klik oleh trader.
                  </p>
                </div>

                {/* Atas Nama Rekening */}
                <div className="space-y-1.5">
                  <Label htmlFor="account-name" className="text-xs font-semibold">
                    Atas Nama Rekening
                  </Label>
                  <Input
                    id="account-name"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Contoh: AKSAY S.PUTRA"
                    className="font-semibold"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Nama pemilik rekening resmi tujuan transfer (Contoh: AKSAY S.PUTRA).
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* CRUD Rekening / E-Wallet Sumber Dana */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                      <Wallet className="h-5 w-5 text-primary" />
                      Kelola Rekening / E-Wallet Sumber Dana (CRUD)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Tambah, ubah, aktifkan, atau hapus pilihan bank & e-wallet yang dapat dipilih
                      trader saat deposit.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleResetSourcesDefault}
                      title="Reset ke pilihan default standar"
                      className="h-8 text-xs text-muted-foreground"
                    >
                      <RotateCcw className="mr-1 h-3 w-3" /> Reset
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={openAddModal}
                      className="h-8 gap-1 text-xs bg-primary text-primary-foreground"
                    >
                      <Plus className="h-3.5 w-3.5" /> Tambah Sumber Dana
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Search & Filter bar */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={sourceSearch}
                      onChange={(e) => setSourceSearch(e.target.value)}
                      placeholder="Cari bank atau e-wallet..."
                      className="h-8 pl-8 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-0.5">
                    <button
                      type="button"
                      onClick={() => setCategoryFilter("ALL")}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        categoryFilter === "ALL"
                          ? "bg-background text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Semua ({paymentSources.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategoryFilter("Bank")}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        categoryFilter === "Bank"
                          ? "bg-background text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Bank ({paymentSources.filter((p) => p.category === "Bank").length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategoryFilter("E-Wallet")}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        categoryFilter === "E-Wallet"
                          ? "bg-background text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      E-Wallet ({paymentSources.filter((p) => p.category === "E-Wallet").length})
                    </button>
                  </div>
                </div>

                {/* List Table */}
                <div className="max-h-80 overflow-y-auto rounded-lg border divide-y">
                  {filteredSources.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      Tidak ada rekening atau e-wallet yang cocok.
                    </div>
                  ) : (
                    filteredSources.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-2.5 text-xs transition-colors hover:bg-muted/30 ${
                          !item.active ? "opacity-60 bg-muted/10" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-md ${
                              item.category === "Bank"
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            {item.category === "Bank" ? (
                              <Landmark className="h-3.5 w-3.5" />
                            ) : (
                              <Smartphone className="h-3.5 w-3.5" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{item.label}</p>
                            <span
                              className={`inline-block text-[10px] font-medium ${
                                item.category === "Bank"
                                  ? "text-blue-600 dark:text-blue-400"
                                  : "text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              {item.category}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Toggle Switch */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-muted-foreground">
                              {item.active !== false ? "Aktif" : "Nonaktif"}
                            </span>
                            <Switch
                              checked={item.active !== false}
                              onCheckedChange={() => handleToggleSourceActive(item)}
                              className="scale-75"
                            />
                          </div>

                          {/* Edit Button */}
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => openEditModal(item)}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="Edit sumber dana"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>

                          {/* Delete Button */}
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteSource(item)}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            title="Hapus sumber dana"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <p className="text-[11px] text-muted-foreground">
                  Hanya sumber dana berstatus <strong>Aktif</strong> yang akan muncul di dropdown
                  pengguna pada saat mengajukan deposit.
                </p>
              </CardContent>
            </Card>

            {/* Profit Mechanism Settings Card */}
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    %
                  </span>
                  Pengaturan Persentase Profit Trading
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Atur persentase profit awal yang diberikan otomatis saat deposit trader disetujui.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="initial-profit-pct" className="text-xs font-semibold">
                    Persentase Profit Awal saat Deposit Disetujui (%)
                  </Label>
                  <div className="relative flex items-center">
                    <Input
                      id="initial-profit-pct"
                      type="number"
                      step="any"
                      min="0"
                      max="100"
                      value={initialProfitPct}
                      onChange={(e) => setInitialProfitPct(e.target.value)}
                      placeholder="Contoh: 10"
                      className="font-bold"
                    />
                    <span className="absolute right-3 text-xs font-bold text-muted-foreground">
                      %
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Contoh: Jika diset <strong className="text-foreground">10%</strong>, saat user
                    deposit Rp 10 Juta dan disetujui admin, user otomatis mendapat nominal basis
                    profit{" "}
                    <strong className="text-amber-600 dark:text-amber-400">Rp 1.000.000</strong>.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Mobile Preview (5 cols) */}
          <div className="space-y-6 lg:col-span-5">
            <Card className="border-primary/20 bg-muted/10">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <Eye className="h-4 w-4 text-primary" /> Live Preview Trader
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px]">
                    Tampilan /deposit
                  </Badge>
                </div>
                <CardDescription>
                  Pratinjau tampilan kartu rekening & pilihan sumber dana yang dilihat pengguna saat
                  deposit.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="mx-auto max-w-xs space-y-3 rounded-2xl border bg-card p-4 shadow-sm">
                  {/* Preview Kartu Rekening Tujuan */}
                  <div className="rounded-xl border border-border bg-card p-3.5 shadow-xs">
                    <div className="flex items-center justify-between border-b pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Landmark className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">Rekening Tujuan</p>
                          <p className="text-[10px] text-muted-foreground">Transfer Bank</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-600">
                        Resmi
                      </span>
                    </div>

                    <div className="mt-3 space-y-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground">Nama Bank</p>
                        <p className="mt-0.5 text-sm font-extrabold tracking-wide text-foreground">
                          {bankName || "Keb Hana Bank"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground">
                          Nomor Rekening
                        </p>
                        <div className="mt-1 flex items-center justify-between gap-1.5 rounded-md border bg-background px-2.5 py-1.5">
                          <span className="font-mono text-xs font-extrabold tracking-wider text-foreground">
                            {accountNumber || "11628950560"}
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyPreview}
                            className="inline-flex items-center gap-1 rounded bg-primary px-2 py-1 text-[10px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                          >
                            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            {copied ? "Tersalin" : "Salin"}
                          </button>
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground">Atas Nama</p>
                        <p className="mt-0.5 text-xs font-bold text-foreground">
                          {accountName || "AKSAY S.PUTRA"}
                        </p>
                      </div>
                    </div>

                    <p className="mt-2.5 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                      <ShieldCheck className="h-3 w-3 text-emerald-600" />
                      Transfer dana hanya ke rekening resmi di atas
                    </p>
                  </div>

                  {/* Preview Pilihan Sumber Dana */}
                  <div className="rounded-xl border border-border bg-background p-3">
                    <p className="text-[11px] font-semibold text-foreground">
                      Sumber Dana Tersedia ({activeBanks.length + activeEWallets.length}):
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {activeBanks.slice(0, 4).map((b) => (
                        <span
                          key={b.id}
                          className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-medium text-blue-600"
                        >
                          {b.label}
                        </span>
                      ))}
                      {activeEWallets.slice(0, 4).map((e) => (
                        <span
                          key={e.id}
                          className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-600"
                        >
                          {e.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Helper */}
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Info className="h-4 w-4" />
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p className="font-semibold text-foreground">Panduan Rekening & Sumber Dana</p>
                    <p>
                      Rekening tujuan adalah tempat trader mentransfer dana deposit. Sedangkan
                      sumber dana adalah daftar rekening / e-wallet asal milik trader yang dapat
                      dipilih saat mengajukan deposit.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal Dialog for Add / Edit Source */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Rekening / E-Wallet" : "Tambah Rekening / E-Wallet Baru"}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Perbarui nama, kategori, atau status aktif sumber dana ini."
                : "Tambahkan pilihan bank atau e-wallet baru yang dapat dipilih trader saat deposit."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="source-label" className="text-xs font-semibold">
                Nama Bank / E-Wallet
              </Label>
              <Input
                id="source-label"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                placeholder="Contoh: Bank Jago, SeaBank, LinkAja"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Kategori</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormCategory("Bank")}
                  className={`flex items-center justify-center gap-2 rounded-lg border p-2.5 text-xs font-semibold transition-all ${
                    formCategory === "Bank"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  <Landmark className="h-4 w-4" /> Bank
                </button>
                <button
                  type="button"
                  onClick={() => setFormCategory("E-Wallet")}
                  className={`flex items-center justify-center gap-2 rounded-lg border p-2.5 text-xs font-semibold transition-all ${
                    formCategory === "E-Wallet"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  <Smartphone className="h-4 w-4" /> E-Wallet
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-xs font-semibold text-foreground">Status Aktif</p>
                <p className="text-[11px] text-muted-foreground">
                  Tampilkan pilihan ini di form deposit trader
                </p>
              </div>
              <Switch checked={formActive} onCheckedChange={setFormActive} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleSaveSourceModal}
              className="text-xs bg-primary text-primary-foreground"
            >
              {editingItem ? "Simpan Perubahan" : "Tambahkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
