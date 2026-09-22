import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: "user" | "admin";
  accountNumber: string;
  balance: number;
  accountType: string;
  createdAt?: string;
};

export type DemoAccount = {
  role: "user" | "admin";
  title: string;
  email: string;
  password: string;
  name: string;
  accountNumber: string;
  description: string;
  badge: string;
  badgeColor: string;
};

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  demoAccounts: DemoAccount[];
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  loginAsDemo: (role: "user" | "admin") => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const DEFAULT_DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: "user",
    title: "Akun Trader",
    email: "user@gotrade.com",
    password: "user123",
    name: "Trader Gotrade",
    accountNumber: "88910243",
    description: "Akses menu Trading, Pasar, Portfolio, Deposit & Penarikan Dana",
    badge: "Akun Trader",
    badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  {
    role: "admin",
    title: "Akun Administrator",
    email: "admin@gotrade.com",
    password: "admin123",
    name: "Administrator Gotrade",
    accountNumber: "10000001",
    description: "Akses penuh Dashboard Admin, Kelola Pengguna, Sinyal & Berita",
    badge: "Super Admin",
    badgeColor: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  },
];

// In-memory session state (no localStorage)
let memoryToken: string | null = null;
let memoryUser: AuthUser | null = null;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(memoryUser);
  const [token, setToken] = useState<string | null>(memoryToken);
  const [isLoading, setIsLoading] = useState(true);
  const [demoAccounts] = useState<DemoAccount[]>(DEFAULT_DEMO_ACCOUNTS);

  const fetchProfile = useCallback(async (authToken?: string | null) => {
    try {
      const headers: Record<string, string> = {};
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }
      const res = await fetch("/api/auth/me", {
        headers,
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          memoryUser = data.user;
          setUser(data.user);
          if (authToken) {
            memoryToken = authToken;
            setToken(authToken);
          }
        } else {
          memoryToken = null;
          memoryUser = null;
          setToken(null);
          setUser(null);
        }
      } else {
        memoryToken = null;
        memoryUser = null;
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.error("[Auth] Failed to fetch profile:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProfile(token);
  }, [fetchProfile, token]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        memoryToken = data.token;
        memoryUser = data.user;
        setToken(data.token);
        setUser(data.user);
        setIsLoading(false);
        return { success: true };
      }
      setIsLoading(false);
      return { success: false, message: data.message || "Gagal masuk." };
    } catch {
      setIsLoading(false);
      return { success: false, message: "Koneksi ke server gagal." };
    }
  };

  const loginAsDemo = async (role: "user" | "admin") => {
    const demo = demoAccounts.find((d) => d.role === role);
    if (!demo) return { success: false, message: "Akun tidak ditemukan." };
    return await login(demo.email, demo.password);
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
    } catch (e) {
      // ignore logout error
    }
    memoryToken = null;
    memoryUser = null;
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    await fetchProfile(token);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        demoAccounts,
        login,
        loginAsDemo,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
