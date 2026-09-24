async function runSpeedBenchmark() {
  console.log("===============================================================");
  console.log("    GOTRADE SPEED & LATENCY PERFORMANCE BENCHMARK SUITE");
  console.log("    Target: Sub-Second Performance (< 1,000ms) Per Page/Route");
  console.log("===============================================================\n");

  const baseUrl = "http://localhost:3000";

  // Warm up dev server pipeline
  console.log("⚡ Warming up server and router cache...");
  await fetch(`${baseUrl}/`).catch(() => {});
  await fetch(`${baseUrl}/api/health`).catch(() => {});

  const routesToTest = [
    { path: "/", label: "Landing / Onboarding" },
    { path: "/login", label: "Login Page" },
    { path: "/register", label: "Register Page" },
    { path: "/beranda", label: "Beranda Dashboard" },
    { path: "/pasar", label: "Market / Pasar" },
    { path: "/trade", label: "Trade Execution" },
    { path: "/order", label: "Orders" },
    { path: "/riwayat", label: "Transaction History" },
    { path: "/deposit", label: "Deposit Page" },
    { path: "/withdraw", label: "Withdraw Page" },
    { path: "/rewards", label: "Gotrade Rewards" },
    { path: "/referral", label: "Referral Program" },
    { path: "/profil", label: "Profile Page" },
    { path: "/pengaturan", label: "User Settings & Dark Mode" },
    { path: "/lainnya", label: "More Menu" },
    { path: "/berita", label: "News Feed" },
    { path: "/admin/users", label: "Admin Users" },
    { path: "/admin/profit", label: "Admin Profit" },
    { path: "/admin/notifikasi", label: "Admin Notifications" },
    { path: "/admin/mata-uang", label: "Admin Currencies" },
    { path: "/admin/sinyal", label: "Admin Signals" },
    { path: "/admin/berita", label: "Admin News" },
    { path: "/admin/top-up", label: "Admin Top Up" },
    { path: "/admin/withdraw", label: "Admin Withdraw" },
    { path: "/admin/rewards", label: "Admin Rewards" },
    { path: "/admin/referral", label: "Admin Referral" },
    { path: "/admin/audit-logs", label: "Admin Audit Logs" },
    { path: "/admin/pengaturan", label: "Admin Settings" },
    // API Routes
    { path: "/api/health", label: "API Health" },
    { path: "/api/currencies", label: "API Currencies" },
    { path: "/api/signals", label: "API Signals" },
    { path: "/api/news", label: "API News" },
    { path: "/api/notifications", label: "API Notifications" },
    { path: "/api/settings", label: "API Settings" },
  ];

  let passed = 0;
  let failed = 0;
  const latencies: number[] = [];

  for (const route of routesToTest) {
    const start = performance.now();
    const res = await fetch(`${baseUrl}${route.path}`);
    const end = performance.now();
    const duration = Math.round(end - start);
    latencies.push(duration);

    if (res.ok && duration < 1000) {
      console.log(`[PASS - ${duration}ms] ${route.label.padEnd(25)} -> ${route.path}`);
      passed++;
    } else {
      console.error(
        `[FAIL - ${duration}ms, Status: ${res.status}] ${route.label.padEnd(25)} -> ${route.path}`,
      );
      failed++;
    }
  }

  const avgLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
  const maxLatency = Math.max(...latencies);
  const minLatency = Math.min(...latencies);

  console.log("\n===============================================================");
  console.log(`🏁 PERFORMANCE BENCHMARK SUMMARY:`);
  console.log(`   - Total Tested Routes : ${routesToTest.length}`);
  console.log(`   - Passed (< 1.00s)    : ${passed}`);
  console.log(`   - Failed (>= 1.00s)   : ${failed}`);
  console.log(`   - Average Latency     : ${avgLatency}ms`);
  console.log(`   - Min Latency         : ${minLatency}ms`);
  console.log(`   - Max Latency         : ${maxLatency}ms`);
  console.log("===============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runSpeedBenchmark().catch((err) => {
  console.error("Speed benchmark failed:", err);
  process.exit(1);
});
