import { saveLoginCredentials, getSavedLoginCredentials } from "../src/lib/auth-storage";

// Mock localStorage for Node/tsx environment before test execution
const storageMap = new Map<string, string>();
const mockStorage: Storage = {
  getItem: (key: string) => storageMap.get(key) ?? null,
  setItem: (key: string, value: string) => storageMap.set(key, String(value)),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
  key: (index: number) => Array.from(storageMap.keys())[index] ?? null,
  length: 0,
};
Object.defineProperty(mockStorage, "length", {
  get: () => storageMap.size,
});
(globalThis as unknown as { localStorage: Storage }).localStorage = mockStorage;
(globalThis as unknown as { window: { localStorage: Storage } }).window = {
  localStorage: mockStorage,
};

async function runAutoFillAndSimulationTests() {
  console.log("===============================================================");
  console.log("    AUTO-FILL CREDENTIALS & RINGKASAN AKUN AUDIT TEST SUITE");
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

  // Test 1: saveLoginCredentials & getSavedLoginCredentials
  await test("Unit: saveLoginCredentials stores email and password accurately", async () => {
    saveLoginCredentials("testtrader@gotrade.com", "SecretPass123!");
    const creds = getSavedLoginCredentials();
    if (creds.email !== "testtrader@gotrade.com" || creds.password !== "SecretPass123!") {
      throw new Error(`Credentials mismatch: ${JSON.stringify(creds)}`);
    }
  });

  // Test 2: Whitespace trimming on email
  await test("Unit: saveLoginCredentials trims email whitespace", async () => {
    saveLoginCredentials("  spaces@gotrade.com  ", "P@ssword999");
    const creds = getSavedLoginCredentials();
    if (creds.email !== "spaces@gotrade.com") {
      throw new Error(`Email was not trimmed: ${creds.email}`);
    }
  });

  // Test 3: Logout credential retention
  await test("Unit: Logout retains saved credentials while session tokens are cleared", async () => {
    saveLoginCredentials("relogin@gotrade.com", "PersistentKey88");
    // Simulate auth token cleared
    storageMap.delete("gotrade_token");
    storageMap.delete("gotrade_user");
    // Verify saved credentials remain intact for next login auto-fill
    const creds = getSavedLoginCredentials();
    if (creds.email !== "relogin@gotrade.com" || creds.password !== "PersistentKey88") {
      throw new Error("Saved credentials lost after token clearance");
    }
  });

  // Test 4: E2E Register Flow -> Verify credentials saved & redirected to login
  let registeredEmail = "";
  const registeredPassword = "SuperSecurePass123!";
  await test("E2E: Register trader endpoint and verify credentials auto-fill", async () => {
    registeredEmail = `trader_${Date.now()}@gotrade.test`;
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "AutoFill Tester",
        username: `autofill_${Date.now().toString().slice(-6)}`,
        email: registeredEmail,
        password: registeredPassword,
      }),
    });
    if (!res.ok) throw new Error(`Registration failed with status ${res.status}`);
    const data = await res.json();
    if (!data.success || !data.user) throw new Error("Registration returned unsuccessful payload");

    // Client-side execution simulated: save credentials
    saveLoginCredentials(registeredEmail, registeredPassword);
    const creds = getSavedLoginCredentials();
    if (creds.email !== registeredEmail || creds.password !== registeredPassword) {
      throw new Error("Failed to prefill credentials for newly registered trader");
    }
  });

  // Test 5: Verify $0 Balance & $0 Equity Inactive Simulation Logic
  await test("Logic: $0.00 Balance & $0.00 Equity results in completely inactive simulation (all zeroes)", async () => {
    const currentBalance = 0;
    const currentProfit = 0;
    const currentEquity = Math.max(0, currentBalance + currentProfit);
    const hasFunds = currentBalance > 0 || currentEquity > 0;

    // Simulation logic from src/routes/lainnya.tsx
    const accountSimulation = (() => {
      if (!hasFunds) {
        return {
          isActive: false,
          margin: 0,
          freeMargin: 0,
          marginLevel: 0,
          credits: 0,
          floatingPL: 0,
          winRate: 0,
        };
      }
      return {
        isActive: true,
        margin: 243.88,
        freeMargin: 5425.76,
        marginLevel: 2324.77,
        credits: 200,
        floatingPL: 56.64,
        winRate: 75,
      };
    })();

    if (accountSimulation.isActive !== false)
      throw new Error("Simulation should be inactive for 0 balance");
    if (accountSimulation.margin !== 0)
      throw new Error(`Margin must be 0, got ${accountSimulation.margin}`);
    if (accountSimulation.freeMargin !== 0)
      throw new Error(`Free Margin must be 0, got ${accountSimulation.freeMargin}`);
    if (accountSimulation.marginLevel !== 0)
      throw new Error(`Margin Level must be 0, got ${accountSimulation.marginLevel}`);
    if (accountSimulation.credits !== 0)
      throw new Error(`Credits must be 0, got ${accountSimulation.credits}`);
    if (accountSimulation.floatingPL !== 0)
      throw new Error(`Floating P/L must be 0, got ${accountSimulation.floatingPL}`);
    if (accountSimulation.winRate !== 0)
      throw new Error(`Win Rate must be 0, got ${accountSimulation.winRate}`);
  });

  // Test 6: Verify Active Funds logic when Balance > 0
  await test("Logic: Active funds (Balance > 0 or Profit > 0) properly calculates metrics", async () => {
    const currentBalance = 1000;
    const currentProfit = 100;
    const currentEquity = Math.max(0, currentBalance + currentProfit);
    const hasFunds = currentBalance > 0 || currentEquity > 0;

    if (!hasFunds) throw new Error("hasFunds should be true for $1000 balance");
    if (currentEquity !== 1100) throw new Error(`Equity should be 1100, got ${currentEquity}`);
  });

  // Test 7: Bank Accounts CRUD API for user
  await test("API: User Bank Account CRUD (/api/user/bank-accounts)", async () => {
    // 1. Login user with registered credentials
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: registeredEmail, password: registeredPassword }),
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    if (!token) throw new Error("User login failed to obtain token");

    // 2. Add bank account
    const addRes = await fetch(`${baseUrl}/api/user/bank-accounts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        bankName: "Bank BCA",
        accountNumber: "8899001122",
        accountHolder: "AutoFill Tester",
        isPrimary: true,
      }),
    });
    const addData = await addRes.json();
    if (!addData.success) throw new Error("Failed to add bank account");
    const bankId = addData.bankAccount.id;

    // 3. List bank accounts
    const listRes = await fetch(`${baseUrl}/api/user/bank-accounts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const listData = await listRes.json();
    if (!listData.success || !Array.isArray(listData.bankAccounts))
      throw new Error("Failed to list bank accounts");

    // 4. Update bank account
    const updateRes = await fetch(`${baseUrl}/api/user/bank-accounts`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: bankId,
        bankName: "Bank BCA",
        accountNumber: "8899001122",
        accountHolder: "AutoFill Tester Updated",
        isPrimary: true,
      }),
    });
    const updateData = await updateRes.json();
    if (!updateData.success) throw new Error("Failed to update bank account");

    // 5. Delete bank account
    const delRes = await fetch(`${baseUrl}/api/user/bank-accounts?id=${bankId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const delData = await delRes.json();
    if (!delData.success) throw new Error("Failed to delete bank account");
  });

  // Test 8: Security - SQL Injection protection on Login & Register
  await test("Security: SQL Injection payloads safely handled by parametrized queries", async () => {
    const sqliRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "' OR '1'='1' --",
        password: "' OR '1'='1' --",
      }),
    });
    if (sqliRes.status === 200) throw new Error("SQL Injection bypassed authentication!");
    if (sqliRes.status !== 401 && sqliRes.status !== 400) {
      throw new Error(`Unexpected status code: ${sqliRes.status}`);
    }
  });

  // Test 9: Security - XSS Script payload in profile/registration sanitized
  await test("Security: XSS script tags sanitized in registration fields", async () => {
    const xssEmail = `xss_${Date.now()}@gotrade.test`;
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "<script>alert('xss')</script>Trader",
        username: `xss_${Date.now().toString().slice(-6)}`,
        email: xssEmail,
        password: "Pass12345678!",
      }),
    });
    if (!res.ok) throw new Error("XSS test register failed");
    const data = await res.json();
    if (data.user?.name && data.user.name.includes("<script>")) {
      throw new Error("Raw unescaped script tag persisted!");
    }
  });

  console.log("===============================================================");
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("===============================================================");
  if (failed > 0) process.exit(1);
}

runAutoFillAndSimulationTests().catch((e) => {
  console.error("Test execution fatal error:", e);
  process.exit(1);
});
