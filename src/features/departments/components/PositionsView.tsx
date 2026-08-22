import { useState, useEffect, useCallback, useMemo } from "react";
import { AnimatePresence } from "motion/react";
import { GripVertical, Loader2 } from "lucide-react";
import Toast from "@/shared/components/Toast";
import { empDisplayName, usePositions } from "@/shared/hooks";
import type { DbEmployee, DbDepartment, DbPosition } from "@/shared/hooks";
import * as odooData from "@/shared/api/odooData";
import { localizedConfirm } from "@/i18n/native";
import { arabicSource } from "@/i18n/source";
import type { PositionNode } from "../types";
import { buildPositionTree } from "../utils/hierarchyTree";
import UnassignedEmployeesSidebar from "./UnassignedEmployeesSidebar";
import PositionTreePanel from "./PositionTreePanel";
import PositionFormModal, { type PositionFormState } from "./PositionFormModal";

const PositionsView = ({
  dbEmployees,
  dbDepartments,
  deptColors,
  refetch,
}: {
  dbEmployees: DbEmployee[];
  dbDepartments: DbDepartment[];
  deptColors: Record<string, string>;
  refetch: () => void;
}) => {
  const [empSearch, setEmpSearch] = useState("");
  const [showAddPositionModal, setShowAddPositionModal] = useState(false);
  const [addParentId, setAddParentId] = useState<string | null>(null);
  const [editingPosition, setEditingPosition] = useState<PositionNode | null>(
    null,
  );
  const [expandedPositions, setExpandedPositions] = useState<
    Record<string, boolean>
  >({});
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [posForm, setPosForm] = useState<PositionFormState>({
    title_ar: "",
    title_en: "",
    department_id: "",
    max_headcount: "1",
    description: "",
  });

  const {
    positions,
    loading: posLoading,
    refetch: refetchPositions,
  } = usePositions();

  const positionTree = useMemo(
    () => buildPositionTree(positions, dbEmployees),
    [positions, dbEmployees],
  );

  // Unassigned employees (no position_id)
  const unassignedEmployees = useMemo(() => {
    const assigned = new Set(
      dbEmployees.filter((e) => e.position_id).map((e) => e.id),
    );
    return dbEmployees.filter((e) => !assigned.has(e.id));
  }, [dbEmployees]);

  const filteredUnassigned = useMemo(() => {
    if (!empSearch.trim()) return unassignedEmployees;
    const q = empSearch.trim().toLowerCase();
    return unassignedEmployees.filter(
      (e) => empDisplayName(e).includes(q) || (e.department || "").includes(q),
    );
  }, [unassignedEmployees, empSearch]);

  const togglePositionExpand = useCallback((id: string) => {
    setExpandedPositions((current) => ({
      ...current,
      [id]: !(current[id] ?? true),
    }));
  }, []);

  // Drop handler — assign employee to position
  const handleDrop = useCallback(
    async (employeeId: string, positionId: string) => {
      setSaving(true);
      const pos = positions.find(
        (position: DbPosition) => position.id === positionId,
      );
      if (!pos) {
        setSaving(false);
        return;
      }

      // Check headcount
      const currentCount = dbEmployees.filter(
        (e) => e.position_id === positionId,
      ).length;
      if (currentCount >= pos.max_headcount) {
        setToast(
          arabicSource("hierarchy.error_position_is_full_cannot_assign_more"),
        );
        setSaving(false);
        return;
      }

      // Auto-resolve department and manager
      const dept = dbDepartments.find((d) => d.id === pos.department_id);

      // Find manager: look for someone holding the parent position
      let managerId: string | null = null;
      if (pos.reports_to_position_id) {
        const parentHolder = dbEmployees.find(
          (e) => e.position_id === pos.reports_to_position_id,
        );
        if (parentHolder) managerId = parentHolder.id;
      }

      const updates: Record<string, any> = { position_id: positionId };
      if (dept) updates.department_id = dept.id;
      if (managerId) updates.manager_id = managerId;

      try {
        await odooData.updateEmployee(employeeId, updates);
        const emp = dbEmployees.find((e) => e.id === employeeId);
        setToast(
          `${arabicSource("common.is_set")}${emp ? empDisplayName(emp) : ""}${arabicSource("hierarchy.in_position")}${pos.title_ar}${arabicSource("common.successfully")}`,
        );
        await Promise.all([refetch(), refetchPositions()]);
      } catch (err: any) {
        setToast(`${arabicSource("common.error_2")} ${err?.message || ""}`);
      }
      setSaving(false);
    },
    [positions, dbEmployees, dbDepartments, refetch, refetchPositions],
  );

  // Add position
  const handleAddPosition = useCallback(async () => {
    if (!posForm.title_ar.trim()) return;
    setSaving(true);

    // Calculate level from parent
    let level = 0;
    if (addParentId) {
      const parent = positions.find(
        (position: DbPosition) => position.id === addParentId,
      );
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
      setPosForm({
        title_ar: "",
        title_en: "",
        department_id: "",
        max_headcount: "1",
        description: "",
      });
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
      setPosForm({
        title_ar: "",
        title_en: "",
        department_id: "",
        max_headcount: "1",
        description: "",
      });
      await refetchPositions();
    } catch (err: any) {
      setToast(`${arabicSource("common.error_2")} ${err?.message || ""}`);
    }
    setSaving(false);
  }, [editingPosition, posForm, refetchPositions]);

  // Delete position
  const handleDeletePosition = useCallback(
    async (posId: string) => {
      if (
        !localizedConfirm(
          arabicSource("hierarchy.do_you_want_to_delete_this_post"),
        )
      )
        return;
      setSaving(true);
      try {
        await odooData.deleteDesignation(posId);
        setToast(arabicSource("hierarchy.position_deleted"));
        await refetchPositions();
      } catch (err: any) {
        setToast(`${arabicSource("common.error_2")} ${err?.message || ""}`);
      }
      setSaving(false);
    },
    [refetchPositions],
  );

  const closeAddEditModal = useCallback(() => {
    setShowAddPositionModal(false);
    setEditingPosition(null);
  }, []);

  const openAddModal = useCallback((parentId: string | null) => {
    setAddParentId(parentId);
    setPosForm({
      title_ar: "",
      title_en: "",
      department_id: "",
      max_headcount: "1",
      description: "",
    });
    setShowAddPositionModal(true);
  }, []);

  const openEditModal = useCallback((pos: PositionNode) => {
    setEditingPosition(pos);
    setPosForm({
      title_ar: pos.title_ar,
      title_en: pos.title_en || "",
      department_id: pos.department_id || "",
      max_headcount: String(pos.max_headcount),
      description: pos.description || "",
    });
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  if (posLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <span className="text-muted-foreground ms-2">
          {arabicSource("common.loading")}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
        <GripVertical className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-foreground" style={{ fontSize: 13 }}>
            {arabicSource(
              "hierarchy.drag_the_employee_card_from_the_left_menu_and_drop_it_on_the_des",
            )}
          </p>
          <p className="text-muted-foreground mt-1" style={{ fontSize: 12 }}>
            {arabicSource(
              "hierarchy.the_department_and_manager_will_be_assigned_automatically_based",
            )}
          </p>
        </div>
      </div>

      <div className="flex gap-4" style={{ minHeight: 500 }}>
        <UnassignedEmployeesSidebar
          totalCount={unassignedEmployees.length}
          empSearch={empSearch}
          onSearchChange={setEmpSearch}
          filteredUnassigned={filteredUnassigned}
          deptColors={deptColors}
        />

        <PositionTreePanel
          positionTree={positionTree}
          dbDepartments={dbDepartments}
          dbEmployees={dbEmployees}
          deptColors={deptColors}
          saving={saving}
          onDrop={handleDrop}
          onAddPosition={openAddModal}
          onDeletePosition={handleDeletePosition}
          onEditPosition={openEditModal}
          expandedPositions={expandedPositions}
          togglePositionExpand={togglePositionExpand}
        />
      </div>
      {/* Add/Edit Position Modal */}
      <AnimatePresence>
        {(showAddPositionModal || editingPosition) && (
          <PositionFormModal
            editingPosition={editingPosition}
            posForm={posForm}
            setPosForm={setPosForm}
            dbDepartments={dbDepartments}
            onClose={closeAddEditModal}
            onConfirm={editingPosition ? handleEditPosition : handleAddPosition}
            saving={saving}
          />
        )}
      </AnimatePresence>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast}
            position="bottom-center"
            toneClassName={
              toast.startsWith(arabicSource("common.error"))
                ? "bg-card border-red-500/40"
                : "bg-card border-green-500/40"
            }
            textClassName="text-foreground"
            textSize={12}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PositionsView;
