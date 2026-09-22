import "dotenv/config";
import fs from "fs";
import path from "path";

// Disable pg-mem unread AST check warnings/errors
if (typeof process !== "undefined" && process.env) {
  process.env.NOCHECKFULLQUERYUSAGE = "true";
}

import { newDb } from "pg-mem";
import pg from "pg";

export type DbUser = {
  id: number;
  name: string;
  email: string;
  password: string;
  phone: string;
  role: "user" | "admin";
  account_number: string;
  balance: number;
  profit: number;
  account_type: string;
  created_at: string;
};

export type DbTransaction = {
  id: string;
  user_id: number;
  user_name: string;
  account_number: string;
  type: "Top Up" | "Withdraw";
  channel: string;
  destination: string;
  amount: number;
  status: "Menunggu" | "Berhasil" | "Ditolak";
  created_at: string;
};

export type DbSignal = {
  id: string;
  symbol: string;
  category: "Forex" | "Komoditi" | "Indeks";
  action: "BUY" | "SELL";
  entry_price: number;
  tp1: number;
  tp2: number;
  sl: number;
  rationale: string;
  timeframe: string;
  status: "Aktif" | "Target Tercapai" | "Stop Loss";
  created_at: string;
};

export type DbSetting = {
  key: string;
  value: string;
  updated_at: string;
};

export type DbNews = {
  id: number;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  body: string;
  date: string;
  read_minutes: number;
  status: "Terbit" | "Draf";
  image_url: string;
  created_at: string;
};

let poolInstance: pg.Pool | null = null;
let isInMemory = false;
let initPromise: Promise<void> | null = null;

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_FILE = path.join(DATA_DIR, "db_store.json");

function ensureDataDirExists() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch {
      // ignore
    }
  }
}

async function persistMemoryDb(pool: pg.Pool) {
  if (!isInMemory) return;
  try {
    ensureDataDirExists();
    const users = (await pool.query("SELECT * FROM users")).rows;
    const transactions = (await pool.query("SELECT * FROM transactions")).rows;
    const signals = (await pool.query("SELECT * FROM signals")).rows;
    const settings = (await pool.query("SELECT * FROM settings")).rows;
    const newsRes = await pool.query("SELECT * FROM news").catch(() => ({ rows: [] }));
    const news = newsRes.rows;

    const dataToSave = {
      users,
      transactions,
      signals,
      settings,
      news,
      savedAt: new Date().toISOString(),
    };

    fs.writeFileSync(STORE_FILE, JSON.stringify(dataToSave, null, 2), "utf-8");
  } catch (err) {
    console.error("[PostgreSQL] Error persisting in-memory database to disk:", err);
  }
}

function loadPersistedData(): {
  users?: DbUser[];
  transactions?: DbTransaction[];
  signals?: DbSignal[];
  settings?: DbSetting[];
  news?: DbNews[];
} | null {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const content = fs.readFileSync(STORE_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("[PostgreSQL] Failed to read persisted DB store file:", err);
  }
  return null;
}

function createMemoryPool(): pg.Pool {
  const memDb = newDb({
    autoCreateForeignKeyIndices: true,
  });
  const { Pool } = memDb.adapters.createPg();
  const pool = new Pool();
  return pool;
}

