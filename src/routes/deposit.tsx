import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Copy,
  Download,
  Info,
  QrCode,
  ShieldCheck,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/deposit")({
  head: () => ({
    meta: [
      { title: "Deposit — Gotrade" },
      {
        name: "description",
        content:
          "Isi saldo akun trading Gotrade Anda dengan cepat dan aman melalui QRIS, transfer bank, atau e-wallet.",
      },
      { property: "og:title", content: "Deposit — Gotrade" },
      {
        property: "og:description",
        content:
          "Isi saldo akun trading Gotrade Anda dengan cepat dan aman melalui QRIS, transfer bank, atau e-wallet.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DepositPage,
});

const paymentSources = [
  { id: "bca", label: "Bank BCA", category: "Bank" },
  { id: "mandiri", label: "Bank Mandiri", category: "Bank" },
  { id: "bri", label: "Bank BRI", category: "Bank" },
  { id: "bni", label: "Bank BNI", category: "Bank" },
  { id: "gopay", label: "GoPay", category: "E-Wallet" },
  { id: "ovo", label: "OVO", category: "E-Wallet" },
  { id: "dana", label: "DANA", category: "E-Wallet" },
  { id: "shopeepay", label: "ShopeePay", category: "E-Wallet" },
];

const quickAmounts = [16000000, 25000000, 50000000, 100000000];

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

function DepositPage() {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [accountName, setAccountName] = useState("");
  const [source, setSource] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dynamic QRIS from Admin Settings
  const [qrisImage, setQrisImage] = useState<string>("");
  const [merchantName, setMerchantName] = useState<string>("Gotrade Indonesia Official");
  const [qrisPayload, setQrisPayload] = useState<string>(
    "00020101021226590014ID.LINKAJA.WWW01189360091100223030310215GOTRADEINDONESIA5204581253033605802ID5914GOTRADE INDONESIA6007JAKARTA61051234062070703A016304",
  );

  useEffect(() => {
    async function loadQrisSettings() {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (res.ok && data.success && data.settings) {
          if (data.settings.qris_image !== undefined) setQrisImage(data.settings.qris_image);
          if (data.settings.qris_merchant_name) setMerchantName(data.settings.qris_merchant_name);
          if (data.settings.qris_payload) setQrisPayload(data.settings.qris_payload);
        }
      } catch {
        // use cached state
      }
    }
    void loadQrisSettings();
  }, []);

  const numericAmount = Number(amount.replace(/\D/g, ""));
  const sourceLabel = paymentSources.find((p) => p.id === source)?.label ?? "-";

  const validate = () => {
    const next: Record<string, string> = {};
    if (!numericAmount || numericAmount < 16000000)
      next["amount"] = "Minimal deposit $1,000 USD (sekitar Rp16.000.000)";
    if (numericAmount > 500000000) next["amount"] = "Maksimal deposit Rp500.000.000";
    if (accountName.trim().length < 3) next["accountName"] = "Nama pemilik minimal 3 karakter";
    if (!source) next["source"] = "Pilih rekening atau e-wallet sumber dana";
    if (accountNumber.trim().length < 5)
      next["accountNumber"] = "Nomor rekening / e-wallet tidak valid";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          userName: accountName.trim() || user?.name || "Trader",
          accountNumber: user?.accountNumber || "1006568912",
          type: "Top Up",
          channel: sourceLabel,
          destination: accountNumber ? `•••• ${accountNumber.slice(-4)}` : "•••• 8421",
          amount: numericAmount,
        }),
      });
      toast.success("Deposit berhasil diajukan!");
    } catch {
      // Continue anyway
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }
  };

  const copyQris = () => {
    const textToCopy =
      qrisPayload || `GOTRADE-QRIS|amount=${numericAmount || 0}|name=${accountName || "-"}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(textToCopy).catch(() => {});
    }
    toast.success("Kode QRIS berhasil disalin!");
  };

  const downloadQris = () => {
    if (qrisImage) {
      const a = document.createElement("a");
      a.href = qrisImage;
      a.download = "gotrade-qris-official.png";
      a.click();
      toast.success("Gambar QRIS berhasil diunduh");
    } else {
      const svg = document.getElementById("qris-svg");
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const svgUrl = URL.createObjectURL(svgBlob);
        const a = document.createElement("a");
        a.href = svgUrl;
        a.download = "gotrade-qris.svg";
        a.click();
        URL.revokeObjectURL(svgUrl);
        toast.success("QRIS berhasil diunduh");
      } else {
        toast.info("QRIS siap digunakan");
      }
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-muted/40">
        <header className="flex items-center gap-3 bg-background px-4 py-3">
          <Link to="/beranda" aria-label="Kembali" className="rounded-full p-1.5 hover:bg-muted">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Link>
          <h1 className="text-base font-semibold text-foreground">Deposit</h1>
        </header>
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </span>
          <h2 className="text-lg font-bold text-foreground">Permintaan Deposit Diterima</h2>
          <p className="text-sm text-muted-foreground">
            Deposit sebesar{" "}
            <span className="font-semibold text-foreground">{formatRupiah(numericAmount)}</span>{" "}
            dari {sourceLabel} a.n. {accountName} sedang kami verifikasi. Saldo akan masuk ke akun
            Anda setelah pembayaran terkonfirmasi.
          </p>
          <Link
            to="/beranda"
            className="mt-2 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
          >
            Kembali ke Beranda
          </Link>
        </main>
        <BottomNav active="Beranda" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-muted/40">
      {/* Header */}
      <header className="flex items-center gap-3 bg-background px-4 py-3">
        <Link to="/beranda" aria-label="Kembali" className="rounded-full p-1.5 hover:bg-muted">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </Link>
        <h1 className="text-base font-semibold text-foreground">Deposit</h1>
      </header>

      <main className="flex flex-col gap-5 px-4 py-4 pb-6">
        {/* Minimal Deposit Banner */}
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-amber-600 dark:text-amber-400">
          <Info className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="text-xs">
            <p className="font-bold text-foreground">Minimal Top Up / Deposit</p>
            <p className="mt-0.5 text-muted-foreground">
              <span className="font-extrabold text-amber-600 dark:text-amber-400">$1,000 USD</span>{" "}
              (setara <span className="font-semibold text-foreground">Rp16.000.000 IDR</span>)
            </p>
          </div>
        </div>

        {/* QRIS card */}
        <section className="rounded-xl border bg-card p-4 text-center shadow-sm">
          <div className="flex items-center justify-center gap-1.5">
            <QrCode className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Scan QRIS untuk Deposit</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Mendukung semua aplikasi bank & e-wallet (BCA, Mandiri, BRI, GoPay, OVO, DANA)
          </p>
          <div className="mt-2 inline-flex items-center justify-center rounded-full bg-primary/10 px-3 py-0.5 text-[11px] font-semibold text-primary">
            {merchantName}
          </div>

          <div className="mx-auto mt-3 flex w-fit items-center justify-center overflow-hidden rounded-xl border bg-white p-3 shadow-sm">
            {qrisImage ? (
              <img
                src={qrisImage}
                alt="QRIS Deposit"
                className="max-h-48 max-w-48 object-contain"
              />
            ) : (
              <QRCodeSVG
                id="qris-svg"
                value={
                  qrisPayload ||
                  `Gotrade-QRIS|amount=${numericAmount || 0}|name=${accountName || "-"}`
                }
                size={180}
                level="M"
                includeMargin={false}
              />
            )}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            {numericAmount > 0
              ? formatRupiah(numericAmount)
              : "Nominal mengikuti jumlah yang Anda bayar"}
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={copyQris}
              className="flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Copy className="h-3.5 w-3.5" />
              Salin Kode
            </button>
            <button
              type="button"
              onClick={downloadQris}
              className="flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Download className="h-3.5 w-3.5" />
              Unduh QRIS
            </button>
          </div>

          <p className="mt-3 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Transaksi aman & terverifikasi otomatis
          </p>
        </section>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-foreground">Detail Deposit</h2>

          {/* Nominal */}
          <div>
            <label htmlFor="amount" className="text-xs font-medium text-foreground">
              Jumlah Deposit (IDR)
            </label>
            <div className="mt-1.5 flex items-center rounded-lg border bg-background px-3 focus-within:border-primary">
              <span className="text-sm font-semibold text-muted-foreground">Rp</span>
              <input
                id="amount"
                inputMode="numeric"
                placeholder="0"
                value={amount ? Number(amount).toLocaleString("id-ID") : ""}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-transparent px-2 py-2.5 text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
            {errors["amount"] && (
              <p className="mt-1 text-[11px] text-red-500">{errors["amount"]}</p>
            )}
            <div className="mt-2 grid grid-cols-3 gap-2">
              {quickAmounts.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setAmount(String(q))}
                  className={`rounded-lg border py-1.5 text-[11px] font-medium transition-colors ${
                    numericAmount === q
                      ? "border-primary bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {q >= 1000000 ? `${q / 1000000} Jt` : `${q / 1000} Rb`}
                </button>
              ))}
            </div>
          </div>

          {/* Atas nama */}
          <div>
            <label htmlFor="accountName" className="text-xs font-medium text-foreground">
              Atas Nama (pemilik rekening / e-wallet)
            </label>
            <input
              id="accountName"
              type="text"
              maxLength={100}
              placeholder="Contoh: Budi Santoso"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
            />
            {errors["accountName"] && (
              <p className="mt-1 text-[11px] text-red-500">{errors["accountName"]}</p>
            )}
          </div>

          {/* Sumber dana */}
          <div>
            <label htmlFor="source" className="text-xs font-medium text-foreground">
              Rekening / E-Wallet Sumber Dana
            </label>
            <div className="relative mt-1.5">
              <select
                id="source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full appearance-none rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
              >
                <option value="">Pilih bank atau e-wallet</option>
                <optgroup label="Bank">
                  {paymentSources
                    .filter((p) => p.category === "Bank")
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="E-Wallet">
                  {paymentSources
                    .filter((p) => p.category === "E-Wallet")
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                </optgroup>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            {errors["source"] && (
              <p className="mt-1 text-[11px] text-red-500">{errors["source"]}</p>
            )}
          </div>

          {/* Nomor rekening */}
          <div>
            <label htmlFor="accountNumber" className="text-xs font-medium text-foreground">
              Nomor Rekening / HP E-Wallet
            </label>
            <input
              id="accountNumber"
              inputMode="numeric"
              maxLength={30}
              placeholder="Contoh: 1234567890"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/[^\d\s-]/g, ""))}
              className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
            />
            {errors["accountNumber"] && (
              <p className="mt-1 text-[11px] text-red-500">{errors["accountNumber"]}</p>
            )}
          </div>

          {/* Ringkasan */}
          {numericAmount >= 10000 && (
            <div className="rounded-lg bg-muted p-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Jumlah Deposit</span>
                <span className="font-semibold text-foreground">{formatRupiah(numericAmount)}</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-muted-foreground">Biaya Admin</span>
                <span className="font-semibold text-primary">Gratis</span>
              </div>
              <div className="mt-2 flex justify-between border-t pt-2">
                <span className="font-medium text-foreground">Total Diterima</span>
                <span className="font-bold text-foreground">{formatRupiah(numericAmount)}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Ajukan Deposit
          </button>
        </form>
      </main>

      <BottomNav active="Beranda" />
    </div>
  );
}
