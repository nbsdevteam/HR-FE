import type { DbAllowanceType, DbEmployeeAllowance, DbDeductionType, DbEmployeeDeduction, DbLoan } from "../../hooks";
import { sid, num, bool, empty } from "./mapHelpers";

export const mapAllowanceType = (r: any): DbAllowanceType => {
  return {
    id: sid(r.id),
    name_ar: r.name_ar || r.name || "",
    name_en: r.name_en || r.name || null,
    calc_method: r.calc_method || "fixed",
    default_amount: num(r.default_amount),
    percentage_of: r.percentage_of || "basic",
    is_taxable: bool(r.is_taxable),
    is_active: r.active !== false && r.is_active !== false,
    sort_order: num(r.sort_order),
    created_at: r.created_at || empty,
  };
}

export const mapEmployeeAllowance = (r: any): DbEmployeeAllowance => {
  return {
    id: sid(r.id),
    employee_id: sid(r.employee_id),
    allowance_type_id: sid(r.allowance_type_id),
    amount: num(r.amount),
    currency: r.currency || "IQD",
    is_active: r.active !== false && r.is_active !== false,
    start_date: r.start_date || null,
    end_date: r.end_date || null,
    created_at: r.created_at || empty,
  };
}

export const mapDeductionType = (r: any): DbDeductionType => {
  return {
    id: sid(r.id),
    name_ar: r.name_ar || r.name || "",
    name_en: r.name_en || r.name || null,
    calc_method: r.calc_method || "fixed",
    default_amount: num(r.default_amount),
    default_percentage: num(r.default_percentage),
    percentage_of: r.percentage_of || "basic",
    is_mandatory: bool(r.is_mandatory),
    is_active: r.active !== false && r.is_active !== false,
    sort_order: num(r.sort_order),
    created_at: r.created_at || empty,
  };
}

export const mapEmployeeDeduction = (r: any): DbEmployeeDeduction => {
  return {
    id: sid(r.id),
    employee_id: sid(r.employee_id),
    deduction_type_id: sid(r.deduction_type_id),
    amount: num(r.amount),
    percentage: num(r.percentage),
    calc_method: r.calc_method || "fixed",
    currency: r.currency || "IQD",
    is_active: r.active !== false && r.is_active !== false,
    start_date: r.start_date || null,
    end_date: r.end_date || null,
    created_at: r.created_at || empty,
  };
}

export const mapLoan = (r: any): DbLoan => {
  return {
    id: sid(r.id),
    employee_id: sid(r.employee_id),
    loan_amount: num(r.loan_amount),
    currency: r.currency || "IQD",
    installment_amount: num(r.installment_amount),
    total_installments: num(r.total_installments),
    paid_installments: num(r.paid_installments),
    remaining_amount: num(r.remaining_amount),
    interest_rate: num(r.interest_rate),
    status: r.status || "pending",
    reason: r.reason || null,
    approved_by: r.approved_by || null,
    approved_date: r.approved_date || null,
    start_date: r.start_date || "",
    end_date: r.end_date || null,
    created_at: r.created_at || empty,
    updated_at: r.updated_at || empty,
  };
}
