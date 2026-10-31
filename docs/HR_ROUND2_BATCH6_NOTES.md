# HR round 2, batch 6: public endpoints and payroll scope

**For:** the HR-FE team, and whoever runs the servers (nginx and the websocket proxy). **Backend:** `lugal_hr` and `scripts/ws_proxy.py` on Lugal-ai `development`, 31 Oct 2026. Odoo needs a restart only; no module upgrade.

## Public application form (`/api/hr/public/apply/submit`)

- **Every submission is a new application.** A candidate who applies again for the same position within 30 days used to *replace* their earlier application. Because the match used a pattern, a submission could also replace **another person's** application and delete that person's CV.
  - Now nothing that was submitted is edited or deleted.
  - The new application gets its own reference code. Its HR notes say "Re-applied; earlier application {ref}", so HR can merge the two.
  - `resubmitted: true` in the answer still means "this address applied before". The `reference_code` is the new one.
- An email address containing `%` is refused with `email_invalid`.

Nothing needs to change on the public form.

## Salary lists are scoped (HR-FE: Salary page)

These lists now return only the employees whose pay the caller may see:

- `/api/hr/payroll/monthly_records/list`
- `/api/hr/payroll/ledgers/list`
- `/api/hr/payroll/payslips/list`
- `/api/hr/payroll/employee_allowances/list`
- `/api/hr/payroll/employee_deductions/list`
- `/api/hr/payroll/loans/list`

The rule is the one `/api/hr/payroll/list` already used:

| caller | sees |
|---|---|
| HR: `hr.payroll.edit`, `hr.employees.edit` or `hr.leave.hr_approve` | everyone |
| supervisor: `hr.payroll.view` with `hr.attendance.team` or `hr.leave.team_approve` | their team and themselves |
| anyone else with `hr.payroll.view` | themselves |

Before, any supervisor received the whole company's salaries from these lists. Expect shorter lists for supervisors; HR sees no change. `/api/hr/currency_rates/list` is unchanged: exchange rates are not anybody's pay.

## Client IP behind proxies (servers)

The public forms rate-limit and audit by client address. They used to believe the **first** `X-Forwarded-For` hop, which the client writes itself. On production, the websocket proxy also *replaced* that header, so everyone looked like 127.0.0.1 and shared one bucket.

Odoo now believes forwarded addresses only from a **trusted proxy**. The trusted list is the system parameter `lugal_hr.trusted_proxy_ips`, comma-separated, default `127.0.0.1,::1`:
- From a trusted peer, it uses `X-Real-IP`, or else the right-most `X-Forwarded-For` hop that is not one of our proxies.
- Any other peer is the client.

**Development:** the parameter is set to `127.0.0.1,::1,192.168.116.204,192.168.116.206,192.168.116.211`, the three machines dev Odoo is reached from.

**Production, when this is deployed there:**
1. Restart `scripts/ws_proxy.py` with the new code. It now *appends* to `X-Forwarded-For`, and passes nginx's `X-Real-IP` on only when nginx is its local peer.
2. Make sure the nginx site in front of it sets `proxy_set_header X-Real-IP $remote_addr;` and `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`.
3. Leave `lugal_hr.trusted_proxy_ips` at its default unless Odoo is reached from another machine.

Not changed in this round: `lugal_crm`'s public e-sign and audit helpers still take the first `X-Forwarded-For` hop.

## AI screening retries

A CV whose provider keys all failed used to wait without spending an attempt whenever **any** key was rate-limited, up to 20 times. Now:

- It waits only when **every** key that was tried was rate-limited (HTTP 429).
- A key refused with 400, 401 or 403 spends the attempt, and is not tried again in the same queue run.
- The candidate still gets the normal 3 attempts.
