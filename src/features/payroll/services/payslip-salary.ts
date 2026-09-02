/**
 * End-of-service benefit calculation.
 *
 * The rest of this pipeline stage (`calculateSalary`, `summarizeAttendance`,
 * `computeCurrencySalary`) moved server-side — `/api/hr/payroll/list` and
 * `/api/hr/payroll/employee/<id>` now return pre-computed gross/net figures
 * (see `Payroll FE Handoff.md`). EOS has no server endpoint yet, so it stays
 * here for `ExitTab`.
 */

/** EOS formula parameters — all configurable from DB (configurations table).
 *  Call with values from useConfigurations().getNumber() in UI layer.
 *  Defaults match Iraqi labor law but can be changed per organization. */
export interface EOSConfig {
  tier1Years: number;   // default 5 — first N years use tier1 rate
  tier1Rate: number;    // default 0.5 — half month per year
  tier2Rate: number;    // default 1.0 — full month per year after tier1
  minYears: number;     // default 1 — minimum service years to qualify
}

export const DEFAULT_EOS_CONFIG: EOSConfig = {
  tier1Years: 5,
  tier1Rate: 0.5,
  tier2Rate: 1.0,
  minYears: 1,
};

/** Calculate the end-of-service benefit.
 *  Formula is fully configurable through the EOSConfig parameter.
 *  Tier 1: first N years × tier1Rate × monthly salary
 *  Tier 2: remaining years × tier2Rate × monthly salary */
export const calculateEOS = (
  joinDate: string | null,
  monthlySalary: number,
  currency: string,
  eosConfig: EOSConfig = DEFAULT_EOS_CONFIG,
  asOfDate: string | Date = new Date(),
): { years: number; months: number; amount: number; currency: string } | null => {
  if (!joinDate) return null;
  const start = new Date(joinDate);
  const now = new Date(asOfDate);
  const diffMs = now.getTime() - start.getTime();
  const totalMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44));
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years < eosConfig.minYears) return { years, months, amount: 0, currency };
  // Configurable tiered formula
  const tier1Amount = Math.min(years, eosConfig.tier1Years) * (monthlySalary * eosConfig.tier1Rate);
  const tier2Amount = Math.max(0, years - eosConfig.tier1Years) * (monthlySalary * eosConfig.tier2Rate);
  const amount = Math.round((tier1Amount + tier2Amount) * 100) / 100;
  return { years, months, amount, currency };
};
