import { useState, useMemo, useCallback } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "@/shared/components";
import type { DbEmployee } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import type { OrgNode } from "../types";
import UnlinkedEmployeeRow from "./UnlinkedEmployeeRow";

const UnlinkedPanel = ({
  employees,
  allNodes,
  onLink,
  onClose,
}: {
  employees: DbEmployee[];
  allNodes: OrgNode[];
  onLink: (empDbId: string, managerDbId: string) => void;
  onClose: () => void;
}) => {
  const [selectedManager, setSelectedManager] = useState<
    Record<string, string>
  >({});

  const linkableNodes = useMemo(
    () => allNodes.filter((node) => node.dbId !== "__root__"),
    [allNodes],
  );

  const handleSelectManager = useCallback(
    (employeeId: string, managerDbId: string): void => {
      setSelectedManager((previous) => ({
        ...previous,
        [employeeId]: managerDbId,
      }));
    },
    [],
  );

  const handleLink = useCallback(
    (employeeId: string): void => {
      const managerDbId = selectedManager[employeeId];
      if (managerDbId) onLink(employeeId, managerDbId);
    },
    [selectedManager, onLink],
  );

  return (
    <Modal
      onClose={onClose}
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      contentClassName="bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden w-full max-w-lg mx-4 max-h-[80vh] flex flex-col"
      contentMotionProps={{
        initial: { opacity: 0, scale: 0.92, y: 20 },
        animate: { opacity: 1, scale: 1, y: 0 },
      }}
      icon={AlertTriangle}
      title={arabicSource("hierarchy.employees_without_attachment")}
      subtitle={arabicSource(
        "hierarchy.these_employees_do_not_have_a_specific_manager_identify_their_di",
      )}
      headerClassName="bg-amber-500/10"
      iconBadgeClassName="bg-amber-500/20"
      iconColorClassName="text-amber-500"
      headerWrapperClassName="shrink-0"
      bodyClassName="p-4 space-y-3 overflow-y-auto flex-1"
    >
      {employees.map((employee) => (
        <UnlinkedEmployeeRow
          key={employee.id}
          employee={employee}
          linkableNodes={linkableNodes}
          selectedManagerDbId={selectedManager[employee.id] || ""}
          onSelectManager={handleSelectManager}
          onLink={handleLink}
        />
      ))}
    </Modal>
  );
};

export default UnlinkedPanel;
