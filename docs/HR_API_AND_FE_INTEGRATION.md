# Lugal HR — Backend APIs & Frontend Integration Status

**Backend module:** `lugal_hr` (Odoo 19) — version **1.8.0**  
**Frontend app:** `HR-FE` (`nbsdevteam/HR-FE`, branch `main`)  
**API base:** `/api/hr/*` (JSON-RPC style `type='json'`, JWT via `lugal_auth`)  
**Auth mode:** `auth='none'` + Bearer JWT (same pattern as CRM)  
**FE dual-mode:** `VITE_DATA_BACKEND=odoo|supabase` — when `odoo`, pages use `odooData.ts` + hooks  

**Generated:** 2026-08-06  

---

## 1. How FE talks to Odoo

| Layer | Path | Role |
|---|---|---|
| HTTP client | `src/app/lib/api/client.ts` | JWT + `hrCall()` / JSON POST |
| Backend switch | `isOdooBackend()` | Chooses Odoo vs Supabase |
| API wrappers | `src/app/lib/api/odooData.ts` | One function per HR endpoint |
| Mappers | `src/app/lib/api/mappers.ts` | Odoo JSON → `Db*` shapes |
| Hooks | `src/app/lib/hooks.ts` | Pages load data via hooks that call `odooData` when Odoo mode |
| Pages | `src/app/pages/*.tsx` | UI features |

**Backend controllers live in:**  
`/home/capo7amzah/Documents/NBS-PROJECT/Lugal-ai/addons/lugal_hr/controllers/`

**Approx counts**
- Backend routes under `/api/hr/*`: **~163**
- FE wrappers in `odooData.ts` calling `/api/hr/*`: **~133**

---

## 2. Features done (summary)

| # | Feature area | Backend APIs | FE page / hooks | Status |
|---|---|---|---|---|
| 1 | Employees + departments + designations | Done | Employees, Hierarchy, Settings | **Done** |
| 2 | Dashboard KPIs (via employee/attendance/leave hooks) | `/api/hr/dashboard` exists | Dashboard (hooks) | **Done** (aggregated via hooks; dedicated dashboard API optional) |
| 3 | Attendance (list/upsert/excuse/import) | Done | Attendance | **Done** |
| 4 | Shifts + assignments | Done | Attendance / Employees flows | **Done** |
| 5 | Leave (types, policies, request, approve, permissions) | Done | Leave | **Done** |
| 6 | Payroll (monthly, ledger, payslips, allowances, deductions) | Done | Payroll | **Done** |
| 7 | Documents + document types | Done | Employees / Lifecycle | **Done** |
| 8 | Settings (configs, modules, holidays) | Done | Settings | **Done** |
| 9 | Lifecycle (contracts, exit, custodies) | Done (Slice A) | Lifecycle | **Done** |
| 10 | Warnings | Done (Slice A) | Warnings | **Done** |
| 11 | Notifications | Done (Slice A) | Dashboard / hooks | **Done** |
| 12 | Audit log | Done (Slice A) | AuditCenter | **Done** |
| 13 | Evaluations | Done (Slice B) | Evaluation | **Done** |
| 14 | Company policies | Done (Slice B) | Policies | **Done** |
| 15 | Training programs + participants | Done (Slice B) | Training | **Done** |
| 16 | Recruitment (jobs, applicants, resume upload) | Done (Slice C) | Recruitment | **Done** |
| 17 | Loans | Done (Slice C) | Payroll / hooks | **Done** |
| 18 | Reports (templates + history) | Done (Slice D) | Reports | **Done** |
| 19 | Devices list API | Done | `fetchDevices` in odooData/hooks | **Partial** — DeviceManagement UI still heavily device-direct; not full Odoo CRUD UI |
| 20 | Org chart API | `/api/hr/org/chart` | Hierarchy uses employees/depts hooks | **Partial** — hierarchy works via employee/dept data |
| 21 | Notes API | Done | Not a dedicated FE page | **Backend only** |
| 22 | CORS preflight + employee↔user link | Done | `linkEmployeesToUsers` | **Done** (cutover tooling) |
| 23 | CSV import / migration wizard | Odoo backend models/wizard | Not SPA primary path | **Backend / Odoo UI** |

---

## 3. Backend API catalog (by domain)

All methods are **POST** JSON unless noted. Auth: JWT Bearer.

