import { createFileRoute } from "@tanstack/react-router";

import { TransactionPage, type Transaction } from "@/components/admin/TransactionPage";

export const Route = createFileRoute("/admin/top-up")({
  head: () => ({
    meta: [
      { title: "Top Up — MIFX Admin" },
      { name: "description", content: "Kelola dan tinjau permintaan top up pengguna MIFX." },
      { property: "og:title", content: "Top Up — MIFX Admin" },
      { property: "og:description", content: "Kelola dan tinjau permintaan top up pengguna MIFX." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TopUpAdminPage,
});

const transactions: Transaction[] = [
  {
    id: "TU-240901",
    name: "Budi Santoso",
    account: "1006568912",
    channel: "Bank BCA",
    destination: "•••• 8421",
    amount: 5000000,
    time: "Hari ini, 10:32",
    status: "Menunggu",
  },
  {
    id: "TU-240900",
    name: "Nadia Putri",
    account: "1006568845",
    channel: "GoPay",
    destination: "•••• 0887",
    amount: 1250000,
    time: "Hari ini, 09:48",
    status: "Menunggu",
  },
  {
    id: "TU-240899",
    name: "Rizky Pratama",
    account: "1006568701",
    channel: "Bank Mandiri",
    destination: "•••• 1190",
    amount: 10000000,
    time: "Hari ini, 09:10",
    status: "Berhasil",
  },
  {
    id: "TU-240898",
    name: "Siti Rahma",
    account: "1006568622",
    channel: "DANA",
    destination: "•••• 3312",
    amount: 750000,
    time: "Kemarin, 16:22",
    status: "Ditolak",
  },
  {
    id: "TU-240897",
    name: "Andi Wijaya",
    account: "1006568514",
    channel: "Bank BRI",
    destination: "•••• 5744",
    amount: 2500000,
    time: "Kemarin, 14:05",
    status: "Berhasil",
  },
];

function TopUpAdminPage() {
  return <TransactionPage type="Top Up" transactions={transactions} />;
}
