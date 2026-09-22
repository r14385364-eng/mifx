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
      { property: "og:title", content: "Mata Uang — Gotrade Admin" },
      {
        property: "og:description",
        content: "Kelola instrumen pasar dan pengaturan pergerakan harga simulasi Gotrade.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CurrencyAdminPage,
});
