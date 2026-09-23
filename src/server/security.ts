import crypto from "node:crypto";
import { query } from "./db";

// ============================================================================
// 1. APP SECRET & CRYPTOGRAPHIC ENGINE
// ============================================================================
const APP_SECRET =
  process.env.SESSION_SECRET ||
  process.env.APP_SECRET ||
  "gotrade_rbac_secure_enterprise_shield_2026_98x12";

// In-memory blacklist for revoked tokens (e.g. after user logout)
const revokedTokens = new Set<string>();

// In-memory fallback map for active sessions & backward compatibility
export const activeSessions = new Map<string, { userId: number; role: string }>();

// ============================================================================
// 2. PASSWORD HASHING (SCRYPT + SALT)
// ============================================================================
/**
 * Hashes a plaintext password using salted scrypt.
 * Output format: scrypt:<salt_hex>:<derived_key_hex>
 */
export function hashPassword(plainPassword: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(plainPassword, salt, 64).toString("hex");
  return `scrypt:${salt}:${derivedKey}`;
}

/**
 * Verifies a password against a stored hash or plaintext legacy password.
 * Returns { valid: boolean, needsRehash: boolean } to support seamless auto-migration.
 */
export function verifyPassword(
  plainPassword: string,
  storedPasswordOrHash: string,
): { valid: boolean; needsRehash: boolean } {
  if (!storedPasswordOrHash || !plainPassword) {
    return { valid: false, needsRehash: false };
  }

  // Modern salted scrypt hash
  if (storedPasswordOrHash.startsWith("scrypt:")) {
    try {
      const parts = storedPasswordOrHash.split(":");
      if (parts.length !== 3) return { valid: false, needsRehash: false };
      const salt = parts[1];
      const storedHash = parts[2];
      const derived = crypto.scryptSync(plainPassword, salt, 64).toString("hex");

      const bufA = Buffer.from(derived, "utf8");
      const bufB = Buffer.from(storedHash, "utf8");
      if (bufA.length !== bufB.length) return { valid: false, needsRehash: false };

      const valid = crypto.timingSafeEqual(bufA, bufB);
      return { valid, needsRehash: false };
    } catch {
      return { valid: false, needsRehash: false };
    }
  }

  // Legacy plaintext fallback (auto-flagged for rehash to eliminate plaintext)
  const isPlainMatch = plainPassword === storedPasswordOrHash;
  return { valid: isPlainMatch, needsRehash: isPlainMatch };
}

// ============================================================================
// 3. TAMPER-PROOF CRYPTOGRAPHIC TOKENS (HMAC-SHA256)
// ============================================================================
/**
 * Generates an HMAC-signed tamper-proof session token.
 * Format: gt_v2.<userId>.<role>.<issuedAt>.<expiresAt>.<hmacSignature>
 */
export function generateToken(userId: number, role = "user", ttlHours = 24 * 7): string {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + ttlHours * 60 * 60 * 1000;
  const payload = `${userId}.${role}.${issuedAt}.${expiresAt}`;
  const signature = crypto.createHmac("sha256", APP_SECRET).update(payload).digest("hex");
  const token = `gt_v2.${payload}.${signature}`;

  activeSessions.set(token, { userId, role });
  return token;
}

/**
 * Validates token signature, expiration, and revocation status.
 */
export function verifyToken(token: string): { userId: number; role: string } | null {
  if (!token || revokedTokens.has(token)) return null;

  // 1. Signed token verification (gt_v2)
  if (token.startsWith("gt_v2.")) {
    const parts = token.split(".");
    if (parts.length !== 6) return null;

    const [, userIdStr, role, , expiresAtStr, signature] = parts;
    const userId = parseInt(userIdStr, 10);
    const expiresAt = parseInt(expiresAtStr, 10);

    if (isNaN(userId) || isNaN(expiresAt) || !role || !signature) return null;

    // Expiry check
    if (Date.now() > expiresAt) {
      return null;
    }

    // Cryptographic signature check
    const payload = `${userId}.${role}.${parts[3]}.${expiresAt}`;
    const expectedSig = crypto.createHmac("sha256", APP_SECRET).update(payload).digest("hex");

    try {
      const bufA = Buffer.from(signature, "utf8");
      const bufB = Buffer.from(expectedSig, "utf8");
      if (bufA.length !== bufB.length) return null;
      if (!crypto.timingSafeEqual(bufA, bufB)) return null;

      return { userId, role };
    } catch {
      return null;
    }
  }

  // 2. Backward compatibility for legacy session tokens in active session cache
  const cached = activeSessions.get(token);
  if (cached) {
    return cached;
  }

  return null;
}

export function revokeToken(token: string): void {
  if (token) {
    revokedTokens.add(token);
    activeSessions.delete(token);
  }
}

// ============================================================================
// 4. ROLE-BASED ACCESS CONTROL (RBAC) PERMISSIONS MATRIX
// ============================================================================
export type Role = "admin" | "user";

