import { useCallback, useEffect, useMemo, useState } from "react";

export interface AppNotification {
  id: number;
  title: string;
  message: string;
  type: string;
  target: string;
  is_pinned: boolean;
  badge: string | null;
  author: string;
  action_url: string | null;
  created_at: string;
}

const READ_STORAGE_KEY = "gotrade_read_notifications";

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [readIds, setReadIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(READ_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (res.ok && data.success) {
        setNotifications(data.notifications || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !readIds.includes(n.id)).length;
  }, [notifications, readIds]);

  const markAsRead = useCallback((id: number) => {
    setReadIds((prev) => {
      if (!prev.includes(id)) {
        const updated = [...prev, id];
        try {
          localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      }
      return prev;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((currentNotifs) => {
      const allIds = currentNotifs.map((n) => n.id);
      setReadIds(allIds);
      try {
        localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(allIds));
      } catch {
        // ignore
      }
      return currentNotifs;
    });
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    readIds,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}
