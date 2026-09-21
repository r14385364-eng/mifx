import { createFileRoute } from "@tanstack/react-router";

import { TransactionPage, type Transaction } from "@/components/admin/TransactionPage";

export const Route = createFileRoute("/admin/top-up")({
  head: () => ({
    meta: [
      { title: "Top Up — Gotrade Admin" },
      { name: "description", content: "Kelola dan tinjau permintaan top up pengguna Gotrade." },
      { property: "og:title", content: "Top Up — Gotrade Admin" },
      {
        property: "og:description",
        content: "Kelola dan tinjau permintaan top up pengguna Gotrade.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TopUpAdminPage,
});

const transactions: Transaction[] = [];

function TopUpAdminPage() {
  return <TransactionPage type="Top Up" transactions={transactions} />;
}
