import { useCallback } from "react";
import PayrollDetailPanelContainer from "../components/PayrollDetailPanelContainer";
import PayrollHeader from "../components/PayrollHeader";
import PayrollTabContent from "../components/PayrollTabContent";
import PayrollTabs from "../components/PayrollTabs";
import LoadingState from "@/shared/components/LoadingState";
import { arabicSource } from "@/i18n/source";
import { usePayrollPage } from "../hooks/usePayrollPage";
import type { PayrollTabId } from "../types";

const Payroll = () => {
  const page = usePayrollPage();
  const { setActiveTab, handleMonthChange } = page;

  const handleTabChange = useCallback((tabId: PayrollTabId) => {
    setActiveTab(tabId);
  }, [setActiveTab]);

  // Metadata + first page load only — subsequent month/page/search changes
  // dim the table in place instead of tearing down the whole screen.
  if (page.initialLoading) {
    return <LoadingState message={arabicSource("payroll.loading_salary_data")} />;
  }

  return (
    <div className="space-y-6">
      <PayrollHeader
        availableMonths={page.availableMonths}
        displayMonth={page.displayMonth}
        payrollCount={page.total}
        payslipsSaved={page.payslipsSaved}
        savingPayslips={page.savingPayslips}
        selectedMonth={page.selectedMonth}
        onMonthChange={handleMonthChange}
        onGeneratePayslips={page.handleGeneratePayslips}
      />

      <PayrollTabs activeTab={page.activeTab} onTabChange={handleTabChange} />

      <PayrollTabContent page={page} />

      <PayrollDetailPanelContainer page={page} />
    </div>
  );
};

export default Payroll;
