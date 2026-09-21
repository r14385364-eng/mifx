import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Eye,
  EyeOff,
  HelpCircle,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { AppLogo } from "@/components/AppLogo";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Masuk ke Akun Gotrade" },
      {
        name: "description",
        content:
          "Masuk ke Akun Gotrade Anda dengan email dan password atau pilih akun user dan admin.",
      },
      { property: "og:title", content: "Masuk ke Akun Gotrade" },
      {
        property: "og:description",
        content: "Masuk ke Akun Gotrade Anda dengan email dan password.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

export function LoginPage() {
  const navigate = useNavigate();
  const { login, demoAccounts, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setErrorMessage("");

    const targetEmail = customEmail || email;
    const targetPass = customPass || password;

    if (!targetEmail || !targetPass) {
      setErrorMessage("Silakan masukkan email dan password Anda.");
      return;
    }

    const res = await login(targetEmail, targetPass);
    if (res.success) {
      toast.success("Berhasil masuk!", {
        description: `Selamat datang di Gotrade (${targetEmail})`,
      });

      // If admin, navigate to admin page, else to beranda
      if (targetEmail.includes("admin")) {
        void navigate({ to: "/admin" });
      } else {
        void navigate({ to: "/beranda" });
      }
    } else {
      setErrorMessage(res.message || "Email atau password salah.");
      toast.error("Gagal masuk", {
        description: res.message || "Periksa kembali email dan password.",
      });
    }
  };

  const selectAndFillDemo = (demo: (typeof demoAccounts)[0]) => {
    setSelectedDemo(demo.role);
    setEmail(demo.email);
    setPassword(demo.password);
    setErrorMessage("");
    void handleLogin(undefined, demo.email, demo.password);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-8 pt-6">
        {/* Help */}
        <button
          type="button"
          aria-label="Bantuan"
          className="absolute right-5 top-5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <HelpCircle className="h-6 w-6" />
        </button>

        {/* Logo */}
        <div className="mt-6 flex items-center justify-center">
          <AppLogo size="lg" />
        </div>

        {/* 1-Click Accounts Section */}
        <div className="mt-6 rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between pb-2.5 border-b border-border">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Pilih Akun
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground font-medium">1-Click Login</span>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2.5">
            {demoAccounts.map((demo) => {
              const isSelected = selectedDemo === demo.role;
              return (
                <button
                  key={demo.role}
                  type="button"
                  onClick={() => selectAndFillDemo(demo)}
                  disabled={isLoading}
                  className={`group relative flex flex-col items-start rounded-lg border p-3 text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border/80 bg-background hover:border-primary/50 hover:bg-muted/40"
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-2">
                      {demo.role === "admin" ? (
                        <ShieldCheck className="h-4 w-4 text-purple-600" />
                      ) : (
                        <UserCheck className="h-4 w-4 text-emerald-600" />
                      )}
                      <span className="text-sm font-bold text-foreground">{demo.title}</span>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${demo.badgeColor}`}
                    >
                      {demo.badge}
                    </span>
                  </div>

                  <p className="mt-1 text-[11px] text-muted-foreground line-clamp-1">
                    {demo.description}
                  </p>

                  <div className="mt-2 flex w-full items-center justify-between border-t border-border/40 pt-2 text-[11px] font-mono">
                    <span className="text-muted-foreground">{demo.email}</span>
                    <span className="flex items-center gap-1 font-semibold text-primary group-hover:underline">
                      Masuk{" "}
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="h-[1px] flex-1 bg-border" />
          <span className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider">
            atau login manual
          </span>
          <div className="h-[1px] flex-1 bg-border" />
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label
              htmlFor="login-email"
              className="mb-2 block text-[13px] font-medium text-foreground"
            >
              Email
            </label>
            <Input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukkan email Anda yang terdaftar"
              className="h-12 rounded-lg border-border bg-card text-sm placeholder:text-muted-foreground/60"
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="mb-2 block text-[13px] font-medium text-foreground"
            >
              Password
            </label>
            <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukan password Anda"
                className="h-12 rounded-lg border-border bg-card pr-12 text-sm placeholder:text-muted-foreground/60"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/70 transition-colors hover:text-foreground"
              >
                {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div>
            <button
              type="button"
              className="text-[13px] font-semibold text-primary transition-colors hover:text-primary/80"
            >
              Lupa Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="h-[52px] w-full rounded-lg bg-primary text-base font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 active:bg-primary/80 disabled:opacity-50"
          >
            {isLoading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-auto pt-6 text-center text-[13px] text-muted-foreground">
          Belum punya akun?{" "}
          <Link to="/register" className="font-semibold text-primary hover:text-primary/80">
            Buat akun sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}
