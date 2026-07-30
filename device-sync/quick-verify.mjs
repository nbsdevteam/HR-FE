import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const dateStr = "2026-04-09";

// Find by attendance record device_employee_no
console.log("\n── Finding attendance record with device #3 ──\n");
const { data: recs } = await db.from("attendance_records")
  .select("*")
  .eq("device_employee_no", "3")
  .eq("date", dateStr);

if (recs && recs.length > 0) {
  for (const r of recs) {
    console.log(`Record ID: ${r.id}`);
    console.log(`Employee ID: ${r.employee_id}`);
    console.log(`Check-in: ${r.check_in_time}`);
    console.log(`Check-out: ${r.check_out_time}`);
    console.log(`Hours: ${r.working_hours}`);
    console.log(`Status: ${r.status}`);
    console.log(`Source: ${r.source}`);
    console.log(`Auto-checkout: ${r.auto_checkout_applied}`);

    // Get employee
    const { data: emp } = await db.from("employees").select("arabic_name, name, person_id, device_employee_no, shift_id, department")
      .eq("id", r.employee_id).maybeSingle();
    if (emp) {
      console.log(`\nEmployee: ${emp.arabic_name || emp.name}`);
      console.log(`Person ID: ${emp.person_id}, Device#: ${emp.device_employee_no}`);
      console.log(`Dept: ${emp.department}, Shift: ${emp.shift_id || "none"}`);

      if (emp.shift_id) {
        const { data: shift } = await db.from("shifts").select("name_ar, start_time, end_time")
          .eq("id", emp.shift_id).maybeSingle();
        if (shift) console.log(`Shift: ${shift.name_ar} (${shift.start_time} → ${shift.end_time})`);
      }
    }

    // Hours verification
    if (r.check_in_time && r.check_out_time) {
      const [ih, im, is2] = r.check_in_time.split(":").map(Number);
      const [oh, om, os2] = r.check_out_time.split(":").map(Number);
      const inMin = ih * 60 + im + (is2||0)/60;
      const outMin = oh * 60 + om + (os2||0)/60;
      const expected = Math.round(((outMin - inMin) / 60) * 100) / 100;
      console.log(`\nHours: ${r.check_in_time} → ${r.check_out_time} = ${expected}h (DB: ${r.working_hours}h) ${Math.abs(expected - r.working_hours) < 0.05 ? "✅" : "⚠️ MISMATCH"}`);
    }
  }
} else {
  console.log("No record found with device_employee_no=3 on " + dateStr);

  // Try searching by name
  console.log("\n── Searching by name 'بنقلاديش' ──\n");
  const { data: emps } = await db.from("employees").select("id, arabic_name, name, person_id, device_employee_no")
    .ilike("arabic_name", "%بنقلاديش%");
  if (emps && emps.length > 0) {
    for (const e of emps) {
      console.log(`${e.arabic_name} | person_id=${e.person_id} | device#=${e.device_employee_no}`);
      const { data: att } = await db.from("attendance_records").select("*")
        .eq("employee_id", e.id).eq("date", dateStr).maybeSingle();
      if (att) {
        console.log(`  → in=${att.check_in_time} out=${att.check_out_time} hours=${att.working_hours} status=${att.status} device#=${att.device_employee_no}`);
      } else {
        console.log("  → no attendance record for this date");
      }
    }
  }
}

// Also check adjacent days
console.log("\n── Adjacent days for same employee ──\n");
const { data: recs3 } = await db.from("attendance_records")
  .select("date, check_in_time, check_out_time, working_hours, status, auto_checkout_applied")
  .eq("device_employee_no", "3")
  .gte("date", "2026-04-07")
  .lte("date", "2026-04-11")
  .order("date");

if (recs3) {
  recs3.forEach(r => {
    console.log(`${r.date} | in=${r.check_in_time || "—"} out=${r.check_out_time || "—"} | ${r.working_hours}h | ${r.status} ${r.auto_checkout_applied ? "(auto)" : ""}`);
  });
}

console.log("\nDone.\n");
process.exit(0);
