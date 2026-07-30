/**
 * One-time fix: Reset corrupted attendance records where
 * check_out_time was incorrectly set to the same value as check_in_time
 * (caused by duplicate event processing after service restart).
 *
 * Usage:  node fix-checkout-records.mjs
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

console.log("\n🔧 Fixing corrupted attendance records...\n");

// Find all records where check_out_time = check_in_time
const { data: badRecords, error } = await db
  .from("attendance_records")
  .select("id, employee_id, date, check_in_time, check_out_time, status")
  .not("check_out_time", "is", null)
  .order("date", { ascending: false });

if (error) {
  console.error("❌ Query failed:", error.message);
  process.exit(1);
}

// Filter where check_out == check_in
const corrupted = badRecords.filter((r) => r.check_out_time === r.check_in_time);

console.log(`📊 Total records with check_out: ${badRecords.length}`);
console.log(`⚠️  Corrupted (check_out = check_in): ${corrupted.length}\n`);

if (corrupted.length === 0) {
  console.log("✅ No corrupted records found. All good!\n");
  process.exit(0);
}

// Fix them: set check_out_time to null, status to checked_in, working_hours to 0
let fixed = 0;
for (const record of corrupted) {
  const { error: updateErr } = await db
    .from("attendance_records")
    .update({
      check_out_time: null,
      working_hours: 0,
      overtime_hours: 0,
      status: "checked_in",
    })
    .eq("id", record.id);

  if (updateErr) {
    console.error(`   ❌ Failed to fix record ${record.id}: ${updateErr.message}`);
  } else {
    console.log(`   ✅ Fixed: ${record.date} | check_in: ${record.check_in_time} | was showing checkout: ${record.check_out_time}`);
    fixed++;
  }
}

console.log(`\n✅ Fixed ${fixed}/${corrupted.length} corrupted records.\n`);
