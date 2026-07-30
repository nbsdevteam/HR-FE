import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Clock, Users, Search, GripVertical, X, AlertTriangle, CheckCircle, Loader2,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import {
  useEmployees, useShifts, useEmployeeShiftAssignments, empDisplayName,
  type DbEmployee, type DbShift, type DbEmployeeShiftAssignment,
} from "../lib/hooks";

// ── Draggable Employee Card ──

function DragEmpCard({ emp, color }: { emp: DbEmployee; color: string }) {
  const [dragging, setDragging] = useState(false);
  const name = empDisplayName(emp);

  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.setData("shift-employee-id", emp.id); e.dataTransfer.effectAllowed = "move"; setDragging(true); }}
      onDragEnd={() => setDragging(false)}
      className={`flex items-center gap-2 p-2 rounded-lg border cursor-grab active:cursor-grabbing transition-all ${
        dragging ? "opacity-40 scale-95 border-primary/40" : "border-border/40 bg-card/50 hover:border-primary/30"
      }`}
    >
      <GripVertical className="w-3 h-3 text-muted-foreground shrink-0" />
      {emp.profile_picture ? (
        <img src={emp.profile_picture} alt={name} className="w-6 h-6 rounded-full object-cover shrink-0" />
      ) : (
        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: color }}>
          <span className="text-white" style={{ fontSize: 9 }}>{name.charAt(0)}</span>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate" style={{ fontSize: 11 }}>{name}</p>
        <p className="text-muted-foreground truncate" style={{ fontSize: 9 }}>{emp.department || "—"}</p>
      </div>
    </div>
  );
}

// ── Shift Drop Zone ──

