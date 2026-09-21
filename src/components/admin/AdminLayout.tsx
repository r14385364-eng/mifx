import { Link, useRouterState } from "@tanstack/react-router";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CircleDollarSign,
  Gift,
  LogOut,
  Newspaper,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navigation = [
  { label: "Top Up", to: "/admin/top-up" as const, icon: ArrowDownToLine },
  { label: "Withdraw", to: "/admin/withdraw" as const, icon: ArrowUpFromLine },
];

const contentNavigation = [
  { label: "Berita", to: "/admin/berita" as const, icon: Newspaper },
  { label: "Mata Uang", to: "/admin/mata-uang" as const, icon: CircleDollarSign },
  { label: "Sinyal", to: "/admin/sinyal" as const, icon: TrendingUp },
];

const userNavigation = [
  { label: "Manajemen User", to: "/admin/users" as const, icon: Users },
  { label: "Referral", to: "/admin/referral" as const, icon: Gift },
];

export function AdminLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <SidebarProvider>
      <div className="flex min-h-svh w-full bg-muted/40">
        <Sidebar collapsible="icon" className="border-sidebar-border">
          <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
            <Link to="/admin/top-up" className="flex items-center gap-3 overflow-hidden px-1">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <ShieldCheck className="size-5" />
              </span>
              <span className="min-w-0 group-data-[collapsible=icon]:hidden">
                <span className="block text-sm font-extrabold">MIFX Admin</span>
                <span className="block text-[11px] text-sidebar-foreground/60">
                  Transaction Center
                </span>
              </span>
            </Link>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup className="pt-5">
              <SidebarGroupLabel>TRANSAKSI</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigation.map((item) => (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.to}
                        tooltip={item.label}
                        size="lg"
                        className="data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                      >
                        <Link to={item.to}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>KONTEN</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {contentNavigation.map((item) => (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.to}
                        tooltip={item.label}
                        size="lg"
                        className="data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                      >
                        <Link to={item.to}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>PENGGUNA</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {userNavigation.map((item) => (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.to}
                        tooltip={item.label}
                        size="lg"
                        className="data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                      >
                        <Link to={item.to}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border p-3">
            <div className="flex items-center gap-3 overflow-hidden px-1 py-2 group-data-[collapsible=icon]:px-0">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
                AD
              </span>
              <span className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <span className="block truncate text-xs font-semibold">Admin MIFX</span>
                <span className="block truncate text-[11px] text-sidebar-foreground/60">
                  admin@mifx.com
                </span>
              </span>
            </div>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Kembali ke aplikasi">
                  <Link to="/beranda">
                    <LogOut />
                    <span>Kembali ke aplikasi</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <SidebarInset className="min-w-0 bg-muted/40">
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur md:px-7">
            <SidebarTrigger className="size-9" aria-label="Buka atau tutup menu" />
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold text-foreground">{title}</h1>
              <p className="hidden text-xs text-muted-foreground sm:block">{subtitle}</p>
            </div>
            <div className="ml-auto flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-xs text-muted-foreground">
              <span className="size-2 rounded-full bg-primary" />
              <span className="hidden sm:inline">Sistem aktif</span>
            </div>
          </header>
          <main className="w-full flex-1 p-4 md:p-7">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
