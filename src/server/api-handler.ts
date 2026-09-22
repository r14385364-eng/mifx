import {
  ensureDbReady,
  query,
  isDatabaseInMemory,
  DbUser,
  DbTransaction,
  DbSignal,
  DbNews,
} from "./db";

// In-memory token & session store
const activeSessions = new Map<string, number>();

// In-memory rate limiting store: Key -> array of timestamps
const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(key: string, limit = 15, windowMs = 60000): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(key) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= limit) {
    rateLimitMap.set(key, timestamps);
    return false; // Exceeded
  }
  timestamps.push(now);
  rateLimitMap.set(key, timestamps);
  return true; // Allowed
}

function parseCookies(cookieHeader: string | null): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  const pairs = cookieHeader.split(";");
  for (const pair of pairs) {
    const idx = pair.indexOf("=");
    if (idx > 0) {
      const key = pair.substring(0, idx).trim();
      const val = pair.substring(idx + 1).trim();
      cookies[key] = decodeURIComponent(val);
    }
  }
  return cookies;
}

function generateToken(userId: number): string {
  const token = `gotrade_tok_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  activeSessions.set(token, userId);
  return token;
}

function getUserIdFromToken(token: string): number | null {
  if (!token) return null;
  const existing = activeSessions.get(token);
  if (existing) return existing;

  // Support server reboot / reconnect if token format is valid
  if (token.startsWith("gotrade_tok_")) {
    const parts = token.split("_");
    const parsedId = parseInt(parts[2], 10);
    if (!isNaN(parsedId) && parsedId > 0) {
      activeSessions.set(token, parsedId);
      return parsedId;
    }
  }
  return null;
}

// Security & RBAC response helpers
function jsonResponse(
  data: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "SAMEORIGIN",
      ...extraHeaders,
    },
  });
}

function unauthorizedResponse(
  message = "Autentikasi diperlukan untuk mengakses layanan ini.",
): Response {
  return jsonResponse(
    {
      success: false,
      error: "UNAUTHORIZED",
      message,
    },
    401,
  );
}

function forbiddenResponse(
  message = "Akses ditolak. Tindakan ini memerlukan hak akses Administrator (RBAC).",
): Response {
  return jsonResponse(
    {
      success: false,
      error: "FORBIDDEN",
      message,
    },
    403,
  );
}

function rateLimitResponse(
  message = "Terlalu banyak percobaan. Harap tunggu beberapa saat sebelum mencoba kembali.",
): Response {
  return jsonResponse(
    {
      success: false,
      error: "RATE_LIMITED",
      message,
    },
    429,
  );
}

// Input sanitizer to prevent HTML/script injection
function sanitizeText(input?: string): string {
  if (!input) return "";
  return String(input).replace(/[<>]/g, "").trim();
}

async function getAuthenticatedUser(request: Request): Promise<DbUser | null> {
  const authHeader = request.headers.get("authorization") || "";
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = parseCookies(cookieHeader);
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.substring(7)
    : cookies["gotrade_session"] || cookies["mifx_session"] || "";

  const userId = getUserIdFromToken(token);
  if (!userId) return null;

  try {
    const rows = await query<DbUser>("SELECT * FROM users WHERE id = $1", [userId]);
    return rows.length > 0 ? rows[0] : null;
  } catch {
    return null;
  }
}

async function requireAuth(
  request: Request,
): Promise<{ user: DbUser } | { errorResponse: Response }> {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return { errorResponse: unauthorizedResponse() };
  }
  return { user };
}

async function requireAdmin(
  request: Request,
): Promise<{ user: DbUser } | { errorResponse: Response }> {
  const authResult = await requireAuth(request);
  if ("errorResponse" in authResult) {
    return authResult;
  }
  if (authResult.user.role !== "admin") {
    return { errorResponse: forbiddenResponse() };
  }
  return { user: authResult.user };
}

export async function handleApiRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/")) {
    return null;
  }

  await ensureDbReady();

  // Client identifier for rate limiting
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("cf-connecting-ip") ||
    "client-default";

  // /api/health
  if (url.pathname === "/api/health" && request.method === "GET") {
    try {
      const userCount = await query<{ count: string }>("SELECT COUNT(*) as count FROM users");
      return jsonResponse({
        status: "ok",
        server: "Online",
        database: "Connected",
        totalUsers: parseInt(userCount[0]?.count || "0", 10),
        rbacEnabled: true,
        securityShield: "Active",
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return jsonResponse({ status: "error", message }, 500);
    }
  }

  // /api/auth/demo-accounts
  if (url.pathname === "/api/auth/demo-accounts" && request.method === "GET") {
    const envAdminEmail = process.env.ADMIN_EMAIL?.replace(/^["']|["']$/g, "").trim();
    const envAdminPassword = process.env.ADMIN_PASSWORD?.replace(/^["']|["']$/g, "").trim();

    const accounts = [
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
        email: envAdminEmail || "admin@gotrade.com",
        password: envAdminPassword || "admin123",
        name: envAdminEmail ? "Administrator (.env)" : "Administrator Gotrade",
        accountNumber: "10000001",
        description: "Akses penuh Dashboard Admin, Kelola Pengguna, Sinyal & Berita",
        badge: "Super Admin",
        badgeColor: "bg-purple-500/10 text-purple-600 border-purple-500/20",
      },
    ];

    if (
      envAdminEmail &&
      envAdminEmail !== "admin@gotrade.com" &&
      envAdminEmail !== "admin@mifx.com"
    ) {
      accounts.push({
        role: "admin",
        title: "Akun Admin Cadangan",
        email: "admin@gotrade.com",
        password: "admin123",
        name: "Administrator Gotrade (Default)",
        accountNumber: "10000002",
        description: "Akun admin default cadangan",
        badge: "Backup Admin",
        badgeColor: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      });
    }

    return jsonResponse({ accounts });
  }

  // /api/auth/login (Protected with Rate Limiting)
  if (url.pathname === "/api/auth/login" && request.method === "POST") {
    if (!checkRateLimit(`login_${clientIp}`, 15, 60000)) {
      return rateLimitResponse("Terlalu banyak percobaan login. Silakan tunggu 1 menit.");
    }

    try {
      const body = (await request.json()) as { email?: string; password?: string };
      const { email, password } = body;
      if (!email || !password) {
        return jsonResponse({ success: false, message: "Email dan password wajib diisi." }, 400);
      }

      const trimmedEmail = sanitizeText(email).toLowerCase();
      const altEmail = trimmedEmail.includes("@mifx.com")
        ? trimmedEmail.replace("@mifx.com", "@gotrade.com")
        : trimmedEmail.includes("@gotrade.com")
          ? trimmedEmail.replace("@gotrade.com", "@mifx.com")
          : trimmedEmail;

      const rows = await query<DbUser>(
        "SELECT * FROM users WHERE (LOWER(email) = $1 OR LOWER(email) = $2) AND password = $3",
        [trimmedEmail, altEmail, String(password).trim()],
      );

      if (rows.length === 0) {
        return jsonResponse(
          {
            success: false,
            message: "Email atau password salah. Cek akun yang tersedia.",
          },
          401,
        );
      }

      const user = rows[0];
      const token = generateToken(user.id);

      return jsonResponse(
        {
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
        },
        200,
        {
          "Set-Cookie": `gotrade_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
        },
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal masuk";
      return jsonResponse({ success: false, message }, 500);
    }
  }

  // /api/auth/register (Protected with Rate Limiting & Validation)
  if (url.pathname === "/api/auth/register" && request.method === "POST") {
    if (!checkRateLimit(`reg_${clientIp}`, 10, 60000)) {
      return rateLimitResponse("Terlalu banyak permintaan pendaftaran. Silakan tunggu sebentar.");
    }

    try {
      const body = (await request.json()) as {
        name?: string;
        email?: string;
        password?: string;
        phone?: string;
      };
      const { name, email, password, phone } = body;

      if (!name || !email || !password) {
        return jsonResponse(
          { success: false, message: "Nama, email, dan password wajib diisi." },
          400,
        );
      }

      const cleanName = sanitizeText(name);
      const cleanEmail = sanitizeText(email).toLowerCase();
      const cleanPhone = sanitizeText(phone);

      if (cleanEmail.length < 5 || !cleanEmail.includes("@")) {
        return jsonResponse({ success: false, message: "Format email tidak valid." }, 400);
      }

      if (String(password).length < 6) {
        return jsonResponse(
          { success: false, message: "Password minimal 6 karakter demi keamanan akun." },
          400,
        );
      }

      const existing = await query<DbUser>("SELECT id FROM users WHERE LOWER(email) = $1", [
        cleanEmail,
      ]);
      if (existing.length > 0) {
        return jsonResponse(
          { success: false, message: "Email sudah terdaftar. Silakan gunakan menu login." },
          400,
        );
      }

      const randomAcc = Math.floor(10000000 + Math.random() * 90000000).toString();
      const insertRes = await query<DbUser>(
        `INSERT INTO users (name, email, password, phone, role, account_number, balance, account_type)
         VALUES ($1, $2, $3, $4, 'user', $5, 0.00, 'Standard Live')
         RETURNING *`,
        [cleanName, cleanEmail, String(password).trim(), cleanPhone, randomAcc],
      );

      const newUser = insertRes[0];
      const token = generateToken(newUser.id);

      return jsonResponse(
        {
          success: true,
          message: "Akun trader berhasil didaftarkan secara aman!",
          token,
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone,
            role: newUser.role,
            accountNumber: newUser.account_number,
            balance: Number(newUser.balance),
            accountType: newUser.account_type,
            createdAt: newUser.created_at,
          },
        },
        200,
        {
          "Set-Cookie": `gotrade_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
        },
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal mendaftar";
      return jsonResponse({ success: false, message }, 500);
    }
  }

  // /api/auth/me (Protected: Requires Authenticated User)
  if (url.pathname === "/api/auth/me" && request.method === "GET") {
    const authResult = await requireAuth(request);
    if ("errorResponse" in authResult) {
      return authResult.errorResponse;
    }

    const user = authResult.user;
    return jsonResponse({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        accountNumber: user.account_number,
        balance: Number(user.balance),
        profit: Number(user.profit || 0),
        accountType: user.account_type,
        createdAt: user.created_at,
      },
    });
  }

  // /api/auth/logout
  if (url.pathname === "/api/auth/logout" && request.method === "POST") {
    const authHeader = request.headers.get("authorization") || "";
    const cookieHeader = request.headers.get("cookie") || "";
    const cookies = parseCookies(cookieHeader);
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.substring(7)
      : cookies["gotrade_session"] || cookies["mifx_session"] || "";
    if (token) {
      activeSessions.delete(token);
    }
    return jsonResponse({ success: true, message: "Berhasil keluar secara aman." }, 200, {
      "Set-Cookie": "gotrade_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
    });
  }

  // ==========================================
  // RBAC RESTRICTED: /api/users (ADMIN ONLY)
  // ==========================================
  if (url.pathname === "/api/users") {
    const adminCheck = await requireAdmin(request);
    if ("errorResponse" in adminCheck) {
      return adminCheck.errorResponse;
    }

    if (request.method === "GET") {
      try {
        const users = await query<DbUser>(
          "SELECT id, name, email, phone, role, account_number, balance, COALESCE(profit, 0) as profit, account_type, created_at FROM users ORDER BY id ASC",
        );
        return jsonResponse({ success: true, users });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error fetching users";
        return jsonResponse({ success: false, message }, 500);
      }
    }

    if (request.method === "POST") {
      try {
        const body = (await request.json()) as {
          name: string;
          email: string;
          password?: string;
          phone?: string;
          role?: "user" | "admin";
          balance?: number;
          accountType?: string;
        };

        const randomAcc = Math.floor(10000000 + Math.random() * 90000000).toString();
        const created = await query<DbUser>(
          `INSERT INTO users (name, email, password, phone, role, account_number, balance, account_type)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id, name, email, phone, role, account_number, balance, profit, account_type, created_at`,
          [
            sanitizeText(body.name),
            sanitizeText(body.email).toLowerCase(),
            body.password || "user123",
            sanitizeText(body.phone),
            body.role === "admin" ? "admin" : "user",
            randomAcc,
            body.balance !== undefined ? Math.max(0, Number(body.balance)) : 0.0,
            sanitizeText(body.accountType) || "Standard Live",
          ],
        );

        return jsonResponse({ success: true, user: created[0] });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error creating user";
        return jsonResponse({ success: false, message }, 500);
      }
    }

    if (request.method === "PUT" || request.method === "PATCH") {
      try {
        const body = (await request.json()) as {
          id: number;
          name?: string;
          email?: string;
          phone?: string;
          role?: "user" | "admin";
          balance?: number;
          accountType?: string;
        };

        const existing = await query<DbUser>("SELECT * FROM users WHERE id = $1", [body.id]);
        if (existing.length === 0) {
          return jsonResponse({ success: false, message: "Pengguna tidak ditemukan" }, 404);
        }

        const curr = existing[0];
        const updated = await query<DbUser>(
          `UPDATE users SET
             name = $1,
             email = $2,
             phone = $3,
             role = $4,
             balance = $5,
             account_type = $6
           WHERE id = $7
           RETURNING id, name, email, phone, role, account_number, balance, profit, account_type, created_at`,
          [
            body.name !== undefined ? sanitizeText(body.name) : curr.name,
            body.email ? sanitizeText(body.email).toLowerCase() : curr.email,
            body.phone !== undefined ? sanitizeText(body.phone) : curr.phone,
            body.role !== undefined ? (body.role === "admin" ? "admin" : "user") : curr.role,
            body.balance !== undefined ? Math.max(0, Number(body.balance)) : Number(curr.balance),
            body.accountType !== undefined ? sanitizeText(body.accountType) : curr.account_type,
            body.id,
          ],
        );

        return jsonResponse({ success: true, user: updated[0] });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error updating user";
        return jsonResponse({ success: false, message }, 500);
      }
    }

    if (request.method === "DELETE") {
      try {
        const urlObj = new URL(request.url);
        const idParam = urlObj.searchParams.get("id");
        let id: number | null = idParam ? parseInt(idParam, 10) : null;

        if (!id) {
          const body = (await request.json().catch(() => ({}))) as { id?: number };
          id = body.id || null;
        }

        if (!id) {
          return jsonResponse({ success: false, message: "ID pengguna diperlukan" }, 400);
        }

        // Prevent admin from deleting themselves
        if (id === adminCheck.user.id) {
          return jsonResponse(
            {
              success: false,
              message: "Anda tidak dapat menghapus akun administrator Anda sendiri.",
            },
            400,
          );
        }

        await query("DELETE FROM users WHERE id = $1", [id]);
        return jsonResponse({ success: true, message: "Pengguna berhasil dihapus" });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error deleting user";
        return jsonResponse({ success: false, message }, 500);
      }
    }
  }

  // ==========================================
  // /api/transactions (RBAC Protected Data Scoping)
  // ==========================================
  if (url.pathname === "/api/transactions") {
    // GET: Admin sees all transactions; Regular Trader sees ONLY their own transactions
    if (request.method === "GET") {
      const authResult = await requireAuth(request);
      if ("errorResponse" in authResult) {
        // Fallback: if preview without session, only return empty or safe public
        return authResult.errorResponse;
      }

      try {
        const currentUser = authResult.user;
        let rows: DbTransaction[] = [];

        if (currentUser.role === "admin") {
          // Admin has access to all transactions across all users
          rows = await query<DbTransaction>("SELECT * FROM transactions ORDER BY created_at DESC");
        } else {
          // Trader can only access transactions linked to their user_id or account_number
          rows = await query<DbTransaction>(
            "SELECT * FROM transactions WHERE user_id = $1 OR account_number = $2 ORDER BY created_at DESC",
            [currentUser.id, currentUser.account_number],
          );
        }

        return jsonResponse({ success: true, transactions: rows });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error fetching transactions";
        return jsonResponse({ success: false, message }, 500);
      }
    }

    // PATCH / PUT: ADMIN ONLY (Approve/Reject Top Up & Withdraw)
    if (request.method === "PATCH" || request.method === "PUT") {
      const adminCheck = await requireAdmin(request);
      if ("errorResponse" in adminCheck) {
        return adminCheck.errorResponse;
      }

      try {
        const body = (await request.json()) as { id: string; status: "Berhasil" | "Ditolak" };
        const { id, status } = body;
        if (!id || !status) {
          return jsonResponse({ success: false, message: "ID dan status diperlukan" }, 400);
        }

        const existingTx = await query<DbTransaction>("SELECT * FROM transactions WHERE id = $1", [
          id,
        ]);
        if (existingTx.length === 0) {
          return jsonResponse({ success: false, message: "Transaksi tidak ditemukan" }, 404);
        }

        const tx = existingTx[0];
        const update = await query<DbTransaction>(
          `UPDATE transactions SET status = $1 WHERE id = $2 RETURNING *`,
          [status, id],
        );

        // Balance adjustment if transaction approved (Kurs: 1 USD = 16,000 IDR)
        if (status === "Berhasil" && tx.status !== "Berhasil") {
          const rawAmount = Number(tx.amount);
          const amountUSD = rawAmount >= 10000 ? rawAmount / 16000 : rawAmount;
          if (tx.type === "Top Up") {
            if (tx.user_id) {
              await query("UPDATE users SET balance = balance + $1 WHERE id = $2", [
                amountUSD,
                tx.user_id,
              ]);
            } else if (tx.account_number) {
              await query("UPDATE users SET balance = balance + $1 WHERE account_number = $2", [
                amountUSD,
                tx.account_number,
              ]);
            }
          } else if (tx.type === "Withdraw") {
            if (tx.user_id) {
              await query("UPDATE users SET balance = GREATEST(0, balance - $1) WHERE id = $2", [
                amountUSD,
                tx.user_id,
              ]);
            } else if (tx.account_number) {
              await query(
                "UPDATE users SET balance = GREATEST(0, balance - $1) WHERE account_number = $2",
                [amountUSD, tx.account_number],
              );
            }
          }
        } else if (tx.status === "Berhasil" && status !== "Berhasil") {
          // Revert previous approval if status changes from Berhasil to Menunggu/Ditolak
          const rawAmount = Number(tx.amount);
          const amountUSD = rawAmount >= 10000 ? rawAmount / 16000 : rawAmount;
          if (tx.type === "Top Up") {
            if (tx.user_id) {
              await query("UPDATE users SET balance = GREATEST(0, balance - $1) WHERE id = $2", [
                amountUSD,
                tx.user_id,
              ]);
            } else if (tx.account_number) {
              await query(
                "UPDATE users SET balance = GREATEST(0, balance - $1) WHERE account_number = $2",
                [amountUSD, tx.account_number],
              );
            }
          } else if (tx.type === "Withdraw") {
            if (tx.user_id) {
              await query("UPDATE users SET balance = balance + $1 WHERE id = $2", [
                amountUSD,
                tx.user_id,
              ]);
            } else if (tx.account_number) {
              await query("UPDATE users SET balance = balance + $1 WHERE account_number = $2", [
                amountUSD,
                tx.account_number,
              ]);
            }
          }
        }

        return jsonResponse({ success: true, transaction: update[0] });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error updating transaction";
        return jsonResponse({ success: false, message }, 500);
      }
    }

    // POST: Authenticated User submits Deposit or Withdraw
    if (request.method === "POST") {
      const authResult = await requireAuth(request);
      if ("errorResponse" in authResult) {
        return authResult.errorResponse;
      }

      try {
        const currentUser = authResult.user;
        const body = (await request.json()) as {
          type: "Top Up" | "Withdraw";
          channel: string;
          destination: string;
          amount: number;
          proofImage?: string;
        };

        const numericAmount = Number(body.amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
          return jsonResponse({ success: false, message: "Nominal transaksi tidak valid." }, 400);
        }

        if (body.type === "Top Up" && numericAmount < 16000000) {
          return jsonResponse(
            {
              success: false,
              message: "Minimal deposit adalah $1,000 USD (sekitar Rp16.000.000)",
            },
            400,
          );
        }

        if (body.type === "Withdraw") {
          if (numericAmount < 100000) {
            return jsonResponse(
              {
                success: false,
                message: "Minimal penarikan adalah Rp100.000 (sekitar $6.25 USD)",
              },
              400,
            );
          }

          // Balance Validation for Withdrawal
          const amountUSD = numericAmount / 16000;
          if (Number(currentUser.balance) < amountUSD) {
            return jsonResponse(
              {
                success: false,
                message: `Saldo tidak mencukupi. Saldo Anda: $${Number(currentUser.balance).toFixed(2)} USD (dibutuhkan ~$${amountUSD.toFixed(2)} USD).`,
              },
              400,
            );
          }
        }

        // Enforce binding to the verified authenticated user (prevents identity spoofing)
        const txId = (body.type === "Top Up" ? "TU-" : "WD-") + Date.now().toString().slice(-6);
        const insert = await query(
          `INSERT INTO transactions (id, user_id, user_name, account_number, type, channel, destination, amount, status, proof_image)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Menunggu', $9)
           RETURNING *`,
          [
            txId,
            currentUser.id,
            currentUser.name,
            currentUser.account_number,
            body.type,
            sanitizeText(body.channel),
            sanitizeText(body.destination),
            numericAmount,
            body.proofImage || null,
          ],
        );

        return jsonResponse({ success: true, transaction: insert[0] });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error creating transaction";
        return jsonResponse({ success: false, message }, 500);
      }
    }
  }

  // ==========================================
  // RBAC RESTRICTED: /api/admin/profit (ADMIN ONLY)
  // ==========================================
  if (url.pathname === "/api/admin/profit" && request.method === "POST") {
    const adminCheck = await requireAdmin(request);
    if ("errorResponse" in adminCheck) {
      return adminCheck.errorResponse;
    }

    try {
      const body = (await request.json()) as { userId: number; amount: number; note?: string };
      const { userId, amount } = body;

      if (!userId || !amount || amount <= 0) {
        return jsonResponse(
          {
            success: false,
            message: "ID User dan nominal profit harus valid dan bernilai positif.",
          },
          400,
        );
      }

      const existing = await query<DbUser>("SELECT * FROM users WHERE id = $1", [userId]);
      if (existing.length === 0) {
        return jsonResponse({ success: false, message: "User tujuan tidak ditemukan" }, 404);
      }

      const targetUser = existing[0];
      const updated = await query<DbUser>(
        `UPDATE users
         SET profit = COALESCE(profit, 0) + $1,
             balance = COALESCE(balance, 0) + $1
         WHERE id = $2
         RETURNING id, name, email, phone, role, account_number, balance, profit, account_type`,
        [amount, userId],
      );

      // Record profit grant in transactions table
      const txId = "PRF-" + Date.now().toString().slice(-6);
      await query(
        `INSERT INTO transactions (id, user_id, user_name, account_number, type, channel, destination, amount, status)
         VALUES ($1, $2, $3, $4, 'Profit', 'Admin Profit Grant', 'Gotrade Wallet', $5, 'Berhasil')`,
        [txId, targetUser.id, targetUser.name, targetUser.account_number, amount],
      );

      return jsonResponse({
        success: true,
        message: `Berhasil menambahkan profit $${amount.toLocaleString()} ke user ${targetUser.name}!`,
        user: updated[0],
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error granting profit";
      return jsonResponse({ success: false, message }, 500);
    }
  }

  // ==========================================
  // /api/signals (GET is Public; MUTATIONS ARE ADMIN ONLY)
  // ==========================================
  if (url.pathname === "/api/signals") {
    if (request.method === "GET") {
      try {
        const rows = await query("SELECT * FROM signals ORDER BY created_at DESC");
        return jsonResponse({ success: true, signals: rows });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error fetching signals";
        return jsonResponse({ success: false, message }, 500);
      }
    }

    // Mutations require Admin Role
    const adminCheck = await requireAdmin(request);
    if ("errorResponse" in adminCheck) {
      return adminCheck.errorResponse;
    }

    if (request.method === "POST") {
      try {
        const body = (await request.json()) as {
          symbol: string;
          category: string;
          action: string;
          entryPrice: number;
          tp1: number;
          tp2: number;
          sl: number;
          rationale?: string;
          timeframe?: string;
          status?: string;
        };

        const sigId = "SIG-" + Date.now().toString().slice(-6);
        const insert = await query(
          `INSERT INTO signals (id, symbol, category, action, entry_price, tp1, tp2, sl, rationale, timeframe, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           RETURNING *`,
          [
            sigId,
            sanitizeText(body.symbol).toUpperCase(),
            sanitizeText(body.category) || "Forex",
            sanitizeText(body.action).toUpperCase(),
            Number(body.entryPrice),
            Number(body.tp1),
            Number(body.tp2),
            Number(body.sl),
            sanitizeText(body.rationale),
            sanitizeText(body.timeframe) || "30m",
            sanitizeText(body.status) || "Aktif",
          ],
        );

        return jsonResponse({ success: true, signal: insert[0] });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error creating signal";
        return jsonResponse({ success: false, message }, 500);
      }
    }

    if (request.method === "PUT" || request.method === "PATCH") {
      try {
        const body = (await request.json()) as {
          id: string;
          symbol?: string;
          category?: string;
          action?: string;
          entryPrice?: number;
          tp1?: number;
          tp2?: number;
          sl?: number;
          rationale?: string;
          timeframe?: string;
          status?: string;
        };

        const existing = await query<DbSignal>("SELECT * FROM signals WHERE id = $1", [body.id]);
        if (existing.length === 0) {
          return jsonResponse({ success: false, message: "Sinyal tidak ditemukan" }, 404);
        }

        const curr = existing[0];
        const updated = await query(
          `UPDATE signals SET
             symbol = $1, category = $2, action = $3, entry_price = $4,
             tp1 = $5, tp2 = $6, sl = $7, rationale = $8, timeframe = $9, status = $10
           WHERE id = $11
           RETURNING *`,
          [
            body.symbol ? sanitizeText(body.symbol).toUpperCase() : curr.symbol,
            body.category ? sanitizeText(body.category) : curr.category,
            body.action ? sanitizeText(body.action).toUpperCase() : curr.action,
            body.entryPrice !== undefined ? Number(body.entryPrice) : curr.entry_price,
            body.tp1 !== undefined ? Number(body.tp1) : curr.tp1,
            body.tp2 !== undefined ? Number(body.tp2) : curr.tp2,
            body.sl !== undefined ? Number(body.sl) : curr.sl,
            body.rationale !== undefined ? sanitizeText(body.rationale) : curr.rationale,
            body.timeframe !== undefined ? sanitizeText(body.timeframe) : curr.timeframe,
            body.status !== undefined ? sanitizeText(body.status) : curr.status,
            body.id,
          ],
        );

        return jsonResponse({ success: true, signal: updated[0] });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error updating signal";
        return jsonResponse({ success: false, message }, 500);
      }
    }

    if (request.method === "DELETE") {
      try {
        const urlObj = new URL(request.url);
        const idParam = urlObj.searchParams.get("id");
        let id = idParam;
        if (!id) {
          const body = (await request.json().catch(() => ({}))) as { id?: string };
          id = body.id || null;
        }

        if (!id) {
          return jsonResponse({ success: false, message: "ID sinyal diperlukan" }, 400);
        }

        await query("DELETE FROM signals WHERE id = $1", [id]);
        return jsonResponse({ success: true, message: "Sinyal berhasil dihapus" });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error deleting signal";
        return jsonResponse({ success: false, message }, 500);
      }
    }
  }

  // ==========================================
  // /api/news (GET is Public; MUTATIONS ARE ADMIN ONLY)
  // ==========================================
  if (url.pathname === "/api/news") {
    if (request.method === "GET") {
      try {
        const rows = await query("SELECT * FROM news ORDER BY created_at DESC");
        return jsonResponse({ success: true, news: rows });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error fetching news";
        return jsonResponse({ success: false, message }, 500);
      }
    }

    // Mutations require Admin Role
    const adminCheck = await requireAdmin(request);
    if ("errorResponse" in adminCheck) {
      return adminCheck.errorResponse;
    }

    if (request.method === "POST") {
      try {
        const body = (await request.json()) as {
          title: string;
          category: string;
          excerpt: string;
          body: string;
          status?: string;
          imageUrl?: string;
        };

        const cleanTitle = sanitizeText(body.title);
        const slug =
          cleanTitle
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "") +
          "-" +
          Date.now().toString().slice(-4);

        const insert = await query(
          `INSERT INTO news (slug, title, category, excerpt, body, date, read_minutes, status, image_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING *`,
          [
            slug,
            cleanTitle,
            sanitizeText(body.category) || "Special Article",
            sanitizeText(body.excerpt),
            body.body || "",
            new Date().toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }),
            3,
            body.status || "Terbit",
            body.imageUrl || "",
          ],
        );

        return jsonResponse({ success: true, news: insert[0] });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error creating news";
        return jsonResponse({ success: false, message }, 500);
      }
    }

    if (request.method === "PUT" || request.method === "PATCH") {
      try {
        const body = (await request.json()) as {
          id: number;
          title?: string;
          category?: string;
          excerpt?: string;
          body?: string;
          status?: string;
          imageUrl?: string;
        };

        const existing = await query<DbNews>("SELECT * FROM news WHERE id = $1", [body.id]);
        if (existing.length === 0) {
          return jsonResponse({ success: false, message: "Berita tidak ditemukan" }, 404);
        }

        const curr = existing[0];
        const updated = await query(
          `UPDATE news SET
             title = $1, category = $2, excerpt = $3, body = $4, status = $5, image_url = $6
           WHERE id = $7
           RETURNING *`,
          [
            body.title !== undefined ? sanitizeText(body.title) : curr.title,
            body.category !== undefined ? sanitizeText(body.category) : curr.category,
            body.excerpt !== undefined ? sanitizeText(body.excerpt) : curr.excerpt,
            body.body !== undefined ? body.body : curr.body,
            body.status !== undefined ? sanitizeText(body.status) : curr.status,
            body.imageUrl !== undefined ? body.imageUrl : curr.image_url,
            body.id,
          ],
        );

        return jsonResponse({ success: true, news: updated[0] });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error updating news";
        return jsonResponse({ success: false, message }, 500);
      }
    }

    if (request.method === "DELETE") {
      try {
        const urlObj = new URL(request.url);
        const idParam = urlObj.searchParams.get("id");
        let id = idParam ? parseInt(idParam, 10) : null;
        if (!id) {
          const body = (await request.json().catch(() => ({}))) as { id?: number };
          id = body.id || null;
        }

        if (!id) {
          return jsonResponse({ success: false, message: "ID berita diperlukan" }, 400);
        }

        await query("DELETE FROM news WHERE id = $1", [id]);
        return jsonResponse({ success: true, message: "Berita berhasil dihapus" });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error deleting news";
        return jsonResponse({ success: false, message }, 500);
      }
    }
  }

  // ==========================================
  // /api/currencies (GET is Public; MUTATIONS ARE ADMIN ONLY)
  // ==========================================
  if (url.pathname === "/api/currencies") {
    if (request.method === "GET") {
      try {
        const rows = await query("SELECT * FROM currencies ORDER BY id ASC");
        return jsonResponse({ success: true, currencies: rows });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error fetching currencies";
        return jsonResponse({ success: false, message }, 500);
      }
    }

    // Mutations require Admin Role
    const adminCheck = await requireAdmin(request);
    if ("errorResponse" in adminCheck) {
      return adminCheck.errorResponse;
    }

    if (request.method === "POST") {
      try {
        const body = (await request.json()) as {
          symbol: string;
          name: string;
          category: string;
          price: number;
          decimals?: number;
          spread?: number;
          direction?: string;
          volatility?: number;
          active?: boolean;
        };

        const insert = await query(
          `INSERT INTO currencies (symbol, name, category, price, decimals, spread, direction, volatility, active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING *`,
          [
            sanitizeText(body.symbol).toUpperCase(),
            sanitizeText(body.name),
            sanitizeText(body.category) || "Forex",
            Number(body.price),
            body.decimals ?? 5,
            body.spread ?? 50,
            sanitizeText(body.direction) || "Acak",
            body.volatility ?? 30,
            body.active ?? true,
          ],
        );

        return jsonResponse({ success: true, currency: insert[0] });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error creating currency";
        return jsonResponse({ success: false, message }, 500);
      }
    }

    if (request.method === "PUT" || request.method === "PATCH") {
      try {
        const body = (await request.json()) as {
          id: number;
          symbol?: string;
          name?: string;
          category?: string;
          price?: number;
          decimals?: number;
          spread?: number;
          direction?: string;
          volatility?: number;
          active?: boolean;
        };

        type DbCurr = {
          id: number;
          symbol: string;
          name: string;
          category: string;
          price: number;
          decimals: number;
          spread: number;
          direction: string;
          volatility: number;
          active: boolean;
        };

        const existing = await query<DbCurr>("SELECT * FROM currencies WHERE id = $1", [body.id]);
        if (existing.length === 0) {
          return jsonResponse({ success: false, message: "Mata uang tidak ditemukan" }, 404);
        }

        const curr = existing[0];
        const updated = await query(
          `UPDATE currencies SET
             symbol = $1, name = $2, category = $3, price = $4, decimals = $5,
             spread = $6, direction = $7, volatility = $8, active = $9
           WHERE id = $10
           RETURNING *`,
          [
            body.symbol ? sanitizeText(body.symbol).toUpperCase() : curr.symbol,
            body.name !== undefined ? sanitizeText(body.name) : curr.name,
            body.category !== undefined ? sanitizeText(body.category) : curr.category,
            body.price !== undefined ? Number(body.price) : curr.price,
            body.decimals !== undefined ? Number(body.decimals) : curr.decimals,
            body.spread !== undefined ? Number(body.spread) : curr.spread,
            body.direction !== undefined ? sanitizeText(body.direction) : curr.direction,
            body.volatility !== undefined ? Number(body.volatility) : curr.volatility,
            body.active !== undefined ? Boolean(body.active) : curr.active,
            body.id,
          ],
        );

        return jsonResponse({ success: true, currency: updated[0] });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error updating currency";
        return jsonResponse({ success: false, message }, 500);
      }
    }

    if (request.method === "DELETE") {
      try {
        const urlObj = new URL(request.url);
        const idParam = urlObj.searchParams.get("id");
        let id = idParam ? parseInt(idParam, 10) : null;
        if (!id) {
          const body = (await request.json().catch(() => ({}))) as { id?: number };
          id = body.id || null;
        }

        if (!id) {
          return jsonResponse({ success: false, message: "ID mata uang diperlukan" }, 400);
        }

        await query("DELETE FROM currencies WHERE id = $1", [id]);
        return jsonResponse({ success: true, message: "Mata uang berhasil dihapus" });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error deleting currency";
        return jsonResponse({ success: false, message }, 500);
      }
    }
  }

  // ==========================================
  // /api/referrals (Scoping & RBAC)
  // ==========================================
  if (url.pathname === "/api/referrals") {
    if (request.method === "GET") {
      const authResult = await requireAuth(request);
      if ("errorResponse" in authResult) {
        return authResult.errorResponse;
      }

      try {
        const user = authResult.user;
        let rows = [];
        if (user.role === "admin") {
          rows = await query("SELECT * FROM referrals ORDER BY id DESC");
        } else {
          rows = await query("SELECT * FROM referrals WHERE LOWER(email) = $1 ORDER BY id DESC", [
            user.email.toLowerCase(),
          ]);
        }
        return jsonResponse({ success: true, referrals: rows });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error fetching referrals";
        return jsonResponse({ success: false, message }, 500);
      }
    }

    if (request.method === "POST") {
      const authResult = await requireAuth(request);
      if ("errorResponse" in authResult) {
        return authResult.errorResponse;
      }

      try {
        const user = authResult.user;
        const body = (await request.json()) as {
          code: string;
          referredBy?: string;
          commission?: number;
        };

        const cleanCode = sanitizeText(body.code).toUpperCase();
        const insert = await query(
          `INSERT INTO referrals (user_name, email, code, referred_by, commission, invitees_count)
           VALUES ($1, $2, $3, $4, $5, 0)
           RETURNING *`,
          [
            user.name,
            user.email.toLowerCase(),
            cleanCode,
            body.referredBy ? sanitizeText(body.referredBy) : null,
            user.role === "admin" ? (body.commission ?? 0) : 0,
          ],
        );

        return jsonResponse({ success: true, referral: insert[0] });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error creating referral";
        return jsonResponse({ success: false, message }, 500);
      }
    }

    // Mutations require Admin Role
    const adminCheck = await requireAdmin(request);
    if ("errorResponse" in adminCheck) {
      return adminCheck.errorResponse;
    }

    if (request.method === "PUT" || request.method === "PATCH") {
      try {
        const body = (await request.json()) as {
          id: number;
          userName?: string;
          email?: string;
          code?: string;
          referredBy?: string;
          commission?: number;
          inviteesCount?: number;
        };

        type DbRef = {
          id: number;
          user_name: string;
          email: string;
          code: string;
          referred_by: string;
          commission: number;
          invitees_count: number;
        };

        const existing = await query<DbRef>("SELECT * FROM referrals WHERE id = $1", [body.id]);
        if (existing.length === 0) {
          return jsonResponse({ success: false, message: "Referral tidak ditemukan" }, 404);
        }

        const curr = existing[0];
        const updated = await query(
          `UPDATE referrals SET
             user_name = $1, email = $2, code = $3, referred_by = $4, commission = $5, invitees_count = $6
           WHERE id = $7
           RETURNING *`,
          [
            body.userName ? sanitizeText(body.userName) : curr.user_name,
            body.email ? sanitizeText(body.email).toLowerCase() : curr.email,
            body.code ? sanitizeText(body.code).toUpperCase() : curr.code,
            body.referredBy !== undefined ? sanitizeText(body.referredBy) : curr.referred_by,
            body.commission !== undefined ? Number(body.commission) : curr.commission,
            body.inviteesCount !== undefined ? Number(body.inviteesCount) : curr.invitees_count,
            body.id,
          ],
        );

        return jsonResponse({ success: true, referral: updated[0] });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error updating referral";
        return jsonResponse({ success: false, message }, 500);
      }
    }

    if (request.method === "DELETE") {
      try {
        const urlObj = new URL(request.url);
        const idParam = urlObj.searchParams.get("id");
        let id = idParam ? parseInt(idParam, 10) : null;
        if (!id) {
          const body = (await request.json().catch(() => ({}))) as { id?: number };
          id = body.id || null;
        }

        if (!id) {
          return jsonResponse({ success: false, message: "ID referral diperlukan" }, 400);
        }

        await query("DELETE FROM referrals WHERE id = $1", [id]);
        return jsonResponse({ success: true, message: "Referral berhasil dihapus" });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error deleting referral";
        return jsonResponse({ success: false, message }, 500);
      }
    }
  }

  // ==========================================
  // /api/settings (GET is Public; MUTATIONS ARE ADMIN ONLY)
  // ==========================================
  if (url.pathname === "/api/settings") {
    if (request.method === "GET") {
      try {
        const rows = await query<{ key: string; value: string }>("SELECT key, value FROM settings");
        const settingsMap: Record<string, string> = {};
        for (const row of rows) {
          settingsMap[row.key] = row.value;
        }
        return jsonResponse({ success: true, settings: settingsMap });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error fetching settings";
        return jsonResponse({ success: false, message }, 500);
      }
    }

    // Changing system settings requires Admin Role
    const adminCheck = await requireAdmin(request);
    if ("errorResponse" in adminCheck) {
      return adminCheck.errorResponse;
    }

    if (request.method === "POST" || request.method === "PUT") {
      try {
        const body = (await request.json()) as Record<string, string>;
        for (const [key, value] of Object.entries(body)) {
          if (typeof key === "string" && typeof value === "string") {
            const cleanKey = sanitizeText(key);
            const existing = await query("SELECT key FROM settings WHERE key = $1", [cleanKey]);
            if (existing.length > 0) {
              await query(
                "UPDATE settings SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = $2",
                [value, cleanKey],
              );
            } else {
              await query(
                "INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP)",
                [cleanKey, value],
              );
            }
          }
        }

        const rows = await query<{ key: string; value: string }>("SELECT key, value FROM settings");
        const settingsMap: Record<string, string> = {};
        for (const row of rows) {
          settingsMap[row.key] = row.value;
        }

        return jsonResponse({
          success: true,
          message: "Pengaturan berhasil disimpan dengan aman",
          settings: settingsMap,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error saving settings";
        return jsonResponse({ success: false, message }, 500);
      }
    }
  }

  return jsonResponse({ error: "Endpoint not found" }, 404);
}
