-- ============================================================
-- HR System - Complete Supabase Migration
-- ============================================================
-- employees.id is TEXT — all FKs referencing it must be TEXT
-- Existing bucket: employee-photos
-- ============================================================


-- ============================================================
-- PART 1: ALTER EXISTING TABLES
-- ============================================================

-- 1A) Add missing columns to employees (id is TEXT)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS position TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS personal_phone TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS company_phone TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS join_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'نشط';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS national_id TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_phone TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS blood_type TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS manager_id TEXT;

-- Self-referencing FK for manager
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_employees_manager'
  ) THEN
    ALTER TABLE employees
      ADD CONSTRAINT fk_employees_manager
      FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 1B) Add auth link to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS auth_user_id UUID;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'employee';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_user_profiles_auth'
  ) THEN
    ALTER TABLE user_profiles
      ADD CONSTRAINT fk_user_profiles_auth
      FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;


-- ============================================================
-- PART 2: CREATE NEW TABLES
-- (All employee_id columns are TEXT to match employees.id)
-- ============================================================

-- 2A) departments
CREATE TABLE IF NOT EXISTS departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#8B5CF6',
  description TEXT,
  manager_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2B) employee_custodies
CREATE TABLE IF NOT EXISTS employee_custodies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  description TEXT,
  serial_number TEXT,
  date_received DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'نشط' CHECK (status IN ('نشط','مرتجع','تالف')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2C) employee_attachments
CREATE TABLE IF NOT EXISTS employee_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'PDF',
  file_url TEXT,
  file_size INTEGER,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2D) leave_requests
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('سنوية','مرضية','طارئة','بدون راتب','أمومة','أبوة','دراسية')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days INTEGER NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'معلق' CHECK (status IN ('معلق','مقبول','مرفوض')),
  approved_by TEXT REFERENCES employees(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2E) leave_balances
CREATE TABLE IF NOT EXISTS leave_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL,
  year INTEGER NOT NULL,
  total_days INTEGER NOT NULL,
  used_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (employee_id, leave_type, year)
);

-- 2F) evaluations
CREATE TABLE IF NOT EXISTS evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  evaluator_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
  period TEXT NOT NULL,
  overall_rating INTEGER DEFAULT 0 CHECK (overall_rating BETWEEN 0 AND 5),
  status TEXT DEFAULT 'لم يبدأ' CHECK (status IN ('مكتمل','قيد التقييم','لم يبدأ')),
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2G) evaluation_criteria
CREATE TABLE IF NOT EXISTS evaluation_criteria (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  criterion_name TEXT NOT NULL,
  score INTEGER CHECK (score BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2H) warnings
CREATE TABLE IF NOT EXISTS warnings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('شفهي','كتابي أول','كتابي ثاني','كتابي نهائي','فصل')),
  reason TEXT NOT NULL,
  details TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  issued_by TEXT REFERENCES employees(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'نشط' CHECK (status IN ('نشط','منتهي','ملغي')),
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2I) job_openings
CREATE TABLE IF NOT EXISTS job_openings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  location TEXT DEFAULT 'بغداد',
  type TEXT DEFAULT 'دوام كامل' CHECK (type IN ('دوام كامل','دوام جزئي','عقد مؤقت')),
  status TEXT DEFAULT 'مفتوح' CHECK (status IN ('مفتوح','مغلق','قيد المراجعة')),
  posted_date DATE DEFAULT CURRENT_DATE,
  deadline DATE,
  requirements TEXT[],
  description TEXT,
  salary_range TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2J) applicants
CREATE TABLE IF NOT EXISTS applicants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  job_opening_id UUID NOT NULL REFERENCES job_openings(id) ON DELETE CASCADE,
  stage TEXT DEFAULT 'تقديم' CHECK (stage IN ('تقديم','فرز أولي','مقابلة','اختبار','عرض','مقبول','مرفوض')),
  applied_date DATE DEFAULT CURRENT_DATE,
  rating INTEGER DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
  resume_url TEXT,
  notes TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2K) training_programs
CREATE TABLE IF NOT EXISTS training_programs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('أهداف العمل','تطوير الأعمال')),
  weight TEXT DEFAULT '70%',
  instructor TEXT,
  duration TEXT,
  status TEXT DEFAULT 'قادم' CHECK (status IN ('قادم','جاري','مكتمل')),
  completion_rate INTEGER DEFAULT 0 CHECK (completion_rate BETWEEN 0 AND 100),
  start_date DATE,
  end_date DATE,
  objectives TEXT[],
  max_participants INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2L) training_participants
CREATE TABLE IF NOT EXISTS training_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  training_program_id UUID NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  completion_status TEXT DEFAULT 'مسجل' CHECK (completion_status IN ('مسجل','جاري','مكتمل','منسحب')),
  score INTEGER,
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE (training_program_id, employee_id)
);

-- 2M) policies
CREATE TABLE IF NOT EXISTS policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  content TEXT,
  icon_name TEXT DEFAULT 'FileText',
  status TEXT DEFAULT 'نشط' CHECK (status IN ('نشط','قيد المراجعة','مؤرشف')),
  version INTEGER DEFAULT 1,
  last_updated DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2N) org_chart
CREATE TABLE IF NOT EXISTS org_chart (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES org_chart(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  initials TEXT,
  position TEXT,
  department TEXT,
  color TEXT DEFAULT '#8B5CF6',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2O) notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  employee_id TEXT REFERENCES employees(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  type TEXT,
  icon_name TEXT DEFAULT 'Bell',
  icon_color TEXT DEFAULT 'text-primary',
  is_read BOOLEAN DEFAULT false,
  related_entity_type TEXT,
  related_entity_id UUID,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ============================================================
-- PART 3: INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_employee_custodies_employee ON employee_custodies(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_attachments_employee ON employee_attachments(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_balances_employee_year ON leave_balances(employee_id, year);
CREATE INDEX IF NOT EXISTS idx_evaluations_employee ON evaluations(employee_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_evaluator ON evaluations(evaluator_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_criteria_eval ON evaluation_criteria(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_warnings_employee ON warnings(employee_id);
CREATE INDEX IF NOT EXISTS idx_warnings_status ON warnings(status);
CREATE INDEX IF NOT EXISTS idx_applicants_job ON applicants(job_opening_id);
CREATE INDEX IF NOT EXISTS idx_applicants_stage ON applicants(stage);
CREATE INDEX IF NOT EXISTS idx_training_participants_program ON training_participants(training_program_id);
CREATE INDEX IF NOT EXISTS idx_training_participants_employee ON training_participants(employee_id);
CREATE INDEX IF NOT EXISTS idx_org_chart_parent ON org_chart(parent_id);
CREATE INDEX IF NOT EXISTS idx_org_chart_employee ON org_chart(employee_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_manager ON employees(manager_id);


-- ============================================================
-- PART 4: STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('attachments', 'attachments', false, 10485760, ARRAY['application/pdf','image/jpeg','image/png','image/webp','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('resumes', 'resumes', false, 5242880, ARRAY['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- PART 5: STORAGE POLICIES
-- ============================================================

-- employee-photos (already exists)
DO $$ BEGIN
  CREATE POLICY "Anyone can view employee photos"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'employee-photos');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can upload employee photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'employee-photos');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can update employee photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'employee-photos');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can delete employee photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'employee-photos');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- attachments
DO $$ BEGIN
  CREATE POLICY "Authenticated users read attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'attachments');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users write attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'attachments');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users update attachments"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'attachments');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users delete attachments"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'attachments');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- resumes
DO $$ BEGIN
  CREATE POLICY "Authenticated users read resumes"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'resumes');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users write resumes"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'resumes');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users update resumes"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'resumes');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users delete resumes"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'resumes');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================
-- PART 6: ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_custodies ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_openings ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_chart ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Read policies (safe, using DO block to skip if exists)
DO $$ BEGIN CREATE POLICY "anon_read_departments"        ON departments          FOR SELECT TO anon, authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_read_custodies"          ON employee_custodies   FOR SELECT TO anon, authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_read_attachments"        ON employee_attachments FOR SELECT TO anon, authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_read_leave_requests"     ON leave_requests       FOR SELECT TO anon, authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_read_leave_balances"     ON leave_balances       FOR SELECT TO anon, authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_read_evaluations"        ON evaluations          FOR SELECT TO anon, authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_read_eval_criteria"      ON evaluation_criteria  FOR SELECT TO anon, authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_read_warnings"           ON warnings             FOR SELECT TO anon, authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_read_job_openings"       ON job_openings         FOR SELECT TO anon, authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_read_applicants"         ON applicants           FOR SELECT TO anon, authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_read_training"           ON training_programs    FOR SELECT TO anon, authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_read_train_participants" ON training_participants FOR SELECT TO anon, authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_read_policies"           ON policies             FOR SELECT TO anon, authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_read_org_chart"          ON org_chart            FOR SELECT TO anon, authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_read_notifications"      ON notifications        FOR SELECT TO anon, authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Write policies
DO $$ BEGIN CREATE POLICY "anon_write_departments"        ON departments          FOR INSERT TO anon, authenticated WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_write_custodies"          ON employee_custodies   FOR INSERT TO anon, authenticated WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_write_attachments"        ON employee_attachments FOR INSERT TO anon, authenticated WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_write_leave_requests"     ON leave_requests       FOR INSERT TO anon, authenticated WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_write_leave_balances"     ON leave_balances       FOR INSERT TO anon, authenticated WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_write_evaluations"        ON evaluations          FOR INSERT TO anon, authenticated WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_write_eval_criteria"      ON evaluation_criteria  FOR INSERT TO anon, authenticated WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_write_warnings"           ON warnings             FOR INSERT TO anon, authenticated WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_write_job_openings"       ON job_openings         FOR INSERT TO anon, authenticated WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_write_applicants"         ON applicants           FOR INSERT TO anon, authenticated WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_write_training"           ON training_programs    FOR INSERT TO anon, authenticated WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_write_train_participants" ON training_participants FOR INSERT TO anon, authenticated WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_write_policies"           ON policies             FOR INSERT TO anon, authenticated WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_write_org_chart"          ON org_chart            FOR INSERT TO anon, authenticated WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_write_notifications"      ON notifications        FOR INSERT TO anon, authenticated WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Update policies
DO $$ BEGIN CREATE POLICY "anon_update_departments"        ON departments          FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_update_custodies"          ON employee_custodies   FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_update_attachments"        ON employee_attachments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_update_leave_requests"     ON leave_requests       FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_update_leave_balances"     ON leave_balances       FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_update_evaluations"        ON evaluations          FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_update_eval_criteria"      ON evaluation_criteria  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_update_warnings"           ON warnings             FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_update_job_openings"       ON job_openings         FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_update_applicants"         ON applicants           FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_update_training"           ON training_programs    FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_update_train_participants" ON training_participants FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_update_policies"           ON policies             FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_update_org_chart"          ON org_chart            FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_update_notifications"      ON notifications        FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Delete policies
DO $$ BEGIN CREATE POLICY "anon_delete_departments"        ON departments          FOR DELETE TO anon, authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_delete_custodies"          ON employee_custodies   FOR DELETE TO anon, authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_delete_attachments"        ON employee_attachments FOR DELETE TO anon, authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_delete_leave_requests"     ON leave_requests       FOR DELETE TO anon, authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_delete_leave_balances"     ON leave_balances       FOR DELETE TO anon, authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_delete_evaluations"        ON evaluations          FOR DELETE TO anon, authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_delete_eval_criteria"      ON evaluation_criteria  FOR DELETE TO anon, authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_delete_warnings"           ON warnings             FOR DELETE TO anon, authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_delete_job_openings"       ON job_openings         FOR DELETE TO anon, authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_delete_applicants"         ON applicants           FOR DELETE TO anon, authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_delete_training"           ON training_programs    FOR DELETE TO anon, authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_delete_train_participants" ON training_participants FOR DELETE TO anon, authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_delete_policies"           ON policies             FOR DELETE TO anon, authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_delete_org_chart"          ON org_chart            FOR DELETE TO anon, authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "anon_delete_notifications"      ON notifications        FOR DELETE TO anon, authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ============================================================
-- PART 7: DATABASE FUNCTIONS & TRIGGERS
-- ============================================================

-- 7A) Auto-update leave balance when approved
CREATE OR REPLACE FUNCTION update_leave_balance_on_approve()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'مقبول' AND (OLD.status IS NULL OR OLD.status = 'معلق') THEN
    UPDATE leave_balances
    SET used_days = used_days + NEW.days, updated_at = now()
    WHERE employee_id = NEW.employee_id
      AND leave_type = NEW.leave_type
      AND year = EXTRACT(YEAR FROM NEW.start_date)::INTEGER;

    IF NOT FOUND THEN
      INSERT INTO leave_balances (employee_id, leave_type, year, total_days, used_days)
      VALUES (
        NEW.employee_id, NEW.leave_type,
        EXTRACT(YEAR FROM NEW.start_date)::INTEGER,
        CASE
          WHEN NEW.leave_type = 'سنوية' THEN 21
          WHEN NEW.leave_type = 'مرضية' THEN 14
          WHEN NEW.leave_type = 'طارئة' THEN 5
          WHEN NEW.leave_type = 'بدون راتب' THEN 30
          WHEN NEW.leave_type = 'أمومة' THEN 60
          WHEN NEW.leave_type = 'أبوة' THEN 3
          WHEN NEW.leave_type = 'دراسية' THEN 15
          ELSE 0
        END,
        NEW.days
      );
    END IF;
  END IF;

  IF NEW.status = 'مرفوض' AND OLD.status = 'مقبول' THEN
    UPDATE leave_balances
    SET used_days = GREATEST(0, used_days - NEW.days), updated_at = now()
    WHERE employee_id = NEW.employee_id
      AND leave_type = NEW.leave_type
      AND year = EXTRACT(YEAR FROM NEW.start_date)::INTEGER;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER on_leave_status_change
    AFTER UPDATE OF status ON leave_requests
    FOR EACH ROW EXECUTE FUNCTION update_leave_balance_on_approve();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- 7B) Auto-calculate overall_rating from criteria
CREATE OR REPLACE FUNCTION update_evaluation_overall_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_score NUMERIC;
  criteria_count INTEGER;
  target_eval_id UUID;
BEGIN
  target_eval_id := COALESCE(NEW.evaluation_id, OLD.evaluation_id);

  SELECT AVG(score)::NUMERIC, COUNT(*)
  INTO avg_score, criteria_count
  FROM evaluation_criteria
  WHERE evaluation_id = target_eval_id;

  IF criteria_count > 0 THEN
    UPDATE evaluations
    SET overall_rating = ROUND(avg_score)::INTEGER,
        status = CASE WHEN criteria_count >= 6 THEN 'مكتمل' ELSE 'قيد التقييم' END,
        updated_at = now()
    WHERE id = target_eval_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER on_criteria_change
    AFTER INSERT OR UPDATE OR DELETE ON evaluation_criteria
    FOR EACH ROW EXECUTE FUNCTION update_evaluation_overall_rating();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- 7C) Notification on leave request