export type Permission =
  | "users:read"
  | "users:write"
  | "users:delete"
  | "users:role_change"
  | "transactions:read_all"
  | "transactions:read_self"
  | "transactions:create"
  | "transactions:approve"
  | "transactions:reject"
  | "profit:manage"
  | "signals:read"
  | "signals:write"
  | "signals:delete"
  | "news:read"
  | "news:write"
  | "news:delete"
  | "currencies:read"
  | "currencies:write"
  | "currencies:delete"
  | "referrals:read_all"
  | "referrals:read_self"
  | "referrals:write"
  | "settings:read"
  | "settings:write"
  | "audit:read";

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  admin: [
    "users:read",
    "users:write",
    "users:delete",
    "users:role_change",
    "transactions:read_all",
    "transactions:read_self",
    "transactions:create",
    "transactions:approve",
    "transactions:reject",
    "profit:manage",
    "signals:read",
    "signals:write",
    "signals:delete",
    "news:read",
    "news:write",
    "news:delete",
    "currencies:read",
    "currencies:write",
    "currencies:delete",
    "referrals:read_all",
    "referrals:read_self",
    "referrals:write",
    "settings:read",
    "settings:write",
    "audit:read",
  ],
  user: [
    "transactions:read_self",
    "transactions:create",
    "signals:read",
    "news:read",
    "currencies:read",
    "referrals:read_self",
    "settings:read",
  ],
};

export function hasPermission(role: string, permission: Permission): boolean {
  const normalizedRole = (role === "admin" ? "admin" : "user") as Role;
  const permissions = ROLE_PERMISSIONS[normalizedRole] || [];
  return permissions.includes(permission);
}

// ============================================================================
// 5. BRUTE FORCE & RATE LIMITING DEFENSES
// ============================================================================
interface FailedAttemptInfo {
  count: number;
  firstAttempt: number;
  lockedUntil: number | null;
}

const loginFailures = new Map<string, FailedAttemptInfo>();
const generalRateLimits = new Map<string, number[]>();

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

export function checkLoginLockout(key: string): { isLocked: boolean; remainingMinutes: number } {
  const info = loginFailures.get(key);
  if (!info) return { isLocked: false, remainingMinutes: 0 };

  const now = Date.now();
  if (info.lockedUntil && info.lockedUntil > now) {
    const remainingMinutes = Math.ceil((info.lockedUntil - now) / 60000);
    return { isLocked: true, remainingMinutes };
  }

  // Clear if expired
  if (info.lockedUntil && info.lockedUntil <= now) {
    loginFailures.delete(key);
  }

  return { isLocked: false, remainingMinutes: 0 };
}

export function recordFailedLogin(key: string): { isLocked: boolean; remainingMinutes: number } {
  const now = Date.now();
  const info = loginFailures.get(key) || { count: 0, firstAttempt: now, lockedUntil: null };

  if (now - info.firstAttempt > ATTEMPT_WINDOW_MS) {
    info.count = 1;
    info.firstAttempt = now;
    info.lockedUntil = null;
  } else {
    info.count += 1;
  }

  if (info.count >= MAX_FAILED_ATTEMPTS) {
    info.lockedUntil = now + LOCKOUT_DURATION_MS;
    loginFailures.set(key, info);
    const remainingMinutes = Math.ceil(LOCKOUT_DURATION_MS / 60000);
    return { isLocked: true, remainingMinutes };
  }

  loginFailures.set(key, info);
  return { isLocked: false, remainingMinutes: 0 };
}

export function resetLoginLockout(key: string): void {
  loginFailures.delete(key);
}

export function checkRateLimit(key: string, limit = 30, windowMs = 60000): boolean {
  const now = Date.now();
  const timestamps = (generalRateLimits.get(key) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= limit) {
    generalRateLimits.set(key, timestamps);
    return false;
  }
  timestamps.push(now);
  generalRateLimits.set(key, timestamps);
  return true;
}

// ============================================================================
// 6. INPUT SANITIZATION & DEFENSIVE UTILS
// ============================================================================
export function sanitizeText(input?: unknown): string {
  if (input === undefined || input === null) return "";
  return String(input)
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .trim();
}

// ============================================================================
// 7. AUDIT LOGGING FOR RBAC & SECURITY EVENTS
// ============================================================================
export async function logSecurityEvent(params: {
  userId?: number | null;
  userEmail?: string | null;
  userRole?: string | null;
  action: string;
  details: string;
  ipAddress?: string | null;
  status?: "SUCCESS" | "BLOCKED" | "FAILED" | "WARNING";
}): Promise<void> {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, user_email, user_role, action, details, ip_address, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        params.userId || null,
        params.userEmail || null,
        params.userRole || null,
        params.action,
        params.details,
        params.ipAddress || "system",
        params.status || "SUCCESS",
      ],
    );
  } catch (err) {
    console.error("[Security Audit] Failed to persist audit log:", err);
  }
}
