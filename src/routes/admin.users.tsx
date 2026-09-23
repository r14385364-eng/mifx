import { createFileRoute } from "@tanstack/react-router";

import { UsersAdminPage } from "@/components/admin/UsersAdminPage";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Manajemen User — Gotrade Admin" },
      {
        name: "description",
        content: "Lihat pengguna terdaftar dan saldo akun masing-masing pengguna Gotrade.",
      },
    ],
  }),
  component: UsersAdminPage,
});