CREATE OR REPLACE FUNCTION notify_on_leave_request()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (employee_id, text, type, icon_name, icon_color, related_entity_type, related_entity_id)
  VALUES (
    NEW.employee_id,
    CASE
      WHEN TG_OP = 'INSERT' THEN 'تم تقديم طلب إجازة ' || NEW.leave_type || ' لمدة ' || NEW.days || ' يوم'
      WHEN NEW.status = 'مقبول' THEN 'تم قبول طلب الإجازة'
      WHEN NEW.status = 'مرفوض' THEN 'تم رفض طلب الإجازة'
      ELSE 'تحديث على طلب الإجازة'
    END,
    'leave',
    CASE WHEN NEW.status = 'مقبول' THEN 'CalendarCheck' WHEN NEW.status = 'مرفوض' THEN 'CalendarX' ELSE 'CalendarDays' END,
    CASE WHEN NEW.status = 'مقبول' THEN 'text-emerald-400' WHEN NEW.status = 'مرفوض' THEN 'text-destructive' ELSE 'text-primary' END,
    'leave_requests',
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER on_leave_request_notify
    AFTER INSERT OR UPDATE OF status ON leave_requests
    FOR EACH ROW EXECUTE FUNCTION notify_on_leave_request();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- 7D) Notification on warning
