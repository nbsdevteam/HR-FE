# Leave Type Settings — "Add Leave Type" form refactor (FE requirements)

**Backend:** `lugal_hr`, `controllers/leave_controller.py` (`/api/hr/leave/types/*`),
`models/hr_leave_type.py`. Already implemented and verified — this document
describes the FE work only.

**Goal:** make "Add Leave Type" simple and HR-friendly, Odoo-style — a handful
of obvious fields up front, everything else tucked behind "Advanced options."
No new leave system, no new backend model — same `hr.leave.type` record, same
three routes (`create` / `<id>/update` / `<id>/delete`), reorganized UI only.

---

## 1. Where this lives today

- `src/features/settings/pages/Settings.tsx` → `SettingsWorkspace` → one card
  among many: `LeaveTypesCard.tsx` → `NewLeaveTypeForm.tsx` (the form to
  refactor) + `LeaveTypeList.tsx`/`LeaveTypeListItem.tsx` (unchanged by this
  work — see §7).
- `NewLeaveTypeForm.tsx` currently delegates to a **generic** `NewTypeForm<T>`
  component (also used by `NewContractTypeForm`/`NewDocTypeForm` — **do not
  change that shared component**, it's fine for those two). Leave types now
  need real grouping/conditional logic that flat config rows can't express,
  so build the new leave-type form as its own bespoke component tree instead
  of extending the shared one. `NewTypeForm`, `NewTypeFormRow`,
  `NewTypeFormField`, `NewTypeFormCheckbox` stay untouched.
- State lives in `useLeaveTypeManagement.ts` (`newLeaveType`,
  `updateNewLeaveType`, `createLeaveType`). Keep this hook's shape — just
  extend the payload it sends (§4) and the form state it holds (§2).
- There is currently **no Edit-all-fields form** — only inline edit of
  `default_days_per_year` (pencil icon in the list) and an active/inactive
  toggle. **Out of scope for this pass**: keep those two as they are. This
  refactor is the Add flow only.

---

## 2. New field grouping

### Basic (always visible, no disclosure needed)

| Field | Control | Notes |
|---|---|---|
| Name (Arabic) | text, required | `name_ar` |
| Name (English) | text, optional | `name_en` |
| Paid / Unpaid | toggle with visible label that flips between "Paid"/"Unpaid" | `is_paid` — reuse the existing `SettingsToggle` component, don't build a new one |
| Days per Year | number | `default_days_per_year` |
| Accrual | toggle, label "Enable monthly accrual" | `accrual_enabled` |
| Accrual days/month | number — **only rendered when `accrual_enabled` is true** | `accrual_days_per_month`; placeholder/help text: "Leave blank to derive from Days per Year ÷ 12" |

That's it for Basic — 4 always-visible controls plus one conditional one.
`code` is **not** in Basic (see §3).

### Advanced (collapsed by default, behind a "Advanced options" disclosure)

Four labeled sections, in this order:

**Accrual**
| Field | Control | Notes |
|---|---|---|
| Accrual method | select: Annual / Monthly / Manual | `accrual_method` |

**Leave Rules**
| Field | Control | Notes |
|---|---|---|
| Allow half day | checkbox | `allow_half_day` |
| Allow hourly requests | checkbox | `allow_hourly` |
| Requires attachment | checkbox | `requires_attachment` |
| Blocked during probation | checkbox | `probation_blocked` |
| Gender restriction | select: No restriction / Male / Female | `gender_restriction` — `""` \| `"male"` \| `"female"` |
| Minimum service (months) | number | `min_service_months` |
| Minimum days per request | number | `min_days_per_request` |
| Maximum days per request | number | `max_days_per_request` |
| Manager excuse on insufficient balance | checkbox + help text | `excuse_on_insufficient_balance` — **new field, see §5** |

**Carryover / Encashment**
| Field | Control | Notes |
|---|---|---|
| Allow carryover | checkbox | `is_carryover_allowed` |
| Max carryover days | number — **only when `is_carryover_allowed` is true** | `max_carryover_days` |
| Encashable | checkbox | `is_encashable` |
| Encashment % | number, 0–100 — **only when `is_encashable` is true** | `encashment_percentage` |

**Other**
| Field | Control | Notes |
|---|---|---|
| Code | text, optional | `code` — see §3, help text: "Optional — auto-generated from the name if left blank" |
| Color | color picker | `color` |
| Icon | text, optional | `icon` |
| Sort order | number | `sort_order` |

### Conditional-visibility rule (applies throughout)

Only show a dependent field when its toggle is on:
- `accrual_days_per_month` ⇐ `accrual_enabled`
- `max_carryover_days` ⇐ `is_carryover_allowed`
- `encashment_percentage` ⇐ `is_encashable`

Collapse/hide, don't just disable — an HR user shouldn't see a greyed-out
"Max carryover days" field for a type that doesn't carry over at all.

### Two fields to drop entirely

`attachment_after_days` and `carryover_expiry_months` currently exist in
`NewLeaveTypeForm`/`INITIAL_NEW_LEAVE_TYPE`/`DbLeaveType` but **have no
backing field on the backend model at all** — they were never sent on create,
never editable, and the mapper only ever produces a hardcoded default for
them. Remove them from `NewLeaveTypeForm`, `INITIAL_NEW_LEAVE_TYPE`, and
`DbLeaveType`. The one other consumer is
`src/features/leave/components/LeaveRequestModal.tsx`, which reads
`selectedType.attachment_after_days` in a conditional that can never be true
today (always `null`) — delete that dead conditional line when you remove the
field:

```tsx
// before
{selectedType?.requires_attachment && (
  <div className="flex items-center gap-2 -mt-2 text-amber-400" style={{ fontSize: 12 }}>
    {arabicSource("leave.this_type_of_leave_requires_an_attachment_medical_report_etc")}
    {selectedType.attachment_after_days && ` ${arabicSource("leave.after")} ${selectedType.attachment_after_days} ${arabicSource("common.days")}`}
  </div>
)}
// after
{selectedType?.requires_attachment && (
  <div className="flex items-center gap-2 -mt-2 text-amber-400" style={{ fontSize: 12 }}>
    {arabicSource("leave.this_type_of_leave_requires_an_attachment_medical_report_etc")}
  </div>
)}
```

---

## 3. Code is optional now — do not force it

**Backend confirmed: `lugal_code` was never actually required or unique at
the DB level.** The old form's "Code (annual) *" placeholder (with a trailing
`*` implying required) was FE-only theater — nothing enforced it.

