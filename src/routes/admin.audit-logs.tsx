import { createFileRoute } from "@tanstack/react-router";
import { AuditLogsAdminPage } from "@/components/admin/AuditLogsAdminPage";

export const Route = createFileRoute("/admin/audit-logs")({
  head: () => ({
    meta: [
      { title: "Audit Log & RBAC — Gotrade Admin" },
      {
        name: "description",
        content: "Pemantauan keamanan, kontrol hak akses RBAC, dan audit log Gotrade.",
      },
      { property: "og:title", content: "Audit Log & RBAC — Gotrade Admin" },
      {
        property: "og:description",
        content: "Pemantauan keamanan, kontrol hak akses RBAC, dan audit log Gotrade.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuditLogsAdminPage,
});
