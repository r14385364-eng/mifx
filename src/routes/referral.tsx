import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Copy, Gift, Share2, UserPlus, Users, Wallet } from "lucide-react";
import { useState } from "react";

import { BottomNav } from "@/components/BottomNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/referral")({
  head: () => ({
    meta: [
      { title: "Referral — Gotrade" },
      {
        name: "description",
        content:
          "Bagikan kode referral Gotrade kamu, ajak teman trading, dan kumpulkan komisi dari setiap undangan yang berhasil.",
      },
      { property: "og:title", content: "Referral — Gotrade" },
      {
        property: "og:description",
        content:
          "Bagikan kode referral Gotrade kamu, ajak teman trading, dan kumpulkan komisi dari setiap undangan yang berhasil.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReferralPage,
});

const referralCode = "GOTRADE-AND12";
const referralLink = "https://gotrade.app/r/GOTRADE-AND12";

type InvitedFriend = {
  name: string;
  joinedAt: string;
  status: string;
  commission: number;
};

const invitedFriends: InvitedFriend[] = [];

const steps = [
  { title: "Bagikan kode", desc: "Kirim kode atau tautan referral ke teman kamu." },
  { title: "Teman mendaftar", desc: "Teman membuat akun memakai kode referral kamu." },
  { title: "Dapat komisi", desc: "Komisi masuk otomatis setelah teman deposit pertama." },
];

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ReferralPage() {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  const totalCommission = invitedFriends.reduce((sum, f) => sum + f.commission, 0);
  const activeFriends = invitedFriends.filter((f) => f.status === "Aktif").length;

  const copy = async (value: string, key: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  };

  return (
    <div className="min-h-svh bg-background pb-24">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <Link
          to="/beranda"
          aria-label="Kembali ke beranda"
          className="flex size-9 items-center justify-center rounded-full border text-foreground"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="text-base font-bold">Referral</h1>
      </header>

      <div className="space-y-4 p-4">
        {/* Kartu kode referral */}
        <Card className="overflow-hidden border-primary/30 bg-primary/5">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Gift className="size-5" />
              </span>
              <div>
                <p className="text-sm font-bold">Ajak teman, dapat komisi</p>
                <p className="text-xs text-muted-foreground">
                  Dapatkan hingga {formatRupiah(200000)} untuk setiap teman yang deposit pertama.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-primary/40 bg-background p-4">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Kode referral kamu
              </p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <span className="text-xl font-extrabold tracking-wider">{referralCode}</span>
                <Button size="sm" variant="secondary" onClick={() => copy(referralCode, "code")}>
                  {copied === "code" ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {copied === "code" ? "Tersalin" : "Salin"}
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => copy(referralLink, "link")}>
                {copied === "link" ? <Check className="size-4" /> : <Copy className="size-4" />}
                Salin tautan
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => copy(referralLink, "link")}
              >
                <Share2 className="size-4" />
                Bagikan
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Statistik */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <UserPlus className="mx-auto size-4 text-muted-foreground" />
              <p className="mt-2 text-lg font-extrabold">{invitedFriends.length}</p>
              <p className="text-[11px] text-muted-foreground">Total diajak</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="mx-auto size-4 text-muted-foreground" />
              <p className="mt-2 text-lg font-extrabold">{activeFriends}</p>
              <p className="text-[11px] text-muted-foreground">Teman aktif</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Wallet className="mx-auto size-4 text-muted-foreground" />
              <p className="mt-2 text-sm font-extrabold tabular-nums">
                {formatRupiah(totalCommission)}
              </p>
              <p className="text-[11px] text-muted-foreground">Total komisi</p>
            </CardContent>
          </Card>
        </div>

        {/* Cara kerja */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cara kerjanya</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {steps.map((step, index) => (
              <div key={step.title} className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Daftar teman */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Teman yang kamu ajak</CardTitle>
          </CardHeader>
          <CardContent className={invitedFriends.length > 0 ? "divide-y p-0" : "p-6 text-center"}>
            {invitedFriends.length === 0 ? (
              <div className="py-4">
                <Users className="mx-auto size-8 text-muted-foreground/60" />
                <p className="mt-2 text-sm font-semibold text-foreground">
                  Belum ada teman yang bergabung
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Bagikan kode atau tautan referral kamu untuk mulai mengumpulkan komisi!
                </p>
              </div>
            ) : (
              invitedFriends.map((friend) => (
                <div key={friend.name} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
                    {friend.name
                      .split(" ")
                      .slice(0, 2)
                      .map((p) => p[0])
                      .join("")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{friend.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Gabung {formatDate(friend.joinedAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-[10px]">
                      {friend.status}
                    </Badge>
                    <p className="mt-1 text-xs font-semibold tabular-nums">
                      {formatRupiah(friend.commission)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <BottomNav active="Beranda" />
    </div>
  );
}
