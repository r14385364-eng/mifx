import { createFileRoute } from "@tanstack/react-router";

import { NewsAdminPage } from "@/components/admin/NewsAdminPage";

export const Route = createFileRoute("/admin/berita")({
  head: () => ({
    meta: [
      { title: "Berita — Gotrade Admin" },
      {
        name: "description",
        content: "Kelola artikel berita dan edukasi Gotrade: tambah, ubah, dan hapus berita.",
      },
    ],
  }),
  component: NewsAdminPage,
});
