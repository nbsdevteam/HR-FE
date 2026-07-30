/**
 * Full verification for عبد الرحمن بنقلاديشي — Employee device #3
 * Run on your machine: node full-verify.mjs
 * 
 * Checks:
 * 1. Find the employee in DB by multiple methods
 * 2. Get attendance record for 2026-04-09
 * 3. Verify check-in/check-out times match what UI shows (7:12 PM / 11:30 PM)
 * 4. Verify working hours calculation (should be ~4.3h)
 * 5. Get raw device events for cross-check
 * 6. Show 7-day history for pattern analysis
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const dateStr = "2026-04-09";

const log = (msg) => console.log(msg);
const sep = () => log("─".repeat(70));

log(`\n${"═".repeat(70)}`);
log(`  FULL VERIFICATION — عبد الرحمن بنقلاديشي — ${dateStr}`);
log(`${"═".repeat(70)}\n`);

// ── STEP 1: Find the employee ──
log("▸ STEP 1: Finding employee...\n");

let employee = null;

// Method 1: by device_employee_no
const { data: byDev } = await db.from("employees").select("*")
  .eq("device_employee_no", "3").maybeSingle();
if (byDev) { employee = byDev; log("  Found by device_employee_no=3"); }

// Method 2: by person_id
if (!employee) {
  const { data: byPid } = await db.from("employees").select("*")
    .eq("person_id", 3).maybeSingle();
  if (byPid) { employee = byPid; log("  Found by person_id=3"); }
}

// Method 3: by name search (multiple patterns)
if (!employee) {
  for (const term of ["بنقلاديش", "عبد الرحمن بنقلاديش", "بنغلاديش", "bangladesh"]) {
    const col = term === "bangladesh" ? "name" : "arabic_name";
    const { data: byName } = await db.from("employees").select("*")
      .ilike(col, `%${term}%`).limit(5);
    if (byName && byName.length > 0) {
      employee = byName[0];
      log(`  Found by ${col} containing "${term}"`);
      if (byName.length > 1) log(`  ⚠️ Multiple matches: ${byName.map(e => e.arabic_name || e.name).join(", ")}`);
      break;
    }
  }
}

// Method 4: Find via attendance_records device_employee_no
if (!employee) {
  log("  Trying via attendance_records...");
  const { data: attRec } = await db.from("attendance_records").select("employee_id")
    .eq("device_employee_no", "3").limit(1).maybeSingle();
  if (attRec) {
    const { data: emp } = await db.from("employees").select("*")
      .eq("id", attRec.employee_id).maybeSingle();
    if (emp) { employee = emp; log(`  Found via attendance record → employee_id=${emp.id}`); }
  }
}

// Method 5: list ALL employees and find #3
if (!employee) {
  log("  Listing all employees to find device #3...");
  const { data: all, count } = await db.from("employees")
    .select("id, arabic_name, name, person_id, device_employee_no, national_id", { count: "exact" })
    .limit(200);
  if (all) {
    log(`  Total employees: ${count || all.length}`);
    const match = all.find(e => e.device_employee_no === "3" || e.device_employee_no === 3 || e.person_id === 3);
    if (match) { 
      const { data: full } = await db.from("employees").select("*").eq("id", match.id).maybeSingle();
      employee = full || match;
      log(`  Found: ${match.arabic_name || match.name}`);
    } else {
      log("  ⚠️ No employee with device#3 or person_id=3 in first 200 records");
      // Show all device numbers for debugging
      const devNums = all.map(e => e.device_employee_no).filter(Boolean).sort((a,b) => Number(a)-Number(b));
      log(`  Device numbers in DB: ${devNums.join(", ")}`);
    }
  }
}

if (!employee) {
  log("\n  ❌ EMPLOYEE NOT FOUND by any method!");
  log("  This could mean:");
  log("  1. The employee was auto-created during sync and has a different device_employee_no");
  log("  2. The device_employee_no in the UI is coming from the attendance record, not the employee table");
  log("\n  Searching attendance_records for any record on 2026-04-09 with check-in around 19:12...");
  
  const { data: allAtt } = await db.from("attendance_records").select("*")
    .eq("date", dateStr)
    .limit(100);
  
  if (allAtt && allAtt.length > 0) {
    log(`\n  All ${allAtt.length} attendance records on ${dateStr}:`);
    sep();
    for (const r of allAtt) {
      const { data: emp } = await db.from("employees").select("arabic_name, name, device_employee_no, person_id")
        .eq("id", r.employee_id).maybeSingle();
      const ename = emp ? (emp.arabic_name || emp.name) : `emp_id=${r.employee_id}`;
      const dno = emp ? emp.device_employee_no : "?";
      const attDno = r.device_employee_no || "?";
      log(`  ${ename.padEnd(30)} | emp_dev#${dno} att_dev#${attDno} | in=${r.check_in_time||"—"} out=${r.check_out_time||"—"} | ${r.working_hours}h | ${r.status}`);
    }
  }
  
  process.exit(0);
}

// ── Display employee info ──
sep();
log(`  Name:           ${employee.arabic_name || employee.name}`);
log(`  DB ID:          ${employee.id}`);
log(`  Person ID:      ${employee.person_id}`);
log(`  Device #:       ${employee.device_employee_no || "NOT SET"}`);
log(`  National ID:    ${employee.national_id || "—"}`);
log(`  Department:     ${employee.department}`);
log(`  Position:       ${employee.position || "—"}`);
log(`  Shift ID:       ${employee.shift_id || "none"}`);
log(`  Status:         ${employee.status}`);

if (employee.shift_id) {
  const { data: shift } = await db.from("shifts").select("*")
    .eq("id", employee.shift_id).maybeSingle();
  if (shift) {
    log(`  Shift:          ${shift.name_ar || shift.name} (${shift.start_time} → ${shift.end_time})`);
  }
}

// ── STEP 2: Get attendance record ──
log(`\n▸ STEP 2: Attendance Record for ${dateStr}\n`);

const { data: record } = await db.from("attendance_records").select("*")
  .eq("employee_id", employee.id).eq("date", dateStr).maybeSingle();

if (record) {
  log(`  Record ID:      ${record.id}`);
  log(`  Check-in:       ${record.check_in_time || "NULL"}`);
  log(`  Check-out:      ${record.check_out_time || "NULL"}`);
  log(`  Working hours:  ${record.working_hours}`);
  log(`  Overtime:       ${record.overtime_hours}`);
  log(`  Status:         ${record.status}`);
  log(`  Is late:        ${record.is_late} (${record.late_minutes} min)`);
  log(`  Auto-checkout:  ${record.auto_checkout_applied}`);
  log(`  Source:         ${record.source}`);
  log(`  Device emp #:   ${record.device_employee_no}`);
  log(`  Verify mode:    ${record.verify_mode || "—"}`);
  log(`  Day of week:    ${record.day_of_week}`);
  
  // ── STEP 3: Verify times match UI screenshot ──
  log(`\n▸ STEP 3: Cross-check with UI screenshot\n`);
  log(`  UI shows:  Check-in 7:12 PM, Check-out 11:30 PM, 4:18 hours`);
  
  // Convert DB times to 12h format for comparison
  if (record.check_in_time) {
    const [h, m] = record.check_in_time.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    log(`  DB check-in:  ${record.check_in_time} = ${h12}:${String(m).padStart(2,"0")} ${ampm}`);
  }
  if (record.check_out_time) {
    const [h, m] = record.check_out_time.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    log(`  DB check-out: ${record.check_out_time} = ${h12}:${String(m).padStart(2,"0")} ${ampm}`);
  }
  
  // ── STEP 4: Verify hours calculation ──
  log(`\n▸ STEP 4: Working hours verification\n`);
  if (record.check_in_time && record.check_out_time) {
    const [ih, im, is2] = record.check_in_time.split(":").map(Number);
    const [oh, om, os2] = record.check_out_time.split(":").map(Number);
    const inMin = ih * 60 + im + (is2 || 0) / 60;
    const outMin = oh * 60 + om + (os2 || 0) / 60;
    const diffMin = outMin - inMin;
    const expectedHours = Math.round((diffMin / 60) * 100) / 100;
    
    log(`  Calculation: ${record.check_out_time} - ${record.check_in_time}`);
    log(`  = ${diffMin.toFixed(1)} minutes = ${expectedHours} hours`);
    log(`  DB says: ${record.working_hours} hours`);
    
    if (Math.abs(expectedHours - record.working_hours) > 0.05) {
      log(`  ⚠️ MISMATCH: expected ${expectedHours}h but DB has ${record.working_hours}h`);
    } else {
      log(`  ✅ Hours calculation is CORRECT`);
    }
    
    // Check if 4.3h ≈ 4:18
    const hrs = Math.floor(record.working_hours);
    const mins = Math.round((record.working_hours - hrs) * 60);
    log(`  Display format: ${hrs}:${String(mins).padStart(2,"0")} (${record.working_hours}h)`);
    log(`  UI shows: 4:18 → expected decimal = ${(4 + 18/60).toFixed(2)}h = 4.30h`);
  }
} else {
  log("  ❌ No attendance record found for this employee on this date!");
  
  // Check if there's a record under a different employee_id
  log("\n  Checking all records on this date...");
  const { data: allRecs } = await db.from("attendance_records").select("employee_id, device_employee_no, check_in_time, check_out_time, working_hours")
    .eq("date", dateStr).limit(50);
  if (allRecs) {
    const match = allRecs.find(r => r.device_employee_no === "3");
    if (match) {
      log(`  Found record with device#3 under employee_id=${match.employee_id}!`);
      log(`  in=${match.check_in_time} out=${match.check_out_time} hours=${match.working_hours}`);
    }
  }
}

// ── STEP 5: 7-day history ──
log(`\n▸ STEP 5: 7-Day History\n`);
const weekStart = new Date(new Date(dateStr + "T00:00:00+03:00").getTime() - 3 * 86400000).toISOString().slice(0, 10);
const weekEnd = new Date(new Date(dateStr + "T00:00:00+03:00").getTime() + 3 * 86400000).toISOString().slice(0, 10);

const { data: weekRecs } = await db.from("attendance_records").select("*")
  .eq("employee_id", employee.id)
  .gte("date", weekStart)
  .lte("date", weekEnd)
  .order("date");

if (weekRecs && weekRecs.length > 0) {
  log("  Date        | Day   | Check-in | Check-out | Hours | Status      | Auto?");
  sep();
  for (const r of weekRecs) {
    const day = r.day_of_week ? r.day_of_week.slice(0, 5).padEnd(5) : "     ";
    const ci = (r.check_in_time || "—").padEnd(8);
    const co = (r.check_out_time || "—").padEnd(9);
    const hrs = String(r.working_hours).padEnd(5);
    const st = (r.status || "—").padEnd(11);
    const auto = r.auto_checkout_applied ? "YES" : "no";
    log(`  ${r.date} | ${day} | ${ci} | ${co} | ${hrs} | ${st} | ${auto}`);
  }
} else {
  log("  No records in this range");
}

// ── STEP 6: Try device cross-check ──
log(`\n▸ STEP 6: Device Cross-Check\n`);
try {
  const { HikvisionClient } = await import("./hikvision-api.mjs");
  const hik = new HikvisionClient({
    ip: process.env.DEVICE_IP || "192.168.15.15",
    port: parseInt(process.env.DEVICE_PORT || "443"),
    username: process.env.DEVICE_USERNAME || "admin",
    password: process.env.DEVICE_PASSWORD || "",
    useHttps: process.env.DEVICE_USE_HTTPS !== "false",
  });
  
  const startTime = `${dateStr}T00:00:00+03:00`;
  const endTime = `${dateStr}T23:59:59+03:00`;
  
  log("  Fetching events from device...");
  const events = await hik.fetchAttendanceEvents(startTime, endTime);
  const empNo = employee.device_employee_no || "3";
  const empEvents = events.filter(e => e.employeeNo === empNo || e.employeeNo === String(parseInt(empNo)));
  
  log(`  Total device events on ${dateStr}: ${events.length}`);
  log(`  Events for employee #${empNo}: ${empEvents.length}\n`);
  
  if (empEvents.length > 0) {
    log("  # | Time                | Status          | VerifyMode");
    sep();
    empEvents.forEach((evt, i) => {
      log(`  ${i+1} | ${evt.time} | ${(evt.attendanceStatus||"—").padEnd(15)} | ${evt.verifyMode || "—"}`);
    });
    
    const checkIns = empEvents.filter(e => e.attendanceStatus === "checkIn");
    const checkOuts = empEvents.filter(e => e.attendanceStatus === "checkOut");
    
    log(`\n  Summary:`);
    log(`  Check-INs on device:  ${checkIns.length > 0 ? checkIns.map(e => e.time.slice(11,19)).join(", ") : "NONE"}`);
    log(`  Check-OUTs on device: ${checkOuts.length > 0 ? checkOuts.map(e => e.time.slice(11,19)).join(", ") : "NONE"}`);
    
    if (record) {
      const dbIn = record.check_in_time;
      const dbOut = record.check_out_time;
      const devIn = checkIns.length > 0 ? checkIns[0].time.slice(11,19) : null;
      const devOut = checkOuts.length > 0 ? checkOuts[checkOuts.length-1].time.slice(11,19) : null;
      
      log(`\n  DB check-in:  ${dbIn}  vs  Device first checkIn:  ${devIn || "NONE"}`);
      log(`  DB check-out: ${dbOut}  vs  Device last checkOut:  ${devOut || "NONE"}`);
      
      if (dbIn === devIn && dbOut === devOut) log("  ✅ PERFECT MATCH");
      else {
        if (dbIn !== devIn) log(`  ⚠️ CHECK-IN MISMATCH: DB=${dbIn} Device=${devIn}`);
        if (dbOut !== devOut) log(`  ⚠️ CHECK-OUT MISMATCH: DB=${dbOut} Device=${devOut}`);
      }
    }
  } else {
    log("  ❌ No events for this employee on device!");
    log("  This could mean the events were purged from the device.");
  }
} catch (err) {
  log(`  ⚠️ Cannot reach device: ${err.message}`);
  log("  (Device is on local network — this is expected if running remotely)");
}

log(`\n${"═".repeat(70)}`);
log("  VERIFICATION COMPLETE");
log(`${"═".repeat(70)}\n`);

process.exit(0);
