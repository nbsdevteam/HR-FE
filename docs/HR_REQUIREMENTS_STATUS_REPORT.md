# HR Module Requirements — Status Report

**Date:** 2026-08-10 (updated after Slice F backend + FE API wiring)  
**Scope:** Lugal HR (`lugal_hr` v1.12.0) + HR-FE (Odoo mode)  
**Excluded from this sprint (owned by Suraj Patidar):** Recruitment portal public URL (#16), AI resume parse/eval (#17–18), auto IR (#19), full screening AI pipeline (#20).

---

## Summary scorecard (non-recruitment focus)

| Status | Items |
|--------|--------|
| **Done** | 1*, 2*, 3*, 4, 5, 6, 7, 8*, 9*, 10, 11, 12, 13*, 14* |
| **Deferred (Suraj)** | 16, 17, 18, 19, 20 |
| **Still Phase 2 / infra** | Mobile biometric/GPS (#1 future), SMS/Push (#13), dedicated mobile ESS app |

\* Core backend complete; FE polish / device sidecar cutover / SMS may remain.

---

## What was completed in this sprint (excl. recruitment)

### 1. Fingerprint sync — **DONE (backend)**
- Device events auto-process into `hr.attendance` (check-in / check-out pairs)
- Cron every 5 minutes + `/api/hr/devices/sync` + `/api/hr/devices/events/process`
- Event create supports `auto_process=true` (default)
- Smoke-tested: punch in/out for device employee no.

### 2. ESS — **DONE (issue reporting)**
- New `lugal.hr.issue` + `/api/hr/issues/*`
- Employee submit → manager inbox notification
- Resolve flow + FE `useIssues` / `odooData` helpers
- Mobile ESS app still Phase 2

### 3. Notifications & Inbox — **DONE (backend)**
- `attachment_ids` on notifications + serialize
- Leave approve/reject, payroll allowance/deduction/ledger, document expiry → inbox
- Birthday / contract expiry crons → inbox

### 9. Multi-currency — **DONE (backend)**
- Currencies list IQD/USD/EUR/GBP/AED/SAR
- Secondary salary fields on employee
- FX rate model + `/api/hr/currency_rates/*` + convert

### 13. Value-adds — **PARTIAL → mostly DONE (backend)**
- Birthday + contract expiry reminders (inbox)
- Document expiry → inbox (was email-only)
- Attendance trends API `/api/hr/attendance/trends`
- SMS/Push still pending (needs provider)

### 14. Multi-level leave approval — **DONE (backend)**
- Configurable workflows + unlimited steps
- Per-employee / assigned-employee / default workflow
- Seeded: Manager→HR and Dept Head→HR
- Leave create starts approval request; approve/reject APIs
- Legacy manager/hr approve routes prefer pending approval request

### FE wiring
- `odooData` + hooks for approvals, issues, devices process, currencies, trends
- Approval hooks now use Odoo when `isOdooBackend()`

---

## Still with Suraj (do not touch)

| # | Item |
|---|------|
| 16 | Public no-login recruitment portal |
| 17 | AI Resume Parsing |
| 18 | AI Resume Evaluation |
| 19 | Auto Initial Rating |
| 20 | Full AI screening workflow |

---

## New / updated API paths (Slice F)

| Method | Path |
|--------|------|
| POST | `/api/hr/devices/events/process` |
| POST | `/api/hr/devices/sync` (now processes events) |
| POST | `/api/hr/issues/list\|create` |
| POST | `/api/hr/issues/<id>/update\|resolve` |
| POST | `/api/hr/approvals/workflows/list\|create` |
| POST | `/api/hr/approvals/workflows/<id>/update` |
| POST | `/api/hr/approvals/requests/list` |
| POST | `/api/hr/approvals/requests/<id>/approve\|reject` |
| POST | `/api/hr/currencies/list` |
| POST | `/api/hr/currency_rates/list\|create\|convert` |
| POST | `/api/hr/attendance/trends` |

Module upgrade: `lugal_hr` **1.12.0** (dev DB upgraded 2026-08-10).
