import { useState, useEffect } from "react";
import { supabase } from "./supabase";

// ——— Raw DB types ———
export interface DbEmployee {
  id: string;
  person_id: number;
  name: string;
  arabic_name: string;
  department: string;
  monthly_salary: number;
  currency: string;
  overtime_rate: number;
  overtime_enabled: boolean;
  allowed_late_minutes: number;
  profile_picture: string | null;
  position: string | null;
  email: string | null;
  personal_phone: string | null;
  company_phone: string | null;
  join_date: string | null;
  end_date: string | null;
  status: string | null;
  address: string | null;
  national_id: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  blood_type: string | null;
  manager_id: string | null;
  shift_id: string | null;
  position_id: string | null;
  direct_manager_id: string | null;
  device_employee_no: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbDepartment {
  id: string;
  name: string;
  color: string;
  description: string | null;
  manager_id: string | null;
  default_shift_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbAttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  day_of_week: string;
  check_in_time: string | null;
  check_out_time: string | null;
  working_hours: number;
  overtime_hours: number;
  is_late: boolean;
  late_minutes: number;
  is_early: boolean;
  status: string; // "complete", "missing_checkout", etc.
  created_at: string;
  auto_checkout_applied: boolean;
  // Biometric device fields
  source?: "device" | "manual" | null;
  verify_mode?: string | null;
  device_employee_no?: string | null;
  device_id?: string | null;
  // Excuse/override fields
  excused_late?: boolean;
  excused_absence?: boolean;
  excused_shortfall?: boolean;
  excuse_note?: string | null;
  excused_by?: string | null;
  excused_at?: string | null;
}

export interface DbMonthlyRecord {
  id: string;
  employee_id: string;
  month_year: string;
  imported_at: string;
  salary_calculation: {
    lateDays: number;
    earlyDays: number;
    monthYear: string;
    netSalary: number;
    [key: string]: any;
  };
}

export interface DbMonthlyLedger {
  id: string;
  employee_id: string;
  month_year: string;
  grace_consumed_minutes: number;
  chargeable_late_minutes: number;
  absence_days: string[] | null;
  loan_by_currency: Record<string, number>;
  tip_by_currency: Record<string, number>;
  penalty_by_currency: Record<string, number>;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbShift {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  grace_minutes: number;
  late_to_absent_hours: number;
  target_hours_per_day: number;
  sunday_is_working: boolean;
  sunday_start: string;
  sunday_end: string;
  monday_is_working: boolean;
  monday_start: string;
  monday_end: string;
  tuesday_is_working: boolean;
  tuesday_start: string;
  tuesday_end: string;
  wednesday_is_working: boolean;
  wednesday_start: string;
  wednesday_end: string;
  thursday_is_working: boolean;
  thursday_start: string;
  thursday_end: string;
  friday_is_working: boolean;
  friday_start: string;
  friday_end: string;
  saturday_is_working: boolean;
  saturday_start: string;
  saturday_end: string;
  created_at: string;
  updated_at: string;
}

export interface DbSystemModule {
  id: string;
  module_key: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  category: string;
  is_enabled: boolean;
  icon: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbConfiguration {
  id: string;
  config_key: string;
  config_value: string;
  value_type: string;
  category: string;
  label_ar: string;
  label_en: string;
    description_ar: string | null;
    description?: string | null;
    key?: string;
  min_value: number | null;
  max_value: number | null;
  options: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbPublicHoliday {
  id: string;
  name_ar: string;
  name_en: string | null;
  date: string;
  year: number;
  is_recurring: boolean;
  recurring_month: number | null;
  recurring_day: number | null;
  created_at: string;
}

export interface DbShiftAssignment {
  id: string;
  shift_id: string;
  employee_id: string;
  assigned_at: string;
}

export interface DbPosition {
  id: string;
  title_ar: string;
  title_en: string | null;
  department_id: string | null;
  reports_to_position_id: string | null;
  level: number;
  max_headcount: number;
  is_active: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbEmployeeShiftAssignment {
  id: string;
  employee_id: string;
  shift_id: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbWeeklySchedule {
  id: string;
  employee_id: string;
  day_of_week: string;
  is_working_day: boolean;
  start_time: string;
  end_time: string;
}

export interface DbAllowanceType {
  id: string;
  name_ar: string;
  name_en: string | null;
  calc_method: string;
  default_amount: number;
  percentage_of: string;
  is_taxable: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface DbEmployeeAllowance {
  id: string;
  employee_id: string;
  allowance_type_id: string;
  amount: number;
  currency: string;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export interface DbDeductionType {
  id: string;
  name_ar: string;
  name_en: string | null;
  calc_method: string;
  default_amount: number;
  default_percentage: number;
  percentage_of: string;
  is_mandatory: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface DbEmployeeDeduction {
  id: string;
  employee_id: string;
  deduction_type_id: string;
  amount: number;
  percentage: number;
  calc_method: string;
  currency: string;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export interface DbLoan {
  id: string;
  employee_id: string;
  loan_amount: number;
  currency: string;
  installment_amount: number;
  total_installments: number;
  paid_installments: number;
  remaining_amount: number;
  interest_rate: number;
  status: string;
  reason: string | null;
  approved_by: string | null;
  approved_date: string | null;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

// ——— Phase 3: Leave Management Types ———

export interface DbLeaveType {
  id: string;
  name_ar: string;
  name_en: string | null;
  code: string;
  is_paid: boolean;
  default_days_per_year: number;
  max_days_per_request: number | null;
  min_days_per_request: number;
  allow_half_day: boolean;
  requires_attachment: boolean;
  attachment_after_days: number | null;
  gender_restriction: string | null;
  min_service_months: number;
  is_carryover_allowed: boolean;
  max_carryover_days: number;
  carryover_expiry_months: number;
  is_encashable: boolean;
  encashment_percentage: number;
  accrual_method: string;
  color: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbLeavePolicy {
  id: string;
  leave_type_id: string;
  scope: string;
  scope_value: string | null;
  days_per_year: number;
  max_days_per_request: number | null;
  allow_half_day: boolean | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbLeaveAccrual {
  id: string;
  employee_id: string;
  leave_type_id: string;
  year: number;
  month: number;
  accrued_days: number;
  created_at: string;
}

export interface DbLeavePermission {
  id: string;
  employee_id: string;
  date: string;
  start_time: string;
  end_time: string;
  hours: number;
  reason: string | null;
  status: string;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbLeaveBalance {
  id: string;
  employee_id: string;
  leave_type: string;
  leave_type_id: string | null;
  year: number;
    total_days: number;
    entitlement_days?: number;
  used_days: number;
  carryover_days: number;
  accrued_days: number;
  created_at: string;
  updated_at: string;
}

export interface DbLeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  leave_type_id: string | null;
  start_date: string;
  end_date: string;
  days: number;
  is_half_day: boolean;
  half_day_period: string | null;
  reason: string | null;
  status: string;
  approved_by: string | null;
  rejection_reason: string | null;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
}

// ——— Phase 4: Employee Lifecycle & Compliance Types ———

export interface DbContractType {
  id: string;
  name_ar: string;
  name_en: string | null;
  code: string;
  description: string | null;
  default_duration_months: number | null;
  is_renewable: boolean;
  probation_days: number;
  notice_period_days: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbEmployeeContract {
  id: string;
  employee_id: string;
  contract_type_id: string;
  contract_number: string | null;
  start_date: string;
  end_date: string | null;
  probation_end_date: string | null;
  probation_status: string;
  salary_amount: number | null;
  salary_currency: string;
  renewal_count: number;
  status: string;
  notes: string | null;
  attachment_url: string | null;
  signed_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbDocumentType {
  id: string;
  name_ar: string;
  name_en: string | null;
  code: string;
  has_expiry: boolean;
  expiry_warning_days: number;
  is_required: boolean;
  required_for_contract_types: string[] | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface DbEmployeeDocument {
  id: string;
  employee_id: string;
  document_type_id: string;
  document_number: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  file_url: string | null;
  file_name: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbApprovalWorkflow {
  id: string;
  name_ar: string;
  name_en: string | null;
  entity_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbApprovalWorkflowStep {
  id: string;
  workflow_id: string;
  step_order: number;
  approver_type: string;
  approver_id: string | null;
  approver_role: string | null;
  can_skip: boolean;
  auto_approve_after_days: number | null;
  created_at: string;
}

export interface DbApprovalRequest {
  id: string;
  workflow_id: string | null;
  entity_type: string;
  entity_id: string;
  requested_by: string;
  current_step: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DbApprovalAction {
  id: string;
  approval_request_id: string;
  step_order: number;
  action: string;
  acted_by: string;
  comment: string | null;
  acted_at: string;
}

export interface DbExitChecklistItem {
  id: string;
  name_ar: string;
  name_en: string | null;
  category: string;
  responsible_role: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface DbExitProcess {
  id: string;
  employee_id: string;
  exit_type: string;
  exit_date: string;
  last_working_day: string | null;
  reason: string | null;
  notice_date: string | null;
  notice_period_days: number | null;
  eos_amount: number | null;
  eos_currency: string;
  final_settlement_amount: number | null;
  status: string;
  approved_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbExitChecklist {
  id: string;
  exit_process_id: string;
  checklist_item_id: string;
  is_completed: boolean;
  completed_by: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
}

// ——— Hooks ———

export function useEmployees() {
  const [employees, setEmployees] = useState<DbEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from("employees")
      .select("*")
      .order("created_at", { ascending: true });
    if (err) setError(err.message);
    else setEmployees(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  return { employees, loading, error, refetch: fetchEmployees };
}

export function useHierarchyData() {
  const [employees, setEmployees] = useState<DbEmployee[]>([]);
  const [departments, setDepartments] = useState<DbDepartment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const [empRes, deptRes] = await Promise.all([
      supabase.from("employees").select("*").order("created_at", { ascending: true }),
      supabase.from("departments").select("*").order("name", { ascending: true }),
    ]);
    setEmployees(empRes.data || []);
    setDepartments(deptRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  return { employees, departments, loading, refetch: fetchData };
}

export function useAttendanceRecords(date?: string) {
  const [records, setRecords] = useState<DbAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      let q = supabase.from("attendance_records").select("*");
      if (date) q = q.eq("date", date);
      q = q.order("date", { ascending: false }).limit(date ? 500 : 5000);
      const { data } = await q;
      setRecords(data || []);
      setLoading(false);
    }
    fetch();
  }, [date]);

  return { records, loading };
}

export function useMonthlyRecords(monthYear?: string) {
  const [records, setRecords] = useState<DbMonthlyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      let q = supabase.from("monthly_records").select("*");
      if (monthYear) q = q.eq("month_year", monthYear);
      const { data } = await q;
      setRecords(data || []);
      setLoading(false);
    }
    fetch();
  }, [monthYear]);

  return { records, loading };
}

export function useMonthlyLedgers(monthYear?: string) {
  const [ledgers, setLedgers] = useState<DbMonthlyLedger[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      let q = supabase.from("monthly_ledgers").select("*");
      if (monthYear) q = q.eq("month_year", monthYear);
      const { data } = await q;
      setLedgers(data || []);
      setLoading(false);
    }
    fetch();
  }, [monthYear]);

  return { ledgers, loading };
}

// ── Mock shifts for local testing ──
const _dayTemplate = (working: boolean, start = "08:00:00", end = "16:00:00") => ({
  is_working: working, start, end,
});
const _mockShifts: DbShift[] = [
  {
    id: "mock-shift-morning", name: "الدوام الصباحي", description: "الدوام الرسمي الصباحي", is_default: true,
    grace_minutes: 10, late_to_absent_hours: 3, target_hours_per_day: 8,
    sunday_is_working: true, sunday_start: "08:00:00", sunday_end: "16:00:00",
    monday_is_working: true, monday_start: "08:00:00", monday_end: "16:00:00",
    tuesday_is_working: true, tuesday_start: "08:00:00", tuesday_end: "16:00:00",
    wednesday_is_working: true, wednesday_start: "08:00:00", wednesday_end: "16:00:00",
    thursday_is_working: true, thursday_start: "08:00:00", thursday_end: "16:00:00",
    friday_is_working: false, friday_start: "08:00:00", friday_end: "16:00:00",
    saturday_is_working: false, saturday_start: "08:00:00", saturday_end: "16:00:00",
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: "mock-shift-evening", name: "الدوام المسائي", description: "الوردية المسائية", is_default: false,
    grace_minutes: 5, late_to_absent_hours: 2, target_hours_per_day: 8,
    sunday_is_working: true, sunday_start: "16:00:00", sunday_end: "00:00:00",
    monday_is_working: true, monday_start: "16:00:00", monday_end: "00:00:00",
    tuesday_is_working: true, tuesday_start: "16:00:00", tuesday_end: "00:00:00",
    wednesday_is_working: true, wednesday_start: "16:00:00", wednesday_end: "00:00:00",
    thursday_is_working: true, thursday_start: "16:00:00", thursday_end: "00:00:00",
    friday_is_working: false, friday_start: "16:00:00", friday_end: "00:00:00",
    saturday_is_working: false, saturday_start: "16:00:00", saturday_end: "00:00:00",
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: "mock-shift-night", name: "الدوام الليلي", description: "الوردية الليلية", is_default: false,
    grace_minutes: 5, late_to_absent_hours: 2, target_hours_per_day: 8,
    sunday_is_working: true, sunday_start: "00:00:00", sunday_end: "08:00:00",
    monday_is_working: true, monday_start: "00:00:00", monday_end: "08:00:00",
    tuesday_is_working: true, tuesday_start: "00:00:00", tuesday_end: "08:00:00",
    wednesday_is_working: true, wednesday_start: "00:00:00", wednesday_end: "08:00:00",
    thursday_is_working: true, thursday_start: "00:00:00", thursday_end: "08:00:00",
    friday_is_working: false, friday_start: "00:00:00", friday_end: "08:00:00",
    saturday_is_working: true, saturday_start: "00:00:00", saturday_end: "08:00:00",
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: "mock-shift-flexible", name: "الدوام المرن", description: "دوام مرن — ٦ ساعات يومياً", is_default: false,
    grace_minutes: 30, late_to_absent_hours: 4, target_hours_per_day: 6,
    sunday_is_working: true, sunday_start: "09:00:00", sunday_end: "15:00:00",
    monday_is_working: true, monday_start: "09:00:00", monday_end: "15:00:00",
    tuesday_is_working: true, tuesday_start: "09:00:00", tuesday_end: "15:00:00",
    wednesday_is_working: true, wednesday_start: "09:00:00", wednesday_end: "15:00:00",
    thursday_is_working: true, thursday_start: "09:00:00", thursday_end: "15:00:00",
    friday_is_working: false, friday_start: "09:00:00", friday_end: "15:00:00",
    saturday_is_working: false, saturday_start: "09:00:00", saturday_end: "15:00:00",
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
];

export function useShifts() {
  const [shifts, setShifts] = useState<DbShift[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchShifts = async () => {
    setLoading(true);
    const { data } = await supabase.from("shifts").select("*").order("is_default", { ascending: false }).order("name");
    // Use mock data if DB returns empty (local testing)
    setShifts(data && data.length > 0 ? data : _mockShifts);
    setLoading(false);
  };

  useEffect(() => { fetchShifts(); }, []);

  return { shifts, loading, refetch: fetchShifts };
}

// ── Mock positions for local testing ──
const _mockPositions: DbPosition[] = [
  { id: "mock-pos-ceo", title_ar: "المدير العام", title_en: "CEO", department_id: null, reports_to_position_id: null, level: 0, max_headcount: 1, is_active: true, description: "رأس الهرم الإداري", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "mock-pos-hr-mgr", title_ar: "مدير الموارد البشرية", title_en: "HR Manager", department_id: null, reports_to_position_id: "mock-pos-ceo", level: 1, max_headcount: 1, is_active: true, description: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "mock-pos-hr-spec", title_ar: "أخصائي موارد بشرية", title_en: "HR Specialist", department_id: null, reports_to_position_id: "mock-pos-hr-mgr", level: 2, max_headcount: 3, is_active: true, description: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "mock-pos-fin-mgr", title_ar: "مدير المالية", title_en: "Finance Manager", department_id: null, reports_to_position_id: "mock-pos-ceo", level: 1, max_headcount: 1, is_active: true, description: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "mock-pos-accountant", title_ar: "محاسب", title_en: "Accountant", department_id: null, reports_to_position_id: "mock-pos-fin-mgr", level: 2, max_headcount: 2, is_active: true, description: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "mock-pos-it-mgr", title_ar: "مدير تقنية المعلومات", title_en: "IT Manager", department_id: null, reports_to_position_id: "mock-pos-ceo", level: 1, max_headcount: 1, is_active: true, description: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "mock-pos-developer", title_ar: "مطور برمجيات", title_en: "Software Developer", department_id: null, reports_to_position_id: "mock-pos-it-mgr", level: 2, max_headcount: 4, is_active: true, description: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "mock-pos-ops-mgr", title_ar: "مدير العمليات", title_en: "Operations Manager", department_id: null, reports_to_position_id: "mock-pos-ceo", level: 1, max_headcount: 1, is_active: true, description: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export function usePositions() {
  const [positions, setPositions] = useState<DbPosition[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPositions = async () => {
    setLoading(true);
    const { data } = await supabase.from("positions").select("*").order("level").order("title_ar");
    // Use mock data if DB returns empty (local testing)
    setPositions(data && data.length > 0 ? data : _mockPositions);
    setLoading(false);
  };

  useEffect(() => { fetchPositions(); }, []);

  return { positions, loading, refetch: fetchPositions };
}

export function useEmployeeShiftAssignments() {
  const [assignments, setAssignments] = useState<DbEmployeeShiftAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignments = async () => {
    setLoading(true);
    const { data } = await supabase.from("employee_shift_assignments").select("*").eq("is_active", true).order("start_date", { ascending: false });
    setAssignments(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAssignments(); }, []);

  return { assignments, loading, refetch: fetchAssignments };
}

export function useSystemModules() {
  const [modules, setModules] = useState<DbSystemModule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchModules = async () => {
    setLoading(true);
    const { data } = await supabase.from("system_modules").select("*").order("sort_order");
    setModules(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchModules(); }, []);

  const isEnabled = (moduleKey: string): boolean => {
    const m = modules.find(mod => mod.module_key === moduleKey);
    return m?.is_enabled ?? false;
  };

  return { modules, loading, refetch: fetchModules, isEnabled };
}

export function useConfigurations() {
  const [configs, setConfigs] = useState<DbConfiguration[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConfigs = async () => {
    setLoading(true);
    const { data } = await supabase.from("configurations").select("*").order("sort_order");
    setConfigs(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchConfigs(); }, []);

  const getValue = (key: string, fallback: string = ""): string => {
    const c = configs.find(cfg => cfg.config_key === key);
    return c?.config_value ?? fallback;
  };

  const getNumber = (key: string, fallback: number = 0): number => {
    const val = getValue(key, String(fallback));
    const n = parseFloat(val);
    return isNaN(n) ? fallback : n;
  };

  const getBool = (key: string, fallback: boolean = false): boolean => {
    const val = getValue(key, String(fallback));
    return val === "true" || val === "1";
  };

  return { configs, loading, refetch: fetchConfigs, getValue, getNumber, getBool };
}

export function usePublicHolidays(year?: number) {
  const [holidays, setHolidays] = useState<DbPublicHoliday[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHolidays = async () => {
    setLoading(true);
    let q = supabase.from("public_holidays").select("*");
    if (year) q = q.eq("year", year);
    q = q.order("date");
    const { data } = await q;
    setHolidays(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchHolidays(); }, [year]);

  const isHoliday = (dateStr: string): boolean => {
    return holidays.some(h => h.date === dateStr);
  };

  const getHolidayName = (dateStr: string): string | null => {
    const h = holidays.find(hol => hol.date === dateStr);
    return h?.name_ar ?? null;
  };

  return { holidays, loading, refetch: fetchHolidays, isHoliday, getHolidayName };
}

export function useAllowanceTypes() {
  const [types, setTypes] = useState<DbAllowanceType[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from("allowance_types").select("*").order("sort_order");
    setTypes(data || []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);
  return { types, loading, refetch: fetch };
}

export function useEmployeeAllowances(employeeId?: string) {
  const [allowances, setAllowances] = useState<DbEmployeeAllowance[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = async () => {
    setLoading(true);
    let q = supabase.from("employee_allowances").select("*").eq("is_active", true);
    if (employeeId) q = q.eq("employee_id", employeeId);
    const { data } = await q;
    setAllowances(data || []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, [employeeId]);
  return { allowances, loading, refetch: fetch };
}

export function useDeductionTypes() {
  const [types, setTypes] = useState<DbDeductionType[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from("deduction_types").select("*").order("sort_order");
    setTypes(data || []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);
  return { types, loading, refetch: fetch };
}

export function useEmployeeDeductions(employeeId?: string) {
  const [deductions, setDeductions] = useState<DbEmployeeDeduction[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = async () => {
    setLoading(true);
    let q = supabase.from("employee_deductions").select("*").eq("is_active", true);
    if (employeeId) q = q.eq("employee_id", employeeId);
    const { data } = await q;
    setDeductions(data || []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, [employeeId]);
  return { deductions, loading, refetch: fetch };
}

export function useLoans(employeeId?: string) {
  const [loans, setLoans] = useState<DbLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = async () => {
    setLoading(true);
    let q = supabase.from("loans").select("*");
    if (employeeId) q = q.eq("employee_id", employeeId);
    q = q.order("created_at", { ascending: false });
    const { data } = await q;
    setLoans(data || []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, [employeeId]);
  return { loans, loading, refetch: fetch };
}

// ——— Phase 3: Leave Management Hooks ———

export function useLeaveTypes() {
  const [types, setTypes] = useState<DbLeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from("leave_types").select("*").order("sort_order");
    setTypes(data || []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);
  return { types, loading, refetch: fetch };
}

export function useLeavePolicies() {
  const [policies, setPolicies] = useState<DbLeavePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from("leave_policies").select("*").eq("is_active", true);
    setPolicies(data || []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);
  return { policies, loading, refetch: fetch };
}

export function useLeaveRequests(filters?: { employeeId?: string; status?: string; month?: string }) {
  const [requests, setRequests] = useState<DbLeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = async () => {
    setLoading(true);
    let q = supabase.from("leave_requests").select("*").order("created_at", { ascending: false });
    if (filters?.employeeId) q = q.eq("employee_id", filters.employeeId);
    if (filters?.status) q = q.eq("status", filters.status);
    if (filters?.month) q = q.gte("start_date", filters.month + "-01").lte("start_date", filters.month + "-31");
    const { data } = await q;
    setRequests(data || []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, [filters?.employeeId, filters?.status, filters?.month]);
  return { requests, loading, refetch: fetch };
}

export function useLeaveBalances(year?: number) {
  const [balances, setBalances] = useState<DbLeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = async () => {
    setLoading(true);
    let q = supabase.from("leave_balances").select("*");
    if (year) q = q.eq("year", year);
    const { data } = await q;
    setBalances(data || []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, [year]);
  return { balances, loading, refetch: fetch };
}

export function useLeavePermissions(employeeId?: string) {
  const [permissions, setPermissions] = useState<DbLeavePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = async () => {
    setLoading(true);
    let q = supabase.from("leave_permissions").select("*").order("date", { ascending: false });
    if (employeeId) q = q.eq("employee_id", employeeId);
    const { data } = await q;
    setPermissions(data || []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, [employeeId]);
  return { permissions, loading, refetch: fetch };
}

/** Resolve effective leave days for an employee considering policies (department/contract overrides) */
export function resolveLeaveEntitlement(
  leaveType: DbLeaveType,
  policies: DbLeavePolicy[],
  department?: string,
  contractType?: string
): number {
  // Priority: contract_type > department > global > default
  const contractPolicy = policies.find(p => p.leave_type_id === leaveType.id && p.scope === "contract_type" && p.scope_value === contractType);
  if (contractPolicy) return contractPolicy.days_per_year;
  const deptPolicy = policies.find(p => p.leave_type_id === leaveType.id && p.scope === "department" && p.scope_value === department);
  if (deptPolicy) return deptPolicy.days_per_year;
  const globalPolicy = policies.find(p => p.leave_type_id === leaveType.id && p.scope === "global");
  if (globalPolicy) return globalPolicy.days_per_year;
  return leaveType.default_days_per_year;
}

// ——— Phase 4: Employee Lifecycle Hooks ———

export function useContractTypes() {
  const [types, setTypes] = useState<DbContractType[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from("contract_types").select("*").order("sort_order");
    setTypes(data || []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);
  return { types, loading, refetch: fetch };
}

export function useEmployeeContracts(employeeId?: string) {
  const [contracts, setContracts] = useState<DbEmployeeContract[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = async () => {
    setLoading(true);
    let q = supabase.from("employee_contracts").select("*").order("start_date", { ascending: false });
    if (employeeId) q = q.eq("employee_id", employeeId);
    const { data } = await q;
    setContracts(data || []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, [employeeId]);
  return { contracts, loading, refetch: fetch };
}

export function useDocumentTypes() {
  const [types, setTypes] = useState<DbDocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from("document_types").select("*").order("sort_order");
    setTypes(data || []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);
  return { types, loading, refetch: fetch };
}

export function useEmployeeDocuments(employeeId?: string) {
  const [documents, setDocuments] = useState<DbEmployeeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = async () => {
    setLoading(true);
    let q = supabase.from("employee_documents").select("*").order("created_at", { ascending: false });
    if (employeeId) q = q.eq("employee_id", employeeId);
    const { data } = await q;
    setDocuments(data || []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, [employeeId]);
  return { documents, loading, refetch: fetch };
}

export function useApprovalWorkflows() {
  const [workflows, setWorkflows] = useState<DbApprovalWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from("approval_workflows").select("*");
    setWorkflows(data || []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);
  return { workflows, loading, refetch: fetch };
}

export function useApprovalWorkflowSteps(workflowId?: string) {
  const [steps, setSteps] = useState<DbApprovalWorkflowStep[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = async () => {
    setLoading(true);
    let q = supabase.from("approval_workflow_steps").select("*").order("step_order");
    if (workflowId) q = q.eq("workflow_id", workflowId);
    const { data } = await q;
    setSteps(data || []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, [workflowId]);
  return { steps, loading, refetch: fetch };
}

export function useApprovalRequests(filters?: { entityType?: string; status?: string }) {
  const [requests, setRequests] = useState<DbApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = async () => {
    setLoading(true);
    let q = supabase.from("approval_requests").select("*").order("created_at", { ascending: false });
    if (filters?.entityType) q = q.eq("entity_type", filters.entityType);
    if (filters?.status) q = q.eq("status", filters.status);
    const { data } = await q;
    setRequests(data || []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, [filters?.entityType, filters?.status]);
  return { requests, loading, refetch: fetch };
}

export function useExitChecklistItems() {
  const [items, setItems] = useState<DbExitChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from("exit_checklist_items").select("*").eq("is_active", true).order("sort_order");
    setItems(data || []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);
  return { items, loading, refetch: fetch };
}

export function useExitProcesses(employeeId?: string) {
  const [processes, setProcesses] = useState<DbExitProcess[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = async () => {
    setLoading(true);
    let q = supabase.from("employee_exit_processes").select("*").order("created_at", { ascending: false });
    if (employeeId) q = q.eq("employee_id", employeeId);
    const { data } = await q;
    setProcesses(data || []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, [employeeId]);
  return { processes, loading, refetch: fetch };
}

export function useExitChecklist(exitProcessId?: string) {
  const [checklist, setChecklist] = useState<DbExitChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = async () => {
    setLoading(true);
    let q = supabase.from("employee_exit_checklist").select("*");
    if (exitProcessId) q = q.eq("exit_process_id", exitProcessId);
    const { data } = await q;
    setChecklist(data || []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, [exitProcessId]);
  return { checklist, loading, refetch: fetch };
}

// ——— Recruitment Hooks ———

export interface DbJobOpening {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  status: string;
  posted_date: string;
  deadline: string | null;
  requirements: string[] | null;
  description: string | null;
  salary_range: string | null;
  created_at: string;
  updated_at: string;
  applicant_count?: number;
  hired_count?: number;
}

export interface DbApplicant {
  id: string;
  name: string;
  job_opening_id: string;
  stage: string;
  applied_date: string;
  rating: number;
  resume_url: string | null;
  notes: string | null;
  phone: string | null;
  email: string | null;
  skills: string[] | null;
  experience_years: number;
  education: string | null;
  current_company: string | null;
  city: string | null;
  gender: string | null;
  birth_date: string | null;
  interview_notes: string | null;
  is_bookmarked: boolean;
  source: string | null;
  expected_salary: number | null;
  salary_currency: string | null;
  created_at: string;
  updated_at: string;
  // joined fields
  job_title?: string;
  job_department?: string;
  job_status?: string;
}

export function useJobOpenings() {
  const [jobs, setJobs] = useState<DbJobOpening[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("job_openings_with_counts")
      .select("*")
      .order("created_at", { ascending: false });
    setJobs(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchJobs(); }, []);
  return { jobs, loading, refetch: fetchJobs };
}

export function useApplicants() {
  const [applicants, setApplicants] = useState<DbApplicant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplicants = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("applicants_with_job")
      .select("*")
      .order("created_at", { ascending: false });
    setApplicants(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchApplicants(); }, []);
  return { applicants, loading, refetch: fetchApplicants };
}

// ——— Evaluations, Warnings, Training, Policies Hooks ———

export interface DbEvaluation {
  id: string;
  employee_id: string;
    evaluator_id: string | null;
    evaluator_name?: string | null;
  period: string;
  overall_rating: number;
  status: string;
  comments: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbEvaluationCriteria {
  id: string;
  evaluation_id: string;
  criterion_name: string;
  score: number | null;
  created_at: string;
}

export interface DbWarning {
  id: string;
  employee_id: string;
  type: string;
  reason: string;
  details: string | null;
  date: string;
  issued_by: string | null;
  status: string;
  expiry_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbTrainingProgram {
  id: string;
  title: string;
  category: string;
  weight: string;
  instructor: string | null;
  duration: string | null;
  status: string;
  completion_rate: number;
  start_date: string | null;
  end_date: string | null;
  objectives: string[] | null;
  max_participants: number | null;
  created_at: string;
  updated_at: string;
}

export interface DbTrainingParticipant {
  id: string;
  training_program_id: string;
  employee_id: string;
  completion_status: string;
  score: number | null;
  enrolled_at: string;
  completed_at: string | null;
}

export interface DbPolicy {
  id: string;
  title: string;
  category: string;
  description: string | null;
  content: string | null;
  icon_name: string | null;
  status: string;
  version: number;
  last_updated: string;
  created_at: string;
}

export function useEvaluations(filters?: { employeeId?: string; period?: string }) {
  const [evaluations, setEvaluations] = useState<DbEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = async () => {
    setLoading(true);
    let q = supabase.from("evaluations").select("*").order("created_at", { ascending: false });
    if (filters?.employeeId) q = q.eq("employee_id", filters.employeeId);
    if (filters?.period) q = q.eq("period", filters.period);
    const { data } = await q;
    setEvaluations(data || []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, [filters?.employeeId, filters?.period]);
  return { evaluations, loading, refetch: fetch };
}

export function useWarnings(filters?: { employeeId?: string; status?: string }) {
  const [warnings, setWarnings] = useState<DbWarning[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = async () => {
    setLoading(true);
    let q = supabase.from("warnings").select("*").order("date", { ascending: false });
    if (filters?.employeeId) q = q.eq("employee_id", filters.employeeId);
    if (filters?.status) q = q.eq("status", filters.status);
    const { data } = await q;
    setWarnings(data || []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, [filters?.employeeId, filters?.status]);
  return { warnings, loading, refetch: fetch };
}

export function useTrainingPrograms() {
  const [programs, setPrograms] = useState<DbTrainingProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from("training_programs").select("*").order("created_at", { ascending: false });
    setPrograms(data || []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);
  return { programs, loading, refetch: fetch };
}

export function useTrainingParticipants(programId?: string) {
  const [participants, setParticipants] = useState<DbTrainingParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = async () => {
    setLoading(true);
    let q = supabase.from("training_participants").select("*");
    if (programId) q = q.eq("training_program_id", programId);
    const { data } = await q;
    setParticipants(data || []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, [programId]);
  return { participants, loading, refetch: fetch };
}

export function usePolicies() {
  const [policies, setPolicies] = useState<DbPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from("policies").select("*").order("created_at", { ascending: false });
    setPolicies(data || []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);
  return { policies, loading, refetch: fetch };
}

// ——— Phase 5: Notifications, Audit Trail & Reports ———

export interface DbNotification {
  id: string;
  title: string;
  body: string | null;
  type: 'info' | 'warning' | 'success' | 'error' | 'action';
  category: string;
  entity_type: string | null;
  entity_id: string | null;
  target_employee_id: string | null;
  is_read: boolean;
  is_dismissed: boolean;
  action_url: string | null;
  created_at: string;
}

export interface DbAuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_label: string | null;
  actor_name: string;
  actor_employee_id: string | null;
  details: Record<string, any>;
  ip_address: string | null;
  created_at: string;
}

export interface DbReportTemplate {
  id: string;
  name_ar: string;
  name_en: string | null;
  code: string;
  description: string | null;
  category: string;
  data_source: string;
  columns: { key: string; label: string }[];
  default_filters: Record<string, any>;
  format: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbReportHistory {
  id: string;
  report_template_id: string | null;
  report_name: string;
  filters_used: Record<string, any>;
  row_count: number;
  generated_by: string;
  generated_at: string;
}

export function useNotifications(employeeId?: string) {
  const [notifications, setNotifications] = useState<DbNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = async () => {
    setLoading(true);
    let q = supabase.from("notifications").select("*").eq("is_dismissed", false).order("created_at", { ascending: false }).limit(100);
    if (employeeId) q = q.eq("target_employee_id", employeeId);
    const { data } = await q;
    setNotifications(data || []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, [employeeId]);
  const unreadCount = notifications.filter(n => !n.is_read).length;
  return { notifications, unreadCount, loading, refetch: fetch };
}

export function useAuditLog(filters?: { entityType?: string; action?: string; limit?: number }) {
  const [logs, setLogs] = useState<DbAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = async () => {
    setLoading(true);
    let q = supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(filters?.limit || 200);
    if (filters?.entityType) q = q.eq("entity_type", filters.entityType);
    if (filters?.action) q = q.eq("action", filters.action);
    const { data } = await q;
    setLogs(data || []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, [filters?.entityType, filters?.action, filters?.limit]);
  return { logs, loading, refetch: fetch };
}

export function useReportTemplates() {
  const [templates, setTemplates] = useState<DbReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from("report_templates").select("*").eq("is_active", true).order("sort_order");
    setTemplates(data || []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);
  return { templates, loading, refetch: fetch };
}

export function useReportHistory() {
  const [history, setHistory] = useState<DbReportHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from("report_history").select("*").order("generated_at", { ascending: false }).limit(50);
    setHistory(data || []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);
  return { history, loading, refetch: fetch };
}

/** Log an audit entry */
export async function logAudit(entry: {
  action: string;
  entity_type: string;
  entity_id?: string;
  entity_label?: string;
  actor_name?: string;
  actor_employee_id?: string;
  details?: Record<string, any>;
}) {
  await supabase.from("audit_log").insert({
    action: entry.action,
    entity_type: entry.entity_type,
    entity_id: entry.entity_id || null,
    entity_label: entry.entity_label || null,
    actor_name: entry.actor_name || "مدير الموارد البشرية",
    actor_employee_id: entry.actor_employee_id || null,
    details: entry.details || {},
  });
}

/** Create a notification */
export async function createNotification(n: {
  title: string;
  body?: string;
  type?: 'info' | 'warning' | 'success' | 'error' | 'action';
  category?: string;
  entity_type?: string;
  entity_id?: string;
  target_employee_id?: string;
  action_url?: string;
}) {
  await supabase.from("notifications").insert({
    title: n.title,
    body: n.body || null,
    type: n.type || "info",
    category: n.category || "system",
    entity_type: n.entity_type || null,
    entity_id: n.entity_id || null,
    target_employee_id: n.target_employee_id || null,
    action_url: n.action_url || null,
  });
}

// ——— Helpers ———

/** Map DB employee ID to a friendly EMP-XXXX number */
export function empNumber(personId: number): string {
  return `EMP-${String(personId).padStart(4, "0")}`;
}

/** Get display name — prefer arabic_name, fallback to name */
export function empDisplayName(e: DbEmployee): string {
  return e.arabic_name || e.name || "—";
}

/** Map attendance status from DB to Arabic display */
export function mapAttendanceStatus(status: string, isLate: boolean): "حاضر" | "متأخر" | "غائب" | "إجازة" {
  if (status === "complete" && isLate) return "متأخر";
  if (status === "complete" || status === "missing_checkout" || status === "checked_in" || status === "missing_checkin" || status === "auto_checkout") return "حاضر";
  if (status === "absent") return "غائب";
  if (status === "leave") return "إجازة";
  return "حاضر";
}

/** Format time string (HH:MM:SS) to 12-hour format (h:MM AM/PM) */
export function formatTime(t: string | null): string {
  if (!t) return "—";
  const parts = t.split(":");
  let h = parseInt(parts[0], 10);
  const m = parts[1] || "00";
  const suffix = h < 12 ? "ص" : "م";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${suffix}`;
}

/** Format working hours number to H:MM */
export function formatWorkHours(h: number): string {
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return `${hrs}:${String(mins).padStart(2, "0")}`;
}

/** Convert DbShift to EmployeeSchedule format */
export function shiftToSchedule(shift: DbShift): Record<string, { isWorkingDay: boolean; startTime: string; endTime: string }> {
  return {
    sunday: { isWorkingDay: shift.sunday_is_working, startTime: shift.sunday_start, endTime: shift.sunday_end },
    monday: { isWorkingDay: shift.monday_is_working, startTime: shift.monday_start, endTime: shift.monday_end },
    tuesday: { isWorkingDay: shift.tuesday_is_working, startTime: shift.tuesday_start, endTime: shift.tuesday_end },
    wednesday: { isWorkingDay: shift.wednesday_is_working, startTime: shift.wednesday_start, endTime: shift.wednesday_end },
    thursday: { isWorkingDay: shift.thursday_is_working, startTime: shift.thursday_start, endTime: shift.thursday_end },
    friday: { isWorkingDay: shift.friday_is_working, startTime: shift.friday_start, endTime: shift.friday_end },
    saturday: { isWorkingDay: shift.saturday_is_working, startTime: shift.saturday_start, endTime: shift.saturday_end },
  };
}

/** Resolve the effective shift for an employee: employee override > department default > system default */
export function resolveEmployeeShift(
  employee: DbEmployee,
  departments: DbDepartment[],
  shifts: DbShift[]
): DbShift | null {
  // 1. Employee-level override
  if (employee.shift_id) {
    const s = shifts.find(sh => sh.id === employee.shift_id);
    if (s) return s;
  }
  // 2. Department default
  const dept = departments.find(d => d.name === employee.department);
  if (dept?.default_shift_id) {
    const s = shifts.find(sh => sh.id === dept.default_shift_id);
    if (s) return s;
  }
  // 3. System default (is_default = true)
  const def = shifts.find(sh => sh.is_default);
  return def || null;
}

// ——— Biometric Device Status ———

export interface DbBiometricDevice {
  id: string;
  name: string;
  model: string;
  serial_number: string;
  ip_address: string;
  port: number;
  protocol: string;
  username: string | null;
  location: string | null;
  is_active: boolean;
  last_sync_at: string | null;
  last_heartbeat_at: string | null;
  config: Record<string, unknown>;
  created_at: string;
}

export interface DeviceStatus {
  devices: DbBiometricDevice[];
  totalDevices: number;
  activeDevices: number;
  lastSyncAt: string | null;
  syncAgeMinutes: number; // minutes since last sync
  todayDeviceEvents: number;
  status: "online" | "stale" | "offline" | "no_device";
}

export function useDeviceStatus() {
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({
    devices: [], totalDevices: 0, activeDevices: 0,
    lastSyncAt: null, syncAgeMinutes: 999,
    todayDeviceEvents: 0, status: "no_device",
  });
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      // Fetch active devices
      const { data: devices } = await supabase
        .from("biometric_devices")
        .select("*")
        .eq("is_active", true);

      const devs = devices || [];
      const totalDevices = devs.length;
      const activeDevices = devs.filter(d => d.is_active).length;

      // Most recent sync across all devices
      const syncTimes = devs
        .map(d => d.last_sync_at)
        .filter(Boolean)
        .sort()
        .reverse();
      const lastSyncAt = syncTimes[0] || null;

      // How stale is the sync?
      let syncAgeMinutes = 999;
      if (lastSyncAt) {
        syncAgeMinutes = Math.round((Date.now() - new Date(lastSyncAt).getTime()) / 60000);
      }

      // Today's device event count
      const today = new Date().toISOString().slice(0, 10);
      const { count } = await supabase
        .from("attendance_records")
        .select("*", { count: "exact", head: true })
        .eq("source", "device")
        .eq("date", today);

      const todayDeviceEvents = count || 0;

      // Determine status
      let status: DeviceStatus["status"] = "no_device";
      if (totalDevices > 0) {
        if (syncAgeMinutes <= 10) status = "online";
        else if (syncAgeMinutes <= 60) status = "stale";
        else status = "offline";
      }

      setDeviceStatus({
        devices: devs, totalDevices, activeDevices,
        lastSyncAt, syncAgeMinutes, todayDeviceEvents, status,
      });
    } catch {
      // biometric_devices table may not exist yet — silently ignore
      setDeviceStatus(prev => ({ ...prev, status: "no_device" }));
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    // Auto-refresh every 2 minutes
    const interval = setInterval(refresh, 120000);
    return () => clearInterval(interval);
  }, []);

  return { deviceStatus, loading, refresh };
}
