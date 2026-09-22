import { ensureDbReady, query, isDatabaseInMemory, DbUser } from "./db";

const activeSessions = new Map<string, number>();

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

export async function handleApiRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/")) {
    return null;
  }

  await ensureDbReady();

  // /api/health
  if (url.pathname === "/api/health" && request.method === "GET") {
    try {
      const userCount = await query<{ count: string }>("SELECT COUNT(*) as count FROM users");
      return new Response(
        JSON.stringify({
          status: "ok",
          server: "Online",
          database: "Connected",
          totalUsers: parseInt(userCount[0]?.count || "0", 10),
          timestamp: new Date().toISOString(),
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return new Response(JSON.stringify({ status: "error", message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
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

    return new Response(JSON.stringify({ accounts }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // /api/auth/login
  if (url.pathname === "/api/auth/login" && request.method === "POST") {
    try {
      const body = (await request.json()) as { email?: string; password?: string };
      const { email, password } = body;
      if (!email || !password) {
        return new Response(
          JSON.stringify({ success: false, message: "Email dan password wajib diisi." }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const trimmedEmail = String(email).trim().toLowerCase();
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
        return new Response(
          JSON.stringify({
            success: false,
            message: "Email atau password salah. Cek akun yang tersedia.",
          }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        );
      }

      const user = rows[0];
      const token = generateToken(user.id);

      return new Response(
        JSON.stringify({
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
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": `gotrade_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
          },
        },
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal masuk";
      return new Response(JSON.stringify({ success: false, message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // /api/auth/register
  if (url.pathname === "/api/auth/register" && request.method === "POST") {
    try {
      const body = (await request.json()) as {
        name?: string;
        email?: string;
        password?: string;
        phone?: string;
      };
      const { name, email, password, phone } = body;

      if (!name || !email || !password) {
        return new Response(
          JSON.stringify({ success: false, message: "Nama, email, dan password wajib diisi." }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const cleanEmail = String(email).trim().toLowerCase();
      const existing = await query<DbUser>("SELECT id FROM users WHERE LOWER(email) = $1", [
        cleanEmail,
      ]);
      if (existing.length > 0) {
        return new Response(
          JSON.stringify({ success: false, message: "Email sudah terdaftar. Silakan login." }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const randomAcc = Math.floor(10000000 + Math.random() * 90000000).toString();
      const insertRes = await query<DbUser>(
        `INSERT INTO users (name, email, password, phone, role, account_number, balance, account_type)
         VALUES ($1, $2, $3, $4, 'user', $5, 10000.00, 'Standard Live')
         RETURNING *`,
        [name.trim(), cleanEmail, String(password).trim(), phone?.trim() || "", randomAcc],
      );

      const newUser = insertRes[0];
      const token = generateToken(newUser.id);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Akun berhasil dibuat!",
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
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": `gotrade_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
          },
        },
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal mendaftar";
      return new Response(JSON.stringify({ success: false, message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // /api/auth/me
  if (url.pathname === "/api/auth/me" && request.method === "GET") {
    const authHeader = request.headers.get("authorization") || "";
    const cookieHeader = request.headers.get("cookie") || "";
    const cookies = parseCookies(cookieHeader);
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.substring(7)
      : cookies["gotrade_session"] || cookies["mifx_session"] || "";

    if (!token || !activeSessions.has(token)) {
      return new Response(
        JSON.stringify({ success: false, message: "Sesi tidak valid atau telah berakhir." }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    const userId = activeSessions.get(token);
    const rows = await query<DbUser>("SELECT * FROM users WHERE id = $1", [userId]);

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "Pengguna tidak ditemukan." }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    const user = rows[0];
    return new Response(
      JSON.stringify({
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
      }),
      { headers: { "Content-Type": "application/json" } },
    );
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
    return new Response(JSON.stringify({ success: true, message: "Berhasil keluar." }), {
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": "gotrade_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
      },
    });
  }

  // /api/users (Admin & management)
  if (url.pathname === "/api/users") {
    if (request.method === "GET") {
      try {
        const users = await query<DbUser>(
          "SELECT id, name, email, phone, role, account_number, balance, COALESCE(profit, 0) as profit, account_type, created_at FROM users ORDER BY id ASC",
        );
        return new Response(JSON.stringify({ success: true, users }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error fetching users";
        return new Response(JSON.stringify({ success: false, message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
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
           RETURNING *`,
          [
            body.name,
            body.email.toLowerCase().trim(),
            body.password || "user123",
            body.phone || "",
            body.role || "user",
            randomAcc,
            body.balance ?? 10000.0,
            body.accountType || "Standard Live",
          ],
        );

        return new Response(JSON.stringify({ success: true, user: created[0] }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error creating user";
        return new Response(JSON.stringify({ success: false, message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
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
          return new Response(
            JSON.stringify({ success: false, message: "Pengguna tidak ditemukan" }),
            { status: 404, headers: { "Content-Type": "application/json" } },
          );
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
           RETURNING *`,
          [
            body.name ?? curr.name,
            body.email ? body.email.toLowerCase().trim() : curr.email,
            body.phone ?? curr.phone,
            body.role ?? curr.role,
            body.balance !== undefined ? Number(body.balance) : Number(curr.balance),
            body.accountType ?? curr.account_type,
            body.id,
          ],
        );

        return new Response(JSON.stringify({ success: true, user: updated[0] }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error updating user";
        return new Response(JSON.stringify({ success: false, message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
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
          return new Response(
            JSON.stringify({ success: false, message: "ID pengguna diperlukan" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        await query("DELETE FROM users WHERE id = $1", [id]);
        return new Response(
          JSON.stringify({ success: true, message: "Pengguna berhasil dihapus" }),
          {
            headers: { "Content-Type": "application/json" },
          },
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error deleting user";
        return new Response(JSON.stringify({ success: false, message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
  }

  // /api/transactions
  if (url.pathname === "/api/transactions") {
    if (request.method === "GET") {
      try {
        const rows = await query("SELECT * FROM transactions ORDER BY created_at DESC");
        return new Response(JSON.stringify({ success: true, transactions: rows }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error fetching transactions";
        return new Response(JSON.stringify({ success: false, message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    if (request.method === "PATCH" || request.method === "PUT") {
      try {
        const body = (await request.json()) as { id: string; status: "Berhasil" | "Ditolak" };
        const { id, status } = body;
        if (!id || !status) {
          return new Response(
            JSON.stringify({ success: false, message: "ID dan status diperlukan" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        const existingTx = await query<DbTransaction>("SELECT * FROM transactions WHERE id = $1", [
          id,
        ]);
        if (existingTx.length === 0) {
          return new Response(
            JSON.stringify({ success: false, message: "Transaksi tidak ditemukan" }),
            {
              status: 404,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        const tx = existingTx[0];
        const update = await query<DbTransaction>(
          `UPDATE transactions SET status = $1 WHERE id = $2 RETURNING *`,
          [status, id],
        );

        // Balance adjustment if transaction approved
        if (status === "Berhasil" && tx.status !== "Berhasil") {
          const amount = Number(tx.amount);
          if (tx.type === "Top Up") {
            if (tx.user_id) {
              await query("UPDATE users SET balance = balance + $1 WHERE id = $2", [
                amount,
                tx.user_id,
              ]);
            } else if (tx.account_number) {
              await query("UPDATE users SET balance = balance + $1 WHERE account_number = $2", [
                amount,
                tx.account_number,
              ]);
            }
          } else if (tx.type === "Withdraw") {
            if (tx.user_id) {
              await query("UPDATE users SET balance = GREATEST(0, balance - $1) WHERE id = $2", [
                amount,
                tx.user_id,
              ]);
            } else if (tx.account_number) {
              await query(
                "UPDATE users SET balance = GREATEST(0, balance - $1) WHERE account_number = $2",
                [amount, tx.account_number],
              );
            }
          }
        }

        return new Response(JSON.stringify({ success: true, transaction: update[0] }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error updating transaction";
        return new Response(JSON.stringify({ success: false, message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    if (request.method === "POST") {
      try {
        const body = (await request.json()) as {
          userId?: number;
          userName: string;
          accountNumber: string;
          type: "Top Up" | "Withdraw";
          channel: string;
          destination: string;
          amount: number;
        };

        if (body.type === "Top Up" && body.amount < 16000000) {
          return new Response(
            JSON.stringify({
              success: false,
              message: "Minimal deposit adalah $1,000 USD (sekitar Rp16.000.000)",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        if (body.type === "Withdraw" && body.amount < 100000) {
          return new Response(
            JSON.stringify({
              success: false,
              message: "Minimal penarikan adalah Rp100.000 (sekitar $6.25 USD)",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        const txId = (body.type === "Top Up" ? "TU-" : "WD-") + Date.now().toString().slice(-6);
        const insert = await query(
          `INSERT INTO transactions (id, user_id, user_name, account_number, type, channel, destination, amount, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Menunggu')
           RETURNING *`,
          [
            txId,
            body.userId || null,
            body.userName,
            body.accountNumber,
            body.type,
            body.channel,
            body.destination,
            body.amount,
          ],
        );

        return new Response(JSON.stringify({ success: true, transaction: insert[0] }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error creating transaction";
        return new Response(JSON.stringify({ success: false, message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
  }

  // /api/admin/profit (Grant Profit to User)
  if (url.pathname === "/api/admin/profit" && request.method === "POST") {
    try {
      const body = (await request.json()) as { userId: number; amount: number; note?: string };
      const { userId, amount } = body;

      if (!userId || !amount || amount <= 0) {
        return new Response(
          JSON.stringify({ success: false, message: "ID User dan nominal profit harus valid" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const existing = await query<DbUser>("SELECT * FROM users WHERE id = $1", [userId]);
      if (existing.length === 0) {
        return new Response(JSON.stringify({ success: false, message: "User tidak ditemukan" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
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

      return new Response(
        JSON.stringify({
          success: true,
          message: `Berhasil menambahkan profit $${amount.toLocaleString()} ke user ${targetUser.name}!`,
          user: updated[0],
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error granting profit";
      return new Response(JSON.stringify({ success: false, message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // /api/signals
  if (url.pathname === "/api/signals") {
    if (request.method === "GET") {
      try {
        const rows = await query("SELECT * FROM signals ORDER BY created_at DESC");
        return new Response(JSON.stringify({ success: true, signals: rows }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error fetching signals";
        return new Response(JSON.stringify({ success: false, message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
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
            body.symbol,
            body.category || "Forex",
            body.action,
            body.entryPrice,
            body.tp1,
            body.tp2,
            body.sl,
            body.rationale || "",
            body.timeframe || "30m",
            body.status || "Aktif",
          ],
        );

        return new Response(JSON.stringify({ success: true, signal: insert[0] }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error creating signal";
        return new Response(JSON.stringify({ success: false, message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
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
          return new Response(
            JSON.stringify({ success: false, message: "Sinyal tidak ditemukan" }),
            { status: 404, headers: { "Content-Type": "application/json" } },
          );
        }

        const curr = existing[0];
        const updated = await query(
          `UPDATE signals SET
             symbol = $1, category = $2, action = $3, entry_price = $4,
             tp1 = $5, tp2 = $6, sl = $7, rationale = $8, timeframe = $9, status = $10
           WHERE id = $11
           RETURNING *`,
          [
            body.symbol ?? curr.symbol,
            body.category ?? curr.category,
            body.action ?? curr.action,
            body.entryPrice !== undefined ? body.entryPrice : curr.entry_price,
            body.tp1 !== undefined ? body.tp1 : curr.tp1,
            body.tp2 !== undefined ? body.tp2 : curr.tp2,
            body.sl !== undefined ? body.sl : curr.sl,
            body.rationale ?? curr.rationale,
            body.timeframe ?? curr.timeframe,
            body.status ?? curr.status,
            body.id,
          ],
        );

        return new Response(JSON.stringify({ success: true, signal: updated[0] }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error updating signal";
        return new Response(JSON.stringify({ success: false, message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
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
          return new Response(JSON.stringify({ success: false, message: "ID sinyal diperlukan" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        await query("DELETE FROM signals WHERE id = $1", [id]);
        return new Response(JSON.stringify({ success: true, message: "Sinyal berhasil dihapus" }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error deleting signal";
        return new Response(JSON.stringify({ success: false, message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
  }

  // /api/news
  if (url.pathname === "/api/news") {
    if (request.method === "GET") {
      try {
        const rows = await query("SELECT * FROM news ORDER BY created_at DESC");
        return new Response(JSON.stringify({ success: true, news: rows }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error fetching news";
        return new Response(JSON.stringify({ success: false, message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
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

        const slug =
          body.title
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
            body.title,
            body.category || "Special Article",
            body.excerpt,
            body.body,
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

        return new Response(JSON.stringify({ success: true, news: insert[0] }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error creating news";
        return new Response(JSON.stringify({ success: false, message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
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
          return new Response(
            JSON.stringify({ success: false, message: "Berita tidak ditemukan" }),
            { status: 404, headers: { "Content-Type": "application/json" } },
          );
        }

        const curr = existing[0];
        const updated = await query(
          `UPDATE news SET
             title = $1, category = $2, excerpt = $3, body = $4, status = $5, image_url = $6
           WHERE id = $7
           RETURNING *`,
          [
            body.title ?? curr.title,
            body.category ?? curr.category,
            body.excerpt ?? curr.excerpt,
            body.body ?? curr.body,
            body.status ?? curr.status,
            body.imageUrl ?? curr.image_url,
            body.id,
          ],
        );

        return new Response(JSON.stringify({ success: true, news: updated[0] }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error updating news";
        return new Response(JSON.stringify({ success: false, message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
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
          return new Response(JSON.stringify({ success: false, message: "ID berita diperlukan" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        await query("DELETE FROM news WHERE id = $1", [id]);
        return new Response(JSON.stringify({ success: true, message: "Berita berhasil dihapus" }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error deleting news";
        return new Response(JSON.stringify({ success: false, message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
  }

  // /api/currencies
  if (url.pathname === "/api/currencies") {
    if (request.method === "GET") {
      try {
        const rows = await query("SELECT * FROM currencies ORDER BY id ASC");
        return new Response(JSON.stringify({ success: true, currencies: rows }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error fetching currencies";
        return new Response(JSON.stringify({ success: false, message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
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
            body.symbol.toUpperCase().trim(),
            body.name,
            body.category || "Forex",
            body.price,
            body.decimals ?? 5,
            body.spread ?? 50,
            body.direction || "Acak",
            body.volatility ?? 30,
            body.active ?? true,
          ],
        );

        return new Response(JSON.stringify({ success: true, currency: insert[0] }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error creating currency";
        return new Response(JSON.stringify({ success: false, message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
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
          return new Response(
            JSON.stringify({ success: false, message: "Mata uang tidak ditemukan" }),
            { status: 404, headers: { "Content-Type": "application/json" } },
          );
        }

        const curr = existing[0];
        const updated = await query(
          `UPDATE currencies SET
             symbol = $1, name = $2, category = $3, price = $4, decimals = $5,
             spread = $6, direction = $7, volatility = $8, active = $9
           WHERE id = $10
           RETURNING *`,
          [
            body.symbol ? body.symbol.toUpperCase().trim() : curr.symbol,
            body.name ?? curr.name,
            body.category ?? curr.category,
            body.price !== undefined ? body.price : curr.price,
            body.decimals !== undefined ? body.decimals : curr.decimals,
            body.spread !== undefined ? body.spread : curr.spread,
            body.direction ?? curr.direction,
            body.volatility !== undefined ? body.volatility : curr.volatility,
            body.active !== undefined ? body.active : curr.active,
            body.id,
          ],
        );

        return new Response(JSON.stringify({ success: true, currency: updated[0] }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error updating currency";
        return new Response(JSON.stringify({ success: false, message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
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
          return new Response(
            JSON.stringify({ success: false, message: "ID mata uang diperlukan" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        await query("DELETE FROM currencies WHERE id = $1", [id]);
        return new Response(
          JSON.stringify({ success: true, message: "Mata uang berhasil dihapus" }),
          { headers: { "Content-Type": "application/json" } },
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error deleting currency";
        return new Response(JSON.stringify({ success: false, message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
  }

  // /api/referrals
  if (url.pathname === "/api/referrals") {
    if (request.method === "GET") {
      try {
        const rows = await query("SELECT * FROM referrals ORDER BY id DESC");
        return new Response(JSON.stringify({ success: true, referrals: rows }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error fetching referrals";
        return new Response(JSON.stringify({ success: false, message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    if (request.method === "POST") {
      try {
        const body = (await request.json()) as {
          userName: string;
          email: string;
          code: string;
          referredBy?: string;
          commission?: number;
        };

        const insert = await query(
          `INSERT INTO referrals (user_name, email, code, referred_by, commission, invitees_count)
           VALUES ($1, $2, $3, $4, $5, 0)
           RETURNING *`,
          [
            body.userName,
            body.email.toLowerCase().trim(),
            body.code.toUpperCase().trim(),
            body.referredBy || null,
            body.commission ?? 0,
          ],
        );

        return new Response(JSON.stringify({ success: true, referral: insert[0] }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error creating referral";
        return new Response(JSON.stringify({ success: false, message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
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
          return new Response(
            JSON.stringify({ success: false, message: "Referral tidak ditemukan" }),
            { status: 404, headers: { "Content-Type": "application/json" } },
          );
        }

        const curr = existing[0];
        const updated = await query(
          `UPDATE referrals SET
             user_name = $1, email = $2, code = $3, referred_by = $4, commission = $5, invitees_count = $6
           WHERE id = $7
           RETURNING *`,
          [
            body.userName ?? curr.user_name,
            body.email ? body.email.toLowerCase().trim() : curr.email,
            body.code ? body.code.toUpperCase().trim() : curr.code,
            body.referredBy !== undefined ? body.referredBy : curr.referred_by,
            body.commission !== undefined ? body.commission : curr.commission,
            body.inviteesCount !== undefined ? body.inviteesCount : curr.invitees_count,
            body.id,
          ],
        );

        return new Response(JSON.stringify({ success: true, referral: updated[0] }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error updating referral";
        return new Response(JSON.stringify({ success: false, message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
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
          return new Response(
            JSON.stringify({ success: false, message: "ID referral diperlukan" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        await query("DELETE FROM referrals WHERE id = $1", [id]);
        return new Response(
          JSON.stringify({ success: true, message: "Referral berhasil dihapus" }),
          { headers: { "Content-Type": "application/json" } },
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error deleting referral";
        return new Response(JSON.stringify({ success: false, message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
  }

  // /api/settings
  if (url.pathname === "/api/settings") {
    if (request.method === "GET") {
      try {
        const rows = await query<{ key: string; value: string }>("SELECT key, value FROM settings");
        const settingsMap: Record<string, string> = {};
        for (const row of rows) {
          settingsMap[row.key] = row.value;
        }
        return new Response(JSON.stringify({ success: true, settings: settingsMap }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error fetching settings";
        return new Response(JSON.stringify({ success: false, message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    if (request.method === "POST" || request.method === "PUT") {
      try {
        const body = (await request.json()) as Record<string, string>;
        for (const [key, value] of Object.entries(body)) {
          if (typeof key === "string" && typeof value === "string") {
            const existing = await query("SELECT key FROM settings WHERE key = $1", [key]);
            if (existing.length > 0) {
              await query(
                "UPDATE settings SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = $2",
                [value, key],
              );
            } else {
              await query(
                "INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP)",
                [key, value],
              );
            }
          }
        }

        const rows = await query<{ key: string; value: string }>("SELECT key, value FROM settings");
        const settingsMap: Record<string, string> = {};
        for (const row of rows) {
          settingsMap[row.key] = row.value;
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: "Pengaturan berhasil disimpan",
            settings: settingsMap,
          }),
          {
            headers: { "Content-Type": "application/json" },
          },
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error saving settings";
        return new Response(JSON.stringify({ success: false, message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
  }

  return new Response(JSON.stringify({ error: "Endpoint not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}
