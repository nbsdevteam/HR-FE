import { Download, Calculator, CheckCircle, Loader2 } from "lucide-react";
import { Select } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import { payrollSelectClass } from "../styles";

type PayrollHeaderProps = {
  availableMonths: string[];
  displayMonth: (month: string) => string;
  payrollCount: number;
  payslipsSaved: boolean;
  savingPayslips: boolean;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  onSavePayslips: () => void;
  onServerComputePayslips: () => void;
};

const PayrollHeader = ({
  availableMonths,
  displayMonth,
  payrollCount,
  payslipsSaved,
  savingPayslips,
  selectedMonth,
  onMonthChange,
  onSavePayslips,
  onServerComputePayslips,
}: PayrollHeaderProps) => {
  const handleMonthChange = (value: string): void => {
    onMonthChange(value);
  };

  return (
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    <div>
      <h1 className="text-gradient-gold">
        {arabicSource("payroll.payroll_and_payroll_management")}
      </h1>
      <p className="text-muted-foreground mt-1">
        {arabicSource("payroll.comprehensive_payroll_system")}{" "}
        {displayMonth(selectedMonth)}
      </p>
    </div>
    <div className="flex items-center gap-3">
      <Select
        value={selectedMonth}
        onChange={handleMonthChange}
        options={(availableMonths || []).map((month) => ({ value: month, label: displayMonth(month) }))}
        className={payrollSelectClass}
        style={{ width: 180 }}
      />
      <button
        onClick={onSavePayslips}
        disabled={savingPayslips || payslipsSaved || payrollCount === 0}
        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg shadow-lg shadow-primary/20 hover:bg-gold-dark transition-colors cursor-pointer disabled:opacity-50"
        style={{ fontSize: 13 }}
      >
        {savingPayslips ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : payslipsSaved ? (
          <CheckCircle className="w-4 h-4" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        {savingPayslips
          ? arabicSource("common.saving")
          : payslipsSaved
            ? arabicSource("payroll.saved")
            : arabicSource("payroll.save_statements")}
      </button>
      <button
        onClick={onServerComputePayslips}
        disabled={savingPayslips || !selectedMonth}
        title="Server compute from attendance/leave/holidays"
        className="flex items-center gap-2 px-4 py-2.5 border border-border text-foreground rounded-lg hover:bg-secondary transition-colors cursor-pointer disabled:opacity-50"
        style={{ fontSize: 13 }}
      >
        <Calculator className="w-4 h-4" />
        Server compute
      </button>
    </div>
  </div>
  );
};

export default PayrollHeader;
