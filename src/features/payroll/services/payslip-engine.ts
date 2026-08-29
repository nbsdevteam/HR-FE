/**
 * Payslip Engine — public surface of the payroll calculation pipeline.
 *
 * This was one 886-line module; it is now a barrel over four focused stages so
 * every existing `from "./payslip-engine"` import keeps working unchanged:
 *
 *   payslip-types.ts      — domain types, defaults, settings construction
 *   payslip-time.ts       — date/time primitives
 *   payslip-attendance.ts — stage 2: raw punches → processed day records
 *   payslip-salary.ts     — stage 3: processed days → money (+ end-of-service)
 *   payslip-leave.ts      — stage 4: overlay approved leave onto day records
 *   payslip-records.ts    — record-set filters for the detail views
 *
 * Stage 1 (parsing) lives in ./payslip-parsing.ts — it's the only part of this
 * feature that needs the `xlsx` library, kept separate so importing the
 * calculation/formatting helpers doesn't pull xlsx into every bundle.
 */

export * from "./payslip-types";
export * from "./payslip-attendance";
export * from "./payslip-salary";
export * from "./payslip-leave";
export * from "./payslip-records";

// Currency/duration formatting now lives in `@/shared/utils/currency` — four
// other features render salaries and were reaching into this payroll module for
// it. Re-exported here so existing payroll-side imports keep working.
export { formatCurrency, formatHoursMinutes } from "@/shared/utils/currency";
