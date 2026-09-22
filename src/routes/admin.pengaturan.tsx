import { createFileRoute } from "@tanstack/react-router";

import { SettingsAdminPage } from "@/components/admin/SettingsAdminPage";

export const Route = createFileRoute("/admin/pengaturan")({
  head: () => ({
    meta: [
      { title: "Pengaturan — Gotrade Admin" },
      {
        name: "description",
        content:
          "Kelola konfigurasi platform, upload gambar QRIS deposit, dan batas transaksi Gotrade.",
      },
      { property: "og:title", content: "Pengaturan — Gotrade Admin" },
      {
        property: "og:description",
        content:
          "Kelola konfigurasi platform, upload gambar QRIS deposit, dan batas transaksi Gotrade.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsAdminPage,
});
