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
import { crudFactory, fetchList, withEid } from "./crud";

const loans = crudFactory("/api/hr/payroll/loans");
const allowanceTypes = crudFactory("/api/hr/payroll/allowance_types");
const employeeAllowances = crudFactory("/api/hr/payroll/employee_allowances");
const deductionTypes = crudFactory("/api/hr/payroll/deduction_types");
const employeeDeductions = crudFactory("/api/hr/payroll/employee_deductions");

/** Server-side payroll compute (same snapshot contract as FE generate). */
export const computePayrollServer = (month: string) => hrCall("/api/hr/payroll/compute", { month });

export const fetchAllowanceTypes = (): Promise<DbAllowanceType[]> =>
  fetchList("/api/hr/payroll/allowance_types/list", mapAllowanceType);

export const fetchEmployeeAllowances = (employeeId?: string): Promise<DbEmployeeAllowance[]> => {
  const params: Record<string, unknown> = {};
  if (employeeId) params.employee_id = Number(employeeId) || employeeId;
  return fetchList("/api/hr/payroll/employee_allowances/list", mapEmployeeAllowance, params);
}

export const fetchDeductionTypes = (): Promise<DbDeductionType[]> =>
  fetchList("/api/hr/payroll/deduction_types/list", mapDeductionType);

export const fetchEmployeeDeductions = (employeeId?: string): Promise<DbEmployeeDeduction[]> => {
  const params: Record<string, unknown> = {};
  if (employeeId) params.employee_id = Number(employeeId) || employeeId;
  return fetchList("/api/hr/payroll/employee_deductions/list", mapEmployeeDeduction, params);
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

export const fetchLoans = (employeeId?: string | number): Promise<DbLoan[]> => {
  const params: Record<string, unknown> = { limit: 500 };
  if (employeeId) params.employee_id = eid(employeeId);
  return fetchList("/api/hr/payroll/loans/list", mapLoan, params);
}

export const createLoan = (payload: Record<string, unknown>) =>
  loans.create(withEid(payload, ["employee_id"]));
export const updateLoan = loans.update;
export const deleteLoan = loans.remove;

export const createAllowanceType = allowanceTypes.create;
export const updateAllowanceType = allowanceTypes.update;
export const deleteAllowanceType = allowanceTypes.remove;

export const createEmployeeAllowance = (payload: Record<string, unknown>) =>
  employeeAllowances.create(withEid(payload, ["employee_id", "allowance_type_id"]));
export const updateEmployeeAllowance = employeeAllowances.update;
export const deleteEmployeeAllowance = employeeAllowances.remove;

export const createDeductionType = deductionTypes.create;
export const updateDeductionType = deductionTypes.update;
export const deleteDeductionType = deductionTypes.remove;

export const createEmployeeDeduction = (payload: Record<string, unknown>) =>
  employeeDeductions.create(withEid(payload, ["employee_id", "deduction_type_id"]));
export const updateEmployeeDeduction = employeeDeductions.update;
export const deleteEmployeeDeduction = employeeDeductions.remove;

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
