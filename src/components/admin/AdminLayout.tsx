import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
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
  Database,
  Server,
  Settings,
} from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

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

const systemNavigation = [
  { label: "Pengaturan", to: "/admin/pengaturan" as const, icon: Settings },
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleAdminLogout = async () => {
    await logout();
    toast.success("Admin keluar", { description: "Sesi admin telah ditutup." });
    void navigate({ to: "/login" });
  };

  const adminName = user?.name || "Administrator MIFX";
  const adminEmail = user?.email || "admin@mifx.com";
  const initials = adminName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <SidebarProvider>
      <div className="flex min-h-svh w-full bg-muted/40">
        <Sidebar collapsible="icon" className="border-sidebar-border">
          <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
            <Link to="/admin/top-up" className="flex items-center gap-3 overflow-hidden px-1">
              <img
                src="/logo.jpg"
                alt="Gotrade Logo"
                className="size-9 rounded-none object-contain"
              />
              <span className="min-w-0 group-data-[collapsible=icon]:hidden">
                <span className="block text-sm font-extrabold">Gotrade Admin</span>
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

            <SidebarGroup>
              <SidebarGroupLabel>SISTEM</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {systemNavigation.map((item) => (
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
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-600">
                {initials}
              </span>
              <span className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <span className="block truncate text-xs font-semibold">{adminName}</span>
                <span className="block truncate text-[11px] text-sidebar-foreground/60">
                  {adminEmail}
                </span>
              </span>
            </div>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Kembali ke aplikasi">
                  <Link to="/beranda">
                    <LogOut />
                    <span>Ke Beranda</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleAdminLogout}
                  tooltip="Keluar dari akun admin"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut />
                  <span>Logout Admin</span>
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
