-- ============================================================================
-- HR System Database Schema - Plain PostgreSQL
-- ============================================================================
-- Version:     1.0.0
-- Date:        2026-04-26
-- Description: Complete HR Management System database schema for plain
--              PostgreSQL deployments. Contains 52 tables covering employee
--              management, attendance, payroll, leave, contracts, recruitment,
--              training, evaluations, biometrics, and system configuration.
--
-- NOTE: This is the Supabase-free version. No RLS policies, no auth.uid(),
--       no Supabase-specific extensions. Uses gen_random_uuid() for UUID
--       generation (available in PostgreSQL 13+).
--
-- Usage: psql -U your_user -d your_database -f database-plain-postgresql.sql
-- ============================================================================

-- Enable pgcrypto for gen_random_uuid() on PostgreSQL < 13 (optional)
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

-- ============================================================================
-- 1. shifts - جداول الورديات / Shift Schedules
-- ============================================================================
CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_ar TEXT,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    working_hours NUMERIC(5,2),
    break_minutes INTEGER DEFAULT 0,
    friday_working BOOLEAN DEFAULT false,
    saturday_working BOOLEAN DEFAULT false,
    sunday_working BOOLEAN DEFAULT true,
    monday_working BOOLEAN DEFAULT true,
    tuesday_working BOOLEAN DEFAULT true,
    wednesday_working BOOLEAN DEFAULT true,
    thursday_working BOOLEAN DEFAULT true,
    friday_start TIME,
    friday_end TIME,
    saturday_start TIME,
    saturday_end TIME,
    sunday_start TIME,
    sunday_end TIME,
    monday_start TIME,
    monday_end TIME,
    tuesday_start TIME,
    tuesday_end TIME,
    wednesday_start TIME,
    wednesday_end TIME,
    thursday_start TIME,
    thursday_end TIME,
    grace_period_minutes INTEGER DEFAULT 0,
    auto_checkout_enabled BOOLEAN DEFAULT false,
    auto_checkout_time TIME,
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE shifts IS 'جداول الورديات - Shift schedules with per-day working hours';

-- ============================================================================
-- 2. departments - الأقسام / Departments
-- ============================================================================
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_ar TEXT,
    color TEXT,
    description TEXT,
    manager_id TEXT,
    default_shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL,
    parent_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE departments IS 'الأقسام والإدارات - Departments and divisions';

CREATE INDEX IF NOT EXISTS idx_departments_parent ON departments(parent_department_id);
CREATE INDEX IF NOT EXISTS idx_departments_active ON departments(is_active) WHERE is_active = true;

-- ============================================================================
-- 3. positions - المناصب الوظيفية / Job Positions
-- ============================================================================
CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_ar TEXT NOT NULL,
    title_en TEXT,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    reports_to_position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
    level INTEGER,
    max_headcount INTEGER,
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE positions IS 'المناصب الوظيفية - Job positions and hierarchy';

CREATE INDEX IF NOT EXISTS idx_positions_department ON positions(department_id);
CREATE INDEX IF NOT EXISTS idx_positions_reports_to ON positions(reports_to_position_id);
CREATE INDEX IF NOT EXISTS idx_positions_active ON positions(is_active) WHERE is_active = true;

-- ============================================================================
-- 4. employees - الموظفون / Employees (MAIN TABLE)
-- ============================================================================
CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    person_id INTEGER UNIQUE,
    name TEXT NOT NULL,
    arabic_name TEXT,
    department TEXT,
    position TEXT,
    position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
    manager_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
    direct_manager_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
    email TEXT,
    personal_phone TEXT,
    company_phone TEXT,
    monthly_salary NUMERIC,
    currency TEXT DEFAULT 'IQD',
    overtime_rate NUMERIC,
    overtime_enabled BOOLEAN DEFAULT false,
    allowed_late_minutes INTEGER,
    profile_picture TEXT,
    join_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'نشط',
    address TEXT,
    national_id TEXT,
    emergency_contact TEXT,
    emergency_phone TEXT,
    blood_type TEXT,
    shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL,
    device_employee_no TEXT,
    auth_user_id UUID,
    termination_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_employees_status CHECK (status IN ('نشط', 'غير نشط', 'معلق', 'مستقيل', 'مفصول', 'متقاعد')),
    CONSTRAINT chk_employees_currency CHECK (currency IN ('IQD', 'USD', 'EUR', 'GBP', 'AED', 'SAR')),
    CONSTRAINT chk_employees_blood_type CHECK (blood_type IS NULL OR blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'))
);

COMMENT ON TABLE employees IS 'الموظفون - الجدول الرئيسي / Employees - Main Table';

CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_manager ON employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_employees_direct_manager ON employees(direct_manager_id);
CREATE INDEX IF NOT EXISTS idx_employees_position_id ON employees(position_id);
CREATE INDEX IF NOT EXISTS idx_employees_shift ON employees(shift_id);
CREATE INDEX IF NOT EXISTS idx_employees_auth_user ON employees(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_employees_device_no ON employees(device_employee_no);
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(status) WHERE status = 'نشط';

-- Now add the manager_id FK on departments (deferred because employees table didn't exist yet)
ALTER TABLE departments
    ADD CONSTRAINT fk_departments_manager
    FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL;

-- ============================================================================
-- 5. attendance_records - سجلات الحضور / Attendance Records
-- ============================================================================
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    day_of_week TEXT,
    check_in_time TIME,
    check_out_time TIME,
    working_hours NUMERIC(6,2),
    overtime_hours NUMERIC(6,2),
    is_late BOOLEAN DEFAULT false,
    late_minutes INTEGER DEFAULT 0,
    is_early BOOLEAN DEFAULT false,
    status TEXT,
    auto_checkout_applied BOOLEAN DEFAULT false,
    source TEXT,
    verify_mode TEXT,
    device_employee_no TEXT,
    device_id UUID,
    excused_late BOOLEAN DEFAULT false,
    excused_absence BOOLEAN DEFAULT false,
    excused_shortfall BOOLEAN DEFAULT false,
    excuse_note TEXT,
    excused_by TEXT,
    excused_at TIMESTAMPTZ,
    breaks JSONB,
    total_break_minutes NUMERIC(6,2),
    created_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT uq_attendance_employee_date UNIQUE (employee_id, date),
    CONSTRAINT chk_attendance_status CHECK (status IS NULL OR status IN ('حاضر', 'غائب', 'متأخر', 'إجازة', 'عطلة', 'يوم عمل جزئي'))
);

COMMENT ON TABLE attendance_records IS 'سجلات الحضور والانصراف - Attendance records';

CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance_records(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance_records(status);
CREATE INDEX IF NOT EXISTS idx_attendance_late ON attendance_records(is_late) WHERE is_late = true;
CREATE INDEX IF NOT EXISTS idx_attendance_device ON attendance_records(device_id);

-- ============================================================================
-- 6. monthly_records - السجلات الشهرية / Monthly Records
-- ============================================================================
CREATE TABLE IF NOT EXISTS monthly_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    month_year TEXT NOT NULL,
    salary_calculation JSONB,
    imported_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT uq_monthly_records_emp_month UNIQUE (employee_id, month_year)
);

COMMENT ON TABLE monthly_records IS 'السجلات الشهرية للرواتب - Monthly salary records';

CREATE INDEX IF NOT EXISTS idx_monthly_records_employee ON monthly_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_monthly_records_month ON monthly_records(month_year);

-- ============================================================================
-- 7. monthly_ledgers - الدفاتر الشهرية / Monthly Ledgers
-- ============================================================================
CREATE TABLE IF NOT EXISTS monthly_ledgers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    month_year TEXT NOT NULL,
    grace_consumed_minutes NUMERIC(6,2) DEFAULT 0,
    chargeable_late_minutes NUMERIC(6,2) DEFAULT 0,
    absence_days TEXT[],
    loan_by_currency JSONB,
    tip_by_currency JSONB,
    penalty_by_currency JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT uq_monthly_ledgers_emp_month UNIQUE (employee_id, month_year)
);

COMMENT ON TABLE monthly_ledgers IS 'الدفاتر الشهرية - السلف والمكافآت والجزاءات / Monthly ledgers for loans, tips, penalties';

CREATE INDEX IF NOT EXISTS idx_monthly_ledgers_employee ON monthly_ledgers(employee_id);
CREATE INDEX IF NOT EXISTS idx_monthly_ledgers_month ON monthly_ledgers(month_year);

-- ============================================================================
-- 8. leave_types - أنواع الإجازات / Leave Types
-- ============================================================================
CREATE TABLE IF NOT EXISTS leave_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_ar TEXT NOT NULL,
    name_en TEXT,
    code TEXT UNIQUE,
    is_paid BOOLEAN DEFAULT true,
    default_days_per_year INTEGER DEFAULT 0,
    max_days_per_request INTEGER,
    min_days_per_request INTEGER DEFAULT 1,
    allow_half_day BOOLEAN DEFAULT false,
    requires_attachment BOOLEAN DEFAULT false,
    attachment_after_days INTEGER,
    gender_restriction TEXT,
    min_service_months INTEGER DEFAULT 0,
    is_carryover_allowed BOOLEAN DEFAULT false,
    max_carryover_days INTEGER DEFAULT 0,
    carryover_expiry_months INTEGER,
    is_encashable BOOLEAN DEFAULT false,
    encashment_percentage NUMERIC DEFAULT 0,
    accrual_method TEXT,
    color TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_leave_types_gender CHECK (gender_restriction IS NULL OR gender_restriction IN ('ذكر', 'أنثى')),
    CONSTRAINT chk_leave_types_accrual CHECK (accrual_method IS NULL OR accrual_method IN ('monthly', 'yearly', 'manual'))
);

COMMENT ON TABLE leave_types IS 'أنواع الإجازات - Leave types configuration';

