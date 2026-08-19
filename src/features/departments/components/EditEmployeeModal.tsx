import { useState, useEffect } from "react";
import { Briefcase, Building2, Edit2, UserCheck, Users } from "lucide-react";
import { ModalOverlay } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { OrgNode } from "../types";
import { getDescendantIds } from "../utils/hierarchyTree";
import FieldLabel from "./FieldLabel";
import LabeledTextField from "./LabeledTextField";
import ModalHeader from "./ModalHeader";
import ModalFooterActions from "./ModalFooterActions";
import NodeAvatar from "./NodeAvatar";

const EditEmployeeModal = ({ node, allNodes, departments, departmentColors, onSave, onClose }: {
  node: OrgNode;
  allNodes: OrgNode[];
  departments: string[];
  departmentColors: Record<string, string>;
  onSave: (dbId: string, updates: { name?: string; position?: string; department?: string; manager_id?: string | null }) => void;
  onClose: () => void;
}) => {
  const [name, setName] = useState(node.name);
  const [position, setPosition] = useState(node.position);
  const [department, setDepartment] = useState(node.department);
  const [managerId, setManagerId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  // Find current manager id
  useEffect(() => {
    const findManagerId = (searchNode: OrgNode, targetId: number): number | null | undefined => {
      for (const child of searchNode.children) {
        if (child.id === targetId) return searchNode.dbId === "__root__" ? null : searchNode.id;
        const result = findManagerId(child, targetId);
        if (result !== undefined) return result;
      }
      return undefined;
    };
    // Create a virtual root for searching
    const virtualRoot: OrgNode = {
      id: 0, dbId: "__root__", name: "root", initials: "R", position: "", department: "",
      color: "", photo: null, email: null,
      children: allNodes.filter(n => !allNodes.some(parent => parent.children.some(c => c.id === n.id))),
    };
    const currentManagerId = findManagerId(virtualRoot, node.id);
    setManagerId(currentManagerId ?? null);
  }, [node.id, allNodes]);

  const topColor = departmentColors[department] || node.color;
  const descendantIds = getDescendantIds(node);
  const validManagers = allNodes.filter(
    n => n.id !== node.id && !descendantIds.has(n.id) && n.dbId !== "__root__"
  );
  const selectedManager = managerId !== null ? allNodes.find(n => n.id === managerId) : undefined;

  const handleSubmit = () => {
    const e: Record<string, boolean> = {};
    if (!name.trim()) e.name = true;
    if (!position.trim()) e.position = true;
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    const updates: { name?: string; position?: string; department?: string; manager_id?: string | null } = {};
    if (name !== node.name) updates.name = name.trim();
    if (position !== node.position) updates.position = position.trim();
    if (department !== node.department) updates.department = department;
    if (managerId !== null) {
      const selectedManager = allNodes.find(n => n.id === managerId);
      if (selectedManager) updates.manager_id = selectedManager.dbId;
    } else {
      updates.manager_id = null;
    }

    onSave(node.dbId, updates);
  };

  return (
    <ModalOverlay
      onClose={onClose}
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      contentClassName="bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden w-full max-w-md mx-4"
      contentMotionProps={{
        initial: { opacity: 0, scale: 0.92, y: 20 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.92, y: 20 },
        transition: { type: "spring", stiffness: 400, damping: 30 },
      }}
    >
        <ModalHeader
          icon={Edit2}
          title={arabicSource("hierarchy.modifying_employee_data")}
          subtitle={arabicSource("hierarchy.update_employee_information")}
          onClose={onClose}
          headerClassName="bg-blue-500/10"
          iconBadgeClassName="bg-blue-500/20"
          iconColorClassName="text-blue-400"
        />

        <div className="p-6 space-y-4">
          <LabeledTextField
            icon={UserCheck}
            label={arabicSource("common.employee_name")}
            value={name}
            onChange={(v) => { setName(v); setErrors(p => ({ ...p, name: false })); }}
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
            onChange={(v) => { setPosition(v); setErrors(p => ({ ...p, position: false })); }}
            placeholder={arabicSource("common.job_title")}
            error={errors.position}
            errorMessage={arabicSource("common.please_enter_your_job_title")}
            accentColorClassName="text-blue-400"
            focusBorderClassName="focus:border-blue-500/50"
          />

          <div>
            <FieldLabel icon={Building2} accentColorClassName="text-blue-400">{arabicSource("common.section")}</FieldLabel>
            <select value={department} onChange={e => setDepartment(e.target.value)}
              className="w-full bg-background border border-border/60 rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:border-blue-500/50 transition-colors"
              style={{ fontSize: 13 }}>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <FieldLabel icon={Users} accentColorClassName="text-blue-400">{arabicSource("hierarchy.direct_supervisor_optional")}</FieldLabel>
            <select value={managerId ?? ""} onChange={e => setManagerId(e.target.value ? Number(e.target.value) : null)}
              className="w-full bg-background border border-border/60 rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:border-blue-500/50 transition-colors"
              style={{ fontSize: 13 }}>
              <option value="">{arabicSource("common.without_a_manager_top_of_the_pyramid")}</option>
              {validManagers.map(n => <option key={n.dbId} value={n.id}>{n.name} — {n.position} ({n.department})</option>)}
            </select>
            {selectedManager && (
              <div className="mt-2 flex items-center gap-2 p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/10">
                <NodeAvatar photo={selectedManager.photo} name={arabicSource("common.direct_manager")} color={selectedManager.color} initials={selectedManager.initials} sizeClassName="w-7 h-7" extraClassName="flex-shrink-0" fontSize={10} />
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate" style={{ fontSize: 11 }}>{arabicSource("hierarchy.director")} {selectedManager.name}</p>
                  <p className="text-muted-foreground truncate" style={{ fontSize: 10 }}>{selectedManager.department}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <ModalFooterActions
          onCancel={onClose}
          onConfirm={handleSubmit}
          confirmLabel={arabicSource("common.save_changes")}
          confirmIcon={Edit2}
          confirmClassName="bg-blue-500 text-white hover:bg-blue-500/90"
        />
    </ModalOverlay>
  );

};

export default EditEmployeeModal;