New behavior:
- Move `code` into the Advanced → Other section.
- Drop the `*` and the misleading placeholder. New placeholder/help text:
  *"Optional — auto-generated from the name if left blank."*
- If the user leaves it blank, **omit `code` from the create payload
  entirely** (or send `""` — the backend treats both the same). The backend
  now auto-generates a unique, slugified code from the name
  (`hr_leave_type.py::_lugal_generate_unique_code`) when `code` is blank on
  create. You do not need to generate anything client-side.
- On update, `code` is still a plain optional field — send it only if the
  user is deliberately changing it.

---

## 4. API contract (unchanged endpoints, expanded payload)

Same three routes, same envelope (`{success, data}` / `{success:false, error,
error_code}`):

```
POST /api/hr/leave/types/create
POST /api/hr/leave/types/<id>/update
POST /api/hr/leave/types/<id>/delete   (unchanged by this work)
```

### Create payload — full field list now accepted

```json
{"params": {
  "name": "Annual Leave",
  "name_ar": "إجازة سنوية",
  "is_paid": true,
  "default_days_per_year": 21,
  "accrual_enabled": true,
  "accrual_days_per_month": 0,
  "accrual_method": "annual",

  "allow_half_day": false,
  "allow_hourly": false,
  "requires_attachment": false,
  "probation_blocked": true,
  "gender_restriction": "",
  "min_service_months": 0,
  "min_days_per_request": 0,
  "max_days_per_request": 0,
  "excuse_on_insufficient_balance": false,

  "is_carryover_allowed": false,
  "max_carryover_days": 0,
  "is_encashable": false,
  "encashment_percentage": 0,

  "code": "",
  "color": "#3b82f6",
  "icon": "",
  "sort_order": 0
}}
```

