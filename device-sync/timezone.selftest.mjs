import { strict as assert } from "node:assert";
import { baghdadLocalToOdooUtc, HR_BUSINESS_TZ } from "./timezone.mjs";

assert.equal(HR_BUSINESS_TZ, "Asia/Baghdad");
assert.equal(baghdadLocalToOdooUtc("2026-08-12", "12:32:41"), "2026-08-12 09:32:41");
assert.equal(baghdadLocalToOdooUtc("2026-08-12", "08:00:00"), "2026-08-12 05:00:00");
assert.equal(baghdadLocalToOdooUtc("2026-08-13", "00:30:00"), "2026-08-12 21:30:00");
console.log("timezone.mjs OK");
