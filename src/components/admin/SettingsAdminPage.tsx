import {
  Check,
  CreditCard,
  Copy,
  Eye,
  Info,
  Landmark,
  RefreshCw,
  Save,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { secureFetch } from "@/lib/api-client";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SettingsAdminPage() {
  const [bankName, setBankName] = useState<string>("Line bank");
  const [accountNumber, setAccountNumber] = useState<string>("11628950560");
  const [accountName, setAccountName] = useState<string>("Gotrade Indonesia Official");
  const [initialProfitPct, setInitialProfitPct] = useState<string>("10");

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

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
        }
      } catch {
        // use default state
      } finally {
        setLoading(false);
      }
    }
    void loadSettings();
  }, []);

  const handleSave = async () => {
    if (!bankName.trim() || !accountNumber.trim() || !accountName.trim()) {
      toast.error("Mohon lengkapi seluruh data nama bank, nomor rekening, dan atas nama.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        deposit_bank_name: bankName.trim(),
        deposit_account_number: accountNumber.trim(),
        deposit_account_name: accountName.trim(),
        initial_profit_percentage: initialProfitPct,
      };

      const res = await secureFetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Pengaturan berhasil disimpan ke Database!", {
          description:
            "Informasi rekening bank tujuan deposit telah aktif di halaman /deposit pengguna.",
        });
      } else {
        toast.error("Gagal menyimpan pengaturan.");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan saat menyimpan.");
    } finally {
      setSaving(false);
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

  return (
    <AdminLayout
      title="Pengaturan Sistem"
      subtitle="Kelola rekening bank tujuan deposit dan konfigurasi platform"
    >
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header Action Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
              <Landmark className="mr-1.5 h-3.5 w-3.5" /> Rekening Bank Deposit
            </Badge>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Simpan Pengaturan
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Form Rekening Deposit (7 cols) */}
          <div className="space-y-6 lg:col-span-7">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Rekening Bank Tujuan Deposit
                </CardTitle>
                <CardDescription>
                  Atur nomor rekening dan nama bank resmi yang digunakan trader untuk mentransfer
                  dana deposit.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Nama Bank */}
                <div className="space-y-1.5">
                  <Label htmlFor="bank-name" className="text-xs font-semibold">
                    Nama Bank Tujuan
                  </Label>
                  <Input
                    id="bank-name"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Contoh: Line bank, BCA, Mandiri, BRI"
                    className="font-medium"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Nama bank yang akan tertera pada kartu informasi transfer trader.
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
                    Nomor rekening tujuan yang dapat disalin satu-klik oleh pengguna.
                  </p>
                </div>

                {/* Atas Nama Rekening */}
                <div className="space-y-1.5">
                  <Label htmlFor="account-name" className="text-xs font-semibold">
                    Atas Nama Rekening (Pemilik Akun)
                  </Label>
                  <Input
                    id="account-name"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Contoh: Gotrade Indonesia Official"
                    className="font-semibold"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Nama pemegang rekening resmi untuk verifikasi pengirim sebelum transfer.
                  </p>
                </div>
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
                  Pratinjau tampilan kartu rekening yang dilihat pengguna saat melakukan deposit.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mx-auto max-w-xs rounded-2xl border bg-card p-4 shadow-sm">
                  {/* Preview of the actual deposit card */}
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
                          {bankName || "Line bank"}
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
                    </div>

                    <p className="mt-2.5 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                      <ShieldCheck className="h-3 w-3 text-emerald-600" />
                      Transfer resmi terverifikasi
                    </p>
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
                    <p className="font-semibold text-foreground">Panduan Rekening Deposit</p>
                    <p>
                      Pastikan nomor rekening dan nama pemilik akun telah sesuai. Trader akan
                      mentransfer ke rekening di atas dan mengunggah bukti resi transfer untuk
                      diverifikasi admin di menu Transaksi.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
