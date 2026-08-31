import { useState, useMemo, useCallback, useEffect } from "react";
import { AnimatePresence } from "motion/react";
import { GripVertical, Loader2 } from "lucide-react";
import * as odooData from "@/shared/api/odooData";
import {
  useEmployees, useShifts, useEmployeeShiftAssignments, empDisplayName,
  type DbEmployee,
} from "@/shared/hooks";
import { SearchInput, Toast } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import DragEmpCard from "./DragEmpCard";
import ShiftDropZone from "./ShiftDropZone";

const ShiftAssigner = () => {
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { employees, refetch: refetchEmployees } = useEmployees();
  const { shifts, loading: shiftsLoading } = useShifts();
  const { assignments, loading: assignLoading, refetch: refetchAssignments } = useEmployeeShiftAssignments();

  // Map employees to their shift (via shift_id on employee or via assignment table)
  const empShiftMap = useMemo(() => {
    const map: Record<string, string> = {}; // empId → shiftId
    // First: per-employee shift_id (direct assignment)
    employees.forEach(e => { if (e.shift_id) map[e.id] = e.shift_id; });
    // Then: active assignments override
    assignments.forEach(a => { if (a.is_active) map[a.employee_id] = a.shift_id; });
    return map;
  }, [employees, assignments]);

  // Employees per shift
  const shiftEmployees = useMemo(() => {
    const result: Record<string, DbEmployee[]> = {};
    shifts.forEach(s => { result[s.id] = []; });
    employees.forEach(emp => {
      const sid = empShiftMap[emp.id];
      if (sid && result[sid]) result[sid].push(emp);
    });
    return result;
  }, [shifts, employees, empShiftMap]);

  // Unassigned employees (no shift)
  const unassigned = useMemo(() => {
    return employees.filter(e => !empShiftMap[e.id] && e.status !== arabicSource("common.finished"));
  }, [employees, empShiftMap]);

  const filteredUnassigned = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return unassigned;
    return unassigned.filter(e =>
      empDisplayName(e).toLowerCase().includes(query) ||
      (e.department || "").toLowerCase().includes(query),
    );
  }, [unassigned, search]);

  // Assign employee to shift
  const handleDrop = useCallback(async (empId: string, shiftId: string) => {
    setSaving(true);
    // Check for conflicts (already assigned to another shift)
    const existing = empShiftMap[empId];
    if (existing === shiftId) { setSaving(false); return; } // Already there

    try {
      await odooData.createShiftAssignment({
        employee_id: empId,
        shift_id: shiftId,
        set_employee_default: true,
      });
      const emp = employees.find(e => e.id === empId);
      const shift = shifts.find(s => s.id === shiftId);
      setToast(`${arabicSource("common.is_set")}${emp ? empDisplayName(emp) : ""}${arabicSource("shared.at_work")}${shift?.name || ""}${arabicSource("common.successfully")}`);
    } catch (e: any) {
      setToast(`${arabicSource("common.error_2")} ${e?.message || "فشل التعيين"}`);
    }
    await refetchEmployees();
    await refetchAssignments();
    setSaving(false);
  }, [empShiftMap, employees, shifts, refetchEmployees, refetchAssignments]);

  // Remove employee from shift
  const handleRemove = useCallback(async (empId: string) => {
    setSaving(true);
    try {
      await odooData.updateEmployee(empId, { shift_id: false });
      setToast(arabicSource("shared.the_shift_assignment_has_been_cancelled"));
    } catch (e: any) {
      setToast(`${arabicSource("common.error_2")} ${e?.message || "فشل الإلغاء"}`);
    }
    await refetchEmployees();
    await refetchAssignments();
    setSaving(false);
  }, [refetchEmployees, refetchAssignments]);

  const handleSearchChange = useCallback((nextSearch: string) => {
    setSearch(nextSearch);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const isErrorToast = toast?.startsWith(arabicSource("common.error")) ?? false;

  if (shiftsLoading || assignLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <span className="text-muted-foreground ms-2">{arabicSource("common.loading")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-start gap-3">
        <GripVertical className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-muted-foreground" style={{ fontSize: 12 }}>
          {arabicSource("shared.drag_employees_from_the_left_menu_and_drop_them_onto_the_desired")}
        </p>
      </div>

      <div className="flex gap-4" style={{ maxHeight: 480 }}>
        {/* Sidebar: Unassigned */}
        <div className="w-64 shrink-0 bg-card/30 border border-border/40 rounded-xl overflow-hidden flex flex-col" style={{ maxHeight: 480 }}>
          <div className="p-3 border-b border-border/30">
            <h4 className="text-foreground mb-2" style={{ fontSize: 13 }}>{arabicSource("shared.non_working")}{unassigned.length})</h4>
            <SearchInput
              iconClassName="absolute start-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground"
              inputClassName="w-full bg-background border border-border/40 rounded-lg ps-8 pe-3 py-1.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
              value={search}
              onChange={handleSearchChange}
              placeholder={arabicSource("common.search")}
              style={{ fontSize: 11 }}
            />
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {filteredUnassigned.length > 0 ? filteredUnassigned.map(emp => (
              <DragEmpCard key={emp.id} emp={emp} color="#8B5CF6" />
            )) : (
              <p className="text-center text-muted-foreground py-4" style={{ fontSize: 11 }}>
                {search ? arabicSource("common.no_results_found") : arabicSource("shared.all_employees_are_appointed")}
              </p>
            )}
          </div>
        </div>

        {/* Shift grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 content-start overflow-y-auto" style={{ maxHeight: 480 }}>
          {shifts.map(shift => (
            <ShiftDropZone
              key={shift.id}
              shift={shift}
              assignedEmps={shiftEmployees[shift.id] || []}
              onDrop={handleDrop}
              onRemove={handleRemove}
            />
          ))}
        </div>
      </div>

      {/* Saving indicator */}
      {saving && (
        <div className="flex items-center justify-center gap-2 text-primary">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span style={{ fontSize: 12 }}>{arabicSource("common.saving")}</span>
        </div>
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast}
            position="bottom-center"
            textSize={12}
            exit={{ opacity: 0, y: 10 }}
            toneClassName={isErrorToast ? "bg-toast-error border-toast-error-border" : "bg-toast-success border-toast-success-border"}
            textClassName={isErrorToast ? "text-toast-error-fg font-medium" : "text-toast-success-fg font-medium"}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShiftAssigner;
