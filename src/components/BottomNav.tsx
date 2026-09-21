import { Link } from "@tanstack/react-router";
import { BookOpen, Home, Info, LineChart, Wallet } from "lucide-react";

const items = [
  { label: "Beranda", icon: Home, to: "/beranda" as const },
  { label: "Pasar", icon: LineChart, to: "/pasar" as const },
  { label: "Trade", icon: Wallet, to: "/trade" as const },
  { label: "Order", icon: BookOpen, to: "/order" as const },
  { label: "Lainnya", icon: Info, to: "/lainnya" as const },
];

export function BottomNav({ active }: { active: string }) {
  return (
    <nav className="sticky bottom-0 z-10 border-t bg-background">
      <div className="grid grid-cols-5">
        {items.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className={`flex flex-col items-center gap-1 py-2.5 ${
              item.label === active ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[11px] font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
