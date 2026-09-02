/**
 * Staging validation helper (step 8 of the "Device-Sync Odoo Bridge" plan):
 * diff Supabase attendance_records against Odoo hr.attendance for the same
 * date range, matched by device_employee_no, so you can eyeball whether the
 * Odoo bridge produced equivalent check-in/check-out data before trusting it.
 *
 * Run AFTER `BACKEND=odoo node manual-sync.mjs <dates>` has populated the
 * staging Odoo DB for the range you're validating (Supabase is assumed to
 * already have the real data from live production sync).
 *
 * Usage:
 *   node diff-backends.mjs 2026-04-01              # single date
 *   node diff-backends.mjs 2026-04-01 2026-04-07   # date range
 *
 * Reads both sets of credentials from .env at once: SUPABASE_URL/
 * SUPABASE_SERVICE_KEY and ODOO_API_BASE/ODOO_DB/ODOO_SYNC_USERNAME/
 * ODOO_SYNC_PASSWORD must all be set (independent of BACKEND, which this
 * script ignores).
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { OdooClient } from "./odoo-client.mjs";

const [, , startArg, endArg] = process.argv;
if (!startArg) {
  console.error("Usage: node diff-backends.mjs <startDate> [endDate]");
  process.exit(1);
}
const startDate = startArg;
const endDate = endArg || startDate;

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const odoo = new OdooClient({
  apiBase: process.env.ODOO_API_BASE,
  db: process.env.ODOO_DB || "",
  username: process.env.ODOO_SYNC_USERNAME,
  password: process.env.ODOO_SYNC_PASSWORD,
  log: () => {},
});

function utcToLocalTime(utcStr, offsetHours = 3) {
  if (!utcStr) return null;
  const d = new Date(utcStr.replace(" ", "T") + "Z");
  if (Number.isNaN(d.getTime())) return null;
  const local = new Date(d.getTime() + offsetHours * 3600 * 1000);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}:${pad(local.getUTCSeconds())}`;
}

async function fetchSupabaseDay(dateStr) {
  const { data, error } = await db
    .from("attendance_records")
    .select("device_employee_no, check_in_time, check_out_time, status")
    .eq("date", dateStr);
  if (error) throw new Error(`Supabase: ${error.message}`);
  const map = new Map();
  for (const row of data || []) {
    if (row.device_employee_no) map.set(String(row.device_employee_no), row);
  }
  return map;
}

async function fetchOdooDay(dateStr) {
  const map = new Map();
  let offset = 0;
  const limit = 100; // server-enforced cap on /api/hr/attendance/list
  for (;;) {
    const page = await odoo.call("/api/hr/attendance/list", { date_from: dateStr, date_to: dateStr, limit, offset });
    const items = page?.items || [];
    for (const row of items) {
      if (row.device_employee_no) {
        map.set(String(row.device_employee_no), {
          check_in_time: utcToLocalTime(row.check_in),
          check_out_time: utcToLocalTime(row.check_out),
          status: row.status,
        });
      }
    }
    if (!page?.pagination?.has_next) break;
    offset = page.pagination.next_offset ?? offset + limit;
  }
  return map;
}

async function diffDay(dateStr) {
  console.log(`\n📅 ${dateStr}`);
  const [supaMap, odooMap] = await Promise.all([fetchSupabaseDay(dateStr), fetchOdooDay(dateStr)]);

  const allKeys = new Set([...supaMap.keys(), ...odooMap.keys()]);
  let matches = 0;
  let mismatches = 0;
  let missingInOdoo = 0;
  let extraInOdoo = 0;

  for (const key of allKeys) {
    const s = supaMap.get(key);
    const o = odooMap.get(key);
    if (s && !o) {
      missingInOdoo++;
      console.log(`   ⚠️  #${key}: in Supabase (${s.check_in_time || "—"} → ${s.check_out_time || "—"}) but missing in Odoo`);
      continue;
    }
    if (!s && o) {
      extraInOdoo++;
      console.log(`   ℹ️  #${key}: in Odoo (${o.check_in_time || "—"} → ${o.check_out_time || "—"}) but not in Supabase (ok if newly onboarded on staging)`);
      continue;
    }
    const sameCheckIn = (s.check_in_time || null) === (o.check_in_time || null);
    const sameCheckOut = (s.check_out_time || null) === (o.check_out_time || null);
    if (sameCheckIn && sameCheckOut) {
      matches++;
    } else {
      mismatches++;
      console.log(`   ❌ #${key}: Supabase ${s.check_in_time || "—"} → ${s.check_out_time || "—"}  vs  Odoo ${o.check_in_time || "—"} → ${o.check_out_time || "—"}`);
    }
  }

  console.log(`   Σ matches=${matches} mismatches=${mismatches} missingInOdoo=${missingInOdoo} extraInOdoo=${extraInOdoo}`);
  return { matches, mismatches, missingInOdoo, extraInOdoo };
}

const totals = { matches: 0, mismatches: 0, missingInOdoo: 0, extraInOdoo: 0 };
const start = new Date(startDate);
const end = new Date(endDate);
for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
  const ds = d.toISOString().slice(0, 10);
  const r = await diffDay(ds);
  totals.matches += r.matches;
  totals.mismatches += r.mismatches;
  totals.missingInOdoo += r.missingInOdoo;
  totals.extraInOdoo += r.extraInOdoo;
}

console.log("\n═══════════════════════════════════════");
console.log(`  TOTAL — matches: ${totals.matches}, mismatches: ${totals.mismatches}, missingInOdoo: ${totals.missingInOdoo}, extraInOdoo: ${totals.extraInOdoo}`);
console.log("═══════════════════════════════════════\n");

if (totals.mismatches > 0 || totals.missingInOdoo > 0) {
  console.log("⚠️  Do not cut over yet — investigate the rows above.\n");
  process.exitCode = 1;
} else {
  console.log("✅ Odoo matches Supabase for this range.\n");
}
