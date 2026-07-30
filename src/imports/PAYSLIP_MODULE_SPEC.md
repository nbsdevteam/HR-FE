# Payslip Module — Structure and Behaviour (Spec for Reuse)

This document describes the **payslip structure**, **Excel/CSV handling**, **attendance processing**, and **salary calculation** so the same logic can be recreated as a module in another system.

---

## 1. Overview

- **Input:** Excel/CSV with attendance rows (Person ID, Name, Time, Attendance Status).
- **Processing:** Raw rows → pair check-in/check-out per employee per day → compute working hours, overtime, late, absence, shortfall.
- **Pay model:** Target hours per day (default 9h). Below target = shortfall (deduction). Above = overtime (paid). True absences = absence deduction. Late/grace is **legacy only** (not used in net pay).
- **Output:** Per-employee, per-month salary breakdown (base, overtime, shortfall deduction, absence deduction, loan, tip, penalty, net).

---

## 2. Excel/CSV Upload and Parsing

### 2.1 Required Columns

| Column name (any of)        | Purpose                          |
|-----------------------------|----------------------------------|
| Person ID / PersonID / ID   | Employee identifier (matches system) |
| Name / Employee Name         | Employee name                    |
| Time / DateTime / Timestamp | Single date+time of the punch    |
| Attendance Status / Status  | `Check-in`, `Check-out`, or `None` |

Optional: **Department**, **Attendance Check Point**, **Location**.

### 2.2 Time Format (Time column)

The **Time** column must contain **date and time in one string** (e.g. with a space). Supported patterns:

- `YYYY-MM-DD HH:MM:SS` or `YYYY-MM-DD HH:MM`
- `DD-MM-YY` or `DD-MM-YYYY` with time (e.g. `20-11-25 08:30:00` → 20 Nov 2025)
- `M/D/YYYY H:MM` or `MM/DD/YYYY HH:MM` (US style)
- `D/M/YYYY` (day first) — parser uses heuristics (e.g. if first number > 12, treat as day)

Parsing rules:

- Split on first space: `datePart` and `timePart`.
- Normalize date to `YYYY-MM-DD`; time stays as `HH:MM` or `HH:MM:SS`.
- 2-digit year: `< 50` → 20xx, else 19xx.
- Invalid or future-year dates can be rejected (configurable).

### 2.3 Raw Record (per row)

After parsing one row we have:

```ts
interface RawAttendanceRecord {
  personId: string;      // From Person ID column
  name: string;         // From Name column
  department?: string;  // Optional
  time: string;         // Full string e.g. "2025-10-02 08:13:38"
  attendanceStatus: 'Check-in' | 'Check-out';  // or "None" → treated as absence
}
```

- Rows with status **"None"** (or empty) are not stored as punch rows; they are used to create **absence** entries for that employee+date.
- Rows with **Check-in** or **Check-out** are kept and later grouped by `personId` and **date** (date part of `time`).

### 2.4 Matching Employees

- Each distinct `personId` in the file must match an **Employee** in the system (by `personId`).
- If an employee in the CSV does not exist, the system can **auto-create** them (optional) with default salary, schedule, and currency from global settings.

---

## 3. From Raw Rows to Processed Records (Per Day, Per Employee)

### 3.1 Grouping

- Group all raw records by `(personId, date)` where `date = YYYY-MM-DD` from the parsed `time`.
- For each group, separate rows into:
  - `checkIns`: `attendanceStatus === 'Check-in'`
  - `checkOuts`: `attendanceStatus === 'Check-out'`

### 3.2 Check-in / Check-out Pairing Rules

- **Normal:** First check-in + last check-out → one pair for the day.
- **Two check-outs, no check-in:** Treat earliest as check-in, latest as check-out.
- **Two check-ins, no check-out:** Treat earliest as check-in, latest as check-out.
- **One check-out only, no check-in:** Leave check-in empty → record status `missing_checkin` (check-out only).
- **One check-in only, no check-out:** If check-in time ≥ 12:00, treat as check-out only (missing check-in); else treat as missing check-out.

