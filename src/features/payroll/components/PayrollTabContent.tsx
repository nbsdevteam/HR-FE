import { lazy, Suspense } from "react";
import { AnimatePresence, motion } from "motion/react";
import OverviewTab from "./OverviewTab";
import type { usePayrollPage } from "../hooks/usePayrollPage";

const UploadTab = lazy(() => import("./UploadTab"));

type PayrollTabContentProps = {
  page: ReturnType<typeof usePayrollPage>;
};

const PayrollTabContent = ({ page }: PayrollTabContentProps) => (
  <AnimatePresence mode="wait">
    {page.activeTab === "overview" && (
      <motion.div
        key="overview"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
      >
        <OverviewTab
          items={page.items}
          totals={page.totals}
          loading={page.listLoading}
          error={page.listError}
          search={page.search}
          onSearchChange={page.handleSearchChange}
          departments={page.metadata?.departments}
          departmentId={page.departmentId}
          onDepartmentChange={page.handleDepartmentChange}
          statuses={page.metadata?.statuses}
          status={page.status}
          onStatusChange={page.handleStatusChange}
          page={page.page}
          perPage={page.perPage}
          totalPages={page.totalPages}
          total={page.total}
          onPageChange={page.onPageChange}
          onPerPageChange={page.onPerPageChange}
          onViewPayslip={page.setSelectedEmpId}
        />
      </motion.div>
    )}
    {page.activeTab === "upload" && (
      <motion.div
        key="upload"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
      >
        <Suspense fallback={null}>
          <UploadTab employees={page.employees} />
        </Suspense>
      </motion.div>
    )}
  </AnimatePresence>
);

export default PayrollTabContent;
