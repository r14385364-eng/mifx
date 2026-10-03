import { createFileRoute } from "@tanstack/react-router";

import { WithdrawSettingsAdminPage } from "@/components/admin/WithdrawSettingsAdminPage";

export const Route = createFileRoute("/admin/pengaturan-withdraw")({
  head: () => ({
    meta: [
      { title: "Pengaturan Withdraw — Gotrade Admin" },
      {
        name: "description",
        content:
          "Kelola aturan penarikan dana per user, batas maksimal profit, frekuensi harian, biaya admin, dan lainnya.",
      },
    ],
  }),
  component: WithdrawSettingsAdminPage,
});
