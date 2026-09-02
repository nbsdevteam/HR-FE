import { useCallback } from "react";
import PayrollDetailPanel from "./PayrollDetailPanel";
import type { usePayrollPage } from "../hooks/usePayrollPage";

type PayrollDetailPanelContainerProps = {
  page: ReturnType<typeof usePayrollPage>;
};

const PayrollDetailPanelContainer = ({ page }: PayrollDetailPanelContainerProps) => {
  const { refetchList, setSelectedEmpId } = page;

  const handleClose = useCallback(() => {
    setSelectedEmpId(null);
  }, [setSelectedEmpId]);

  const handleLedgerUpdate = useCallback((): void => {
    refetchList();
  }, [refetchList]);

  return (
    <PayrollDetailPanel
      empId={page.selectedEmpId}
      onClose={handleClose}
      selectedMonth={page.selectedMonth}
      metadata={page.metadata}
      onLedgerUpdate={handleLedgerUpdate}
      appSettings={page.appSettings}
    />
  );
};

export default PayrollDetailPanelContainer;
