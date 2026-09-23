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
  updated_at?: string;
}

const READ_STORAGE_KEY = "gotrade_read_notifications";
const SYNC_STORAGE_KEY = "gotrade_notif_sync";

function getStoredReadIds(): number[] {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const saved = localStorage.getItem(READ_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as number[]) : [];
    }
  } catch {
    // ignore storage errors
  }
  return [];
}

function saveStoredReadIds(ids: number[]) {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(ids));
    }
  } catch {
    // ignore
  }
}

// Global in-memory cache and subscribers to ensure instant synchronization
let globalNotifications: AppNotification[] = [];
let globalReadIds: number[] = getStoredReadIds();
let isFetching = false;
const listeners = new Set<() => void>();

function notifyAllListeners() {
  for (const listener of listeners) {
    try {
      listener();
    } catch {
      // ignore
    }
  }
}

export async function syncNotifications() {
  if (isFetching) return;
  isFetching = true;
  try {
    const res = await fetch("/api/notifications");
    const data = await res.json();
    if (res.ok && data.success && Array.isArray(data.notifications)) {
      globalNotifications = data.notifications;
      notifyAllListeners();
    }
  } catch {
    // ignore network failures
  } finally {
    isFetching = false;
  }
}

export function broadcastNotificationUpdate() {
  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("gotrade_notifications_updated"));
      if (window.localStorage) {
        localStorage.setItem(SYNC_STORAGE_KEY, String(Date.now()));
      }
    }
  } catch {
    // ignore
  }
}

// Setup background poller and cross-tab/window event listeners
if (typeof window !== "undefined") {
  // Initial sync immediately
  void syncNotifications();

  // Background polling every 3.5 seconds
  setInterval(() => {
    void syncNotifications();
  }, 3500);

  // Focus & visibility change detection
  window.addEventListener("focus", () => void syncNotifications());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      void syncNotifications();
    }
  });

  // Cross-component & cross-tab sync
  window.addEventListener("gotrade_notifications_updated", () => {
    void syncNotifications();
  });

  window.addEventListener("storage", (e) => {
    if (e.key === SYNC_STORAGE_KEY) {
      void syncNotifications();
    } else if (e.key === READ_STORAGE_KEY) {
      globalReadIds = getStoredReadIds();
      notifyAllListeners();
    }
  });
}

export function useNotifications() {
  const [data, setData] = useState(() => ({
    notifications: globalNotifications,
    readIds: globalReadIds,
    loading: isFetching,
  }));

  useEffect(() => {
    const onChange = () => {
      setData({
        notifications: globalNotifications,
        readIds: globalReadIds,
        loading: isFetching,
      });
    };
    listeners.add(onChange);
    void syncNotifications();
    return () => {
      listeners.delete(onChange);
    };
  }, []);

  const unreadCount = useMemo(() => {
    return data.notifications.filter((n) => !data.readIds.includes(n.id)).length;
  }, [data.notifications, data.readIds]);

  const markAsRead = useCallback((id: number) => {
    if (!globalReadIds.includes(id)) {
      globalReadIds = [...globalReadIds, id];
      saveStoredReadIds(globalReadIds);
      notifyAllListeners();
    }
  }, []);

  const markAllAsRead = useCallback(() => {
    globalReadIds = globalNotifications.map((n) => n.id);
    saveStoredReadIds(globalReadIds);
    notifyAllListeners();
  }, []);

  return {
    notifications: data.notifications,
    unreadCount,
    loading: data.loading,
    readIds: data.readIds,
    markAsRead,
    markAllAsRead,
    refetch: syncNotifications,
  };
}
