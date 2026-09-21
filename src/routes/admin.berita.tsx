import { createFileRoute } from "@tanstack/react-router";

import { NewsAdminPage } from "@/components/admin/NewsAdminPage";

export const Route = createFileRoute("/admin/berita")({
  head: () => ({
    meta: [
      { title: "Berita — MIFX Admin" },
      { name: "description", content: "Kelola artikel berita dan edukasi MIFX: tambah, ubah, dan hapus berita." },
      { property: "og:title", content: "Berita — MIFX Admin" },
      { property: "og:description", content: "Kelola artikel berita dan edukasi MIFX." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewsAdminPage,
});