CREATE INDEX IF NOT EXISTS idx_leave_types_active ON leave_types(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_leave_types_code ON leave_types(code);

-- ============================================================================
-- 9. leave_requests - طلبات الإجازة / Leave Requests
-- ============================================================================
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type TEXT,
    leave_type_id UUID REFERENCES leave_types(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days INTEGER,
    is_half_day BOOLEAN DEFAULT false,
    half_day_period TEXT,
    reason TEXT,
    status TEXT DEFAULT 'معلق',
    approved_by TEXT,
    rejection_reason TEXT,
    attachment_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_leave_requests_status CHECK (status IN ('معلق', 'موافق', 'مرفوض', 'ملغى')),
    CONSTRAINT chk_leave_requests_half_day CHECK (half_day_period IS NULL OR half_day_period IN ('صباحي', 'مسائي')),
    CONSTRAINT chk_leave_requests_dates CHECK (end_date >= start_date)
);

COMMENT ON TABLE leave_requests IS 'طلبات الإجازة - Leave requests';

CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_type ON leave_requests(leave_type_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_pending ON leave_requests(status) WHERE status = 'معلق';

-- ============================================================================
-- 10. leave_balances - أرصدة الإجازات / Leave Balances
-- ============================================================================
CREATE TABLE IF NOT EXISTS leave_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type TEXT,
    leave_type_id UUID REFERENCES leave_types(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    total_days INTEGER DEFAULT 0,
    used_days INTEGER DEFAULT 0,
    carryover_days INTEGER DEFAULT 0,
    accrued_days INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT uq_leave_balances UNIQUE (employee_id, leave_type_id, year),
    CONSTRAINT chk_leave_balances_used CHECK (used_days >= 0)
);

COMMENT ON TABLE leave_balances IS 'أرصدة الإجازات - Leave balances per employee per year';

CREATE INDEX IF NOT EXISTS idx_leave_balances_employee ON leave_balances(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_balances_year ON leave_balances(year);
CREATE INDEX IF NOT EXISTS idx_leave_balances_type ON leave_balances(leave_type_id);

-- ============================================================================
-- 11. leave_policies - سياسات الإجازات / Leave Policies
-- ============================================================================
CREATE TABLE IF NOT EXISTS leave_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
    scope TEXT,
    scope_value TEXT,
    days_per_year INTEGER,
    max_days_per_request INTEGER,
    allow_half_day BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_leave_policies_scope CHECK (scope IS NULL OR scope IN ('global', 'department', 'position', 'employee'))
);

COMMENT ON TABLE leave_policies IS 'سياسات الإجازات - Leave policies by scope';

CREATE INDEX IF NOT EXISTS idx_leave_policies_type ON leave_policies(leave_type_id);
CREATE INDEX IF NOT EXISTS idx_leave_policies_scope ON leave_policies(scope, scope_value);

-- ============================================================================
-- 12. leave_permissions - أذونات الخروج / Leave Permissions (hourly)
-- ============================================================================
CREATE TABLE IF NOT EXISTS leave_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    hours NUMERIC,
    reason TEXT,
    status TEXT DEFAULT 'معلق',
    approved_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_leave_permissions_status CHECK (status IN ('معلق', 'موافق', 'مرفوض', 'ملغى'))
);

COMMENT ON TABLE leave_permissions IS 'أذونات الخروج الساعية - Hourly leave permissions';

CREATE INDEX IF NOT EXISTS idx_leave_permissions_employee ON leave_permissions(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_permissions_date ON leave_permissions(date);

-- ============================================================================
-- 13. leave_accruals - استحقاقات الإجازات / Leave Accruals
-- ============================================================================
CREATE TABLE IF NOT EXISTS leave_accruals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    accrued_days NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT uq_leave_accruals UNIQUE (employee_id, leave_type_id, year, month),
    CONSTRAINT chk_leave_accruals_month CHECK (month BETWEEN 1 AND 12)
);

COMMENT ON TABLE leave_accruals IS 'استحقاقات الإجازات الشهرية - Monthly leave accruals';

CREATE INDEX IF NOT EXISTS idx_leave_accruals_employee ON leave_accruals(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_accruals_type ON leave_accruals(leave_type_id);
CREATE INDEX IF NOT EXISTS idx_leave_accruals_year ON leave_accruals(year);

-- ============================================================================
-- 14. allowance_types - أنواع البدلات / Allowance Types
-- ============================================================================
CREATE TABLE IF NOT EXISTS allowance_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_ar TEXT NOT NULL,
    name_en TEXT,
    calc_method TEXT,
    default_amount NUMERIC DEFAULT 0,
    percentage_of TEXT,
    is_taxable BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_allowance_types_calc CHECK (calc_method IS NULL OR calc_method IN ('fixed', 'percentage', 'formula'))
);

COMMENT ON TABLE allowance_types IS 'أنواع البدلات والعلاوات - Allowance types';

-- ============================================================================
-- 15. employee_allowances - بدلات الموظفين / Employee Allowances
-- ============================================================================
CREATE TABLE IF NOT EXISTS employee_allowances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    allowance_type_id UUID NOT NULL REFERENCES allowance_types(id) ON DELETE RESTRICT,
    amount NUMERIC DEFAULT 0,
    currency TEXT DEFAULT 'IQD',
    is_active BOOLEAN DEFAULT true,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE employee_allowances IS 'بدلات الموظفين - Employee allowances';

CREATE INDEX IF NOT EXISTS idx_employee_allowances_employee ON employee_allowances(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_allowances_type ON employee_allowances(allowance_type_id);
CREATE INDEX IF NOT EXISTS idx_employee_allowances_active ON employee_allowances(is_active) WHERE is_active = true;

-- ============================================================================
-- 16. deduction_types - أنواع الاستقطاعات / Deduction Types
-- ============================================================================
CREATE TABLE IF NOT EXISTS deduction_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_ar TEXT NOT NULL,
    name_en TEXT,
    calc_method TEXT,
    default_amount NUMERIC DEFAULT 0,
    default_percentage NUMERIC DEFAULT 0,
    percentage_of TEXT,
    is_mandatory BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_deduction_types_calc CHECK (calc_method IS NULL OR calc_method IN ('fixed', 'percentage', 'formula'))
);

COMMENT ON TABLE deduction_types IS 'أنواع الاستقطاعات - Deduction types';

-- ============================================================================
-- 17. employee_deductions - استقطاعات الموظفين / Employee Deductions
-- ============================================================================
CREATE TABLE IF NOT EXISTS employee_deductions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    deduction_type_id UUID NOT NULL REFERENCES deduction_types(id) ON DELETE RESTRICT,
    amount NUMERIC DEFAULT 0,
    percentage NUMERIC DEFAULT 0,
    calc_method TEXT,
    currency TEXT DEFAULT 'IQD',
    is_active BOOLEAN DEFAULT true,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_employee_deductions_calc CHECK (calc_method IS NULL OR calc_method IN ('fixed', 'percentage', 'formula'))
);

COMMENT ON TABLE employee_deductions IS 'استقطاعات الموظفين - Employee deductions';

CREATE INDEX IF NOT EXISTS idx_employee_deductions_employee ON employee_deductions(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_deductions_type ON employee_deductions(deduction_type_id);
CREATE INDEX IF NOT EXISTS idx_employee_deductions_active ON employee_deductions(is_active) WHERE is_active = true;

-- ============================================================================
-- 18. loans - السلف والقروض / Loans
-- ============================================================================
CREATE TABLE IF NOT EXISTS loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    loan_amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'IQD',
    installment_amount NUMERIC,
    total_installments INTEGER,
    paid_installments INTEGER DEFAULT 0,
    remaining_amount NUMERIC,
    interest_rate NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'معلق',
    reason TEXT,
    approved_by TEXT,
    approved_date DATE,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_loans_status CHECK (status IN ('معلق', 'موافق', 'مرفوض', 'نشط', 'مكتمل', 'ملغى')),
    CONSTRAINT chk_loans_amount CHECK (loan_amount > 0)
);

COMMENT ON TABLE loans IS 'السلف والقروض - Employee loans';

