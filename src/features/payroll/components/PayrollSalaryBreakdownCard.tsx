import { Banknote, ArrowUpRight, Clock, ArrowDownRight, XCircle, CreditCard } from "lucide-react";
import type { SalaryCalculation, SalaryCalculationPerCurrency } from "@/features/payroll";
import { formatCurrency, formatHoursMinutes } from "@/features/payroll";
import { arabicSource } from "@/i18n/source";
import { payrollCardClass as cardCls } from "../styles";
import PayrollAllowanceRow from "./PayrollAllowanceRow";
import PayrollDeductionRow from "./PayrollDeductionRow";

type PayrollSalaryBreakdownCardProps = {
  sc: SalaryCalculationPerCurrency;
  calc: SalaryCalculation;
  monthLabel: string;
};

const PayrollSalaryBreakdownCard = ({ sc, calc, monthLabel }: PayrollSalaryBreakdownCardProps) => (
  <div className={`${cardCls} p-6`}>
    <div className="flex items-center gap-3 mb-5">
      <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
        <Banknote className="w-5 h-5 text-primary" />
      </div>
      <div>
        <h3 className="text-foreground">{arabicSource("payroll.salary_details")} {sc.currency === "IQD" ? arabicSource("payroll.iraqi_dinar") : sc.currency === "USD" ? arabicSource("payroll.us_dollars") : sc.currency}</h3>
        <p className="text-muted-foreground" style={{ fontSize: 12 }}>{monthLabel}</p>
      </div>
    </div>

    <div className="space-y-3">
      <div className="flex items-center justify-between py-2.5 border-b border-border/20">
        <span className="text-foreground" style={{ fontSize: 14 }}>{arabicSource("common.basic_salary")}</span>
        <span className="text-foreground" style={{ fontSize: 14 }} dir="ltr">{formatCurrency(sc.baseSalary, sc.currency)}</span>
      </div>

      {sc.overtimePayment > 0 && (
        <div className="flex items-center justify-between py-2.5 border-b border-border/20">
          <span className="text-emerald-400 flex items-center gap-2" style={{ fontSize: 14 }}>
            <ArrowUpRight className="w-4 h-4" />
            {arabicSource("payroll.overtime")}{formatHoursMinutes(calc.overtimeHours)})
          </span>
          <span className="text-emerald-400" style={{ fontSize: 14 }} dir="ltr">+{formatCurrency(sc.overtimePayment, sc.currency)}</span>
        </div>
      )}

      {sc.allowanceBreakdown.length > 0 && (
        <>
          <div className="pt-2">
            <p className="text-muted-foreground mb-2" style={{ fontSize: 12 }}>{arabicSource("payroll.allowances")}</p>
          </div>
          {sc.allowanceBreakdown.map((a, idx) => (
            <PayrollAllowanceRow key={idx} name={a.name} amount={a.amount} currency={sc.currency} />
          ))}
          <div className="flex items-center justify-between py-2 ps-4">
            <span className="text-emerald-400" style={{ fontSize: 13, fontWeight: 500 }}>{arabicSource("common.total_allowances")}</span>
            <span className="text-emerald-400" style={{ fontSize: 13, fontWeight: 500 }} dir="ltr">+{formatCurrency(sc.totalAllowances, sc.currency)}</span>
          </div>
        </>
      )}

      <div className="flex items-center justify-between py-2.5 bg-primary/5 rounded-lg px-3 -mx-3">
        <span className="text-primary" style={{ fontSize: 14 }}>{arabicSource("payroll.gross_salary")}</span>
        <span className="text-primary" style={{ fontSize: 16 }} dir="ltr">{formatCurrency(sc.grossSalary, sc.currency)}</span>
      </div>

      {(sc.lateDeduction > 0 || sc.shortfallDeduction > 0 || sc.absenceDeduction > 0 || sc.loan > 0 || sc.penalty > 0 || sc.tip > 0 || sc.totalStatutoryDeductions > 0 || sc.loanInstallment > 0) && (
        <div className="pt-2">
          <p className="text-muted-foreground mb-2" style={{ fontSize: 12 }}>{arabicSource("payroll.deductions_and_adjustments")}</p>
        </div>
      )}

      {sc.lateDeduction > 0 && (
        <div className="flex items-center justify-between py-2 ps-4 border-b border-border/10">
          <span className="text-orange-400 flex items-center gap-2" style={{ fontSize: 13 }}>
            <Clock className="w-3.5 h-3.5" />
            {arabicSource("payroll.delay")}{calc.lateDays} {arabicSource("common.days_3")}
          </span>
          <span className="text-destructive" style={{ fontSize: 13 }} dir="ltr">-{formatCurrency(sc.lateDeduction, sc.currency)}</span>
        </div>
      )}

      {sc.shortfallDeduction > 0 && (
        <div className="flex items-center justify-between py-2 ps-4 border-b border-border/10">
          <span className="text-amber-400 flex items-center gap-2" style={{ fontSize: 13 }}>
            <ArrowDownRight className="w-3.5 h-3.5" />
            {arabicSource("payroll.shortage_of_hours")}{formatHoursMinutes(calc.shortfallHours)})
          </span>
          <span className="text-destructive" style={{ fontSize: 13 }} dir="ltr">-{formatCurrency(sc.shortfallDeduction, sc.currency)}</span>
        </div>
      )}

      {sc.absenceDeduction > 0 && (
        <div className="flex items-center justify-between py-2 ps-4 border-b border-border/10">
          <span className="text-destructive flex items-center gap-2" style={{ fontSize: 13 }}>
            <XCircle className="w-3.5 h-3.5" />
            {arabicSource("payroll.absence")}{calc.absenceDays.length} {arabicSource("common.days_3")}
          </span>
          <span className="text-destructive" style={{ fontSize: 13 }} dir="ltr">-{formatCurrency(sc.absenceDeduction, sc.currency)}</span>
        </div>
      )}

      {sc.loan > 0 && (
        <div className="flex items-center justify-between py-2 ps-4 border-b border-border/10">
          <span className="text-muted-foreground" style={{ fontSize: 13 }}>{arabicSource("common.advance")}</span>
          <span className="text-destructive" style={{ fontSize: 13 }} dir="ltr">-{formatCurrency(sc.loan, sc.currency)}</span>
        </div>
      )}

      {sc.penalty > 0 && (
        <div className="flex items-center justify-between py-2 ps-4 border-b border-border/10">
          <span className="text-muted-foreground" style={{ fontSize: 13 }}>{arabicSource("payroll.penalties")}</span>
          <span className="text-destructive" style={{ fontSize: 13 }} dir="ltr">-{formatCurrency(sc.penalty, sc.currency)}</span>
        </div>
      )}

      {sc.deductionBreakdown.length > 0 && sc.deductionBreakdown.map((d, idx) => (
        <PayrollDeductionRow key={idx} name={d.name} amount={d.amount} currency={sc.currency} />
      ))}

      {sc.loanInstallment > 0 && (
        <div className="flex items-center justify-between py-2 ps-4 border-b border-border/10">
          <span className="text-orange-400 flex items-center gap-2" style={{ fontSize: 13 }}>
            <CreditCard className="w-3.5 h-3.5" />
            {arabicSource("payroll.loan_installment")}
          </span>
          <span className="text-destructive" style={{ fontSize: 13 }} dir="ltr">-{formatCurrency(sc.loanInstallment, sc.currency)}</span>
        </div>
      )}

      {sc.tip > 0 && (
        <div className="flex items-center justify-between py-2 ps-4 border-b border-border/10">
          <span className="text-emerald-400" style={{ fontSize: 13 }}>{arabicSource("common.gratuity_tip")}</span>
          <span className="text-emerald-400" style={{ fontSize: 13 }} dir="ltr">+{formatCurrency(sc.tip, sc.currency)}</span>
        </div>
      )}

      <div className="flex items-center justify-between py-3 mt-2 bg-gradient-to-l from-primary/10 to-transparent rounded-lg px-3 -mx-3 border border-primary/20">
        <span className="text-primary flex items-center gap-2" style={{ fontSize: 16 }}>
          <CreditCard className="w-5 h-5" />
          {arabicSource("common.net_salary")}
        </span>
        <span className="text-gradient-gold" style={{ fontSize: 22 }} dir="ltr">{formatCurrency(sc.netSalary, sc.currency)}</span>
      </div>
    </div>
  </div>
);

export default PayrollSalaryBreakdownCard;