`name` is required (send `name_en || name_ar`, same as today).
Every other field is optional — omit anything the Basic-only form doesn't
touch, the backend fills in a sensible default (0 / false / model default).

### Response object — new keys

The read/create/update/list response object (`_serialize_leave_type`) now
also returns:

```json
{
  "gender_restriction": "",
  "min_service_months": 0,
  "excuse_on_insufficient_balance": false
}
```

(`max_days_per_request`/`min_days_per_request` were already returned —
nothing changed there.) Add these three keys to `DbLeaveType` and
`mapLeaveType`.

### New validation error codes

The backend now validates numeric input instead of throwing a generic 500 on
garbage values, and validates two cross-field rules:

| `error_code` | When |
|---|---|
| `name_required` | `name`/`name_ar`/`name_en` all blank |
| `invalid_<field>` | e.g. `invalid_default_days_per_year` — that field wasn't a number |
| `invalid_encashment_percentage` | not between 0 and 100 |
| `invalid_days_per_request_range` | `min_days_per_request > max_days_per_request` |
| `invalid_gender_restriction` | not `"male"`, `"female"`, or blank |

Surface `error` on the relevant field inline (e.g. show it under the
Encashment % input) rather than only in a toast, where the field is visible
on screen — for a validation error under an Advanced field, also
auto-expand the Advanced section so the user isn't confused about why Save
did nothing.

---

## 5. New field: manager excuse on insufficient balance

Backend feature (already shipped, module v1.16.0): when a leave type has
`requires_allocation` **and** `excuse_on_insufficient_balance` set, an
employee who requests it with insufficient balance doesn't get rejected —
the request goes to their direct manager as an approve/reject exception
(approve → stays paid; reject → converts to Unpaid Leave). Full details in
`docs/HR_LEAVE_EXCUSE_WORKFLOW_FE_REQUIREMENTS.md` if you're wiring the
Leave Request/approval side of that separately — for **this** form, it's
just one more checkbox:

- Label: *"Manager excuse when balance is insufficient"*
- Help text: *"Instead of rejecting the request outright, it's sent to the
  direct manager for approval as an exception."*
- Default: **off** (only Annual Leave ships with this on by default, seeded
  server-side — nothing the FE needs to special-case).

---

## 6. Suggested TypeScript changes

`src/features/settings/types/index.ts`:

```ts
export type LeaveTypeGenderRestriction = "" | "male" | "female";

export interface NewLeaveTypeForm {
  // basic
  name_ar: string;
  name_en: string;
  is_paid: boolean;
  default_days_per_year: number;
  accrual_enabled: boolean;
  accrual_days_per_month: number;

  // advanced: Accrual
  accrual_method: string;

  // advanced: Leave Rules
  allow_half_day: boolean;
  allow_hourly: boolean;
  requires_attachment: boolean;
  probation_blocked: boolean;
  gender_restriction: LeaveTypeGenderRestriction;
  min_service_months: number;
  min_days_per_request: number;
  max_days_per_request: number;
  excuse_on_insufficient_balance: boolean;

  // advanced: Carryover / Encashment
  is_carryover_allowed: boolean;
  max_carryover_days: number;
  is_encashable: boolean;
  encashment_percentage: number;

  // advanced: Other
  code: string;
  color: string;
  icon: string;
  sort_order: number;
}
```

`DbLeaveType` (`src/shared/hooks/leave.ts`): remove `attachment_after_days` /
`carryover_expiry_months`, add `excuse_on_insufficient_balance: boolean`
(`gender_restriction`/`min_service_months` already exist in the interface —
they just weren't populated by the backend before; no type change needed
there, just confirm the mapper reads them, which it already does).

`mapLeaveType` (`src/shared/api/mappers/leave.ts`): drop the two dead-field
lines, add `excuse_on_insufficient_balance: bool(r.excuse_on_insufficient_balance)`.

