# HR round 2, batch 4: what changes for HR-FE

**For:** the HR-FE team. **Backend:** `lugal_hr` on Lugal-ai `development`, 31 Oct 2026. Restart only; no module upgrade.

## Employee create and update (`/api/hr/employees/create`, `/api/hr/employees/<id>/update`)

The form's fields now land where the screen expects. Before, `company_phone`, `blood_type` and `end_date` were ignored, and both phones were written to the company phone. Saving with an empty personal phone therefore erased the company phone.

| key you send | stored as | read back as |
|---|---|---|
| `personal_phone` | mobile phone | `personal_phone` |
| `company_phone` | company phone | `company_phone` |
| `phone` (old single key) | company phone, **only when neither key above is sent**; otherwise ignored | – |
| `blood_type` | one of `A+ A- B+ B- AB+ AB- O+ O-` (any case) | `blood_type` |
| `end_date` (`YYYY-MM-DD`, `""` clears it) | end date; refused before the joining date | `end_date` |
| `nationality_id` | the country | `nationality_id`, `nationality` |
| `nationality` (a country **name**) | the country with exactly that English or Arabic name, any case | as above |

New refusals (`success: false`): `invalid_blood_type`, `invalid_end_date`, `end_date_before_joining`, `unknown_nationality`. A refused request writes nothing.

New in every successful response: `fields_ignored: [...]`, the keys the backend did not use. It should be empty. If a key shows up there, the backend does not know that field.

**Please change:**
1. **Create:** send `company_phone` from the form, and stop sending the merged `phone` (`personalPhone || companyPhone`). Today a new employee's company phone is never stored when a personal phone is given.
2. **Nationality:** send `nationality_id`, which is `country.id` from the geo list, instead of the country name. The name still works, but an id cannot be misspelt.
3. **Update:** `phone` can go. It is ignored whenever `personal_phone` or `company_phone` is sent, and appears in `fields_ignored`.

## End of Service: five dead calls to delete

`src/shared/api/lifecycle.ts` calls five routes that no backend has:

- `approveClearanceSection` → `/api/hr/exit/clearance/<id>/approve`
- `rejectClearanceSection` → `/api/hr/exit/clearance/<id>/reject`
- `signExitSignature` → `/api/hr/exit/signature/<id>/sign`
- `rejectExitSignature` → `/api/hr/exit/signature/<id>/reject`
- `resendExitSignature` → `/api/hr/exit/signature/<id>/resend`

They act on "clearance sections" and HR-side signature rows, which do not exist. No End of Service record ever carries `clearance_sections`, so `ExitClearanceSectionPanel` never renders and these calls can never run. The owner decided on 31 Oct not to build them. Please delete them, together with `useExitClearanceActions`, `ExitClearanceSectionPanel` and the `clearance_sections` field on the type.

What each one would have done already exists:

| would have been | use |
|---|---|
| a team approves its clearance | tick its checklist lines (`/api/hr/exit/checklist/<line>/update`, the team's permission) |
| approve / reject | `/api/hr/exit/<id>/approve`, `/reject` |
| the employee signs or declines | the one-time signing link (`/api/hr/public/exit_sign/open` and `/decide`) |
| resend | `/api/hr/exit/<id>/signature/issue` |

## End of Service: unassigned approval steps

Two new kinds of row appear in the HR notifications list. Both use the existing inbox and need no screen change.

- **"Unassigned End of Service approval — {employee} / {step}"**: `category: "exit_approval_unassigned"`, `notification_type: "warning"`. It is sent once per process and step to holders of `hr.lifecycle.manage` when nobody can approve a step. The step stays pending until someone is given its permission.
- An approval request for a user who has a login but no employee record (`user_id` set, `employee_id` empty).
