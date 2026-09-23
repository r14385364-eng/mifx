import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowDownToLine, CheckCircle2, Clock, Info } from "lucide-react";
import { useState } from "react";

import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/withdraw")({
  head: () => ({
    meta: [
      { title: "Withdraw — Gotrade" },
      {
        name: "description",
        content:
          "Tarik dana dari akun trading Gotrade Anda ke rekening bank atau e-wallet dengan cepat dan aman.",
      },
    ],
  }),
  component: WithdrawPage,
});

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

function WithdrawPage() {
  const { user, token } = useAuth();
  const [amount, setAmount] = useState("");
  const [accountName, setAccountName] = useState("");
  const [destination, setDestination] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const profitUSD = user?.profit ?? 0;
  const availableProfitRupiah = profitUSD * 16000;

  const totalBalanceUSD = user?.balance ?? 0;
  const depositBalanceUSD = Math.max(0, totalBalanceUSD - profitUSD);
  const depositBalanceRupiah = depositBalanceUSD * 16000;

  const numericAmount = Number(amount.replace(/\D/g, ""));

  const validate = () => {
    const next: Record<string, string> = {};
    if (!numericAmount || numericAmount < 100000)
      next["amount"] = "Minimal penarikan Rp100.000 IDR (setara $6.25 USD)";
    else if (numericAmount > availableProfitRupiah)
      next["amount"] =
        "Penarikan melebihi saldo profit yang tersedia. Saldo deposit utama tidak dapat ditarik.";
    if (accountName.trim().length < 3) next["accountName"] = "Nama pemilik minimal 3 karakter";
    if (destination.trim().length < 3) next["destination"] = "Isi nama bank atau e-wallet tujuan";
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
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          userId: user?.id,
          userName: accountName.trim() || user?.name || "Trader",
          accountNumber: user?.accountNumber || "1006568912",
          type: "Withdraw",
          channel: destination.trim(),
          destination: accountNumber ? `•••• ${accountNumber.slice(-4)}` : "•••• 1234",
          amount: numericAmount,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Gagal mengajukan penarikan");
        return;
      }
      toast.success("Permintaan penarikan berhasil dikirim!");
      setSubmitted(true);
    } catch {
      toast.error("Terjadi kesalahan jaringan saat mengajukan penarikan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-muted/40">
        <header className="flex items-center gap-3 bg-background px-4 py-3">
          <Link to="/beranda" aria-label="Kembali" className="rounded-full p-1.5 hover:bg-muted">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Link>
          <h1 className="text-base font-semibold text-foreground">Withdraw</h1>
        </header>
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </span>
          <h2 className="text-lg font-bold text-foreground">Penarikan Diproses</h2>
          <p className="text-sm text-muted-foreground">
            Penarikan sebesar{" "}
            <span className="font-semibold text-foreground">{formatRupiah(numericAmount)}</span> ke{" "}
            {destination} a.n. {accountName} sedang diproses. Dana biasanya sampai dalam 1x24 jam
            kerja.
          </p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            Estimasi tiba: maks. 1 hari kerja
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
        <h1 className="text-base font-semibold text-foreground">Withdraw</h1>
      </header>

      <main className="flex flex-col gap-5 px-4 py-4 pb-6">
        {/* Minimal Withdraw & Profit Rule Banner */}
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-foreground">
          <Info className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-amber-800 dark:text-amber-300">
              Ketentuan Penarikan (Withdraw)
            </p>
            <p className="text-muted-foreground leading-relaxed">
              • Penarikan dana{" "}
              <strong className="text-foreground">HANYA dapat dilakukan dari Saldo Profit</strong>.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              • Saldo deposit awal / top-up utama{" "}
              <strong className="text-amber-700 dark:text-amber-300">TIDAK DAPAT ditarik</strong>.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              • Minimal Penarikan:{" "}
              <strong className="text-blue-600 dark:text-blue-400">Rp 100.000 IDR</strong> (setara{" "}
              <strong className="text-foreground">$6.25 USD</strong>).
            </p>
          </div>
        </div>

        {/* Saldo Profit (Withdrawable) Card */}
        <section className="flex flex-col gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <ArrowDownToLine className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Saldo Profit (Dapat Ditarik)
                </p>
                <p className="text-lg font-extrabold text-foreground">
                  {formatRupiah(availableProfitRupiah)}
                </p>
                <p className="text-[11px] text-muted-foreground font-medium">
                  setara ${profitUSD.toFixed(2)} USD
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAmount(String(availableProfitRupiah))}
              disabled={availableProfitRupiah <= 0}
              className="rounded-lg bg-emerald-500 text-white px-3 py-1.5 text-xs font-bold transition-all hover:bg-emerald-600 disabled:opacity-50"
            >
              Tarik Semua Profit
            </button>
          </div>

          {/* Deposit Balance Info Badge */}
          <div className="flex items-center justify-between border-t border-border/60 pt-2 text-xs">
            <span className="text-muted-foreground">Saldo Deposit Utama (Non-WD):</span>
            <span className="font-semibold text-muted-foreground">
              {formatRupiah(depositBalanceRupiah)} (${depositBalanceUSD.toFixed(2)} USD)
            </span>
          </div>
        </section>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-foreground">Detail Penarikan</h2>

          {/* Nominal */}
          <div>
            <label htmlFor="amount" className="text-xs font-medium text-foreground">
              Jumlah Penarikan (IDR)
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

          {/* Tujuan */}
          <div>
            <label htmlFor="destination" className="text-xs font-medium text-foreground">
              Rekening / E-Wallet Tujuan
            </label>
            <input
              id="destination"
              type="text"
              maxLength={50}
              placeholder="Contoh: Bank BCA / GoPay"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
            />
            {errors["destination"] && (
              <p className="mt-1 text-[11px] text-red-500">{errors["destination"]}</p>
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
          {numericAmount >= 100000 && numericAmount <= availableProfitRupiah && (
            <div className="rounded-lg bg-muted p-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Jumlah Penarikan</span>
                <span className="font-semibold text-foreground">{formatRupiah(numericAmount)}</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-muted-foreground">Biaya Admin</span>
                <span className="font-semibold text-primary">Gratis</span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t pt-2">
                <div>
                  <span className="font-medium text-foreground">Dana Diterima</span>
                  <p className="text-[10px] text-muted-foreground">Kurs 1 USD = Rp 16.000</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-foreground">{formatRupiah(numericAmount)}</span>
                  <p className="text-[10px] text-muted-foreground">
                    setara $
                    {(numericAmount / 16000).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    USD
                  </p>
                </div>
              </div>
            </div>
          )}

          <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Penarikan diproses pada hari kerja (Senin–Jumat, 08.00–17.00 WIB). Pastikan nama pemilik
            rekening sesuai dengan data akun Anda.
          </p>

          <button
            type="submit"
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Ajukan Penarikan
          </button>
        </form>
      </main>

      <BottomNav active="Beranda" />
    </div>
  );
}
