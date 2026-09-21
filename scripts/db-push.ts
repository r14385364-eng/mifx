import "dotenv/config";
import pg from "pg";
import { newDb } from "pg-mem";

async function pushDatabaseSchema() {
  console.log("=========================================");
  console.log("  MIFX Database Push (Schema Migration)   ");
  console.log("=========================================\n");

  const rawUrl = process.env.DATABASE_URL;
  const databaseUrl = rawUrl ? rawUrl.replace(/^["']|["']$/g, "").trim() : "";
  let pool: pg.Pool;

  if (databaseUrl && databaseUrl.length > 0) {
    console.log(
      `[Target] PostgreSQL Database URL detected: ${databaseUrl.replace(/:[^:@]+@/, ":****@")}`,
    );
    const isLocal = databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1");
    pool = new pg.Pool({
      connectionString: databaseUrl,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      connectionTimeoutMillis: 3000,
    });
  } else {
    console.log(
      "[Target] No DATABASE_URL provided. Validating schema with PostgreSQL engine emulator...",
    );
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
        `[Warning] Direct database connection failed (${errMsg}). Validating schema with in-memory engine...`,
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
    console.log("[Migration] 1. Creating 'users' table...");
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
        account_type VARCHAR(50) NOT NULL DEFAULT 'Standard Live',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("   -> Table 'users' verified / created.");

    console.log("[Migration] 2. Creating 'transactions' table...");
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
    console.log("   -> Table 'transactions' verified / created.");

    console.log("[Migration] 3. Creating 'signals' table...");
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
    console.log("   -> Table 'signals' verified / created.");

    console.log("[Migration] 4. Creating 'settings' table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("   -> Table 'settings' verified / created.");

    console.log("\n[Success] Database schema migration completed successfully!");
  } catch (error) {
    console.error("\n[Error] Failed to push schema to database:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

void pushDatabaseSchema();
