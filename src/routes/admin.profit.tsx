import { createFileRoute } from "@tanstack/react-router";

import { ProfitAdminPage } from "@/components/admin/ProfitAdminPage";

export const Route = createFileRoute("/admin/profit")({
  head: () => ({
    meta: [
      { title: "Kelola Profit User — Gotrade Admin" },
      {
        name: "description",
        content: "Kelola dan berikan profit trading langsung ke saldo pengguna terdaftar Gotrade.",
      },
    ],
  }),
  component: ProfitAdminPage,
});
