import "dotenv/config";
import pg from "pg";
import { newDb } from "pg-mem";

async function seedDatabase() {
  console.log("=========================================");
  console.log("    Gotrade Database Seed Initial Data   ");
  console.log("=========================================\n");

  const rawUrl = process.env.DATABASE_URL;
  const databaseUrl = rawUrl ? rawUrl.replace(/^["']|["']$/g, "").trim() : "";
  let pool: pg.Pool;

  if (databaseUrl && databaseUrl.length > 0) {
    console.log(`[Target] PostgreSQL Database URL: ${databaseUrl.replace(/:[^:@]+@/, ":****@")}`);
    const isLocal = databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1");
    pool = new pg.Pool({
      connectionString: databaseUrl,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      connectionTimeoutMillis: 3000,
    });
  } else {
    console.log("[Target] No DATABASE_URL provided. Seeding PostgreSQL engine emulator...");
    const memDb = newDb({ autoCreateForeignKeyIndices: true });
    const client = memDb.adapters.createPg();
    pool = new client.Pool();
  }

  try {
    // Test connection
    try {
      await pool.query("SELECT 1");
    } catch (connErr: unknown) {
      const errMsg = connErr instanceof Error ? connErr.message : String(connErr);
      console.warn(
        `[Warning] Direct database connection failed (${errMsg}). Falling back to in-memory engine for seed...`,
      );
      try {
        await pool.end();
      } catch {
        /* ignore */
      }
      const memDb = newDb({ autoCreateForeignKeyIndices: true });
      const client = memDb.adapters.createPg();
      pool = new client.Pool();
    }
    // Ensure tables exist before seeding
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        account_number VARCHAR(50) NOT NULL,
        balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
        account_type VARCHAR(50) NOT NULL DEFAULT 'Standard Live',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("[Seeding] 1. Checking and seeding default users...");

    // Seed user account
    const userRes = await pool.query(`SELECT id FROM users WHERE email = $1`, ["user@mifx.com"]);
    if (userRes.rows.length === 0) {
      await pool.query(
        `INSERT INTO users (name, email, password, phone, role, account_number, balance, account_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          "Trader MIFX",
          "user@mifx.com",
          "user123",
          "0812-3456-7890",
          "user",
          "1006568912",
          10000.0,
          "Standard Live",
        ],
      );
      console.log("   -> Trader Account Created: user@mifx.com (Password: user123)");
    } else {
      console.log("   -> Trader Account already exists.");
    }

    // Seed admin account
    const adminRes = await pool.query(`SELECT id FROM users WHERE email = $1`, ["admin@mifx.com"]);
    if (adminRes.rows.length === 0) {
      await pool.query(
        `INSERT INTO users (name, email, password, phone, role, account_number, balance, account_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          "Administrator MIFX",
          "admin@mifx.com",
          "admin123",
          "0811-9876-5432",
          "admin",
          "9990001234",
          999999.0,
          "Admin Master",
        ],
      );
      console.log(
        "   -> Default Administrator Account Created: admin@mifx.com (Password: admin123)",
      );
    } else {
      console.log("   -> Default Administrator Account already exists.");
    }

    // Seed custom admin from .env
    const envAdminEmail = process.env.ADMIN_EMAIL?.replace(/^["']|["']$/g, "").trim();
    const envAdminPassword =
      process.env.ADMIN_PASSWORD?.replace(/^["']|["']$/g, "").trim() || "password123";

    if (envAdminEmail && envAdminEmail.length > 0 && envAdminEmail !== "admin@mifx.com") {
      const customAdminRes = await pool.query(`SELECT id FROM users WHERE email = $1`, [
        envAdminEmail,
      ]);
      if (customAdminRes.rows.length === 0) {
        await pool.query(
          `INSERT INTO users (name, email, password, phone, role, account_number, balance, account_type)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            "Administrator (Configured)",
            envAdminEmail,
            envAdminPassword,
            "0811-0000-1111",
            "admin",
            "9990005678",
            999999.0,
            "Admin Master",
          ],
        );
        console.log(
          `   -> Configured Admin Account Created: ${envAdminEmail} (Password: ${envAdminPassword})`,
        );
      } else {
        await pool.query(`UPDATE users SET password = $1, role = 'admin' WHERE email = $2`, [
          envAdminPassword,
          envAdminEmail,
        ]);
        console.log(
          `   -> Configured Admin Account Updated: ${envAdminEmail} (Password: ${envAdminPassword})`,
        );
      }
    }

    console.log("\n[Success] Database seeding finished successfully!");
  } catch (error) {
    console.error("\n[Error] Failed to seed database:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

void seedDatabase();
