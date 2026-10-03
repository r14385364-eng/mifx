import { createFileRoute } from "@tanstack/react-router";

import { WithdrawAdminPage } from "@/components/admin/WithdrawAdminPage";

export const Route = createFileRoute("/admin/withdraw")({
  head: () => ({
    meta: [
      { title: "Kelola Penarikan (Withdraw) — Gotrade Admin" },
      {
        name: "description",
        content:
          "Kelola aturan penarikan dana per user, batas maksimal profit, frekuensi harian, biaya admin, dan proses transaksi penarikan.",
      },
    ],
  }),
  component: WithdrawAdminPage,
});
