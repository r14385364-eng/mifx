import { createFileRoute } from "@tanstack/react-router";

import { TransactionPage, type Transaction } from "@/components/admin/TransactionPage";

export const Route = createFileRoute("/admin/withdraw")({
  head: () => ({
    meta: [
      { title: "Withdraw — MIFX Admin" },
      { name: "description", content: "Kelola dan tinjau permintaan withdraw pengguna MIFX." },
      { property: "og:title", content: "Withdraw — MIFX Admin" },
      { property: "og:description", content: "Kelola dan tinjau permintaan withdraw pengguna MIFX." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WithdrawAdminPage,
});

const transactions: Transaction[] = [
  { id: "WD-180441", name: "Dimas Akbar", account: "1006568209", channel: "Bank BCA", destination: "•••• 2087", amount: 3500000, time: "Hari ini, 11:06", status: "Menunggu" },
  { id: "WD-180440", name: "Maya Lestari", account: "1006568177", channel: "Bank BNI", destination: "•••• 9914", amount: 1000000, time: "Hari ini, 10:15", status: "Menunggu" },
  { id: "WD-180439", name: "Fajar Hidayat", account: "1006568021", channel: "Bank Mandiri", destination: "•••• 4502", amount: 7500000, time: "Hari ini, 08:55", status: "Menunggu" },
  { id: "WD-180438", name: "Putri Maharani", account: "1006567918", channel: "Bank BRI", destination: "•••• 7631", amount: 2250000, time: "Kemarin, 15:40", status: "Berhasil" },
  { id: "WD-180437", name: "Reza Maulana", account: "1006567805", channel: "OVO", destination: "•••• 1448", amount: 500000, time: "Kemarin, 13:12", status: "Ditolak" },
];

function WithdrawAdminPage() {
  return <TransactionPage type="Withdraw" transactions={transactions} />;
}