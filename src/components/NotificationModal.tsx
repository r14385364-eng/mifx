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
          border: "border-l-amber-500",
        };
      case "alert":
        return {
          badge: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
          icon: AlertTriangle,
          label: "Peringatan",
          border: "border-l-rose-500",
        };
      case "system":
        return {
          badge: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
          icon: ShieldAlert,
          label: "Sistem",
          border: "border-l-purple-500",
        };
      case "trading":
        return {
          badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
          icon: Sparkles,
          label: "Sinyal",
          border: "border-l-emerald-500",
        };
      default:
        return {
          badge: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
          icon: Info,
          label: "Info",
          border: "border-l-blue-500",
        };
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden max-h-[85vh] flex flex-col gap-0">
        <DialogHeader className="p-4 pb-2 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Bell className="size-4" />
              </div>
              <DialogTitle className="text-base font-bold">Pusat Notifikasi</DialogTitle>
              {unreadCount > 0 && (
                <Badge className="bg-rose-500 text-white hover:bg-rose-500 text-[10px] px-1.5 py-0 h-4">
                  {unreadCount} baru
                </Badge>
              )}
            </div>

            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-7 text-[11px] gap-1 text-muted-foreground hover:text-foreground px-2"
              >
                <CheckCheck className="size-3.5" />
                Tandai Dibaca
              </Button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-1 pt-2 overflow-x-auto [scrollbar-width:none]">
            <Button
              variant={selectedFilter === "ALL" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedFilter("ALL")}
              className="h-7 text-[11px] px-2.5 rounded-full"
            >
              Semua
            </Button>
            <Button
              variant={selectedFilter === "promo" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedFilter("promo")}
              className="h-7 text-[11px] px-2.5 rounded-full"
            >
              Promo
            </Button>
            <Button
              variant={selectedFilter === "info" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedFilter("info")}
              className="h-7 text-[11px] px-2.5 rounded-full"
            >
              Info
            </Button>
            <Button
              variant={selectedFilter === "alert" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedFilter("alert")}
              className="h-7 text-[11px] px-2.5 rounded-full"
            >
              Peringatan
            </Button>
            <Button
              variant={selectedFilter === "system" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedFilter("system")}
              className="h-7 text-[11px] px-2.5 rounded-full"
            >
              Sistem
            </Button>
          </div>
        </DialogHeader>

        {/* Notifications Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-border/40">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-xs gap-2">
              <RefreshCw className="size-4 animate-spin text-primary" />
              Memuat notifikasi...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Bell className="size-8 text-muted-foreground/40 mb-2" />
              <p className="text-xs font-semibold text-foreground">Tidak Ada Pesan</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Saat ini belum ada notifikasi baru untuk Anda.
              </p>
            </div>
          ) : (
            filtered.map((notif) => {
              const isRead = readIds.includes(notif.id);
              const visual = getTypeVisual(notif.type);
              const VisualIcon = visual.icon;
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
                  className={`pt-3 first:pt-0 group relative flex flex-col gap-1.5 transition-colors cursor-pointer ${
                    !isRead ? "opacity-100" : "opacity-80"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {notif.is_pinned && (
                        <Badge className="bg-amber-500 text-white text-[9px] px-1 py-0 h-3.5 gap-0.5">
                          <Pin className="size-2 fill-current" /> Pin
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1.5 py-0 h-3.5 ${visual.badge}`}
                      >
                        {notif.badge || visual.label}
                      </Badge>
                      {!isRead && <span className="size-2 rounded-full bg-primary shrink-0" />}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{timeStr}</span>
                  </div>

                  <h4 className="text-xs font-bold text-foreground leading-snug">{notif.title}</h4>

                  <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-line">
                    {notif.message}
                  </p>

                  {notif.action_url && (
                    <div className="pt-1">
                      <Button
                        variant="link"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActionClick(notif);
                        }}
                        className="h-auto p-0 text-[11px] text-primary gap-1 font-semibold hover:underline"
                      >
                        Buka Tautan Terkait <ChevronRight className="size-3" />
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
