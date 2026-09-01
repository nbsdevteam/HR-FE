# Organizational Structure — FE Implementation

**Date:** 2026-09-01
**Status:** implemented on branch `new-work`
**Screen:** Hierarchy page → **Organizational Structure** tab (`viewMode: "structure"`)
**Backend contract:** `Lugal-ai/docs/ORGANIZATIONAL_STRUCTURE_FE_HANDOFF.md`

---

## 0. The rule that shapes this screen

> ### Grade is never displayed.

Not the code (`E`, `1`…`5`, `S`), not the name (*Executive*, *Manager*, *Officer*), not the band, not a colour derived from it.

This is enforced structurally rather than by discipline: **the backend sends no grade field**, so there is nothing to render. Seniority arrives only as `level`. Two tests lock it in — one asserts the mapped tree contains no grade token, the other pins the exact key set of a position.

If a grade field ever appears in the payload, do not map it.

---

## 1. API

### `POST /api/hr/org-structure/tree`

**One request renders the whole screen.** The structure is never reassembled from several endpoints.

Called via `fetchOrgStructureTree()` in `src/shared/api/orgStructure.ts`, which uses the shared `hrCall` client.

#### Request body

| Param | Type | Sent as | Meaning |
|---|---|---|---|
| `department_id` | int \| null | `null` | `null` = every department |
| `include_empty_departments` | bool | `true` | Keep departments with no positions |
| `include_positions_without_department` | bool | `true` | Populate the orphan bucket |

#### Response

`{ success: boolean, data: {...} }` at **HTTP 200 even on failure** — check `success`, never the status code. A permission denial arrives as `success: false` with `"permission required"` inside `error` and no `error_code`.

```json
{
  "departments": [
    {
      "department_id": 241,
      "department": "Human Resources",
      "department_ar": "",
      "parent_department_id": false,
      "parent_department": "",
      "sort_order": 0,
      "employee_count": 0,
      "position_count": 1,
      "level_count": 1,
      "positions": [
        {
          "position_id": 552,
          "title": "HR Manager",
          "title_ar": "",
          "level": 1,
          "seats": 1,
          "employee_count": 0,
          "vacancies": 1,
          "employees": []
        }
      ]
    }
  ],
  "positions_without_department": [ /* same position shape */ ],
  "totals": {
    "departments": 22,
    "positions": 47,
    "seats": 73,
    "employees_on_positions": 15,
    "employees_total": 93,
    "employees_without_department": 6
  }
}
```

A filled position, from live data:

```json
{
  "position_id": 4,
  "title": "Supervisor",
  "title_ar": "Supervisor",
  "level": 1,
  "seats": 3,
  "employee_count": 4,
  "vacancies": 0,
  "employees": [
    { "employee_id": 231, "name": "abdalmihamen", "employee_code": "", "job_title": "Supervisor" }
  ]
}
```

---

## 2. Department → Position → Employee

```
OrgStructureView                      fetches once, renders the grid
 └── OrgStructureDepartmentCard       root card — one department
      └── OrgStructureLevelGroup      one seniority band ("Level 1")
           └── OrgStructurePositionRow    one position + its seats/vacancy state
                └── OrgStructureEmployeeRow  one real person
 └── OrgStructureOrphanPositions      positions with no department
 └── OrgStructureSummaryHeader        the five population tiles
```

Rendered shape:

```
Human Resources                              1 position · 0 / 1
  LEVEL 1
    HR Manager                          0 / 1
      [Vacant]  1 vacant

Call Center                                  1 position · 4 / 3
  LEVEL 1
    Supervisor                          4 / 3
      • abdalmihamen
      • abdalrahman.arafat
      • abd mahdi abd
      • عباس فرج وذيح المحمداوي
```

---

## 3. Field mapping

Types live in `src/shared/hooks/orgStructure.ts`; mapping in `src/shared/api/mappers/orgStructure.ts`.

### Department → `OrgStructureDepartment`

