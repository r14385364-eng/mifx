import { createFileRoute } from "@tanstack/react-router";

import { ReferralAdminPage } from "@/components/admin/ReferralAdminPage";

export const Route = createFileRoute("/admin/referral")({
  head: () => ({
    meta: [
      { title: "Manajemen Referral — Gotrade Admin" },
      {
        name: "description",
        content:
          "Pantau kode referral setiap pengguna Gotrade dan jumlah orang yang berhasil mereka ajak.",
      },
    ],
  }),
  component: ReferralAdminPage,
});
