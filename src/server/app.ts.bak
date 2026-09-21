import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { initDatabase, isDatabaseInMemory, query, DbUser } from "./db";

export const app = express();

app.use(cors());
app.use(express.json());

// In-memory token sessions
const activeSessions = new Map<string, number>();

function generateToken(userId: number): string {
  const token = `mifx_tok_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  activeSessions.set(token, userId);
  return token;
}

// Ensure database is initialized on server startup
let dbInitPromise: Promise<void> | null = null;
export function ensureDbReady(): Promise<void> {
  if (!dbInitPromise) {
    dbInitPromise = initDatabase().catch((err) => {
      console.error("[Database] Error during initDatabase:", err);
    });
  }
  return dbInitPromise;
}

// Middleware to ensure DB is initialized before handling requests
app.use(async (_req: Request, _res: Response, next: NextFunction) => {
  await ensureDbReady();
  next();
});

// Health check endpoint
app.get("/api/health", async (_req: Request, res: Response) => {
  try {
    const userCount = await query<{ count: string }>("SELECT COUNT(*) as count FROM users");
    res.json({
      status: "ok",
      server: "Online",
      database: "Connected",
      totalUsers: parseInt(userCount[0]?.count || "0", 10),
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error";
    res.status(500).json({ status: "error", message });
  }
});

// Accounts info endpoint
app.get("/api/auth/demo-accounts", (_req: Request, res: Response) => {
  res.json({
    accounts: [
      {
        role: "user",
        title: "Akun Trader",
        email: "user@mifx.com",
        password: "user123",
        name: "Trader MIFX",
        accountNumber: "88910243",
        description: "Akses menu Trading, Pasar, Portfolio, Deposit & Penarikan Dana",
        badge: "Akun Trader",
        badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      },
      {
        role: "admin",
        title: "Akun Administrator",
        email: "admin@mifx.com",
        password: "admin123",
        name: "Administrator MIFX",
        accountNumber: "10000001",
        description: "Akses penuh Dashboard Admin, Kelola Pengguna, Sinyal & Berita",
        badge: "Super Admin",
        badgeColor: "bg-purple-500/10 text-purple-600 border-purple-500/20",
      },
    ],
  });
});

// Login endpoint
app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Email dan password wajib diisi.",
      });
      return;
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const rows = await query<DbUser>(
      "SELECT * FROM users WHERE LOWER(email) = $1 AND password = $2",
      [trimmedEmail, String(password).trim()],
    );

    if (rows.length === 0) {
      res.status(401).json({
        success: false,
        message: "Email atau password salah. Cek akun yang tersedia.",
      });
      return;
    }

    const user = rows[0];
    const token = generateToken(user.id);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        accountNumber: user.account_number,
        balance: Number(user.balance),
        accountType: user.account_type,
        createdAt: user.created_at,
      },
    });
  } catch (err: unknown) {
    console.error("[Auth API] Login error:", err);
    res.status(500).json({ success: false, message: "Terjadi kesalahan pada server." });
  }
});

// Current user profile endpoint
app.get("/api/auth/me", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : "";

    if (!token || !activeSessions.has(token)) {
      res.status(401).json({ success: false, message: "Sesi tidak valid atau telah berakhir." });
      return;
    }

    const userId = activeSessions.get(token);
    const rows = await query<DbUser>("SELECT * FROM users WHERE id = $1", [userId]);

    if (rows.length === 0) {
      res.status(404).json({ success: false, message: "Pengguna tidak ditemukan." });
      return;
    }

    const user = rows[0];
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        accountNumber: user.account_number,
        balance: Number(user.balance),
        accountType: user.account_type,
        createdAt: user.created_at,
      },
    });
  } catch (err: unknown) {
    console.error("[Auth API] Me error:", err);
    res.status(500).json({ success: false, message: "Terjadi kesalahan pada server." });
  }
});

// Logout endpoint
app.post("/api/auth/logout", (req: Request, res: Response) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : "";
  if (token) {
    activeSessions.delete(token);
  }
  res.json({ success: true, message: "Berhasil keluar dari akun." });
});

// Admin list users endpoint
app.get("/api/admin/users", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : "";
    const userId = activeSessions.get(token);

    if (!userId) {
      res.status(401).json({ success: false, message: "Harus login sebagai admin." });
      return;
    }

    const adminCheck = await query<DbUser>("SELECT role FROM users WHERE id = $1", [userId]);
    if (adminCheck[0]?.role !== "admin") {
      res.status(403).json({ success: false, message: "Akses khusus administrator." });
      return;
    }

    const users = await query<DbUser>(
      "SELECT id, name, email, phone, role, account_number, balance, account_type, created_at FROM users ORDER BY id ASC",
    );
    res.json({ success: true, users });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error";
    res.status(500).json({ success: false, message });
  }
});
