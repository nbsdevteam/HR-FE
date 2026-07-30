/**
 * Quick test: verify connectivity to Hikvision device
 * No Supabase needed — just tests the device directly
 *
 * Run: node test-connection.mjs
 */

import "dotenv/config";
import { HikvisionClient } from "./hikvision-api.mjs";

// Allow self-signed certificates (Hikvision uses self-signed HTTPS)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const hik = new HikvisionClient({
  ip: process.env.DEVICE_IP || "192.168.15.15",
  port: parseInt(process.env.DEVICE_PORT || "443"),
  username: process.env.DEVICE_USERNAME || "admin",
  password: process.env.DEVICE_PASSWORD || "",
  useHttps: process.env.DEVICE_USE_HTTPS !== "false",
});

async function test() {
  console.log("═══════════════════════════════════════");
  console.log("  Hikvision Device Connection Test");
  console.log("  (Local only — no Supabase needed)");
  console.log("═══════════════════════════════════════\n");

  console.log(`  Device IP: ${process.env.DEVICE_IP || "192.168.15.15"}`);
  console.log(`  Port: ${process.env.DEVICE_PORT || "443"}`);
  console.log(`  HTTPS: ${process.env.DEVICE_USE_HTTPS !== "false"}`);
  console.log(`  Username: ${process.env.DEVICE_USERNAME || "admin"}\n`);

  // 1. Device info
  console.log("1️⃣  Testing device connection...");
  try {
    const info = await hik.getDeviceInfo();
    console.log(`   ✅ Connected!`);
    console.log(`   Model: ${info.model}`);
    console.log(`   Serial: ${info.serialNumber}`);
    console.log(`   Firmware: ${info.firmwareVersion}`);
    console.log(`   Name: ${info.deviceName}\n`);
  } catch (err) {
    console.log(`   ❌ Connection failed: ${err.message}\n`);
    console.log(`   Troubleshooting:`);
    console.log(`   - Can you open https://${process.env.DEVICE_IP || "192.168.15.15"} in your browser?`);
    console.log(`   - Verify username/password are correct`);
    console.log(`   - If using HTTP (not HTTPS), set DEVICE_USE_HTTPS=false in .env`);
    console.log(`   - If using a different port, set DEVICE_PORT in .env`);
    console.log(`\n   Manual test with curl:`);
    console.log(`   curl -k https://${process.env.DEVICE_IP || "192.168.15.15"}/ISAPI/System/deviceInfo --digest -u ${process.env.DEVICE_USERNAME || "admin"}:YOUR_PASSWORD`);
    process.exit(1);
  }

  // 2. User count
  console.log("2️⃣  Checking enrolled users...");
  try {
    const count = await hik.getUserCount();
    console.log(`   ✅ ${count} users enrolled on device\n`);
  } catch (err) {
    console.log(`   ⚠️  Could not get user count: ${err.message}\n`);
  }

  // 3. Fetch enrolled users
  console.log("3️⃣  Fetching user list...");
  try {
    const users = await hik.fetchAllUsers();
    console.log(`   ✅ ${users.length} users found:\n`);
    console.log("   ┌─────────┬────────────────────────┬────────┬────────┐");
    console.log("   │  رقم    │  الاسم                  │ بصمة   │ وجه    │");
    console.log("   ├─────────┼────────────────────────┼────────┼────────┤");
    users.forEach((u) => {
      const no = String(u.employeeNo).padEnd(7);
      const name = (u.name || "—").padEnd(22);
      const fp = String(u.numOfFP || 0).padEnd(6);
      const face = String(u.numOfFace || 0).padEnd(6);
      console.log(`   │ ${no} │ ${name} │ ${fp} │ ${face} │`);
    });
    console.log("   └─────────┴────────────────────────┴────────┴────────┘\n");
  } catch (err) {
    console.log(`   ⚠️  Could not fetch users: ${err.message}\n`);
  }

  // 4. Fetch today's events (filtered — attendance only)
  console.log("4️⃣  Fetching today's attendance events (filtered: auth only)...");
  try {
    const today = new Date().toISOString().slice(0, 10);
    const startTime = `${today}T00:00:00+03:00`;
    const endTime = `${today}T23:59:59+03:00`;

    // Compare: all events vs filtered & deduped attendance events
    const allEvents = await hik.fetchAllEvents(startTime, endTime, { major: 0 });
    const authOnly = await hik.fetchAllEvents(startTime, endTime, { major: 5 });
    const attendanceEvents = await hik.fetchAttendanceEvents(startTime, endTime);
    console.log(`   📊 Raw: ${allEvents.length} → Auth only (major=5): ${authOnly.length} → Deduped: ${attendanceEvents.length}\n`);

    if (attendanceEvents.length > 0) {
      console.log("   ┌──────────┬─────────┬────────────────────────┬─────────────┐");
      console.log("   │  الوقت   │  رقم    │  الاسم                  │ طريقة       │");
      console.log("   ├──────────┼─────────┼────────────────────────┼─────────────┤");
      attendanceEvents.forEach((e) => {
        const time = (e.time?.slice(11, 19) || "—").padEnd(8);
        const no = String(e.employeeNo).padEnd(7);
        const name = (e.name || "—").padEnd(22);
        const mode = (e.verifyMode || "—").padEnd(11);
        console.log(`   │ ${time} │ ${no} │ ${name} │ ${mode} │`);
      });
      console.log("   └──────────┴─────────┴────────────────────────┴─────────────┘");
    } else {
      console.log("   (لا توجد أحداث اليوم بعد)");
    }
    console.log();
  } catch (err) {
    console.log(`   ⚠️  Could not fetch events: ${err.message}\n`);
  }

  // 5. Quick test: yesterday's events too (filtered)
  console.log("5️⃣  Fetching yesterday's attendance events (filtered)...");
  try {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const startTime = `${yesterday}T00:00:00+03:00`;
    const endTime = `${yesterday}T23:59:59+03:00`;

    const allEvents = await hik.fetchAllEvents(startTime, endTime, { major: 0 });
    const authOnly = await hik.fetchAllEvents(startTime, endTime, { major: 5 });
    const attendanceEvents = await hik.fetchAttendanceEvents(startTime, endTime);
    console.log(`   📊 Raw: ${allEvents.length} → Auth only: ${authOnly.length} → Deduped: ${attendanceEvents.length} (${yesterday})\n`);

    if (attendanceEvents.length > 0) {
      // Summary: group by employee
      const byEmp = {};
      attendanceEvents.forEach((e) => {
        if (!byEmp[e.employeeNo]) byEmp[e.employeeNo] = { name: e.name, punches: [] };
        byEmp[e.employeeNo].punches.push(e.time?.slice(11, 19));
      });

      console.log("   Summary (first punch → last punch):");
      for (const [no, data] of Object.entries(byEmp)) {
        const first = data.punches[0];
        const last = data.punches.length > 1 ? data.punches[data.punches.length - 1] : "—";
        console.log(`     #${no} ${data.name}: ${first} → ${last} (${data.punches.length} punches)`);
      }
    }
    console.log();
  } catch (err) {
    console.log(`   ⚠️  Could not fetch yesterday's events: ${err.message}\n`);
  }

  console.log("═══════════════════════════════════════");
  console.log("  ✅ Connection test complete!");
  console.log("═══════════════════════════════════════");
  console.log("\n  Next step: run 'npm start' to begin syncing\n");
}

test().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
