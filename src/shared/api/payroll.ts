import { hrCall } from "./client";
import {
  mapAllowanceType,
  mapEmployeeAllowance,
  mapDeductionType,
  mapEmployeeDeduction,
  mapLoan,
} from "./mappers";
import type {
  DbAllowanceType,
  DbEmployeeAllowance,
  DbDeductionType,
  DbEmployeeDeduction,
  DbLoan,
} from "../hooks";
import { items, eid } from "./httpHelpers";

/** Server-side payroll compute (same snapshot contract as FE generate). */
export const computePayrollServer = async (month: string) => {
  return hrCall("/api/hr/payroll/compute", { month });
}

export const fetchAllowanceTypes = async (): Promise<DbAllowanceType[]> => {
  const rows = await items<any>("/api/hr/payroll/allowance_types/list");
  return rows.map(mapAllowanceType);
}

export const fetchEmployeeAllowances = async (employeeId?: string): Promise<DbEmployeeAllowance[]> => {
  const params: Record<string, unknown> = {};
  if (employeeId) params.employee_id = Number(employeeId) || employeeId;
  const rows = await items<any>("/api/hr/payroll/employee_allowances/list", params);
  return rows.map(mapEmployeeAllowance);
}

export const fetchDeductionTypes = async (): Promise<DbDeductionType[]> => {
  const rows = await items<any>("/api/hr/payroll/deduction_types/list");
  return rows.map(mapDeductionType);
}

export const fetchEmployeeDeductions = async (employeeId?: string): Promise<DbEmployeeDeduction[]> => {
  const params: Record<string, unknown> = {};
  if (employeeId) params.employee_id = Number(employeeId) || employeeId;
  const rows = await items<any>("/api/hr/payroll/employee_deductions/list", params);
  return rows.map(mapEmployeeDeduction);
}

export const generatePayslips = async (payload: {
  month: string;
  payslips: Record<string, unknown>[];
  replace_month?: boolean;
}) => {
  return hrCall("/api/hr/payroll/payslips/generate", {
    month: payload.month,
    payslips: payload.payslips.map((p) => ({
      ...p,
      employee_id: eid(p.employee_id as string | number),
    })),
    replace_month: Boolean(payload.replace_month),
  });
}

export const fetchLoans = async (employeeId?: string | number): Promise<DbLoan[]> => {
  const params: Record<string, unknown> = { limit: 500 };
  if (employeeId) params.employee_id = eid(employeeId);
  const rows = await items<any>("/api/hr/payroll/loans/list", params);
  return rows.map(mapLoan);
}

export const createLoan = async (payload: Record<string, unknown>) => {
  const params = { ...payload };
  if (params.employee_id != null) params.employee_id = eid(params.employee_id as string | number);
  return hrCall("/api/hr/payroll/loans/create", params);
}

export const updateLoan = async (loanId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/payroll/loans/${eid(loanId)}/update`, payload);
}

export const deleteLoan = async (loanId: string | number) => {
  return hrCall(`/api/hr/payroll/loans/${eid(loanId)}/delete`, {});
}

export const createAllowanceType = async (payload: Record<string, unknown>) => {
  return hrCall("/api/hr/payroll/allowance_types/create", payload);
}

export const updateAllowanceType = async (typeId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/payroll/allowance_types/${eid(typeId)}/update`, payload);
}

export const deleteAllowanceType = async (typeId: string | number) => {
  return hrCall(`/api/hr/payroll/allowance_types/${eid(typeId)}/delete`, {});
}

export const createEmployeeAllowance = async (payload: Record<string, unknown>) => {
  const params = { ...payload };
  if (params.employee_id != null) params.employee_id = eid(params.employee_id as string | number);
  if (params.allowance_type_id != null) {
    params.allowance_type_id = eid(params.allowance_type_id as string | number);
  }
  return hrCall("/api/hr/payroll/employee_allowances/create", params);
}

export const updateEmployeeAllowance = async (allowanceId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/payroll/employee_allowances/${eid(allowanceId)}/update`, payload);
}

export const deleteEmployeeAllowance = async (allowanceId: string | number) => {
  return hrCall(`/api/hr/payroll/employee_allowances/${eid(allowanceId)}/delete`, {});
}

export const createDeductionType = async (payload: Record<string, unknown>) => {
  return hrCall("/api/hr/payroll/deduction_types/create", payload);
}

export const updateDeductionType = async (typeId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/payroll/deduction_types/${eid(typeId)}/update`, payload);
}

export const deleteDeductionType = async (typeId: string | number) => {
  return hrCall(`/api/hr/payroll/deduction_types/${eid(typeId)}/delete`, {});
}

export const createEmployeeDeduction = async (payload: Record<string, unknown>) => {
  const params = { ...payload };
  if (params.employee_id != null) params.employee_id = eid(params.employee_id as string | number);
  if (params.deduction_type_id != null) {
    params.deduction_type_id = eid(params.deduction_type_id as string | number);
  }
  return hrCall("/api/hr/payroll/employee_deductions/create", params);
}

export const updateEmployeeDeduction = async (deductionId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/payroll/employee_deductions/${eid(deductionId)}/update`, payload);
}

export const deleteEmployeeDeduction = async (deductionId: string | number) => {
  return hrCall(`/api/hr/payroll/employee_deductions/${eid(deductionId)}/delete`, {});
}

export const fetchCurrencies = async () => {
  return hrCall("/api/hr/currencies/list", {});
}

export const fetchCurrencyRates = async (filters?: {
  currencyFrom?: string;
  currencyTo?: string;
}) => {
  const params: Record<string, unknown> = { limit: 200 };
  if (filters?.currencyFrom) params.currency_from = filters.currencyFrom;
  if (filters?.currencyTo) params.currency_to = filters.currencyTo;
  return items<any>("/api/hr/currency_rates/list", params);
}

export const createCurrencyRate = async (payload: {
  currency_from: string;
  currency_to: string;
  rate: number;
  rate_date?: string;
  note?: string;
}) => {
  return hrCall("/api/hr/currency_rates/create", payload);
}

export const convertCurrency = async (payload: {
  amount: number;
  currency_from: string;
  currency_to: string;
  rate_date?: string;
}) => {
  return hrCall("/api/hr/currency_rates/convert", payload);
}