| API field | FE field | Rendered as |
|---|---|---|
| `department_id` | `department_id` (string) | React key |
| `department` | `department` | Card title |
| `department_ar` | `department_ar` | Preferred title via `orgLabel()`; falls back to `department` when empty |
| `parent_department` | `parent_department` | Sub-line under the title |
| `sort_order` | `sort_order` | Not used for sorting — order is already applied |
| `employee_count` | `employee_count` | **Not** shown as a row total — see §6 |
| `position_count` | `position_count` | Header chip |
| `level_count` | `level_count` | Available; not currently shown |
| `positions` | `positions` | Grouped into level bands |

### Position → `OrgStructurePosition`

| API field | FE field | Rendered as |
|---|---|---|
| `position_id` | `position_id` (string) | React key |
| `title` / `title_ar` | same | Title via `orgLabel()` |
| `level` | `level: number \| null` | Band heading `Level {n}`; `null` → `No level` band |
| `seats` | `seats` | `filled / seats` |
| `employee_count` | `employee_count` | `filled` in `filled / seats` |
| `vacancies` | `vacancies` | `{n} vacant` |
| `employees` | `employees` | Stacked employee rows |

### Employee → `OrgStructureEmployee`

| API field | FE field | Rendered as |
|---|---|---|
| `employee_id` | `employee_id` (string) | React key |
| `name` | `name` | Display name |
| `employee_code` | `employee_code` | Small badge — **hidden when empty** |
| `job_title` | `job_title` | Mapped, not rendered (usually duplicates the title) |

**Ids are strings on the FE.** `sid()` normalises them, matching every other mapper in the app. `level` deliberately bypasses `num()` — `num(null)` returns `0`, which would invent a rank.

---

## 4. Ordering and level rules

1. **Departments and positions arrive sorted.** Rendered in array order. Never re-sorted client-side.
2. **`level` is a dense rank, not a row index.** Peers share a level. Live proof: **Warehousing has 5 positions across 2 levels** — one Supervisor at Level 1, four support positions all at Level 2. `groupPositionsByLevel()` walks the sorted array and opens a new band only when `level` changes.
3. **`level` is per-department.** It restarts for each one, so a department whose only rank is junior still reads *Level 1*. Never compare levels across departments.
4. **`level: null`** is valid — a position with no seniority. It sorts last and renders in a `No level` band with no level number.
5. **Employees within a position** come sorted by name.

---

## 5. Empty and vacant handling

| Case | Render |
|---|---|
| Position with no employees | Dashed border, **Vacant** chip, `{n} vacant` alongside its seat count. **No placeholder person.** |
| Position partly filled | Employees listed, plus `{n} vacant` beneath |
| Position over establishment | `4 / 3` with `vacancies: 0` — never negative |
| Position with `seats: 0` | Falls back to `{n} employees` instead of `filled / seats` |
| Department with no positions | Card still renders, with *No positions defined for this department* |
| Position with no department | Its own dashed **No department** card — never folded into a real department |
| Archived department / position / employee | Absent from the payload; nothing to filter |
| Whole tree empty | `EmptyState` with a hint |

---

## 6. Two traps worth knowing

**`department.employee_count` is not the sum of its positions.** It counts everyone whose department matches, *including people holding no position*. On live data `Administration` reports `employee_count: 2` with `position_count: 0`. The card therefore shows the remainder on its own line — `{n} without a position` — via `departmentStaffWithoutPosition()`, floored at 0 because an employee can sit on a position belonging to another department.

**Most employees hold no position at all.** Live totals are `employees_total: 93` against `employees_on_positions: 15`. `OrgStructureSummaryHeader` shows both plus the difference, so the structure never looks like it lost 78 people.

---

## 7. Files

