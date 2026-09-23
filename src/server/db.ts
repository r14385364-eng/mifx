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
  username?: string;
  email: string;
  password: string;
  phone: string;
  role: "user" | "admin";
  account_number: string;
  balance: number;
  profit: number;
  account_type: string;
  referred_by?: string;
  created_at: string;
};

export type DbTransaction = {
  id: string;
  user_id: number;
  user_name: string;
  account_number: string;
  type: "Top Up" | "Withdraw" | "Profit";
  channel: string;
  destination: string;
  amount: number;
  status: "Menunggu" | "Berhasil" | "Ditolak";
  proof_image?: string | null;
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

export type DbAuditLog = {
  id: number;
  user_id: number | null;
  user_email: string | null;
  user_role: string | null;
  action: string;
  details: string;
  ip_address: string;
  status: string;
  created_at: string;
};

export type DbNotification = {
  id: number;
  title: string;
  message: string;
  type: "info" | "promo" | "alert" | "system" | "trading" | string;
  target: string;
  is_pinned: boolean;
  badge: string | null;
  author: string;
  action_url: string | null;
  created_at: string;
  updated_at: string;
};

export type DbReward = {
  id: number;
  title: string;
  category: string;
  points_required: number;
  stock: number;
  image_url: string;
  description: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type DbRewardRedemption = {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  reward_id: number;
  reward_title: string;
  points_spent: number;
  status: "PENDING" | "PROCESSED" | "COMPLETED" | "REJECTED";
  shipping_address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
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

let persistTimer: NodeJS.Timeout | null = null;

async function persistMemoryDb(pool: pg.Pool) {
  if (!isInMemory) return;
  if (persistTimer) {
    clearTimeout(persistTimer);
  }
  persistTimer = setTimeout(async () => {
    try {
      ensureDataDirExists();
      const users = (await pool.query("SELECT * FROM users")).rows;
      const transactions = (await pool.query("SELECT * FROM transactions")).rows;
      const signals = (await pool.query("SELECT * FROM signals")).rows;
      const settings = (await pool.query("SELECT * FROM settings")).rows;
      const newsRes = await pool.query("SELECT * FROM news").catch(() => ({ rows: [] }));
      const news = newsRes.rows;
      const notificationsRes = await pool
        .query("SELECT * FROM notifications")
        .catch(() => ({ rows: [] }));
      const notifications = notificationsRes.rows;
      const rewardsRes = await pool.query("SELECT * FROM rewards").catch(() => ({ rows: [] }));
      const rewards = rewardsRes.rows;
      const redemptionsRes = await pool
        .query("SELECT * FROM reward_redemptions")
        .catch(() => ({ rows: [] }));
      const reward_redemptions = redemptionsRes.rows;

      const dataToSave = {
        users,
        transactions,
        signals,
        settings,
        news,
        notifications,
        rewards,
        reward_redemptions,
        savedAt: new Date().toISOString(),
      };

      await fs.promises.writeFile(STORE_FILE, JSON.stringify(dataToSave, null, 2), "utf-8");
    } catch (err) {
      console.error("[PostgreSQL] Error persisting in-memory database to disk:", err);
    }
  }, 500);
}

function loadPersistedData(): {
  users?: DbUser[];
  transactions?: DbTransaction[];
  signals?: DbSignal[];
  settings?: DbSetting[];
  news?: DbNews[];
  notifications?: DbNotification[];
  rewards?: DbReward[];
  reward_redemptions?: DbRewardRedemption[];
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
      username VARCHAR(100),
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      role VARCHAR(50) NOT NULL DEFAULT 'user',
      account_number VARCHAR(50) NOT NULL,
      balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
      profit NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
      account_type VARCHAR(50) NOT NULL DEFAULT 'Standard Live',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by VARCHAR(100);
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
      proof_image TEXT,
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

  // Create audit_logs table for RBAC & Security Audit Trail
  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      user_id INT,
      user_email VARCHAR(255),
      user_role VARCHAR(50),
      action VARCHAR(100) NOT NULL,
      details TEXT,
      ip_address VARCHAR(100),
      status VARCHAR(20) DEFAULT 'SUCCESS',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create notifications table for broadcast & system announcements
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(50) NOT NULL DEFAULT 'info',
      target VARCHAR(50) NOT NULL DEFAULT 'all',
      is_pinned BOOLEAN NOT NULL DEFAULT false,
      badge VARCHAR(50),
      author VARCHAR(100) DEFAULT 'Administrator',
      action_url VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create rewards table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS rewards (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL DEFAULT 'Gadget',
      points_required INT NOT NULL DEFAULT 10,
      stock INT NOT NULL DEFAULT 10,
      image_url TEXT,
      description TEXT,
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create reward_redemptions table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reward_redemptions (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL,
      user_name VARCHAR(255) NOT NULL,
      user_email VARCHAR(255) NOT NULL,
      reward_id INT NOT NULL,
      reward_title VARCHAR(255) NOT NULL,
      points_spent INT NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
      shipping_address TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
            `INSERT INTO transactions (id, user_id, user_name, account_number, type, channel, destination, amount, status, proof_image, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, proof_image = COALESCE(EXCLUDED.proof_image, transactions.proof_image)`,
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
              t.proof_image || null,
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

      if (Array.isArray(saved.notifications) && saved.notifications.length > 0) {
        for (const notif of saved.notifications) {
          await pool.query(
            `INSERT INTO notifications (id, title, message, type, target, is_pinned, badge, author, action_url, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             ON CONFLICT (id) DO UPDATE SET
               title = EXCLUDED.title,
               message = EXCLUDED.message,
               type = EXCLUDED.type,
               target = EXCLUDED.target,
               is_pinned = EXCLUDED.is_pinned,
               badge = EXCLUDED.badge,
               author = EXCLUDED.author,
               action_url = EXCLUDED.action_url,
               updated_at = EXCLUDED.updated_at`,
            [
              notif.id,
              notif.title,
              notif.message,
              notif.type,
              notif.target,
              notif.is_pinned,
              notif.badge,
              notif.author || "Administrator",
              notif.action_url,
              notif.created_at || new Date().toISOString(),
              notif.updated_at || new Date().toISOString(),
            ],
          );
        }
      }

      if (Array.isArray(saved.rewards) && saved.rewards.length > 0) {
        for (const r of saved.rewards) {
          await pool.query(
            `INSERT INTO rewards (id, title, category, points_required, stock, image_url, description, active, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (id) DO UPDATE SET
               title = EXCLUDED.title,
               category = EXCLUDED.category,
               points_required = EXCLUDED.points_required,
               stock = EXCLUDED.stock,
               image_url = EXCLUDED.image_url,
               description = EXCLUDED.description,
               active = EXCLUDED.active,
               updated_at = EXCLUDED.updated_at`,
            [
              r.id,
              r.title,
              r.category,
              r.points_required,
              r.stock,
              r.image_url,
              r.description,
              r.active ?? true,
              r.created_at || new Date().toISOString(),
              r.updated_at || new Date().toISOString(),
            ],
          );
        }
      }

      if (Array.isArray(saved.reward_redemptions) && saved.reward_redemptions.length > 0) {
        for (const red of saved.reward_redemptions) {
          await pool.query(
            `INSERT INTO reward_redemptions (id, user_id, user_name, user_email, reward_id, reward_title, points_spent, status, shipping_address, notes, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             ON CONFLICT (id) DO UPDATE SET
               status = EXCLUDED.status,
               notes = EXCLUDED.notes,
               updated_at = EXCLUDED.updated_at`,
            [
              red.id,
              red.user_id,
              red.user_name,
              red.user_email,
              red.reward_id,
              red.reward_title,
              red.points_spent,
              red.status,
              red.shipping_address,
              red.notes,
              red.created_at || new Date().toISOString(),
              red.updated_at || new Date().toISOString(),
            ],
          );
        }
      }
    }
  }

  // Seed default notifications if table is empty
  const notifCount = await pool.query<{ count: string }>(
    "SELECT COUNT(*) as count FROM notifications",
  );
  if (parseInt(notifCount.rows[0]?.count || "0", 10) === 0) {
    const defaultNotifs = [
      {
        title: "Selamat Datang di Platform Gotrade!",
        message:
          "Nikmati pengalaman trading forex dan komoditas dengan spread terendah, eksekusi pasar ultra cepat tanpa requote, dan leverage fleksibel hingga 1:500. Silakan jelajahi instrumen pasar favorit Anda.",
        type: "info",
        target: "all",
        is_pinned: true,
        badge: "Pengumuman",
        author: "Administrator",
        action_url: "/trade",
      },
      {
        title: "Pembaruan Keamanan RBAC & HMAC-SHA256 Aktif",
        message:
          "Gotrade telah memperketat standar keamanan akun dengan enkripsi password Salted Scrypt, token sesi HMAC-SHA256 kebal pemalsuan, dan proteksi brute-force otomatis demi menjaga keamanan aset Anda.",
        type: "system",
        target: "all",
        is_pinned: true,
        badge: "Keamanan",
        author: "Security Team",
        action_url: "/beranda",
      },
      {
        title: "Bonus Deposit 20% Minggu Ini untuk Semua Trader",
        message:
          "Tingkatkan ketahanan modal trading Anda! Dapatkan bonus deposit instan sebesar 20% untuk setiap top up minimal $1,000 USD via QRIS maupun Transfer Bank. Promo terbatas minggu ini.",
        type: "promo",
        target: "all",
        is_pinned: false,
        badge: "Hot Promo",
        author: "Marketing Gotrade",
        action_url: "/deposit",
      },
      {
        title: "Pemberitahuan Likuiditas Pasar Menjelang Rilis Data US",
        message:
          "Harap perhatikan volatilitas tinggi dan pelebaran spread selama rilis berita ekonomi High Impact Amerika Serikat. Pastikan kecukupan margin akun Anda.",
        type: "alert",
        target: "all",
        is_pinned: false,
        badge: "Peringatan",
        author: "Risk Management",
        action_url: "/pasar",
      },
    ];

    for (const dn of defaultNotifs) {
      await pool.query(
        `INSERT INTO notifications (title, message, type, target, is_pinned, badge, author, action_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          dn.title,
          dn.message,
          dn.type,
          dn.target,
          dn.is_pinned,
          dn.badge,
          dn.author,
          dn.action_url,
        ],
      );
    }
    console.log("[PostgreSQL] Seeded 4 default broadcast notifications");
  }

  // Seed default Rewards catalog if empty
  const rewardCount = await pool.query<{ count: string }>("SELECT COUNT(*) as count FROM rewards");
  if (parseInt(rewardCount.rows[0]?.count || "0", 10) === 0) {
    const defaultRewards = [
      {
        title: "iPhone 16 Pro Max 256GB Desert Titanium",
        category: "Gadget",
        points_required: 25,
        stock: 5,
        image_url:
          "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80",
        description:
          "Smartphone flagship Apple terbaru dengan chip A18 Pro, kamera 48MP Fusion, titanium grade 5, dan daya tahan baterai terpanjang.",
        active: true,
      },
      {
        title: 'Apple MacBook Air 13" M3 Chip 512GB',
        category: "Gadget",
        points_required: 20,
        stock: 5,
        image_url:
          "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
        description:
          "Laptop ultra tipis dan kencang bertenaga Apple Silicon M3, layar Liquid Retina 13.6 inci, 16GB Unified Memory.",
        active: true,
      },
      {
        title: "Logam Mulia Emas Antam 10 Gram CertiCard",
        category: "Logam Mulia",
        points_required: 15,
        stock: 12,
        image_url:
          "https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=800&q=80",
        description:
          "Emas batangan murni 24 Karat (99.99%) cetakan PT Antam Tbk dengan kemasan CertiCard pengaman resmi.",
        active: true,
      },
      {
        title: "Apple Watch Series 10 GPS 46mm Jet Black",
        category: "Gadget",
        points_required: 8,
        stock: 10,
        image_url:
          "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80",
        description:
          "Jam pintar layar OLED wide-angle tercanggih, sensor detak jantung ECG, pelacak kebugaran dan aktivitas trading harian.",
        active: true,
      },
      {
        title: "Saldo E-Wallet Rp 5.000.000 (GoPay/OVO/DANA)",
        category: "E-Wallet",
        points_required: 5,
        stock: 50,
        image_url:
          "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80",
        description:
          "Top-up saldo digital instan Rp 5.000.000 langsung ke akun GoPay, OVO, DANA, atau ShopeePay yang Anda daftarkan.",
        active: true,
      },
      {
        title: "Saldo E-Wallet Rp 2.000.000 (GoPay/OVO/DANA)",
        category: "E-Wallet",
        points_required: 2,
        stock: 100,
        image_url:
          "https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&w=800&q=80",
        description:
          "Top-up saldo digital instan Rp 2.000.000 langsung ke nomor e-wallet pilihan Anda tanpa potongan.",
        active: true,
      },
      {
        title: "Gotrade VIP Windbreaker Jacket & Polo Shirt",
        category: "Merchandise",
        points_required: 1,
        stock: 150,
        image_url:
          "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80",
        description:
          "Merchandise eksklusif Gotrade VIP berupa Jaket Windbreaker tahan air & Polo Shirt bordir premium edisi terbatas.",
        active: true,
      },
    ];

    for (const rew of defaultRewards) {
      await pool.query(
        `INSERT INTO rewards (title, category, points_required, stock, image_url, description, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          rew.title,
          rew.category,
          rew.points_required,
          rew.stock,
          rew.image_url,
          rew.description,
          rew.active,
        ],
      );
    }
    console.log("[PostgreSQL] Seeded 7 default Gotrade Rewards catalog items");
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
    await pool.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS proof_image TEXT`);
    await pool.query(`UPDATE users SET email = 'user@gotrade.com' WHERE email = 'user@mifx.com'`);
    await pool.query(`UPDATE users SET email = 'admin@gotrade.com' WHERE email = 'admin@mifx.com'`);
    // Fix existing registered accounts that were mistakenly initialized with 10000 balance
    await pool.query(
      `UPDATE users SET balance = 0.00 WHERE role = 'user' AND email != 'user@gotrade.com' AND balance = 10000.00`,
    );
    // Reset seed user if corrupted with 510000
    await pool.query(
      `UPDATE users SET balance = 10000.00 WHERE email = 'user@gotrade.com' AND balance = 510000.00`,
    );
    // Fix any testing or live accounts that got inflated because of IDR top up without conversion to USD
    const inflatedRes = await pool.query<{
      id: number;
      email: string;
      balance: number;
      profit: number;
    }>(`SELECT id, email, balance, profit FROM users WHERE role = 'user' AND balance >= 50000.00`);
    for (const u of inflatedRes.rows) {
      const currentTotal = Number(u.balance);
      const currentProfit = Number(u.profit) || 0;
      const depositPart = currentTotal - currentProfit;
      const normalizedDeposit =
        depositPart >= 50000 ? Math.round((depositPart / 16000) * 100) / 100 : depositPart;
      const newBalance = normalizedDeposit + currentProfit;
      await pool.query(`UPDATE users SET balance = $1 WHERE id = $2`, [newBalance, u.id]);
    }
  } catch (err) {
    console.warn("[PostgreSQL] Migration note:", err);
  }

  // Seed default accounts if not existing
  const userCheck = await pool.query(`SELECT id FROM users WHERE email = $1`, ["user@gotrade.com"]);
  if (userCheck.rows.length === 0) {
    await pool.query(
      `INSERT INTO users (name, username, email, password, phone, role, account_number, balance, account_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        "Trader Gotrade",
        "trader_gotrade",
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
  } else {
    await pool.query(
      `UPDATE users SET username = 'trader_gotrade' WHERE email = 'user@gotrade.com' AND (username IS NULL OR username = '')`,
    );
  }

  // Seed or update admin account from environment (.env)
  const rawAdminEmail = process.env.ADMIN_EMAIL?.replace(/^["']|["']$/g, "").trim();
  const rawAdminPassword = process.env.ADMIN_PASSWORD?.replace(/^["']|["']$/g, "").trim();
  const envAdminEmail = rawAdminEmail || "admin@gotrade.com";
  const envAdminPassword = rawAdminPassword || "password123";

  // Always ensure standard admin account admin@gotrade.com exists and has current env password
  const defaultAdminCheck = await pool.query(
    `SELECT id FROM users WHERE LOWER(email) = 'admin@gotrade.com'`,
  );
  if (defaultAdminCheck.rows.length === 0) {
    await pool.query(
      `INSERT INTO users (name, username, email, password, phone, role, account_number, balance, account_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        "Administrator Gotrade",
        "admin_gotrade",
        "admin@gotrade.com",
        envAdminPassword,
        "+62 811-9876-5432",
        "admin",
        "10000001",
        999999.0,
        "Admin Master",
      ],
    );
    console.log(
      `[PostgreSQL] Seeded Administrator account: admin@gotrade.com / ${envAdminPassword}`,
    );
  } else {
    // Sync password with .env config
    await pool.query(
      `UPDATE users SET password = $1, role = 'admin' WHERE LOWER(email) = 'admin@gotrade.com'`,
      [envAdminPassword],
    );
    await pool.query(
      `UPDATE users SET username = 'admin_gotrade' WHERE LOWER(email) = 'admin@gotrade.com' AND (username IS NULL OR username = '')`,
    );
    console.log(`[PostgreSQL] Synchronized Administrator password for admin@gotrade.com`);
  }

  // Sync referrals table with existing users to ensure everyone has a referral code matching their username
  try {
    const existingUsers = await pool.query<{
      id: number;
      name: string;
      username: string;
      email: string;
    }>("SELECT id, name, username, email FROM users WHERE username IS NOT NULL AND username != ''");
    for (const u of existingUsers.rows) {
      const code = u.username;
      const refCheck = await pool.query("SELECT id FROM referrals WHERE LOWER(code) = LOWER($1)", [
        code,
      ]);
      if (refCheck.rows.length === 0) {
        await pool.query(
          "INSERT INTO referrals (user_id, user_name, email, code, commission, invitees_count) VALUES ($1, $2, $3, $4, 0.00, 0)",
          [u.id, u.name, u.email, code],
        );
      }
    }
  } catch (err) {
    console.warn("[PostgreSQL] Sync referrals table note:", err);
  }

  // If a distinct ADMIN_EMAIL is configured in .env, seed/update it as well
  if (
    rawAdminEmail &&
    rawAdminEmail.toLowerCase() !== "admin@gotrade.com" &&
    rawAdminEmail.toLowerCase() !== "admin@mifx.com"
  ) {
    const envAdminCheck = await pool.query(`SELECT id FROM users WHERE LOWER(email) = LOWER($1)`, [
      rawAdminEmail,
    ]);
    if (envAdminCheck.rows.length === 0) {
      await pool.query(
        `INSERT INTO users (name, email, password, phone, role, account_number, balance, account_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          "Admin (Configured)",
          rawAdminEmail,
          envAdminPassword,
          "+62 811-0000-1111",
          "admin",
          "10000002",
          999999.0,
          "Admin Master",
        ],
      );
      console.log(`[PostgreSQL] Seeded Configured Admin from .env: ${rawAdminEmail}`);
    } else {
      await pool.query(
        `UPDATE users SET password = $1, role = 'admin' WHERE LOWER(email) = LOWER($2)`,
        [envAdminPassword, rawAdminEmail],
      );
      console.log(`[PostgreSQL] Updated Configured Admin from .env: ${rawAdminEmail}`);
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

  try {
    const maxNotif = await pool.query<{ max: number }>("SELECT MAX(id) as max FROM notifications");
    const maxNotifId = Number(maxNotif.rows[0]?.max || 0);
    if (maxNotifId > 0) {
      await pool.query(`SELECT setval('notifications_id_seq', $1, true)`, [maxNotifId]);
    }
  } catch {
    // ignore
  }

  try {
    const maxReward = await pool.query<{ max: number }>("SELECT MAX(id) as max FROM rewards");
    const maxRewardId = Number(maxReward.rows[0]?.max || 0);
    if (maxRewardId > 0) {
      await pool.query(`SELECT setval('rewards_id_seq', $1, true)`, [maxRewardId]);
    }
  } catch {
    // ignore
  }

  try {
    const maxRed = await pool.query<{ max: number }>(
      "SELECT MAX(id) as max FROM reward_redemptions",
    );
    const maxRedId = Number(maxRed.rows[0]?.max || 0);
    if (maxRedId > 0) {
      await pool.query(`SELECT setval('reward_redemptions_id_seq', $1, true)`, [maxRedId]);
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
