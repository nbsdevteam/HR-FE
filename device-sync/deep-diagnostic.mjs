/**
 * Deep diagnostic: dump ALL raw events for today with full attendanceStatus analysis
 * + check database records vs device events for mismatches
 *
 * Usage: node deep-diagnostic.mjs
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { HikvisionClient } from "./hikvision-api.mjs";

const hik = new HikvisionClient({
  ip: process.env.DEVICE_IP || "192.168.15.15",
  port: parseInt(process.env.DEVICE_PORT || "443"),
  username: process.env.DEVICE_USERNAME || "admin",
  password: process.env.DEVICE_PASSWORD || "",
  useHttps: process.env.DEVICE_USE_HTTPS !== "false",
});

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const today = new Date().toISOString().slice(0, 10);

async function main() {
  console.log("══════════════════════════════════════════════════");
  console.log("  DEEP ATTENDANCE DIAGNOSTIC — " + today);
  console.log("══════════════════════════════════════════════════\n");

  // ── 1. Fetch ALL raw events (not just attendance-filtered) ──
  console.log("── 1. ALL raw events from device (major=5, no employee filter) ──\n");

  const allRaw = await hik.fetchAllEvents(
    `${today}T00:00:00+03:00`,
    `${today}T23:59:59+03:00`,
    { major: 5, minor: 0 }
  );

  console.log(`Total major=5 events: ${allRaw.length}\n`);

  // Group by employee
  const byEmp = {};
  const noEmpEvents = [];
  for (const evt of allRaw) {
    if (!evt.employeeNo || evt.employeeNo === "0" || evt.employeeNo === "") {
      noEmpEvents.push(evt);
    } else {
      if (!byEmp[evt.employeeNo]) byEmp[evt.employeeNo] = [];
      byEmp[evt.employeeNo].push(evt);
    }
  }

  console.log(`Events WITHOUT employee: ${noEmpEvents.length}`);
  console.log(`Unique employees with events: ${Object.keys(byEmp).length}\n`);

  // ── 2. Dump every employee's events with attendanceStatus ──
  console.log("── 2. Per-employee event breakdown ──\n");

  for (const [empNo, events] of Object.entries(byEmp)) {
    events.sort((a, b) => a.time.localeCompare(b.time));
    const name = events[0].name || "—";

    const statuses = events.map(e => e.attendanceStatus || "NONE");
    const hasCheckIn = events.some(e => e.attendanceStatus === "checkIn");
    const hasCheckOut = events.some(e => e.attendanceStatus === "checkOut");
    const hasNoStatus = events.some(e => !e.attendanceStatus);

    let flag = "";
    if (hasNoStatus) flag += " ⚠️ HAS_EVENTS_WITHOUT_STATUS";
    if (!hasCheckIn && hasCheckOut) flag += " ⚠️ MISSING_CHECKIN";
    if (hasCheckIn && !hasCheckOut) flag += " ℹ️ NO_CHECKOUT_YET";
    if (!hasCheckIn && !hasCheckOut) flag += " ❌ NO_STATUS_AT_ALL";

    console.log(`  Employee #${empNo} (${name}) — ${events.length} events${flag}`);
    for (const evt of events) {
      const time = evt.time?.slice(11, 19) || "—";
      const status = evt.attendanceStatus || "NONE";
      const minor = evt.eventMinor;
      const verify = evt.verifyMode || "—";
      console.log(`    ${time} | minor=${minor} | status=${status} | verify=${verify}`);
    }
    console.log();
  }

  // ── 3. Events without employee (intermediate events, cancelled scans) ──
  console.log("── 3. Events WITHOUT employee (cancelled/intermediate) ──\n");
  console.log(`Count: ${noEmpEvents.length}`);
  for (const evt of noEmpEvents.slice(0, 10)) {
    const time = evt.time?.slice(11, 19) || "—";
    console.log(`  ${time} | minor=${evt.eventMinor} | status=${evt.attendanceStatus || "NONE"} | keys=${Object.keys(evt).join(",")}`);
  }
  if (noEmpEvents.length > 10) console.log(`  ... and ${noEmpEvents.length - 10} more`);

  // ── 4. Database records for today ──
  console.log("\n\n── 4. Database records for today ──\n");

  const { data: dbRecords } = await db
    .from("attendance_records")
    .select("employee_id, date, check_in_time, check_out_time, status, device_employee_no")
    .eq("date", today)
    .order("check_in_time", { ascending: true });

  // Get employee names
  const { data: employees } = await db.from("employees").select("id, name, arabic_name, device_employee_no");
  const empMap = {};
  for (const e of employees || []) {
    empMap[e.id] = e.arabic_name || e.name;
    if (e.device_employee_no) empMap[`dev_${e.device_employee_no}`] = e.arabic_name || e.name;
  }

  console.log(`Database has ${dbRecords?.length || 0} records for today:\n`);
  for (const r of dbRecords || []) {
    const name = empMap[r.employee_id] || r.device_employee_no || "—";
    const ci = r.check_in_time || "—";
    const co = r.check_out_time || "—";
    let flag = "";
    if (r.check_in_time && r.check_out_time && r.check_in_time === r.check_out_time) flag = " ❌ SAME_TIME";
    if (r.status === "missing_checkin") flag = " ⚠️ MISSING_CHECKIN";
    if (!r.check_in_time && r.check_out_time) flag = " ⚠️ NO_CHECKIN_IN_DB";
    console.log(`  ${name}: ${ci} → ${co} [${r.status}]${flag}`);
  }

  // ── 5. Cross-check: device events vs DB ──
  console.log("\n\n── 5. Mismatches: device events vs database ──\n");

  for (const [empNo, events] of Object.entries(byEmp)) {
    const name = events[0].name || empNo;
    const checkInEvt = events.find(e => e.attendanceStatus === "checkIn");
    const checkOutEvts = events.filter(e => e.attendanceStatus === "checkOut");
    const lastCheckOut = checkOutEvts.length > 0 ? checkOutEvts[checkOutEvts.length - 1] : null;

    const deviceCheckIn = checkInEvt ? checkInEvt.time.slice(11, 19) : null;
    const deviceCheckOut = lastCheckOut ? lastCheckOut.time.slice(11, 19) : null;

    // Find matching DB record
    const dbRec = dbRecords?.find(r => r.device_employee_no === empNo);
    if (!dbRec) {
      console.log(`  ❌ Employee #${empNo} (${name}): has device events but NO database record`);
      continue;
    }

    const dbCheckIn = dbRec.check_in_time;
    const dbCheckOut = dbRec.check_out_time;

    if (deviceCheckIn !== dbCheckIn || deviceCheckOut !== dbCheckOut) {
      console.log(`  ⚠️  Employee #${empNo} (${name}):`);
      console.log(`      Device: ${deviceCheckIn || "—"} → ${deviceCheckOut || "—"}`);
      console.log(`      DB:     ${dbCheckIn || "—"} → ${dbCheckOut || "—"}`);
    }
  }

  console.log("\n══════════════════════════════════════════════════");
  console.log("  Diagnostic complete");
  console.log("══════════════════════════════════════════════════\n");
}

main().catch(console.error);
