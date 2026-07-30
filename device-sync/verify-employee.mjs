/**
 * Verify a specific employee's attendance — raw device events vs database record
 *
 * Usage:
 *   node verify-employee.mjs 3 2026-04-09
 *   node verify-employee.mjs <deviceEmployeeNo> <date>
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

const [, , empNoArg, dateArg] = process.argv;
const empNo = empNoArg || "3";
const dateStr = dateArg || new Date().toISOString().slice(0, 10);

console.log(`\n${"═".repeat(70)}`);
console.log(`  ATTENDANCE VERIFICATION — Employee #${empNo} on ${dateStr}`);
console.log(`${"═".repeat(70)}\n`);

// ── Step 1: Get employee info from DB ──
console.log("── STEP 1: Employee Info (Supabase) ──\n");

let employee = null;
const { data: emp1 } = await db.from("employees").select("*")
  .eq("device_employee_no", empNo).maybeSingle();
if (emp1) employee = emp1;

if (!employee) {
  const numId = parseInt(empNo);
  if (!isNaN(numId)) {
    const { data: emp2 } = await db.from("employees").select("*")
      .eq("person_id", numId).maybeSingle();
    if (emp2) employee = emp2;
  }
}

if (employee) {
  console.log(`   Name:      ${employee.arabic_name || employee.name}`);
  console.log(`   Person ID: ${employee.person_id}`);
  console.log(`   Device #:  ${employee.device_employee_no}`);
  console.log(`   Dept:      ${employee.department}`);
  console.log(`   Shift ID:  ${employee.shift_id || "none"}`);
  console.log(`   Status:    ${employee.status}`);
} else {
  console.log(`   ⚠️ Employee #${empNo} NOT FOUND in Supabase`);
}

// ── Step 2: Get ALL raw events from device for that day ──
console.log(`\n── STEP 2: ALL Raw Device Events for #${empNo} on ${dateStr} ──\n`);

const startTime = `${dateStr}T00:00:00+03:00`;
const endTime = `${dateStr}T23:59:59+03:00`;

// Fetch ALL events (not just attendance-filtered ones)
const allEvents = await hik.fetchAllEvents(startTime, endTime, { major: 5, minor: 0 });

const empEvents = allEvents.filter(e =>
  e.employeeNo === empNo || e.employeeNo === String(parseInt(empNo))
);

console.log(`   Total events on device for ${dateStr}: ${allEvents.length}`);
console.log(`   Events for employee #${empNo}: ${empEvents.length}\n`);

if (empEvents.length > 0) {
  console.log("   #  | Time                | Minor | VerifyMode        | AttendanceStatus | EventID");
  console.log("   " + "─".repeat(95));
  empEvents.forEach((evt, i) => {
    const time = evt.time || "—";
    const minor = String(evt.eventMinor || "—").padEnd(5);
    const verify = (evt.verifyMode || "—").padEnd(17);
    const status = (evt.attendanceStatus || "—").padEnd(16);
    const eid = evt.eventId || "—";
    console.log(`   ${String(i + 1).padStart(2)} | ${time} | ${minor} | ${verify} | ${status} | ${eid}`);
  });
} else {
  console.log("   ❌ NO events found on device for this employee on this date");
}

// ── Step 3: Get filtered attendance events ──
console.log(`\n── STEP 3: Filtered Attendance Events (fetchAttendanceEvents) ──\n`);

const attendanceEvents = await hik.fetchAttendanceEvents(startTime, endTime);
const empAttEvents = attendanceEvents.filter(e =>
  e.employeeNo === empNo || e.employeeNo === String(parseInt(empNo))
);

console.log(`   Filtered attendance events for #${empNo}: ${empAttEvents.length}\n`);
empAttEvents.forEach((evt, i) => {
  console.log(`   ${i + 1}. ${evt.time} → ${evt.attendanceStatus} (${evt.verifyMode})`);
});

// ── Step 4: Get database record ──
console.log(`\n── STEP 4: Database Record (Supabase) ──\n`);

if (employee) {
  const { data: record } = await db.from("attendance_records").select("*")
    .eq("employee_id", employee.id).eq("date", dateStr).maybeSingle();

  if (record) {
    console.log(`   ID:              ${record.id}`);
    console.log(`   Date:            ${record.date} (${record.day_of_week})`);
    console.log(`   Check-in:        ${record.check_in_time || "NULL"}`);
    console.log(`   Check-out:       ${record.check_out_time || "NULL"}`);
    console.log(`   Working hours:   ${record.working_hours}`);
    console.log(`   Overtime:        ${record.overtime_hours}`);
    console.log(`   Status:          ${record.status}`);
    console.log(`   Is late:         ${record.is_late} (${record.late_minutes} min)`);
    console.log(`   Auto-checkout:   ${record.auto_checkout_applied}`);
    console.log(`   Source:          ${record.source}`);
    console.log(`   Device emp #:    ${record.device_employee_no}`);
    console.log(`   Verify mode:     ${record.verify_mode || "—"}`);
  } else {
    console.log(`   ❌ No attendance record in DB for this employee on ${dateStr}`);
  }
} else {
  console.log("   ⚠️ Cannot check — employee not found in DB");
}

// ── Step 5: Cross-check ──
console.log(`\n── STEP 5: Cross-Check Analysis ──\n`);

const checkInEvents = empAttEvents.filter(e => e.attendanceStatus === "checkIn");
const checkOutEvents = empAttEvents.filter(e => e.attendanceStatus === "checkOut");

if (checkInEvents.length > 0) {
  console.log(`   ✅ Device check-INs:  ${checkInEvents.map(e => e.time.slice(11, 19)).join(", ")}`);
} else {
  console.log(`   ❌ No checkIn events on device`);
}

if (checkOutEvents.length > 0) {
  console.log(`   ✅ Device check-OUTs: ${checkOutEvents.map(e => e.time.slice(11, 19)).join(", ")}`);
} else {
  console.log(`   ❌ No checkOut events on device`);
}

if (employee) {
  const { data: record } = await db.from("attendance_records").select("*")
    .eq("employee_id", employee.id).eq("date", dateStr).maybeSingle();

  if (record) {
    const dbIn = record.check_in_time;
    const dbOut = record.check_out_time;
    const deviceIn = checkInEvents.length > 0 ? checkInEvents[0].time.slice(11, 19) : null;
    const deviceOut = checkOutEvents.length > 0 ? checkOutEvents[checkOutEvents.length - 1].time.slice(11, 19) : null;

    console.log(`\n   DB check-in:   ${dbIn || "NULL"}   vs   Device first checkIn: ${deviceIn || "NONE"}`);
    console.log(`   DB check-out:  ${dbOut || "NULL"}   vs   Device last checkOut: ${deviceOut || "NONE"}`);

    if (dbIn && deviceIn && dbIn !== deviceIn) {
      console.log(`\n   ⚠️ CHECK-IN MISMATCH: DB=${dbIn}, Device=${deviceIn}`);
    }
    if (dbOut && deviceOut && dbOut !== deviceOut) {
      console.log(`\n   ⚠️ CHECK-OUT MISMATCH: DB=${dbOut}, Device=${deviceOut}`);
    }
    if (dbIn === deviceIn && dbOut === deviceOut) {
      console.log(`\n   ✅ MATCH — DB record matches device events perfectly`);
    }

    // Check working hours calculation
    if (dbIn && dbOut) {
      const [ih, im, is] = dbIn.split(":").map(Number);
      const [oh, om, os] = dbOut.split(":").map(Number);
      const inMin = ih * 60 + im + (is || 0) / 60;
      const outMin = oh * 60 + om + (os || 0) / 60;
      const expectedHours = Math.round(((outMin - inMin) / 60) * 100) / 100;
      console.log(`   Expected hours: ${expectedHours}h (${dbIn} → ${dbOut})`);
      console.log(`   DB hours:       ${record.working_hours}h`);
      if (Math.abs(expectedHours - record.working_hours) > 0.05) {
        console.log(`   ⚠️ HOURS MISMATCH: expected ${expectedHours}, got ${record.working_hours}`);
      } else {
        console.log(`   ✅ Hours calculation is correct`);
      }
    }
  }
}

// Also check previous and next day for overnight shifts
console.log(`\n── STEP 6: Adjacent Days Check (Overnight) ──\n`);

const prevDate = new Date(new Date(dateStr + "T00:00:00+03:00").getTime() - 86400000).toISOString().slice(0, 10);
const nextDate = new Date(new Date(dateStr + "T00:00:00+03:00").getTime() + 86400000).toISOString().slice(0, 10);

if (employee) {
  const { data: prevRec } = await db.from("attendance_records").select("check_in_time, check_out_time, status")
    .eq("employee_id", employee.id).eq("date", prevDate).maybeSingle();
  const { data: nextRec } = await db.from("attendance_records").select("check_in_time, check_out_time, status")
    .eq("employee_id", employee.id).eq("date", nextDate).maybeSingle();

  console.log(`   Previous day (${prevDate}): ${prevRec ? `in=${prevRec.check_in_time || "—"} out=${prevRec.check_out_time || "—"} status=${prevRec.status}` : "no record"}`);
  console.log(`   Next day     (${nextDate}): ${nextRec ? `in=${nextRec.check_in_time || "—"} out=${nextRec.check_out_time || "—"} status=${nextRec.status}` : "no record"}`);
}

console.log(`\n${"═".repeat(70)}`);
console.log("  Verification complete");
console.log(`${"═".repeat(70)}\n`);