CREATE OR REPLACE FUNCTION notify_on_warning()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (employee_id, text, type, icon_name, icon_color, related_entity_type, related_entity_id)
  VALUES (
    NEW.employee_id,
    'تم إصدار إنذار ' || NEW.type || ': ' || NEW.reason,
    'warning', 'AlertTriangle', 'text-destructive',
    'warnings', NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER on_warning_notify
    AFTER INSERT ON warnings
    FOR EACH ROW EXECUTE FUNCTION notify_on_warning();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- 7E) Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN CREATE TRIGGER set_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER set_updated_at BEFORE UPDATE ON leave_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER set_updated_at BEFORE UPDATE ON leave_balances FOR EACH ROW EXECUTE FUNCTION update_updated_at(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER set_updated_at BEFORE UPDATE ON evaluations FOR EACH ROW EXECUTE FUNCTION update_updated_at(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER set_updated_at BEFORE UPDATE ON warnings FOR EACH ROW EXECUTE FUNCTION update_updated_at(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER set_updated_at BEFORE UPDATE ON job_openings FOR EACH ROW EXECUTE FUNCTION update_updated_at(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER set_updated_at BEFORE UPDATE ON applicants FOR EACH ROW EXECUTE FUNCTION update_updated_at(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER set_updated_at BEFORE UPDATE ON training_programs FOR EACH ROW EXECUTE FUNCTION update_updated_at(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER set_updated_at BEFORE UPDATE ON org_chart FOR EACH ROW EXECUTE FUNCTION update_updated_at(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ============================================================
-- PART 8: VIEWS
-- ============================================================

CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM employees WHERE status = 'نشط' OR status IS NULL) AS active_employees,
  (SELECT COUNT(*) FROM employees) AS total_employees,
  (SELECT COUNT(DISTINCT department) FROM employees) AS total_departments,
  (SELECT COUNT(*) FROM leave_requests WHERE status = 'معلق') AS pending_leaves,
  (SELECT COUNT(*) FROM warnings WHERE status = 'نشط') AS active_warnings,
  (SELECT COUNT(*) FROM evaluations WHERE status = 'قيد التقييم') AS pending_evaluations,
  (SELECT COUNT(*) FROM job_openings WHERE status = 'مفتوح') AS open_positions,
  (SELECT COUNT(*) FROM training_programs WHERE status = 'جاري') AS active_trainings;

CREATE OR REPLACE VIEW employee_summary AS
SELECT
  e.id, e.person_id, e.name, e.arabic_name, e.department,
  e.position, e.status, e.profile_picture,
  e.monthly_salary, e.currency, e.manager_id,
  m.arabic_name AS manager_name,
  (SELECT COUNT(*) FROM warnings w WHERE w.employee_id = e.id AND w.status = 'نشط') AS active_warnings,
  (SELECT COUNT(*) FROM leave_requests l WHERE l.employee_id = e.id AND l.status = 'معلق') AS pending_leaves
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;

CREATE OR REPLACE VIEW job_openings_with_counts AS
SELECT
  j.*,
  (SELECT COUNT(*) FROM applicants a WHERE a.job_opening_id = j.id) AS applicant_count,
  (SELECT COUNT(*) FROM applicants a WHERE a.job_opening_id = j.id AND a.stage = 'مقبول') AS hired_count
FROM job_openings j;

CREATE OR REPLACE VIEW training_with_counts AS
SELECT
  t.*,
  (SELECT COUNT(*) FROM training_participants tp WHERE tp.training_program_id = t.id) AS participant_count,
  (SELECT COUNT(*) FROM training_participants tp WHERE tp.training_program_id = t.id AND tp.completion_status = 'مكتمل') AS completed_count
FROM training_programs t;


-- ============================================================
-- PART 9: SEED DATA
-- ============================================================

-- Default leave balances for existing employees (2026)
INSERT INTO leave_balances (employee_id, leave_type, year, total_days, used_days)
SELECT e.id, lt.type, 2026, lt.total, 0
FROM employees e
CROSS JOIN (VALUES ('سنوية', 21), ('مرضية', 14), ('طارئة', 5), ('بدون راتب', 30)) AS lt(type, total)
WHERE (e.status = 'نشط' OR e.status IS NULL)
ON CONFLICT (employee_id, leave_type, year) DO NOTHING;

-- Departments from existing employee data
INSERT INTO departments (name, color)
SELECT DISTINCT department,
  CASE department
    WHEN 'الإدارة العليا' THEN '#8B5CF6'
    WHEN 'تقنية المعلومات' THEN '#22C55E'
    WHEN 'المالية' THEN '#3B82F6'
    WHEN 'التسويق' THEN '#06B6D4'
    WHEN 'الموارد البشرية' THEN '#EC4899'
    WHEN 'العمليات' THEN '#EF4444'
    WHEN 'المبيعات' THEN '#F59E0B'
    ELSE '#8B5CF6'
  END
FROM employees
WHERE department IS NOT NULL AND department != ''
ON CONFLICT (name) DO NOTHING;

-- Default policies
INSERT INTO policies (title, category, description, content, icon_name, status) VALUES
('سياسة الإجازات', 'إجازات', 'تنظيم أنواع الإجازات والأرصدة والإجراءات',
 E'يحق لكل موظف الحصول على 21 يوم إجازة سنوية مدفوعة الراتب.\n\nالإجازة المرضية: 14 يوم سنوياً مع تقديم تقرير طبي.\n\nالإجازة الطارئة: 5 أيام سنوياً.\n\nيجب تقديم طلب الإجازة قبل 3 أيام عمل على الأقل.\n\nلا يجوز ترحيل أكثر من 5 أيام من الإجازة السنوية للسنة التالية.',
 'Calendar', 'نشط'),
('سياسة الحضور والانصراف', 'حضور', 'ساعات العمل الرسمية والتأخير والغياب',
 E'ساعات العمل الرسمية: من 8:00 صباحاً إلى 4:00 مساءً.\n\nيُعتبر الموظف متأخراً إذا حضر بعد 8:15 صباحاً.\n\nثلاث حالات تأخير تُعادل يوم غياب.\n\nيجب إشعار المدير المباشر في حالة الغياب قبل بداية الدوام.',
 'Clock', 'نشط'),
('سياسة الرواتب والمكافآت', 'مالية', 'آلية احتساب الرواتب والعلاوات والخصومات',
 E'يتم صرف الرواتب في اليوم 25 من كل شهر.\n\nتُحتسب ساعات العمل الإضافي بمعدل 1.5 ضعف الأجر العادي.\n\nيُمنح الموظف علاوة سنوية بناءً على تقييم الأداء.',
 'Wallet', 'نشط'),
('سياسة السلوك المهني', 'سلوك', 'قواعد السلوك والتصرف داخل بيئة العمل',
 E'يلتزم الموظف بالزي الرسمي المحدد.\n\nيُحظر استخدام ممتلكات الشركة لأغراض شخصية.\n\nيجب المحافظة على سرية المعلومات.',
 'Shield', 'نشط'),
('سياسة التوظيف', 'توظيف', 'إجراءات التعيين والاختيار',
 E'تمر عملية التوظيف بمراحل: فرز أولي، مقابلة، اختبار، عرض وظيفي.\n\nفترة التجربة 3 أشهر قابلة للتمديد.',
 'Users', 'نشط')
ON CONFLICT DO NOTHING;


-- ============================================================
-- PART 10: RPC FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION get_org_tree(root_id UUID DEFAULT NULL)
RETURNS JSON AS $$
  WITH RECURSIVE tree AS (
    SELECT id, employee_id, parent_id, name, initials, position, department, color, sort_order, 0 AS depth
    FROM org_chart
    WHERE (root_id IS NULL AND parent_id IS NULL) OR id = root_id
    UNION ALL
    SELECT o.id, o.employee_id, o.parent_id, o.name, o.initials, o.position, o.department, o.color, o.sort_order, t.depth + 1
    FROM org_chart o JOIN tree t ON o.parent_id = t.id
  )
  SELECT json_agg(row_to_json(tree) ORDER BY depth, sort_order) FROM tree;
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION get_employee_leave_balance(p_employee_id TEXT, p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER)
RETURNS TABLE(leave_type TEXT, total_days INT, used_days INT, remaining_days INT) AS $$
  SELECT leave_type, total_days, used_days, (total_days - used_days) AS remaining_days
  FROM leave_balances
  WHERE employee_id = p_employee_id AND year = p_year;
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION get_department_stats()
RETURNS TABLE(department TEXT, employee_count BIGINT, avg_salary NUMERIC, active_warnings BIGINT, pending_leaves BIGINT) AS $$
  SELECT
    e.department,
    COUNT(DISTINCT e.id) AS employee_count,
    ROUND(AVG(e.monthly_salary), 0) AS avg_salary,
    (SELECT COUNT(*) FROM warnings w WHERE w.employee_id = ANY(ARRAY_AGG(e.id)) AND w.status = 'نشط') AS active_warnings,
    (SELECT COUNT(*) FROM leave_requests l WHERE l.employee_id = ANY(ARRAY_AGG(e.id)) AND l.status = 'معلق') AS pending_leaves
  FROM employees e
  WHERE e.department IS NOT NULL
  GROUP BY e.department;
$$ LANGUAGE sql;


-- ============================================================
-- DONE!
-- No existing data was modified or deleted.
-- Only new columns, tables, indexes, policies, and functions added.
-- ============================================================

-- ============================================================
-- PART 11: APPLICANTS ENHANCEMENTS (Candidate Bank & Ranking)
-- ============================================================

-- Extra columns for richer candidate profiles
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0;
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS current_company TEXT;
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'بغداد';
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('ذكر','أنثى'));
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS interview_notes TEXT;
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS is_bookmarked BOOLEAN DEFAULT false;
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'مباشر' CHECK (source IN ('مباشر','لينكدإن','إحالة موظف','موقع توظيف','أخرى'));
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS expected_salary NUMERIC;
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS salary_currency TEXT DEFAULT 'IQD';

-- Indexes for searching/filtering
CREATE INDEX IF NOT EXISTS idx_applicants_name ON applicants USING gin (to_tsvector('simple', name));
CREATE INDEX IF NOT EXISTS idx_applicants_skills ON applicants USING gin (skills);
CREATE INDEX IF NOT EXISTS idx_applicants_bookmarked ON applicants(is_bookmarked) WHERE is_bookmarked = true;
CREATE INDEX IF NOT EXISTS idx_applicants_rating ON applicants(rating DESC);

-- Storage: allow anon users to access resumes bucket (needed for anon key)
DO $$ BEGIN
  CREATE POLICY "Anon can read resumes"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'resumes');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Anon can upload resumes"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'resumes');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Anon can update resumes"
  ON storage.objects FOR UPDATE TO anon
  USING (bucket_id = 'resumes');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Anon can delete resumes"
  ON storage.objects FOR DELETE TO anon
  USING (bucket_id = 'resumes');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- View for applicants with job title
CREATE OR REPLACE VIEW applicants_with_job AS
SELECT
  a.*,
  j.title AS job_title,
  j.department AS job_department,
  j.status AS job_status
FROM applicants a
LEFT JOIN job_openings j ON a.job_opening_id = j.id;

-- ============================================================
-- PART 6: SHIFTS & SCHEDULES
-- ============================================================

-- 6A) shifts - Define named shifts with work times per day
CREATE TABLE IF NOT EXISTS shifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  grace_minutes INTEGER DEFAULT 10,
  late_to_absent_hours NUMERIC(4,1) DEFAULT 3,
  target_hours_per_day NUMERIC(4,1) DEFAULT 9,
  sunday_is_working BOOLEAN DEFAULT true,
  sunday_start TEXT DEFAULT '07:00',
  sunday_end TEXT DEFAULT '16:00',
  monday_is_working BOOLEAN DEFAULT true,
  monday_start TEXT DEFAULT '07:00',
  monday_end TEXT DEFAULT '16:00',
  tuesday_is_working BOOLEAN DEFAULT true,
  tuesday_start TEXT DEFAULT '07:00',
  tuesday_end TEXT DEFAULT '16:00',
  wednesday_is_working BOOLEAN DEFAULT true,
  wednesday_start TEXT DEFAULT '07:00',
  wednesday_end TEXT DEFAULT '16:00',
  thursday_is_working BOOLEAN DEFAULT true,
  thursday_start TEXT DEFAULT '07:00',
  thursday_end TEXT DEFAULT '16:00',
  friday_is_working BOOLEAN DEFAULT false,
  friday_start TEXT DEFAULT '07:00',
  friday_end TEXT DEFAULT '16:00',
  saturday_is_working BOOLEAN DEFAULT false,
  saturday_start TEXT DEFAULT '07:00',
  saturday_end TEXT DEFAULT '16:00',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6B) Add shift_id to employees for per-employee override
ALTER TABLE employees ADD COLUMN IF NOT EXISTS shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL;

-- 6C) Add default_shift_id to departments for per-department default
ALTER TABLE departments ADD COLUMN IF NOT EXISTS default_shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL;

-- 6D) Insert a default shift
INSERT INTO shifts (name, description, is_default, grace_minutes, late_to_absent_hours, target_hours_per_day,
  sunday_is_working, sunday_start, sunday_end,
  monday_is_working, monday_start, monday_end,
  tuesday_is_working, tuesday_start, tuesday_end,
  wednesday_is_working, wednesday_start, wednesday_end,
  thursday_is_working, thursday_start, thursday_end,
  friday_is_working, friday_start, friday_end,
  saturday_is_working, saturday_start, saturday_end)
VALUES (
  'الدوام الرسمي', 'الدوام الرسمي الافتراضي - الأحد إلى الخميس', true, 10, 3, 9,
  true, '07:00', '16:00',
  true, '07:00', '16:00',
  true, '07:00', '16:00',
  true, '07:00', '16:00',
  true, '07:00', '16:00',
  false, '07:00', '16:00',
  false, '07:00', '16:00'
) ON CONFLICT (name) DO NOTHING;

-- 6E) RLS policies for shifts
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "shifts_read" ON shifts FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- PART 7: FEATURE FLAGS & CONFIGURATION ENGINE
-- ============================================================

-- 7A) system_modules — Master on/off switch for every feature
CREATE TABLE IF NOT EXISTS system_modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_key TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ar TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  is_enabled BOOLEAN DEFAULT true,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default modules
INSERT INTO system_modules (module_key, name_ar, name_en, description_ar, category, is_enabled, icon, sort_order) VALUES
  ('allowances', 'البدلات', 'Allowances', 'بدلات السكن والمواصلات والطعام وغيرها', 'payroll', false, 'Wallet', 10),
  ('deductions', 'الاستقطاعات القانونية', 'Statutory Deductions', 'ضريبة الدخل والتأمينات الاجتماعية', 'payroll', false, 'Receipt', 11),
  ('overtime_graduated', 'العمل الإضافي المتدرج', 'Graduated Overtime', 'معدلات مختلفة لأيام العمل والعطل', 'payroll', false, 'Clock', 12),
  ('end_of_service', 'مكافأة نهاية الخدمة', 'End of Service', 'حساب مكافأة نهاية الخدمة تلقائياً', 'payroll', false, 'Award', 13),
  ('loans', 'إدارة السلف', 'Loan Management', 'طلب واعتماد وتتبع السلف والأقساط', 'payroll', false, 'Banknote', 14),
  ('leave_accrual', 'استحقاق الإجازات التدريجي', 'Leave Accrual', 'استحقاق شهري بدلاً من سنوي', 'leave', false, 'CalendarPlus', 20),
  ('leave_carryover', 'ترحيل الإجازات', 'Leave Carryover', 'ترحيل الأيام غير المستخدمة للسنة التالية', 'leave', false, 'CalendarArrowUp', 21),
  ('half_day_leave', 'إجازة نصف يوم', 'Half-Day Leave', 'السماح بإجازات نصف يوم', 'leave', false, 'CalendarMinus', 22),
  ('leave_encashment', 'صرف رصيد الإجازات', 'Leave Encashment', 'صرف الإجازات غير المستخدمة نقداً', 'leave', false, 'HandCoins', 23),
  ('permissions', 'نظام الاستئذان', 'Permission/Excuse System', 'طلب تأخير أو خروج مبكر مع موافقة المدير', 'attendance', false, 'ShieldCheck', 30),
  ('public_holidays', 'العطل الرسمية', 'Public Holidays', 'تقويم العطل الرسمية — يُستثنى من حساب الغياب', 'attendance', true, 'PartyPopper', 31),
  ('contract_types', 'أنواع العقود', 'Contract Types', 'عقود دائمة ومؤقتة وجزئية ومتدربين', 'employee', false, 'FileText', 40),
  ('probation', 'فترة التجربة', 'Probation Tracking', 'تتبع فترة التجربة مع قواعد مختلفة', 'employee', false, 'UserCheck', 41),
  ('document_expiry', 'تتبع انتهاء الوثائق', 'Document Expiry', 'تنبيهات قبل انتهاء الإقامة والرخص', 'employee', false, 'FileWarning', 42),
  ('exit_process', 'إجراءات انتهاء الخدمة', 'Exit Process', 'قائمة إخلاء طرف وتسوية نهائية', 'employee', false, 'LogOut', 43),
  ('approval_workflows', 'سلاسل الموافقات', 'Approval Workflows', 'موافقات متعددة المستويات', 'employee', false, 'GitBranch', 44),
  ('notifications', 'الإشعارات', 'Notifications', 'تنبيهات داخلية وبريد إلكتروني', 'system', false, 'Bell', 50),
  ('audit_trail', 'سجل التدقيق', 'Audit Trail', 'تتبع جميع التغييرات في النظام', 'system', false, 'History', 51),
  ('self_service', 'الخدمة الذاتية للموظف', 'Employee Self-Service', 'بوابة الموظف لعرض الرواتب والإجازات', 'system', false, 'User', 52),
  ('reports_engine', 'محرك التقارير', 'Report Engine', 'إنشاء تقارير حقيقية من قاعدة البيانات', 'system', false, 'BarChart3', 53)
