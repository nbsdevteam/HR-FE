import * as odooData from "@/shared/api/odooData";
import { useCachedList } from "./core";

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

export const useAllowanceTypes = () => {
  const { data: types, loading, refetch } = useCachedList("allowanceTypes", () => odooData.fetchAllowanceTypes(), "Failed to load allowance types");
  return { types, loading, refetch };
}

export const useEmployeeAllowances = (employeeId?: string) => {
  const { data: allowances, loading, refetch } = useCachedList(
    "employeeAllowances",
    () => odooData.fetchEmployeeAllowances(employeeId),
    "Failed to load allowances",
    [employeeId],
  );
  return { allowances, loading, refetch };
}

export const useDeductionTypes = () => {
  const { data: types, loading, refetch } = useCachedList("deductionTypes", () => odooData.fetchDeductionTypes(), "Failed to load deduction types");
  return { types, loading, refetch };
}

export const useEmployeeDeductions = (employeeId?: string) => {
  const { data: deductions, loading, refetch } = useCachedList(
    "employeeDeductions",
    () => odooData.fetchEmployeeDeductions(employeeId),
    "Failed to load deductions",
    [employeeId],
  );
  return { deductions, loading, refetch };
}

export const useLoans = (employeeId?: string) => {
  const { data: loans, loading, refetch } = useCachedList(
    "loans",
    () => odooData.fetchLoans(employeeId),
    "Failed to load loans",
    [employeeId],
  );
  return { loans, loading, refetch };
}