---

## 7. Suggested component structure

Keep `NewLeaveTypeForm.tsx` as the orchestrator (same external props as
today: `form`, `onFieldChange`, `onSave`, `onCancel` — `LeaveTypesCard.tsx`
doesn't need to change). Suggested breakdown to respect the 300-line/file and
"extract `.map()` renders" rules in this repo's `CLAUDE.md`:

- `NewLeaveTypeForm.tsx` — Basic fields + "Advanced options" disclosure
  toggle + validation wiring + Save/Cancel footer.
- `LeaveTypeAdvancedSections.tsx` — renders the 4 labeled sections when
  expanded (a `motion.div` height-animate, same `EXPAND_MOTION` pattern
  already used for the whole "Add Type" panel — there's no
  Accordion/Collapsible component in this codebase yet to reuse, and
  building one is more than this task needs).
- One small component per advanced section (`LeaveTypeAccrualFields.tsx`,
  `LeaveTypeRulesFields.tsx`, `LeaveTypeCarryoverFields.tsx`,
  `LeaveTypeOtherFields.tsx`) — each takes `form`/`onFieldChange`, renders
  its handful of fields directly (no need to force these through the
  generic `TypeFormRowConfig` system — it doesn't support the
  conditional-field logic §2 needs).

A small validation hook (e.g. `useLeaveTypeFormValidation(form)` in
`hooks/`) returning `{errors, isValid}` keeps the inline-error logic testable
and out of the component body — no schema-validation library is installed in
this repo (no Zod/Yup), so hand-rolled checks matching §4's error codes are
consistent with the rest of the codebase.

Disable Save while `!isValid` (currently Save always fires regardless of
input — that's the one real gap versus "clear labels, defaults, validation").

---

## 8. Suggested new copy (i18n)

This repo's i18n system keys UI copy through `arabicSource(key)`, backed by
`ar.json`/`en.json`/`ku.json` + `source-map.json` (the Arabic string is the
runtime lookup key for the DOM localizer). Run `npm run i18n:audit` after
adding these — it enforces: all three locales define every key, English/
Kurdish must differ from Arabic, and `source-map.json` must map each new
Arabic value back to its key.

**Reuse these existing keys as-is** (already correct for the new grouping):
`settings.name_in_arabic`, `settings.name_english`, `settings.days_year`,
`settings.enable_monthly_accrual`, `settings.accrual_days_per_month`,
`common.half_a_day`, `settings.allow_hourly_leave`,
`settings.attachment_required`, `settings.blocked_during_probation`,
`common.relay` (carryover), `common.exchangeable`, `settings.exchange`,
`common.annual`, `common.monthly`, `settings.without_merit`, `common.male`,
`common.female`, `org_structure.color_label` (already means "Color").

**Do not reuse** `settings.driven` for the Paid/Unpaid toggle — its English
value is a stale mistranslation ("driven"). Add a fresh pair of keys instead.

**New keys needed** (suggested Arabic/English — Kurdish needs a native/
reviewed translation, the drafts below are a starting point, not final):

| key | ar | en |
|---|---|---|
| `settings.leave_paid_label` | مدفوعة الأجر | Paid |
| `settings.leave_unpaid_label` | بدون أجر | Unpaid |
| `settings.show_advanced_options` | خيارات متقدمة | Advanced options |
| `settings.hide_advanced_options` | إخفاء الخيارات المتقدمة | Hide advanced options |
| `settings.advanced_section_accrual` | إعدادات الاستحقاق | Accrual |
| `settings.advanced_section_leave_rules` | قواعد الإجازة | Leave rules |
| `settings.advanced_section_carryover_encashment` | الترحيل والصرف | Carryover & encashment |
| `settings.advanced_section_other` | إعدادات أخرى | Other |
| `settings.leave_type_name_required` | الاسم بالعربي أو الإنجليزي مطلوب | Arabic or English name is required |
| `settings.code_optional_hint` | اختياري — يُنشأ تلقائياً من الاسم إذا تُرك فارغاً | Optional — auto-generated from the name if left blank |
| `settings.code_label` | رمز النوع | Code |
| `settings.gender_restriction_label` | تقييد حسب الجنس | Gender restriction |
| `settings.no_gender_restriction` | بدون تقييد | No restriction |
| `settings.min_service_months_label` | أقل مدة خدمة (أشهر) | Minimum service (months) |
| `settings.min_days_per_request_label` | أقل عدد أيام للطلب | Minimum days per request |
| `settings.max_days_per_request_label` | أقصى عدد أيام للطلب | Maximum days per request |
| `settings.manager_excuse_label` | طلب استئذان من المدير عند نقص الرصيد | Manager excuse when balance is insufficient |
| `settings.manager_excuse_help` | بدلاً من رفض الطلب مباشرة، يُرسل إلى المدير المباشر للموافقة عليه كاستثناء | Instead of rejecting the request outright, it is sent to the direct manager for approval as an exception |
| `settings.carryover_days_label` | أقصى أيام ترحيل | Max carryover days |
| `settings.encashment_percentage_label` | نسبة الصرف % | Encashment % |
| `settings.icon_label` | الأيقونة | Icon |
| `settings.sort_order_label` | ترتيب العرض | Sort order |
| `settings.encashment_percentage_range` | نسبة الصرف يجب أن تكون بين 0 و100 | Encashment percentage must be between 0 and 100 |
| `settings.days_per_request_range` | أقل عدد أيام لا يمكن أن يكون أكبر من الأقصى | Minimum days cannot exceed the maximum |

Before adding, re-check each Arabic value against `source-map.json` for a
collision with an existing entry (the audit script will catch it, but it's
faster to check first) — e.g. plain "الاستحقاق" and "اللون" are already
claimed by other keys, which is why the table above uses "إعدادات
الاستحقاق" and reuses `org_structure.color_label` instead of a new color key.

---

## 9. Permissions

Only `hr.leave.manage_types` may create/update/delete leave types — already
enforced **server-side** on all three routes (unchanged, not new). This repo
currently has no client-side permission/RBAC data at all (`useAuth()`'s user
carries no group/permission list — see `useWarningPermissions.ts`'s own
docstring for why: "This app carries no client-side RBAC yet... the flag is
optimistic and the backend stays the enforcement point"). Follow that exact
established pattern here rather than inventing new client-side permission
plumbing:

```ts
// src/features/settings/hooks/useLeaveTypePermissions.ts
export const useLeaveTypePermissions = () => {
  return { canManage: true };
};
```

Single seam, so when login starts carrying real permissions, gating
`LeaveTypesCard`'s "Add type" button / Save / Delete on `canManage` is a
one-line change at each call site with no further plumbing. Not required for
this pass to actually hide anything (the backend already refuses
unauthorized calls) — just keep the seam consistent with the rest of the app.

---

## 10. Testing checklist

- [ ] Create with only the Basic fields filled in (no code, Advanced never
      opened) — succeeds, a code is auto-generated, response echoes it.
- [ ] Create with Advanced open and every section touched — all fields land
      correctly (compare against §4's payload).
- [ ] Toggling `accrual_enabled` off hides the days/month input; same for
      `is_carryover_allowed` → max days, `is_encashable` → percentage.
- [ ] Leaving Name blank disables Save / shows the inline required error.
- [ ] Encashment % outside 0–100 is rejected with the field-level error.
- [ ] `min_days_per_request > max_days_per_request` is rejected with the
      field-level error.
- [ ] Existing list screen (badges, inline days-per-year edit, active
      toggle, delete) is unaffected — this refactor only touches the Add
      form.
- [ ] `LeaveRequestModal.tsx` (Leave Request page, unrelated feature) still
      renders correctly after the `attachment_after_days` cleanup.
- [ ] `npm run i18n:audit` and `npm run size-check` both pass.
- [ ] Network tab: creating a leave type is still exactly one API call
      (`/types/create`); no new calls added to the Settings page's initial
      load.