**New**
```
src/shared/hooks/orgStructure.ts                     types + useOrgStructure
src/shared/api/orgStructure.ts                       fetchOrgStructureTree
src/shared/api/mappers/orgStructure.ts               mapOrgStructureTree
src/features/departments/utils/orgStructure.ts       pure transforms
src/features/departments/utils/orgStructure.test.ts  18 tests
src/features/departments/utils/__fixtures__/orgStructure.live.json
src/features/departments/components/OrgStructureView.tsx
src/features/departments/components/OrgStructureSummaryHeader.tsx
src/features/departments/components/OrgStructureDepartmentCard.tsx
src/features/departments/components/OrgStructureLevelGroup.tsx
src/features/departments/components/OrgStructurePositionRow.tsx
src/features/departments/components/OrgStructureEmployeeRow.tsx
src/features/departments/components/OrgStructureOrphanPositions.tsx
```

**Modified**
```
src/features/departments/components/HierarchyViewModeToggle.tsx   4th tab
src/features/departments/hooks/useHierarchyView.ts                +"structure"
src/features/departments/pages/HierarchyChart.tsx                 lazy branch
src/shared/api/mappers/index.ts · src/shared/api/odooData.ts · src/shared/hooks/index.ts
src/i18n/locales/{ar,en,ku}.json · source-map.json                12 new keys
```

The test fixture is a **real captured API response**, so the tests assert against what the server actually sends rather than an invented shape.

---

## 8. i18n

12 new keys under `hierarchy.*`: `level_n`, `no_level`, `n_positions`, `positions_total`, `departments_count`, `n_employees`, `no_positions_defined`, `n_without_position`, `positions_without_department_hint`, `on_positions`, `without_position`, `no_structure_yet`, `no_structure_yet_hint`.

Reused: `filled_of_seats`, `n_vacant`, `vacant`, `no_department`, `seats_total`, `common.loading`, `common.error`.

`hierarchy.organizational_structure` already existed but its values carried a stray trailing dash in all three locales (`الهيكل-التنظيمي-`, `Organizational Structure-`). Since only this new tab consumes it, the values were corrected and the `source-map` entry remapped.

New components use `useTranslation().t()` throughout so labels follow the active locale. The tab label uses `arabicSource()` to match the existing pattern in that file.

---

## 9. Out of scope

- **No editing.** Read-only. Position and grade assignment stay on *Positions & Appointments*.
- **No grade, in any form.** §0.
- **No reporting lines.** That is the *Current Structure* tree's job.
- **No invented data.** Vacant means vacant.

---

## 10. Acceptance criteria

- [x] Only `/api/hr/org-structure/tree` is called for this screen
- [x] No grade code, name or band in the UI, the types, or the mapper
- [x] Cards render Department → Position → Employee
- [x] Positions ordered by backend `level`, most senior first
- [x] Peers share a level (Warehousing: 5 positions, 2 bands)
- [x] `level: null` renders a `No level` band with no number
- [x] Vacant positions show the Vacant chip and seat/vacancy counts
- [x] No employee name is invented anywhere
- [x] Departments with no positions render with an empty state
- [x] `positions_without_department` rendered as its own labelled card
- [x] Archived records never appear (absent from payload)
- [x] `department_ar` / `title_ar` fall back to English when empty
- [x] `employee_code` hidden when empty
- [x] Department `employee_count` not presented as a row total
- [x] `tsc --noEmit` clean for these files; `vite build` succeeds
- [x] 18 unit tests pass against a real captured payload; full suite 174 pass
- [ ] **Visual/RTL pass in the browser** — not yet done, see below

### Not yet verified

The screen has **not been opened in a browser**. Types, build and the data-path transforms are covered by tests, but the visual result, the Arabic RTL layout (card nesting, level bands, the `filled / seats` numerals) and behaviour on a narrow viewport still need a human look.

Two known data oddities that will be visible immediately and are **backend data, not FE bugs**:
- **Two cards titled "Administration"** — duplicate departments (ids 1 and 10) exist and are unmerged.
- **`CFO` in the No department card** — it genuinely has no department assigned.
