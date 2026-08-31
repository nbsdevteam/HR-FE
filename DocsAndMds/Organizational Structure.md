# Organizational Structure — Manager-Hierarchy Rework (FE Requirements)

**Frontend repo:** `HR-FE`, feature area `src/features/departments/`
**Backend:** one fix implemented (self/cycle validation on manager reassignment, `employee_controller.py:employee_update`) — see §7a. Every read/write otherwise already exists.
**Status:** FE part is specification only, not implemented — see note at the end. Backend part is implemented.
**Date:** 2026-08-30

---

## The problem in one paragraph

The Hierarchy page's tree currently prefers **Positions** (`hr.job.lugal_reports_to_job_id`) over the **employee's actual manager** (`hr.employee.parent_id`/`manager_id`) whenever any positions exist — `useHierarchyTreeData.ts:47-55` calls `buildOrgTreeFromPositions` first . and only falls back to the manager-based `buildOrgTree` when there are no positions at all. This contradicts the required behavior: **the org chart must always be Employee → Direct Manager → Manager's Manager → Top Management**, with department and job title as card metadata only, never as tree structure. This document specifies the fix and the surrounding UI requirements it was requested alongside (cards, detail panel, filters, a dedicated change-manager flow, and permission gating) — all built on data and endpoints that already exist.

---

## 1. Make `manager_id` the only tree source

**File:** `src/features/departments/hooks/useHierarchyTreeData.ts`

Current:

```ts
const { tree: orgTree, deptColors } = useMemo(() => {
  if (dbPositions.length > 0) {
    return buildOrgTreeFromPositions(dbPositions, dbEmployees, dbDepartments);
  }
  if (dbEmployees.length === 0) {
    return { tree: EMPTY_ORG_TREE, deptColors: defaultDeptColorMap };
  }
  return buildOrgTree(dbEmployees, dbDepartments);
}, [dbEmployees, dbDepartments, dbPositions]);
```

Required:

```ts
const { tree: orgTree, deptColors } = useMemo(() => {
  if (dbEmployees.length === 0) {
    return { tree: EMPTY_ORG_TREE, deptColors: defaultDeptColorMap };
  }
  return buildOrgTree(dbEmployees, dbDepartments);
}, [dbEmployees, dbDepartments]);
```

`buildOrgTree` (`utils/hierarchyTree.ts:16-88`) already builds a pure manager-chain tree from `employee.manager_id` — nothing new to write for the tree algorithm itself, just stop calling the positions-based builder for the main tree.

Once this lands, `buildOrgTreeFromPositions` (`hierarchyTree.ts:90-173`) becomes dead code (verified via repo-wide grep — nothing else calls it; the Positions & Appointments tab uses its own separate `buildPositionTree`, unaffected by this change) and should be deleted.

**`HierarchyTreeSection.tsx`** has a banner that currently branches on `dbPositions.length > 0` to explain which source built the tree (lines ~78-91). Since the source is now always manager_id, simplify it to always show the "built from each employee's Direct Manager field" message and drop the `dbPositions` prop (no longer used in this component — `PositionsView` still receives it separately, unaffected).

---

## 2. Employee card — show direct-report count

**File:** `src/features/departments/components/OrgCard.tsx`