ON CONFLICT (module_key) DO NOTHING;

-- 7B) configurations — Key-value store for ALL business rules
CREATE TABLE IF NOT EXISTS configurations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key TEXT NOT NULL UNIQUE,
  config_value TEXT NOT NULL,
  value_type TEXT NOT NULL DEFAULT 'string',
  category TEXT NOT NULL DEFAULT 'general',
  label_ar TEXT NOT NULL,
  label_en TEXT NOT NULL,
  description_ar TEXT,
  min_value NUMERIC,
  max_value NUMERIC,
  options TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default configurations
INSERT INTO configurations (config_key, config_value, value_type, category, label_ar, label_en, description_ar, sort_order) VALUES
  -- Attendance
  ('attendance.absence_basis', '30_days', 'select', 'attendance', 'أساس حساب الغياب', 'Absence Calculation Basis', 'طريقة حساب خصم الغياب من الراتب', 1),
  ('attendance.fixed_days_per_month', '26', 'number', 'attendance', 'أيام العمل الثابتة/شهر', 'Fixed Working Days/Month', 'عدد أيام العمل المستخدم في حساب خصم الغياب', 2),
  ('attendance.noon_cutoff_minutes', '720', 'number', 'attendance', 'حد الظهيرة (دقائق)', 'Noon Cutoff (minutes)', 'إذا كانت البصمة الوحيدة بعد هذا الوقت تُعتبر خروج', 3),
  ('attendance.early_leave_threshold', '10', 'number', 'attendance', 'حد الخروج المبكر (دقائق)', 'Early Leave Threshold (min)', 'عدد الدقائق قبل نهاية الدوام لاعتبار الخروج مبكراً', 4),
  ('attendance.auto_checkout_enabled', 'true', 'boolean', 'attendance', 'تسجيل خروج تلقائي', 'Auto Checkout', 'تسجيل خروج تلقائي عند نهاية الدوام إذا لم يسجل الموظف', 5),
  -- Leave
  ('leave.annual_days', '21', 'number', 'leave', 'أيام الإجازة السنوية', 'Annual Leave Days', 'الرصيد الافتراضي للإجازات السنوية', 10),
  ('leave.sick_days', '14', 'number', 'leave', 'أيام الإجازة المرضية', 'Sick Leave Days', 'الرصيد الافتراضي للإجازات المرضية', 11),
  ('leave.emergency_days', '5', 'number', 'leave', 'أيام الإجازة الطارئة', 'Emergency Leave Days', 'الرصيد الافتراضي للإجازات الطارئة', 12),
  ('leave.unpaid_max_days', '30', 'number', 'leave', 'حد الإجازة بدون راتب', 'Unpaid Leave Max Days', 'الحد الأقصى للإجازة بدون راتب', 13),
  ('leave.maternity_days', '60', 'number', 'leave', 'أيام إجازة الأمومة', 'Maternity Leave Days', 'رصيد إجازة الأمومة', 14),
  ('leave.paternity_days', '3', 'number', 'leave', 'أيام إجازة الأبوة', 'Paternity Leave Days', 'رصيد إجازة الأبوة', 15),
  ('leave.study_days', '15', 'number', 'leave', 'أيام الإجازة الدراسية', 'Study Leave Days', 'رصيد الإجازة الدراسية', 16),
  ('leave.carryover_max_days', '5', 'number', 'leave', 'حد الترحيل', 'Max Carryover Days', 'الحد الأقصى للأيام المرحلة للسنة التالية', 17),
  ('leave.accrual_rate', '1.75', 'number', 'leave', 'معدل الاستحقاق الشهري', 'Monthly Accrual Rate', 'عدد الأيام المكتسبة شهرياً (إذا مفعّل)', 18),
  -- Payroll
  ('payroll.payment_day', '25', 'number', 'payroll', 'يوم صرف الراتب', 'Salary Payment Day', 'اليوم الذي يُصرف فيه الراتب من كل شهر', 20),
  ('payroll.overtime_weekday_rate', '1.25', 'number', 'payroll', 'معدل العمل الإضافي (أيام عمل)', 'Weekday OT Rate', 'مضاعف الساعة للعمل الإضافي أيام العمل', 21),
  ('payroll.overtime_weekend_rate', '1.5', 'number', 'payroll', 'معدل العمل الإضافي (عطلة)', 'Weekend OT Rate', 'مضاعف الساعة للعمل الإضافي أيام العطل', 22),
  ('payroll.overtime_holiday_rate', '2.0', 'number', 'payroll', 'معدل العمل الإضافي (عطلة رسمية)', 'Holiday OT Rate', 'مضاعف الساعة للعمل الإضافي العطل الرسمية', 23),
  ('payroll.currency_default', 'IQD', 'string', 'payroll', 'العملة الافتراضية', 'Default Currency', 'العملة الافتراضية للنظام', 24),
  -- Evaluation
  ('evaluation.rating_scale', '5', 'number', 'evaluation', 'مقياس التقييم', 'Rating Scale', 'أقصى درجة في مقياس التقييم (مثل 5 أو 10)', 30),
  ('evaluation.default_score', '3', 'number', 'evaluation', 'الدرجة الافتراضية', 'Default Score', 'الدرجة المبدئية عند إنشاء تقييم جديد', 31),
  -- Recruitment
  ('recruitment.weight_rating', '40', 'number', 'recruitment', 'وزن التقييم %', 'Rating Weight %', 'نسبة التقييم في حساب الترتيب', 40),
  ('recruitment.weight_stage', '20', 'number', 'recruitment', 'وزن المرحلة %', 'Stage Weight %', 'نسبة المرحلة في حساب الترتيب', 41),
  ('recruitment.weight_experience', '25', 'number', 'recruitment', 'وزن الخبرة %', 'Experience Weight %', 'نسبة الخبرة في حساب الترتيب', 42),
  ('recruitment.weight_skills', '15', 'number', 'recruitment', 'وزن المهارات %', 'Skills Weight %', 'نسبة المهارات في حساب الترتيب', 43),
  ('recruitment.max_experience_years', '15', 'number', 'recruitment', 'حد الخبرة الأقصى', 'Max Experience Years', 'أقصى سنوات خبرة تحتسب في الترتيب', 44),
  -- Document Expiry
  ('document_expiry.alert_days_before', '30', 'number', 'employee', 'أيام التنبيه قبل الانتهاء', 'Alert Days Before Expiry', 'عدد الأيام لإرسال تنبيه قبل انتهاء الوثيقة', 50),
  -- Probation
  ('probation.default_duration_days', '90', 'number', 'employee', 'مدة التجربة الافتراضية (يوم)', 'Default Probation Duration', 'فترة التجربة الافتراضية بالأيام', 51),
  -- Training
  ('training.annual_hours_target', '40', 'number', 'training', 'الساعات التدريبية السنوية', 'Annual Training Hours', 'الحد الأدنى المطلوب من ساعات التدريب سنوياً', 60)
ON CONFLICT (config_key) DO NOTHING;

-- 7C) public_holidays — Holiday calendar
CREATE TABLE IF NOT EXISTS public_holidays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  date DATE NOT NULL,
  year INTEGER GENERATED ALWAYS AS (EXTRACT(YEAR FROM date)::INTEGER) STORED,
  is_recurring BOOLEAN DEFAULT false,
  recurring_month INTEGER,
  recurring_day INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for fast date lookups
CREATE INDEX IF NOT EXISTS idx_public_holidays_date ON public_holidays(date);
CREATE INDEX IF NOT EXISTS idx_public_holidays_year ON public_holidays(year);

-- Seed some common Iraqi holidays for 2026
INSERT INTO public_holidays (name_ar, name_en, date, is_recurring, recurring_month, recurring_day) VALUES
  ('رأس السنة الميلادية', 'New Year', '2026-01-01', true, 1, 1),
  ('عيد الجيش العراقي', 'Iraqi Army Day', '2026-01-06', true, 1, 6),
  ('عيد المرأة العالمي', 'International Women''s Day', '2026-03-08', true, 3, 8),
  ('عيد نوروز', 'Nowruz', '2026-03-21', true, 3, 21),
  ('عيد العمال', 'Labour Day', '2026-05-01', true, 5, 1),
  ('يوم الجمهورية', 'Republic Day', '2026-07-14', true, 7, 14),
  ('عيد الاستقلال', 'Independence Day', '2026-10-03', true, 10, 3),
  ('المولد النبوي الشريف', 'Prophet''s Birthday', '2026-09-16', false, null, null),
  ('عيد الفطر - اليوم الأول', 'Eid al-Fitr Day 1', '2026-03-30', false, null, null),
  ('عيد الفطر - اليوم الثاني', 'Eid al-Fitr Day 2', '2026-03-31', false, null, null),
  ('عيد الفطر - اليوم الثالث', 'Eid al-Fitr Day 3', '2026-04-01', false, null, null),
  ('عيد الأضحى - اليوم الأول', 'Eid al-Adha Day 1', '2026-06-06', false, null, null),
  ('عيد الأضحى - اليوم الثاني', 'Eid al-Adha Day 2', '2026-06-07', false, null, null),
  ('عيد الأضحى - اليوم الثالث', 'Eid al-Adha Day 3', '2026-06-08', false, null, null),
  ('عيد الأضحى - اليوم الرابع', 'Eid al-Adha Day 4', '2026-06-09', false, null, null)
ON CONFLICT DO NOTHING;

-- RLS
ALTER TABLE system_modules ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "system_modules_read" ON system_modules FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "system_modules_write" ON system_modules FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE configurations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "configurations_read" ON configurations FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "configurations_write" ON configurations FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public_holidays ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "public_holidays_read" ON public_holidays FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "public_holidays_write" ON public_holidays FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "shifts_write" ON shifts FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- PART 7B: POSITIONS HIERARCHY & SHIFT ASSIGNMENTS
-- ============================================================

-- 7B-A) positions — Organisational positions with tree hierarchy
CREATE TABLE IF NOT EXISTS positions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title_ar TEXT NOT NULL,
  title_en TEXT,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  reports_to_position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
  level INTEGER DEFAULT 0,
  max_headcount INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7B-B) Add position_id and direct_manager_id to employees
ALTER TABLE employees ADD COLUMN IF NOT EXISTS position_id UUID REFERENCES positions(id) ON DELETE SET NULL;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS direct_manager_id TEXT REFERENCES employees(id) ON DELETE SET NULL;

-- 7B-C) employee_shift_assignments — many-to-many between employees and shifts with date ranges
CREATE TABLE IF NOT EXISTS employee_shift_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, shift_id, start_date)
);