function ShiftDropZone({ shift, assignedEmps, onDrop, onRemove }: {
  shift: DbShift;
  assignedEmps: DbEmployee[];
  onDrop: (empId: string, shiftId: string) => void;
  onRemove: (empId: string) => void;
}) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const empId = e.dataTransfer.getData("shift-employee-id");
    if (empId) onDrop(empId, shift.id);
  };

  // Build working days summary
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const dayLabelsAr = ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"];
  const workingDays = days.filter(d => (shift as any)[`${d}_is_working`]);
  const workingDayLabels = workingDays.map(d => dayLabelsAr[days.indexOf(d)]);

  return (
    <div
      className={`rounded-xl border-2 transition-all ${
        dragOver ? "border-primary bg-primary/5 shadow-lg shadow-primary/20" : "border-border/40 bg-card/30"
      }`}
      onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
    >
      {/* Shift header */}
      <div className="px-4 py-3 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${shift.is_default ? "bg-primary/20" : "bg-muted/30"}`}>
              <Clock className={`w-4 h-4 ${shift.is_default ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div>
              <p className="text-foreground" style={{ fontSize: 13 }}>{shift.name}</p>
              <p className="text-muted-foreground" style={{ fontSize: 10 }}>
                {workingDayLabels.join(" · ")} | {shift.target_hours_per_day}س/يوم
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-foreground" style={{ fontSize: 12 }}>{assignedEmps.length}</span>
          </div>
        </div>
      </div>

      {/* Assigned employees */}
      <div className="p-3 space-y-1.5 min-h-[60px]">
        {assignedEmps.length > 0 ? assignedEmps.map(emp => {
          const name = empDisplayName(emp);
          return (
            <div key={emp.id} className="flex items-center gap-2 p-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
              {emp.profile_picture ? (
                <img src={emp.profile_picture} alt={name} className="w-5 h-5 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-primary" style={{ fontSize: 8 }}>{name.charAt(0)}</span>
                </div>
              )}
              <span className="text-foreground truncate flex-1" style={{ fontSize: 11 }}>{name}</span>
              <button onClick={() => onRemove(emp.id)}
                className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-red-500/20 transition-colors shrink-0"
                title="إلغاء التعيين">
                <X className="w-3 h-3 text-red-400" />
              </button>
            </div>
          );
        }) : (
          <div className={`p-3 rounded-lg border-2 border-dashed text-center transition-colors ${
            dragOver ? "border-primary/60 bg-primary/5" : "border-border/20"
          }`}>
            <p className="text-muted-foreground" style={{ fontSize: 11 }}>
              {dragOver ? "أفلت هنا للتعيين" : "اسحب الموظفين هنا"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ──

export function ShiftAssigner() {
  const { employees, refetch: refetchEmployees } = useEmployees();
  const { shifts, loading: shiftsLoading } = useShifts();
  const { assignments, loading: assignLoading, refetch: refetchAssignments } = useEmployeeShiftAssignments();
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);

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
    return employees.filter(e => !empShiftMap[e.id] && e.status !== "منتهي");
  }, [employees, empShiftMap]);

  const filteredUnassigned = useMemo(() => {
    if (!search.trim()) return unassigned;
    const q = search.trim().toLowerCase();
    return unassigned.filter(e => empDisplayName(e).includes(q) || (e.department || "").includes(q));
  }, [unassigned, search]);

  // Assign employee to shift
  const handleDrop = useCallback(async (empId: string, shiftId: string) => {
    setSaving(true);
    // Check for conflicts (already assigned to another shift)
    const existing = empShiftMap[empId];
    if (existing === shiftId) { setSaving(false); return; } // Already there

    // Update employee's shift_id directly for simplicity
    const { error } = await supabase.from("employees").update({ shift_id: shiftId }).eq("id", empId);

    if (error) {
      setToast(`خطأ: ${error.message}`);
    } else {
      const emp = employees.find(e => e.id === empId);
      const shift = shifts.find(s => s.id === shiftId);
      setToast(`تم تعيين "${emp ? empDisplayName(emp) : ""}" في دوام "${shift?.name || ""}" بنجاح`);
    }
    await refetchEmployees();
    await refetchAssignments();
    setSaving(false);
  }, [empShiftMap, employees, shifts, refetchEmployees, refetchAssignments]);

  // Remove employee from shift
  const handleRemove = useCallback(async (empId: string) => {
    setSaving(true);
    const { error } = await supabase.from("employees").update({ shift_id: null }).eq("id", empId);
    if (error) {
      setToast(`خطأ: ${error.message}`);
    } else {
      setToast("تم إلغاء تعيين الدوام");
    }
    await refetchEmployees();
    await refetchAssignments();
    setSaving(false);
  }, [refetchEmployees, refetchAssignments]);

  if (shiftsLoading || assignLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <span className="text-muted-foreground ms-2">جاري التحميل...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-start gap-3">
        <GripVertical className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-muted-foreground" style={{ fontSize: 12 }}>
          اسحب الموظفين من القائمة اليسرى وأسقطهم على الدوام المطلوب. سيتم حفظ التعيين تلقائياً.
        </p>
      </div>

      <div className="flex gap-4" style={{ maxHeight: 480 }}>
        {/* Sidebar: Unassigned */}
        <div className="w-64 shrink-0 bg-card/30 border border-border/40 rounded-xl overflow-hidden flex flex-col" style={{ maxHeight: 480 }}>
          <div className="p-3 border-b border-border/30">
            <h4 className="text-foreground mb-2" style={{ fontSize: 13 }}>بدون دوام ({unassigned.length})</h4>
            <div className="relative">
              <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="بحث..."
                className="w-full bg-background border border-border/40 rounded-lg ps-8 pe-3 py-1.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
                style={{ fontSize: 11 }} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {filteredUnassigned.length > 0 ? filteredUnassigned.map(emp => (
              <DragEmpCard key={emp.id} emp={emp} color="#8B5CF6" />
            )) : (
              <p className="text-center text-muted-foreground py-4" style={{ fontSize: 11 }}>
                {search ? "لا توجد نتائج" : "جميع الموظفين معينون"}
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
          <span style={{ fontSize: 12 }}>جاري الحفظ...</span>
        </div>
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-6 inset-x-0 flex justify-center z-40 pointer-events-none">
            <div className={`border rounded-full px-5 py-2.5 shadow-xl flex items-center gap-2 pointer-events-auto ${toast.startsWith("خطأ") ? "bg-card border-red-500/40" : "bg-card border-green-500/40"}`}>
              <span className="text-foreground" style={{ fontSize: 12 }}>{toast}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
