import { createFileRoute } from "@tanstack/react-router";

import { TransactionPage, type Transaction } from "@/components/admin/TransactionPage";

export const Route = createFileRoute("/admin/top-up")({
  head: () => ({
    meta: [
      { title: "Top Up — Gotrade Admin" },
      { name: "description", content: "Kelola dan tinjau permintaan top up pengguna Gotrade." },
    ],
  }),
  component: TopUpAdminPage,
});

const transactions: Transaction[] = [];

function TopUpAdminPage() {
  return <TransactionPage type="Top Up" transactions={transactions} />;
}