### 3.1 Core org / employees

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/hr/dashboard` | Dashboard aggregate |
| POST | `/api/hr/org/chart` | Org chart |
| POST | `/api/hr/employees/list` | List employees |
| POST | `/api/hr/employees/me` | Current employee |
| POST | `/api/hr/employees/create` | Create employee |
| POST | `/api/hr/employees/<id>` | Get employee |
| POST | `/api/hr/employees/<id>/update` | Update employee |
| POST | `/api/hr/employees/<id>/set_status` | Set active/inactive/etc. |
| POST | `/api/hr/employees/link_users` | Link employees to res.users by email |
| POST | `/api/hr/departments/list` | List departments |
| POST | `/api/hr/departments/create` | Create department |
| POST | `/api/hr/departments/<id>/update` | Update department |
| POST | `/api/hr/departments/<id>/delete` | Delete department |
| POST | `/api/hr/designations/list` | List designations (hr.job) |
| POST | `/api/hr/designations/create` | Create designation |
| POST | `/api/hr/designations/<id>/update` | Update designation |
| POST | `/api/hr/designations/<id>/delete` | Delete designation |

**FE:** `Employees.tsx`, `Hierarchy.tsx`, `EmployeeDetailPanel.tsx`, hooks `useEmployees`, `useHierarchyData`, `usePositions`.

### 3.2 Attendance

| Path | Purpose |
|---|---|
| `/api/hr/attendance/list` | List attendance |
| `/api/hr/attendance/today` | Today snapshot |
| `/api/hr/attendance/history` | History |
| `/api/hr/attendance/team` | Team view |
| `/api/hr/attendance/upsert` | Create/update day record |
| `/api/hr/attendance/excuse` | Excuse / exception |
| `/api/hr/attendance/import` | Bulk import |
| `/api/hr/attendance/check_in` | Check-in |
| `/api/hr/attendance/check_out` | Check-out |
| `/api/hr/attendance/break_start` | Break start |
| `/api/hr/attendance/break_end` | Break end |

**FE:** `Attendance.tsx` + `useAttendanceRecords` → `fetchAttendance`, `excuseAttendance`, `upsertAttendance`, `importAttendance`.

### 3.3 Shifts

| Path | Purpose |
|---|---|
| `/api/hr/shifts/list` | List shifts |
| `/api/hr/shifts/create` | Create |
| `/api/hr/shifts/<id>/update` | Update |
| `/api/hr/shifts/<id>/delete` | Delete |
| `/api/hr/shift_assignments/list` | List assignments |
| `/api/hr/shift_assignments/create` | Assign shift |

**FE:** hooks + shift UI (`ShiftAssigner.tsx`).

### 3.4 Leave

| Path | Purpose |
|---|---|
| `/api/hr/leave/types` | Leave types |
| `/api/hr/leave/policies/list` | Policies list |
| `/api/hr/leave/policies/create` | Create policy |
| `/api/hr/leave/policies/<id>/update` | Update policy |
| `/api/hr/leave/policies/<id>/delete` | Delete policy |
| `/api/hr/leave/list` | Leave requests |
| `/api/hr/leave/my` | My leaves |
| `/api/hr/leave/pending` | Pending approvals |
| `/api/hr/leave/balances` | Balances |
| `/api/hr/leave/request` | Submit leave |
| `/api/hr/leave/<id>/manager_approve` | Manager approve |
| `/api/hr/leave/<id>/hr_approve` | HR approve |
| `/api/hr/leave/<id>/refuse` | Refuse |
| `/api/hr/leave/<id>/cancel` | Cancel |
| `/api/hr/leave/permissions/list` | Short permissions list |
| `/api/hr/leave/permissions/create` | Create permission |
| `/api/hr/leave/permissions/<id>/update` | Update permission |

**FE:** `Leave.tsx` — fully wired.

### 3.5 Payroll + loans

| Path | Purpose |
|---|---|
| `/api/hr/payroll/monthly_records/list` | Monthly records |
| `/api/hr/payroll/monthly_records/upsert` | Upsert monthly |
| `/api/hr/payroll/ledgers/list` | Ledgers |
| `/api/hr/payroll/ledgers/upsert` | Upsert ledger |
| `/api/hr/payroll/payslips/list` | Payslip list |
| `/api/hr/payroll/payslips/generate` | Generate payslips |
| `/api/hr/payroll/allowance_types/*` | Allowance type CRUD |
| `/api/hr/payroll/employee_allowances/*` | Employee allowance CRUD |
| `/api/hr/payroll/deduction_types/*` | Deduction type CRUD |
| `/api/hr/payroll/employee_deductions/*` | Employee deduction CRUD |
| `/api/hr/payroll/loans/list` | Loans list |
| `/api/hr/payroll/loans/create` | Create loan |
| `/api/hr/payroll/loans/<id>/update` | Update loan |
| `/api/hr/payroll/loans/<id>/delete` | Delete loan |

**FE:** `Payroll.tsx` + loan hooks — **Done**.

### 3.6 Documents

| Path | Purpose |
|---|---|
| `/api/hr/document_types/list` | Document types |
| `/api/hr/documents/list` | Documents |
| `/api/hr/documents/create` | Create |
| `/api/hr/documents/<id>/update` | Update |
| `/api/hr/documents/<id>/delete` | Delete |

**FE:** employee / lifecycle flows — **Done**.

### 3.7 Settings

| Path | Purpose |
|---|---|
| `/api/hr/configs/list` | Config list |
| `/api/hr/configs/update` | Update config |
| `/api/hr/modules/list` | Feature modules |
| `/api/hr/modules/update` | Enable/disable module |
| `/api/hr/holidays/list` | Public holidays |
| `/api/hr/holidays/create` | Create holiday |
| `/api/hr/holidays/<id>/delete` | Delete holiday |

**FE:** `Settings.tsx` — **Done**.

### 3.8 Slice A — Lifecycle / warnings / notifications / audit

| Path | Purpose |
|---|---|
| `/api/hr/contract_types/*` | Contract type CRUD |
| `/api/hr/contracts/*` | Employee contracts CRUD |
| `/api/hr/exit/list` | Exit processes |
| `/api/hr/exit/create` | Create exit |
| `/api/hr/exit/<id>/update` | Update exit |
| `/api/hr/exit/checklist_items/*` | Checklist item catalog |
| `/api/hr/exit/checklist/<line_id>/update` | Update checklist line |
| `/api/hr/custodies/*` | Custody CRUD |
| `/api/hr/warnings/*` | Warnings CRUD |
| `/api/hr/notifications/*` | Notifications + mark read/dismiss |
| `/api/hr/audit/list` | Audit log list |
| `/api/hr/audit/create` | Write audit entry |

**FE:** `Lifecycle.tsx`, `Warnings.tsx`, `AuditCenter.tsx`, notification hooks — **Done**.

### 3.9 Slice B — Evaluation / policies / training

| Path | Purpose |
|---|---|
| `/api/hr/evaluations/*` | Evaluations CRUD (+ criteria) |
| `/api/hr/policies/*` | Company policies CRUD |
| `/api/hr/training/programs/*` | Training programs CRUD |
| `/api/hr/training/participants/*` | Participants CRUD |

**FE:** `Evaluation.tsx`, `Policies.tsx`, `Training.tsx` — **Done**.

### 3.10 Slice C — Recruitment

| Path | Purpose |
|---|---|
| `/api/hr/jobs/list` | Job openings |
| `/api/hr/jobs/create` | Create opening |
| `/api/hr/jobs/<id>/update` | Update opening |
| `/api/hr/jobs/<id>/delete` | Delete opening |
| `/api/hr/applicants/list` | Applicants |
| `/api/hr/applicants/create` | Create applicant |
| `/api/hr/applicants/<id>/update` | Update (stage, rating, bookmark, notes) |
| `/api/hr/applicants/<id>/delete` | Delete |
| `/api/hr/applicants/<id>/upload_resume` | Resume upload |

**FE:** `Recruitment.tsx` — **Done** (includes hire → `createEmployee`).

### 3.11 Slice D — Reports

| Path | Purpose |
|---|---|
| `/api/hr/reports/templates/list` | Templates |
| `/api/hr/reports/templates/create` | Create template |
| `/api/hr/reports/templates/<id>/update` | Update |
| `/api/hr/reports/templates/<id>/delete` | Delete |
| `/api/hr/reports/history/list` | Run history |
| `/api/hr/reports/history/create` | Save history row |

**FE:** `Reports.tsx` — **Done**.

### 3.12 Devices / notes (backend-heavy)

| Path | Purpose | FE status |
|---|---|---|
| `/api/hr/devices/list` | List devices | Partial (`fetchDevices`) |
| `/api/hr/devices/create` | Create device | Backend |
| `/api/hr/devices/<id>/update` | Update | Backend |
| `/api/hr/devices/<id>/heartbeat` | Heartbeat | Backend |
| `/api/hr/devices/events/*` | Device events | Backend |
| `/api/hr/devices/sync` | Sync ack | Backend |
| `/api/hr/notes/*` | HR notes CRUD | Backend only (no dedicated page) |

---

## 4. FE page → integration map

| FE page | File | Odoo integration |
|---|---|---|
| Login | `src/app/pages/Login.tsx` | Odoo JWT (gated when Odoo mode) |
| Dashboard | `src/app/pages/Dashboard.tsx` | Via hooks (`useEmployees`, attendance, leave, evals, …) |
| Employees | `src/app/pages/Employees.tsx` | `odooData` create/update/status |
| Hierarchy | `src/app/pages/Hierarchy.tsx` | `useHierarchyData` / departments / positions |
| Attendance | `src/app/pages/Attendance.tsx` | Attendance + shifts |
| Leave | `src/app/pages/Leave.tsx` | Full leave workflow |
| Payroll | `src/app/pages/Payroll.tsx` | Monthly/ledger/payslip/allowance/deduction/loans |
| Lifecycle | `src/app/pages/Lifecycle.tsx` | Contracts / exit / custody |
| Warnings | `src/app/pages/Warnings.tsx` | Warnings CRUD |
| Evaluation | `src/app/pages/Evaluation.tsx` | Evaluations CRUD |
| Policies | `src/app/pages/Policies.tsx` | Policies CRUD |
| Training | `src/app/pages/Training.tsx` | Programs + participants |
| Recruitment | `src/app/pages/Recruitment.tsx` | Jobs + applicants + resume + hire |
| Reports | `src/app/pages/Reports.tsx` | Templates + history |
| Settings | `src/app/pages/Settings.tsx` | Configs / modules / holidays / org master data |
| Audit Center | `src/app/pages/AuditCenter.tsx` | Audit log |
| Device Management | `src/app/pages/DeviceManagement.tsx` | **Partial** — still device-oriented UI |
| Employee detail | `src/app/components/EmployeeDetailPanel.tsx` | `updateEmployee` |
| Shift assigner | `src/app/components/ShiftAssigner.tsx` | Shift APIs via hooks |

### Core FE integration files (your wiring)

- `/home/capo7amzah/Documents/NBS-PROJECT/HR-FE/src/app/lib/api/odooData.ts`
- `/home/capo7amzah/Documents/NBS-PROJECT/HR-FE/src/app/lib/api/mappers.ts`
- `/home/capo7amzah/Documents/NBS-PROJECT/HR-FE/src/app/lib/hooks.ts`
- `/home/capo7amzah/Documents/NBS-PROJECT/HR-FE/src/app/App.tsx`
- Slice A–D pages listed above + `vite.config.ts`

---

## 5. Feature completion checklist (what is done)

### Done end-to-end (API + FE Odoo mode)

- [x] Employee master data (list/create/update/status)
- [x] Departments & designations
- [x] Attendance list / excuse / upsert / import
- [x] Shifts & assignments
- [x] Leave types, policies, request, approvals, permissions, balances
- [x] Payroll monthly records, ledgers, payslip generate
- [x] Allowance / deduction catalogs + employee lines
- [x] Loans
- [x] Documents
- [x] Settings configs / module flags / holidays
- [x] Contracts & contract types
- [x] Exit process + checklist
- [x] Custodies
- [x] Warnings
- [x] Notifications (list/read/dismiss)
- [x] Audit log
- [x] Evaluations
- [x] Company policies
- [x] Training programs & participants
- [x] Recruitment jobs & applicants (+ resume upload, hire to employee)
- [x] Report templates & history
- [x] Dual-mode Odoo/Supabase switch + login gate for Odoo JWT
- [x] i18n kept alongside Odoo wiring (EN / AR / Sorani)

### Partial / remaining

- [ ] Device Management full SPA CRUD against `/api/hr/devices*` (list wrapper exists; UI still device-direct)
- [ ] Dedicated Notes UI for `/api/hr/notes*`
- [ ] Optional use of `/api/hr/dashboard` and `/api/hr/org/chart` instead of client-side aggregation
- [ ] Production deploy of `lugal_hr` module upgrade on live Odoo (separate from FE `main`)
- [ ] CSV cutover wizard remains primarily Odoo-backend tooling

---

## 6. Slices delivered (backend + FE)

| Slice | Scope | Status |
|---|---|---|
| Phase 1–3 core | Employees, attendance, leave, payroll, shifts, settings | **Done** |
| Slice A | Lifecycle, warnings, notifications, audit | **Done** |
| Slice B | Evaluations, policies, training | **Done** |
| Slice C | Recruitment + loans | **Done** |
| Slice D | Reports + payroll catalog writes + leave policy CRUD | **Done** |

---

## 7. Related commits (HR-FE `main`)

| Commit | Author | Summary |
|---|---|---|
| `93d4b30` | alhamza7 | Keep app open in Supabase mode; login gate only for Odoo |
| `62268f5` | alhamza7 | Merge `hrdev` → `main` (Odoo wiring + i18n) |
| `5878d3b` | alhamza7 | Wire Slice A–D pages to Odoo |
| `6a52329` | Niral | Wire P0 pages to Odoo reads/writes |
| `1c2d736` | Niral | Dual-mode Odoo adapter |

---

## 8. Quick reference — enable Odoo mode in FE

```bash
# .env / build
VITE_DATA_BACKEND=odoo
VITE_ODOO_URL=https://<your-odoo-host>
```

Login required in Odoo mode so JWT is available for `/api/hr/*`.

---

*This document is English-only per project API documentation standards.*
