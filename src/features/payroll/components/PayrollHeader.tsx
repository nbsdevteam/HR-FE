import { Download, Calculator, CheckCircle } from "lucide-react";
import { Button, Select } from "@/shared/components";
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

  const saveButtonIcon = payslipsSaved ? CheckCircle : Download;
  const saveButtonLabel = savingPayslips
    ? arabicSource("common.saving")
    : payslipsSaved
      ? arabicSource("payroll.saved")
      : arabicSource("payroll.save_statements");

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
      <Button
        onClick={onSavePayslips}
        disabled={savingPayslips || payslipsSaved || payrollCount === 0}
        loading={savingPayslips}
        icon={saveButtonIcon}
        variant="primary"
        rounded="rounded-lg"
        className="flex items-center gap-2 px-4 py-2.5 shadow-lg shadow-primary/20"
        style={{ fontSize: 13 }}
      >
        {saveButtonLabel}
      </Button>
      <Button
        onClick={onServerComputePayslips}
        disabled={savingPayslips || !selectedMonth}
        title="Server compute from attendance/leave/holidays"
        variant="outline"
        size="unstyled"
        rounded="rounded-lg"
        className="flex items-center gap-2 px-4 py-2.5"
        style={{ fontSize: 13 }}
        icon={Calculator}
      >
        Server compute
      </Button>
    </div>
  </div>
  );
};

export default PayrollHeader;
