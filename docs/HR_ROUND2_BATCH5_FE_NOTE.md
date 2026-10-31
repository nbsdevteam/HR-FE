# HR round 2, batch 5: dashboard and report figures

**For:** the HR-FE team. **Backend:** `lugal_hr` on Lugal-ai `development`, 31 Oct 2026. Restart only; no module upgrade. No key was added, renamed or removed. Three figures change **meaning**, so the screen may need new wording.

## 1. Today's tiles: `present` now means "on time"

Applies to both the Control Panel (`/api/hr/control-panel/*`, `attendance` section) and `/api/hr/dashboard` (`cards`).

| key | before | now |
|---|---|---|
| `present` | everyone who punched today, late included | **on time only** |
| `late` | late punches (rows) | late **people**, not on leave |
| `absent` | headcount − present − on leave − not tracked | headcount − present − **late** − on leave − not tracked |

`present + late + absent + on_leave + not_tracked` now equals the headcount. On 27 Oct the tiles summed to 119 against a headcount of 99. If the screen labels `present` as "Present", consider "On time", or show "Present = on time + late".

Rates (Control Panel):
- `attendance_rate` = (on time + late) ÷ the people expected today. Before, the late were counted twice: 72.2 % shown against 50 % real.
- `punctuality_rate` = on time ÷ (on time + late).

## 2. Absenteeism and the two charts are real now

Absences are not stored as attendance rows. Every rate below used to divide by rows that exist, so absenteeism always read 0 % and every weekday 100 %. They are now worked out from the days each person was expected at work: their working calendar, minus company holidays and approved leave, for attendance-tracked staff only.

| key | window |
|---|---|
| `absenteeism_rate_30d` | absent days ÷ expected days, last 30 days |
| `by_day_of_week_90d[].value` | present ÷ expected per weekday, last 90 days |
| `by_department_7d[].value` | present ÷ expected per department, last 7 days |

Windows end **yesterday**: today is not over, and a morning before the first punch would read as absent.

**Expect the numbers to change sharply.** On the development copy, device sync has been paused since September, so most expected days there are absent: about 84 % over 90 days. On production these become real figures for the first time. The risk tile reads `absenteeism_rate_30d`, so its absenteeism points can now trigger.

## 3. Reports: a range across two months

`POST /api/hr/reports/generate` with `payroll_monthly` and no `month` now uses the month holding **most** of the range (the later one on a tie). Before, it used `date_from`'s month, so the screen's "this month", sent as 30 Sep → 30 Oct, showed September's salaries.

**Please change** `getCurrentMonthRange` in `src/features/reports/utils/dateRange.ts` (lines 3-7):
1. It builds the first and last day at local midnight, then formats them with `toISOString().slice(0, 10)`. That converts to UTC, which for a Baghdad browser (UTC+3) is always the **previous** day. So October goes out as 30 Sep → 30 Oct, at any hour. Build the strings from `todayInBaghdad()`, or with plain year/month string arithmetic.
2. Send `month: "YYYY-MM"` explicitly for monthly reports.
