/**
 * Manual one-time sync: pull all events for a specific date range
 * Useful for backfilling historical data, and for staging validation of the
 * Odoo bridge (run once with BACKEND=odoo against a staging DB, then diff
 * against Supabase with diff-backends.mjs for the same range).
 *
 * Usage:
 *   node manual-sync.mjs                    # sync today
 *   node manual-sync.mjs 2026-04-01         # sync specific date
 *   node manual-sync.mjs 2026-04-01 2026-04-22  # sync date range
 *
 *   BACKEND=odoo node manual-sync.mjs 2026-04-01   # backfill into staging Odoo instead
 */

import "dotenv/config";
import { HikvisionClient } from "./hikvision-api.mjs";
import { createBackend as createSupabaseBackend } from "./backend-supabase.mjs";
import { createBackend as createOdooBackend } from "./backend-odoo.mjs";

const IRAQ_TZ = process.env.TIMEZONE || "Asia/Baghdad";
function log(emoji, msg) {
  const ts = new Date().toLocaleTimeString("en-GB", { timeZone: IRAQ_TZ });
  console.log(`[${ts}] ${emoji} ${msg}`);
}
function todayIraq() {
  return new Date().toLocaleDateString("en-CA", { timeZone: IRAQ_TZ });
}
function getDayOfWeek(dateStr) {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return days[new Date(dateStr + "T00:00:00+03:00").getDay()];
}

const backendType = (process.env.BACKEND || "supabase").trim().toLowerCase();

const hik = new HikvisionClient({
  ip: process.env.DEVICE_IP || "192.168.15.15",
  port: parseInt(process.env.DEVICE_PORT || "443"),
  username: process.env.DEVICE_USERNAME || "admin",
  password: process.env.DEVICE_PASSWORD || "",
  useHttps: process.env.DEVICE_USE_HTTPS !== "false",
});

const backendCtx = { log, todayIraq, getDayOfWeek, IRAQ_TZ };
const backend =
  backendType === "odoo"
    ? createOdooBackend(
        {
          apiBase: process.env.ODOO_API_BASE || "",
          db: process.env.ODOO_DB || "",
          username: process.env.ODOO_SYNC_USERNAME || "",
          password: process.env.ODOO_SYNC_PASSWORD || "",
          tzOffsetHours: parseInt(process.env.TZ_OFFSET_HOURS || "3"),
          device: { ip: process.env.DEVICE_IP || "192.168.15.15", port: parseInt(process.env.DEVICE_PORT || "443"), useHttps: process.env.DEVICE_USE_HTTPS !== "false", username: process.env.DEVICE_USERNAME || "admin" },
        },
        backendCtx,
      )
    : createSupabaseBackend(
        { url: process.env.SUPABASE_URL, serviceKey: process.env.SUPABASE_SERVICE_KEY, deviceIp: process.env.DEVICE_IP || "192.168.15.15" },
        backendCtx,
      );

const [, , startArg, endArg] = process.argv;
const today = todayIraq();
const startDate = startArg || today;
const endDate = endArg || startDate;

console.log(`\n📅 Manual sync (BACKEND=${backendType}): ${startDate} → ${endDate}\n`);

async function syncDay(dateStr) {
  const startTime = `${dateStr}T00:00:00+03:00`;
  const endTime = `${dateStr}T23:59:59+03:00`;

  // Use fetchAttendanceEvents — only successful auth events (no door locks, alarms, etc.)
  const events = await hik.fetchAttendanceEvents(startTime, endTime);
  console.log(`   ${dateStr}: ${events.length} attendance events (filtered)`);
  if (events.length === 0) return;

  events.sort((a, b) => a.time.localeCompare(b.time));

  let ok = 0;
  let skipped = 0;
  for (const evt of events) {
    if (!evt.employeeNo) continue;
    const employee = await backend.findEmployee(evt.employeeNo);
    if (!employee) {
      console.log(`      ⚠️  Employee #${evt.employeeNo} not in HR system — skipping (manual-sync never auto-creates)`);
      skipped++;
      continue;
    }
    const dayStr = evt.time.slice(0, 10);
    const timeStr = evt.time.slice(11, 19);
    try {
      await backend.upsertAttendance(employee, dayStr, timeStr, evt.verifyMode, evt.employeeNo, evt.attendanceStatus);
      ok++;
    } catch (err) {
      console.log(`      ❌ ${employee.arabic_name || employee.name}: ${err.message}`);
    }
  }
  console.log(`      ✅ ${ok} punches applied${skipped ? `, ${skipped} skipped (unknown employee)` : ""}`);
}

// Process each day in range
const start = new Date(startDate);
const end = new Date(endDate);
for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
  const ds = d.toISOString().slice(0, 10);
  await syncDay(ds);
}

console.log("\n✅ Manual sync complete!\n");
