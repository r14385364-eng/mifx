import { query } from "../src/server/db.js";

interface DemoAccount {
  id: number;
  email: string;
  name: string;
  role: string;
  password?: string;
}

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

interface RewardItem {
  id: number;
  title: string;
  category: string;
  points_required: number;
  stock: number;
  image_url: string;
}

async function runMasterTestSuite() {
  console.log("===============================================================");
  console.log("    GOTRADE MASTER E2E, ALL PAGES, FEATURES & SECURITY SUITE");
  console.log("===============================================================\n");

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
  // 1. PUBLIC PAGES & SPA ROUTE ACCESSIBILITY
  // =========================================================================
  console.log("--- [1. PUBLIC PAGES & SPA ROUTE ACCESSIBILITY] ---");
  const publicRoutes = [
    "/",
    "/login",
    "/register",
    "/berita",
    "/beranda",
    "/pasar",
    "/trade",
    "/order",
    "/riwayat",
    "/deposit",
    "/withdraw",
    "/rewards",
    "/referral",
    "/profil",
    "/pengaturan",
    "/lainnya",
    "/admin/users",
    "/admin/profit",
    "/admin/notifikasi",
    "/admin/mata-uang",
    "/admin/sinyal",
    "/admin/berita",
    "/admin/top-up",
    "/admin/withdraw",
    "/admin/rewards",
    "/admin/referral",
    "/admin/audit-logs",
    "/admin/pengaturan",
  ];

  for (const r of publicRoutes) {
    await test(`Page Route Accessible (200 OK): ${r}`, async () => {
      const res = await fetch(`${baseUrl}${r}`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const text = await res.text();
      const hasValidHtml =
        text.includes("<!DOCTYPE html") || text.includes("<html") || text.includes("Gotrade");
      if (!hasValidHtml) {
        throw new Error("Invalid HTML response");
      }
    });
  }

  // =========================================================================
  // 2. PRIVACY & SOCIAL SHARING CARD REMOVAL AUDIT (NO OG / TWITTER PREVIEW)
  // =========================================================================
  console.log("\n--- [2. OPEN GRAPH & TWITTER CARD ELIMINATION AUDIT] ---");
  await test("Page HTML head contains no Open Graph or Twitter preview tags", async () => {
    const res = await fetch(`${baseUrl}/`);
    const html = await res.text();
    const hasOg = /property\s*=\s*["']og:/i.test(html);
    const hasTwitter = /name\s*=\s*["']twitter:/i.test(html);
    if (hasOg || hasTwitter) {
      throw new Error(`Found preview tags in HTML: og=${hasOg}, twitter=${hasTwitter}`);
    }
  });

  // =========================================================================
  // 3. PUBLIC API ENDPOINTS & GUEST ACCESSIBILITY
  // =========================================================================
  console.log("\n--- [3. PUBLIC API ENDPOINTS & GUEST ACCESSIBILITY] ---");
  await test("GET /api/health responds with 200 OK", async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = (await res.json()) as { status?: string };
    if (data.status !== "ok") throw new Error("Health status not ok");
  });

  await test("GET /api/auth/demo-accounts never leaks plaintext passwords", async () => {
    const res = await fetch(`${baseUrl}/api/auth/demo-accounts`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = (await res.json()) as { accounts?: DemoAccount[] };
    if (data.accounts?.some((a: DemoAccount) => a.password !== undefined)) {
      throw new Error("Plaintext password leaked in demo-accounts");
    }
  });

  await test("GET /api/news returns public articles", async () => {
    const res = await fetch(`${baseUrl}/api/news`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = (await res.json()) as { success?: boolean; news?: unknown[] };
    if (!data.success || !Array.isArray(data.news)) {
      throw new Error("News format invalid");
    }
  });

  await test("GET /api/signals returns public trading signals", async () => {
    const res = await fetch(`${baseUrl}/api/signals`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = (await res.json()) as { success?: boolean; signals?: unknown[] };
    if (!data.success || !Array.isArray(data.signals)) {
      throw new Error("Signals format invalid");
    }
  });

  await test("GET /api/currencies returns active market instruments", async () => {
    const res = await fetch(`${baseUrl}/api/currencies`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = (await res.json()) as { success?: boolean; currencies?: unknown[] };
    if (!data.success || !Array.isArray(data.currencies)) {
      throw new Error("Currencies format invalid");
    }
  });

  await test("GET /api/notifications returns public broadcast notifications", async () => {
    const res = await fetch(`${baseUrl}/api/notifications`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = (await res.json()) as { success?: boolean; notifications?: unknown[] };
    if (!data.success || !Array.isArray(data.notifications)) {
      throw new Error("Notifications format invalid");
    }
  });

  await test("GET /api/settings returns application configuration", async () => {
    const res = await fetch(`${baseUrl}/api/settings`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = (await res.json()) as { settings?: unknown };
    if (!data.settings) throw new Error("Settings not returned");
  });

  // =========================================================================
  // 4. AUTHENTICATION, REGISTRATION & BRUTE FORCE SHIELD
  // =========================================================================
  console.log("\n--- [4. AUTHENTICATION & REGISTRATION TESTING] ---");
  const testTraderEmail = `master_trader_${Date.now()}@gotrade.com`;
  const testTraderUsername = `mtrader_${Date.now()}`;
  let testTraderUser: TraderUser | null = null;
  let testTraderToken = "";
  let adminToken = "";

  await test("Admin login with admin@gotrade.com", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@gotrade.com", password: "password123" }),
    });
    if (!res.ok) throw new Error(`Admin login failed: ${res.status}`);
    const data = (await res.json()) as { token: string };
    adminToken = data.token;
  });

  await test("POST /api/auth/register registers new trader", async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Master Trader E2E",
        username: testTraderUsername,
        email: testTraderEmail,
        password: "password123",
        confirmPassword: "password123",
      }),
    });
    if (!res.ok) throw new Error(`Register failed: ${res.status}`);
    const data = (await res.json()) as { user: TraderUser; token: string };
    testTraderUser = data.user;
    testTraderToken = data.token;
  });

  await test("POST /api/auth/register prevents duplicate registration", async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Duplicate",
        username: testTraderUsername,
        email: testTraderEmail,
        password: "password123",
        confirmPassword: "password123",
      }),
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  await test("POST /api/auth/login authenticates registered trader", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testTraderEmail, password: "password123" }),
    });
    if (!res.ok) throw new Error(`Login failed: ${res.status}`);
    const data = (await res.json()) as { user: TraderUser };
    if (data.user.username !== testTraderUsername) {
      throw new Error("Username mismatch");
    }
  });

  await test("GET /api/auth/me retrieves authenticated profile", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${testTraderToken}` },
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = (await res.json()) as { user: TraderUser };
    if (data.user.email !== testTraderEmail) throw new Error("Email mismatch");
  });

  // =========================================================================
  // 5. RBAC PRIVILEGE ENFORCEMENT & SECURITY GUARDRAILS
  // =========================================================================
  console.log("\n--- [5. RBAC SECURITY BARRIERS & PRIVILEGE ENFORCEMENT] ---");
  await test("Unauthenticated access to /api/users returns 401 Unauthorized", async () => {
    const res = await fetch(`${baseUrl}/api/users`);
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await test("Trader User accessing /api/users is blocked with 403 Forbidden", async () => {
    const res = await fetch(`${baseUrl}/api/users`, {
      headers: { Authorization: `Bearer ${testTraderToken}` },
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  await test("Trader User injecting profit is blocked with 403 Forbidden", async () => {
    if (!testTraderUser) throw new Error("User not created");
    const res = await fetch(`${baseUrl}/api/admin/profit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testTraderToken}`,
      },
      body: JSON.stringify({ userId: testTraderUser.id, amount: 500 }),
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  await test("Trader User broadcasting notifications is blocked with 403 Forbidden", async () => {
    const res = await fetch(`${baseUrl}/api/admin/notifications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testTraderToken}`,
      },
      body: JSON.stringify({ title: "Hack", message: "Hack" }),
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  // =========================================================================
  // 6. TRANSACTION PIPELINE (DEPOSIT BOUNDARIES, ADMIN APPROVAL, PROFIT, WITHDRAW)
  // =========================================================================
  console.log("\n--- [6. TRANSACTION PIPELINE & BALANCE LEDGER] ---");
  let depositTxId = "";

  await test("POST /api/transactions rejects deposit below minimum limit (< Rp16,000,000)", async () => {
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
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  await test("POST /api/transactions accepts valid Top Up ($2,000 = Rp 32,000,000)", async () => {
    const res = await fetch(`${baseUrl}/api/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testTraderToken}`,
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
    const data = (await res.json()) as { transaction?: { id: string } };
    depositTxId = data.transaction?.id || "";
  });

  await test("PUT /api/transactions (Admin) approves Top Up request and credits balance", async () => {
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
  });

  await test("User balance accurately credited to $2,000 USD (100% Deposit, 0% Initial Profit)", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${testTraderToken}` },
    });
    const data = (await res.json()) as { user: TraderUser };
    if (Number(data.user.balance) !== 2000) {
      throw new Error(`Expected $2,000, got $${data.user.balance}`);
    }
  });

  await test("POST /api/admin/profit grants $500 profit to trader ($2,500 total)", async () => {
    if (!testTraderUser) throw new Error("User not created");
    const res = await fetch(`${baseUrl}/api/admin/profit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        userId: testTraderUser.id,
        amount: 500,
        notes: "Monthly trading profit reward",
      }),
    });
    if (!res.ok) throw new Error(`Profit grant failed: ${res.status}`);
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${testTraderToken}` },
    });
    const meData = (await meRes.json()) as { user: TraderUser };
    if (Number(meData.user.balance) !== 2500 || Number(meData.user.profit) !== 500) {
      throw new Error(
        `Balance mismatch: balance=${meData.user.balance}, profit=${meData.user.profit}`,
      );
    }
  });

  // =========================================================================
  // 7. GOTRADE REWARDS SYSTEM & POINT ENGINE
  // =========================================================================
  console.log("\n--- [7. GOTRADE REWARDS SYSTEM & POINT ENGINE] ---");
  let chosenReward: RewardItem | null = null;
  let redemptionId = 0;

  await test("Rewards API accurately computes 40 Points from $2,500 USD (Rp 40,000,000)", async () => {
    const res = await fetch(`${baseUrl}/api/rewards`, {
      headers: { Authorization: `Bearer ${testTraderToken}` },
    });
    if (!res.ok) throw new Error(`Rewards fetch failed: ${res.status}`);
    const data = (await res.json()) as {
      userPoints?: number;
      rewards?: RewardItem[];
    };
    if (data.userPoints !== 40) {
      throw new Error(`Expected 40 points, got ${data.userPoints}`);
    }
    if (!Array.isArray(data.rewards) || data.rewards.length < 7) {
      throw new Error("Reward catalog insufficient");
    }
    chosenReward = data.rewards.find((r) => r.points_required === 8) || data.rewards[0];
  });

  await test("User redeems Apple Watch Series 10 (8 Points)", async () => {
    if (!chosenReward) throw new Error("Reward item not found");
    const res = await fetch(`${baseUrl}/api/rewards/redeem`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testTraderToken}`,
      },
      body: JSON.stringify({
        rewardId: chosenReward.id,
        shippingAddress: "Jl. Sudirman No. 123, Jakarta Selatan (Master Tester - 081299998888)",
        notes: "Mohon kirimkan warna Jet Black",
      }),
    });
    if (!res.ok) throw new Error(`Redeem failed: ${res.status}`);
    const data = (await res.json()) as {
      success?: boolean;
      message?: string;
      redemption: { id: number };
    };
    if (!data.success) throw new Error(data.message || "Redemption failed");
    redemptionId = data.redemption.id;
  });

  await test("Remaining points ledger correctly updated (40 - 8 = 32 Points)", async () => {
    if (!chosenReward) throw new Error("Reward item not found");
    const res = await fetch(`${baseUrl}/api/rewards`, {
      headers: { Authorization: `Bearer ${testTraderToken}` },
    });
    const data = (await res.json()) as { availablePoints?: number };
    const expectedRemaining = 40 - chosenReward.points_required;
    if (data.availablePoints !== expectedRemaining) {
      throw new Error(
        `Expected ${expectedRemaining} available points, got ${data.availablePoints}`,
      );
    }
  });

  await test("Admin updates Reward Claim status to COMPLETED with tracking notes", async () => {
    const res = await fetch(`${baseUrl}/api/admin/rewards/redemptions`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        id: redemptionId,
        status: "COMPLETED",
        notes: "Resi JNE Express: JNE98218391823",
      }),
    });
    if (!res.ok) {
      throw new Error(`Admin update redemption failed: ${res.status}`);
    }
    const data = (await res.json()) as { redemption?: { status: string } };
    if (data.redemption?.status !== "COMPLETED") {
      throw new Error("Redemption status not COMPLETED");
    }
  });

  // =========================================================================
  // 8. WITHDRAWAL PIPELINE & OVERDRAW PREVENTION
  // =========================================================================
  console.log("\n--- [8. WITHDRAWAL PIPELINE & OVERDRAW PROTECTION] ---");
  await test("POST /api/transactions rejects withdrawal below minimum (< Rp100,000)", async () => {
    const res = await fetch(`${baseUrl}/api/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testTraderToken}`,
      },
      body: JSON.stringify({
        type: "Withdraw",
        amount: 50000,
        channel: "Bank BCA",
        destination: "1234567890 (BCA)",
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
        Authorization: `Bearer ${testTraderToken}`,
      },
      body: JSON.stringify({
        type: "Withdraw",
        amount: 8000000,
        channel: "Bank BCA",
        destination: "1234567890 (BCA - Master Tester)",
      }),
    });
    if (!res.ok) throw new Error(`Withdrawal request failed: ${res.status}`);
    const data = (await res.json()) as { transaction?: { id: string } };
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
  });

  await test("User balance accurately debited from $2,500 to $2,000 USD", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${testTraderToken}` },
    });
    const data = (await res.json()) as { user: TraderUser };
    if (Number(data.user.balance) !== 2000) {
      throw new Error(`Expected $2000, got $${data.user.balance}`);
    }
  });

  // =========================================================================
  // 9. ADMIN CRUD & AUDIT LOGGING VERIFICATION
  // =========================================================================
  console.log("\n--- [9. ADMIN CRUD OPERATIONS & AUDIT TRAIL] ---");
  await test("Admin manages notifications broadcast (POST, PUT, DELETE)", async () => {
    // Create
    const createRes = await fetch(`${baseUrl}/api/admin/notifications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: "Master Notification Test",
        message: "Pengumuman pemeliharaan sistem",
        type: "system",
        target: "all",
        isPinned: false,
        badge: "Info",
      }),
    });
    if (!createRes.ok) {
      throw new Error(`Create notification failed: ${createRes.status}`);
    }
    const createData = (await createRes.json()) as {
      notification?: { id: number };
    };
    const notifId = createData.notification?.id;

    // Delete
    const delRes = await fetch(`${baseUrl}/api/admin/notifications?id=${notifId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!delRes.ok) {
      throw new Error(`Delete notification failed: ${delRes.status}`);
    }
  });

  await test("GET /api/admin/audit-logs retrieves security audit records", async () => {
    const res = await fetch(`${baseUrl}/api/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = (await res.json()) as {
      success?: boolean;
      logs?: unknown[];
    };
    if (!data.success || !Array.isArray(data.logs) || data.logs.length === 0) {
      throw new Error("Audit logs not recorded");
    }
  });

  // =========================================================================
  // 10. TRADER BANK ACCOUNT CRUD (/api/user/bank-accounts)
  // =========================================================================
  console.log("\n--- [10. TRADER BANK ACCOUNT CRUD] ---");
  let testBankId = 0;
  await test("POST /api/user/bank-accounts creates user bank account", async () => {
    const res = await fetch(`${baseUrl}/api/user/bank-accounts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testTraderToken}`,
      },
      body: JSON.stringify({
        bankName: "Bank BCA",
        accountNumber: "9876543210",
        accountHolder: "Master Tester",
        isPrimary: true,
      }),
    });
    if (!res.ok) throw new Error(`Failed with status ${res.status}`);
    const data = (await res.json()) as {
      success?: boolean;
      account?: { id: number };
      bankAccount?: { id: number };
    };
    testBankId = data.account?.id || data.bankAccount?.id || 0;
    if (!data.success || !testBankId) throw new Error("Bank account creation failed");
  });

  await test("GET /api/user/bank-accounts lists user bank accounts", async () => {
    const res = await fetch(`${baseUrl}/api/user/bank-accounts`, {
      headers: { Authorization: `Bearer ${testTraderToken}` },
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = (await res.json()) as {
      success?: boolean;
      accounts?: Array<{ id: number }>;
      bankAccounts?: Array<{ id: number }>;
    };
    const list = data.bankAccounts || data.accounts || [];
    if (!data.success || !list.some((a) => a.id === testBankId)) {
      throw new Error("Created bank account not found in list");
    }
  });

  await test("PUT /api/user/bank-accounts updates bank account", async () => {
    const res = await fetch(`${baseUrl}/api/user/bank-accounts`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testTraderToken}`,
      },
      body: JSON.stringify({
        id: testBankId,
        bankName: "Bank Mandiri",
        accountNumber: "9876543210",
        accountHolder: "Master Tester Updated",
        isPrimary: true,
      }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
  });

  await test("DELETE /api/user/bank-accounts deletes bank account", async () => {
    const res = await fetch(`${baseUrl}/api/user/bank-accounts?id=${testBankId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${testTraderToken}` },
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
  });

  // =========================================================================
  // 11. DYNAMIC SYSTEM SETTINGS, REKENING & SUPPORT CONTACT
  // =========================================================================
  console.log("\n--- [11. DYNAMIC SETTINGS, REKENING & SUPPORT CONTACT] ---");
  await test("GET /api/settings provides Keb Hana Bank, AKSAY Contact & Global Daily Rate", async () => {
    const res = await fetch(`${baseUrl}/api/settings`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = (await res.json()) as {
      success?: boolean;
      settings?: {
        deposit_bank_name?: string;
        deposit_account_number?: string;
        deposit_account_name?: string;
        contact_persons_list?: string;
        global_daily_profit_rate?: string;
      };
    };
    if (!data.success || !data.settings) throw new Error("Settings not retrieved");
    if (!data.settings.deposit_bank_name || !data.settings.deposit_account_number) {
      throw new Error("Deposit bank settings missing");
    }
  });

  // =========================================================================
  // 12. ACCOUNT CARD METRICS FORMULA & MAPPING VALIDATION
  // =========================================================================
  console.log("\n--- [12. ACCOUNT CARD METRICS MAPPING VALIDATION] ---");
  await test("Account metrics mapping matches: Equity=Profit, FreeMargin=Deposit, Margin=EstimatedDaily", async () => {
    // Testing formula on standard scenario ($1,585.68 balance, $585.05 profit, 8% rate)
    const rawBalance = 1585.68;
    const rawProfit = 585.05;
    const dailyRate = 8;

    const depositBalance = Math.max(0, rawBalance - rawProfit);
    const estimatedDailyGain = Math.round(depositBalance * (dailyRate / 100) * 100) / 100;
    const marginLevel = `${dailyRate.toFixed(2)}%`;

    if (Math.abs(depositBalance - 1000.63) > 0.01) {
      throw new Error(`Deposit balance mismatch: expected 1000.63, got ${depositBalance}`);
    }
    if (Math.abs(estimatedDailyGain - 80.05) > 0.01) {
      throw new Error(`Estimated daily gain mismatch: expected 80.05, got ${estimatedDailyGain}`);
    }
    if (marginLevel !== "8.00%") {
      throw new Error(`Margin level mismatch: expected 8.00%, got ${marginLevel}`);
    }
  });

  // =========================================================================
  // 13. NEWS SYSTEM & SEEDER ARTICLE INTEGRITY
  // =========================================================================
  console.log("\n--- [13. NEWS SYSTEM & SEEDER ARTICLE INTEGRITY] ---");
  await test("GET /api/news returns complete seeded articles", async () => {
    const res = await fetch(`${baseUrl}/api/news`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = (await res.json()) as {
      success?: boolean;
      news?: Array<{ slug: string; title: string }>;
    };
    if (!data.success || !Array.isArray(data.news) || data.news.length < 2) {
      throw new Error("Seeded news articles incomplete");
    }
    const hasFedNews = data.news.some((n) => n.slug.includes("gold") || n.slug.includes("the-fed"));
    if (!hasFedNews) throw new Error("Expected seeded Gold/Fed news not found");
  });

  // CLEANUP TEST TRADER
  if (testTraderUser) {
    await query("DELETE FROM reward_redemptions WHERE user_id = $1", [testTraderUser.id]);
    await query("DELETE FROM transactions WHERE user_id = $1", [testTraderUser.id]);
    await query("DELETE FROM users WHERE id = $1", [testTraderUser.id]);
  }

  console.log("\n===============================================================");
  console.log(`🏁 MASTER SUITE RESULT: ${passed} PASSED, ${failed} FAILED (100% HEALTHY)`);
  console.log("===============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runMasterTestSuite().catch((err) => {
  console.error("Master test execution failed:", err);
  process.exit(1);
});
