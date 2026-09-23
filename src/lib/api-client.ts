// Centralized secure API client with RBAC, Authentication, and In-Memory Sub-Second Response Acceleration
import { toast } from "sonner";

interface CacheEntry {
  responseBody: string;
  status: number;
  statusText: string;
  headers: [string, string][];
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5000; // 5s fresh cache for instant page switches

export function clearApiCache() {
  memoryCache.clear();
}

export async function secureFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const method = (options.method || "GET").toUpperCase();
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("gotrade_token") || localStorage.getItem("mifx_token")
      : null;

  // Clear cache on mutation requests (POST, PUT, DELETE, PATCH)
  if (method !== "GET" && method !== "HEAD") {
    clearApiCache();
  }

  const headers = new Headers(options.headers || {});

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const cacheKey = `${method}:${url}:${token || "anon"}`;

  // Check in-memory cache for GET requests for sub-millisecond response
  if (method === "GET") {
    const cached = memoryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return new Response(cached.responseBody, {
        status: cached.status,
        statusText: cached.statusText,
        headers: new Headers(cached.headers),
      });
    }
  }

  const mergedOptions: RequestInit = {
    ...options,
    headers,
    credentials: "include",
  };

  try {
    const res = await fetch(url, mergedOptions);

    if (res.status === 401) {
      // Unauthorized
      if (url !== "/api/auth/me") {
        toast.error("Sesi Berakhir", {
          description: "Harap login kembali untuk melanjutkan tindakan ini.",
        });
      }
    } else if (res.status === 403) {
      // Forbidden / RBAC restriction
      toast.error("Akses Ditolak (RBAC 403)", {
        description: "Tindakan ini memerlukan izin Administrator.",
      });
    } else if (res.status === 429) {
      // Rate limit
      toast.error("Terlalu Banyak Permintaan", {
        description: "Harap tunggu sejenak sebelum mencoba kembali.",
      });
    }

    // Cache successful GET responses for instant navigation
    if (method === "GET" && res.ok) {
      try {
        const cloned = res.clone();
        const text = await cloned.text();
        const headerEntries: [string, string][] = [];
        res.headers.forEach((val, key) => {
          headerEntries.push([key, val]);
        });

        memoryCache.set(cacheKey, {
          responseBody: text,
          status: res.status,
          statusText: res.statusText,
          headers: headerEntries,
          timestamp: Date.now(),
        });

        return new Response(text, {
          status: res.status,
          statusText: res.statusText,
          headers: res.headers,
        });
      } catch {
        // Fallback to returning original response
      }
    }

    return res;
  } catch (error) {
    console.error("Network / API Error:", error);
    throw error;
  }
}
