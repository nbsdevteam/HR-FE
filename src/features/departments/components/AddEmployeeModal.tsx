import { useState } from "react";
import { Modal, ModalFooterActions, NodeAvatar, Select } from "@/shared/components";
import { Users, UserPlus, UserCheck, Briefcase, Building2, Plus, ChevronLeft } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { OrgNode } from "../types";
import { avatarColors } from "../styles";
import { pickUniqueColor } from "../utils/hierarchyTree";
import FieldLabel from "./FieldLabel";
import LabeledTextField from "./LabeledTextField";

const AddEmployeeModal = ({
  allNodes, departments, departmentColors, preselectedManagerId, onAdd, onClose, onAddDepartment,
}: {
  allNodes: OrgNode[]; departments: string[]; departmentColors: Record<string, string>;
  preselectedManagerId: number | null;
  onAdd: (parentDbId: string, name: string, position: string, department: string) => void;
  onClose: () => void;
  onAddDepartment: (name: string, color: string) => void;
}) => {
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [department, setDepartment] = useState(departments[0] || "");
  const [managerId, setManagerId] = useState<number>(preselectedManagerId ?? allNodes[0]?.id ?? 0);
  const [showNewDept, setShowNewDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptColor, setNewDeptColor] = useState(() => pickUniqueColor(new Set(Object.values(departmentColors))));
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const selectedManager = allNodes.find(n => n.id === managerId);

  const handleSubmit = () => {
    const e: Record<string, boolean> = {};
    if (!name.trim()) e.name = true;
    if (!position.trim()) e.position = true;
    if (showNewDept && !newDeptName.trim()) e.newDept = true;
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    let finalDept = department;
    if (showNewDept && newDeptName.trim()) {
      finalDept = newDeptName.trim();
      onAddDepartment(finalDept, newDeptColor);
    }
    const parentNode = allNodes.find(n => n.id === managerId);
    const parentDbId = parentNode?.dbId || "__root__";
    onAdd(parentDbId, name.trim(), position.trim(), finalDept);
    onClose();
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
            onChange={(v) => { setName(v); setErrors(p => ({ ...p, name: false })); }}
            placeholder={arabicSource("hierarchy.example_ahmed_ali")}
            error={errors.name}
            errorMessage={arabicSource("common.please_enter_employee_name")}
          />

          <LabeledTextField
            icon={Briefcase}
            label={arabicSource("common.job_title")}
            value={position}
            onChange={(v) => { setPosition(v); setErrors(p => ({ ...p, position: false })); }}
            placeholder={arabicSource("hierarchy.example_software_developer")}
            error={errors.position}
            errorMessage={arabicSource("common.please_enter_your_job_title")}
          />

          <div>
            <FieldLabel icon={Building2}>{arabicSource("common.section")}</FieldLabel>
            {!showNewDept ? (
              <div className="space-y-2">
                <Select value={department} onChange={e => setDepartment(e.target.value)}
                  className="w-full bg-background border border-border/60 rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                  style={{ fontSize: 13 }}>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </Select>
                <button type="button" onClick={() => setShowNewDept(true)}
                  className="flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors" style={{ fontSize: 12 }}>
                  <Plus className="w-3.5 h-3.5" /> {arabicSource("hierarchy.add_a_new_section")}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input type="text" value={newDeptName} onChange={e => { setNewDeptName(e.target.value); setErrors(p => ({ ...p, newDept: false })); }}
                    placeholder={arabicSource("hierarchy.name_of_the_new_section")} autoFocus
                    className={`flex-1 bg-background border rounded-lg px-3 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors ${errors.newDept ? "border-red-500" : "border-border/60"}`}
                    style={{ fontSize: 13 }} />
                  <div className="flex items-center gap-1 flex-wrap" style={{ maxWidth: 140 }}>
                    {avatarColors.filter(c => !Object.values(departmentColors).includes(c)).slice(0, 8).map(c => (
                      <button key={c} type="button" onClick={() => setNewDeptColor(c)}
                        className={`w-5 h-5 rounded-full transition-all ${newDeptColor === c ? "ring-2 ring-white scale-110" : "opacity-60 hover:opacity-100"}`}
                        style={{ background: c }} />
                    ))}
                  </div>
                </div>
                {errors.newDept && <p className="text-red-400" style={{ fontSize: 11 }}>{arabicSource("hierarchy.please_enter_the_department_name")}</p>}
                <button type="button" onClick={() => { setShowNewDept(false); setNewDeptName(""); }}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: 12 }}>
                  <ChevronLeft className="w-3 h-3" /> {arabicSource("hierarchy.return_to_current_sections")}
                </button>
              </div>
            )}
          </div>

          <div>
            <FieldLabel icon={Users}>{arabicSource("hierarchy.direct_supervisor_manager")}</FieldLabel>
            <Select value={managerId} onChange={e => setManagerId(Number(e.target.value))}
              className="w-full bg-background border border-border/60 rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:border-primary/50 transition-colors"
              style={{ fontSize: 13 }}>
              {allNodes.filter(n => n.dbId !== "__root__").map(n => <option key={n.dbId} value={n.id}>{n.name} — {n.position} ({n.department})</option>)}
            </Select>
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
