async function runSecurityBypassTests() {
  console.log("===============================================================");
  console.log("    SECURITY & RBAC BYPASS VULNERABILITY VERIFICATION");
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

  // 1. Verify demo-accounts does not leak passwords
  await test("GET /api/auth/demo-accounts must not leak any plaintext passwords", async () => {
    const res = await fetch(`${baseUrl}/api/auth/demo-accounts`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    for (const acc of data.accounts) {
      if ("password" in acc) {
        throw new Error(`Security breach: demo account ${acc.email} exposes password property!`);
      }
    }
  });

  // 2. Verify unauthorized request to admin endpoints cannot be bypassed
  await test("Unauthenticated request to GET /api/users cannot bypass 401", async () => {
    const res = await fetch(`${baseUrl}/api/users`);
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await test("Unauthenticated request to GET /api/admin/notifications cannot bypass 401", async () => {
    const res = await fetch(`${baseUrl}/api/admin/notifications`);
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await test("Unauthenticated request to GET /api/admin/audit-logs cannot bypass 401", async () => {
    const res = await fetch(`${baseUrl}/api/admin/audit-logs`);
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  // 3. Verify that random / bogus admin tokens are rejected
  await test("Fake Bearer token is rejected with 401 on /api/users", async () => {
    const res = await fetch(`${baseUrl}/api/users`, {
      headers: {
        Authorization: "Bearer fake-token-bypass-attempt-12345",
      },
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  // 4. Verify regular trader account cannot access admin routes
  await test("Regular user token is blocked with 403 on /api/admin/notifications", async () => {
    // Login as normal user
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@gotrade.com", password: "user123" }),
    });
    if (!loginRes.ok) throw new Error("Could not login as regular user");
    const loginData = await loginRes.json();
    const userToken = loginData.token;

    const res = await fetch(`${baseUrl}/api/admin/notifications`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    if (res.status !== 403) throw new Error(`Expected 403 Forbidden, got ${res.status}`);
  });

  // 5. Verify admin login requires actual valid password
  await test("Admin login with wrong password fails and does not issue admin token", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@gotrade.com", password: "wrong-password-999" }),
    });
    if (res.ok) throw new Error("Expected login to fail, but it succeeded!");
    const data = await res.json();
    if (data.token) throw new Error("Issued token on wrong password!");
  });

  console.log("\n===============================================================");
  console.log(`    SECURITY TEST RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log("===============================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityBypassTests().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
