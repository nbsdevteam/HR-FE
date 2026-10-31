# HR round 2, batch 2: what changes for HR-FE

**For:** the HR-FE team. **Backend:** `lugal_hr` on Lugal-ai `development`, 31 Oct 2026. Restart only; no module upgrade.

Nothing breaks. One response gains a key, and two counts that were wrong are now right.

## `POST /api/hr/attendance/import`

**Before:** if one row failed with a database error, every earlier row was rolled back. The answer still counted those rows as imported. A row that Odoo refused, such as a check-out before its check-in, could also stay saved.

**Now:** each row is saved or refused on its own.

```jsonc
"data": {
  "processed": 2,          // rows saved (now honest)
  "upserted": 2,           // same number as processed (it used to count rows that were later rolled back)
  "errors": 1,
  "failed_rows": [         // NEW, at most 100 entries
    {"index": 1, "error": "\"Check Out\" time cannot be earlier than \"Check In\" time."}
  ],
  "items": [ /* the saved rows, at most 200, unchanged */ ]
}
```

- `index` is the 0-based position of the row in the `records` you sent.
- `error` is the reason, cut to 200 characters.

**Suggested screen change** (optional, but without it users never learn which rows failed): after an upload, show "N saved, M failed", and list the failed rows by their line in the file. That line is `index + 1` if the file has no header row, and `index + 2` if it has one.

## Everything else

Every other response keeps its shape. A refused action now leaves nothing half-saved:

- a reporting loop on a position;
- an HR or manager approval that the leave then refuses, for example on balance;
- an excuse leave that overlaps another leave.

These were sometimes saved even though the screen showed the refusal.