-- 7B-D) RLS for positions and shift assignments
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "positions_read" ON positions FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "positions_write" ON positions FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE employee_shift_assignments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "shift_assignments_read" ON employee_shift_assignments FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "shift_assignments_write" ON employee_shift_assignments FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ============================================================
-- PART 8: PHASE 2 — COMPENSATION & PAYROLL ENHANCEMENT
-- ============================================================

-- 8A) allowance_types — Define allowance categories
CREATE TABLE IF NOT EXISTS allowance_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ar TEXT NOT NULL UNIQUE,
  name_en TEXT,
  calc_method TEXT NOT NULL DEFAULT 'fixed',
  default_amount NUMERIC(12,2) DEFAULT 0,
  percentage_of TEXT DEFAULT 'base_salary',
  is_taxable BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8B) employee_allowances — Per-employee allowance assignments
CREATE TABLE IF NOT EXISTS employee_allowances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  allowance_type_id UUID NOT NULL REFERENCES allowance_types(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'IQD',
  is_active BOOLEAN DEFAULT true,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, allowance_type_id, currency)
);

-- 8C) deduction_types — Define statutory/custom deduction categories
CREATE TABLE IF NOT EXISTS deduction_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ar TEXT NOT NULL UNIQUE,
  name_en TEXT,
  calc_method TEXT NOT NULL DEFAULT 'fixed',
  default_amount NUMERIC(12,2) DEFAULT 0,
  default_percentage NUMERIC(6,3) DEFAULT 0,
  percentage_of TEXT DEFAULT 'gross_salary',
  is_mandatory BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8D) employee_deductions — Per-employee deduction assignments
CREATE TABLE IF NOT EXISTS employee_deductions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  deduction_type_id UUID NOT NULL REFERENCES deduction_types(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) DEFAULT 0,
  percentage NUMERIC(6,3) DEFAULT 0,
  calc_method TEXT DEFAULT 'fixed',
  currency TEXT DEFAULT 'IQD',
  is_active BOOLEAN DEFAULT true,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, deduction_type_id, currency)
);

-- 8E) loans — Loan management
CREATE TABLE IF NOT EXISTS loans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  loan_amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'IQD',
  installment_amount NUMERIC(12,2) NOT NULL,
  total_installments INTEGER NOT NULL,
  paid_installments INTEGER DEFAULT 0,
  remaining_amount NUMERIC(12,2) NOT NULL,
  interest_rate NUMERIC(5,2) DEFAULT 0,
  status TEXT DEFAULT 'active',
  reason TEXT,
  approved_by TEXT,
  approved_date DATE,
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8F) Add EOS-related columns to employees
ALTER TABLE employees ADD COLUMN IF NOT EXISTS contract_type TEXT DEFAULT 'permanent';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS probation_end_date DATE;

-- 8G) Seed common allowance types
INSERT INTO allowance_types (name_ar, name_en, calc_method, default_amount, is_taxable, sort_order) VALUES
  ('بدل سكن', 'Housing Allowance', 'fixed', 0, false, 1),
  ('بدل مواصلات', 'Transportation Allowance', 'fixed', 0, false, 2),
  ('بدل طعام', 'Food Allowance', 'fixed', 0, false, 3),
  ('بدل هاتف', 'Phone Allowance', 'fixed', 0, true, 4),
  ('بدل خطورة', 'Hazard Allowance', 'percentage', 0, true, 5),
  ('بدل تمثيل', 'Representation Allowance', 'fixed', 0, true, 6)
ON CONFLICT (name_ar) DO NOTHING;

-- 8H) Seed common deduction types
INSERT INTO deduction_types (name_ar, name_en, calc_method, default_percentage, percentage_of, is_mandatory, sort_order) VALUES
  ('ضريبة الدخل', 'Income Tax', 'percentage', 0, 'gross_salary', true, 1),
  ('التأمينات الاجتماعية', 'Social Security', 'percentage', 5, 'base_salary', true, 2),
  ('التأمين الصحي', 'Health Insurance', 'fixed', 0, 'base_salary', false, 3),
  ('صندوق التقاعد', 'Pension Fund', 'percentage', 0, 'base_salary', false, 4),
  ('استقطاع نقابي', 'Union Dues', 'fixed', 0, 'base_salary', false, 5)
ON CONFLICT (name_ar) DO NOTHING;

-- RLS
ALTER TABLE allowance_types ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "allowance_types_all" ON allowance_types FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE employee_allowances ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "employee_allowances_all" ON employee_allowances FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE deduction_types ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "deduction_types_all" ON deduction_types FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE employee_deductions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "employee_deductions_all" ON employee_deductions FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "loans_all" ON loans FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ══════════════════════════════════════════════════════════════
-- PART 9 — Phase 3: Leave & Attendance Enhancement
-- ══════════════════════════════════════════════════════════════

-- 9A) leave_types — configurable leave types (replaces hardcoded CHECK constraint)
CREATE TABLE IF NOT EXISTS leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT,
  code TEXT NOT NULL UNIQUE,
  is_paid BOOLEAN NOT NULL DEFAULT true,
  default_days_per_year INT NOT NULL DEFAULT 0,
  max_days_per_request INT,
  min_days_per_request NUMERIC(3,1) DEFAULT 0.5,
  allow_half_day BOOLEAN NOT NULL DEFAULT false,
  requires_attachment BOOLEAN NOT NULL DEFAULT false,
  attachment_after_days INT,
  gender_restriction TEXT CHECK (gender_restriction IN ('male','female',NULL)),
  min_service_months INT DEFAULT 0,
  is_carryover_allowed BOOLEAN NOT NULL DEFAULT false,
  max_carryover_days INT DEFAULT 0,
  carryover_expiry_months INT DEFAULT 3,
  is_encashable BOOLEAN NOT NULL DEFAULT false,
  encashment_percentage NUMERIC(5,2) DEFAULT 100,
  accrual_method TEXT NOT NULL DEFAULT 'annual' CHECK (accrual_method IN ('annual','monthly','none')),
  color TEXT DEFAULT '#3b82f6',
  icon TEXT DEFAULT 'calendar',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9B) leave_policies — per-department or per-contract overrides for leave days
CREATE TABLE IF NOT EXISTS leave_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
  scope TEXT NOT NULL DEFAULT 'global' CHECK (scope IN ('global','department','contract_type')),
  scope_value TEXT,
  days_per_year INT NOT NULL,
  max_days_per_request INT,
  allow_half_day BOOLEAN,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (leave_type_id, scope, scope_value)
);

-- 9C) leave_accruals — tracks monthly accrual credits
CREATE TABLE IF NOT EXISTS leave_accruals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
  year INT NOT NULL,
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  accrued_days NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (employee_id, leave_type_id, year, month)
);

-- 9D) leave_permissions — time-limited permission slips (2-3 hours off)
CREATE TABLE IF NOT EXISTS leave_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  hours NUMERIC(4,2) NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'معلق' CHECK (status IN ('معلق','مقبول','مرفوض')),
  approved_by TEXT REFERENCES employees(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9E) Alter leave_requests to support half-day and link to leave_types
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS leave_type_id UUID REFERENCES leave_types(id);
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS is_half_day BOOLEAN DEFAULT false;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS half_day_period TEXT CHECK (half_day_period IN ('morning','afternoon',NULL));
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- 9F) Alter leave_balances to link to leave_types and add carryover
ALTER TABLE leave_balances ADD COLUMN IF NOT EXISTS leave_type_id UUID REFERENCES leave_types(id);
ALTER TABLE leave_balances ADD COLUMN IF NOT EXISTS carryover_days NUMERIC(5,2) DEFAULT 0;
ALTER TABLE leave_balances ADD COLUMN IF NOT EXISTS accrued_days NUMERIC(5,2) DEFAULT 0;

-- Seed default leave types
INSERT INTO leave_types (name_ar, name_en, code, is_paid, default_days_per_year, allow_half_day, requires_attachment, attachment_after_days, accrual_method, is_carryover_allowed, max_carryover_days, carryover_expiry_months, is_encashable, encashment_percentage, color, sort_order) VALUES
  ('سنوية', 'Annual', 'annual', true, 21, true, false, NULL, 'monthly', true, 5, 3, true, 100, '#3b82f6', 1),
  ('مرضية', 'Sick', 'sick', true, 14, true, true, 2, 'annual', false, 0, 0, false, 0, '#ef4444', 2),
  ('طارئة', 'Emergency', 'emergency', true, 5, false, false, NULL, 'annual', false, 0, 0, false, 0, '#f59e0b', 3),
  ('بدون راتب', 'Unpaid', 'unpaid', false, 30, true, false, NULL, 'none', false, 0, 0, false, 0, '#6b7280', 4),
  ('أمومة', 'Maternity', 'maternity', true, 60, false, true, 0, 'none', false, 0, 0, false, 0, '#ec4899', 5),
  ('أبوة', 'Paternity', 'paternity', true, 3, false, false, NULL, 'none', false, 0, 0, false, 0, '#8b5cf6', 6),
  ('دراسية', 'Study', 'study', true, 15, false, true, 0, 'none', false, 0, 0, false, 0, '#06b6d4', 7)
ON CONFLICT (code) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leave_types_active ON leave_types(is_active);
CREATE INDEX IF NOT EXISTS idx_leave_policies_type ON leave_policies(leave_type_id);
CREATE INDEX IF NOT EXISTS idx_leave_accruals_emp ON leave_accruals(employee_id, year);
CREATE INDEX IF NOT EXISTS idx_leave_permissions_emp ON leave_permissions(employee_id, date);

-- RLS
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "leave_types_all" ON leave_types FOR ALL TO anon, authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE leave_policies ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "leave_policies_all" ON leave_policies FOR ALL TO anon, authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE leave_accruals ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "leave_accruals_all" ON leave_accruals FOR ALL TO anon, authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE leave_permissions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "leave_permissions_all" ON leave_permissions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ══════════════════════════════════════════════════════════════
-- PART 10 — Phase 4: Employee Lifecycle & Compliance
-- ══════════════════════════════════════════════════════════════

-- 10A) contract_types — configurable contract types
CREATE TABLE IF NOT EXISTS contract_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  default_duration_months INT,
  is_renewable BOOLEAN NOT NULL DEFAULT true,
  probation_days INT NOT NULL DEFAULT 90,
  notice_period_days INT NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default contract types
INSERT INTO contract_types (name_ar, name_en, code, default_duration_months, is_renewable, probation_days, notice_period_days, sort_order) VALUES
  ('دائم', 'Permanent', 'permanent', NULL, false, 90, 30, 1),
  ('محدد المدة', 'Fixed-Term', 'fixed_term', 12, true, 90, 30, 2),
  ('تجربة', 'Probation', 'probation', 3, false, 90, 7, 3),
  ('مؤقت', 'Temporary', 'temporary', 6, true, 30, 14, 4),
  ('جزئي', 'Part-Time', 'part_time', NULL, false, 60, 14, 5),
  ('استشاري', 'Consultant', 'consultant', 12, true, 0, 30, 6)
ON CONFLICT (code) DO NOTHING;

-- 10B) employee_contracts — contract lifecycle tracking
CREATE TABLE IF NOT EXISTS employee_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  contract_type_id UUID NOT NULL REFERENCES contract_types(id),
  contract_number TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  probation_end_date DATE,
  probation_status TEXT DEFAULT 'pending' CHECK (probation_status IN ('pending','passed','failed','waived')),
  salary_amount NUMERIC(15,2),
  salary_currency TEXT DEFAULT 'IQD',
  renewal_count INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','terminated','renewed','pending')),
  notes TEXT,
  attachment_url TEXT,
  signed_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10C) document_types — configurable document categories with expiry tracking
