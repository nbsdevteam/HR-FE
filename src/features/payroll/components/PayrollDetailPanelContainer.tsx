import { useCallback } from "react";
import { PayrollDetailPanel } from "./PayrollDetailPanel";
import type { usePayrollPage } from "../hooks/usePayrollPage";

type PayrollDetailPanelContainerProps = {
  page: ReturnType<typeof usePayrollPage>;
};

export const PayrollDetailPanelContainer = ({ page }: PayrollDetailPanelContainerProps) => {
  const { refetchLedgers, setSelectedEmpId } = page;

  const handleClose = useCallback(() => {
    setSelectedEmpId(null);
  }, [setSelectedEmpId]);

  const handleLedgerUpdate = useCallback(async () => {
    await refetchLedgers();
  }, [refetchLedgers]);

  return (
    <PayrollDetailPanel
      empId={page.selectedEmpId}
      onClose={handleClose}
      payrollData={page.payrollData}
      selectedMonth={page.selectedMonth}
      employees={page.employees}
      ledgers={page.ledgers}
      onLedgerUpdate={handleLedgerUpdate}
      dbShifts={page.dbShifts}
      dbDepartments={page.dbDepartments}
      dbHolidays={page.dbHolidays}
      holidayDates={page.holidayDates}
      allowanceTypes={page.allowanceTypes}
      allEmployeeAllowances={page.allEmployeeAllowances}
      deductionTypes={page.deductionTypes}
      allEmployeeDeductions={page.allEmployeeDeductions}
      allLoans={page.allLoans}
      appSettings={page.appSettings}
    />
  );
};
