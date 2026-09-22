import {
  Check,
  Eye,
  Image as ImageIcon,
  Info,
  QrCode,
  RefreshCw,
  Save,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { secureFetch } from "@/lib/api-client";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SettingsAdminPage() {
  const [qrisImage, setQrisImage] = useState<string>("");
  const [qrisMerchantName, setQrisMerchantName] = useState<string>("Gotrade Indonesia Official");

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const res = await secureFetch("/api/settings");
        const data = await res.json();
        if (res.ok && data.success && data.settings) {
          if (data.settings.qris_image) setQrisImage(data.settings.qris_image);
          if (data.settings.qris_merchant_name)
            setQrisMerchantName(data.settings.qris_merchant_name);
        }
      } catch {
        // use default state
      } finally {
        setLoading(false);
      }
    }
    void loadSettings();
  }, []);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar (PNG, JPG, SVG, atau WEBP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setQrisImage(result);
        toast.success("Gambar QRIS berhasil dimuat!", {
          description: "Klik 'Simpan Pengaturan' untuk menerapkan perubahan ke seluruh sistem.",
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        qris_image: qrisImage,
        qris_merchant_name: qrisMerchantName,
      };

      const res = await secureFetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Pengaturan berhasil disimpan ke Database!", {
          description: "Gambar QRIS untuk deposit/top up kini aktif di halaman deposit trader.",
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

  const handleRemoveImage = () => {
    setQrisImage("");
    toast.info("Gambar QRIS dihapus", {
      description: "Sistem akan kembali menggunakan kode QR SVG bawaan.",
    });
  };

  return (
    <AdminLayout title="Pengaturan Sistem" subtitle="Kelola konfigurasi platform dan QRIS deposit">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header Action Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
              <QrCode className="mr-1.5 h-3.5 w-3.5" /> Konfigurasi QRIS & Deposit
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
          {/* Form Upload QRIS (7 cols) */}
          <div className="space-y-6 lg:col-span-7">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Upload Gambar QRIS Deposit
                </CardTitle>
                <CardDescription>
                  Upload gambar barcode/QRIS resmi untuk memproses pembayaran top up dari pengguna.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Drag and Drop Zone */}
                <div>
                  <Label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    File Gambar QRIS
                  </Label>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all ${
                      dragOver
                        ? "border-primary bg-primary/10"
                        : qrisImage
                          ? "border-primary/40 bg-muted/20 hover:border-primary/70"
                          : "border-muted-foreground/25 hover:border-primary/60 hover:bg-muted/30"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFile(e.target.files[0]);
                        }
                      }}
                    />

                    {qrisImage ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative overflow-hidden rounded-lg border bg-white p-2 shadow-sm">
                          <img
                            src={qrisImage}
                            alt="QRIS Preview"
                            className="max-h-44 w-auto object-contain"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="bg-primary/10 text-primary border-primary/30"
                          >
                            <Check className="mr-1 h-3 w-3" /> Gambar Terpilih
                          </Badge>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage();
                            }}
                            className="h-7 text-xs"
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5" /> Hapus
                          </Button>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Klik untuk mengganti gambar dengan file lain
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110">
                          <UploadCloud className="h-7 w-7" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            Tarik & lepas file gambar QRIS ke sini
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            atau klik untuk memilih dari komputer (PNG, JPG, SVG, WEBP maks 5MB)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Merchant Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="merchant-name" className="text-xs font-semibold">
                    Nama Merchant QRIS / Rekening Penerima
                  </Label>
                  <Input
                    id="merchant-name"
                    value={qrisMerchantName}
                    onChange={(e) => setQrisMerchantName(e.target.value)}
                    placeholder="Contoh: Gotrade Indonesia Official"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Nama ini akan ditampilkan pada instruksi pembayaran trader.
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
                  Pratinjau tampilan QRIS yang akan dilihat pengguna saat melakukan top up.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mx-auto max-w-xs rounded-2xl border bg-card p-4 shadow-sm">
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
                    <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                      QRIS Nasional
                    </span>
                    <h4 className="mt-2 text-sm font-bold text-foreground">
                      {qrisMerchantName || "Gotrade Indonesia"}
                    </h4>
                    <p className="text-[11px] text-muted-foreground">NMID: ID1020039281920 • GPN</p>

                    <div className="mx-auto mt-3 flex w-fit items-center justify-center overflow-hidden rounded-xl border bg-white p-2 shadow-sm">
                      {qrisImage ? (
                        <img
                          src={qrisImage}
                          alt="QRIS Trader View"
                          className="h-44 w-44 object-contain"
                        />
                      ) : (
                        <QRCodeSVG
                          value="GOTRADE-QRIS-OFFICIAL"
                          size={176}
                          level="M"
                          includeMargin={false}
                        />
                      )}
                    </div>

                    <p className="mt-2 text-[11px] font-medium text-foreground">Rp500.000</p>

                    <div className="mt-3 flex gap-2">
                      <div className="flex-1 rounded-md border bg-background py-1.5 text-center text-[10px] font-medium text-foreground">
                        Salin Kode
                      </div>
                      <div className="flex-1 rounded-md border bg-background py-1.5 text-center text-[10px] font-medium text-foreground">
                        Unduh QRIS
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                    <Info className="h-3.5 w-3.5 text-primary" />
                    Mendukung BCA, Mandiri, BRI, GoPay, OVO, DANA
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Helper */}
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ImageIcon className="h-4 w-4" />
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p className="font-semibold text-foreground">Panduan Format Gambar QRIS</p>
                    <p>
                      Pastikan barcode QRIS memiliki kontras tinggi (hitam di atas putih) agar dapat
                      dipindai oleh seluruh aplikasi mobile banking dan e-wallet di Indonesia.
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
