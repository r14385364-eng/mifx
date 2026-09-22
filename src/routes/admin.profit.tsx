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
      { property: "og:title", content: "Kelola Profit User — Gotrade Admin" },
      {
        property: "og:description",
        content: "Kelola dan berikan profit trading langsung ke saldo pengguna terdaftar Gotrade.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfitAdminPage,
});
