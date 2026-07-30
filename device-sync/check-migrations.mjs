import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

console.log("\n══ Migration Status Check ══\n");

// Phase 2: Check unique constraint on (employee_id, date)
console.log("▸ Phase 2 — Unique constraint (employee_id, date):");
try {
  // Try inserting a duplicate — if constraint exists, it'll fail
  // Instead, just check if duplicates exist
  const { data: dupes } = await db.rpc("check_duplicates_exist", {}).maybeSingle();
} catch (e) {}

// Alternative: try to read the constraint from information_schema
const { data: constraints, error: cErr } = await db.from("attendance_records")
  .select("id").limit(0); // just to test table exists

// Check by trying to find duplicates
const { data: dupCheck, error: dupErr } = await db.from("attendance_records")
  .select("employee_id, date", { count: "exact", head: true });

// Better approach: try a raw query-like test
// Insert + rollback won't work via client, so let's check for the breaks column instead

// Phase 4: Check if 'breaks' column exists on attendance_records
console.log("▸ Phase 4 — breaks column on attendance_records:");
const { data: testRec, error: breakErr } = await db.from("attendance_records")
  .select("breaks, total_break_minutes")
  .limit(1);

if (breakErr && breakErr.message.includes("breaks")) {
  console.log("  ❌ NOT APPLIED — 'breaks' column does not exist");
} else {
  console.log("  ✅ APPLIED — 'breaks' column exists");
}

// Phase 4: Check if 'status' column exists on biometric_devices  
console.log("▸ Phase 4 — status column on biometric_devices:");
const { data: devTest, error: devErr } = await db.from("biometric_devices")
  .select("status")
  .limit(1);

if (devErr && devErr.message.includes("status")) {
  console.log("  ❌ NOT APPLIED — 'status' column does not exist on biometric_devices");
} else {
  console.log("  ✅ APPLIED — 'status' column exists on biometric_devices");
}

// Phase 4: Check if leave_requests table exists
console.log("▸ Phase 4 — leave_requests table:");
const { data: leaveTest, error: leaveErr } = await db.from("leave_requests")
  .select("id")
  .limit(1);

if (leaveErr && (leaveErr.message.includes("does not exist") || leaveErr.code === "PGRST204" || leaveErr.code === "42P01")) {
  console.log("  ❌ NOT APPLIED — leave_requests table does not exist");
} else {
  console.log("  ✅ APPLIED — leave_requests table exists");
}

// Phase 2: Check for duplicate attendance records
console.log("\n▸ Phase 2 — Duplicate check:");
const { data: allRecs, error: allErr } = await db.from("attendance_records")
  .select("employee_id, date")
  .limit(5000);

if (allErr) {
  console.log("  ⚠️ Could not check:", allErr.message);
} else if (allRecs) {
  const seen = new Set();
  let dupeCount = 0;
  for (const r of allRecs) {
    const key = `${r.employee_id}|${r.date}`;
    if (seen.has(key)) dupeCount++;
    seen.add(key);
  }
  if (dupeCount > 0) {
    console.log(`  ❌ NOT APPLIED — Found ${dupeCount} duplicate (employee_id, date) pairs`);
  } else {
    console.log("  ✅ No duplicates found — constraint may already be in place");
  }
}

// Phase 2: Try to confirm unique constraint directly
console.log("\n▸ Phase 2 — Unique constraint existence (indirect test):");
// We'll try inserting a known record twice with a fake ID
const fakeId = "migration-check-" + Date.now();
const { error: ins1 } = await db.from("attendance_records").insert({
  employee_id: fakeId, date: "1999-01-01", status: "test", working_hours: 0
});
if (ins1) {
  // Insert failed — probably foreign key constraint, which is fine
  console.log("  ⚠️ Cannot test directly (foreign key prevents test insert)");
  console.log("  → Run this SQL in Supabase to check:");
  console.log("    SELECT conname FROM pg_constraint WHERE conname = 'uq_attendance_employee_date';");
} else {
  // First insert succeeded, try duplicate
  const { error: ins2 } = await db.from("attendance_records").insert({
    employee_id: fakeId, date: "1999-01-01", status: "test", working_hours: 0
  });
  // Clean up
  await db.from("attendance_records").delete().eq("employee_id", fakeId);
  
  if (ins2 && ins2.message.includes("unique")) {
    console.log("  ✅ APPLIED — unique constraint is active");
  } else {
    console.log("  ❌ NOT APPLIED — duplicate insert succeeded (no unique constraint)");
  }
}

console.log("\n══ Done ══\n");
process.exit(0);
