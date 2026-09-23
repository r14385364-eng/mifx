import { createFileRoute } from "@tanstack/react-router";

import { CurrencyAdminPage } from "@/components/admin/CurrencyAdminPage";

export const Route = createFileRoute("/admin/mata-uang")({
  head: () => ({
    meta: [
      { title: "Mata Uang — Gotrade Admin" },
      {
        name: "description",
        content: "Kelola instrumen pasar dan pengaturan pergerakan harga simulasi Gotrade.",
      },
    ],
  }),
  component: CurrencyAdminPage,
});