### 3.3 Scheduled Working Days

- Each employee has a **weekly schedule** (e.g. Mon–Fri 07:00–16:00).
- For the **month** we compute the list of **scheduled working dates** (dates that are working days for that employee).
- Any **scheduled date** with **no punches** (and not already filled by pairing) → create an **absent** record for that date.

### 3.4 Processed Record (per employee per day)

```ts
interface ProcessedAttendanceRecord {
  id: string;
  employeeId: string;
  date: string;                    // "YYYY-MM-DD"
  dayOfWeek: string;               // "monday"
  checkInTime?: string;            // "08:13:38"
  checkOutTime?: string;           // "17:30:45"
  workingHours: number;            // from check-in to check-out
  overtimeHours: number;           // minutes after scheduled end time
  isLate: boolean;
  lateMinutes: number;             // minutes after (expected start + shift grace)
  graceMinutesUsed?: number;       // (legacy) minutes covered by monthly grace
  chargeableLateMinutes?: number;  // (legacy) late minus grace
  isEarly: boolean;
  status: 'complete' | 'missing_checkout' | 'missing_checkin' | 'incomplete' | 'absent' | 'absent_due_to_late_threshold';
  autoCheckoutApplied?: boolean;  // true if checkout was filled by system
  autoCheckinApplied?: boolean;
  absenceReason?: 'no_punches' | 'late_threshold' | 'checkout_without_checkin';
  excusedAbsence?: boolean;        // if true, do not count in absence deduction
  excusedLate?: boolean;           // if true, do not count late (legacy)
  excusedShortfall?: boolean;      // if true, do not count this day in shortfall
  formattedCheckIn?: string;       // "08:13 AM"
  formattedCheckOut?: string;     // "05:30 PM"
  expectedStartTime?: string;     // from schedule
  expectedEndTime?: string;
  isScheduledWorkingDay: boolean;
}
```

### 3.5 Working Hours and Overtime

- **Working hours** = (checkOut − checkIn) in hours (handle next-day checkout if needed).
- **Overtime** = only the part **after** scheduled end time (e.g. end 16:00, checkout 18:00 → 2h overtime). Only on scheduled working days.

### 3.6 Late and Late-to-Absent (Legacy)

- **Expected start** and **shift grace** (e.g. 10 min) come from settings.
- If check-in > expected start + grace → **late**; `lateMinutes` = difference.
- If **late minutes** ≥ **late-to-absent threshold** (e.g. 3 hours) → treat day as **absent** (`absent_due_to_late_threshold`), not late. These are **not** used in current net pay (old grace model disabled).

### 3.7 Absence

- **No punches** on a scheduled day → `status: 'absent'`, `absenceReason: 'no_punches'`.
- **Late ≥ threshold** → `status: 'absent_due_to_late_threshold'`, `absenceReason: 'late_threshold'`.
- **Check-out without check-in** can be stored as `missing_checkin` or mapped to absence depending on policy.

---

## 4. Salary Calculation (9-Hour Model)

### 4.1 Inputs

- **Employee:** id, salary slots (e.g. salaryA: amount + currency + overtimeRate), overtimeEnabled, weekly schedule.
- **Processed records** for the month (for that employee).
- **Monthly ledger** for that employee+month: absence days list, loan/tip/penalty per currency.
- **Settings:** targetWorkingHoursPerDay (default 9), dailyAbsenceBasis (30_days | calendar_workdays | fixed_days_per_month), fixedDaysPerMonth (if used).

### 4.2 Aggregates (Month)

