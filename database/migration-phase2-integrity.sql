-- ════════════════════════════════════════════════════════════════
-- Phase 2: Data Integrity Migration
-- Run this in Supabase SQL Editor
-- ════════════════════════════════════════════════════════════════

-- ⑤ Unique constraint on (employee_id, date) — prevents duplicate attendance records
-- First, clean up any existing duplicates (keep the one with the most data)
DELETE FROM attendance_records
WHERE id IN (
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (
        PARTITION BY employee_id, date
        ORDER BY
          CASE WHEN check_out_time IS NOT NULL THEN 0 ELSE 1 END,
          CASE WHEN check_in_time IS NOT NULL THEN 0 ELSE 1 END,
          working_hours DESC NULLS LAST,
          created_at DESC NULLS LAST
      ) AS rn
    FROM attendance_records
  ) ranked
  WHERE rn > 1
);

-- Now add the unique constraint
ALTER TABLE attendance_records
  ADD CONSTRAINT uq_attendance_employee_date UNIQUE (employee_id, date);
