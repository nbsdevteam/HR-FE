# DRY/KISS Remediation — Phases 1–6 Notes

This documents the codebase-wide DRY/KISS/reusability remediation carried out across 6 phases on branch `muntadher_hr-reafactor`. Each phase was scoped to only apply changes that are **provably zero-diff** (verified class-by-class, prop-by-prop against the shared component's actual source) — anything that would change visible behavior, styling, or drop an attribute was left as a documented exception instead of forced through.

Commits, in order: `9555676`, `d066edb`, `5f77438`, `1be6303`, `f9a27d3`, `a2d0488`.

## Summary by phase

**Phase 1 — shared-layer consolidation.** Merged `TableHeaderRow` into `SortableHeaderRow` (thin wrapper, same output). Added optional `pollMs` to `useAsyncList`. Documented (didn't force) why `useDeviceStatus`/`useLeaveEmployeeScope` don't fit `useAsyncList`'s contract, and why `StatCard`/`ColorStatTile`/`LabeledMetricRow` are three intentionally distinct components rather than one merged one.

**Phase 2 — modal chrome.** Migrated 5 modals (`PermissionModal`, `LeaveRequestModal`, `ApplyLinkModal`, `ExcuseModal`, `EmployeeTerminationDialog`) onto `ModalHeader`/`ModalOverlay`. 6 more modals were investigated and left hand-rolled — see "Known exceptions" below.

**Phase 3 — form fields.** Migrated raw `<input>`/`<select>` onto `InputField`/`SelectField` in 8 files, wherever the field's full prop usage fit the shared component's contract. Fields needing `min`/`max`/`readOnly`/`disabled`/`aria-label`, or any `<textarea>`, were left alone (unsupported by `InputField`). The 5 redundant label-wrapper components (`LabeledInput`, `DashedRecordField`, `LabeledTextField`+`FieldLabel`, `FormFieldLabel`) were investigated but **not** deleted — see below.

**Phase 4 — tables/badges/filters.** Migrated `StatusBadge` (2 files) and `SearchInput`/`SelectField` (4 filter bars). `DataTable`, `LoadingState`, `EmptyState`, `FilterChip`, and `TableHeaderRow`-for-`ReportResultsTable` were all investigated and rejected — see below.

**Phase 5 — file-size + dead code + typing.**
- Split all 4 files that were over the CLAUDE.md 300-line limit, extracting state/logic into hooks (matching the existing `usePayrollDetailPanel`/`useHierarchyPage` convention) and, for `Hierarchy.tsx`, extracting its 7 modal blocks into `HierarchyModals.tsx` (matching the existing `RecruitmentModals.tsx` pattern):
  - `EmployeeAttendanceDetail.tsx` 420→169 lines (+ `useEmployeeAttendanceDetail.ts`, `EmployeeAttendanceDetailHeader.tsx`)
  - `Attendance.tsx` 406→151 lines (+ `useAttendancePage.ts`)
  - `PositionsView.tsx` 348→133 lines (+ `usePositionsView.ts`)
  - `Hierarchy.tsx` 321→245 lines (+ `HierarchyModals.tsx`)
- Removed 5 dead hook calls in `ReportsWorkspace.tsx` (`useLoans`, `useAllowanceTypes`, `useEmployeeAllowances`, `useDeductionTypes`, `useEmployeeDeductions`) — confirmed via `useReportGeneration.ts` that none of that data was ever read, and the hooks have no side effects beyond local state, so this was a pure dead-fetch removal.
- Replaced `data: any` in all 5 dashboard section components with `DashboardSectionData`, a type inferred via `ReturnType<typeof useDashboardData>` — self-updating, can't drift from the hook.

`npm run size-check` now passes with **zero violations** (was 5 when the original audit ran).

**Phase 6 — TopBar dropdowns.** Extracted the identical animated panel chrome from `UserMenuDropdown`/`NotificationsDropdown`/`DeviceStatusDropdown` into `app/components/DropdownPanel.tsx`, parameterized by width. Each dropdown's trigger button (genuinely different per dropdown) was left untouched.

## Known exceptions — deliberately left as-is

These were investigated and found **not** safely migratable without changing visible behavior or dropping functionality. Re-flagging any of these in a future audit as "unmigrated duplication" would be a false positive — the reason is structural, not oversight.

| Item | Why it's an exception |
|---|---|
| `PayrollDetailPanel.tsx` | Has `role="dialog" aria-modal="true" aria-label=...`; `ModalOverlay`'s content div doesn't forward extra attributes — migrating would drop accessibility |
| `PolicyModals.tsx` | Footer buttons rely on native `<form onSubmit>` + Enter-to-submit; `ModalFooterActions`'s buttons have no explicit `type` attribute, so its Cancel button would default to `type="submit"` and incorrectly submit the form |
| `JobFormModal.tsx` footer | `ModalFooterActions` prefixes `px-5 py-2 ... flex items-center gap-2` onto custom classes rather than replacing them — would break a `flex-1 h-11` equal-width button layout |
| `ApplicantFormModal.tsx` header, `PopoverHeader.tsx` (payroll) | `ModalHeader`'s icon-badge variant hardcodes gap size, badge size, title tag/font-size, and close-button size/color with no override props |
| `WarningFormModal.tsx` footer | Buttons are `motion.button` with `whileHover`/`whileTap`; `ModalFooterActions` renders plain `<button>`, which would drop that interaction |
| `LabeledInput`, `DashedRecordField`, `LabeledTextField`+`FieldLabel`, `FormFieldLabel` (5 components, ~15 call sites) | Each has its own hardcoded label margin/font-size combination that doesn't match `InputField`'s hardcoded label classes, and `InputField` has no label-className override prop. `LabeledTextField` additionally supports an icon-prefixed label + inline error message that `InputField` doesn't support at all |
| `DeviceStatusBadge.tsx` | Genuinely a different shape (rounded-full pill + status dot) from `StatusBadge` (rounded-md bordered badge), not an accidental duplicate |
| `DataTable` for `EmployeesListView`/`EvaluationListView`/`LeaveRequestsListView`/`ReportResultsTable` | `DataTable`'s empty state **drops the header and card wrapper entirely**; these views currently keep the header visible with an empty body (or, for `EmployeesListView`, show nothing at all). Migrating would change what users see when a list is empty |
| `LoadingState`/`EmptyState` for audit/notifications/applicants/reports blocks | Both hardcode a boxed icon at a small fixed size and a **required** message string; the callers use bare large icons or no message at all |
| `FilterChip` for policies' category/status chips | No className override exists; hardcoded colors don't match |
| `TableHeaderRow` for `ReportResultsTable`'s header | Padding/opacity/font-weight differ and aren't overridable |

If any of these are worth unblocking later, the fix is almost always the same shape: add an optional override prop to the shared component (e.g. a `labelClassName` on `InputField`, `aria-*` passthrough on `ModalOverlay`, explicit `type="button"` on `ModalFooterActions`'s cancel button). That's a deliberate, separate decision since it touches widely-used shared components — flagged here rather than done inline.

## Uncommitted, unrelated changes noticed in the working tree

At several points during this work, two files showed up modified in `git status` that were never touched by this remediation effort:

- `src/features/attendance/components/DeviceSelectOption.tsx`
- `src/features/dashboard/components/DashboardAttendanceChart.tsx`

These appear to be from work done outside this session (two commits — `e1ea2fc` "small UI and behaviour changes in the recruitment feature" and `e788baf` "consolidate LabeledSelect, SelectField, DashedRecordSelectField... into one shared Select component" — landed on the branch mid-session that this session didn't make). Every commit in this remediation staged its files explicitly by name rather than via `git add -A`, specifically to avoid ever bundling these in. They're still sitting uncommitted as of the last commit in this effort (`a2d0488`) — worth reviewing and committing (or discarding) intentionally rather than leaving them in limbo.

Worth noting: the second of those two external commits (consolidating `LabeledSelect`/`SelectField`/`DashedRecordSelectField` into one shared `Select` component) appears to have picked up the exact "redundant label-wrapper" thread this remediation's Phase 3 flagged but declined to force through — worth checking whether it resolved the `LabeledInput`/`DashedRecordField`/`LabeledTextField` exceptions listed above, since they may now be partially or fully addressed by that work.

## Suggested next steps

1. Review/commit the two unrelated files above.
2. Check whether the external `Select`-consolidation commit already covers some of the "Known exceptions" list — if so, this doc's exception table should be trimmed accordingly.
3. If any shared-component API extensions (label className override, aria passthrough, explicit button `type`) are wanted to unlock the remaining exceptions, that's a good candidate for a focused follow-up phase — each is small and additive, but touches widely-used components so is worth doing deliberately rather than inline.