- **Total hours** = sum of `workingHours` over all records.
- **Overtime hours** = sum of `overtimeHours`.
- **Scheduled working days** = count of records where `isScheduledWorkingDay === true`.
- **Days worked** = count of records that have check-in and are not an unexcused absence (excused absences count as “worked” for this count).
- **Absence days (for deduction)** = dates in ledger.absenceDays **excluding** records where `excusedAbsence === true`.
- **Shortfall hours** = sum over scheduled, non-absence, non-excused-shortfall days of  
  `max(0, targetWorkingHoursPerDay - workingHours)`.

### 4.3 Per-Currency Calculation

For each salary slot (e.g. USD, IQD):

- **Base salary** = monthly amount for that currency.
- **Overtime payment** = overtimeHours × overtimeRate (if overtimeEnabled).
- **Shortfall deduction** = shortfallHours × hourlyRate,  
  where **hourlyRate** = baseSalary / (absenceDivisor × targetWorkingHoursPerDay).  
  **absenceDivisor** = 30, or calendar workdays in month, or fixedDaysPerMonth (from settings).
- **Absence deduction** = (baseSalary / absenceDivisor) × number of (non-excused) absence days.
- **Loan, tip, penalty** = from monthly ledger for that currency.
- **Total with overtime** = baseSalary + overtimePayment.
- **Total deductions** = shortfallDeduction + absenceDeduction + penalty + loan (tip is added, not deducted).
- **Net salary** = totalWithOvertime − totalDeductions + tip.

Late/grace deductions are **not** applied (set to 0 in current model).

### 4.4 SalaryCalculation Type (Summary)

```ts
interface SalaryCalculationPerCurrency {
  currency: string;
  baseSalary: number;
  overtimePayment: number;
  lateDeduction: number;        // 0 in current model
  shortfallDeduction: number;
  absenceDeduction: number;
  loan: number;
  tip: number;
  penalty: number;
  adjustments: number;          // tip - loan - penalty
  netSalary: number;
  totalWithOvertime: number;
  totalWithoutOvertime: number;
}

interface SalaryCalculation {
  employeeId: string;
  monthYear: string;            // "2025-10"
  salaryByCurrency: Record<string, SalaryCalculationPerCurrency>;
  daysWorked: number;
  scheduledWorkingDays: number;
  absenceDays: string[];        // dates
  totalHours: number;
  overtimeHours: number;
  lateDays: number;
  earlyDays: number;
  shortfallHours: number;
  calculatedAt: string;
}
```

---

## 5. Payslip UI Structure (What to Recreate)

### 5.1 Month Selection

- Dropdown or selector for **month/year** (e.g. 2025-10).
- Only show months that have attendance data (or allow any month and show 0 if none).

### 5.2 Summary Chips (Top Row)

| Chip           | Source                          | Description                    |
|----------------|----------------------------------|--------------------------------|
| Days Worked    | actualDaysWorked                 | Days with check-in / excused   |
| Hours Worked   | totalHoursWorked (month)         | Sum of workingHours            |
| Avg Hours/Day  | totalHoursWorked / actualDaysWorked | Average per worked day      |
| Overtime       | displayCalculation.overtimeHours | Total OT hours                 |
| Shortfall      | shortfallHours or under-hours count | Click opens shortfall list  |
| Absences       | absenceDaysList.length           | Click opens absence list       |

### 5.3 Shortfall (Under-Hours) Popover

- **Definition:** Scheduled working days where `workingHours < targetWorkingHoursPerDay`.
- **List columns:** Date, Check-in, Check-out, Worked hours, Shortage (target − worked).
- **Excuse:** Per row, “Excuse” sets `excusedShortfall = true` on that day’s record; excused rows are excluded from shortfall deduction and visually marked (e.g. green background, “Excused” badge).

### 5.4 Absences Popover

- **List:** One row per absence date; show date and reason (no_punches, late_threshold, checkout_without_checkin).
- **Excuse:** Click row to toggle `excusedAbsence`; excused absences are excluded from absence deduction and shown with “Excused” badge.

### 5.5 Salary Breakdown (Per Currency)

