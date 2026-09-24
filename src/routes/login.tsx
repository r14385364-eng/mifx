import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Eye, EyeOff, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { getSavedLoginCredentials, saveLoginCredentials } from "@/lib/auth-storage";
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
    ],
  }),
  component: LoginPage,
});

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState(() => getSavedLoginCredentials().email);
  const [password, setPassword] = useState(() => getSavedLoginCredentials().password);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Sync saved credentials upon component mount or redirection
  useEffect(() => {
    const saved = getSavedLoginCredentials();
    if (saved.email) setEmail(saved.email);
    if (saved.password) setPassword(saved.password);
  }, []);

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setErrorMessage("");

    const targetEmail = (customEmail || email).trim();
    const targetPass = customPass || password;

    if (!targetEmail || !targetPass) {
      setErrorMessage("Silakan masukkan email dan password Anda.");
      return;
    }

    const res = await login(targetEmail, targetPass);
    if (res.success) {
      saveLoginCredentials(targetEmail, targetPass);
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
        <div className="my-8 flex items-center justify-center">
          <AppLogo size="lg" />
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
