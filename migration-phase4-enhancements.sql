-- ════════════════════════════════════════════════════════════════
-- Phase 4: Enhancement Migrations
-- Run this in Supabase SQL Editor (after migration-phase2-integrity.sql)
-- ════════════════════════════════════════════════════════════════

-- ⑯ Break tracking columns on attendance_records
ALTER TABLE attendance_records
  ADD COLUMN IF NOT EXISTS breaks jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS total_break_minutes numeric(6,2) DEFAULT 0;

-- ⑮ Device health — add status column to biometric_devices
ALTER TABLE biometric_devices
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'online';

-- ⑭ Absent detection — ensure leave_requests table has the columns we query
-- (This is a safety check — the table should already exist)
-- If leave_requests doesn't exist yet, create a minimal version:
CREATE TABLE IF NOT EXISTS leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id),
  start_date date NOT NULL,
  end_date date NOT NULL,
  leave_type text DEFAULT 'annual',
  status text DEFAULT 'pending',
  reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add index for faster absent detection query
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates
  ON leave_requests (start_date, end_date)
  WHERE status = 'approved';

-- Add index for break queries
CREATE INDEX IF NOT EXISTS idx_attendance_breaks
  ON attendance_records USING gin (breaks)
  WHERE breaks IS NOT NULL AND breaks != '[]'::jsonb;