CREATE TABLE IF NOT EXISTS document_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT,
  code TEXT NOT NULL UNIQUE,
  has_expiry BOOLEAN NOT NULL DEFAULT false,
  expiry_warning_days INT DEFAULT 30,
  is_required BOOLEAN NOT NULL DEFAULT false,
  required_for_contract_types TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default document types
INSERT INTO document_types (name_ar, name_en, code, has_expiry, expiry_warning_days, is_required, sort_order) VALUES
  ('هوية أحوال مدنية', 'National ID', 'national_id', true, 60, true, 1),
  ('جواز سفر', 'Passport', 'passport', true, 90, false, 2),
  ('شهادة جامعية', 'University Degree', 'degree', false, 0, false, 3),
  ('شهادة خبرة', 'Experience Certificate', 'experience_cert', false, 0, false, 4),
  ('فحص طبي', 'Medical Checkup', 'medical', true, 30, true, 5),
  ('رخصة قيادة', 'Driving License', 'driving_license', true, 60, false, 6),
  ('شهادة حسن سلوك', 'Police Clearance', 'police_clearance', true, 365, false, 7),
  ('عقد العمل', 'Employment Contract', 'contract', false, 0, true, 8),
  ('إقامة', 'Residency Permit', 'residency', true, 90, false, 9),
  ('بطاقة صحية', 'Health Card', 'health_card', true, 30, false, 10)
ON CONFLICT (code) DO NOTHING;

-- 10D) employee_documents — employee document tracking with expiry
CREATE TABLE IF NOT EXISTS employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  document_type_id UUID NOT NULL REFERENCES document_types(id),
  document_number TEXT,
  issue_date DATE,
  expiry_date DATE,
  file_url TEXT,
  file_name TEXT,
  status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid','expired','expiring_soon','missing','pending_review')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10E) approval_workflows — configurable multi-step approval chains
CREATE TABLE IF NOT EXISTS approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('leave_request','loan','expense','contract','exit','salary_change','promotion')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10F) approval_workflow_steps — individual steps in a workflow
CREATE TABLE IF NOT EXISTS approval_workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
  step_order INT NOT NULL,
  approver_type TEXT NOT NULL CHECK (approver_type IN ('direct_manager','department_head','hr','ceo','specific_employee','role')),
  approver_id TEXT REFERENCES employees(id),
  approver_role TEXT,
  can_skip BOOLEAN DEFAULT false,
  auto_approve_after_days INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (workflow_id, step_order)
);

-- 10G) approval_requests — individual approval instances
CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES approval_workflows(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  requested_by TEXT NOT NULL REFERENCES employees(id),
  current_step INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','approved','rejected','cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10H) approval_actions — audit log of approval/rejection actions
CREATE TABLE IF NOT EXISTS approval_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_request_id UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
  step_order INT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('approved','rejected','returned','skipped')),
  acted_by TEXT NOT NULL REFERENCES employees(id),
  comment TEXT,
  acted_at TIMESTAMPTZ DEFAULT now()
);

-- 10I) exit_checklists — configurable exit process steps
CREATE TABLE IF NOT EXISTS exit_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general','it','finance','hr','admin','custodies')),
  responsible_role TEXT DEFAULT 'hr',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default exit checklist items
INSERT INTO exit_checklist_items (name_ar, name_en, category, responsible_role, sort_order) VALUES
  ('تسليم العهد والممتلكات', 'Return Company Property', 'custodies', 'admin', 1),
  ('تسليم اللابتوب والأجهزة', 'Return Laptop & Devices', 'it', 'it', 2),
  ('إلغاء صلاحيات النظام', 'Revoke System Access', 'it', 'it', 3),
  ('إلغاء البريد الإلكتروني', 'Deactivate Email', 'it', 'it', 4),
  ('تسوية السلف والقروض', 'Settle Loans & Advances', 'finance', 'finance', 5),
  ('صرف المستحقات النهائية', 'Final Settlement Payment', 'finance', 'finance', 6),
  ('شهادة خبرة', 'Experience Certificate', 'hr', 'hr', 7),
  ('مقابلة نهاية الخدمة', 'Exit Interview', 'hr', 'hr', 8),
  ('تسليم بطاقة العمل', 'Return Work ID Badge', 'admin', 'admin', 9),
  ('تحديث ملف الموظف', 'Update Employee File', 'hr', 'hr', 10)
ON CONFLICT DO NOTHING;

-- 10J) employee_exit_processes — tracks an employee's exit
CREATE TABLE IF NOT EXISTS employee_exit_processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  exit_type TEXT NOT NULL DEFAULT 'resignation' CHECK (exit_type IN ('resignation','termination','contract_end','retirement','mutual','death')),
  exit_date DATE NOT NULL,
  last_working_day DATE,
  reason TEXT,
  notice_date DATE,
  notice_period_days INT,
  eos_amount NUMERIC(15,2),
  eos_currency TEXT DEFAULT 'IQD',
  final_settlement_amount NUMERIC(15,2),
  status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated','in_progress','clearance','settlement','completed','cancelled')),
  approved_by TEXT REFERENCES employees(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10K) employee_exit_checklist — tracks completion of exit items per employee
CREATE TABLE IF NOT EXISTS employee_exit_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exit_process_id UUID NOT NULL REFERENCES employee_exit_processes(id) ON DELETE CASCADE,
  checklist_item_id UUID NOT NULL REFERENCES exit_checklist_items(id),
  is_completed BOOLEAN DEFAULT false,
  completed_by TEXT REFERENCES employees(id),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (exit_process_id, checklist_item_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contract_types_active ON contract_types(is_active);
CREATE INDEX IF NOT EXISTS idx_employee_contracts_emp ON employee_contracts(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_contracts_status ON employee_contracts(status);
CREATE INDEX IF NOT EXISTS idx_document_types_active ON document_types(is_active);
CREATE INDEX IF NOT EXISTS idx_employee_documents_emp ON employee_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_expiry ON employee_documents(expiry_date);
CREATE INDEX IF NOT EXISTS idx_approval_requests_entity ON approval_requests(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_exit_processes_emp ON employee_exit_processes(employee_id);
CREATE INDEX IF NOT EXISTS idx_exit_processes_status ON employee_exit_processes(status);

-- RLS
ALTER TABLE contract_types ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "contract_types_all" ON contract_types FOR ALL TO anon, authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE employee_contracts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "employee_contracts_all" ON employee_contracts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "document_types_all" ON document_types FOR ALL TO anon, authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "employee_documents_all" ON employee_documents FOR ALL TO anon, authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "approval_workflows_all" ON approval_workflows FOR ALL TO anon, authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE approval_workflow_steps ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "approval_steps_all" ON approval_workflow_steps FOR ALL TO anon, authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "approval_requests_all" ON approval_requests FOR ALL TO anon, authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE approval_actions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "approval_actions_all" ON approval_actions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE exit_checklist_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "exit_checklist_items_all" ON exit_checklist_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE employee_exit_processes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "exit_processes_all" ON employee_exit_processes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE employee_exit_checklist ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "exit_checklist_all" ON employee_exit_checklist FOR ALL TO anon, authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- PART 11 — Phase 5: Notifications, Audit Trail & Report Templates
-- ============================================================

-- 11A) notifications — upgrade old table to full notification center
DROP TABLE IF EXISTS notifications;
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info','warning','success','error','action')),
  category TEXT NOT NULL DEFAULT 'system' CHECK (category IN ('system','leave','attendance','payroll','contract','document','approval','exit','recruitment','training')),
  entity_type TEXT,
  entity_id TEXT,
  target_employee_id TEXT REFERENCES employees(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_target ON notifications(target_employee_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);

-- 11B) audit_log — comprehensive action audit trail
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL CHECK (action IN ('create','update','delete','approve','reject','login','export','import','status_change','configuration_change')),
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  entity_label TEXT,
  actor_name TEXT NOT NULL DEFAULT 'النظام',
  actor_employee_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_employee_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);

-- 11C) report_templates — configurable report definitions
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('attendance','payroll','leave','employee','contract','document','recruitment','training','warnings','custom')),
  data_source TEXT NOT NULL,
  columns JSONB NOT NULL DEFAULT '[]',
  default_filters JSONB DEFAULT '{}',
  format TEXT NOT NULL DEFAULT 'table' CHECK (format IN ('table','summary','chart','mixed')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11D) report_history — log of generated reports
CREATE TABLE IF NOT EXISTS report_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_template_id UUID REFERENCES report_templates(id) ON DELETE SET NULL,
  report_name TEXT NOT NULL,
  filters_used JSONB DEFAULT '{}',
  row_count INTEGER DEFAULT 0,
  generated_by TEXT NOT NULL DEFAULT 'النظام',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_report_history_template ON report_history(report_template_id);