CREATE INDEX IF NOT EXISTS idx_loans_employee ON loans(employee_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_active ON loans(status) WHERE status = 'نشط';

-- ============================================================================
-- 19. contract_types - أنواع العقود / Contract Types
-- ============================================================================
CREATE TABLE IF NOT EXISTS contract_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_ar TEXT NOT NULL,
    name_en TEXT,
    code TEXT,
    description TEXT,
    default_duration_months INTEGER,
    is_renewable BOOLEAN DEFAULT true,
    probation_days INTEGER DEFAULT 0,
    notice_period_days INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE contract_types IS 'أنواع العقود - Contract types';

-- ============================================================================
-- 20. employee_contracts - عقود الموظفين / Employee Contracts
-- ============================================================================
CREATE TABLE IF NOT EXISTS employee_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    contract_type_id UUID REFERENCES contract_types(id) ON DELETE SET NULL,
    contract_number TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    probation_end_date DATE,
    probation_status TEXT,
    salary_amount NUMERIC,
    salary_currency TEXT DEFAULT 'IQD',
    renewal_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'نشط',
    notes TEXT,
    attachment_url TEXT,
    signed_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_employee_contracts_status CHECK (status IN ('مسودة', 'نشط', 'منتهي', 'ملغى', 'معلق')),
    CONSTRAINT chk_employee_contracts_probation CHECK (probation_status IS NULL OR probation_status IN ('جاري', 'ناجح', 'فاشل'))
);

COMMENT ON TABLE employee_contracts IS 'عقود الموظفين - Employee contracts';

CREATE INDEX IF NOT EXISTS idx_employee_contracts_employee ON employee_contracts(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_contracts_type ON employee_contracts(contract_type_id);
CREATE INDEX IF NOT EXISTS idx_employee_contracts_status ON employee_contracts(status);
CREATE INDEX IF NOT EXISTS idx_employee_contracts_dates ON employee_contracts(start_date, end_date);

-- ============================================================================
-- 21. document_types - أنواع المستندات / Document Types
-- ============================================================================
CREATE TABLE IF NOT EXISTS document_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_ar TEXT NOT NULL,
    name_en TEXT,
    code TEXT,
    has_expiry BOOLEAN DEFAULT false,
    expiry_warning_days INTEGER DEFAULT 30,
    is_required BOOLEAN DEFAULT false,
    required_for_contract_types TEXT[],
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE document_types IS 'أنواع المستندات الرسمية - Document types';

-- ============================================================================
-- 22. employee_documents - مستندات الموظفين / Employee Documents
-- ============================================================================
CREATE TABLE IF NOT EXISTS employee_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    document_type_id UUID REFERENCES document_types(id) ON DELETE SET NULL,
    document_number TEXT,
    issue_date DATE,
    expiry_date DATE,
    file_url TEXT,
    file_name TEXT,
    status TEXT DEFAULT 'نشط',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_employee_documents_status CHECK (status IN ('نشط', 'منتهي', 'ملغى'))
);

COMMENT ON TABLE employee_documents IS 'مستندات الموظفين - Employee documents';

CREATE INDEX IF NOT EXISTS idx_employee_documents_employee ON employee_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_type ON employee_documents(document_type_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_expiry ON employee_documents(expiry_date) WHERE expiry_date IS NOT NULL;

-- ============================================================================
-- 23. employee_exit_processes - إجراءات انتهاء الخدمة / Exit Processes
-- ============================================================================
CREATE TABLE IF NOT EXISTS employee_exit_processes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    exit_type TEXT,
    exit_date DATE,
    last_working_day DATE,
    reason TEXT,
    notice_date DATE,
    notice_period_days INTEGER,
    eos_amount NUMERIC,
    eos_currency TEXT DEFAULT 'IQD',
    final_settlement_amount NUMERIC,
    status TEXT DEFAULT 'جاري',
    approved_by TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_exit_processes_type CHECK (exit_type IS NULL OR exit_type IN ('استقالة', 'فصل', 'تقاعد', 'انتهاء عقد', 'وفاة', 'أخرى')),
    CONSTRAINT chk_exit_processes_status CHECK (status IN ('جاري', 'مكتمل', 'ملغى'))
);

COMMENT ON TABLE employee_exit_processes IS 'إجراءات انتهاء الخدمة - Employee exit processes';

CREATE INDEX IF NOT EXISTS idx_exit_processes_employee ON employee_exit_processes(employee_id);
CREATE INDEX IF NOT EXISTS idx_exit_processes_status ON employee_exit_processes(status);

-- ============================================================================
-- 24. exit_checklist_items - بنود قائمة المغادرة / Exit Checklist Items
-- ============================================================================
CREATE TABLE IF NOT EXISTS exit_checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_ar TEXT NOT NULL,
    name_en TEXT,
    category TEXT,
    responsible_role TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE exit_checklist_items IS 'بنود قائمة المغادرة - Exit checklist template items';

-- ============================================================================
-- 25. employee_exit_checklist - قائمة مغادرة الموظف / Employee Exit Checklist
-- ============================================================================
CREATE TABLE IF NOT EXISTS employee_exit_checklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exit_process_id UUID NOT NULL REFERENCES employee_exit_processes(id) ON DELETE CASCADE,
    checklist_item_id UUID NOT NULL REFERENCES exit_checklist_items(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT false,
    completed_by TEXT,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT uq_exit_checklist UNIQUE (exit_process_id, checklist_item_id)
);

COMMENT ON TABLE employee_exit_checklist IS 'قائمة مغادرة الموظف - Employee exit checklist tracking';

CREATE INDEX IF NOT EXISTS idx_exit_checklist_process ON employee_exit_checklist(exit_process_id);
CREATE INDEX IF NOT EXISTS idx_exit_checklist_item ON employee_exit_checklist(checklist_item_id);

-- ============================================================================
-- 26. employee_custodies - عهد الموظفين / Employee Custodies
-- ============================================================================
CREATE TABLE IF NOT EXISTS employee_custodies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    item TEXT NOT NULL,
    description TEXT,
    serial_number TEXT,
    date_received DATE,
    status TEXT DEFAULT 'نشط',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_custodies_status CHECK (status IN ('نشط', 'مسترجع', 'تالف', 'مفقود'))
);

COMMENT ON TABLE employee_custodies IS 'عهد الموظفين - Employee custodies and assets';

CREATE INDEX IF NOT EXISTS idx_employee_custodies_employee ON employee_custodies(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_custodies_status ON employee_custodies(status);

-- ============================================================================
-- 27. employee_attachments - مرفقات الموظفين / Employee Attachments
-- ============================================================================
CREATE TABLE IF NOT EXISTS employee_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT,
    file_url TEXT,
    file_size INTEGER,
    date DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE employee_attachments IS 'مرفقات الموظفين - Employee file attachments';

CREATE INDEX IF NOT EXISTS idx_employee_attachments_employee ON employee_attachments(employee_id);

-- ============================================================================
-- 28. evaluations - تقييمات الأداء / Performance Evaluations
-- ============================================================================
CREATE TABLE IF NOT EXISTS evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    evaluator_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
    period TEXT,
    overall_rating INTEGER,
    status TEXT DEFAULT 'مسودة',
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_evaluations_rating CHECK (overall_rating IS NULL OR overall_rating BETWEEN 1 AND 5),
    CONSTRAINT chk_evaluations_status CHECK (status IN ('مسودة', 'مكتمل', 'معتمد'))
);

