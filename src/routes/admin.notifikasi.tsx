import { createFileRoute } from "@tanstack/react-router";
import { NotificationsAdminPage } from "@/components/admin/NotificationsAdminPage";

export const Route = createFileRoute("/admin/notifikasi")({
  head: () => ({
    meta: [
      { title: "Notifikasi & Broadcast — Gotrade Admin" },
      {
        name: "description",
        content: "Kelola dan siarkan notifikasi serta pengumuman ke seluruh pengguna Gotrade.",
      },
      { property: "og:title", content: "Notifikasi & Broadcast — Gotrade Admin" },
      {
        property: "og:description",
        content: "Kelola dan siarkan notifikasi serta pengumuman ke seluruh pengguna Gotrade.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NotificationsAdminPage,
});
