import { query } from "../src/server/db.js";

async function runFullPlatformAndSecurityTest() {
  console.log("=======================================================================");
  console.log("   GOTRADE COMPREHENSIVE E2E, FEATURES, MENUS & SECURITY TEST SUITE   ");
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
  // 1. ALL PAGES & SPA ROUTE VERIFICATION (STATUS 200)
  // =========================================================================
  console.log("--- [1. ALL PAGES & SPA ROUTES ACCESSIBILITY (28 ROUTES)] ---");
  const allRoutes = [
    { path: "/", name: "Landing / Onboarding" },
    { path: "/login", name: "Login Akun" },
    { path: "/register", name: "Pendaftaran Trader Baru" },
    { path: "/beranda", name: "Dashboard Utama Trader (Beranda)" },
    { path: "/pasar", name: "Katalog Pasar & Instrumen (Pasar)" },
    { path: "/trade", name: "Eksekusi Trading & Grafik (Trade)" },
    { path: "/order", name: "Ringkasan Order & Transaksi (Order)" },
    { path: "/riwayat", name: "Riwayat Transaksi Trader (Riwayat)" },
    { path: "/deposit", name: "Formulir Deposit & QRIS/Bank (Deposit)" },
    { path: "/withdraw", name: "Formulir Penarikan Dana (Withdraw)" },
    { path: "/rewards", name: "Katalog Gotrade Rewards (Rewards)" },
    { path: "/referral", name: "Program Referral & Afiliasi (Referral)" },
    { path: "/profil", name: "Profil Pengguna & Keamanan (Profil)" },
    { path: "/pengaturan", name: "Pengaturan Tema & Tampilan (Pengaturan)" },
    { path: "/lainnya", name: "Menu Lainnya & Contact Person AKSAY (Lainnya)" },
    { path: "/berita", name: "Katalog Berita Finansial (Berita)" },
    { path: "/berita/the-fed-suku-bunga-gold", name: "Detail Berita Finansial ($slug)" },
    { path: "/admin", name: "Admin Dashboard Overview (/admin)" },
    { path: "/admin/users", name: "Admin: Kelola Pengguna (/admin/users)" },
    { path: "/admin/profit", name: "Admin: Injeksi Profit (/admin/profit)" },
    { path: "/admin/notifikasi", name: "Admin: Siaran Notifikasi (/admin/notifikasi)" },
    { path: "/admin/mata-uang", name: "Admin: Kelola Mata Uang (/admin/mata-uang)" },
    { path: "/admin/sinyal", name: "Admin: Kelola Sinyal Trading (/admin/sinyal)" },
    { path: "/admin/berita", name: "Admin: Kelola Berita (/admin/berita)" },
    { path: "/admin/top-up", name: "Admin: Persetujuan Deposit (/admin/top-up)" },
    { path: "/admin/withdraw", name: "Admin: Persetujuan Penarikan (/admin/withdraw)" },
    { path: "/admin/rewards", name: "Admin: Kelola Katalog & Klaim Rewards (/admin/rewards)" },
    { path: "/admin/referral", name: "Admin: Pengaturan Referral (/admin/referral)" },
    { path: "/admin/audit-logs", name: "Admin: Audit Log Keamanan (/admin/audit-logs)" },
    { path: "/admin/pengaturan", name: "Admin: Pengaturan Sistem & Rekening (/admin/pengaturan)" },
  ];

  for (const r of allRoutes) {
    await test(`Page Route Accessible (200 OK): ${r.name} (${r.path})`, async () => {
      const res = await fetch(`${baseUrl}${r.path}`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const text = await res.text();
      if (
        !text.includes("<!DOCTYPE html") &&
        !text.includes("<html") &&
        !text.includes("Gotrade")
      ) {
        throw new Error("Invalid HTML response content");
      }
    });
  }

  // =========================================================================
  // 2. PRIVACY & SOCIAL SHARING CARD ELIMINATION AUDIT
  // =========================================================================
  console.log("\n--- [2. PRIVACY & SOCIAL METADATA AUDIT] ---");
  await test("Page HTML head completely omits OpenGraph and Twitter cards", async () => {
    const res = await fetch(`${baseUrl}/`);
    const html = await res.text();
    const hasOg = /property\s*=\s*["']og:/i.test(html);
    const hasTwitter = /name\s*=\s*["']twitter:/i.test(html);
    if (hasOg || hasTwitter) {
      throw new Error(`Found unexpected social tags: og=${hasOg}, twitter=${hasTwitter}`);
    }
  });

  // =========================================================================
  // 3. SETTINGS & CONTACT PERSON AKSAY CRUD
  // =========================================================================
  console.log("\n--- [3. SYSTEM SETTINGS, REKENING TUJUAN & CONTACT PERSON AKSAY CRUD] ---");
  let adminToken = "";
  await test("Authenticate Super Admin (admin@gotrade.com)", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@gotrade.com", password: "password123" }),
    });
    if (!res.ok) throw new Error(`Admin login failed: ${res.status}`);
    const data = await res.json();
    if (!data.token) throw new Error("No token returned for admin");
    adminToken = data.token;
  });

  await test("GET /api/settings returns default Contact Person AKSAY and Bank Keb Hana Bank", async () => {
    const res = await fetch(`${baseUrl}/api/settings`);
    if (!res.ok) throw new Error(`GET /api/settings failed: ${res.status}`);
    const data = await res.json();
    if (!data.success || !data.settings) throw new Error("Invalid settings response");

    // Check Contact Person
    const contactName = data.settings.contact_person_name;
    const contactPhone = data.settings.contact_person_phone;
    if (contactName !== "AKSAY") throw new Error(`Expected contact name AKSAY, got ${contactName}`);
    if (contactPhone !== "082329157278")
      throw new Error(`Expected contact phone 082329157278, got ${contactPhone}`);

    // Check Bank Tujuan Deposit
    const bankName = data.settings.deposit_bank_name;
    const accNum = data.settings.deposit_account_number;
    const accName = data.settings.deposit_account_name;
    if (bankName !== "Keb Hana Bank") throw new Error(`Expected Keb Hana Bank, got ${bankName}`);
    if (accNum !== "11628950560") throw new Error(`Expected 11628950560, got ${accNum}`);
    if (accName !== "AKSAY S.PUTRA") throw new Error(`Expected AKSAY S.PUTRA, got ${accName}`);

    // Check Payment Sources list
    const sources = JSON.parse(data.settings.deposit_payment_sources || "[]");
    if (!Array.isArray(sources) || sources.length === 0)
      throw new Error("Missing deposit_payment_sources");
  });

  await test("Admin updates Contact Person and Rekening Settings via POST /api/settings", async () => {
    const updatedContacts = [
      {
        id: "contact_aksay",
        name: "AKSAY",
        role: "Gotrade Senior Dedicated Support",
        whatsappLabel: "Whatsapp",
        whatsappNumber: "082329157278",
        email: "support@gotrade.com",
        active: true,
      },
    ];

    const res = await fetch(`${baseUrl}/api/settings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        deposit_bank_name: "Keb Hana Bank",
        deposit_account_number: "11628950560",
        deposit_account_name: "AKSAY S.PUTRA",
        initial_profit_percentage: "10",
        contact_persons_list: JSON.stringify(updatedContacts),
        contact_person_name: "AKSAY",
        contact_person_role: "Gotrade Senior Dedicated Support",
        contact_person_phone: "082329157278",
      }),
    });
    if (!res.ok) throw new Error(`Update settings failed: ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error("Update settings unsuccessful");
  });

  // =========================================================================
  // 4. USER AUTHENTICATION & REGISTRATION
  // =========================================================================
  console.log("\n--- [4. USER AUTHENTICATION & REGISTRATION LIFECYCLE] ---");
  const uniqueTestEmail = `audit_trader_${Date.now()}@gotrade.test`;
  let testTraderToken = "";
  let testTraderId = 0;

  await test("Register new Trader account with referral binding", async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Audit Trader Verified",
        email: uniqueTestEmail,
        password: "StrongPassword123!",
        phone: "081299988877",
        referralCode: "REF-GT-01",
      }),
    });
    if (!res.ok) throw new Error(`Registration failed: ${res.status}`);
    const data = await res.json();
    if (!data.token || !data.user) throw new Error("Invalid registration response");
    testTraderToken = data.token;
    testTraderId = data.user.id;
  });

  await test("Duplicate registration attempt is cleanly rejected", async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Duplicate Tester",
        email: uniqueTestEmail,
        password: "AnotherPassword123!",
        phone: "081299988877",
      }),
    });
    if (res.ok) throw new Error("Duplicate registration was not blocked");
    const data = await res.json();
    if (!data.message && !data.error)
      throw new Error("Missing error message on duplicate registration");
  });

  await test("Login with newly registered trader credentials", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: uniqueTestEmail,
        password: "StrongPassword123!",
      }),
    });
    if (!res.ok) throw new Error(`Login failed: ${res.status}`);
    const data = await res.json();
    if (!data.token) throw new Error("No token returned on login");
  });

  await test("GET /api/auth/me returns accurate trader profile", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${testTraderToken}` },
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.user.email !== uniqueTestEmail) throw new Error("User email mismatch");
    if (data.user.role !== "user") throw new Error("User role is not user");
  });

  // =========================================================================
  // 5. SECURITY DEFENSE & STRICT RBAC ACCESS CONTROL
  // =========================================================================
  console.log("\n--- [5. SECURITY DEFENSE & RBAC PRIVILEGE ISOLATION] ---");
  await test("Guest cannot update settings (POST /api/settings returns 401)", async () => {
    const res = await fetch(`${baseUrl}/api/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deposit_bank_name: "Hacked Bank" }),
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await test("Trader cannot update settings (POST /api/settings returns 403)", async () => {
    const res = await fetch(`${baseUrl}/api/settings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testTraderToken}`,
      },
      body: JSON.stringify({ deposit_bank_name: "Hacked Bank" }),
    });
    if (res.status !== 403) throw new Error(`Expected 403 Forbidden, got ${res.status}`);
  });

  await test("Trader cannot access Admin Users API (GET /api/users returns 403)", async () => {
    const res = await fetch(`${baseUrl}/api/users`, {
      headers: { Authorization: `Bearer ${testTraderToken}` },
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  await test("Trader cannot inject profit (POST /api/admin/profit returns 403)", async () => {
    const res = await fetch(`${baseUrl}/api/admin/profit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testTraderToken}`,
      },
      body: JSON.stringify({ userId: testTraderId, amount: 1000 }),
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  await test("Trader cannot view audit logs (GET /api/admin/audit-logs returns 403)", async () => {
    const res = await fetch(`${baseUrl}/api/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${testTraderToken}` },
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  await test("Fake Bearer token is rejected with 401 Unauthorized", async () => {
    const res = await fetch(`${baseUrl}/api/users`, {
      headers: { Authorization: "Bearer bogus_fake_tampered_token_xyz" },
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await test("SQL Injection payload in login input is safely handled", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "' OR '1'='1' --",
        password: "' OR '1'='1",
      }),
    });
    if (res.ok) throw new Error("SQL injection bypass succeeded unexpectedly!");
    if (res.status !== 401 && res.status !== 400) {
      throw new Error(`Unexpected status ${res.status}`);
    }
  });

  // =========================================================================
  // 6. USER BANK ACCOUNTS CRUD PIPELINE (/lainnya -> Informasi Bank)
  // =========================================================================
  console.log("\n--- [6. USER BANK ACCOUNTS CRUD PIPELINE] ---");
  let createdBankId = 0;
  await test("Trader creates a new Bank Account (POST /api/user/bank-accounts)", async () => {
    const res = await fetch(`${baseUrl}/api/user/bank-accounts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testTraderToken}`,
      },
      body: JSON.stringify({
        bankName: "Bank Central Asia (BCA)",
        accountNumber: "9876543210",
        accountHolder: "Audit Trader Verified",
        isPrimary: true,
      }),
    });
    if (!res.ok) throw new Error(`Add bank failed: ${res.status}`);
    const data = await res.json();
    if (!data.bankAccount || !data.bankAccount.id) throw new Error("No bank account returned");
    createdBankId = data.bankAccount.id;
  });

  await test("Trader reads their Bank Accounts (GET /api/user/bank-accounts)", async () => {
    const res = await fetch(`${baseUrl}/api/user/bank-accounts`, {
      headers: { Authorization: `Bearer ${testTraderToken}` },
    });
    if (!res.ok) throw new Error(`Get banks failed: ${res.status}`);
    const data = await res.json();
    const list = data.bankAccounts || data.bank_accounts;
    if (!Array.isArray(list) || list.length === 0) {
      throw new Error("No bank accounts found");
    }
  });

  await test("Trader updates Bank Account (PUT /api/user/bank-accounts)", async () => {
    const res = await fetch(`${baseUrl}/api/user/bank-accounts`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testTraderToken}`,
      },
      body: JSON.stringify({
        id: createdBankId,
        bankName: "Bank Mandiri",
        accountNumber: "1122334455",
        accountHolder: "Audit Trader Mandiri",
        isPrimary: true,
      }),
    });
    if (!res.ok) throw new Error(`Update bank failed: ${res.status}`);
  });

  // =========================================================================
  // 7. FINANCIAL TRANSACTION PIPELINE (DEPOSIT, INITIAL PROFIT, WITHDRAW)
  // =========================================================================
  console.log("\n--- [7. FINANCIAL TRANSACTION PIPELINE & PROFIT RULES] ---");
  await test("Reject Top Up below minimum limit (< Rp 16,000,000 / $1,000 USD)", async () => {
    const res = await fetch(`${baseUrl}/api/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testTraderToken}`,
      },
      body: JSON.stringify({
        type: "Top Up",
        amount: 5000000,
        channel: "QRIS",
      }),
    });
    if (res.ok) throw new Error("Deposit below minimum should be rejected");
  });

  let topUpTxId = "";
  await test("Trader submits valid Top Up ($2,000 USD = Rp 32,000,000 IDR)", async () => {
    const res = await fetch(`${baseUrl}/api/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testTraderToken}`,
      },
      body: JSON.stringify({
        type: "Top Up",
        amount: 32000000,
        channel: "Keb Hana Bank",
        destination: "11628950560 (AKSAY S.PUTRA)",
        proof_image:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      }),
    });
    if (!res.ok) throw new Error(`Top Up submit failed: ${res.status}`);
    const data = await res.json();
    topUpTxId = data.transaction?.id || "";
    if (!topUpTxId) throw new Error("Missing transaction id");
  });

  await test("Admin approves Top Up and triggers 10% Initial Profit auto-grant", async () => {
    const res = await fetch(`${baseUrl}/api/transactions`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        id: topUpTxId,
        status: "Berhasil",
      }),
    });
    if (!res.ok) throw new Error(`Approval failed: ${res.status}`);
  });

  await test("Trader balance correctly updated to $2,200 ($2,000 deposit + $200 initial profit)", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${testTraderToken}` },
    });
    const data = await res.json();
    if (Number(data.user.balance) !== 2200) {
      throw new Error(`Expected balance $2200, got $${data.user.balance}`);
    }
    if (Number(data.user.profit) !== 200) {
      throw new Error(`Expected profit $200, got $${data.user.profit}`);
    }
  });

  await test("Admin grants additional $300 profit via /api/admin/profit", async () => {
    const res = await fetch(`${baseUrl}/api/admin/profit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        userId: testTraderId,
        amount: 300,
        note: "Audited Trading Profit Session",
      }),
    });
    if (!res.ok) throw new Error(`Profit grant failed: ${res.status}`);
  });

  await test("Trader balance updated to $2,500 ($2,000 deposit + $500 total profit)", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${testTraderToken}` },
    });
    const data = await res.json();
    if (Number(data.user.balance) !== 2500) {
      throw new Error(`Expected balance $2500, got $${data.user.balance}`);
    }
    if (Number(data.user.profit) !== 500) {
      throw new Error(`Expected profit $500, got $${data.user.profit}`);
    }
  });

  // =========================================================================
  // 8. GOTRADE REWARDS & POINTS CALCULATION (1 POINT = Rp 1,000,000)
  // =========================================================================
  console.log("\n--- [8. GOTRADE REWARDS POINT ENGINE] ---");
  await test("Points accurately computed from $2,500 balance (Rp 40,000,000 = 40 Points)", async () => {
    const res = await fetch(`${baseUrl}/api/rewards`, {
      headers: { Authorization: `Bearer ${testTraderToken}` },
    });
    if (!res.ok) throw new Error(`GET /api/rewards failed: ${res.status}`);
    const data = await res.json();
    const points = data.availablePoints ?? data.userPoints ?? data.points;
    if (points !== 40) {
      throw new Error(`Expected 40 points, got ${points}`);
    }
  });

  let rewardClaimId = 0;
  await test("Trader redeems a Reward (Apple Watch Series 10 - 8 Points)", async () => {
    const res = await fetch(`${baseUrl}/api/rewards/redeem`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testTraderToken}`,
      },
      body: JSON.stringify({
        rewardId: 2, // Apple Watch
        shippingAddress: "Jl. Sudirman No. 45, Jakarta Selatan 12190",
        notes: "Warna Space Black",
      }),
    });
    if (!res.ok) throw new Error(`Redeem failed: ${res.status}`);
    const data = await res.json();
    if (!data.redemption || !data.redemption.id) throw new Error("No redemption object returned");
    rewardClaimId = data.redemption.id;
  });

  await test("Admin marks Reward Claim as SHIPPED/COMPLETED with tracking code", async () => {
    const res = await fetch(`${baseUrl}/api/admin/rewards/redemptions`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        id: rewardClaimId,
        status: "COMPLETED",
        notes: "Dikirim via JNE YES Resi: JNE9988776655",
      }),
    });
    if (!res.ok) throw new Error(`Update reward claim failed: ${res.status}`);
  });

  // =========================================================================
  // 9. WITHDRAWAL PIPELINE & OVERDRAW PROTECTION (ONLY PROFIT CAN BE WITHDRAWN)
  // =========================================================================
  console.log("\n--- [9. WITHDRAWAL PIPELINE & PROFIT-ONLY WITHDRAWAL RULE] ---");
  await test("Reject withdrawal below minimum limit (< Rp 100,000)", async () => {
    const res = await fetch(`${baseUrl}/api/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testTraderToken}`,
      },
      body: JSON.stringify({
        type: "Withdraw",
        amount: 50000,
        channel: "Bank Mandiri",
        destination: "1122334455",
      }),
    });
    if (res.ok) throw new Error("Withdrawal below minimum should be rejected");
  });

  await test("Reject withdrawal exceeding profit balance ($600 > $500 profit)", async () => {
    const res = await fetch(`${baseUrl}/api/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testTraderToken}`,
      },
      body: JSON.stringify({
        type: "Withdraw",
        amount: 9600000, // $600 USD (exceeds $500 profit)
        channel: "Bank Mandiri",
        destination: "1122334455",
      }),
    });
    if (res.ok) throw new Error("Withdrawal exceeding profit must be rejected");
  });

  let withdrawTxId = "";
  await test("Submit valid Withdrawal from profit (Rp 4,800,000 IDR = $300 USD)", async () => {
    const res = await fetch(`${baseUrl}/api/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testTraderToken}`,
      },
      body: JSON.stringify({
        type: "Withdraw",
        amount: 4800000, // $300
        channel: "Bank Mandiri",
        destination: "1122334455 (Audit Trader Mandiri)",
      }),
    });
    if (!res.ok) throw new Error(`Withdrawal submit failed: ${res.status}`);
    const data = await res.json();
    withdrawTxId = data.transaction?.id || "";
    if (!withdrawTxId) throw new Error("Missing withdraw transaction id");
  });

  await test("Admin approves Withdrawal and decrements profit and balance", async () => {
    const res = await fetch(`${baseUrl}/api/transactions`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        id: withdrawTxId,
        status: "Berhasil",
      }),
    });
    if (!res.ok) throw new Error(`Approve withdraw failed: ${res.status}`);
  });

  await test("Trader balance decremented from $2,500 to $2,200 ($200 profit remaining)", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${testTraderToken}` },
    });
    const data = await res.json();
    if (Number(data.user.balance) !== 2200) {
      throw new Error(`Expected balance $2200, got $${data.user.balance}`);
    }
    if (Number(data.user.profit) !== 200) {
      throw new Error(`Expected profit $200, got $${data.user.profit}`);
    }
  });

  // =========================================================================
  // 10. CLEANUP & AUDIT TRAIL LOG RECORDING
  // =========================================================================
  console.log("\n--- [10. AUDIT TRAIL RECORDING & LOGOUT LIFECYCLE] ---");
  await test("GET /api/admin/audit-logs verifies comprehensive audit logs", async () => {
    const res = await fetch(`${baseUrl}/api/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!res.ok) throw new Error(`Get audit logs failed: ${res.status}`);
    const data = await res.json();
    if (!data.success || !Array.isArray(data.logs) || data.logs.length === 0) {
      throw new Error("Audit logs empty or missing");
    }
  });

  await test("Trader logs out and revokes active token", async () => {
    const res = await fetch(`${baseUrl}/api/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${testTraderToken}` },
    });
    if (!res.ok) throw new Error(`Logout failed: ${res.status}`);
  });

  // Cleanup test user
  await query("DELETE FROM reward_redemptions WHERE user_id = $1", [testTraderId]);
  await query("DELETE FROM transactions WHERE user_id = $1", [testTraderId]);
  await query("DELETE FROM user_bank_accounts WHERE user_id = $1", [testTraderId]);
  await query("DELETE FROM users WHERE id = $1", [testTraderId]);

  console.log("\n=======================================================================");
  console.log(`🏁 FULL PLATFORM & SECURITY SUITE: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runFullPlatformAndSecurityTest().catch((err) => {
  console.error("Test execution aborted:", err);
  process.exit(1);
});
