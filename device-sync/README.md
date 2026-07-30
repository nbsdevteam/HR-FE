# HR Device Sync Service
## Hikvision DS-K1T342MFWX ↔ Supabase

Hybrid push + poll attendance sync service that connects your Hikvision fingerprint terminal to the HR system.

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
