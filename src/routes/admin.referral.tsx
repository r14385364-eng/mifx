import { createFileRoute } from "@tanstack/react-router";

import { ReferralAdminPage } from "@/components/admin/ReferralAdminPage";

export const Route = createFileRoute("/admin/referral")({
  head: () => ({
    meta: [
      { title: "Manajemen Referral — MIFX Admin" },
      {
        name: "description",
        content:
          "Pantau kode referral setiap pengguna MIFX dan jumlah orang yang berhasil mereka ajak.",
      },
      { property: "og:title", content: "Manajemen Referral — MIFX Admin" },
      {
        property: "og:description",
        content:
          "Pantau kode referral setiap pengguna MIFX dan jumlah orang yang berhasil mereka ajak.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReferralAdminPage,
});
