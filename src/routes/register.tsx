import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, ChevronLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Buka Akun MIFX — Daftar Sekarang" },
      {
        name: "description",
        content:
          "Isi lengkap formulir untuk membuat Akun MIFX dan mulai trading dengan MetaTrader 5 atau MetaTrader 4.",
      },
      { property: "og:title", content: "Buka Akun MIFX — Daftar Sekarang" },
      {
        property: "og:description",
        content:
          "Isi lengkap formulir untuk membuat Akun MIFX dan mulai trading dengan MetaTrader 5 atau MetaTrader 4.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RegisterPage,
});

const passwordRules = [
  "Minimal 8 karakter, maksimal 15 karakter",
  "Harus mengandung setidaknya 1 huruf besar, 1 huruf kecil, sebuah angka, dan sebuah simbol.",
  'Harap diperhatikan bahwa simbol ", &, \', <, =, >" tidak diizinkan.',
];

function RegisterPage() {
  const [platform, setPlatform] = useState<"mt5" | "mt4">("mt5");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-md px-5 pb-10 pt-6">
        {/* Back */}
        <Link
          to="/"
          className="mb-5 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Kembali
        </Link>

        {/* Heading */}
        <h1 className="text-[28px] font-extrabold tracking-tight text-foreground">
          Buka Akun MIFX
        </h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
          Isi lengkap formulir berikut untuk membuat Akun MIFX.
        </p>

        <form className="mt-7 space-y-5" onSubmit={(e) => e.preventDefault()}>
          {/* Nama Lengkap */}
          <Field label="Nama Lengkap" required>
            <Input
              placeholder="Masukkan nama lengkap Anda"
              className="h-12 rounded-lg border-border bg-card text-sm placeholder:text-muted-foreground/60"
            />
          </Field>

          {/* Email */}
          <Field label="Email" required>
            <Input
              type="email"
              placeholder="Masukkan email Anda"
              className="h-12 rounded-lg border-border bg-card text-sm placeholder:text-muted-foreground/60"
            />
          </Field>

          {/* Nomor Handphone */}
          <Field label="Nomor Handphone" required>
            <div className="flex gap-2">
              <button
                type="button"
                className="flex h-12 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 text-sm font-medium text-foreground"
              >
                +62
                <ChevronDownIcon />
              </button>
              <Input
                inputMode="tel"
                placeholder="8xx-xxxx-xxxx"
                className="h-12 rounded-lg border-border bg-card text-sm placeholder:text-muted-foreground/60"
              />
            </div>
          </Field>

          {/* Kode Referral */}
          <Field label="Kode Referral/Promo">
            <Input
              placeholder="Masukkan kode referral/promo Anda"
              className="h-12 rounded-lg border-border bg-card text-sm placeholder:text-muted-foreground/60"
            />
          </Field>

          {/* Trading Platform */}
          <div>
            <p className="mb-2 text-[13px] font-semibold text-foreground">Pilih Trading Platform</p>
            <div className="grid grid-cols-2 gap-3">
              <PlatformOption
                active={platform === "mt5"}
                onClick={() => setPlatform("mt5")}
                label="MetaTrader 5"
              />
              <PlatformOption
                active={platform === "mt4"}
                onClick={() => setPlatform("mt4")}
                label="MetaTrader 4"
              />
            </div>
          </div>

          {/* Password */}
          <Field label="Password" required>
            <PasswordInput
              placeholder="Masukkan Password"
              show={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
            />
          </Field>

          {/* Konfirmasi Password */}
          <Field label="Konfirmasi Password" required>
            <PasswordInput
              placeholder="Konfirmasi Password"
              show={showConfirm}
              onToggle={() => setShowConfirm((v) => !v)}
            />
          </Field>

          {/* Password rules */}
          <div className="rounded-xl bg-muted/70 p-4">
            <ul className="space-y-2.5">
              {passwordRules.map((rule) => (
                <li key={rule} className="flex items-start gap-2.5">
                  <CheckCircleIcon />
                  <span className="text-[11.5px] leading-snug text-muted-foreground">{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Agreement */}
          <label className="flex cursor-pointer items-start gap-3">
            <Checkbox
              checked={agreed}
              onCheckedChange={(v) => setAgreed(v === true)}
              className="mt-0.5 h-[18px] w-[18px] rounded border-border data-[state=checked]:border-primary data-[state=checked]:bg-primary"
            />
            <span className="text-[12px] leading-snug text-foreground">
              Saya telah membaca dan menyetujui{" "}
              <span className="font-semibold text-primary">Syarat dan Ketentuan</span> serta{" "}
              <span className="font-semibold text-primary">Kebijakan Privasi</span>.
            </span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            className="h-[52px] w-full rounded-full bg-primary text-base font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-transform active:scale-[0.98]"
          >
            Lanjut
          </button>

          <p className="pt-1 text-center text-[13px] text-muted-foreground">
            Sudah punya akun?{" "}
            <Link to="/login" className="font-bold text-primary hover:text-primary/80">
              Masuk di sini
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-[13px] font-semibold text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </p>
      {children}
    </div>
  );
}

function PasswordInput({
  placeholder,
  show,
  onToggle,
}: {
  placeholder: string;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        className="h-12 rounded-lg border-border bg-card pr-12 text-sm placeholder:text-muted-foreground/60"
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/70 transition-colors hover:text-foreground"
      >
        {show ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
      </button>
    </div>
  );
}

function PlatformOption({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-12 items-center justify-center gap-2 rounded-full border text-sm font-semibold transition-all",
        active
          ? "border-primary/30 bg-accent text-foreground"
          : "border-transparent text-muted-foreground hover:bg-muted/60",
      )}
    >
      <span
        className={cn(
          "flex h-[18px] w-[18px] items-center justify-center rounded-full border-2",
          active ? "border-primary bg-primary" : "border-muted-foreground/40",
        )}
      >
        {active && (
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-primary-foreground" fill="none">
            <path
              d="M2.5 6.5L5 9L9.5 3.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      {label}
    </button>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 text-muted-foreground" fill="none">
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 16 16" className="mt-0.5 h-4 w-4 shrink-0 text-primary" fill="none">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2" opacity="0.35" />
      <path
        d="M5 8.2l2 2 4-4.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
