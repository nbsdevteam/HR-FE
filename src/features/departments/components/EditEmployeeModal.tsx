import { useState, useEffect } from "react";
import { Briefcase, Building2, Edit2, UserCheck, Users, X } from "lucide-react";
import { ModalOverlay } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { OrgNode } from "../types";
import { getDescendantIds } from "../utils/hierarchyTree";

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
        <div className="bg-blue-500/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Edit2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-foreground" style={{ fontSize: 15 }}>{arabicSource("hierarchy.modifying_employee_data")}</h3>
              <p className="text-muted-foreground" style={{ fontSize: 11 }}>{arabicSource("hierarchy.update_employee_information")}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>
              <span className="flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5 text-blue-400" /> {arabicSource("common.employee_name")}</span>
            </label>
            <input type="text" value={name} onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: false })); }}
              placeholder={arabicSource("common.employee_name")}
              className={`w-full bg-background border rounded-lg px-3 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500/50 transition-colors ${errors.name ? "border-red-500" : "border-border/60"}`}
              style={{ fontSize: 13 }} />
            {errors.name && <p className="text-red-400 mt-1" style={{ fontSize: 11 }}>{arabicSource("common.please_enter_employee_name")}</p>}
          </div>

          <div>
            <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>
              <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-blue-400" /> {arabicSource("common.job_title")}</span>
            </label>
            <input type="text" value={position} onChange={e => { setPosition(e.target.value); setErrors(p => ({ ...p, position: false })); }}
              placeholder={arabicSource("common.job_title")}
              className={`w-full bg-background border rounded-lg px-3 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500/50 transition-colors ${errors.position ? "border-red-500" : "border-border/60"}`}
              style={{ fontSize: 13 }} />
            {errors.position && <p className="text-red-400 mt-1" style={{ fontSize: 11 }}>{arabicSource("common.please_enter_your_job_title")}</p>}
          </div>

          <div>
            <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>
              <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-blue-400" /> {arabicSource("common.section")}</span>
            </label>
            <select value={department} onChange={e => setDepartment(e.target.value)}
              className="w-full bg-background border border-border/60 rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:border-blue-500/50 transition-colors"
              style={{ fontSize: 13 }}>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>
              <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-blue-400" /> {arabicSource("hierarchy.direct_supervisor_optional")}</span>
            </label>
            <select value={managerId ?? ""} onChange={e => setManagerId(e.target.value ? Number(e.target.value) : null)}
              className="w-full bg-background border border-border/60 rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:border-blue-500/50 transition-colors"
              style={{ fontSize: 13 }}>
              <option value="">{arabicSource("common.without_a_manager_top_of_the_pyramid")}</option>
              {validManagers.map(n => <option key={n.dbId} value={n.id}>{n.name} — {n.position} ({n.department})</option>)}
            </select>
            {managerId !== null && (
              <div className="mt-2 flex items-center gap-2 p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/10">
                {allNodes.find(n => n.id === managerId)?.photo ? (
                  <img src={allNodes.find(n => n.id === managerId)?.photo!} alt={arabicSource("common.direct_manager")} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: allNodes.find(n => n.id === managerId)?.color }}>
                    <span className="text-white" style={{ fontSize: 10 }}>{allNodes.find(n => n.id === managerId)?.initials}</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate" style={{ fontSize: 11 }}>{arabicSource("hierarchy.director")} {allNodes.find(n => n.id === managerId)?.name}</p>
                  <p className="text-muted-foreground truncate" style={{ fontSize: 10 }}>{allNodes.find(n => n.id === managerId)?.department}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border/30 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: 13 }}>{arabicSource("common.cancel")}</button>
          <button onClick={handleSubmit} className="px-5 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-500/90 transition-colors flex items-center gap-2" style={{ fontSize: 13 }}>
            <Edit2 className="w-4 h-4" /> {arabicSource("common.save_changes")}
          </button>
        </div>
    </ModalOverlay>
  );

};

export default EditEmployeeModal;
