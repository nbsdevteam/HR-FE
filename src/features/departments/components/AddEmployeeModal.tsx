import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users, ChevronDown, Minus, Plus, Maximize2, Search, Printer, Download,
  Move, X, UserPlus, Trash2, Building2, UserCheck, Briefcase, ChevronLeft,
  Loader2, AlertTriangle, Link2, Crown, Edit2, Network, GripVertical, Save, ChevronRight as ChevronRightIcon, GitBranch
} from "lucide-react";
import { empDisplayName } from "@/shared/hooks";
import type { DbEmployee, DbDepartment, DbPosition } from "@/shared/hooks";
import * as odooData from "@/shared/api/odooData";
import i18n, { getLanguageDirection, normalizeLanguage } from "@/i18n";
import { formatDate } from "@/i18n/format";
import { translateArabicSource } from "@/i18n/legacy";
import { localizedConfirm } from "@/i18n/native";
import { arabicSource } from "@/i18n/source";
import type { OrgNode, PositionNode } from "../types";
import { avatarColors, CLEVEL_COLOR, defaultDeptColorMap, OWNER_COLOR } from "../styles";
import {
  buildPositionTree,
  countDescendants,
  findParentOf,
  flattenTree,
  pickUniqueColor,
} from "../utils/hierarchyTree";

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden w-full max-w-md mx-4"
        onClick={e => e.stopPropagation()}>
        <div className="bg-primary/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-foreground" style={{ fontSize: 15 }}>{arabicSource("common.add_a_new_employee")}</h3>
              <p className="text-muted-foreground" style={{ fontSize: 11 }}>{arabicSource("hierarchy.will_be_added_to_the_organizational_structure_and_database")}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>
              <span className="flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5 text-primary" /> {arabicSource("common.employee_name")}</span>
            </label>
            <input type="text" value={name} onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: false })); }}
              placeholder={arabicSource("hierarchy.example_ahmed_ali")}
              className={`w-full bg-background border rounded-lg px-3 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors ${errors.name ? "border-red-500" : "border-border/60"}`}
              style={{ fontSize: 13 }} />
            {errors.name && <p className="text-red-400 mt-1" style={{ fontSize: 11 }}>{arabicSource("common.please_enter_employee_name")}</p>}
          </div>

          <div>
            <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>
              <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-primary" /> {arabicSource("common.job_title")}</span>
            </label>
            <input type="text" value={position} onChange={e => { setPosition(e.target.value); setErrors(p => ({ ...p, position: false })); }}
              placeholder={arabicSource("hierarchy.example_software_developer")}
              className={`w-full bg-background border rounded-lg px-3 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors ${errors.position ? "border-red-500" : "border-border/60"}`}
              style={{ fontSize: 13 }} />
            {errors.position && <p className="text-red-400 mt-1" style={{ fontSize: 11 }}>{arabicSource("common.please_enter_your_job_title")}</p>}
          </div>

          <div>
            <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>
              <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-primary" /> {arabicSource("common.section")}</span>
            </label>
            {!showNewDept ? (
              <div className="space-y-2">
                <select value={department} onChange={e => setDepartment(e.target.value)}
                  className="w-full bg-background border border-border/60 rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                  style={{ fontSize: 13 }}>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
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
            <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>
              <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-primary" /> {arabicSource("hierarchy.direct_supervisor_manager")}</span>
            </label>
            <select value={managerId} onChange={e => setManagerId(Number(e.target.value))}
              className="w-full bg-background border border-border/60 rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:border-primary/50 transition-colors"
              style={{ fontSize: 13 }}>
              {allNodes.filter(n => n.dbId !== "__root__").map(n => <option key={n.dbId} value={n.id}>{n.name} — {n.position} ({n.department})</option>)}
            </select>
            {selectedManager && selectedManager.dbId !== "__root__" && (
              <div className="mt-2 flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
                {selectedManager.photo ? (
                  <img src={selectedManager.photo} alt={selectedManager.name} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: selectedManager.color }}>
                    <span className="text-white" style={{ fontSize: 10 }}>{selectedManager.initials}</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate" style={{ fontSize: 11 }}>{arabicSource("hierarchy.will_be_affiliated_with")} {selectedManager.name}</p>
                  <p className="text-muted-foreground truncate" style={{ fontSize: 10 }}>{selectedManager.department}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border/30 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: 13 }}>{arabicSource("common.cancel")}</button>
          <button onClick={handleSubmit} className="px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2" style={{ fontSize: 13 }}>
            <UserPlus className="w-4 h-4" /> {arabicSource("hierarchy.addition_to_the_structure")}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );

};

export default AddEmployeeModal;