-- Seed report templates
INSERT INTO report_templates (name_ar, name_en, code, description, category, data_source, columns, default_filters, format, sort_order) VALUES
  ('تقرير الحضور الشهري', 'Monthly Attendance Report', 'attendance_monthly',
   'ملخص حضور وغياب الموظفين خلال الشهر',
   'attendance', 'attendance_records',
   '[{"key":"employee_name","label":"الموظف"},{"key":"date","label":"التاريخ"},{"key":"check_in","label":"الحضور"},{"key":"check_out","label":"الانصراف"},{"key":"status","label":"الحالة"},{"key":"delay_minutes","label":"التأخير (دقيقة)"},{"key":"overtime_hours","label":"الإضافي (ساعة)"}]',
   '{"period":"month"}', 'table', 1),

  ('كشف الرواتب الشهري', 'Monthly Payroll Report', 'payroll_monthly',
   'تفاصيل رواتب جميع الموظفين مع البدلات والاستقطاعات',
   'payroll', 'monthly_records',
   '[{"key":"employee_name","label":"الموظف"},{"key":"department","label":"القسم"},{"key":"basic_salary","label":"الراتب الأساسي"},{"key":"allowances","label":"البدلات"},{"key":"deductions","label":"الاستقطاعات"},{"key":"net_salary","label":"الصافي"}]',
   '{"period":"month"}', 'table', 2),

  ('تقرير أرصدة الإجازات', 'Leave Balances Report', 'leave_balances',
   'أرصدة الإجازات لجميع الموظفين والطلبات المعلقة',
   'leave', 'leave_balances',
   '[{"key":"employee_name","label":"الموظف"},{"key":"leave_type","label":"نوع الإجازة"},{"key":"entitlement","label":"الاستحقاق"},{"key":"used","label":"المستخدم"},{"key":"remaining","label":"المتبقي"},{"key":"carryover","label":"المرحّل"}]',
   '{}', 'table', 3),

  ('تقرير الموظفين الشامل', 'Comprehensive Employee Report', 'employee_master',
   'بيانات جميع الموظفين وحالاتهم الوظيفية',
   'employee', 'employees',
   '[{"key":"name","label":"الاسم"},{"key":"arabic_name","label":"الاسم العربي"},{"key":"department","label":"القسم"},{"key":"position","label":"المنصب"},{"key":"join_date","label":"تاريخ التعيين"},{"key":"monthly_salary","label":"الراتب"},{"key":"status","label":"الحالة"}]',
   '{}', 'table', 4),

  ('تقرير العقود', 'Contracts Report', 'contracts_status',
   'حالة عقود الموظفين وتواريخ الانتهاء',
   'contract', 'employee_contracts',
   '[{"key":"employee_name","label":"الموظف"},{"key":"contract_type","label":"نوع العقد"},{"key":"start_date","label":"البداية"},{"key":"end_date","label":"النهاية"},{"key":"status","label":"الحالة"},{"key":"probation_status","label":"التجربة"}]',
   '{}', 'table', 5),

  ('تقرير الوثائق المنتهية', 'Expiring Documents Report', 'documents_expiry',
   'الوثائق المنتهية أو القريبة من الانتهاء',
   'document', 'employee_documents',
   '[{"key":"employee_name","label":"الموظف"},{"key":"document_type","label":"نوع الوثيقة"},{"key":"document_number","label":"الرقم"},{"key":"expiry_date","label":"تاريخ الانتهاء"},{"key":"status","label":"الحالة"}]',
   '{"status":"expiring"}', 'table', 6),

  ('تقرير الإنذارات', 'Warnings Report', 'warnings_summary',
   'ملخص الإنذارات الصادرة والمخالفات',
   'warnings', 'warnings',
   '[{"key":"employee_name","label":"الموظف"},{"key":"type","label":"نوع الإنذار"},{"key":"reason","label":"السبب"},{"key":"date","label":"التاريخ"},{"key":"severity","label":"الدرجة"}]',
   '{}', 'table', 7),

  ('تقرير التوظيف', 'Recruitment Report', 'recruitment_status',
   'حالة الوظائف الشاغرة والمتقدمين',
   'recruitment', 'job_openings',
   '[{"key":"title","label":"المنصب"},{"key":"department","label":"القسم"},{"key":"applicant_count","label":"المتقدمين"},{"key":"status","label":"الحالة"},{"key":"posted_date","label":"تاريخ النشر"}]',
   '{}', 'summary', 8),

  ('تقرير التدريب', 'Training Report', 'training_progress',
   'ساعات التدريب ونسب الإنجاز للبرامج',
   'training', 'training_programs',
   '[{"key":"title","label":"البرنامج"},{"key":"department","label":"القسم"},{"key":"participants","label":"المشاركون"},{"key":"completed","label":"المكتملون"},{"key":"hours","label":"الساعات"},{"key":"status","label":"الحالة"}]',
   '{}', 'summary', 9)
ON CONFLICT (code) DO NOTHING;

-- RLS for new tables
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "notifications_all" ON notifications FOR ALL TO anon, authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "audit_log_all" ON audit_log FOR ALL TO anon, authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "report_templates_all" ON report_templates FOR ALL TO anon, authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE report_history ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "report_history_all" ON report_history FOR ALL TO anon, authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- PART 12: CONFIGURABLE BUSINESS RULES — NO HARD-CODED VALUES
-- ============================================================
-- Every business rule, threshold, formula parameter, and scoring
-- weight is stored in the configurations table so the HR admin
-- can change them without touching code.

-- 12A) Attendance & Payroll engine settings
INSERT INTO configurations (config_key, config_value, value_type, category, label_ar, label_en, description_ar, min_value, max_value, sort_order) VALUES
  ('attendance.target_hours_per_day', '9', 'number', 'attendance', 'ساعات العمل المستهدفة/يوم', 'Target Working Hours/Day', 'عدد ساعات العمل المطلوبة يومياً', 1, 24, 6),
  ('attendance.grace_minutes', '10', 'number', 'attendance', 'فترة السماح (دقائق)', 'Grace Period (minutes)', 'فترة السماح بعد وقت بداية الدوام قبل احتساب التأخير', 0, 120, 7),
  ('attendance.late_to_absent_hours', '3', 'number', 'attendance', 'حد التأخير للغياب (ساعات)', 'Late-to-Absent Threshold (hours)', 'عدد ساعات التأخير التي تحول الحالة من متأخر إلى غائب', 1, 8, 8),
  ('attendance.noon_cutoff_enabled', 'true', 'boolean', 'attendance', 'تفعيل حد الظهيرة', 'Enable Noon Cutoff', 'إذا كانت البصمة الوحيدة بعد الظهر تُعتبر خروج بدلاً من دخول', null, null, 9)
ON CONFLICT (config_key) DO NOTHING;

-- 12B) End-of-Service (EOS) formula parameters
INSERT INTO configurations (config_key, config_value, value_type, category, label_ar, label_en, description_ar, min_value, max_value, sort_order) VALUES
  ('payroll.eos_tier1_years', '5', 'number', 'payroll', 'نهاية الخدمة: سنوات المرحلة الأولى', 'EOS Tier 1 Years', 'عدد السنوات الأولى التي يُحتسب فيها نصف راتب عن كل سنة', 1, 30, 25),
  ('payroll.eos_tier1_rate', '0.5', 'number', 'payroll', 'نهاية الخدمة: معدل المرحلة الأولى', 'EOS Tier 1 Rate', 'نسبة الراتب الشهري عن كل سنة في المرحلة الأولى (0.5 = نصف راتب)', 0, 2, 26),
  ('payroll.eos_tier2_rate', '1.0', 'number', 'payroll', 'نهاية الخدمة: معدل المرحلة الثانية', 'EOS Tier 2 Rate', 'نسبة الراتب الشهري عن كل سنة بعد المرحلة الأولى (1.0 = راتب كامل)', 0, 3, 27),
  ('payroll.eos_min_years', '1', 'number', 'payroll', 'نهاية الخدمة: الحد الأدنى للسنوات', 'EOS Minimum Years', 'الحد الأدنى لسنوات الخدمة لاستحقاق مكافأة نهاية الخدمة', 0, 10, 28),
  ('payroll.negative_salary_protection', 'true', 'boolean', 'payroll', 'حماية الراتب من السالب', 'Negative Salary Protection', 'منع أن يكون صافي الراتب بالسالب (الحد الأدنى = 0)', null, null, 29)
ON CONFLICT (config_key) DO NOTHING;

-- 12C) Risk Scorecard thresholds
INSERT INTO configurations (config_key, config_value, value_type, category, label_ar, label_en, description_ar, min_value, max_value, sort_order) VALUES
  -- Document expiry risk
  ('risk.expired_docs_critical_threshold', '5', 'number', 'risk', 'حد الوثائق المنتهية (حرج)', 'Expired Docs Critical Threshold', 'عدد الوثائق المنتهية لتصنيف المخاطر كحرجة', 1, 100, 70),
  ('risk.expired_docs_critical_points', '25', 'number', 'risk', 'نقاط وثائق منتهية (حرج)', 'Expired Docs Critical Points', 'نقاط المخاطر عند تجاوز حد الوثائق المنتهية الحرج', 0, 50, 71),
  ('risk.expired_docs_high_points', '10', 'number', 'risk', 'نقاط وثائق منتهية (مرتفع)', 'Expired Docs High Points', 'نقاط المخاطر لأي عدد من الوثائق المنتهية', 0, 50, 72),
  ('risk.expiring_docs_threshold', '5', 'number', 'risk', 'حد الوثائق القريبة الانتهاء', 'Expiring Docs Threshold', 'عدد الوثائق القريبة الانتهاء للتصنيف المتوسط', 1, 100, 73),
  ('risk.expiring_docs_medium_points', '15', 'number', 'risk', 'نقاط وثائق قريبة الانتهاء (متوسط)', 'Expiring Docs Medium Points', 'نقاط المخاطر عند تجاوز حد الوثائق القريبة الانتهاء', 0, 50, 74),
  ('risk.expiring_docs_low_points', '5', 'number', 'risk', 'نقاط وثائق قريبة الانتهاء (منخفض)', 'Expiring Docs Low Points', 'نقاط المخاطر لأي عدد من الوثائق القريبة الانتهاء', 0, 50, 75),
  -- Contract expiry risk
  ('risk.expiring_contracts_points', '15', 'number', 'risk', 'نقاط عقود قريبة الانتهاء', 'Expiring Contracts Points', 'نقاط المخاطر لعقود قريبة الانتهاء', 0, 50, 76),
  -- Warning risk
  ('risk.warnings_critical_threshold', '10', 'number', 'risk', 'حد الإنذارات (حرج)', 'Warnings Critical Threshold', 'عدد الإنذارات النشطة لتصنيف حرج', 1, 100, 77),
  ('risk.warnings_critical_points', '20', 'number', 'risk', 'نقاط إنذارات (حرج)', 'Warnings Critical Points', 'نقاط المخاطر للإنذارات الحرجة', 0, 50, 78),
  ('risk.warnings_medium_threshold', '3', 'number', 'risk', 'حد الإنذارات (متوسط)', 'Warnings Medium Threshold', 'عدد الإنذارات النشطة لتصنيف متوسط', 1, 50, 79),
  ('risk.warnings_medium_points', '10', 'number', 'risk', 'نقاط إنذارات (متوسط)', 'Warnings Medium Points', 'نقاط المخاطر للإنذارات المتوسطة', 0, 50, 80),
  ('risk.warnings_low_points', '5', 'number', 'risk', 'نقاط إنذارات (منخفض)', 'Warnings Low Points', 'نقاط المخاطر لأي عدد إنذارات نشطة', 0, 50, 81),
  ('risk.escalation_points', '15', 'number', 'risk', 'نقاط خطر التصعيد', 'Escalation Risk Points', 'نقاط المخاطر لوجود موظفين بإنذارات متعددة', 0, 50, 82),
  ('risk.escalation_warning_count', '2', 'number', 'risk', 'عدد الإنذارات للتصعيد', 'Escalation Warning Count', 'عدد الإنذارات النشطة لموظف واحد للاعتبار تصعيد', 2, 10, 83),
  -- Absenteeism risk
  ('risk.absenteeism_high_threshold', '10', 'number', 'risk', 'حد التغيب المرتفع %', 'High Absenteeism Threshold %', 'نسبة التغيب التي تُصنف كمخاطر مرتفعة', 1, 100, 84),
  ('risk.absenteeism_high_points', '15', 'number', 'risk', 'نقاط تغيب مرتفع', 'High Absenteeism Points', 'نقاط المخاطر للتغيب المرتفع', 0, 50, 85),
  ('risk.absenteeism_medium_threshold', '5', 'number', 'risk', 'حد التغيب المتوسط %', 'Medium Absenteeism Threshold %', 'نسبة التغيب التي تُصنف كمخاطر متوسطة', 1, 100, 86),
  ('risk.absenteeism_medium_points', '8', 'number', 'risk', 'نقاط تغيب متوسط', 'Medium Absenteeism Points', 'نقاط المخاطر للتغيب المتوسط', 0, 50, 87),
  -- Turnover risk
  ('risk.turnover_critical_threshold', '20', 'number', 'risk', 'حد الدوران الحرج %', 'Critical Turnover Threshold %', 'نسبة الدوران التي تُصنف كحرجة', 1, 100, 88),
  ('risk.turnover_critical_points', '20', 'number', 'risk', 'نقاط دوران حرج', 'Critical Turnover Points', 'نقاط المخاطر للدوران الحرج', 0, 50, 89),
  ('risk.turnover_medium_threshold', '10', 'number', 'risk', 'حد الدوران المتوسط %', 'Medium Turnover Threshold %', 'نسبة الدوران التي تُصنف كمتوسطة', 1, 100, 90),
  ('risk.turnover_medium_points', '10', 'number', 'risk', 'نقاط دوران متوسط', 'Medium Turnover Points', 'نقاط المخاطر للدوران المتوسط', 0, 50, 91),
  -- Pending leaves risk
  ('risk.pending_leaves_threshold', '10', 'number', 'risk', 'حد الإجازات المعلقة', 'Pending Leaves Threshold', 'عدد الإجازات المعلقة لتسجيل نقاط مخاطر', 1, 100, 92),
  ('risk.pending_leaves_points', '5', 'number', 'risk', 'نقاط إجازات معلقة', 'Pending Leaves Points', 'نقاط المخاطر للإجازات المعلقة', 0, 50, 93),
  -- Risk level boundaries
  ('risk.level_critical', '60', 'number', 'risk', 'حد المستوى الحرج', 'Critical Level Boundary', 'النقاط التي يُصنف فوقها المستوى كحرج', 0, 100, 94),
  ('risk.level_high', '35', 'number', 'risk', 'حد المستوى المرتفع', 'High Level Boundary', 'النقاط التي يُصنف فوقها المستوى كمرتفع', 0, 100, 95),
  ('risk.level_medium', '15', 'number', 'risk', 'حد المستوى المتوسط', 'Medium Level Boundary', 'النقاط التي يُصنف فوقها المستوى كمتوسط', 0, 100, 96)
