-- ═══════════════════════════════════════════════════════════════
-- Migration: Audit Fixes — generated_payslips table + source column
-- Run this after supabase-migration.sql and all previous migrations
-- ═══════════════════════════════════════════════════════════════

-- Payslip persistence table
CREATE TABLE IF NOT EXISTS generated_payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT NOT NULL,
  month TEXT NOT NULL,                     -- e.g. "2026-04"
  basic_salary NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'IQD',
  days_worked NUMERIC DEFAULT 0,
  total_hours NUMERIC DEFAULT 0,
  overtime_hours NUMERIC DEFAULT 0,
  shortfall_hours NUMERIC DEFAULT 0,
  absence_days INTEGER DEFAULT 0,
  net_salary NUMERIC DEFAULT 0,
  late_deduction NUMERIC DEFAULT 0,
  shortfall_deduction NUMERIC DEFAULT 0,
  absence_deduction NUMERIC DEFAULT 0,
  overtime_payment NUMERIC DEFAULT 0,
  generated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for quick lookups by month
CREATE INDEX IF NOT EXISTS idx_payslips_month ON generated_payslips(month);
CREATE INDEX IF NOT EXISTS idx_payslips_employee ON generated_payslips(employee_id);

-- Add source column to employees (tracks where employee was created from)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- RLS for generated_payslips
ALTER TABLE generated_payslips ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all for generated_payslips" ON generated_payslips
  FOR ALL USING (true) WITH CHECK (true);
