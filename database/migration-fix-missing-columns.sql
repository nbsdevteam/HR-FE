-- ============================================================
-- FIX: Add missing columns to employees table
-- Run this in Supabase SQL Editor
-- ============================================================

-- shift_id — links employee to their work shift
ALTER TABLE employees ADD COLUMN IF NOT EXISTS shift_id UUID;

-- device_employee_no — links employee to biometric device ID
ALTER TABLE employees ADD COLUMN IF NOT EXISTS device_employee_no TEXT;

-- position_id — links employee to org chart position
ALTER TABLE employees ADD COLUMN IF NOT EXISTS position_id UUID;

-- direct_manager_id — for reporting hierarchy
ALTER TABLE employees ADD COLUMN IF NOT EXISTS direct_manager_id TEXT;

-- Verify columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'employees'
  AND column_name IN ('shift_id', 'device_employee_no', 'position_id', 'direct_manager_id')
ORDER BY column_name;
