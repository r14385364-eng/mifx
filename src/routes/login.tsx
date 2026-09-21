import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Masuk ke Akun MIFX" },
      {
        name: "description",
        content: "Masuk ke Akun MIFX Anda dengan email dan password untuk mulai trading.",
      },
      { property: "og:title", content: "Masuk ke Akun MIFX" },
      {
        property: "og:description",
        content: "Masuk ke Akun MIFX Anda dengan email dan password untuk mulai trading.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

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
        <div className="mt-14 flex items-center justify-center">
          <span className="flex items-center gap-1.5">
            <span className="flex -skew-x-12 gap-[3px]">
              <span className="h-7 w-[7px] rounded-[2px] bg-[oklch(0.85_0.18_110)]" />
              <span className="h-7 w-[7px] rounded-[2px] bg-[oklch(0.75_0.17_145)]" />
              <span className="h-7 w-[7px] rounded-[2px] bg-[oklch(0.55_0.13_155)]" />
            </span>
            <span className="text-[34px] font-black italic leading-none tracking-tight text-[oklch(0.3_0.05_250)]">
              MIFX
            </span>
          </span>
        </div>

        {/* Form */}
        <form className="mt-12 space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <p className="mb-2 text-[13px] font-medium text-foreground">Email</p>
            <Input
              type="email"
              placeholder="Masukkan email Anda yang terdaftar"
              className="h-12 rounded-lg border-border bg-card text-sm placeholder:text-muted-foreground/60"
            />
          </div>

          <div>
            <p className="mb-2 text-[13px] font-medium text-foreground">Password</p>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
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
            className="h-[52px] w-full rounded-lg bg-primary text-base font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 active:bg-primary/80"
          >
            Masuk
          </button>
        </form>

        {/* Footer */}
        <p className="mt-auto pt-10 text-center text-[13px] text-muted-foreground">
          Belum punya akun?{" "}
          <Link to="/register" className="font-semibold text-primary hover:text-primary/80">
            Buat akun sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}
