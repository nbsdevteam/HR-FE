import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const { data: earliest } = await db.from("attendance_records").select("date").order("date", { ascending: true }).limit(1).maybeSingle();
const { data: latest } = await db.from("attendance_records").select("date").order("date", { ascending: false }).limit(1).maybeSingle();
const { count } = await db.from("attendance_records").select("*", { count: "exact", head: true });

console.log(`Earliest: ${earliest?.date}`);
console.log(`Latest:   ${latest?.date}`);
console.log(`Total records: ${count}`);
