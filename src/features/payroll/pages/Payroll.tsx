import { useCallback } from "react";
import PayrollDetailPanelContainer from "../components/PayrollDetailPanelContainer";
import PayrollHeader from "../components/PayrollHeader";
import PayrollLoadingState from "../components/PayrollLoadingState";
import PayrollTabContent from "../components/PayrollTabContent";
import PayrollTabs from "../components/PayrollTabs";
import { usePayrollPage } from "../hooks/usePayrollPage";
import type { PayrollTabId } from "../types";

export const Payroll = () => {
  const page = usePayrollPage();
  const { setActiveTab, setSelectedMonth } = page;

  const handleTabChange = useCallback((tabId: PayrollTabId) => {
    setActiveTab(tabId);
  }, [setActiveTab]);

  const handleMonthChange = useCallback((month: string) => {
    setSelectedMonth(month);
  }, [setSelectedMonth]);

  if (page.loading) {
    return <PayrollLoadingState />;
  }

  return (
    <div className="space-y-6">
      <PayrollHeader
        availableMonths={page.availableMonths}
        displayMonth={page.displayMonth}
        payrollCount={page.payrollData.length}
        payslipsSaved={page.payslipsSaved}
        savingPayslips={page.savingPayslips}
        selectedMonth={page.selectedMonth}
        onMonthChange={handleMonthChange}
        onSavePayslips={page.handleSavePayslips}
        onServerComputePayslips={page.handleServerComputePayslips}
      />

      <PayrollTabs activeTab={page.activeTab} onTabChange={handleTabChange} />

      <PayrollTabContent page={page} />

      <PayrollDetailPanelContainer page={page} />
    </div>
  );
};
