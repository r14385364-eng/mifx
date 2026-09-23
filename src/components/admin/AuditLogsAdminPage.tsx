import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  KeyRound,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  SlidersHorizontal,
  Server,
  Fingerprint,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { secureFetch } from "@/lib/api-client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface AuditLog {
  id: number;
  user_id: number | null;
  user_email: string | null;
  user_role: string | null;
  action: string;
  details: string;
  ip_address: string;
  status: "SUCCESS" | "FAILED" | "BLOCKED" | "WARNING" | string;
  created_at: string;
}

interface SecurityStatus {
  rbacEnforced: boolean;
  tokenEngine: string;
  passwordHashing: string;
  bruteForceProtection: string;
  securityHeaders: string;
}

export function AuditLogsAdminPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<
    "ALL" | "AUTH" | "RBAC" | "TRANSACTION" | "ADMIN"
  >("ALL");

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await secureFetch("/api/admin/audit-logs");
      const data = await res.json();
      if (res.ok && data.success) {
        setLogs(data.logs || []);
        if (data.securityStatus) {
          setSecurityStatus(data.securityStatus);
        }
      } else {
        toast.error("Gagal memuat log audit", {
          description: data.message || "Pastikan Anda memiliki hak akses admin.",
        });
      }
    } catch {
      toast.error("Gagal terhubung ke server untuk memuat log.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Category filter
      if (filterCategory === "AUTH" && !log.action.startsWith("AUTH_")) return false;
      if (filterCategory === "RBAC" && !log.action.includes("RBAC")) return false;
      if (
        filterCategory === "TRANSACTION" &&
        !log.action.includes("TRANSACTION") &&
        !log.action.includes("DEPOSIT") &&
        !log.action.includes("WITHDRAW")
      )
        return false;
      if (filterCategory === "ADMIN" && !log.action.startsWith("ADMIN_")) return false;

      // Text search
      if (!searchTerm) return true;
      const lower = searchTerm.toLowerCase();
      return (
        (log.user_email && log.user_email.toLowerCase().includes(lower)) ||
        log.action.toLowerCase().includes(lower) ||
        (log.details && log.details.toLowerCase().includes(lower)) ||
        (log.ip_address && log.ip_address.includes(lower))
      );
    });
  }, [logs, filterCategory, searchTerm]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 font-medium">
            <CheckCircle2 className="size-3" /> Berhasil
          </Badge>
        );
      case "BLOCKED":
        return (
          <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 gap-1 font-medium">
            <XCircle className="size-3" /> Diblokir (403)
          </Badge>
        );
      case "FAILED":
        return (
          <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 gap-1 font-medium">
            <XCircle className="size-3" /> Gagal
          </Badge>
        );
      case "WARNING":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 font-medium">
            <AlertTriangle className="size-3" /> Peringatan
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "AUTH_LOGIN_SUCCESS":
        return { label: "Login Berhasil", color: "text-emerald-600 dark:text-emerald-400" };
      case "AUTH_LOGIN_FAILED":
        return { label: "Login Gagal (Password Salah)", color: "text-rose-600 dark:text-rose-400" };
      case "AUTH_LOGIN_LOCKED":
        return {
          label: "Brute Force Dibatasi (Lockout)",
          color: "text-red-600 dark:text-red-400 font-bold",
        };
      case "AUTH_REGISTER_SUCCESS":
        return { label: "Pendaftaran Akun Baru", color: "text-blue-600 dark:text-blue-400" };
      case "RBAC_ACCESS_DENIED":
        return {
          label: "Pelanggaran Hak Akses (RBAC)",
          color: "text-red-600 dark:text-red-400 font-bold",
        };
      case "ADMIN_CREATE_USER":
        return { label: "Admin Buat Pengguna", color: "text-indigo-600 dark:text-indigo-400" };
      case "ADMIN_UPDATE_USER":
        return { label: "Admin Perbarui Pengguna", color: "text-amber-600 dark:text-amber-400" };
      case "ADMIN_DELETE_USER":
        return { label: "Admin Hapus Pengguna", color: "text-rose-600 dark:text-rose-400" };
      case "TRANSACTION_APPROVED":
        return { label: "Persetujuan Transaksi", color: "text-emerald-600 dark:text-emerald-400" };
      case "TRANSACTION_REJECTED":
        return { label: "Penolakan Transaksi", color: "text-rose-600 dark:text-rose-400" };
      case "DEPOSIT_REQUESTED":
        return { label: "Pengajuan Deposit", color: "text-blue-600 dark:text-blue-400" };
      case "WITHDRAW_REQUESTED":
        return { label: "Pengajuan Penarikan", color: "text-purple-600 dark:text-purple-400" };
      default:
        return { label: action, color: "text-foreground" };
    }
  };

  return (
    <AdminLayout
      title="Audit Log & Keamanan RBAC"
      subtitle="Pemantauan integritas akses, autentikasi HMAC-SHA256, dan catatan audit keamanan aplikasi."
    >
      <div className="space-y-6">
        {/* Security Posture Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-emerald-500/20 bg-emerald-500/5 shadow-xs">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="size-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">Enforcement RBAC</p>
                <p className="text-sm font-bold text-foreground">Aktif & Berlapis</p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Admin & Trader Isolate
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-blue-500/5 shadow-xs">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Fingerprint className="size-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">Token Session</p>
                <p className="text-sm font-bold text-foreground">HMAC-SHA256 Signed</p>
                <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                  Kebal Manipulasi / Tamper-Proof
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-500/20 bg-amber-500/5 shadow-xs">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <KeyRound className="size-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">Hashing Password</p>
                <p className="text-sm font-bold text-foreground">Salted Scrypt</p>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  Kebal Rainbow Table
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-500/20 bg-purple-500/5 shadow-xs">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Lock className="size-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">Brute-Force Shield</p>
                <p className="text-sm font-bold text-foreground">Rate Limit & Lockout</p>
                <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                  Maks 5x Gagal (Lock 15m)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RBAC Role Matrix Reference Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="size-5 text-primary" />
                  Matriks Hak Akses RBAC (Role-Based Access Control)
                </CardTitle>
                <CardDescription>
                  Struktur kontrol hak akses peran pengguna sesuai prinsip keamanan Principle of
                  Least Privilege.
                </CardDescription>
              </div>
              <Badge variant="outline" className="gap-1 border-primary/30 text-primary font-medium">
                Sistem RBAC Terintegrasi
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border/60 p-4 bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-600 text-white hover:bg-blue-600">
                      Peran: Administrator
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">role: admin</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Akses Penuh
                  </Badge>
                </div>
                <ul className="text-xs space-y-1.5 text-muted-foreground">
                  <li className="flex items-center gap-2 text-foreground">
                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                    <span>
                      <strong>Kelola Pengguna:</strong> Tambah, ubah peran, hapus user, proteksi
                      admin terakhir
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                    <span>
                      <strong>Transaksi Finansial:</strong> Setujui/tolak Top Up, proses penarikan,
                      tambah profit
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                    <span>
                      <strong>Konfigurasi Platform:</strong> Pengaturan sistem, QRIS merchant, kurs
                      mata uang & berita
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                    <span>
                      <strong>Audit Trail & Logs:</strong> Menginspeksi seluruh log akses dan
                      percobaan keamanan
                    </span>
                  </li>
                </ul>
              </div>

              <div className="rounded-xl border border-border/60 p-4 bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-border">
                      Peran: Trader / Regular User
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">role: user</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Data Scoped
                  </Badge>
                </div>
                <ul className="text-xs space-y-1.5 text-muted-foreground">
                  <li className="flex items-center gap-2 text-foreground">
                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                    <span>
                      <strong>Akses Data Pribadi:</strong> Hanya dapat melihat saldo dan profil akun
                      sendiri
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                    <span>
                      <strong>Data Scoping Transaksi:</strong> Terisolasi hanya pada riwayat
                      transaksi miliknya
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-rose-500">
                    <XCircle className="size-3.5 text-rose-500" />
                    <span>
                      <strong>Admin Gate (403 Forbidden):</strong> Dilarang mengakses endpoint
                      /api/users, /admin/*
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-rose-500">
                    <XCircle className="size-3.5 text-rose-500" />
                    <span>
                      <strong>Proteksi Approval:</strong> Tidak dapat mengubah status transaksi atau
                      profit
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Log Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Server className="size-5 text-primary" />
                  Catatan Jejak Audit (Security Audit Trail)
                </CardTitle>
                <CardDescription>
                  Semua aktivitas autentikasi, transaksi, dan perubahan konfigurasi dicatat secara
                  permanen.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void loadLogs()}
                  disabled={loading}
                  className="gap-1.5 text-xs h-8"
                >
                  <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
                  Muat Ulang
                </Button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 pt-3">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Cari email, aksi, detail, atau alamat IP..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 text-xs h-9"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                <Button
                  variant={filterCategory === "ALL" ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-9"
                  onClick={() => setFilterCategory("ALL")}
                >
                  Semua ({logs.length})
                </Button>
                <Button
                  variant={filterCategory === "AUTH" ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-9"
                  onClick={() => setFilterCategory("AUTH")}
                >
                  Autentikasi
                </Button>
                <Button
                  variant={filterCategory === "RBAC" ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-9"
                  onClick={() => setFilterCategory("RBAC")}
                >
                  RBAC (Blokir)
                </Button>
                <Button
                  variant={filterCategory === "TRANSACTION" ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-9"
                  onClick={() => setFilterCategory("TRANSACTION")}
                >
                  Transaksi
                </Button>
                <Button
                  variant={filterCategory === "ADMIN" ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-9"
                  onClick={() => setFilterCategory("ADMIN")}
                >
                  Admin Action
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/40 text-muted-foreground text-left">
                    <th className="py-2.5 px-4 font-medium">Waktu</th>
                    <th className="py-2.5 px-4 font-medium">Status</th>
                    <th className="py-2.5 px-4 font-medium">Aksi Keamanan</th>
                    <th className="py-2.5 px-4 font-medium">Pengguna / Peran</th>
                    <th className="py-2.5 px-4 font-medium">Alamat IP</th>
                    <th className="py-2.5 px-4 font-medium">Rincian Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="size-4 animate-spin text-primary" />
                          Memuat data log audit keamanan...
                        </div>
                      </td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        Tidak ada catatan audit yang sesuai dengan kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      const actionInfo = getActionLabel(log.action);
                      const formattedDate = new Date(log.created_at).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      });

                      return (
                        <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 px-4 whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                            {formattedDate}
                          </td>
                          <td className="py-2.5 px-4 whitespace-nowrap">
                            {getStatusBadge(log.status)}
                          </td>
                          <td className="py-2.5 px-4 whitespace-nowrap">
                            <div className="font-semibold text-foreground">{actionInfo.label}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">
                              {log.action}
                            </div>
                          </td>
                          <td className="py-2.5 px-4 whitespace-nowrap">
                            <div className="font-medium text-foreground">
                              {log.user_email || "Anonim / Publik"}
                            </div>
                            {log.user_role && (
                              <Badge
                                variant="secondary"
                                className={`text-[10px] px-1.5 py-0 h-4 ${
                                  log.user_role === "admin"
                                    ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {log.user_role}
                              </Badge>
                            )}
                          </td>
                          <td className="py-2.5 px-4 whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                            {log.ip_address || "127.0.0.1"}
                          </td>
                          <td className="py-2.5 px-4 max-w-xs md:max-w-md text-foreground">
                            <span className="line-clamp-2" title={log.details}>
                              {log.details || "-"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
