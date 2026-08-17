import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Briefcase, GripVertical, Loader2, Network, Plus, Save, Search, X } from "lucide-react";
import { ModalOverlay } from "@/shared/components";
import { empDisplayName, usePositions } from "@/shared/hooks";
import type { DbEmployee, DbDepartment, DbPosition } from "@/shared/hooks";
import * as odooData from "@/shared/api/odooData";
import { localizedConfirm } from "@/i18n/native";
import { arabicSource } from "@/i18n/source";
import type { PositionNode } from "../types";
import { buildPositionTree } from "../utils/hierarchyTree";
import PositionCard from "./PositionCard";
import DraggableEmployeeCard from "./DraggableEmployeeCard";

const PositionsView = ({ dbEmployees, dbDepartments, deptColors, refetch }: {
  dbEmployees: DbEmployee[];
  dbDepartments: DbDepartment[];
  deptColors: Record<string, string>;
  refetch: () => void;
}) => {
  const { positions, loading: posLoading, refetch: refetchPositions } = usePositions();
  const [empSearch, setEmpSearch] = useState("");
  const [showAddPositionModal, setShowAddPositionModal] = useState(false);
  const [addParentId, setAddParentId] = useState<string | null>(null);
  const [editingPosition, setEditingPosition] = useState<PositionNode | null>(null);
  const [expandedPositions, setExpandedPositions] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state for add/edit position
  const [posForm, setPosForm] = useState({
    title_ar: "", title_en: "", department_id: "", max_headcount: "1", description: "",
  });

  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);

  const positionTree = useMemo(() => buildPositionTree(positions, dbEmployees), [positions, dbEmployees]);

  // Unassigned employees (no position_id)
  const unassignedEmployees = useMemo(() => {
    const assigned = new Set(dbEmployees.filter(e => e.position_id).map(e => e.id));
    return dbEmployees.filter(e => !assigned.has(e.id));
  }, [dbEmployees]);

  const filteredUnassigned = useMemo(() => {
    if (!empSearch.trim()) return unassignedEmployees;
    const q = empSearch.trim().toLowerCase();
    return unassignedEmployees.filter(e => empDisplayName(e).includes(q) || (e.department || "").includes(q));
  }, [unassignedEmployees, empSearch]);

  const togglePositionExpand = useCallback((id: string) => {
    setExpandedPositions((current) => ({ ...current, [id]: !(current[id] ?? true) }));
  }, []);

  // Drop handler — assign employee to position
  const handleDrop = useCallback(async (employeeId: string, positionId: string) => {
    setSaving(true);
    const pos = positions.find((position: DbPosition) => position.id === positionId);
    if (!pos) { setSaving(false); return; }

    // Check headcount
    const currentCount = dbEmployees.filter(e => e.position_id === positionId).length;
    if (currentCount >= pos.max_headcount) {
      setToast(arabicSource("hierarchy.error_position_is_full_cannot_assign_more"));
      setSaving(false);
      return;
    }

    // Auto-resolve department and manager
    const dept = dbDepartments.find(d => d.id === pos.department_id);

    // Find manager: look for someone holding the parent position
    let managerId: string | null = null;
    if (pos.reports_to_position_id) {
      const parentHolder = dbEmployees.find(e => e.position_id === pos.reports_to_position_id);
      if (parentHolder) managerId = parentHolder.id;
    }

    const updates: Record<string, any> = { position_id: positionId };
    if (dept) updates.department_id = dept.id;
    if (managerId) updates.manager_id = managerId;

    try {
      await odooData.updateEmployee(employeeId, updates);
      const emp = dbEmployees.find(e => e.id === employeeId);
      setToast(`${arabicSource("common.is_set")}${emp ? empDisplayName(emp) : ""}${arabicSource("hierarchy.in_position")}${pos.title_ar}${arabicSource("common.successfully")}`);
      await Promise.all([refetch(), refetchPositions()]);
    } catch (err: any) {
      setToast(`${arabicSource("common.error_2")} ${err?.message || ""}`);
    }
    setSaving(false);
  }, [positions, dbEmployees, dbDepartments, refetch, refetchPositions]);

  // Add position
  const handleAddPosition = useCallback(async () => {
    if (!posForm.title_ar.trim()) return;
    setSaving(true);

    // Calculate level from parent
    let level = 0;
    if (addParentId) {
      const parent = positions.find((position: DbPosition) => position.id === addParentId);
      if (parent) level = parent.level + 1;
    }

    try {
      await odooData.createDesignation({
        title_ar: posForm.title_ar.trim(),
        name: posForm.title_en.trim() || posForm.title_ar.trim(),
        department_id: posForm.department_id || null,
        reports_to_job_id: addParentId,
        max_headcount: parseInt(posForm.max_headcount) || 1,
        description: posForm.description.trim() || null,
        level,
      });
      setToast(arabicSource("hierarchy.the_position_was_created_successfully"));
      setShowAddPositionModal(false);
      setPosForm({ title_ar: "", title_en: "", department_id: "", max_headcount: "1", description: "" });
      await refetchPositions();
    } catch (err: any) {
      setToast(`${arabicSource("common.error_2")} ${err?.message || ""}`);
    }
    setSaving(false);
  }, [posForm, addParentId, positions, refetchPositions]);

  // Edit position
  const handleEditPosition = useCallback(async () => {
    if (!editingPosition || !posForm.title_ar.trim()) return;
    setSaving(true);
    try {
      await odooData.updateDesignation(editingPosition.id, {
        title_ar: posForm.title_ar.trim(),
        name: posForm.title_en.trim() || posForm.title_ar.trim(),
        department_id: posForm.department_id || null,
        max_headcount: parseInt(posForm.max_headcount) || 1,
        description: posForm.description.trim() || null,
      });
      setToast(arabicSource("hierarchy.position_updated_successfully"));
      setEditingPosition(null);
      setPosForm({ title_ar: "", title_en: "", department_id: "", max_headcount: "1", description: "" });
      await refetchPositions();
    } catch (err: any) {
      setToast(`${arabicSource("common.error_2")} ${err?.message || ""}`);
    }
    setSaving(false);
  }, [editingPosition, posForm, refetchPositions]);

  // Delete position
  const handleDeletePosition = useCallback(async (posId: string) => {
    if (!localizedConfirm(arabicSource("hierarchy.do_you_want_to_delete_this_post"))) return;
    setSaving(true);
    try {
      await odooData.deleteDesignation(posId);
      setToast(arabicSource("hierarchy.position_deleted"));
      await refetchPositions();
    } catch (err: any) {
      setToast(`${arabicSource("common.error_2")} ${err?.message || ""}`);
    }
    setSaving(false);
  }, [refetchPositions]);

  const closeAddEditModal = useCallback(() => {
    setShowAddPositionModal(false);
    setEditingPosition(null);
  }, []);

  const openAddModal = (parentId: string | null) => {
    setAddParentId(parentId);
    setPosForm({ title_ar: "", title_en: "", department_id: "", max_headcount: "1", description: "" });
    setShowAddPositionModal(true);
  };

  const openEditModal = (pos: PositionNode) => {
    setEditingPosition(pos);
    setPosForm({
      title_ar: pos.title_ar,
      title_en: pos.title_en || "",
      department_id: pos.department_id || "",
      max_headcount: String(pos.max_headcount),
      description: pos.description || "",
    });
  };

  if (posLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <span className="text-muted-foreground ms-2">{arabicSource("common.loading")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
        <GripVertical className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-foreground" style={{ fontSize: 13 }}>{arabicSource("hierarchy.drag_the_employee_card_from_the_left_menu_and_drop_it_on_the_des")}</p>
          <p className="text-muted-foreground mt-1" style={{ fontSize: 12 }}>{arabicSource("hierarchy.the_department_and_manager_will_be_assigned_automatically_based")}</p>
        </div>
      </div>

      <div className="flex gap-4" style={{ minHeight: 500 }}>
        {/* Sidebar: Unassigned employees */}
        <div className="w-72 shrink-0 bg-card/30 border border-border/40 rounded-xl overflow-hidden flex flex-col">
          <div className="p-3 border-b border-border/30">
            <h3 className="text-foreground mb-2" style={{ fontSize: 14 }}>{arabicSource("hierarchy.employees_without_position")}{unassignedEmployees.length})</h3>
            <div className="relative">
              <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input type="text" value={empSearch} onChange={e => setEmpSearch(e.target.value)}
                placeholder={arabicSource("common.search")}
                className="w-full bg-background border border-border/40 rounded-lg ps-8 pe-3 py-1.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
                style={{ fontSize: 12 }} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {filteredUnassigned.length > 0 ? filteredUnassigned.map(emp => (
              <DraggableEmployeeCard key={emp.id} emp={emp} deptColors={deptColors} />
            )) : (
              <p className="text-center text-muted-foreground py-6" style={{ fontSize: 12 }}>
                {empSearch ? arabicSource("common.no_results_found") : arabicSource("hierarchy.all_employees_are_appointed_to_positions")}
              </p>
            )}
          </div>
        </div>

        {/* Main: Position tree */}
        <div className="flex-1 bg-card/20 border border-border/30 rounded-xl overflow-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-foreground" style={{ fontSize: 15 }}>{arabicSource("common.position_structure")}</h3>
            <div className="flex items-center gap-2">
              {saving && (
                <div className="flex items-center gap-1.5 text-primary" style={{ fontSize: 12 }}>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> {arabicSource("common.saving")}
                </div>
              )}
              <button onClick={() => openAddModal(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors" style={{ fontSize: 12 }}>
                <Plus className="w-3.5 h-3.5" /> {arabicSource("hierarchy.new_position")}
              </button>
            </div>
          </div>

          {positionTree.length > 0 ? (
            <div className="flex gap-6 justify-center" style={{ minWidth: "fit-content" }}>
              {positionTree.map(root => (
                <PositionCard key={root.id} node={root} depth={0} departments={dbDepartments}
                  employees={dbEmployees} deptColors={deptColors} onDrop={handleDrop}
                  onAddPosition={openAddModal} onDeletePosition={handleDeletePosition} onEditPosition={openEditModal}
                  expandedPositions={expandedPositions} togglePositionExpand={togglePositionExpand} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Network className="w-12 h-12 mb-4 opacity-30" />
              <p style={{ fontSize: 16 }}>{arabicSource("hierarchy.there_are_no_positions_yet")}</p>
              <p className="mt-2" style={{ fontSize: 13 }}>{arabicSource("hierarchy.create_the_positions_first_and_then_drag_the_employees_to_assign")}</p>
              <button onClick={() => openAddModal(null)}
                className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors" style={{ fontSize: 13 }}>
                <Plus className="w-4 h-4" /> {arabicSource("hierarchy.create_the_first_position")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Position Modal */}
      <AnimatePresence>
        {(showAddPositionModal || editingPosition) && (
          <ModalOverlay
            onClose={closeAddEditModal}
            overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            contentClassName="bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden w-full max-w-md mx-4"
            contentMotionProps={{
              initial: { opacity: 0, scale: 0.92, y: 20 },
              animate: { opacity: 1, scale: 1, y: 0 },
              exit: { opacity: 0, scale: 0.92, y: 20 },
            }}
          >
              <div className="bg-primary/10 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-foreground" style={{ fontSize: 15 }}>
                    {editingPosition ? arabicSource("hierarchy.edit_position") : arabicSource("hierarchy.add_a_new_position")}
                  </h3>
                </div>
                <button onClick={closeAddEditModal}
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>{arabicSource("hierarchy.job_title_arabic")}</label>
                  <input type="text" value={posForm.title_ar} onChange={e => setPosForm(p => ({ ...p, title_ar: e.target.value }))}
                    placeholder={arabicSource("hierarchy.example_human_resources_manager")}
                    className="w-full bg-background border border-border/60 rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:border-primary/50"
                    style={{ fontSize: 13 }} />
                </div>
                <div>
                  <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>{arabicSource("hierarchy.job_title_english")}</label>
                  <input type="text" value={posForm.title_en} onChange={e => setPosForm(p => ({ ...p, title_en: e.target.value }))}
                    placeholder={arabicSource("hierarchy.example_human_resources_manager")} dir="ltr"
                    className="w-full bg-background border border-border/60 rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:border-primary/50"
                    style={{ fontSize: 13 }} />
                </div>
                <div>
                  <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>{arabicSource("common.section")}</label>
                  <select value={posForm.department_id} onChange={e => setPosForm(p => ({ ...p, department_id: e.target.value }))}
                    className="w-full bg-background border border-border/60 rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:border-primary/50"
                    style={{ fontSize: 13 }}>
                    <option value="">{arabicSource("common.no_section")}</option>
                    {dbDepartments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>{arabicSource("hierarchy.maximum_number")}</label>
                  <input type="number" value={posForm.max_headcount} onChange={e => setPosForm(p => ({ ...p, max_headcount: e.target.value }))}
                    min="1" max="100"
                    className="w-full bg-background border border-border/60 rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:border-primary/50"
                    style={{ fontSize: 13 }} dir="ltr" />
                </div>
                <div>
                  <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>{arabicSource("common.description")}</label>
                  <textarea value={posForm.description} onChange={e => setPosForm(p => ({ ...p, description: e.target.value }))}
                    rows={2} placeholder={arabicSource("hierarchy.position_description_and_responsibilities")}
                    className="w-full bg-background border border-border/60 rounded-lg px-3 py-2.5 text-foreground resize-none focus:outline-none focus:border-primary/50"
                    style={{ fontSize: 13 }} />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-border/30 flex items-center justify-end gap-3">
                <button onClick={closeAddEditModal}
                  className="px-4 py-2 rounded-lg bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: 13 }}>{arabicSource("common.cancel")}</button>
                <button onClick={editingPosition ? handleEditPosition : handleAddPosition} disabled={saving || !posForm.title_ar.trim()}
                  className="px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50" style={{ fontSize: 13 }}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingPosition ? arabicSource("common.save_changes") : arabicSource("hierarchy.create_position")}
                </button>
              </div>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-6 inset-x-0 flex justify-center z-40 pointer-events-none">
            <div className={`border rounded-full px-5 py-2.5 shadow-xl flex items-center gap-2 pointer-events-auto ${toast.startsWith(arabicSource("common.error")) ? "bg-card border-red-500/40" : "bg-card border-green-500/40"}`}>
              <span className="text-foreground" style={{ fontSize: 12 }}>{toast}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

};

export default PositionsView;
