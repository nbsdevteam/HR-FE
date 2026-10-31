# HR round 2, batch 3: attendance and payroll money

**For:** the HR-FE team and the owner of the device bridge (`device-sync/`). **Backend:** `lugal_hr` on Lugal-ai `development`, 31 Oct 2026. Restart only; no module upgrade. Existing attendance rows keep their stored values (the owner's choice); only new rows and new payroll runs change.

## HR-FE

### Payroll generate refuses a month that has not ended

`POST /api/hr/payroll/payslips/generate` and `POST /api/hr/payroll/compute` now refuse a month that is still running in Baghdad:

```json
{"success": false, "error_code": "month_not_over",
 "error": "This month has not ended yet; its payslips can be generated from 2026-11-01.",
 "month_end": "2026-10-31"}
```

Show `error`, or a translated message keyed on `error_code`. Past months work as before.

### Salary table (`/api/hr/payroll/list` and detail): new keys, nothing removed

| key | meaning |
|---|---|
| `not_yet_due_days` | working days of the month after today. They are neither worked nor absent. |
| `missing_checkin_days` | days whose only punch came at or after the scheduled end. They have 0 hours, are for HR to review, and carry no shortfall and no overtime. |
| `missing_checkout_deduction` | the charge under **Settings → Missing check-out policy**. It is 0 under `none`, the current setting. |
| day row `status: "not_yet_due"` | one of the detail panel's day rows; render it like a rest day |

Two existing numbers change meaning:
- `shortfall_hours` no longer includes missing check-out or missing check-in days. Those are priced by the policy only.
- `overtime_hours` and `overtime_payment` now count only complete days, at most **4 hours a day**. The cap comes from the new setting `attendance.overtime_daily_cap_hours`. It does not appear in the Settings list yet: add it as a number field if HR should be able to change it from the screen. Until a row exists, the backend uses 4.

### Attendance upload (`/api/hr/attendance/import`)

`date` + `check_in_time` / `check_out_time` are now read as **Baghdad** wall-clock times, which is what the upload screen sends. Until now they were stored as if they were UTC: a 08:00 upload became 11:00 Baghdad and was marked late. Nothing changes on the FE side.

**Known, not changed in this batch:** a row sent with a date but no check-out time gets a check-out of midnight UTC that day. That is earlier than any check-in, so the row is refused, and it now appears in `failed_rows`. The device bridge's absence rows rely on that midnight value, so it was left alone. It needs its own decision.

### Attendance rows

A lone punch at or after the scheduled end of the day, for example 17:30 with no check-in, now closes as **Missing check-in** with 0 hours. It used to be given 9 hours and overtime. A check-out that the system stamps earns no overtime, and that flag is cleared when a real punch replaces it.

## Device bridge (`device-sync/`)

Nothing breaks. The bridge sends full datetimes such as `check_out: "2026-10-27 14:00:00"` with no offset, as UTC. They are still read as UTC.

Recommended later change: send an explicit offset, for example `2026-10-27T17:00:00+03:00`, or `Z` for UTC. Any value with an offset is now converted correctly; before this change the offset was cut off. Once the bridge sends offsets, the "no offset means UTC" rule can be retired.
