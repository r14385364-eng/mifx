import { createFileRoute } from "@tanstack/react-router";

import { SettingsAdminPage } from "@/components/admin/SettingsAdminPage";

export const Route = createFileRoute("/admin/pengaturan")({
  head: () => ({
    meta: [
      { title: "Pengaturan — Gotrade Admin" },
      {
        name: "description",
        content: "Kelola konfigurasi platform dan upload gambar QRIS deposit Gotrade.",
      },
    ],
  }),
  component: SettingsAdminPage,
});