COMMENT ON TABLE evaluations IS 'تقييمات الأداء - Performance evaluations';

CREATE INDEX IF NOT EXISTS idx_evaluations_employee ON evaluations(employee_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_evaluator ON evaluations(evaluator_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_period ON evaluations(period);

-- ============================================================================
-- 29. evaluation_criteria - معايير التقييم / Evaluation Criteria
-- ============================================================================
CREATE TABLE IF NOT EXISTS evaluation_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
    criterion_name TEXT NOT NULL,
    score INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_eval_criteria_score CHECK (score IS NULL OR score BETWEEN 1 AND 5)
);

COMMENT ON TABLE evaluation_criteria IS 'معايير التقييم التفصيلية - Evaluation criteria scores';

CREATE INDEX IF NOT EXISTS idx_evaluation_criteria_eval ON evaluation_criteria(evaluation_id);

-- ============================================================================
-- 30. warnings - الإنذارات / Warnings
-- ============================================================================
CREATE TABLE IF NOT EXISTS warnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    type TEXT,
    reason TEXT,
    details TEXT,
    date DATE,
    issued_by TEXT REFERENCES employees(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'نشط',
    expiry_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_warnings_type CHECK (type IS NULL OR type IN ('شفهي', 'كتابي', 'إنذار أول', 'إنذار ثاني', 'إنذار نهائي')),
    CONSTRAINT chk_warnings_status CHECK (status IN ('نشط', 'منتهي', 'ملغى'))
);

COMMENT ON TABLE warnings IS 'الإنذارات والعقوبات - Employee warnings';

CREATE INDEX IF NOT EXISTS idx_warnings_employee ON warnings(employee_id);
CREATE INDEX IF NOT EXISTS idx_warnings_issued_by ON warnings(issued_by);
CREATE INDEX IF NOT EXISTS idx_warnings_status ON warnings(status);
CREATE INDEX IF NOT EXISTS idx_warnings_active ON warnings(status) WHERE status = 'نشط';

-- ============================================================================
-- 31. training_programs - البرامج التدريبية / Training Programs
-- ============================================================================
CREATE TABLE IF NOT EXISTS training_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT,
    weight TEXT,
    instructor TEXT,
    duration TEXT,
    status TEXT DEFAULT 'مخطط',
    completion_rate INTEGER DEFAULT 0,
    start_date DATE,
    end_date DATE,
    objectives TEXT[],
    max_participants INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_training_status CHECK (status IN ('مخطط', 'جاري', 'مكتمل', 'ملغى')),
    CONSTRAINT chk_training_completion CHECK (completion_rate BETWEEN 0 AND 100)
);

COMMENT ON TABLE training_programs IS 'البرامج التدريبية - Training programs';

CREATE INDEX IF NOT EXISTS idx_training_programs_status ON training_programs(status);
CREATE INDEX IF NOT EXISTS idx_training_programs_dates ON training_programs(start_date, end_date);

-- ============================================================================
-- 32. training_participants - المشاركون في التدريب / Training Participants
-- ============================================================================
CREATE TABLE IF NOT EXISTS training_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    training_program_id UUID NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    completion_status TEXT DEFAULT 'مسجل',
    score INTEGER,
    enrolled_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT uq_training_participant UNIQUE (training_program_id, employee_id),
    CONSTRAINT chk_training_participant_status CHECK (completion_status IN ('مسجل', 'جاري', 'مكتمل', 'راسب', 'منسحب'))
);

COMMENT ON TABLE training_participants IS 'المشاركون في التدريب - Training participants';

CREATE INDEX IF NOT EXISTS idx_training_participants_program ON training_participants(training_program_id);
CREATE INDEX IF NOT EXISTS idx_training_participants_employee ON training_participants(employee_id);

-- ============================================================================
-- 33. job_openings - الشواغر الوظيفية / Job Openings
-- ============================================================================
CREATE TABLE IF NOT EXISTS job_openings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    department TEXT,
    location TEXT DEFAULT 'بغداد',
    type TEXT,
    status TEXT DEFAULT 'مفتوح',
    posted_date DATE,
    deadline DATE,
    requirements TEXT[],
    description TEXT,
    salary_range TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_job_openings_status CHECK (status IN ('مفتوح', 'مغلق', 'معلق', 'مسودة')),
    CONSTRAINT chk_job_openings_type CHECK (type IS NULL OR type IN ('دوام كامل', 'دوام جزئي', 'عقد', 'مؤقت', 'تدريب'))
);

COMMENT ON TABLE job_openings IS 'الشواغر الوظيفية - Job openings for recruitment';

CREATE INDEX IF NOT EXISTS idx_job_openings_status ON job_openings(status);
CREATE INDEX IF NOT EXISTS idx_job_openings_department ON job_openings(department);

-- ============================================================================
-- 34. applicants - المتقدمون / Job Applicants
-- ============================================================================
CREATE TABLE IF NOT EXISTS applicants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    job_opening_id UUID REFERENCES job_openings(id) ON DELETE SET NULL,
    stage TEXT DEFAULT 'تقديم',
    applied_date DATE,
    rating INTEGER,
    resume_url TEXT,
    notes TEXT,
    phone TEXT,
    email TEXT,
    skills TEXT[],
    experience_years INTEGER,
    education TEXT,
    current_company TEXT,
    city TEXT,
    gender TEXT,
    birth_date DATE,
    interview_notes TEXT,
    is_bookmarked BOOLEAN DEFAULT false,
    source TEXT,
    expected_salary NUMERIC,
    salary_currency TEXT DEFAULT 'IQD',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_applicants_stage CHECK (stage IN ('تقديم', 'فرز', 'مقابلة أولى', 'مقابلة ثانية', 'اختبار', 'عرض', 'مقبول', 'مرفوض', 'منسحب')),
    CONSTRAINT chk_applicants_rating CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
    CONSTRAINT chk_applicants_gender CHECK (gender IS NULL OR gender IN ('ذكر', 'أنثى'))
);

