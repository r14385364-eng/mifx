import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowDownToLine, CheckCircle2, Clock, Info } from "lucide-react";
import { useState } from "react";

import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/withdraw")({
  head: () => ({
    meta: [
      { title: "Withdraw — MIFX" },
      { name: "description", content: "Tarik dana dari akun trading MIFX Anda ke rekening bank atau e-wallet dengan cepat dan aman." },
      { property: "og:title", content: "Withdraw — MIFX" },
      { property: "og:description", content: "Tarik dana dari akun trading MIFX Anda ke rekening bank atau e-wallet dengan cepat dan aman." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WithdrawPage,
});


const AVAILABLE_BALANCE = 10000000; // demo: Rp10.000.000

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

function WithdrawPage() {
  const [amount, setAmount] = useState("");
  const [accountName, setAccountName] = useState("");
  const [destination, setDestination] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const numericAmount = Number(amount.replace(/\D/g, ""));

  const validate = () => {
    const next: Record<string, string> = {};
    if (!numericAmount || numericAmount < 50000) next["amount"] = "Minimal penarikan Rp50.000";
    else if (numericAmount > AVAILABLE_BALANCE) next["amount"] = "Melebihi saldo yang tersedia";
    if (accountName.trim().length < 3) next["accountName"] = "Nama pemilik minimal 3 karakter";
    if (destination.trim().length < 3) next["destination"] = "Isi nama bank atau e-wallet tujuan";
    if (accountNumber.trim().length < 5) next["accountNumber"] = "Nomor rekening / e-wallet tidak valid";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitted(true);
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
            Penarikan sebesar <span className="font-semibold text-foreground">{formatRupiah(numericAmount)}</span> ke{" "}
            {destination} a.n. {accountName} sedang diproses. Dana biasanya sampai dalam 1x24 jam kerja.
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
        {/* Saldo */}
        <section className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
              <ArrowDownToLine className="h-5 w-5 text-primary" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Saldo Tersedia</p>
              <p className="text-lg font-bold text-foreground">{formatRupiah(AVAILABLE_BALANCE)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAmount(String(AVAILABLE_BALANCE))}
            className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
          >
            Tarik Semua
          </button>
        </section>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm">
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
            {errors["amount"] && <p className="mt-1 text-[11px] text-red-500">{errors["amount"]}</p>}
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
            {errors["accountName"] && <p className="mt-1 text-[11px] text-red-500">{errors["accountName"]}</p>}
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
            {errors["destination"] && <p className="mt-1 text-[11px] text-red-500">{errors["destination"]}</p>}
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
            {errors["accountNumber"] && <p className="mt-1 text-[11px] text-red-500">{errors["accountNumber"]}</p>}
          </div>

          {/* Ringkasan */}
          {numericAmount >= 50000 && numericAmount <= AVAILABLE_BALANCE && (
            <div className="rounded-lg bg-muted p-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Jumlah Penarikan</span>
                <span className="font-semibold text-foreground">{formatRupiah(numericAmount)}</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-muted-foreground">Biaya Admin</span>
                <span className="font-semibold text-primary">Gratis</span>
              </div>
              <div className="mt-2 flex justify-between border-t pt-2">
                <span className="font-medium text-foreground">Dana Diterima</span>
                <span className="font-bold text-foreground">{formatRupiah(numericAmount)}</span>
              </div>
            </div>
          )}

          <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Penarikan diproses pada hari kerja (Senin–Jumat, 08.00–17.00 WIB). Pastikan nama pemilik rekening sesuai
            dengan data akun Anda.
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
