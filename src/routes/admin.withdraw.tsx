import { createFileRoute } from "@tanstack/react-router";

import { TransactionPage, type Transaction } from "@/components/admin/TransactionPage";

export const Route = createFileRoute("/admin/withdraw")({
  head: () => ({
    meta: [
      { title: "Withdraw — MIFX Admin" },
      { name: "description", content: "Kelola dan tinjau permintaan withdraw pengguna MIFX." },
      { property: "og:title", content: "Withdraw — MIFX Admin" },
      {
        property: "og:description",
        content: "Kelola dan tinjau permintaan withdraw pengguna MIFX.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WithdrawAdminPage,
});

const transactions: Transaction[] = [];

function WithdrawAdminPage() {
  return <TransactionPage type="Withdraw" transactions={transactions} />;
}
