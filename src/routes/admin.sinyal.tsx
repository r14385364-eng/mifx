import { createFileRoute } from "@tanstack/react-router";

import { SignalAdminPage } from "@/components/admin/SignalAdminPage";

export const Route = createFileRoute("/admin/sinyal")({
  head: () => ({
    meta: [
      { title: "Admin Sinyal — MIFX" },
      {
        name: "description",
        content: "Kelola sinyal trading yang tampil di beranda aplikasi MIFX.",
      },
      { property: "og:title", content: "Admin Sinyal — MIFX" },
      {
        property: "og:description",
        content: "Kelola sinyal trading yang tampil di beranda aplikasi MIFX.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SignalAdminPage,
});
