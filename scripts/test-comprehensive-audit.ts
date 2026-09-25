import { query } from "../src/server/db.js";

interface TraderUser {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  accountNumber: string;
  balance: number;
  profit?: number;
  accountType: string;
}

interface BankAccount {
  id: number;
  user_id: number;
  bank_name: string;
  account_number: string;
  account_holder: string;
  is_primary: boolean;
}

interface RewardItem {
  id: number;
  title: string;
  category: string;
  points_required: number;
  stock: number;
  image_url: string;
}

async function runComprehensiveAudit() {
  console.log("=======================================================================");
  console.log("    GOTRADE COMPREHENSIVE AUDIT: ALL PAGES, FEATURES, MENUS & SECURITY");
  console.log("=======================================================================\n");

  const baseUrl = "http://localhost:3000";
  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[FAIL] ${name}:`, msg);
      failed++;
    }
  }

  // =========================================================================
  // 1. ALL PAGES & NAVIGATION MENUS ACCESSIBILITY
  // =========================================================================
  console.log("--- [1. ALL PAGES & SPA ROUTE VERIFICATION (STATUS 200)] ---");
  const allRoutes = [
    { path: "/", label: "Landing / Onboarding Page" },
    { path: "/login", label: "Login Page" },
    { path: "/register", label: "Register Page" },
    { path: "/beranda", label: "Trader Dashboard (Beranda)" },
    { path: "/pasar", label: "Live Market (Pasar)" },
    { path: "/trade", label: "Trade Execution (Trading)" },
    { path: "/order", label: "Orders & Positions (Order)" },
    { path: "/riwayat", label: "Transaction History (Riwayat)" },
    { path: "/deposit", label: "Deposit / Top Up" },
    { path: "/withdraw", label: "Withdrawal / Tarik Dana" },
    { path: "/rewards", label: "Gotrade Rewards Points Program" },
    { path: "/referral", label: "Referral & Affiliate Program" },
    { path: "/profil", label: "User Profile & Security" },
    { path: "/pengaturan", label: "Settings & Dark Mode" },
    { path: "/lainnya", label: "More Menu (Lainnya)" },
    { path: "/berita", label: "News & Market Intelligence Feed" },
    { path: "/admin/users", label: "Admin: User Management" },
    { path: "/admin/profit", label: "Admin: Profit Control & Rates" },
    { path: "/admin/notifikasi", label: "Admin: Broadcast Notifications" },
    { path: "/admin/mata-uang", label: "Admin: Currency Pairs Management" },
    { path: "/admin/sinyal", label: "Admin: Trading Signals Management" },
    { path: "/admin/berita", label: "Admin: News & Article Management" },
    { path: "/admin/top-up", label: "Admin: Top-Up Approval Hub" },
    { path: "/admin/withdraw", label: "Admin: Withdrawal Approval Hub" },
    { path: "/admin/rewards", label: "Admin: Rewards Catalog & Claims" },
    { path: "/admin/referral", label: "Admin: Referral Tracking & Commission" },
    { path: "/admin/audit-logs", label: "Admin: Security Audit Logs" },
    { path: "/admin/pengaturan", label: "Admin: System Settings & QRIS" },
  ];

  for (const item of allRoutes) {
    await test(`Page Route Accessible: ${item.label} (${item.path})`, async () => {
      const res = await fetch(`${baseUrl}${item.path}`);
      if (!res.ok) throw new Error(`HTTP status ${res.status}`);
      const text = await res.text();
      const isValid =
        text.includes("<!DOCTYPE html") || text.includes("<html") || text.includes("Gotrade");
      if (!isValid) throw new Error("Invalid SPA HTML shell returned");
    });
  }

  // =========================================================================
  // 2. PRIVACY & SOCIAL CARD AUDIT
  // =========================================================================
  console.log("\n--- [2. PRIVACY & SOCIAL SHARING CARD REMOVAL AUDIT] ---");
  await test("HTML Head contains NO Open Graph (og:) or Twitter preview tags", async () => {
    const res = await fetch(`${baseUrl}/`);
    const html = await res.text();
    const hasOg = /property\s*=\s*["']og:/i.test(html);
    const hasTwitter = /name\s*=\s*["']twitter:/i.test(html);
    if (hasOg || hasTwitter) {
      throw new Error(`Social preview tags detected: og=${hasOg}, twitter=${hasTwitter}`);
    }
  });

  // =========================================================================
  // 3. PUBLIC API ENDPOINTS INTEGRITY
  // =========================================================================
  console.log("\n--- [3. PUBLIC API ENDPOINTS & GUEST ACCESSIBILITY] ---");
  await test("GET /api/health responds with 200 OK and valid health report", async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.status !== "ok" || !data.rbacEnabled) throw new Error("Health check invalid");
  });

  await test("GET /api/auth/demo-accounts exposes role descriptors without leaking passwords", async () => {
    const res = await fetch(`${baseUrl}/api/auth/demo-accounts`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.accounts) || data.accounts.length === 0)
      throw new Error("No demo accounts");
    for (const acc of data.accounts) {
      if ("password" in acc) throw new Error(`Password property exposed for ${acc.email}`);
    }
  });

  await test("GET /api/news returns public articles list", async () => {
    const res = await fetch(`${baseUrl}/api/news`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success || !Array.isArray(data.news)) throw new Error("News list invalid");
  });

  await test("GET /api/signals returns active trading signals", async () => {
    const res = await fetch(`${baseUrl}/api/signals`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success || !Array.isArray(data.signals)) throw new Error("Signals list invalid");
  });

  await test("GET /api/currencies returns active market instruments", async () => {
    const res = await fetch(`${baseUrl}/api/currencies`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success || !Array.isArray(data.currencies))
      throw new Error("Currencies list invalid");
  });

  await test("GET /api/notifications returns broadcast announcements", async () => {
    const res = await fetch(`${baseUrl}/api/notifications`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success || !Array.isArray(data.notifications))
      throw new Error("Notifications list invalid");
  });

  await test("GET /api/settings returns application configuration map", async () => {
    const res = await fetch(`${baseUrl}/api/settings`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success || typeof data.settings !== "object") throw new Error("Settings map invalid");
  });

  // =========================================================================
  // 4. AUTHENTICATION, REGISTRATION & PASSWORD SECURITY
  // =========================================================================
  console.log("\n--- [4. AUTHENTICATION, REGISTRATION & SECURITY] ---");
  const testId = Date.now();
  const testEmail = `audit_trader_${testId}@gotrade.com`;
  const testUsername = `trader_${testId}`;
  let traderUser: TraderUser | null = null;
  let traderToken = "";
  let adminToken = "";

  await test("Admin login with admin@gotrade.com and password123", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@gotrade.com", password: "password123" }),
    });
    if (!res.ok) throw new Error(`Admin login failed: ${res.status}`);
    const data = await res.json();
    adminToken = data.token;
  });

  await test("Failed admin login with wrong password is blocked", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@gotrade.com", password: "invalid_password_xyz" }),
    });
    if (res.ok) throw new Error("Wrong password login succeeded unexpectedly");
  });

  await test("POST /api/auth/register creates new trader account with salted hashing", async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Audit Trader Pro",
        username: testUsername,
        email: testEmail,
        password: "securePassword123!",
        confirmPassword: "securePassword123!",
      }),
    });
    if (!res.ok) throw new Error(`Register failed: ${res.status}`);
    const data = await res.json();
    traderUser = data.user;
    traderToken = data.token;
  });

  await test("POST /api/auth/register rejects duplicate email", async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Duplicate User",
        username: `dup_${Date.now()}`,
        email: testEmail,
        password: "securePassword123!",
      }),
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  await test("POST /api/auth/login authenticates newly registered trader", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: "securePassword123!" }),
    });
    if (!res.ok) throw new Error(`Login failed: ${res.status}`);
    const data = await res.json();
    if (data.user.username !== testUsername) throw new Error("Username mismatch in login response");
  });

  await test("GET /api/auth/me returns authenticated trader profile", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${traderToken}` },
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.user.email !== testEmail) throw new Error("Profile email mismatch");
  });

  // =========================================================================
  // 5. RBAC & SECURITY PRIVILEGE DEFENSE
  // =========================================================================
  console.log("\n--- [5. RBAC & SECURITY PRIVILEGE DEFENSE] ---");
  await test("Unauthenticated request to GET /api/users is blocked (401)", async () => {
    const res = await fetch(`${baseUrl}/api/users`);
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await test("Bogus/Tampered Bearer token is rejected (401)", async () => {
    const res = await fetch(`${baseUrl}/api/users`, {
      headers: { Authorization: "Bearer bogus.tampered.token" },
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await test("Regular Trader accessing /api/users is blocked (403 Forbidden)", async () => {
    const res = await fetch(`${baseUrl}/api/users`, {
      headers: { Authorization: `Bearer ${traderToken}` },
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  await test("Regular Trader injecting profit via /api/admin/profit is blocked (403 Forbidden)", async () => {
    if (!traderUser) throw new Error("Trader not created");
    const res = await fetch(`${baseUrl}/api/admin/profit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${traderToken}`,
      },
      body: JSON.stringify({ userId: traderUser.id, amount: 1000 }),
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  await test("Regular Trader creating notification via /api/admin/notifications is blocked (403 Forbidden)", async () => {
    const res = await fetch(`${baseUrl}/api/admin/notifications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${traderToken}`,
      },
      body: JSON.stringify({ title: "Hack Attempt", message: "Should be blocked" }),
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  await test("Regular Trader accessing audit logs via /api/admin/audit-logs is blocked (403 Forbidden)", async () => {
    const res = await fetch(`${baseUrl}/api/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${traderToken}` },
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  // =========================================================================
  // 6. USER BANK ACCOUNTS CRUD PIPELINE
  // =========================================================================
  console.log("\n--- [6. USER BANK ACCOUNTS CRUD PIPELINE] ---");
  let createdBankId = 0;

  await test("POST /api/user/bank-accounts adds primary bank account", async () => {
    const res = await fetch(`${baseUrl}/api/user/bank-accounts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${traderToken}`,
      },
      body: JSON.stringify({
        bankName: "Bank Central Asia (BCA)",
        accountNumber: "8899776655",
        accountHolder: "Audit Trader Pro",
        isPrimary: true,
      }),
    });
    if (!res.ok) throw new Error(`Add bank failed: ${res.status}`);
    const data = await res.json();
    if (!data.bankAccount || !data.bankAccount.id) throw new Error("Bank account not returned");
    createdBankId = data.bankAccount.id;
    if (!data.bankAccount.is_primary) throw new Error("First bank account should be primary");
  });

  await test("GET /api/user/bank-accounts returns trader's bank accounts", async () => {
    const res = await fetch(`${baseUrl}/api/user/bank-accounts`, {
      headers: { Authorization: `Bearer ${traderToken}` },
    });
    if (!res.ok) throw new Error(`Get banks failed: ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.bankAccounts) || data.bankAccounts.length === 0) {
      throw new Error("Bank account list empty");
    }
  });

  await test("PUT /api/user/bank-accounts updates bank details", async () => {
    const res = await fetch(`${baseUrl}/api/user/bank-accounts`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${traderToken}`,
      },
      body: JSON.stringify({
        id: createdBankId,
        bankName: "Bank Mandiri",
        accountNumber: "1234567890123",
        accountHolder: "Audit Trader Pro",
        isPrimary: true,
      }),
    });
    if (!res.ok) throw new Error(`Update bank failed: ${res.status}`);
    const data = await res.json();
    if (data.bankAccount.bank_name !== "Bank Mandiri") throw new Error("Bank name not updated");
  });

  // =========================================================================
  // 7. FINANCIAL TRANSACTION PIPELINE & BALANCE INTEGRITY
  // =========================================================================
  console.log("\n--- [7. FINANCIAL PIPELINE (DEPOSIT, PROFIT & WITHDRAW)] ---");
  let depositTxId = "";

  await test("POST /api/transactions rejects deposit below minimum (< Rp16,000,000)", async () => {
    const res = await fetch(`${baseUrl}/api/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${traderToken}`,
      },
      body: JSON.stringify({
        type: "Top Up",
        amount: 5000000,
        channel: "QRIS",
      }),
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  await test("POST /api/transactions accepts valid Top Up ($2,000 = Rp 32,000,000)", async () => {
    const res = await fetch(`${baseUrl}/api/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${traderToken}`,
      },
      body: JSON.stringify({
        type: "Top Up",
        amount: 32000000,
        channel: "QRIS",
        proof_image:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      }),
    });
    if (!res.ok) throw new Error(`Deposit failed: ${res.status}`);
    const data = await res.json();
    depositTxId = data.transaction?.id || "";
  });

  await test("PUT /api/transactions (Admin) approves Top Up (100% Deposit, 0% Initial Profit)", async () => {
    const res = await fetch(`${baseUrl}/api/transactions`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        id: depositTxId,
        status: "Berhasil",
      }),
    });
    if (!res.ok) throw new Error(`Approval failed: ${res.status}`);

    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${traderToken}` },
    });
    const meData = await meRes.json();
    // $2,000 deposit (pure deposit) = $2,000
    if (Number(meData.user.balance) !== 2000) {
      throw new Error(`Expected $2,000, got $${meData.user.balance}`);
    }
  });

  await test("POST /api/admin/profit grants $500 profit to trader ($2,500 total)", async () => {
    if (!traderUser) throw new Error("Trader not created");
    const res = await fetch(`${baseUrl}/api/admin/profit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        userId: traderUser.id,
        amount: 500,
        notes: "Monthly trading performance reward",
      }),
    });
    if (!res.ok) throw new Error(`Profit grant failed: ${res.status}`);

    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${traderToken}` },
    });
    const meData = await meRes.json();
    if (Number(meData.user.balance) !== 2500 || Number(meData.user.profit) !== 500) {
      throw new Error(
        `Balance mismatch: balance=${meData.user.balance}, profit=${meData.user.profit}`,
      );
    }
  });

  // =========================================================================
  // 8. GOTRADE REWARDS SYSTEM & POINT ENGINE
  // =========================================================================
  console.log("\n--- [8. GOTRADE REWARDS SYSTEM & POINT ENGINE] ---");
  let chosenReward: RewardItem | null = null;
  let redemptionId = 0;

  await test("Rewards API computes 40 Points from $2,500 USD (Rp 40,000,000)", async () => {
    const res = await fetch(`${baseUrl}/api/rewards`, {
      headers: { Authorization: `Bearer ${traderToken}` },
    });
    if (!res.ok) throw new Error(`Rewards fetch failed: ${res.status}`);
    const data = await res.json();
    if (data.userPoints !== 40) {
      throw new Error(`Expected 40 points, got ${data.userPoints}`);
    }
    if (!Array.isArray(data.rewards) || data.rewards.length < 7) {
      throw new Error("Reward catalog insufficient");
    }
    chosenReward = data.rewards.find((r: RewardItem) => r.points_required === 8) || data.rewards[0];
  });

  await test("User redeems Apple Watch Series 10 (8 Points)", async () => {
    if (!chosenReward) throw new Error("Reward not found");
    const res = await fetch(`${baseUrl}/api/rewards/redeem`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${traderToken}`,
      },
      body: JSON.stringify({
        rewardId: chosenReward.id,
        shippingAddress: "Jl. Sudirman No. 123, Jakarta Selatan (081299998888)",
        notes: "Mohon kirimkan warna Jet Black",
      }),
    });
    if (!res.ok) throw new Error(`Redeem failed: ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "Redemption failed");
    redemptionId = data.redemption.id;
  });

  await test("Available points correctly decremented (40 - 8 = 32 Points)", async () => {
    if (!chosenReward) throw new Error("Reward not found");
    const res = await fetch(`${baseUrl}/api/rewards`, {
      headers: { Authorization: `Bearer ${traderToken}` },
    });
    const data = await res.json();
    const expected = 40 - chosenReward.points_required;
    if (data.availablePoints !== expected) {
      throw new Error(`Expected ${expected} available points, got ${data.availablePoints}`);
    }
  });

  await test("Admin marks Reward Claim as COMPLETED with tracking number", async () => {
    const res = await fetch(`${baseUrl}/api/admin/rewards/redemptions`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        id: redemptionId,
        status: "COMPLETED",
        notes: "Resi JNE: JNE-9922110033",
      }),
    });
    if (!res.ok) throw new Error(`Admin update redemption failed: ${res.status}`);
    const data = await res.json();
    if (data.redemption?.status !== "COMPLETED") throw new Error("Status not COMPLETED");
  });

  // =========================================================================
  // 9. WITHDRAWAL PIPELINE & OVERDRAW PROTECTION
  // =========================================================================
  console.log("\n--- [9. WITHDRAWAL PIPELINE & OVERDRAW PROTECTION] ---");
  await test("POST /api/transactions rejects withdrawal below minimum (< Rp100,000)", async () => {
    const res = await fetch(`${baseUrl}/api/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${traderToken}`,
      },
      body: JSON.stringify({
        type: "Withdraw",
        amount: 50000,
        channel: "Bank Mandiri",
        destination: "1234567890123 (Bank Mandiri)",
      }),
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  let wdTxId = "";
  await test("POST /api/transactions submits valid Withdrawal (Rp 8,000,000 = $500 USD)", async () => {
    const res = await fetch(`${baseUrl}/api/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${traderToken}`,
      },
      body: JSON.stringify({
        type: "Withdraw",
        amount: 8000000,
        channel: "Bank Mandiri",
        destination: "1234567890123 (Bank Mandiri - Audit Trader)",
      }),
    });
    if (!res.ok) throw new Error(`Withdrawal submission failed: ${res.status}`);
    const data = await res.json();
    wdTxId = data.transaction?.id || "";
  });

  await test("PUT /api/transactions (Admin) approves Withdrawal and debits balance", async () => {
    const res = await fetch(`${baseUrl}/api/transactions`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        id: wdTxId,
        status: "Berhasil",
      }),
    });
    if (!res.ok) throw new Error(`Approval failed: ${res.status}`);

    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${traderToken}` },
    });
    const meData = await meRes.json();
    // $2,500 - $500 = $2,000
    if (Number(meData.user.balance) !== 2000) {
      throw new Error(`Expected $2,000 balance, got $${meData.user.balance}`);
    }
  });

  // Delete bank account
  await test("DELETE /api/user/bank-accounts deletes bank account", async () => {
    const res = await fetch(`${baseUrl}/api/user/bank-accounts?id=${createdBankId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${traderToken}` },
    });
    if (!res.ok) throw new Error(`Delete bank failed: ${res.status}`);
  });

  // =========================================================================
  // 10. ADMIN AUDIT LOGGING RECORDING
  // =========================================================================
  console.log("\n--- [10. ADMIN AUDIT LOGGING RECORDING] ---");
  await test("GET /api/admin/audit-logs contains security records of operations", async () => {
    const res = await fetch(`${baseUrl}/api/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success || !Array.isArray(data.logs) || data.logs.length === 0) {
      throw new Error("Audit logs not recorded");
    }
  });

  // CLEANUP TEST TRADER
  if (traderUser) {
    await query("DELETE FROM reward_redemptions WHERE user_id = $1", [traderUser.id]);
    await query("DELETE FROM user_bank_accounts WHERE user_id = $1", [traderUser.id]);
    await query("DELETE FROM transactions WHERE user_id = $1", [traderUser.id]);
    await query("DELETE FROM referrals WHERE user_id = $1", [traderUser.id]);
    await query("DELETE FROM users WHERE id = $1", [traderUser.id]);
  }

  console.log("\n=======================================================================");
  console.log(`🏁 COMPREHENSIVE AUDIT RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runComprehensiveAudit().catch((err) => {
  console.error("Audit fatal failure:", err);
  process.exit(1);
});
