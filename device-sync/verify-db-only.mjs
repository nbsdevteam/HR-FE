/**
 * Verify attendance from Supabase only (no device access needed)
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const [, , empNoArg, dateArg] = process.argv;
const empNo = empNoArg || "3";
const dateStr = dateArg || "2026-04-09";

console.log(`\n${"═".repeat(70)}`);
console.log(`  DB VERIFICATION — Employee #${empNo} on ${dateStr}`);
console.log(`${"═".repeat(70)}\n`);

// Find employee
let employee = null;
let { data: emp1 } = await db.from("employees").select("*")
  .eq("device_employee_no", empNo).maybeSingle();
if (emp1) employee = emp1;

if (!employee) {
  const numId = parseInt(empNo);
  if (!isNaN(numId)) {
    ({ data: emp1 } = await db.from("employees").select("*")
      .eq("person_id", numId).maybeSingle());
    if (emp1) employee = emp1;
  }
}

if (!employee) {
  ({ data: emp1 } = await db.from("employees").select("*")
    .eq("national_id", empNo).maybeSingle());
  if (emp1) employee = emp1;
}

if (employee) {
  console.log(`   Name:           ${employee.arabic_name || employee.name}`);
  console.log(`   ID (DB):        ${employee.id}`);
  console.log(`   Person ID:      ${employee.person_id}`);
  console.log(`   Device #:       ${employee.device_employee_no || "NOT SET"}`);
  console.log(`   National ID:    ${employee.national_id || "—"}`);
  console.log(`   Department:     ${employee.department}`);
  console.log(`   Shift ID:       ${employee.shift_id || "none"}`);

  // Get shift info
  if (employee.shift_id) {
    const { data: shift } = await db.from("shifts").select("*")
      .eq("id", employee.shift_id).maybeSingle();
    if (shift) {
      console.log(`   Shift:          ${shift.name_ar || shift.name || "—"} (${shift.start_time} → ${shift.end_time})`);
    }
  }
} else {
  console.log(`   ⚠️ Employee #${empNo} NOT FOUND`);
  console.log("\n   Searching by all methods...");

  // Search broadly
  const { data: allEmps } = await db.from("employees")
    .select("id, name, arabic_name, person_id, device_employee_no, national_id")
    .or(`device_employee_no.eq.${empNo},person_id.eq.${parseInt(empNo) || -1},national_id.eq.${empNo}`);

  if (allEmps && allEmps.length > 0) {
    console.log(`   Found ${allEmps.length} matches:`);
    allEmps.forEach(e => {
      console.log(`     - ${e.arabic_name || e.name} | person_id=${e.person_id} | device#=${e.device_employee_no} | national_id=${e.national_id}`);
    });
    employee = allEmps[0];
  } else {
    console.log("   No matches found anywhere.");

    // Try to find by attendance record
    const { data: attRecs } = await db.from("attendance_records")
      .select("employee_id, device_employee_no")
      .eq("device_employee_no", empNo)
      .eq("date", dateStr)
      .limit(1);
    if (attRecs && attRecs.length > 0) {
      console.log(`\n   Found attendance record with device_employee_no=${empNo}`);
      console.log(`   Employee ID: ${attRecs[0].employee_id}`);
      const { data: e } = await db.from("employees").select("*")
        .eq("id", attRecs[0].employee_id).maybeSingle();
      if (e) {
        employee = e;
        console.log(`   → ${e.arabic_name || e.name} (person_id=${e.person_id}, device#=${e.device_employee_no})`);
      }
    }
  }
}

if (!employee) {
  console.log("\n   ❌ Cannot proceed without finding the employee.");
  process.exit(1);
}

// Get attendance record for the date
console.log(`\n── Attendance Record for ${dateStr} ──\n`);

const { data: record } = await db.from("attendance_records").select("*")
  .eq("employee_id", employee.id).eq("date", dateStr).maybeSingle();

if (record) {
  console.log(`   Check-in:        ${record.check_in_time || "NULL"}`);
  console.log(`   Check-out:       ${record.check_out_time || "NULL"}`);
  console.log(`   Working hours:   ${record.working_hours}`);
  console.log(`   Overtime:        ${record.overtime_hours}`);
  console.log(`   Status:          ${record.status}`);
  console.log(`   Is late:         ${record.is_late} (${record.late_minutes} min)`);
  console.log(`   Auto-checkout:   ${record.auto_checkout_applied}`);
  console.log(`   Source:          ${record.source}`);
  console.log(`   Device emp #:    ${record.device_employee_no}`);

  // Verify hours
  if (record.check_in_time && record.check_out_time) {
    const [ih, im, is2] = record.check_in_time.split(":").map(Number);
    const [oh, om, os2] = record.check_out_time.split(":").map(Number);
    const inMin = ih * 60 + im + (is2 || 0) / 60;
    const outMin = oh * 60 + om + (os2 || 0) / 60;
    const expectedHours = Math.round(((outMin - inMin) / 60) * 100) / 100;
    console.log(`\n   Hours check:     ${record.check_in_time} → ${record.check_out_time} = ${expectedHours}h (DB says ${record.working_hours}h)`);
    if (Math.abs(expectedHours - record.working_hours) > 0.05) {
      console.log(`   ⚠️ MISMATCH`);
    } else {
      console.log(`   ✅ Correct`);
    }
  }
} else {
  console.log("   ❌ No record found");
}

// Check adjacent days
console.log(`\n── Adjacent Days ──\n`);
const prevDate = new Date(new Date(dateStr + "T00:00:00+03:00").getTime() - 86400000).toISOString().slice(0, 10);
const nextDate = new Date(new Date(dateStr + "T00:00:00+03:00").getTime() + 86400000).toISOString().slice(0, 10);

const { data: prevRec } = await db.from("attendance_records").select("*")
  .eq("employee_id", employee.id).eq("date", prevDate).maybeSingle();
const { data: nextRec } = await db.from("attendance_records").select("*")
  .eq("employee_id", employee.id).eq("date", nextDate).maybeSingle();

console.log(`   ${prevDate}: ${prevRec ? `in=${prevRec.check_in_time || "—"} out=${prevRec.check_out_time || "—"} hours=${prevRec.working_hours} status=${prevRec.status}` : "no record"}`);
console.log(`   ${dateStr}: ${record ? `in=${record.check_in_time || "—"} out=${record.check_out_time || "—"} hours=${record.working_hours} status=${record.status}` : "no record"}`);
console.log(`   ${nextDate}: ${nextRec ? `in=${nextRec.check_in_time || "—"} out=${nextRec.check_out_time || "—"} hours=${nextRec.working_hours} status=${nextRec.status}` : "no record"}`);

// Get all records for this employee in the date range to spot patterns
console.log(`\n── Last 7 days of attendance ──\n`);
const weekAgo = new Date(new Date(dateStr + "T00:00:00+03:00").getTime() - 7 * 86400000).toISOString().slice(0, 10);
const { data: weekRecs } = await db.from("attendance_records").select("*")
  .eq("employee_id", employee.id)
  .gte("date", weekAgo)
  .lte("date", nextDate)
  .order("date", { ascending: true });

if (weekRecs && weekRecs.length > 0) {
  console.log("   Date        | Check-in | Check-out | Hours | Status");
  console.log("   " + "─".repeat(60));
  weekRecs.forEach(r => {
    console.log(`   ${r.date} | ${(r.check_in_time || "—").padEnd(8)} | ${(r.check_out_time || "—").padEnd(9)} | ${String(r.working_hours).padEnd(5)} | ${r.status}`);
  });
}

console.log(`\n${"═".repeat(70)}\n`);