- Base Salary  
- + Overtime (Xh Ym)  
- = Total with Overtime  
- Deductions:  
  - Shortfall (Xh): −amount  
  - Absence (N days): −amount  
  - Loan: −amount  
  - Penalty: −amount  
  - Tip: +amount  
- Net Salary

### 5.6 Monthly Adjustments (Ledger)

- **Loan, tip, penalty** per currency, stored in **MonthlyEmployeeLedger** for (employeeId, monthYear). Editable in UI and used in the same formula above.

### 5.7 Calendar View (Optional)

- Grid of days; for each day show: check-in, check-out, hours, and if applicable shortfall or OT.
- **Excuse absence** button on absent days; **Excuse shortfall** on shortfall days (same flags as in popovers).

---

## 6. Key Settings (Global)

| Setting                     | Default | Purpose                                      |
|----------------------------|--------|----------------------------------------------|
| targetWorkingHoursPerDay   | 9      | Target hours per day; below = shortfall      |
| dailyAbsenceBasis          | 30_days | Divisor for absence deduction (30 or workdays) |
| fixedDaysPerMonth          | —      | Used if dailyAbsenceBasis is fixed           |
| shiftGraceMinutes          | 10     | (Legacy) grace at start                       |
| monthlyLateGraceMinutes    | 60     | (Legacy) monthly grace pool                   |
| lateToAbsentHours          | 3      | (Legacy) late above this → absent            |

---

## 7. Data Flow Summary

```
Excel/CSV
  → Parse rows (Person ID, Name, Time, Attendance Status)
  → RawAttendanceRecord[] (time string, Check-in/Check-out/None)
  → Group by (personId, date); pair check-in/check-out; create absences for no-punch days
  → ProcessedAttendanceRecord[] (per employee per day)
  → For payslip month: filter records by monthYear
  → calculateSalaryAdvanced(employee, records, monthYear, ledger)
  → SalaryCalculation (salaryByCurrency, shortfallHours, absenceDays, etc.)
  → UI: chips, shortfall list, absence list, per-currency breakdown, net salary
```

---

## 8. Files Reference (Current Codebase)

| Area              | File(s) |
|-------------------|--------|
| CSV/Excel parse   | `src/lib/csvParser.ts` |
| Date/time parse   | `src/lib/dateTimeUtils.ts` (parseDateTime) |
| Raw → processed   | `src/lib/advancedAttendanceCalculations.ts` (processAttendanceRecordsAdvanced, processDayRecord) |
| Salary calculation| `src/lib/advancedAttendanceCalculations.ts` (calculateSalaryAdvanced) |
| Types             | `src/types/attendance.ts` (RawAttendanceRecord, ProcessedAttendanceRecord, SalaryCalculation, etc.) |
| Payslip UI        | `src/components/PayslipCalculation.tsx` |
| Ledger (loan/tip/penalty) | Stored per employee per month; used in calculateSalaryAdvanced. |

---

## 9. Copy-Paste Checklist for Another System

- [ ] **Upload:** Parse CSV/Excel with columns Person ID, Name, Time, Attendance Status; support same time formats.
- [ ] **Grouping:** By (personId, date); pair first check-in with last check-out; apply same edge cases (two check-outs, two check-ins, only check-out, only afternoon check-in).
- [ ] **Schedule:** Define working days per employee; mark no-punch scheduled days as absent.
- [ ] **Processed record:** Compute workingHours, overtimeHours, status, and store excusedAbsence, excusedShortfall.
- [ ] **Salary:** Implement 9h model: shortfall hours × hourly rate, absence days × daily rate, overtime × rate; add loan/penalty/tip from ledger.
- [ ] **Payslip UI:** Month selector, chips (days worked, hours, avg, overtime, shortfall, absences), shortfall table with excuse, absence list with excuse, per-currency breakdown, net.

This spec reflects the **current** behaviour (9h target, shortfall/absence/overtime, excuse flags, no active late/grace in net pay).
