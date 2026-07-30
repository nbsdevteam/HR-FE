-- Migration: Add excuse/override columns to attendance_records
-- These columns allow HR to excuse late arrivals, absences, and hour shortfalls

ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS excused_late BOOLEAN DEFAULT FALSE;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS excused_absence BOOLEAN DEFAULT FALSE;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS excused_shortfall BOOLEAN DEFAULT FALSE;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS excuse_note TEXT DEFAULT NULL;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS excused_by TEXT DEFAULT NULL;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS excused_at TIMESTAMPTZ DEFAULT NULL;
