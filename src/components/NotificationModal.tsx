import {
  Bell,
  CheckCheck,
  ChevronRight,
  Flame,
  Info,
  Pin,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNotifications, type AppNotification } from "@/lib/notifications";

export function NotificationModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, readIds, markAsRead, markAllAsRead, refetch } =
    useNotifications();
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");

  useEffect(() => {
    if (isOpen) {
      void refetch();
    }
  }, [isOpen, refetch]);

  const filtered = useMemo(() => {
    if (selectedFilter === "ALL") return notifications;
    return notifications.filter((n) => n.type === selectedFilter);
  }, [notifications, selectedFilter]);

  const handleActionClick = (notif: AppNotification) => {
    markAsRead(notif.id);
    if (notif.action_url) {
      onClose();
      void navigate({ to: notif.action_url });
    }
  };

  const getTypeVisual = (type: string) => {
    switch (type) {
      case "promo":
        return {
          badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
          icon: Flame,
          label: "Promo",
        };
      case "alert":
        return {
          badge: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
          icon: AlertTriangle,
          label: "Peringatan",
        };
      case "system":
        return {
          badge: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
          icon: ShieldAlert,
          label: "Sistem",
        };
      case "trading":
        return {
          badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
          icon: Sparkles,
          label: "Sinyal",
        };
      default:
        return {
          badge: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
          icon: Info,
          label: "Info",
        };
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[94vw] max-w-md p-0 overflow-hidden max-h-[88dvh] sm:max-h-[82vh] flex flex-col gap-0 rounded-2xl border bg-background shadow-2xl">
        {/* Header - with right padding to clear the Radix Dialog Close X button */}
        <DialogHeader className="p-3.5 sm:p-4 pb-2 border-b bg-muted/20 pr-12 text-left">
          <div className="flex items-center gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Bell className="size-4" />
            </div>
            <DialogTitle className="text-sm sm:text-base font-bold text-foreground truncate">
              Pusat Notifikasi
            </DialogTitle>
            {unreadCount > 0 && (
              <Badge className="bg-rose-500 text-white hover:bg-rose-500 text-[10px] px-1.5 py-0 h-4 shrink-0">
                {unreadCount} baru
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Filter Bar & Mark Read Row */}
        <div className="flex items-center justify-between gap-2 px-3.5 sm:px-4 py-2 border-b bg-background/60">
          <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] -mx-1 px-1 py-0.5 min-w-0 flex-1">
            <Button
              variant={selectedFilter === "ALL" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedFilter("ALL")}
              className="h-6 sm:h-7 text-[10px] sm:text-[11px] px-2.5 rounded-full shrink-0"
            >
              Semua
            </Button>
            <Button
              variant={selectedFilter === "promo" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedFilter("promo")}
              className="h-6 sm:h-7 text-[10px] sm:text-[11px] px-2.5 rounded-full shrink-0"
            >
              Promo
            </Button>
            <Button
              variant={selectedFilter === "info" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedFilter("info")}
              className="h-6 sm:h-7 text-[10px] sm:text-[11px] px-2.5 rounded-full shrink-0"
            >
              Info
            </Button>
            <Button
              variant={selectedFilter === "alert" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedFilter("alert")}
              className="h-6 sm:h-7 text-[10px] sm:text-[11px] px-2.5 rounded-full shrink-0"
            >
              Peringatan
            </Button>
            <Button
              variant={selectedFilter === "system" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedFilter("system")}
              className="h-6 sm:h-7 text-[10px] sm:text-[11px] px-2.5 rounded-full shrink-0"
            >
              Sistem
            </Button>
          </div>

          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-6 sm:h-7 text-[10px] sm:text-[11px] gap-1 text-muted-foreground hover:text-foreground px-2 shrink-0 cursor-pointer"
            >
              <CheckCheck className="size-3" />
              <span className="hidden xs:inline">Tandai</span> Dibaca
            </Button>
          )}
        </div>

        {/* Notifications Scroll Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 overscroll-contain touch-pan-y">
          {loading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-xs gap-2">
              <RefreshCw className="size-4 animate-spin text-primary" />
              Memuat notifikasi terbaru...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-muted/60 mb-2">
                <Bell className="size-6 text-muted-foreground/40" />
              </div>
              <p className="text-xs font-semibold text-foreground">Tidak Ada Pesan</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 max-w-[220px]">
                {selectedFilter === "ALL"
                  ? "Saat ini belum ada notifikasi baru untuk akun Anda."
                  : `Tidak ada notifikasi untuk kategori "${selectedFilter}".`}
              </p>
            </div>
          ) : (
            filtered.map((notif) => {
              const isRead = readIds.includes(notif.id);
              const visual = getTypeVisual(notif.type);
              const timeStr = new Date(notif.created_at).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  className={`group relative flex flex-col gap-1.5 p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer ${
                    !isRead
                      ? "bg-primary/5 border-primary/25 shadow-xs"
                      : "bg-card/70 border-border/50 hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                      {notif.is_pinned && (
                        <Badge className="bg-amber-500 text-white text-[9px] px-1.5 py-0 h-4 gap-0.5 shrink-0">
                          <Pin className="size-2.5 fill-current" /> Pin
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1.5 py-0 h-4 shrink-0 font-medium ${visual.badge}`}
                      >
                        {notif.badge || visual.label}
                      </Badge>
                      {!isRead && (
                        <span className="flex size-2 rounded-full bg-rose-500 shrink-0 animate-pulse" />
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
                      {timeStr}
                    </span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-foreground leading-snug break-words">
                    {notif.title}
                  </h4>

                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed whitespace-pre-line break-words">
                    {notif.message}
                  </p>

                  {notif.action_url && (
                    <div className="pt-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActionClick(notif);
                        }}
                        className="h-7 text-[11px] text-primary gap-1 font-semibold hover:bg-primary/15 active:scale-98"
                      >
                        Buka Halaman Terkait <ChevronRight className="size-3" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