COMMENT ON TABLE applicants IS 'المتقدمون للوظائف - Job applicants';

CREATE INDEX IF NOT EXISTS idx_applicants_job ON applicants(job_opening_id);
CREATE INDEX IF NOT EXISTS idx_applicants_stage ON applicants(stage);
CREATE INDEX IF NOT EXISTS idx_applicants_bookmarked ON applicants(is_bookmarked) WHERE is_bookmarked = true;

-- ============================================================================
-- 35. policies - السياسات واللوائح / Company Policies
-- ============================================================================
CREATE TABLE IF NOT EXISTS policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT,
    description TEXT,
    content TEXT,
    icon_name TEXT DEFAULT 'FileText',
    status TEXT DEFAULT 'نشط',
    version INTEGER DEFAULT 1,
    last_updated DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_policies_status CHECK (status IN ('نشط', 'مسودة', 'مؤرشف'))
);

COMMENT ON TABLE policies IS 'السياسات واللوائح الداخلية - Company policies and regulations';

CREATE INDEX IF NOT EXISTS idx_policies_category ON policies(category);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);

-- ============================================================================
-- 36. approval_workflows - مسارات الموافقة / Approval Workflows
-- ============================================================================
CREATE TABLE IF NOT EXISTS approval_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_ar TEXT NOT NULL,
    name_en TEXT,
    entity_type TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_workflows_entity CHECK (entity_type IN ('leave_request', 'loan', 'expense', 'contract', 'exit', 'custom'))
);

COMMENT ON TABLE approval_workflows IS 'مسارات الموافقة - Approval workflow definitions';

CREATE INDEX IF NOT EXISTS idx_approval_workflows_entity ON approval_workflows(entity_type);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_active ON approval_workflows(is_active) WHERE is_active = true;

-- ============================================================================
-- 37. approval_workflow_steps - خطوات مسار الموافقة / Workflow Steps
-- ============================================================================
CREATE TABLE IF NOT EXISTS approval_workflow_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    approver_type TEXT,
    approver_id TEXT,
    approver_role TEXT,
    can_skip BOOLEAN DEFAULT false,
    auto_approve_after_days INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT uq_workflow_step_order UNIQUE (workflow_id, step_order),
    CONSTRAINT chk_step_approver_type CHECK (approver_type IS NULL OR approver_type IN ('employee', 'role', 'manager', 'department_head'))
);

COMMENT ON TABLE approval_workflow_steps IS 'خطوات مسار الموافقة - Approval workflow steps';

CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow ON approval_workflow_steps(workflow_id);

-- ============================================================================
-- 38. approval_requests - طلبات الموافقة / Approval Requests
-- ============================================================================
CREATE TABLE IF NOT EXISTS approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES approval_workflows(id) ON DELETE SET NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    requested_by TEXT REFERENCES employees(id) ON DELETE SET NULL,
    current_step INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_approval_requests_status CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled'))
);

COMMENT ON TABLE approval_requests IS 'طلبات الموافقة - Approval requests';

