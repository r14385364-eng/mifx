import { createFileRoute } from "@tanstack/react-router";

import { UsersAdminPage } from "@/components/admin/UsersAdminPage";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Manajemen User — MIFX Admin" },
      {
        name: "description",
        content: "Lihat pengguna terdaftar dan saldo akun masing-masing pengguna MIFX.",
      },
      { property: "og:title", content: "Manajemen User — MIFX Admin" },
      {
        property: "og:description",
        content: "Lihat pengguna terdaftar dan saldo akun masing-masing pengguna MIFX.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UsersAdminPage,
});
