/**
 * Manual one-time sync: pull all events for a specific date range
 * Useful for backfilling historical data
 *
 * Usage:
 *   node manual-sync.mjs                    # sync today
 *   node manual-sync.mjs 2026-04-01         # sync specific date
 *   node manual-sync.mjs 2026-04-01 2026-04-22  # sync date range
 */

import "dotenv/config";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { HikvisionClient } from "./hikvision-api.mjs";

function uuid() { return crypto.randomUUID(); }

const hik = new HikvisionClient({
  ip: process.env.DEVICE_IP || "192.168.15.15",
  port: parseInt(process.env.DEVICE_PORT || "443"),
  username: process.env.DEVICE_USERNAME || "admin",
  password: process.env.DEVICE_PASSWORD || "",
  useHttps: process.env.DEVICE_USE_HTTPS !== "false",
});

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const [, , startArg, endArg] = process.argv;
const today = new Date().toISOString().slice(0, 10);
const startDate = startArg || today;
const endDate = endArg || startDate;

console.log(`\n📅 Manual sync: ${startDate} → ${endDate}\n`);

async function syncDay(dateStr) {
  const startTime = `${dateStr}T00:00:00+03:00`;
  const endTime = `${dateStr}T23:59:59+03:00`;

  // Use fetchAttendanceEvents — only successful auth events (no door locks, alarms, etc.)
  const events = await hik.fetchAttendanceEvents(startTime, endTime);
  console.log(`   ${dateStr}: ${events.length} attendance events (filtered)`);

  // Group events by employee — use device's attendanceStatus (checkIn/checkOut)
  const byEmployee = {};
  for (const evt of events) {
    if (!evt.employeeNo) continue;
    if (!byEmployee[evt.employeeNo]) byEmployee[evt.employeeNo] = [];
    byEmployee[evt.employeeNo].push(evt);
  }

  // Helper: find employee by device number
  async function findEmployee(empNo) {
    let emp = null;
    ({ data: emp } = await db.from("employees").select("*")
      .eq("device_employee_no", empNo).limit(1).maybeSingle());
    if (!emp) {
      const numId = parseInt(empNo);
      if (!isNaN(numId)) {
        ({ data: emp } = await db.from("employees").select("*")
          .eq("person_id", numId).limit(1).maybeSingle());
      }
    }
    if (!emp) {
      ({ data: emp } = await db.from("employees").select("*")
        .eq("national_id", empNo).limit(1).maybeSingle());
    }
    return emp;
  }

  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const dayOfWeek = days[new Date(dateStr + "T00:00:00+03:00").getDay()];

  for (const [empNo, empEvents] of Object.entries(byEmployee)) {
    // Sort by time
    empEvents.sort((a, b) => a.time.localeCompare(b.time));

    // Use the device's own attendanceStatus to find check-in and check-out
    const checkInEvts = empEvents.filter((e) => e.attendanceStatus === "checkIn");
    const checkOutEvts = empEvents.filter((e) => e.attendanceStatus === "checkOut");

    // Skip if no meaningful events (only intermediate events like minor=155, 154)
    if (checkInEvts.length === 0 && checkOutEvts.length === 0) {
      // Don't skip silently — if there's old bad data in DB, clean it up
      const emp = await findEmployee(empNo);
      if (emp) {
        const { data: existing } = await db.from("attendance_records")
          .select("id").eq("employee_id", emp.id).eq("date", dateStr).maybeSingle();
        if (existing) {
          await db.from("attendance_records").delete().eq("id", existing.id);
          console.log(`      🧹 Employee #${empNo} (${emp.arabic_name || emp.name}) — no valid attendance events, removed old bad record`);
        }
      }
      continue;
    }

    const emp = await findEmployee(empNo);
    if (!emp) {
      console.log(`      ⚠️  Employee #${empNo} not in HR system — skipping`);
      continue;
    }

    // Handle overnight shifts: if checkOut exists and is EARLIER than checkIn,
    // the early checkOut belongs to the PREVIOUS day's record
    let checkIn = checkInEvts.length > 0 ? checkInEvts[0].time.slice(11, 19) : null;
    let checkOut = null;
    let overnightCheckOut = null;

    if (checkOutEvts.length > 0) {
      const lastCheckOut = checkOutEvts[checkOutEvts.length - 1].time.slice(11, 19);

      if (checkIn && lastCheckOut < checkIn) {
        // Overnight: checkOut is from the previous night, checkIn is starting new shift
        overnightCheckOut = lastCheckOut;
        checkOut = null; // today's shift has no checkout yet
      } else if (!checkIn) {
        // Only checkOut, no checkIn — could be overnight or missing check-in
        // Check if there's an open record from yesterday
        overnightCheckOut = lastCheckOut;
      } else {
        checkOut = lastCheckOut;
      }
    }

    // Handle overnight checkOut → close yesterday's record
    if (overnightCheckOut) {
      const yesterday = new Date(new Date(dateStr + "T00:00:00+03:00").getTime() - 86400000)
        .toISOString().slice(0, 10);
      const { data: yesterdayRec } = await db.from("attendance_records")
        .select("*").eq("employee_id", emp.id).eq("date", yesterday).maybeSingle();

      if (yesterdayRec && !yesterdayRec.check_out_time) {
        // Close yesterday's record with the overnight checkout
        const yCheckIn = yesterdayRec.check_in_time;
        const workedMin = yCheckIn ? timeToMinutes(overnightCheckOut) + 1440 - timeToMinutes(yCheckIn) : 0;
        const workedH = Math.round((workedMin / 60) * 100) / 100;
        await db.from("attendance_records").update({
          check_out_time: overnightCheckOut,
          working_hours: workedH,
          status: "complete",
        }).eq("id", yesterdayRec.id);
        console.log(`      🌙 ${emp.arabic_name || emp.name}: overnight → yesterday ${yCheckIn} → today ${overnightCheckOut} (${workedH}h)`);
      } else if (!checkIn) {
        // No yesterday record to close AND no check-in today — genuine missing check-in
        checkOut = overnightCheckOut;
      }
    }

    // Check if record exists for today
    const { data: existing } = await db
      .from("attendance_records")
      .select("id")
      .eq("employee_id", emp.id)
      .eq("date", dateStr)
      .maybeSingle();

    // If no checkIn and no checkOut for today (overnight checkout was handled above), skip creating
    if (!checkIn && !checkOut) {
      // If there's an existing record from old bad data, remove it
      if (existing) {
        await db.from("attendance_records").delete().eq("id", existing.id);
        console.log(`      🧹 ${emp.arabic_name || emp.name}: removed old record (overnight checkout handled on previous day)`);
      }
      continue;
    }

    const workedMinutes = (checkIn && checkOut) ? Math.max(0, timeToMinutes(checkOut) - timeToMinutes(checkIn)) : 0;
    const workedHours = Math.round((workedMinutes / 60) * 100) / 100;

    let status = "checked_in";
    if (checkIn && checkOut) status = "complete";
    else if (!checkIn && checkOut) status = "missing_checkin";

    const record = {
      employee_id: emp.id,
      date: dateStr,
      day_of_week: dayOfWeek,
      check_in_time: checkIn,
      check_out_time: checkOut,
      working_hours: workedHours,
      overtime_hours: 0,
      is_late: false,
      late_minutes: 0,
      is_early: false,
      status,
      auto_checkout_applied: false,
      source: "device",
      device_employee_no: String(empNo),
    };

    if (existing) {
      await db.from("attendance_records").update(record).eq("id", existing.id);
    } else {
      record.id = uuid();
      await db.from("attendance_records").insert(record);
    }

    console.log(`      ✅ ${emp.arabic_name || emp.name}: ${checkIn || "—"} → ${checkOut || "—"} (${workedHours}h)`);
  }
}

function timeToMinutes(t) {
  const parts = t.split(":").map(Number);
  const h = parts[0] || 0;
  const m = parts[1] || 0;
  const s = parts[2] || 0;
  return h * 60 + m + s / 60;
}

// Process each day in range
const start = new Date(startDate);
const end = new Date(endDate);
for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
  const ds = d.toISOString().slice(0, 10);
  await syncDay(ds);
}

console.log("\n✅ Manual sync complete!\n");
