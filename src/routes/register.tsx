import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, ChevronLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { AppLogo } from "@/components/AppLogo";
import { saveLoginCredentials } from "@/lib/auth-storage";

export const Route = createFileRoute("/register")({
  validateSearch: (search: Record<string, unknown>) => ({
    ref: typeof search["ref"] === "string" ? (search["ref"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Buka Akun Gotrade — Daftar Sekarang" },
      {
        name: "description",
        content: "Isi lengkap formulir untuk membuat Akun Gotrade dan mulai trading.",
      },
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
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [referralCode, setReferralCode] = useState(search.ref || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim() || !username.trim() || !email.trim() || !password) {
      setErrorMsg("Nama lengkap, username, email, dan password wajib diisi.");
      return;
    }

    if (username.trim().length < 3) {
      setErrorMsg("Username minimal 3 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Konfirmasi password tidak cocok.");
      return;
    }

    if (password.length < 8) {
      setErrorMsg("Password minimal 8 karakter.");
      return;
    }

    if (!agreed) {
      setErrorMsg("Anda harus menyetujui Syarat dan Ketentuan.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim(),
          email: email.trim(),
          password,
          referralCode: referralCode.trim() || undefined,
        }),
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (res.ok && data.success) {
        // Automatically save registered email & password so login page is prefilled
        saveLoginCredentials(email.trim(), password);

        toast.success("Pendaftaran Berhasil!", {
          description: `Selamat datang di Gotrade, ${data.user.name} (@${data.user.username || username.trim()}). Mengalihkan ke halaman login...`,
        });
        void navigate({ to: "/login" });
      } else {
        setErrorMsg(data.message || "Gagal mendaftar.");
        toast.error("Pendaftaran Gagal", {
          description: data.message || "Silakan periksa kembali data Anda.",
        });
      }
    } catch {
      setIsSubmitting(false);
      setErrorMsg("Gagal terhubung ke server database.");
    }
  };

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
        <div className="mb-2 flex items-center gap-3">
          <AppLogo size="md" showText={false} />
          <div>
            <h1 className="text-[26px] font-extrabold tracking-tight text-foreground">
              Buka Akun Gotrade
            </h1>
          </div>
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          Isi lengkap formulir berikut untuk membuat Akun Gotrade dan mulai trading.
        </p>

        {errorMsg && (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {errorMsg}
          </div>
        )}

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          {/* Nama Lengkap */}
          <Field label="Nama Lengkap" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama lengkap Anda"
              className="h-12 rounded-lg border-border bg-card text-sm placeholder:text-muted-foreground/60"
            />
          </Field>

          {/* Username */}
          <Field label="Username" required>
            <Input
              value={username}
              onChange={(e) =>
                setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ""))
              }
              placeholder="Masukkan username (contoh: trader_pro88)"
              className="h-12 rounded-lg border-border bg-card text-sm placeholder:text-muted-foreground/60"
            />
          </Field>

          {/* Email */}
          <Field label="Email" required>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukkan email Anda"
              className="h-12 rounded-lg border-border bg-card text-sm placeholder:text-muted-foreground/60"
            />
          </Field>

          {/* Kode Referral */}
          <Field label="Kode Referral/Promo">
            <Input
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              placeholder="Masukkan kode referral/promo Anda (opsional)"
              className="h-12 rounded-lg border-border bg-card text-sm placeholder:text-muted-foreground/60"
            />
          </Field>

          {/* Password */}
          <Field label="Password" required>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan Password"
              show={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
            />
          </Field>

          {/* Konfirmasi Password */}
          <Field label="Konfirmasi Password" required>
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            disabled={isSubmitting}
            className="h-[52px] w-full rounded-full bg-primary text-base font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {isSubmitting ? "Mendaftarkan..." : "Daftar Akun"}
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
  value,
  onChange,
  show,
  onToggle,
}: {
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
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