export function getPool(): pg.Pool {
  if (poolInstance) return poolInstance;

  const rawDatabaseUrl = process.env.DATABASE_URL;
  const databaseUrl = rawDatabaseUrl ? rawDatabaseUrl.replace(/^["']|["']$/g, "").trim() : "";

  if (databaseUrl && databaseUrl.length > 0) {
    console.log(
      "[PostgreSQL] Connecting to database via DATABASE_URL:",
      databaseUrl.replace(/:[^:@]+@/, ":****@"),
    );
    const isLocal = databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1");
    poolInstance = new pg.Pool({
      connectionString: databaseUrl,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      connectionTimeoutMillis: 3000,
    });
    isInMemory = false;
  } else {
    console.log("[PostgreSQL] Initializing standard PostgreSQL engine (in-memory pg emulation)");
    poolInstance = createMemoryPool();
    isInMemory = true;
  }

  return poolInstance;
}

export function isDatabaseInMemory(): boolean {
  return isInMemory;
}

async function runSchemaAndSeeds(pool: pg.Pool) {
  // Create users table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      role VARCHAR(50) NOT NULL DEFAULT 'user',
      account_number VARCHAR(50) NOT NULL,
      balance NUMERIC(15, 2) NOT NULL DEFAULT 10000.00,
      profit NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
      account_type VARCHAR(50) NOT NULL DEFAULT 'Standard Live',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ALTER TABLE users ADD COLUMN IF NOT EXISTS profit NUMERIC(15, 2) NOT NULL DEFAULT 0.00;
  `);

  // Create transactions table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id VARCHAR(50) PRIMARY KEY,
      user_id INT,
      user_name VARCHAR(255) NOT NULL,
      account_number VARCHAR(50) NOT NULL,
      type VARCHAR(50) NOT NULL,
      channel VARCHAR(100) NOT NULL,
      destination VARCHAR(100) NOT NULL,
      amount NUMERIC(15, 2) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Menunggu',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create signals table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS signals (
      id VARCHAR(50) PRIMARY KEY,
      symbol VARCHAR(50) NOT NULL,
      category VARCHAR(50) NOT NULL,
      action VARCHAR(10) NOT NULL,
      entry_price NUMERIC(15, 5) NOT NULL,
      tp1 NUMERIC(15, 5) NOT NULL,
      tp2 NUMERIC(15, 5) NOT NULL,
      sl NUMERIC(15, 5) NOT NULL,
      rationale TEXT,
      timeframe VARCHAR(20) NOT NULL DEFAULT 'H1',
      status VARCHAR(50) NOT NULL DEFAULT 'Aktif',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create settings table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      key VARCHAR(100) PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create news table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS news (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(255) UNIQUE NOT NULL,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      excerpt TEXT NOT NULL,
      body TEXT NOT NULL,
      date VARCHAR(100) NOT NULL,
      read_minutes INT NOT NULL DEFAULT 3,
      status VARCHAR(50) NOT NULL DEFAULT 'Terbit',
      image_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create currencies table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS currencies (
      id SERIAL PRIMARY KEY,
      symbol VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      category VARCHAR(50) NOT NULL,
      price NUMERIC(15, 5) NOT NULL,
      decimals INT NOT NULL DEFAULT 5,
      spread INT NOT NULL DEFAULT 50,
      direction VARCHAR(20) NOT NULL DEFAULT 'Acak',
      volatility INT NOT NULL DEFAULT 30,
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create referrals table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS referrals (
      id SERIAL PRIMARY KEY,
      user_id INT,
      user_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      code VARCHAR(50) UNIQUE NOT NULL,
      referred_by VARCHAR(50),
      commission NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
      invitees_count INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  if (isInMemory) {
    const saved = loadPersistedData();
    if (saved) {
      console.log("[PostgreSQL] Restoring persisted data snapshot from disk...");
      if (Array.isArray(saved.users) && saved.users.length > 0) {
        for (const u of saved.users) {
          await pool.query(
            `INSERT INTO users (name, email, password, phone, role, account_number, balance, account_type, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (email) DO UPDATE SET
               name = EXCLUDED.name,
               password = EXCLUDED.password,
               phone = EXCLUDED.phone,
               role = EXCLUDED.role,
               balance = EXCLUDED.balance,
               account_type = EXCLUDED.account_type`,
            [
              u.name,
              u.email,
              u.password,
              u.phone,
              u.role,
              u.account_number,
              u.balance,
              u.account_type,
              u.created_at || new Date().toISOString(),
            ],
          );
        }
      }

      if (Array.isArray(saved.transactions) && saved.transactions.length > 0) {
        for (const t of saved.transactions) {
          await pool.query(
            `INSERT INTO transactions (id, user_id, user_name, account_number, type, channel, destination, amount, status, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status`,
            [
              t.id,
              t.user_id,
              t.user_name,
              t.account_number,
              t.type,
              t.channel,
              t.destination,
              t.amount,
              t.status,
              t.created_at || new Date().toISOString(),
            ],
          );
        }
      }

      if (Array.isArray(saved.signals) && saved.signals.length > 0) {
        for (const s of saved.signals) {
          await pool.query(
            `INSERT INTO signals (id, symbol, category, action, entry_price, tp1, tp2, sl, rationale, timeframe, status, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             ON CONFLICT (id) DO UPDATE SET
               symbol = EXCLUDED.symbol,
               category = EXCLUDED.category,
               action = EXCLUDED.action,
               entry_price = EXCLUDED.entry_price,
               tp1 = EXCLUDED.tp1,
               tp2 = EXCLUDED.tp2,
               sl = EXCLUDED.sl,
               rationale = EXCLUDED.rationale,
               timeframe = EXCLUDED.timeframe,
               status = EXCLUDED.status`,
            [
              s.id,
              s.symbol,
              s.category,
              s.action,
              s.entry_price,
              s.tp1,
              s.tp2,
              s.sl,
              s.rationale,
              s.timeframe,
              s.status,
              s.created_at || new Date().toISOString(),
            ],
          );
        }
      }

      if (Array.isArray(saved.settings) && saved.settings.length > 0) {
        for (const st of saved.settings) {
          await pool.query(
            `INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, $3)
             ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at`,
            [st.key, st.value, st.updated_at || new Date().toISOString()],
          );
        }
      }

      if (Array.isArray(saved.news) && saved.news.length > 0) {
        for (const n of saved.news) {
          await pool.query(
            `INSERT INTO news (slug, title, category, excerpt, body, date, read_minutes, status, image_url, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (slug) DO UPDATE SET
               title = EXCLUDED.title,
               category = EXCLUDED.category,
               excerpt = EXCLUDED.excerpt,
               body = EXCLUDED.body,
               date = EXCLUDED.date,
               read_minutes = EXCLUDED.read_minutes,
               status = EXCLUDED.status,
               image_url = EXCLUDED.image_url`,
            [
              n.slug,
              n.title,
              n.category,
              n.excerpt,
              n.body,
              n.date,
              n.read_minutes,
              n.status,
              n.image_url,
              n.created_at || new Date().toISOString(),
            ],
          );
        }
      }
    }
  }

  // Seed default QRIS settings if not present
  const qrisCheck = await pool.query(`SELECT key FROM settings WHERE key = $1`, ["qris_image"]);
  if (qrisCheck.rows.length === 0) {
    await pool.query(`INSERT INTO settings (key, value) VALUES ($1, $2)`, ["qris_image", ""]);
    await pool.query(`INSERT INTO settings (key, value) VALUES ($1, $2)`, [
      "qris_merchant_name",
      "Gotrade Indonesia Official",
    ]);
    await pool.query(`INSERT INTO settings (key, value) VALUES ($1, $2)`, [
      "qris_payload",
      "00020101021226590014ID.LINKAJA.WWW01189360091100223030310215GOTRADEINDONESIA5204581253033605802ID5914GOTRADE INDONESIA6007JAKARTA61051234062070703A016304",
    ]);
  }

  // Migrate any previous mifx.com accounts to gotrade.com
  try {
    await pool.query(`UPDATE users SET email = 'user@gotrade.com' WHERE email = 'user@mifx.com'`);
    await pool.query(`UPDATE users SET email = 'admin@gotrade.com' WHERE email = 'admin@mifx.com'`);
  } catch {
    // Ignore if already migrated
  }

  // Seed default accounts if not existing
  const userCheck = await pool.query(`SELECT id FROM users WHERE email = $1`, ["user@gotrade.com"]);
  if (userCheck.rows.length === 0) {
    await pool.query(
      `INSERT INTO users (name, email, password, phone, role, account_number, balance, account_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        "Trader Gotrade",
        "user@gotrade.com",
        "user123",
        "+62 812-3456-7890",
        "user",
        "88910243",
        10000.0,
        "Standard Live",
      ],
    );
    console.log("[PostgreSQL] Seeded Trader account: user@gotrade.com / user123");
  }

  // Seed standard admin account
  const defaultAdminCheck = await pool.query(`SELECT id FROM users WHERE email = $1`, [
    "admin@gotrade.com",
  ]);
  if (defaultAdminCheck.rows.length === 0) {
    await pool.query(
      `INSERT INTO users (name, email, password, phone, role, account_number, balance, account_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        "Administrator Gotrade",
        "admin@gotrade.com",
        "admin123",
        "+62 811-9876-5432",
        "admin",
        "10000001",
        999999.0,
        "Admin Master",
      ],
    );
    console.log("[PostgreSQL] Seeded Administrator account: admin@gotrade.com / admin123");
  }

  // Default signals omitted to start with clean state

  // Seed or update custom admin account from environment (.env)
  const envAdminEmail = process.env.ADMIN_EMAIL?.replace(/^["']|["']$/g, "").trim();
  const envAdminPassword =
    process.env.ADMIN_PASSWORD?.replace(/^["']|["']$/g, "").trim() || "password123";

  if (
    envAdminEmail &&
    envAdminEmail.length > 0 &&
    envAdminEmail !== "admin@gotrade.com" &&
    envAdminEmail !== "admin@mifx.com"
  ) {
    const envAdminCheck = await pool.query(`SELECT id FROM users WHERE email = $1`, [
      envAdminEmail,
    ]);
    if (envAdminCheck.rows.length === 0) {
      await pool.query(
        `INSERT INTO users (name, email, password, phone, role, account_number, balance, account_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          "Admin (Configured)",
          envAdminEmail,
          envAdminPassword,
          "+62 811-0000-1111",
          "admin",
          "10000002",
          999999.0,
          "Admin Master",
        ],
      );
      console.log(`[PostgreSQL] Seeded Configured Admin from .env: ${envAdminEmail}`);
    } else {
      await pool.query(`UPDATE users SET password = $1, role = 'admin' WHERE email = $2`, [
        envAdminPassword,
        envAdminEmail,
      ]);
      console.log(`[PostgreSQL] Updated Configured Admin from .env: ${envAdminEmail}`);
    }
  }

  // Sync auto-increment sequences for users and news
  try {
    const maxUser = await pool.query<{ max: number }>("SELECT MAX(id) as max FROM users");
    const maxUserId = Number(maxUser.rows[0]?.max || 0);
    if (maxUserId > 0) {
      await pool.query(`SELECT setval('users_id_seq', $1, true)`, [maxUserId]);
    }
  } catch {
    // ignore
  }

  try {
    const maxNews = await pool.query<{ max: number }>("SELECT MAX(id) as max FROM news");
    const maxNewsId = Number(maxNews.rows[0]?.max || 0);
    if (maxNewsId > 0) {
      await pool.query(`SELECT setval('news_id_seq', $1, true)`, [maxNewsId]);
    }
  } catch {
    // ignore
  }

  // Persist initial state
  await persistMemoryDb(pool);
}

export async function initDatabase() {
  let pool = getPool();

  if (!isInMemory) {
    try {
      // Test the live connection first
      await pool.query("SELECT 1");
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(
        `[PostgreSQL] Connection to remote/local DATABASE_URL failed (${errMsg}). Seamlessly falling back to built-in in-memory PostgreSQL engine...`,
      );
      // Clean up failed pool if needed
      try {
        await pool.end();
      } catch {
        // ignore
      }
      pool = createMemoryPool();
      poolInstance = pool;
      isInMemory = true;
    }
  }

  await runSchemaAndSeeds(pool);
}

export async function query<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
  await ensureDbReady();
  let pool = getPool();
  try {
    const res = await pool.query(sql, params);
    const sqlUpper = sql.trim().toUpperCase();
    if (
      isInMemory &&
      (sqlUpper.startsWith("INSERT") ||
        sqlUpper.startsWith("UPDATE") ||
        sqlUpper.startsWith("DELETE"))
    ) {
      void persistMemoryDb(pool);
    }
    return res.rows as T[];
  } catch (err: unknown) {
    if (!isInMemory) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(
        `[PostgreSQL] Query failed on pool (${errMsg}). Switching to in-memory PostgreSQL engine...`,
      );
      pool = createMemoryPool();
      poolInstance = pool;
      isInMemory = true;
      await runSchemaAndSeeds(pool);
      const retryRes = await pool.query(sql, params);
      const sqlUpper = sql.trim().toUpperCase();
      if (
        sqlUpper.startsWith("INSERT") ||
        sqlUpper.startsWith("UPDATE") ||
        sqlUpper.startsWith("DELETE")
      ) {
        void persistMemoryDb(pool);
      }
      return retryRes.rows as T[];
    }
    throw err;
  }
}

export function ensureDbReady(): Promise<void> {
  if (!initPromise) {
    initPromise = initDatabase().catch((err) => {
      console.error("[PostgreSQL] Error during ensureDbReady:", err);
      // Fallback to memory on failure so subsequent queries don't fail permanently
      poolInstance = createMemoryPool();
      isInMemory = true;
      return runSchemaAndSeeds(poolInstance).then(() => {
        // ready
      });
    });
  }
  return initPromise;
}

export const initDb = ensureDbReady;
