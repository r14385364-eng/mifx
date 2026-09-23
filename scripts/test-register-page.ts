async function runRegisterTests() {
  console.log("===============================================================");
  console.log("       TESTING REGISTER PAGE & USERNAME FUNCTIONALITY");
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

  const timestamp = Date.now();
  const testEmail = `trader_${timestamp}@example.com`;
  const testUsername = `trader_pro_${timestamp.toString().slice(-4)}`;
  const testPassword = "Password123!";

  // 1. Validation: Missing fields
  await test("Register without name, username, email, or password fails with 400", async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "",
        username: "",
        email: "",
        password: "",
      }),
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // 2. Register success with username
  let regToken = "";
  await test("Register with full details (Name, Username, Email, Password) succeeds", async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Andi Saputra",
        username: testUsername,
        email: testEmail,
        password: testPassword,
        phone: "+6281298765432",
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Registration failed: ${res.status} ${err}`);
    }

    const data = await res.json();
    if (!data.success) throw new Error("Expected data.success = true");
    if (data.user.name !== "Andi Saputra") throw new Error(`Unexpected name: ${data.user.name}`);
    if (data.user.username !== testUsername)
      throw new Error(`Unexpected username: ${data.user.username}`);
    if (data.user.email !== testEmail) throw new Error(`Unexpected email: ${data.user.email}`);
    if (!data.token) throw new Error("Missing token in registration response");
    regToken = data.token;
  });

  // 3. Prevent duplicate email registration
  await test("Register with already registered email fails with 400", async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Andi Clone",
        username: `${testUsername}_2`,
        email: testEmail,
        password: testPassword,
      }),
    });

    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    const data = await res.json();
    if (data.success) throw new Error("Expected failure on duplicate email");
  });

  // 4. Verify /api/auth/me returns the registered username
  await test("GET /api/auth/me returns registered username", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${regToken}`,
      },
    });

    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.user.username !== testUsername) {
      throw new Error(`Expected username ${testUsername}, got ${data.user.username}`);
    }
  });

  // 5. Login with registered email and verify username in login response
  await test("POST /api/auth/login returns registered username", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.user.username !== testUsername) {
      throw new Error(`Expected username ${testUsername}, got ${data.user.username}`);
    }
  });

  // 6. Verify referral code matches username in /api/referrals
  await test("User referral code matches their username in /api/referrals", async () => {
    const res = await fetch(`${baseUrl}/api/referrals`, {
      headers: {
        Authorization: `Bearer ${regToken}`,
      },
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success || !Array.isArray(data.referrals) || data.referrals.length === 0) {
      throw new Error("Referral record not found for registered user");
    }
    const myRef = data.referrals[0];
    if (myRef.code.toLowerCase() !== testUsername.toLowerCase()) {
      throw new Error(`Expected referral code to be ${testUsername}, got ${myRef.code}`);
    }
  });

  // 7. Register second user using first user's username as referral code
  const secondEmail = `friend_${timestamp}@example.com`;
  const secondUsername = `friend_${timestamp.toString().slice(-4)}`;
  await test("Register new user using existing username as referralCode", async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Teman Andi",
        username: secondUsername,
        email: secondEmail,
        password: testPassword,
        phone: "+6281211112222",
        referralCode: testUsername,
      }),
    });

    if (!res.ok) throw new Error(`Status ${res.status}: ${await res.text()}`);
    const data = await res.json();
    if (!data.success) throw new Error("Registration failed");
    if (data.user.username !== secondUsername) {
      throw new Error(`Expected username ${secondUsername}, got ${data.user.username}`);
    }

    // Now check first user's referral stats
    const checkInviter = await fetch(`${baseUrl}/api/referrals`, {
      headers: {
        Authorization: `Bearer ${regToken}`,
      },
    });
    const inviterData = await checkInviter.json();
    if (!inviterData.success || inviterData.referrals[0].invitees_count < 1) {
      throw new Error("Invitees count was not incremented for referrer");
    }
  });

  console.log("\n===============================================================");
  console.log(`    REGISTER TEST RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log("===============================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runRegisterTests().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
