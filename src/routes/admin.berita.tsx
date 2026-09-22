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
      { property: "og:title", content: "Berita — Gotrade Admin" },
      { property: "og:description", content: "Kelola artikel berita dan edukasi Gotrade." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewsAdminPage,
});