The card currently shows `countDescendants(node)` (every descendant, not just direct reports) next to a `Users` icon (line ~120-124). Change this to `node.children.length` (direct reports only) to match the requirement. `countDescendants` stays in use elsewhere (the Detail Panel's "Total team" row) — just stop using it for this specific card badge.

Everything else the spec asks for on the card already exists: name, job title (`node.position`), department (`node.department`), avatar/photo (`node.photo`/initials fallback) — no other card change needed.

---

## 3. Employee details panel

**File:** `src/features/departments/components/DetailPanel.tsx`

Already shows everything required — name, department, job title, direct manager (`InfoRow` "Direct Manager" pointing at `findParentOf(orgTree, node.id)`), direct reports count, total team size, and a scrollable list of direct reports (`DirectReportRow`). No changes needed here except the new "Change Manager" action described in §5.

---

## 4. Search & filters

**File:** `src/features/departments/hooks/useHierarchyView.ts` (state), new `src/features/departments/components/HierarchyFilterBar.tsx` (UI), rendered from `HierarchyTreeSection.tsx`.

Employee name search already exists (`searchQuery`/`searchResults`/`searchMatchIds`/`highlightedIds`, matches name/position/department, dims non-matches, auto-expands and scrolls to the first hit). Add three filters using the same dim/highlight mechanism so the UX stays consistent with search rather than introducing a second visual language:

- **Department filter** — options from `departments` (already computed in `useHierarchyTreeData.ts`).
- **Job Title filter** — options: unique `node.position` values across `allNodes`.
- **Manager filter** — options: every node with `children.length > 0` (i.e., every node that currently _is_ someone's manager), `{value: node.dbId, label: node.name}`.

New state in `useHierarchyView.ts`: `departmentFilter`, `jobTitleFilter`, `managerFilter` (each a plain string, `""` = no filter), plus setters and a `clearFilters()`. Extend the existing `searchMatchIds`/`highlightedIds` memo so a node counts as a match only when it satisfies the text query (if any) **and** every active filter — computed via `findParentOf(orgTree, node.id)?.dbId === managerFilter` for the manager filter, direct field comparison for the other two. Broaden the "compute matches" condition from `searchQuery.trim()` to `searchQuery.trim() || hasActiveFilter` so filters alone (no text) still dim/highlight correctly.

UI: reuse the shared `Select` component (`@/shared/components`, already used elsewhere in this exact feature for department pickers) for all three dropdowns — no new dropdown primitive needed. Mirror `PositionsFilterBar.tsx`'s layout (already in this same folder) for visual consistency with the Positions tab's existing filter bar.

---

## 5. Change Manager — dedicated flow

**New file:** `src/features/departments/components/ChangeManagerModal.tsx`

A focused modal, separate from the general `EditEmployeeModal` (which edits name/position/department too) — matches the spec's explicit "select employee → view current manager → select new manager → confirm → show confirmation before saving" flow as its own action rather than folding it into the general edit form.

- **Current manager**: read-only, from `findParentOf(orgTree, node.id)`.
- **New manager picker**: the existing `TypeAhead` shared component, options = `allNodes` **filtered to exclude the employee itself and all of its own descendants** — this is the cycle/self-management prevention, and `EditEmployeeModal.tsx:50-58` already implements exactly this filter via `getDescendantIds(node)` (already exported from `utils/hierarchyTree.ts`). Reuse the identical filter, don't reimplement it.
- **Confirmation step**: picking a manager enables a "Continue" button; clicking it swaps the modal body to a summary ("Change `<employee>`'s manager from `<current>` to `<new>`?") with Confirm/Back actions — the explicit confirm-before-save step the spec asks for.
- **Write**: on confirm, call the **already-existing** `handleLinkEmployee(empDbId, managerDbId)` from `useHierarchyCrud.ts:84-94` — it already does exactly `odooData.updateEmployee(empDbId, {manager_id: managerDbId})` + toast + refetch. This is the same function `UnlinkedPanel` already uses to link an unlinked employee to a manager; changing an _existing_ manager is the identical write. **No backend or API change needed** — this satisfies the "use the existing employee update API" and "don't create a new hierarchy backend/API" requirements directly.

Wiring (mirrors the existing `editTarget`/`deleteTarget` pattern exactly, same files):

- `useHierarchyModals.ts`: add `changeManagerTarget` state + `handleDetailChangeManager`/`handleCloseChangeManagerModal`.
- `useHierarchyPage.ts`: expose the above, plus a `handleChangeManagerConfirm` wrapper that calls `handleLinkEmployee` then clears `changeManagerTarget`.
- `HierarchyModals.tsx`: render `ChangeManagerModal` when `changeManagerTarget` is set; pass `onChangeManager`/`canManage` down to `DetailPanelModal` → `DetailPanel`.
- `DetailPanel.tsx`: a third icon button next to Edit/Delete, opening the new modal.

---

## 6. Validation

- **Self-management** and **circular relationships**: excluded proactively in the FE picker by construction (the manager picker's option list already omits the employee itself and every one of its descendants, via the reused `getDescendantIds`-filtered list) — this is good UX (invalid choices are never selectable) but is **not sufficient on its own**, since any direct API call bypasses the FE entirely.
- **§7a — backend gap found and fixed.** `employee_controller.py:employee_update` wrote `parent_id` (`manager_id`) straight through with **zero server-side validation** — Odoo's stock `hr.employee.parent_id` carries no recursion constraint (unlike `hr.department`, which does), and nothing in this codebase's controller checked for self-assignment or a cycle before writing. This has been **fixed directly** (not just documented): `employee_update` now rejects `manager_id === employee_id` (`error_code: manager_self_assignment`) and walks the candidate manager's own `parent_id` chain to reject any assignment that would close a cycle back to the employee being edited (`error_code: manager_circular`), before the write happens. No FE change required for this — the FE picker's proactive filtering and this backend check are complementary, not duplicative: the FE prevents the obviously-invalid choice from ever being clickable, the backend is the actual enforcement boundary.
- **Invalid manager assignments**: the picker only ever offers real employee nodes (never the virtual "no single root" placeholder, filtered via `candidate.dbId !== "__root__"`).

---

## 7. Permissions — reuse what already exists, no new roles

**Correction from an earlier draft of this document:** the write endpoint (`POST /api/hr/employees/{id}/update`) is gated by `require_perm('hr.employees.edit')` — an **employee-editing** permission. An earlier version of this spec pointed the FE at `metadata.canManage` (from `/api/hr/departments/metadata`), which is a **department-management** permission (`hr.departments.create/edit/delete`) — a different leaf that does not reliably track `hr.employees.edit`. That was wrong; corrected below.

**Correct source of truth:** `permissions.hr.employees.edit` from `POST /api/crm/me/permissions` — already exists, already returns exactly this leaf (confirmed in this session's earlier RBAC audit of this same backend). There is currently no lighter-weight existing signal for this specific permission (no `/api/hr/employees/metadata` endpoint exists, unlike departments' `/metadata` route) — `/api/crm/me/permissions` is the one call that already carries it.

Note: this repo's client-side permission consumption (a `usePermissions()`/`hasPermission()` hook calling this same endpoint) was built and then reverted earlier in this session at your request — it is not currently present in `HR-FE`. If it is reintroduced, `hasPermission("hr.employees.edit")` is the correct check for everything below; if not, the same boolean would need to be read some other way (e.g. a one-off fetch scoped to this page) before this permission gating can actually be implemented.

- The new "Change Manager" button in `DetailPanel.tsx` should only render when `hr.employees.edit` is true for the current user.
- `EditEmployeeModal.tsx` currently lets **anyone** change the manager via its "Direct Supervisor" dropdown (line ~177-203) — a second, currently-unguarded path to the same write. Close it by gating that field the same way: read-only display of the current manager when unauthorized, and never include `manager_id` in the submitted `updates` object regardless of local state — both the UI and the submit logic must agree, not just the UI.
- Everything else on the page (viewing the tree, opening the detail panel, using search/filters) stays available to everyone, matching "Normal employees: View only... Cannot change reporting structure."
- The backend fix in §7a is the actual security boundary regardless of what the FE gates — even if the FE permission check is skipped or delayed, an unauthorized `manager_id` write is already rejected by `require_perm('hr.employees.edit')`, which was already correct and unchanged by this work.

No new permission key, no new role — `hr.employees.edit` already exists and already resolves per-user today.

---

## 8. Performance

No new network calls anywhere in this spec. The tree, cards, detail panel, filters, and the change-manager picker all read from data `useHierarchyData()`/`usePositions()` already fetch once per page load (`fetchEmployees`, `fetchDepartments`, cached via the existing `useAsyncList`/request-cache layer). Filtering and manager-lookup (`findParentOf`, descendant exclusion) are pure client-side tree walks over already-loaded `allNodes`/`orgTree` — no per-employee API calls, consistent with "avoid duplicate API requests."

---

## 9. Real data for testing

A real org sheet (employee name / department / job title / direct manager, ~130 rows across Admin, General Management, Marketing, Services, Sales, Finance, Warehouses, IT, HR, Supply Chain) was provided as validation data — useful for confirming the manager-chain tree renders correctly at realistic depth/breadth (up to 4 levels: e.g. General Manager → Department Manager → Supervisor → Employee) and that the filters behave correctly with real department/title cardinality. Not reproduced here; available from whoever provided it for QA.

---

## Files touched

### Backend (`Lugal-ai` repo) — implemented

| File                                                 | Change                                                                                                                                       |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `addons/lugal_hr/controllers/employee_controller.py` | `employee_update`: reject self-assigned or circular `manager_id` before writing (`error_code: manager_self_assignment` / `manager_circular`) |

### Frontend (`HR-FE` repo) — specification only, not implemented

| File                                         | Change                                                                                                      |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `hooks/useHierarchyTreeData.ts`              | Always `buildOrgTree`; drop the positions-preference branch                                                 |
| `utils/hierarchyTree.ts`                     | Delete now-dead `buildOrgTreeFromPositions`                                                                 |
| `components/HierarchyTreeSection.tsx`        | Simplify banner; drop unused `dbPositions` prop; render new filter bar                                      |
| `components/OrgCard.tsx`                     | Direct-report count instead of total descendants                                                            |
| `hooks/useHierarchyView.ts`                  | Add department/job-title/manager filter state, folded into existing match/highlight logic                   |
| **New:** `components/HierarchyFilterBar.tsx` | Three filter `Select`s + clear button                                                                       |
| **New:** `components/ChangeManagerModal.tsx` | Current manager → pick new → confirm, reusing `getDescendantIds` validation and `handleLinkEmployee` write  |
| `hooks/useHierarchyModals.ts`                | `changeManagerTarget` state + open/close handlers                                                           |
| `hooks/useHierarchyPage.ts`                  | Wire the above through; `handleChangeManagerConfirm` wrapper                                                |
| `components/HierarchyModals.tsx`             | Render `ChangeManagerModal`; thread the `hr.employees.edit` check to `DetailPanelModal`/`EditEmployeeModal` |
| `components/DetailPanelModal.tsx`            | Thread the permission check / `onChangeManager` to `DetailPanel`                                            |
| `components/DetailPanel.tsx`                 | New "Change Manager" button, gated by `hr.employees.edit`                                                   |
| `components/EditEmployeeModal.tsx`           | Manager field becomes read-only (and excluded from the save payload) when unauthorized                      |
| `pages/HierarchyChart.tsx`                   | Thread all new props from `useHierarchyPage()` down to the two sections above                               |

## Note on status

The FE part of this was drafted, fully implemented, verified against the existing codebase (exact file/line citations above), and then **reverted at your request** so nothing lands in `HR-FE` without your review — the sections above are an implementation-ready spec, not a summary of code sitting in the working tree. Nothing in `HR-FE` was changed by this.

The backend fix in §7a (`employee_controller.py`) **was** implemented and is currently sitting uncommitted in the `Lugal-ai` working tree — it was a genuine, previously-unflagged data-integrity gap (no self/cycle validation on manager reassignment) found while re-checking this spec's original "no backend changes needed" claim, which was correct about _reads_ but wrong about _write validation_.
