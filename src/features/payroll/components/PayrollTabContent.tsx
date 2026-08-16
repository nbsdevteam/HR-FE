import { AnimatePresence, motion } from "motion/react";
import { OverviewTab } from "./OverviewTab";
import { UploadTab } from "./UploadTab";
import type { usePayrollPage } from "../hooks/usePayrollPage";

type PayrollTabContentProps = {
  page: ReturnType<typeof usePayrollPage>;
};

export const PayrollTabContent = ({ page }: PayrollTabContentProps) => (
  <AnimatePresence mode="wait">
    {page.activeTab === "overview" && (
      <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
        <OverviewTab
          payrollData={page.payrollData}
          totalBasic={page.totalBasic}
          totalNet={page.totalNet}
          totalDeductions={page.totalDeductions}
          totalEmployees={page.totalEmployees}
          selectedMonth={page.selectedMonth}
          onViewPayslip={page.setSelectedEmpId}
        />
      </motion.div>
    )}
    {page.activeTab === "upload" && (
      <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
        <UploadTab
          employees={page.employees}
          selectedMonth={page.selectedMonth}
          onComplete={() => { /* refetch */ }}
        />
      </motion.div>
    )}
  </AnimatePresence>
);
