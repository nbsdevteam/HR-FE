import { useState, useMemo, useCallback } from "react";
import { Modal, ModalFooterActions, TypeAhead } from "@/shared/components";
import { indexBy } from "@/shared/utils/collections";
import { Users, UserPlus, UserCheck, Briefcase, Building2 } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { OrgNode } from "../types";
import FieldLabel from "./FieldLabel";
import LabeledTextField from "./LabeledTextField";
import SelectedManagerCard from "./SelectedManagerCard";

const stringIdentity = (value: string): string => value;
const getManagerId = (n: OrgNode): string => String(n.id);
const getManagerLabel = (n: OrgNode): string =>
  `${n.name} — ${n.position} (${n.department})`;

const AddEmployeeModal = ({
  allNodes,
  departments,
  preselectedManagerId,
  onAdd,
  onClose,
}: {
  allNodes: OrgNode[];
  departments: string[];
  preselectedManagerId: number | null;
  onAdd: (
    parentDbId: string,
    name: string,
    position: string,
    department: string,
  ) => void;
  onClose: () => void;
}) => {
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [department, setDepartment] = useState(departments[0] || "");
  const [managerId, setManagerId] = useState<number>(
    preselectedManagerId ?? allNodes[0]?.id ?? 0,
  );
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const nodesById = useMemo(
    () => indexBy(allNodes, (node) => node.id),
    [allNodes],
  );

  const managerOptions = useMemo(
    () => allNodes.filter((node) => node.dbId !== "__root__"),
    [allNodes],
  );

  const selectedManager = nodesById.get(managerId);

  const handleSubmit = useCallback((): void => {
    const nextErrors: Record<string, boolean> = {};
    if (!name.trim()) nextErrors.name = true;
    if (!position.trim()) nextErrors.position = true;
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const parentDbId = nodesById.get(managerId)?.dbId || "__root__";
    onAdd(parentDbId, name.trim(), position.trim(), department);
    onClose();
  }, [name, position, department, managerId, nodesById, onAdd, onClose]);

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
    setManagerId(Number(value));
  }, []);

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
      icon={UserPlus}
      title={arabicSource("common.add_a_new_employee")}
      subtitle={arabicSource(
        "hierarchy.will_be_added_to_the_organizational_structure_and_database",
      )}
      footer={
        <ModalFooterActions
          onCancel={onClose}
          onConfirm={handleSubmit}
          confirmLabel={arabicSource("hierarchy.addition_to_the_structure")}
          confirmIcon={UserPlus}
        />
      }
    >
      <LabeledTextField
        icon={UserCheck}
        label={arabicSource("common.employee_name")}
        value={name}
        onChange={handleNameChange}
        placeholder={arabicSource("hierarchy.example_ahmed_ali")}
        error={errors.name}
        errorMessage={arabicSource("common.please_enter_employee_name")}
      />

      <LabeledTextField
        icon={Briefcase}
        label={arabicSource("common.job_title")}
        value={position}
        onChange={handlePositionChange}
        placeholder={arabicSource("hierarchy.example_software_developer")}
        error={errors.position}
        errorMessage={arabicSource("common.please_enter_your_job_title")}
      />

      <div>
        <FieldLabel icon={Building2}>
          {arabicSource("common.section")}
        </FieldLabel>
        <TypeAhead
          items={departments}
          getId={stringIdentity}
          getLabel={stringIdentity}
          value={department}
          onChange={handleDepartmentChange}
        />
      </div>

      <div>
        <FieldLabel icon={Users}>
          {arabicSource("hierarchy.direct_supervisor_manager")}
        </FieldLabel>
        <TypeAhead
          items={managerOptions}
          getId={getManagerId}
          getLabel={getManagerLabel}
          value={String(managerId)}
          onChange={handleManagerChange}
        />
        {selectedManager && selectedManager.dbId !== "__root__" && (
          <SelectedManagerCard
            manager={selectedManager}
            avatarName={selectedManager.name}
            label={`${arabicSource("hierarchy.will_be_affiliated_with")} ${selectedManager.name}`}
          />
        )}
      </div>
    </Modal>
  );
};

export default AddEmployeeModal;
