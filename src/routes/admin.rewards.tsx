import { createFileRoute } from "@tanstack/react-router";

import { RewardsAdminPage } from "@/components/admin/RewardsAdminPage";

export const Route = createFileRoute("/admin/rewards")({
  head: () => ({
    meta: [
      { title: "Manajemen Rewards — Gotrade Admin" },
      {
        name: "description",
        content:
          "Kelola katalog hadiah reward pengguna, bobot poin saldo, stok produk, dan verifikasi penukaran klaim hadiah.",
      },
    ],
  }),
  component: RewardsAdminPage,
});
