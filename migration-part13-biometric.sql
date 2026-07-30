-- ============================================================
-- PART 13: BIOMETRIC DEVICE INTEGRATION
-- Run this in Supabase SQL Editor
-- ============================================================

-- 13A) Biometric devices registry
CREATE TABLE IF NOT EXISTS biometric_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  model TEXT NOT NULL,
  serial_number TEXT UNIQUE,
  ip_address TEXT NOT NULL,
  port INTEGER DEFAULT 443,
  protocol TEXT NOT NULL DEFAULT 'isapi' CHECK (protocol IN ('isapi','sdk','iclock')),
  username TEXT,
  location TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  last_heartbeat_at TIMESTAMPTZ,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 13B) Raw device events log (immutable audit trail)
CREATE TABLE IF NOT EXISTS device_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES biometric_devices(id) ON DELETE SET NULL,
  device_event_id TEXT,
  employee_no TEXT NOT NULL,
  employee_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
  event_time TIMESTAMPTZ NOT NULL,
  event_date DATE,
  verify_mode TEXT,
  direction TEXT CHECK (direction IN ('in','out','unknown')),
  temperature DECIMAL(4,1),
  mask_status TEXT,
  raw_data JSONB DEFAULT '{}',
  processed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_device_events_emp ON device_events(employee_no, event_time);
CREATE INDEX IF NOT EXISTS idx_device_events_date ON device_events(event_date);
CREATE INDEX IF NOT EXISTS idx_device_events_unprocessed ON device_events(processed) WHERE processed = false;

-- 13C) Extend attendance_records for device source tracking
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS verify_mode TEXT;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS device_employee_no TEXT;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS device_id UUID;

-- 13D) Extend employees for device mapping
ALTER TABLE employees ADD COLUMN IF NOT EXISTS device_employee_no TEXT;

-- 13E) Device sync configurations
-- Creates the configurations table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT,
  value_type TEXT DEFAULT 'text',
  category TEXT DEFAULT 'general',
  label_ar TEXT,
  label_en TEXT,
  description_ar TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE configurations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "configurations_all" ON configurations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

INSERT INTO configurations (config_key, config_value, value_type, category, label_ar, label_en, description_ar, sort_order) VALUES
  ('device.sync_interval_minutes', '5', 'number', 'attendance', 'فاصل مزامنة البصمة (دقائق)', 'Device Sync Interval (min)', 'عدد الدقائق بين كل عملية مزامنة مع جهاز البصمة', 10),
  ('device.reconcile_interval_minutes', '30', 'number', 'attendance', 'فاصل المراجعة الشاملة (دقائق)', 'Full Reconcile Interval (min)', 'عدد الدقائق بين كل مراجعة شاملة لأحداث اليوم', 11),
  ('device.auto_create_employees', 'true', 'boolean', 'attendance', 'إنشاء موظفين تلقائياً', 'Auto-Create Employees', 'إنشاء موظف جديد تلقائياً عند اكتشاف رقم غير معروف من الجهاز', 12),
  ('device.noon_cutoff_hour', '12', 'number', 'attendance', 'ساعة فاصل الظهيرة', 'Noon Cutoff Hour', 'البصمات قبل هذه الساعة = دخول، بعدها = خروج (إذا كانت بصمة واحدة)', 13)
ON CONFLICT (config_key) DO NOTHING;

-- 13F) RLS for new tables
ALTER TABLE biometric_devices ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "biometric_devices_all" ON biometric_devices FOR ALL TO anon, authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE device_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "device_events_all" ON device_events FOR ALL TO anon, authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 13G) Insert your device
INSERT INTO biometric_devices (name, model, serial_number, ip_address, port, protocol, location) VALUES
  ('جهاز البصمة الرئيسي', 'DS-K1T342MFWX', 'DS-K1T342MFWX20240701V031601ENFQ1132415', '192.168.15.15', 443, 'isapi', 'المدخل الرئيسي')
ON CONFLICT (serial_number) DO NOTHING;
