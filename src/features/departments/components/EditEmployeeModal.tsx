import { useState, useMemo, useCallback, useEffect } from "react";
import { Briefcase, Building2, Edit2, UserCheck, Users } from "lucide-react";
import { Modal, ModalFooterActions, TypeAhead } from "@/shared/components";
import { indexBy } from "@/shared/utils/collections";
import { arabicSource } from "@/i18n/source";
import { usePermissions } from "@/shared/auth/permissions";
import type { OrgNode } from "../types";
import { getDescendantIds } from "../utils/hierarchyTree";
import FieldLabel from "./FieldLabel";
import LabeledTextField from "./LabeledTextField";
import SelectedManagerCard from "./SelectedManagerCard";

const stringIdentity = (value: string): string => value;
const getManagerId = (n: OrgNode): string => String(n.id);
const getManagerLabel = (n: OrgNode): string =>
  `${n.name} — ${n.position} (${n.department})`;

type EmployeeUpdates = {
  name?: string;
  position?: string;
  department?: string;
  manager_id?: string | null;
};

const EditEmployeeModal = ({
  node,
  allNodes,
  departments,
  onSave,
  onClose,
}: {
  node: OrgNode;
  allNodes: OrgNode[];
  departments: string[];
  onSave: (dbId: string, updates: EmployeeUpdates) => void;
  onClose: () => void;
}) => {
  const [name, setName] = useState(node.name);
  const [position, setPosition] = useState(node.position);
  const [department, setDepartment] = useState(node.department);
  const [managerId, setManagerId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const { hasPermission } = usePermissions();

  const canEditReporting = hasPermission("hr.employees.edit");

  const nodesById = useMemo(
    () => indexBy(allNodes, (candidate) => candidate.id),
    [allNodes],
  );

  // Managers a node may report to: anyone that is not itself, not one of its
  // own descendants (which would create a cycle), and not the virtual root.
  const validManagers = useMemo(() => {
    const descendantIds = getDescendantIds(node);
    return allNodes.filter(
      (candidate) =>
        candidate.id !== node.id &&
        !descendantIds.has(candidate.id) &&
        candidate.dbId !== "__root__",
    );
  }, [allNodes, node]);

  const selectedManager =
    managerId !== null ? nodesById.get(managerId) : undefined;

  const handleSubmit = useCallback((): void => {
    const nextErrors: Record<string, boolean> = {};
    if (!name.trim()) nextErrors.name = true;
    if (!position.trim()) nextErrors.position = true;
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const updates: EmployeeUpdates = {};
    if (name !== node.name) updates.name = name.trim();
    if (position !== node.position) updates.position = position.trim();
    if (department !== node.department) updates.department = department;
    // Unauthorized users get a read-only manager field (below), but the
    // submit logic enforces this independently of what's rendered — local
    // `managerId` state must never reach the save payload without permission.
    if (canEditReporting) {
      if (managerId !== null) {
        const manager = nodesById.get(managerId);
        if (manager) updates.manager_id = manager.dbId;
      } else {
        updates.manager_id = null;
      }
    }

    onSave(node.dbId, updates);
  }, [name, position, department, managerId, node, nodesById, onSave, canEditReporting]);

  const handleNameChange = useCallback((value: string): void => {
    setName(value);
    setErrors((previous) => ({ ...previous, name: false }));
  }, []);

  const handlePositionChange = useCallback((value: string): void => {
    setPosition(value);
    setErrors((previous) => ({ ...previous, position: false }));
  }, []);

  const handleDepartmentChange = useCallback((value: string): void => {
    setDepartment(value);
  }, []);

  const handleManagerChange = useCallback((value: string): void => {
    setManagerId(value ? Number(value) : null);
  }, []);

  // Find current manager id — a node's parent is whoever lists it as a child.
  useEffect(() => {
    const parent = allNodes.find((candidate) =>
      candidate.children.some((child) => child.id === node.id),
    );
    setManagerId(parent && parent.dbId !== "__root__" ? parent.id : null);
  }, [node.id, allNodes]);

  return (
    <Modal
      onClose={onClose}
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      contentClassName="bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden w-full max-w-md mx-4"
      contentMotionProps={{
        initial: { opacity: 0, scale: 0.92, y: 20 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.92, y: 20 },
        transition: { type: "spring", stiffness: 400, damping: 30 },
      }}
      icon={Edit2}
      title={arabicSource("hierarchy.modifying_employee_data")}
      subtitle={arabicSource("hierarchy.update_employee_information")}
      headerClassName="bg-blue-500/10"
      iconBadgeClassName="bg-blue-500/20"
      iconColorClassName="text-blue-400"
      footer={
        <ModalFooterActions
          onCancel={onClose}
          onConfirm={handleSubmit}
          confirmLabel={arabicSource("common.save_changes")}
          confirmIcon={Edit2}
          confirmClassName="bg-blue-500 text-white hover:bg-blue-500/90"
        />
      }
    >
      <LabeledTextField
        icon={UserCheck}
        label={arabicSource("common.employee_name")}
        value={name}
        onChange={handleNameChange}
        placeholder={arabicSource("common.employee_name")}
        error={errors.name}
        errorMessage={arabicSource("common.please_enter_employee_name")}
        accentColorClassName="text-blue-400"
        focusBorderClassName="focus:border-blue-500/50"
      />

      <LabeledTextField
        icon={Briefcase}
        label={arabicSource("common.job_title")}
        value={position}
        onChange={handlePositionChange}
        placeholder={arabicSource("common.job_title")}
        error={errors.position}
        errorMessage={arabicSource("common.please_enter_your_job_title")}
        accentColorClassName="text-blue-400"
        focusBorderClassName="focus:border-blue-500/50"
      />

      <div>
        <FieldLabel icon={Building2} accentColorClassName="text-blue-400">
          {arabicSource("common.section")}
        </FieldLabel>
        <TypeAhead
          items={departments}
          getId={stringIdentity}
          getLabel={stringIdentity}
          value={department}
          onChange={handleDepartmentChange}
          optionsAreData
        />
      </div>

      <div>
        <FieldLabel icon={Users} accentColorClassName="text-blue-400">
          {arabicSource("hierarchy.direct_supervisor_optional")}
        </FieldLabel>
        {canEditReporting ? (
          <>
            <TypeAhead
              items={validManagers}
              getId={getManagerId}
              getLabel={getManagerLabel}
              value={managerId != null ? String(managerId) : ""}
              onChange={handleManagerChange}
              blankLabel={arabicSource("common.without_a_manager_top_of_the_pyramid")}
              optionsAreData
            />
            {selectedManager && (
              <SelectedManagerCard
                manager={selectedManager}
                avatarName={arabicSource("common.direct_manager")}
                label={
                  <>
                    {arabicSource("hierarchy.director")}{" "}
                    <span data-i18n-ignore>{selectedManager.name}</span>
                  </>
                }
                toneClassName="bg-blue-500/5 border-blue-500/10"
              />
            )}
          </>
        ) : (
          <p className="text-muted-foreground" style={{ fontSize: 13 }}>
            {selectedManager ? (
              <span data-i18n-ignore>{selectedManager.name}</span>
            ) : (
              arabicSource("common.without_a_manager_top_of_the_pyramid")
            )}
          </p>
        )}
      </div>
    </Modal>
  );
};

export default EditEmployeeModal;
