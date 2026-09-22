import { createFileRoute } from "@tanstack/react-router";

import { SignalAdminPage } from "@/components/admin/SignalAdminPage";

export const Route = createFileRoute("/admin/sinyal")({
  head: () => ({
    meta: [
      { title: "Admin Sinyal — Gotrade" },
      {
        name: "description",
        content: "Kelola sinyal trading yang tampil di beranda aplikasi Gotrade.",
      },
      { property: "og:title", content: "Admin Sinyal — Gotrade" },
      {
        property: "og:description",
        content: "Kelola sinyal trading yang tampil di beranda aplikasi Gotrade.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SignalAdminPage,
});