CREATE INDEX IF NOT EXISTS idx_approval_requests_workflow ON approval_requests(workflow_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_entity ON approval_requests(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_requestor ON approval_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_pending ON approval_requests(status) WHERE status = 'pending';

-- ============================================================================
-- 39. approval_actions - إجراءات الموافقة / Approval Actions
-- ============================================================================
CREATE TABLE IF NOT EXISTS approval_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    approval_request_id UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    action TEXT NOT NULL,
    acted_by TEXT REFERENCES employees(id) ON DELETE SET NULL,
    comment TEXT,
    acted_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_approval_actions_action CHECK (action IN ('approve', 'reject', 'return', 'skip'))
);

COMMENT ON TABLE approval_actions IS 'إجراءات الموافقة - Approval actions log';

CREATE INDEX IF NOT EXISTS idx_approval_actions_request ON approval_actions(approval_request_id);
CREATE INDEX IF NOT EXISTS idx_approval_actions_actor ON approval_actions(acted_by);

-- ============================================================================
-- 40. org_chart - الهيكل التنظيمي / Organization Chart
-- ============================================================================
CREATE TABLE IF NOT EXISTS org_chart (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id TEXT REFERENCES employees(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES org_chart(id) ON DELETE SET NULL,
    name TEXT,
    initials TEXT,
    position TEXT,
    department TEXT,
    color TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE org_chart IS 'الهيكل التنظيمي - Organization chart';

CREATE INDEX IF NOT EXISTS idx_org_chart_employee ON org_chart(employee_id);
CREATE INDEX IF NOT EXISTS idx_org_chart_parent ON org_chart(parent_id);

-- ============================================================================
-- 41. notifications - الإشعارات / Notifications
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    employee_id TEXT REFERENCES employees(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT,
    type TEXT,
    category TEXT,
    entity_type TEXT,
    entity_id TEXT,
    target_employee_id TEXT,
    is_read BOOLEAN DEFAULT false,
    is_dismissed BOOLEAN DEFAULT false,
    action_url TEXT,
    icon_name TEXT,
    icon_color TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE notifications IS 'الإشعارات - System notifications';

CREATE INDEX IF NOT EXISTS idx_notifications_employee ON notifications(employee_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(employee_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- ============================================================================
-- 42. audit_log - سجل التدقيق / Audit Log
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    entity_label TEXT,
    actor_name TEXT,
    actor_employee_id TEXT,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE audit_log IS 'سجل التدقيق والمراجعة - Audit log for all changes';

CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_employee_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_type ON audit_log(entity_type);

-- ============================================================================
-- 43. report_templates - قوالب التقارير / Report Templates
-- ============================================================================
CREATE TABLE IF NOT EXISTS report_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_ar TEXT NOT NULL,
    name_en TEXT,
    code TEXT UNIQUE,
    description TEXT,
    category TEXT,
    data_source TEXT,
    columns JSONB,
    default_filters JSONB,
    format TEXT DEFAULT 'table',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_report_templates_format CHECK (format IS NULL OR format IN ('table', 'chart', 'pivot', 'summary'))
);

COMMENT ON TABLE report_templates IS 'قوالب التقارير - Report template definitions';

CREATE INDEX IF NOT EXISTS idx_report_templates_code ON report_templates(code);
CREATE INDEX IF NOT EXISTS idx_report_templates_category ON report_templates(category);

-- ============================================================================
-- 44. report_history - سجل التقارير / Report History
-- ============================================================================
CREATE TABLE IF NOT EXISTS report_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_template_id UUID REFERENCES report_templates(id) ON DELETE SET NULL,
    report_name TEXT,
    filters_used JSONB,
    row_count INTEGER,
    generated_by TEXT,
    generated_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE report_history IS 'سجل التقارير المولدة - Generated report history';

CREATE INDEX IF NOT EXISTS idx_report_history_template ON report_history(report_template_id);
CREATE INDEX IF NOT EXISTS idx_report_history_generated ON report_history(generated_at DESC);

-- ============================================================================
-- 45. configurations - إعدادات النظام / System Configurations
-- ============================================================================
CREATE TABLE IF NOT EXISTS configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key TEXT NOT NULL UNIQUE,
    config_value TEXT,
    value_type TEXT DEFAULT 'string',
    category TEXT,
    label_ar TEXT,
    label_en TEXT,
    description_ar TEXT,
    min_value NUMERIC,
    max_value NUMERIC,
    options TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_configurations_type CHECK (value_type IS NULL OR value_type IN ('string', 'number', 'boolean', 'json', 'date', 'time'))
);

COMMENT ON TABLE configurations IS 'إعدادات النظام - System configuration key-value store';

CREATE INDEX IF NOT EXISTS idx_configurations_key ON configurations(config_key);
CREATE INDEX IF NOT EXISTS idx_configurations_category ON configurations(category);

-- ============================================================================
-- 46. system_modules - وحدات النظام / System Modules
-- ============================================================================
CREATE TABLE IF NOT EXISTS system_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_key TEXT NOT NULL UNIQUE,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    description_ar TEXT,
    category TEXT,
    is_enabled BOOLEAN DEFAULT true,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE system_modules IS 'وحدات النظام - System modules configuration';

CREATE INDEX IF NOT EXISTS idx_system_modules_key ON system_modules(module_key);
CREATE INDEX IF NOT EXISTS idx_system_modules_enabled ON system_modules(is_enabled) WHERE is_enabled = true;

-- ============================================================================
-- 47. public_holidays - العطل الرسمية / Public Holidays
-- ============================================================================
CREATE TABLE IF NOT EXISTS public_holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_ar TEXT NOT NULL,
    name_en TEXT,
    date DATE NOT NULL,
    year INTEGER,
    is_recurring BOOLEAN DEFAULT false,
    recurring_month INTEGER,
    recurring_day INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_holidays_month CHECK (recurring_month IS NULL OR recurring_month BETWEEN 1 AND 12),
    CONSTRAINT chk_holidays_day CHECK (recurring_day IS NULL OR recurring_day BETWEEN 1 AND 31)
);

COMMENT ON TABLE public_holidays IS 'العطل الرسمية - Public holidays calendar';

CREATE INDEX IF NOT EXISTS idx_public_holidays_date ON public_holidays(date);
CREATE INDEX IF NOT EXISTS idx_public_holidays_year ON public_holidays(year);
CREATE INDEX IF NOT EXISTS idx_public_holidays_recurring ON public_holidays(is_recurring) WHERE is_recurring = true;

-- ============================================================================
-- 48. employee_shift_assignments - تعيينات الورديات / Shift Assignments
-- ============================================================================
CREATE TABLE IF NOT EXISTS employee_shift_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE employee_shift_assignments IS 'تعيينات الورديات للموظفين - Employee shift assignments';

CREATE INDEX IF NOT EXISTS idx_shift_assignments_employee ON employee_shift_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_shift ON employee_shift_assignments(shift_id);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_active ON employee_shift_assignments(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_shift_assignments_dates ON employee_shift_assignments(start_date, end_date);

-- ============================================================================
-- 49. biometric_devices - أجهزة البصمة / Biometric Devices
-- ============================================================================
CREATE TABLE IF NOT EXISTS biometric_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    model TEXT,
    serial_number TEXT UNIQUE,
    ip_address TEXT,
    port INTEGER DEFAULT 443,
    protocol TEXT,
    username TEXT,
    location TEXT,
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMPTZ,
    last_heartbeat_at TIMESTAMPTZ,
    status TEXT DEFAULT 'offline',
    config JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_devices_status CHECK (status IN ('online', 'offline', 'error', 'syncing')),
    CONSTRAINT chk_devices_protocol CHECK (protocol IS NULL OR protocol IN ('TCP', 'HTTP', 'HTTPS', 'UDP'))
);

COMMENT ON TABLE biometric_devices IS 'أجهزة البصمة والحضور - Biometric attendance devices';

CREATE INDEX IF NOT EXISTS idx_biometric_devices_active ON biometric_devices(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_biometric_devices_status ON biometric_devices(status);
CREATE INDEX IF NOT EXISTS idx_biometric_devices_serial ON biometric_devices(serial_number);

-- ============================================================================
-- 50. device_events - أحداث الأجهزة / Device Events
-- ============================================================================
CREATE TABLE IF NOT EXISTS device_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID REFERENCES biometric_devices(id) ON DELETE SET NULL,
    device_event_id TEXT,
    employee_no TEXT,
    employee_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
    event_time TIMESTAMPTZ,
    event_date DATE,
    verify_mode TEXT,
    direction TEXT,
    temperature DECIMAL(4,1),
    mask_status TEXT,
    raw_data JSONB,
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_device_events_direction CHECK (direction IS NULL OR direction IN ('in', 'out', 'unknown')),
    CONSTRAINT chk_device_events_mask CHECK (mask_status IS NULL OR mask_status IN ('wearing', 'not_wearing', 'unknown'))
);

COMMENT ON TABLE device_events IS 'أحداث أجهزة البصمة - Raw device events';

CREATE INDEX IF NOT EXISTS idx_device_events_device ON device_events(device_id);
CREATE INDEX IF NOT EXISTS idx_device_events_employee ON device_events(employee_id);
CREATE INDEX IF NOT EXISTS idx_device_events_employee_no ON device_events(employee_no);
CREATE INDEX IF NOT EXISTS idx_device_events_time ON device_events(event_time);
CREATE INDEX IF NOT EXISTS idx_device_events_date ON device_events(event_date);
CREATE INDEX IF NOT EXISTS idx_device_events_unprocessed ON device_events(processed) WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_device_events_device_event ON device_events(device_id, device_event_id);

-- ============================================================================
-- 51. user_profiles - ملفات المستخدمين / User Profiles
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE,
    employee_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
    role TEXT DEFAULT 'employee',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT chk_user_profiles_role CHECK (role IN ('admin', 'hr_manager', 'hr_staff', 'department_head', 'manager', 'employee', 'viewer'))
);

COMMENT ON TABLE user_profiles IS 'ملفات المستخدمين والصلاحيات - User profiles and roles';

CREATE INDEX IF NOT EXISTS idx_user_profiles_auth ON user_profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_employee ON user_profiles(employee_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- ============================================================================
-- 52. generated_payslips - كشوف الرواتب المولدة / Generated Payslips
-- ============================================================================
CREATE TABLE IF NOT EXISTS generated_payslips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    month TEXT NOT NULL,
    basic_salary NUMERIC,
    currency TEXT DEFAULT 'IQD',
    days_worked INTEGER,
    total_hours NUMERIC,
    overtime_hours NUMERIC,
    shortfall_hours NUMERIC,
    absence_days INTEGER,
    net_salary NUMERIC,
    late_deduction NUMERIC DEFAULT 0,
    shortfall_deduction NUMERIC DEFAULT 0,
    absence_deduction NUMERIC DEFAULT 0,
    overtime_payment NUMERIC DEFAULT 0,
    generated_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT uq_payslip_employee_month UNIQUE (employee_id, month)
);

COMMENT ON TABLE generated_payslips IS 'كشوف الرواتب المولدة - Generated employee payslips';

CREATE INDEX IF NOT EXISTS idx_generated_payslips_employee ON generated_payslips(employee_id);
CREATE INDEX IF NOT EXISTS idx_generated_payslips_month ON generated_payslips(month);
CREATE INDEX IF NOT EXISTS idx_generated_payslips_emp_month ON generated_payslips(employee_id, month);

-- ============================================================================
-- Additional Cross-Table Indexes for Common Queries
-- ============================================================================

-- Attendance report queries (employee + date range + status)
CREATE INDEX IF NOT EXISTS idx_attendance_report ON attendance_records(employee_id, date, status);

-- Leave request calendar queries
CREATE INDEX IF NOT EXISTS idx_leave_requests_calendar ON leave_requests(employee_id, start_date, end_date, status);

-- Contract expiry monitoring
CREATE INDEX IF NOT EXISTS idx_contracts_expiry ON employee_contracts(end_date, status) WHERE status = 'نشط';

-- Document expiry monitoring
CREATE INDEX IF NOT EXISTS idx_documents_expiry_monitor ON employee_documents(expiry_date, status) WHERE status = 'نشط' AND expiry_date IS NOT NULL;

-- Active loans monitoring
CREATE INDEX IF NOT EXISTS idx_loans_monitoring ON loans(employee_id, status, remaining_amount) WHERE status = 'نشط';

-- ============================================================================
-- Updated_at Trigger Function
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables with updated_at column
DO $$
DECLARE
    tbl TEXT;
    tbl_list TEXT[] := ARRAY[
        'shifts', 'departments', 'positions', 'employees',
        'monthly_ledgers', 'leave_types', 'leave_requests', 'leave_balances',
        'leave_policies', 'leave_permissions', 'allowance_types', 'employee_allowances',
        'deduction_types', 'employee_deductions', 'loans', 'contract_types',
        'employee_contracts', 'document_types', 'employee_documents',
        'employee_exit_processes', 'employee_custodies', 'evaluations', 'warnings',
        'training_programs', 'job_openings', 'applicants', 'policies',
        'approval_workflows', 'approval_requests', 'org_chart', 'configurations',
        'system_modules', 'public_holidays', 'employee_shift_assignments',
        'biometric_devices', 'user_profiles'
    ];
BEGIN
    FOREACH tbl IN ARRAY tbl_list
    LOOP
        EXECUTE format(
            'DROP TRIGGER IF EXISTS trigger_update_%I_updated_at ON %I;
             CREATE TRIGGER trigger_update_%I_updated_at
             BEFORE UPDATE ON %I
             FOR EACH ROW
             EXECUTE FUNCTION update_updated_at_column();',
            tbl, tbl, tbl, tbl
        );
    END LOOP;
END $$;

-- ============================================================================
-- Schema Complete
-- ============================================================================
-- Total tables: 52
-- 1.  shifts
-- 2.  departments
-- 3.  positions
-- 4.  employees
-- 5.  attendance_records
-- 6.  monthly_records
-- 7.  monthly_ledgers
-- 8.  leave_types
-- 9.  leave_requests
-- 10. leave_balances
-- 11. leave_policies
-- 12. leave_permissions
-- 13. leave_accruals
-- 14. allowance_types
-- 15. employee_allowances
-- 16. deduction_types
-- 17. employee_deductions
-- 18. loans
-- 19. contract_types
-- 20. employee_contracts
-- 21. document_types
-- 22. employee_documents
-- 23. employee_exit_processes
-- 24. exit_checklist_items
-- 25. employee_exit_checklist
-- 26. employee_custodies
-- 27. employee_attachments
-- 28. evaluations
-- 29. evaluation_criteria
-- 30. warnings
-- 31. training_programs
-- 32. training_participants
-- 33. job_openings
-- 34. applicants
-- 35. policies
-- 36. approval_workflows
-- 37. approval_workflow_steps
-- 38. approval_requests
-- 39. approval_actions
-- 40. org_chart
-- 41. notifications
-- 42. audit_log
-- 43. report_templates
-- 44. report_history
-- 45. configurations
-- 46. system_modules
-- 47. public_holidays
-- 48. employee_shift_assignments
-- 49. biometric_devices
-- 50. device_events
-- 51. user_profiles
-- 52. generated_payslips
-- ============================================================================

COMMIT;
