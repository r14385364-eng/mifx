import { Link } from "@tanstack/react-router";
import { CandlestickChart, ClipboardList, Home, LineChart, MoreHorizontal } from "lucide-react";

const items = [
  { label: "Beranda", icon: Home, to: "/beranda" as const },
  { label: "Pasar", icon: CandlestickChart, to: "/pasar" as const },
  { label: "Trade", icon: LineChart, to: "/trade" as const },
  { label: "Order", icon: ClipboardList, to: "/order" as const },
  { label: "Lainnya", icon: MoreHorizontal, to: "/lainnya" as const },
];

export function BottomNav({ active }: { active: string }) {
  return (
    <nav className="sticky bottom-0 z-30 border-t border-gray-200 bg-white">
      <div className="grid grid-cols-5">
        {items.map((item) => {
          const isActive = item.label === active;
          const isLainnya = item.label === "Lainnya";

          return (
            <Link
              key={item.label}
              to={item.to}
              className={`flex flex-col items-center justify-center gap-1 py-2 transition-colors ${
                isActive ? "text-[#00a651]" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {isLainnya && isActive ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#00a651] text-white">
                  <MoreHorizontal className="h-4 w-4" />
                </div>
              ) : (
                <item.icon className="h-5 w-5" />
              )}
              <span
                className={`text-[11px] ${isActive ? "font-semibold text-[#00a651]" : "font-medium"}`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
