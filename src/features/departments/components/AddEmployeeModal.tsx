import { useState } from "react";
import { Modal, ModalFooterActions, NodeAvatar, TypeAhead } from "@/shared/components";
import { Users, UserPlus, UserCheck, Briefcase, Building2 } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { OrgNode } from "../types";
import FieldLabel from "./FieldLabel";
import LabeledTextField from "./LabeledTextField";

const stringIdentity = (value: string): string => value;
const getManagerId = (n: OrgNode): string => String(n.id);
const getManagerLabel = (n: OrgNode): string => `${n.name} — ${n.position} (${n.department})`;

const AddEmployeeModal = ({
  allNodes, departments, preselectedManagerId, onAdd, onClose,
}: {
  allNodes: OrgNode[]; departments: string[];
  preselectedManagerId: number | null;
  onAdd: (parentDbId: string, name: string, position: string, department: string) => void;
  onClose: () => void;
}) => {
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [department, setDepartment] = useState(departments[0] || "");
  const [managerId, setManagerId] = useState<number>(preselectedManagerId ?? allNodes[0]?.id ?? 0);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const selectedManager = allNodes.find(n => n.id === managerId);

  const handleSubmit = () => {
    const e: Record<string, boolean> = {};
    if (!name.trim()) e.name = true;
    if (!position.trim()) e.position = true;
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    const parentNode = allNodes.find(n => n.id === managerId);
    const parentDbId = parentNode?.dbId || "__root__";
    onAdd(parentDbId, name.trim(), position.trim(), department);
    onClose();
  };

  const handleNameChange = (v: string): void => {
    setName(v);
    setErrors(p => ({ ...p, name: false }));
  };

  const handlePositionChange = (v: string): void => {
    setPosition(v);
    setErrors(p => ({ ...p, position: false }));
  };

  const handleDepartmentChange = (value: string): void => {
    setDepartment(value);
  };

  const handleManagerChange = (value: string): void => {
    setManagerId(Number(value));
  };

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
      subtitle={arabicSource("hierarchy.will_be_added_to_the_organizational_structure_and_database")}
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
            <FieldLabel icon={Building2}>{arabicSource("common.section")}</FieldLabel>
            <TypeAhead
              items={departments}
              getId={stringIdentity}
              getLabel={stringIdentity}
              value={department}
              onChange={handleDepartmentChange}
            />
          </div>

          <div>
            <FieldLabel icon={Users}>{arabicSource("hierarchy.direct_supervisor_manager")}</FieldLabel>
            <TypeAhead
              items={allNodes.filter(n => n.dbId !== "__root__")}
              getId={getManagerId}
              getLabel={getManagerLabel}
              value={String(managerId)}
              onChange={handleManagerChange}
            />
            {selectedManager && selectedManager.dbId !== "__root__" && (
              <div className="mt-2 flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
                <NodeAvatar photo={selectedManager.photo} name={selectedManager.name} color={selectedManager.color} initials={selectedManager.initials} sizeClassName="w-7 h-7" extraClassName="flex-shrink-0" fontSize={10} />
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate" style={{ fontSize: 11 }}>{arabicSource("hierarchy.will_be_affiliated_with")} {selectedManager.name}</p>
                  <p className="text-muted-foreground truncate" style={{ fontSize: 10 }}>{selectedManager.department}</p>
                </div>
              </div>
            )}
          </div>
    </Modal>
  );

};

export default AddEmployeeModal;
