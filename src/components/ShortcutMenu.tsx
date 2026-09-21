import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

export type ShortcutItem = {
  label: string;
  icon: LucideIcon;
  to?: "/deposit" | "/withdraw" | "/referral" | "/berita" | "/pasar" | "/order" | "/trade" | "/profil" | "/beranda";
};

/**
 * Grid menu pintasan (ikon lingkaran) seperti di halaman Beranda.
 * Dipakai ulang di halaman lain dengan item yang disesuaikan.
 */
export function ShortcutMenu({ items }: { items: ShortcutItem[] }) {
  return (
    <div className="grid grid-cols-6 gap-1">
      {items.map((item) => {
        const inner = (
          <>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
              <item.icon className="h-5 w-5 text-primary" />
            </span>
            <span className="text-[11px] font-medium text-foreground">{item.label}</span>
          </>
        );
        const cls = "flex flex-col items-center gap-2 rounded-lg py-2 transition-colors hover:bg-muted";
        if (item.to) {
          return (
            <Link key={item.label} to={item.to} className={cls}>
              {inner}
            </Link>
          );
        }
        return (
          <button key={item.label} type="button" className={cls}>
            {inner}
          </button>
        );
      })}
    </div>
  );
}
