import { useCallback } from "react";
import { AnimatePresence } from "motion/react";
import { LeaveRequestModal } from "./LeaveRequestModal";
import { PermissionModal } from "./PermissionModal";
import type { useLeavePage } from "../hooks/useLeavePage";

type LeaveModalsProps = {
  page: ReturnType<typeof useLeavePage>;
};

export const LeaveModals = ({ page }: LeaveModalsProps) => {
  const { setShowForm, setShowPermForm } = page;

  const handleCloseLeaveForm = useCallback(() => {
    setShowForm(false);
  }, [setShowForm]);

  const handleClosePermissionForm = useCallback(() => {
    setShowPermForm(false);
  }, [setShowPermForm]);

  return (
    <>
      <AnimatePresence>
        {page.showForm && (
          <LeaveRequestModal
            employees={page.employees}
            leaveTypes={page.activeLeaveTypes}
            balances={page.balances}
            selfOnly={page.selfOnly}
            linkError={page.employeeLinkError}
            employeesLoading={page.empLoading}
            onClose={handleCloseLeaveForm}
            onSubmit={page.handleLeaveSubmit}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {page.showPermForm && (
          <PermissionModal
            employees={page.employees}
            onClose={handleClosePermissionForm}
            onSubmit={page.handlePermissionSubmit}
          />
        )}
      </AnimatePresence>
    </>
  );
};
