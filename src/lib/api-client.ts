// Centralized secure API client with RBAC and Authentication handling
import { toast } from "sonner";

export async function secureFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("gotrade_token") || localStorage.getItem("mifx_token")
      : null;

  const headers = new Headers(options.headers || {});

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
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

    return res;
  } catch (error) {
    console.error("Network / API Error:", error);
    throw error;
  }
}