ON CONFLICT (config_key) DO NOTHING;

-- 12D) KPI display thresholds
INSERT INTO configurations (config_key, config_value, value_type, category, label_ar, label_en, description_ar, min_value, max_value, sort_order) VALUES
  ('kpi.turnover_warning_threshold', '15', 'number', 'kpi', 'حد تنبيه الدوران %', 'Turnover Warning Threshold %', 'نسبة الدوران التي تحول لون المؤشر للأحمر', 1, 100, 100),
  ('kpi.training_completion_target', '70', 'number', 'kpi', 'هدف إتمام التدريب %', 'Training Completion Target %', 'النسبة المطلوبة لإتمام التدريب (أخضر إذا تحققت)', 1, 100, 101),
  ('kpi.performance_good_threshold', '3.5', 'number', 'kpi', 'حد الأداء الجيد', 'Good Performance Threshold', 'درجة التقييم التي يتحول فوقها المؤشر للأخضر', 1, 10, 102),
  ('kpi.time_to_fill_warning_days', '30', 'number', 'kpi', 'حد تنبيه وقت التوظيف (يوم)', 'Time-to-Fill Warning Days', 'عدد الأيام التي يتحول بعدها مؤشر التوظيف للأصفر', 1, 365, 103),
  ('kpi.document_expiry_window_days', '30', 'number', 'kpi', 'نافذة انتهاء الوثائق (يوم)', 'Document Expiry Window Days', 'عدد الأيام قبل الانتهاء لعرض التنبيه', 1, 365, 104),
  ('kpi.probation_alert_days', '30', 'number', 'kpi', 'تنبيه انتهاء التجربة (يوم)', 'Probation Alert Days', 'عدد الأيام قبل انتهاء فترة التجربة لعرض التنبيه', 1, 180, 105),
  ('kpi.contract_expiry_window_days', '30', 'number', 'kpi', 'نافذة انتهاء العقود (يوم)', 'Contract Expiry Window Days', 'عدد الأيام قبل انتهاء العقد لعرض التنبيه', 1, 365, 106)
ON CONFLICT (config_key) DO NOTHING;

-- 12E) Warning & Escalation configuration
INSERT INTO configurations (config_key, config_value, value_type, category, label_ar, label_en, description_ar, options, sort_order) VALUES
  ('warnings.types', 'شفهي,كتابي أول,كتابي ثاني,كتابي نهائي,فصل', 'string', 'warnings', 'أنواع الإنذارات', 'Warning Types', 'أنواع الإنذارات مفصولة بفاصلة (من الأخف للأشد)', null, 110),
  ('warnings.statuses', 'نشط,منتهي,ملغي', 'string', 'warnings', 'حالات الإنذار', 'Warning Statuses', 'حالات الإنذار مفصولة بفاصلة', null, 111),
  ('warnings.active_status', 'نشط', 'string', 'warnings', 'حالة الإنذار النشط', 'Active Warning Status', 'القيمة التي تُعتبر إنذار نشط', null, 113)
ON CONFLICT (config_key) DO NOTHING;

INSERT INTO configurations (config_key, config_value, value_type, category, label_ar, label_en, description_ar, min_value, max_value, sort_order) VALUES
  ('warnings.escalation_count', '2', 'number', 'warnings', 'عدد الإنذارات للتصعيد', 'Escalation Count', 'عدد الإنذارات النشطة لاعتبار الموظف في خطر تصعيد', 1, 10, 112)
ON CONFLICT (config_key) DO NOTHING;

-- 12F) Training configuration
INSERT INTO configurations (config_key, config_value, value_type, category, label_ar, label_en, description_ar, options, sort_order) VALUES
  ('training.categories', 'أهداف العمل,تطوير الأعمال,المهارات التقنية,القيادة والإدارة,السلامة المهنية', 'string', 'training', 'فئات التدريب', 'Training Categories', 'فئات البرامج التدريبية مفصولة بفاصلة', null, 61),
  ('training.statuses', 'قادم,جاري,مكتمل,ملغي', 'string', 'training', 'حالات التدريب', 'Training Statuses', 'حالات البرامج التدريبية مفصولة بفاصلة', null, 62),
  ('training.participant_statuses', 'مسجل,جاري,مكتمل,منسحب', 'string', 'training', 'حالات المشاركين', 'Participant Statuses', 'حالات المشاركين في التدريب مفصولة بفاصلة', null, 63)
ON CONFLICT (config_key) DO NOTHING;

INSERT INTO configurations (config_key, config_value, value_type, category, label_ar, label_en, description_ar, min_value, max_value, sort_order) VALUES
  ('training.default_weight', '70', 'number', 'training', 'الوزن الافتراضي %', 'Default Weight %', 'وزن التدريب الافتراضي عند إنشاء برنامج جديد', 0, 100, 64)
ON CONFLICT (config_key) DO NOTHING;

-- 12G) Employee lifecycle configuration
INSERT INTO configurations (config_key, config_value, value_type, category, label_ar, label_en, description_ar, options, sort_order) VALUES
  ('lifecycle.exit_types', 'resignation:استقالة,termination:إنهاء خدمة,contract_end:انتهاء عقد,retirement:تقاعد,mutual:اتفاق متبادل,death:وفاة', 'string', 'lifecycle', 'أنواع إنهاء الخدمة', 'Exit Types', 'أنواع إنهاء الخدمة بصيغة key:label مفصولة بفاصلة', null, 120),
  ('lifecycle.exit_checklist_categories', 'general:عام,it:تقنية المعلومات,finance:المالية,hr:الموارد البشرية,admin:الإدارة,custodies:العهد', 'string', 'lifecycle', 'فئات قائمة الخروج', 'Exit Checklist Categories', 'فئات بنود قائمة التحقق للخروج بصيغة key:label مفصولة بفاصلة', null, 121),
  ('lifecycle.contract_statuses', 'active,expired,terminated,renewed,suspended', 'string', 'lifecycle', 'حالات العقود', 'Contract Statuses', 'الحالات الممكنة للعقود مفصولة بفاصلة', null, 122),
  ('lifecycle.probation_statuses', 'in_progress,passed,failed,extended', 'string', 'lifecycle', 'حالات فترة التجربة', 'Probation Statuses', 'الحالات الممكنة لفترة التجربة مفصولة بفاصلة', null, 123),
  ('lifecycle.status_labels', 'active:نشط,expired:منتهي,terminated:مُنهى,renewed:مُجدد,pending:معلق,valid:ساري,expiring_soon:قريب الانتهاء,missing:مفقود,pending_review:قيد المراجعة,initiated:بدأ,in_progress:جاري,clearance:إخلاء طرف,settlement:تسوية,completed:مكتمل,cancelled:ملغي,passed:ناجح,failed:فاشل,waived:مُعفى', 'string', 'lifecycle', 'تسميات الحالات', 'Status Labels', 'تعيين التسميات العربية لجميع حالات دورة الحياة بصيغة key:label', null, 124)
ON CONFLICT (config_key) DO NOTHING;

INSERT INTO configurations (config_key, config_value, value_type, category, label_ar, label_en, description_ar, min_value, max_value, sort_order) VALUES
  ('lifecycle.probation_alert_days', '30', 'number', 'lifecycle', 'أيام تنبيه التجربة', 'Probation Alert Days', 'عدد الأيام قبل انتهاء فترة التجربة لإظهار التنبيه', 1, 120, 125)
ON CONFLICT (config_key) DO NOTHING;

-- 12H) Leave workflow configuration
INSERT INTO configurations (config_key, config_value, value_type, category, label_ar, label_en, description_ar, options, sort_order) VALUES
  ('leave.statuses', 'pending,approved,rejected', 'string', 'leave', 'حالات طلب الإجازة', 'Leave Request Statuses', 'الحالات الممكنة لطلبات الإجازة (بالإنجليزية)', null, 19),
  ('leave.status_labels', 'معلق:pending,مقبول:approved,مرفوض:rejected', 'string', 'leave', 'تسميات حالات الإجازة', 'Leave Status Labels', 'تعيين التسميات العربية لحالات الإجازة', null, 20),
  ('leave.approved_status', 'مقبول', 'string', 'leave', 'حالة الموافقة', 'Approved Status Label', 'القيمة التي تُعتبر إجازة مقبولة في النظام', null, 21),
  ('leave.half_day_periods', 'صباحي,مسائي', 'string', 'leave', 'فترات نصف اليوم', 'Half-Day Periods', 'فترات نصف اليوم مفصولة بفاصلة', null, 22)
ON CONFLICT (config_key) DO NOTHING;

-- 12I) Employee status configuration
INSERT INTO configurations (config_key, config_value, value_type, category, label_ar, label_en, description_ar, sort_order) VALUES
  ('employee.statuses', 'نشط,إجازة,منتهي', 'string', 'employee', 'حالات الموظف', 'Employee Statuses', 'الحالات الممكنة للموظف مفصولة بفاصلة', 52),
  ('employee.active_status', 'نشط', 'string', 'employee', 'حالة الموظف النشط', 'Active Employee Status', 'القيمة التي تُعتبر موظف نشط', 53),
  ('employee.active_status_en', 'active', 'string', 'employee', 'حالة النشط (إنجليزي)', 'Active Status English', 'القيمة الإنجليزية التي تُعتبر موظف نشط', 54)
ON CONFLICT (config_key) DO NOTHING;


-- ============================================================
-- PART 13: BIOMETRIC DEVICE INTEGRATION
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

-- 13G) Insert the user's device
INSERT INTO biometric_devices (name, model, serial_number, ip_address, port, protocol, location) VALUES
  ('جهاز البصمة الرئيسي', 'DS-K1T342MFWX', 'DS-K1T342MFWX20240701V031601ENFQ1132415', '192.168.15.15', 443, 'isapi', 'المدخل الرئيسي')
ON CONFLICT (serial_number) DO NOTHING;
