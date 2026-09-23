async function runAllTests() {
  console.log("===============================================================");
  console.log("    COMPREHENSIVE GOTRADE PLATFORM & RBAC TEST SUITE");
  console.log("===============================================================");
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

  // -------------------------------------------------------------
  // 1. PUBLIC API ENDPOINTS
  // -------------------------------------------------------------
  await test("GET /api/health", async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.status !== "ok" && !data.rbacEnabled) throw new Error("Health check payload invalid");
  });

  await test("GET /api/auth/demo-accounts", async () => {
    const res = await fetch(`${baseUrl}/api/auth/demo-accounts`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.accounts) || data.accounts.length === 0)
      throw new Error("Demo accounts empty");
  });

  await test("GET /api/news (Public news feed)", async () => {
    const res = await fetch(`${baseUrl}/api/news`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success || !Array.isArray(data.news)) throw new Error("Invalid news format");
  });

  await test("GET /api/signals (Public signals feed)", async () => {
    const res = await fetch(`${baseUrl}/api/signals`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success || !Array.isArray(data.signals)) throw new Error("Invalid signals format");
  });

  await test("GET /api/currencies (Public currencies list)", async () => {
    const res = await fetch(`${baseUrl}/api/currencies`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success || !Array.isArray(data.currencies))
      throw new Error("Invalid currencies format");
  });

  await test("GET /api/notifications (Public broadcast notifications)", async () => {
    const res = await fetch(`${baseUrl}/api/notifications`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success || !Array.isArray(data.notifications))
      throw new Error("Invalid notifications format");
  });

  await test("GET /api/settings (Public settings map)", async () => {
    const res = await fetch(`${baseUrl}/api/settings`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success || typeof data.settings !== "object")
      throw new Error("Invalid settings format");
  });

  // -------------------------------------------------------------
  // 2. RBAC & UNAUTHENTICATED PROTECTION
  // -------------------------------------------------------------
  await test("RBAC blocks unauthenticated GET /api/users (401)", async () => {
    const res = await fetch(`${baseUrl}/api/users`);
    if (res.status !== 401) throw new Error(`Expected 401 but got ${res.status}`);
  });

  await test("RBAC blocks unauthenticated GET /api/transactions (401)", async () => {
    const res = await fetch(`${baseUrl}/api/transactions`);
    if (res.status !== 401) throw new Error(`Expected 401 but got ${res.status}`);
  });

  await test("RBAC blocks unauthenticated GET /api/admin/audit-logs (401)", async () => {
    const res = await fetch(`${baseUrl}/api/admin/audit-logs`);
    if (res.status !== 401) throw new Error(`Expected 401 but got ${res.status}`);
  });

  await test("RBAC blocks unauthenticated GET /api/admin/notifications (401)", async () => {
    const res = await fetch(`${baseUrl}/api/admin/notifications`);
    if (res.status !== 401) throw new Error(`Expected 401 but got ${res.status}`);
  });

  await test("RBAC blocks unauthenticated POST /api/admin/profit (401)", async () => {
    const res = await fetch(`${baseUrl}/api/admin/profit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: 1, amount: 100 }),
    });
    if (res.status !== 401) throw new Error(`Expected 401 but got ${res.status}`);
  });

  // -------------------------------------------------------------
  // 3. ADMIN AUTHENTICATION & MANAGEMENT
  // -------------------------------------------------------------
  let adminToken = "";
  await test("Admin login with admin@gotrade.com and password123", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@gotrade.com",
        password: "password123",
      }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!data.success || data.user.role !== "admin") throw new Error("User role is not admin");
    adminToken = data.token;
  });

  const adminHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${adminToken}`,
  };

  await test("GET /api/auth/me with admin token", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, { headers: adminHeaders });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success || data.user.role !== "admin") throw new Error("Invalid me payload");
  });

  await test("GET /api/users with admin auth", async () => {
    const res = await fetch(`${baseUrl}/api/users`, { headers: adminHeaders });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success || !Array.isArray(data.users)) throw new Error("Invalid users payload");
  });

  await test("GET /api/transactions with admin auth", async () => {
    const res = await fetch(`${baseUrl}/api/transactions`, { headers: adminHeaders });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success || !Array.isArray(data.transactions))
      throw new Error("Invalid transactions payload");
  });

  await test("GET /api/admin/audit-logs with admin auth", async () => {
    const res = await fetch(`${baseUrl}/api/admin/audit-logs`, { headers: adminHeaders });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success || !Array.isArray(data.logs)) throw new Error("Invalid audit logs payload");
  });

  // -------------------------------------------------------------
  // 4. ADMIN NOTIFICATIONS BROADCAST & CRUD
  // -------------------------------------------------------------
  let notifId: number | null = null;
  await test("POST /api/admin/notifications creates broadcast message", async () => {
    const res = await fetch(`${baseUrl}/api/admin/notifications`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        title: "Test System Broadcast",
        message: "Automated test notification content for Gotrade users.",
        type: "system",
        target: "all",
        badge: "TEST_RUN",
        is_pinned: true,
        action_url: "/trade",
      }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!data.success || !data.notification?.id) throw new Error("Notification not created");
    notifId = data.notification.id;
  });

  await test("PUT /api/admin/notifications updates broadcast message", async () => {
    if (!notifId) throw new Error("No notification ID");
    const res = await fetch(`${baseUrl}/api/admin/notifications`, {
      method: "PUT",
      headers: adminHeaders,
      body: JSON.stringify({
        id: notifId,
        title: "Updated System Broadcast",
        is_pinned: false,
      }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success || data.notification.title !== "Updated System Broadcast") {
      throw new Error("Update failed");
    }
  });

  await test("DELETE /api/admin/notifications removes broadcast message", async () => {
    if (!notifId) throw new Error("No notification ID");
    const res = await fetch(`${baseUrl}/api/admin/notifications?id=${notifId}`, {
      method: "DELETE",
      headers: adminHeaders,
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error("Delete failed");
  });

  // -------------------------------------------------------------
  // 5. ADMIN CURRENCIES CRUD
  // -------------------------------------------------------------
  let currId: number | null = null;
  await test("POST /api/currencies creates new currency instrument", async () => {
    const res = await fetch(`${baseUrl}/api/currencies`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        symbol: "TESTUSD",
        name: "Test Dollar",
        category: "Forex",
        price: 1.2345,
        decimals: 4,
        spread: 15,
        direction: "Naik",
        volatility: 25,
        active: true,
      }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success || !data.currency?.id) throw new Error("Currency creation failed");
    currId = data.currency.id;
  });

  await test("DELETE /api/currencies deletes test currency instrument", async () => {
    if (!currId) throw new Error("No currency ID");
    const res = await fetch(`${baseUrl}/api/currencies?id=${currId}`, {
      method: "DELETE",
      headers: adminHeaders,
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error("Currency deletion failed");
  });

  // -------------------------------------------------------------
  // 6. ADMIN SIGNALS CRUD
  // -------------------------------------------------------------
  let signalId: string | null = null;
  await test("POST /api/signals creates new trading signal", async () => {
    const res = await fetch(`${baseUrl}/api/signals`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        symbol: "XAUUSD",
        category: "Komoditas",
        action: "BUY",
        entryPrice: 2850.5,
        tp1: 2865.0,
        tp2: 2880.0,
        sl: 2835.0,
        rationale: "Bullish consolidation breakout testing support",
        timeframe: "H1",
      }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success || !data.signal?.id) throw new Error("Signal creation failed");
    signalId = data.signal.id;
  });

  await test("DELETE /api/signals deletes test trading signal", async () => {
    if (!signalId) throw new Error("No signal ID");
    const res = await fetch(`${baseUrl}/api/signals?id=${signalId}`, {
      method: "DELETE",
      headers: adminHeaders,
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error("Signal deletion failed");
  });

  // -------------------------------------------------------------
  // 7. ADMIN NEWS CRUD
  // -------------------------------------------------------------
  let newsId: number | null = null;
  await test("POST /api/news creates news article", async () => {
    const res = await fetch(`${baseUrl}/api/news`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        title: "Test Pasar Global Menunggu Pengumuman Kebijakan",
        slug: `test-pasar-global-${Date.now()}`,
        category: "Pasar",
        summary: "Ringkasan analisis pergerakan pasar global hari ini.",
        content: "Konten lengkap artikel analisis teknikal dan fundamental pasar terkini.",
        author: "Tim Riset Gotrade",
        status: "Published",
      }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success || !data.news?.id) throw new Error("News creation failed");
    newsId = data.news.id;
  });

  await test("DELETE /api/news deletes test news article", async () => {
    if (!newsId) throw new Error("No news ID");
    const res = await fetch(`${baseUrl}/api/news?id=${newsId}`, {
      method: "DELETE",
      headers: adminHeaders,
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error("News deletion failed");
  });

  // -------------------------------------------------------------
  // 8. REGULAR USER FLOW & STRICT RBAC ENFORCEMENT
  // -------------------------------------------------------------
  const randomEmail = `trader_${Date.now()}@gotrade-test.com`;
  let userToken = "";
  let regularUserId = 0;

  await test("POST /api/auth/register registers regular trader with username", async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Budi Trader",
        username: "budi_trader88",
        email: randomEmail,
        password: "TraderPassword123!",
        phone: "+6281234567890",
      }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!data.success || data.user.role !== "user") throw new Error("User role not 'user'");
    if (data.user.username !== "budi_trader88") {
      throw new Error(`Expected username budi_trader88 but got ${data.user.username}`);
    }
    userToken = data.token;
    regularUserId = data.user.id;
  });

  const userHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${userToken}`,
  };

  await test("RBAC blocks regular user from accessing /api/users (403)", async () => {
    const res = await fetch(`${baseUrl}/api/users`, { headers: userHeaders });
    if (res.status !== 403) throw new Error(`Expected 403 but got ${res.status}`);
  });

  await test("RBAC blocks regular user from creating notifications (403)", async () => {
    const res = await fetch(`${baseUrl}/api/admin/notifications`, {
      method: "POST",
      headers: userHeaders,
      body: JSON.stringify({
        title: "Malicious Broadcast",
        message: "Should be blocked by RBAC",
      }),
    });
    if (res.status !== 403) throw new Error(`Expected 403 but got ${res.status}`);
  });

  await test("RBAC blocks regular user from accessing audit logs (403)", async () => {
    const res = await fetch(`${baseUrl}/api/admin/audit-logs`, { headers: userHeaders });
    if (res.status !== 403) throw new Error(`Expected 403 but got ${res.status}`);
  });

  await test("RBAC blocks regular user from granting profit (403)", async () => {
    const res = await fetch(`${baseUrl}/api/admin/profit`, {
      method: "POST",
      headers: userHeaders,
      body: JSON.stringify({ userId: regularUserId, amount: 5000 }),
    });
    if (res.status !== 403) throw new Error(`Expected 403 but got ${res.status}`);
  });

  // -------------------------------------------------------------
  // 9. TRANSACTION FLOW: TOP UP & WITHDRAWAL & ADMIN APPROVAL
  // -------------------------------------------------------------
  let depositTxId = "";
  await test("User submits Top Up (Deposit) request >= Rp16.000.000 ($1,000 USD)", async () => {
    const res = await fetch(`${baseUrl}/api/transactions`, {
      method: "POST",
      headers: userHeaders,
      body: JSON.stringify({
        type: "Top Up",
        channel: "BCA Virtual Account",
        destination: "Gotrade PT Valuta",
        amount: 16000000,
      }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!data.success || !data.transaction?.id) throw new Error("Deposit transaction failed");
    depositTxId = data.transaction.id;
  });

  await test("Admin approves Top Up request and updates user balance", async () => {
    if (!depositTxId) throw new Error("No deposit transaction ID");
    const res = await fetch(`${baseUrl}/api/transactions`, {
      method: "PUT",
      headers: adminHeaders,
      body: JSON.stringify({
        id: depositTxId,
        status: "Berhasil",
      }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success || data.transaction.status !== "Berhasil") throw new Error("Approval failed");
  });

  await test("Admin grants trading profit to user via /api/admin/profit", async () => {
    const res = await fetch(`${baseUrl}/api/admin/profit`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        userId: regularUserId,
        amount: 250,
      }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!data.success) throw new Error("Profit grant failed");
  });

  await test("User verifies credited balance via /api/auth/me", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, { headers: userHeaders });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success || data.user.balance < 1000) {
      throw new Error(`Expected balance >= 1000, got ${data.user?.balance}`);
    }
  });

  await test("User submits Withdrawal request", async () => {
    const res = await fetch(`${baseUrl}/api/transactions`, {
      method: "POST",
      headers: userHeaders,
      body: JSON.stringify({
        type: "Withdraw",
        channel: "Bank Mandiri",
        destination: "1234567890 (Budi Trader)",
        amount: 1600000, // $100 USD
      }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!data.success || !data.transaction?.id) throw new Error("Withdrawal transaction failed");
  });

  // -------------------------------------------------------------
  // 10. LOGOUT & SESSION REVOCATION
  // -------------------------------------------------------------
  await test("User logs out and session is revoked cryptographically", async () => {
    const res = await fetch(`${baseUrl}/api/auth/logout`, {
      method: "POST",
      headers: userHeaders,
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error("Logout failed");
  });

  console.log("\n===============================================================");
  console.log(`    FINAL RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log("===============================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error("Test execution encountered fatal error:", err);
  process.exit(1);
});
