# HR Device Sync Service
## Hikvision DS-K1T342MFWX ↔ Supabase / Odoo

Hybrid push + poll attendance sync service that connects your Hikvision fingerprint terminal to the HR system.

## Backend toggle (Supabase ↔ Odoo bridge)

This service can write derived attendance/employee/notification/device data
to either Supabase (current production) or Odoo (staging / post-cutover),
selected by the `BACKEND` env var. The Hikvision polling/push/reconciliation
logic (`hikvision-api.mjs`, the cron schedules in `sync-service.mjs`) is
identical either way — only the destination of the *derived* data changes.
See `backend-supabase.mjs` / `backend-odoo.mjs` for the adapter implementations.

```bash
BACKEND=supabase   # default — writes to Supabase, as today
BACKEND=odoo       # writes to the lugal_hr REST API instead (needs ODOO_* vars)
```

To validate the Odoo bridge on staging before cutover:
1. Create the service account: run
   `Lugal-ai/scripts/hr_migration/setup_device_sync_service_account.py`
   via `odoo-bin shell` against the staging DB, and copy the printed
   `ODOO_SYNC_USERNAME`/`ODOO_SYNC_PASSWORD` into `.env`.
2. Set `ODOO_API_BASE`, `ODOO_DB` in `.env` (Supabase vars stay as-is —
   both are read regardless of `BACKEND`).
3. `npm run test-connection` — checks the device AND, since `ODOO_API_BASE`
   is now set, logs into Odoo and reads `/api/hr/employees/list` +
   `/api/hr/devices/list`.
4. `BACKEND=odoo npm run manual-sync -- 2026-04-01 2026-04-07` — backfills a
   known date range into the staging Odoo DB using the exact same
   check-in/check-out/overnight logic as live sync.
5. `npm run diff-backends -- 2026-04-01 2026-04-07` — compares the resulting
   Odoo `hr.attendance` rows against the equivalent Supabase
   `attendance_records` for that range, matched by `device_employee_no`.
6. Only once that diff is clean, flip `BACKEND=odoo` in production and keep
   Supabase read-only for 1-2 weeks as a rollback path (see
   `Lugal-ai/docs/hr_migration_analysis/08_MIGRATION_PLAN.md`, "Switch
   device-sync to Odoo").

Note: the `/api/device/*` device-management routes (persons, face photos,
door control, `sync-employee`, `sync-status`, `next-employee-id`) always talk
to Supabase directly regardless of `BACKEND` — they're local operational
tooling for `DeviceManagement.tsx`, not part of this bridge's scope.

## Setup

### 1. Install dependencies
```bash
cd device-sync
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your device password and Supabase service key
```

### 3. Run the Supabase migration
Run the PART 13 section from `supabase-migration.sql` in your Supabase SQL Editor.

### 4. Test device connection
```bash
npm run test-connection
```
This verifies: connectivity, enrolled users, and today's events.

### 5. Start the sync service
```bash
npm start
```

### 6. (Optional) Configure device push
In the device web UI (https://192.168.15.15):
1. Go to **Network → Advanced → HTTP Listening**
2. Set URL: `http://<your-server-ip>:8089/ISAPI/Event/notification/alertStream`
3. Enable the listener

## Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start the sync service (continuous) |
| `npm run test-connection` | Test device connectivity |
| `npm run manual-sync` | Sync today's events |
| `node manual-sync.mjs 2026-04-01` | Sync a specific date |
| `node manual-sync.mjs 2026-04-01 2026-04-22` | Sync a date range |

## Architecture

```
┌─────────────────────┐     ISAPI/HTTP      ┌──────────────────┐
│  Hikvision Device   │ ──── Push ────────▶ │                  │
│  DS-K1T342MFWX      │ ◀─── Poll ──────── │  Sync Service    │
│  192.168.15.15      │                     │  (Node.js)       │
└─────────────────────┘                     │                  │
                                            │  ┌─ Poll: 5min   │
                                            │  ├─ Reconcile:30m│
                                            │  └─ Emp Sync:60m │
                                            └────────┬─────────┘
                                                     │ Supabase API
                                            ┌────────▼─────────┐
                                            │  Supabase DB     │
                                            │  ┌─ attendance   │
                                            │  ├─ employees    │
                                            │  ├─ device_events│
                                            │  └─ notifications│
                                            └──────────────────┘
```

## How Check-in/Check-out Works

- **First punch of the day** → recorded as check-in
- **Every subsequent punch** → updates check-out time
- **Working hours** = check-out − check-in (auto-calculated)
- **Late detection** runs after each sync using employee's assigned shift

## Auto Employee Discovery

When the device reports an unknown employee number:
1. A new employee is created with status **"معلق"** (pending)
2. Basic info is pulled from the device (name, ID)
3. An HR notification is created asking to review and complete the profile
4. Attendance is still recorded immediately
