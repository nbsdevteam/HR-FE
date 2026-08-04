import { useState } from "react";
import { motion } from "motion/react";
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Calendar,
  Check,
  Clock,
  Plus,
  Trash2,
  Edit2,
  ChevronDown,
  Building2,
  AlertTriangle,
  X,
  Save,
  ToggleLeft,
  ToggleRight,
  Settings2,
  Database,
  Zap,
  PartyPopper,
  Briefcase,
  FileCheck,
  Users,
  Palette,
} from "lucide-react";
import { useAppSettings, type MonthFormat, formatMonthYear } from "../components/SettingsContext";
import { supabase } from "../lib/supabase";
import { isOdooBackend } from "../lib/api/client";
import * as odooData from "../lib/api/odooData";
import { useShifts, useHierarchyData, useSystemModules, useConfigurations, usePublicHolidays, useLeaveTypes, useContractTypes, useDocumentTypes, type DbShift, type DbSystemModule, type DbConfiguration, type DbPublicHoliday, type DbLeaveType, type DbContractType, type DbDocumentType } from "../lib/hooks";
import { ShiftAssigner } from "../components/ShiftAssigner";

// ── Curated department color palette — 15 distinct, accessible hues ──
const DEPT_COLOR_PALETTE = [
  "#FFD700", // ذهبي — reserved for الإدارة العليا
  "#8B5CF6", // بنفسجي
  "#3B82F6", // أزرق
  "#06B6D4", // سماوي
  "#22C55E", // أخضر
  "#EC4899", // وردي
  "#EF4444", // أحمر
  "#F59E0B", // برتقالي
  "#14B8A6", // فيروزي
  "#6366F1", // نيلي
  "#A855F7", // أرجواني
  "#0EA5E9", // أزرق فاتح
  "#D946EF", // فوشيا
  "#84CC16", // ليموني
  "#F43F5E", // قرمزي
];

const MONTH_FORMATS: { value: MonthFormat; label: string; example: string }[] = [
  { value: "name", label: "اسم الشهر", example: formatMonthYear("2026-02", "name") },
  { value: "numeric", label: "رقمي", example: formatMonthYear("2026-02", "numeric") },
];

const DAYS_OF_WEEK = [
  { key: "sunday", label: "الأحد" },
  { key: "monday", label: "الإثنين" },
  { key: "tuesday", label: "الثلاثاء" },
  { key: "wednesday", label: "الأربعاء" },
  { key: "thursday", label: "الخميس" },
  { key: "friday", label: "الجمعة" },
  { key: "saturday", label: "السبت" },
];

interface ShiftEditState {
  id: string;
  name: string;
  description: string;
  grace_minutes: number;
  late_to_absent_hours: number;
  target_hours_per_day: number;
  days: Record<
    string,
    {
      is_working: boolean;
      start: string;
      end: string;
    }
  >;
}

export function SettingsPage() {
  const { settings, updateSettings } = useAppSettings();
  const { shifts, loading: shiftsLoading, refetch: refetchShifts } = useShifts();
  const { departments, loading: deptLoading } = useHierarchyData();
  const { modules: sysModules, loading: modulesLoading, refetch: refetchModules } = useSystemModules();
  const { configs, loading: configsLoading, refetch: refetchConfigs, getValue, getNumber } = useConfigurations();
  const { holidays, loading: holidaysLoading, refetch: refetchHolidays } = usePublicHolidays();
  const { types: leaveTypes, loading: leaveTypesLoading, refetch: refetchLeaveTypes } = useLeaveTypes();
  const { types: contractTypes, loading: contractTypesLoading, refetch: refetchContractTypes } = useContractTypes();
  const { types: documentTypes, loading: documentTypesLoading, refetch: refetchDocumentTypes } = useDocumentTypes();

  // Local notification toggle states
  const [notifToggles, setNotifToggles] = useState({
    leave: true,
    lateAttendance: true,
    warnings: true,
    evaluations: false,
    recruitment: true,
  });

  const [twoFactor, setTwoFactor] = useState(false);

  // Shift management state
  const [expandedShift, setExpandedShift] = useState<string | null>(null);
  const [editingShift, setEditingShift] = useState<ShiftEditState | null>(null);
  const [showNewShiftForm, setShowNewShiftForm] = useState(false);
  const [newShiftForm, setNewShiftForm] = useState<ShiftEditState>({
    id: "",
    name: "",
    description: "",
    grace_minutes: 5,
    late_to_absent_hours: 3,
    target_hours_per_day: 8,
    days: Object.fromEntries(
      DAYS_OF_WEEK.map((d) => [d.key, { is_working: d.key !== "friday", start: "08:00", end: "16:00" }])
    ),
  });

  // Department shift assignments
  const [deptShiftAssignments, setDeptShiftAssignments] = useState<Record<string, string>>(
    Object.fromEntries(departments.map((d) => [d.id, d.default_shift_id || ""]))
  );
  const [savingDepts, setSavingDepts] = useState(false);

  // Public holidays state
  const [holidayYear, setHolidayYear] = useState(2026);
  const [showNewHolidayForm, setShowNewHolidayForm] = useState(false);
  const [newHoliday, setNewHoliday] = useState({ name_ar: "", name_en: "", date: "", is_recurring: false });
  const [configEdits, setConfigEdits] = useState<Record<string, any>>({});

  // Leave types state
  const [editingLeaveType, setEditingLeaveType] = useState<DbLeaveType | null>(null);
  const [showNewLeaveTypeForm, setShowNewLeaveTypeForm] = useState(false);
  const [newLeaveType, setNewLeaveType] = useState({
    name_ar: "", name_en: "", code: "", is_paid: true, default_days_per_year: 0,
    allow_half_day: false, requires_attachment: false, attachment_after_days: 0,
    accrual_method: "annual" as string, is_carryover_allowed: false, max_carryover_days: 0,
    carryover_expiry_months: 3, is_encashable: false, encashment_percentage: 100,
    color: "#3b82f6", sort_order: 0,
  });

  // Contract types state
  const [showNewContractTypeForm, setShowNewContractTypeForm] = useState(false);
  const [newContractType, setNewContractType] = useState({
    name_ar: "", name_en: "", code: "", description: "",
    default_duration_months: 12, is_renewable: true, probation_days: 90,
    notice_period_days: 30, sort_order: 0,
  });

  // Document types state
  const [showNewDocTypeForm, setShowNewDocTypeForm] = useState(false);
  const [newDocType, setNewDocType] = useState({
    name_ar: "", name_en: "", code: "", has_expiry: true,
    expiry_warning_days: 30, is_required: false, sort_order: 0,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Collapsible sections
  const [shiftAssignerOpen, setShiftAssignerOpen] = useState(false);

  // Department color state
  const [deptColorEdits, setDeptColorEdits] = useState<Record<string, string>>({});
  const [savingDeptColors, setSavingDeptColors] = useState(false);
  const [openColorPicker, setOpenColorPicker] = useState<string | null>(null);


  const getDeptColor = (deptId: string) => {
    if (deptColorEdits[deptId] !== undefined) return deptColorEdits[deptId];
    const dept = departments.find(d => d.id === deptId);
    return dept?.color || "#8B5CF6";
  };

  const usedDeptColors = new Set(
    departments.map(d => deptColorEdits[d.id] ?? d.color).filter(Boolean)
  );

  const saveDeptColors = async () => {
    setSavingDeptColors(true);
    try {
      for (const [deptId, color] of Object.entries(deptColorEdits)) {
        if (isOdooBackend()) await odooData.updateDepartment(deptId, { color });
        else await supabase.from("departments").update({ color }).eq("id", deptId);
      }
      setDeptColorEdits({});
      showToast("تم حفظ ألوان الأقسام بنجاح");
    } catch {
      showToast("خطأ في حفظ ألوان الأقسام");
    }
    setSavingDeptColors(false);
  };

  const toggleNotif = (key: keyof typeof notifToggles) =>
    setNotifToggles((prev) => ({ ...prev, [key]: !prev[key] }));

  const cardCls = "bg-card/30 backdrop-blur-md border border-border/40 rounded-xl p-4 shadow-md";

  const Toggle = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
    <div
      onClick={onClick}
      className={`w-11 h-6 rounded-full cursor-pointer transition-colors relative ${
        on ? "bg-primary" : "bg-switch-background"
      }`}
    >
      <div
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
          on ? "end-0.5" : "start-0.5"
        }`}
      />
    </div>
  );

  const Toast = ({ message }: { message: string }) => (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="fixed top-4 left-4 right-4 bg-green-500/20 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg z-50"
    >
      {message}
    </motion.div>
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ——— Shift CRUD Operations ———

  const initEditShift = (shift: DbShift) => {
    const days = Object.fromEntries(
      DAYS_OF_WEEK.map((d) => [
        d.key,
        {
          is_working: shift[`${d.key}_is_working` as keyof DbShift] as boolean,
          start: shift[`${d.key}_start` as keyof DbShift] as string,
          end: shift[`${d.key}_end` as keyof DbShift] as string,
        },
      ])
    );
    setEditingShift({
      id: shift.id,
      name: shift.name,
      description: shift.description || "",
      grace_minutes: shift.grace_minutes,
      late_to_absent_hours: shift.late_to_absent_hours,
      target_hours_per_day: shift.target_hours_per_day,
      days,
    });
  };

  const saveShift = async (state: ShiftEditState) => {
    if (!state.name.trim()) {
      showToast("يجب إدخال اسم الوردية");
      return;
    }

    const updateData: any = {
      name: state.name,
      description: state.description,
      grace_minutes: state.grace_minutes,
      late_to_absent_hours: state.late_to_absent_hours,
      target_hours_per_day: state.target_hours_per_day,
    };

    DAYS_OF_WEEK.forEach((d) => {
      const day = state.days[d.key];
      updateData[`${d.key}_is_working`] = day.is_working;
      updateData[`${d.key}_start`] = day.start;
      updateData[`${d.key}_end`] = day.end;
    });

    try {
      if (isOdooBackend()) await odooData.updateShift(state.id, updateData);
      else {
        const { error } = await supabase.from("shifts").update(updateData).eq("id", state.id);
        if (error) throw error;
      }
      showToast("تم حفظ الوردية بنجاح");
      setEditingShift(null);
      refetchShifts();
    } catch (err) {
      showToast("خطأ في حفظ الوردية");
    }
  };

  const createShift = async (state: ShiftEditState) => {
    if (!state.name.trim()) {
      showToast("يجب إدخال اسم الوردية");
      return;
    }

    const insertData: any = {
      name: state.name,
      description: state.description,
      grace_minutes: state.grace_minutes,
      late_to_absent_hours: state.late_to_absent_hours,
      target_hours_per_day: state.target_hours_per_day,
      is_default: false,
    };

    DAYS_OF_WEEK.forEach((d) => {
      const day = state.days[d.key];
      insertData[`${d.key}_is_working`] = day.is_working;
      insertData[`${d.key}_start`] = day.start;
      insertData[`${d.key}_end`] = day.end;
    });

    try {
      if (isOdooBackend()) await odooData.createShift(insertData);
      else {
        const { error } = await supabase.from("shifts").insert([insertData]);
        if (error) throw error;
      }
      showToast("تم إنشاء الوردية بنجاح");
      setShowNewShiftForm(false);
      setNewShiftForm({
        id: "",
        name: "",
        description: "",
        grace_minutes: 5,
        late_to_absent_hours: 3,
        target_hours_per_day: 8,
        days: Object.fromEntries(
          DAYS_OF_WEEK.map((d) => [d.key, { is_working: d.key !== "friday", start: "08:00", end: "16:00" }])
        ),
      });
      refetchShifts();
    } catch (err) {
      showToast("خطأ في إنشاء الوردية");
    }
  };

  const deleteShift = async (shiftId: string) => {
    if (!window.confirm("هل تريد حقاً حذف هذه الوردية؟")) return;
    try {
      if (isOdooBackend()) await odooData.deleteShift(shiftId);
      else {
        const { error } = await supabase.from("shifts").delete().eq("id", shiftId);
        if (error) throw error;
      }
      showToast("تم حذف الوردية بنجاح");
      refetchShifts();
    } catch (err) {
      showToast("خطأ في حذف الوردية");
    }
  };

  const setAsDefault = async (shiftId: string) => {
    try {
      if (isOdooBackend()) {
        // Odoo shifts have no is_default flag on model; mark via description is skipped — no-op toast
        showToast("تعيين الافتراضي غير متاح على Odoo بعد — عيّن القسم/الموظف مباشرة");
        return;
      }
      await supabase.from("shifts").update({ is_default: false }).eq("is_default", true);
      const { error } = await supabase.from("shifts").update({ is_default: true }).eq("id", shiftId);
      if (error) throw error;
      showToast("تم تعيين الوردية الافتراضية بنجاح");
      refetchShifts();
    } catch (err) {
      showToast("خطأ في تعيين الوردية الافتراضية");
    }
  };

  const saveDeptAssignments = async () => {
    setSavingDepts(true);
    try {
      for (const [deptId, shiftId] of Object.entries(deptShiftAssignments)) {
        const updateData = shiftId ? { default_shift_id: shiftId } : { default_shift_id: null };
        if (isOdooBackend()) await odooData.updateDepartment(deptId, updateData);
        else await supabase.from("departments").update(updateData).eq("id", deptId);
      }
      showToast("تم حفظ تعيينات الأقسام بنجاح");
    } catch (err) {
      showToast("خطأ في حفظ تعيينات الأقسام");
    }
    setSavingDepts(false);
  };

  const getWorkingDaysCount = (shift: DbShift): number => {
    let count = 0;
    DAYS_OF_WEEK.forEach((d) => {
      if (shift[`${d.key}_is_working` as keyof DbShift]) count++;
    });
    return count;
  };

  const getWorkingDayLabels = (shift: DbShift): string[] => {
    return DAYS_OF_WEEK.filter((d) => shift[`${d.key}_is_working` as keyof DbShift]).map((d) => d.label);
  };

  // ——— System Modules Toggle ———
  const toggleModule = async (module: DbSystemModule) => {
    try {
      if (isOdooBackend()) await odooData.updateModule(module.id, !module.is_enabled);
      else await supabase.from("system_modules").update({ is_enabled: !module.is_enabled }).eq("id", module.id);
      refetchModules();
      showToast(`تم ${!module.is_enabled ? "تفعيل" : "تعطيل"} الميزة بنجاح`);
    } catch (err) {
      showToast("خطأ في تحديث الميزة");
    }
  };

  // ——— Configuration Edit ———
  const saveConfigValue = async (configId: string, value: any) => {
    try {
      if (isOdooBackend()) await odooData.updateConfig(configId, value);
      else await supabase.from("configurations").update({ config_value: value }).eq("id", configId);
      refetchConfigs();
      showToast("تم حفظ الإعداد بنجاح");
      setConfigEdits((prev) => {
        const newEdits = { ...prev };
        delete newEdits[configId];
        return newEdits;
      });
    } catch (err) {
      showToast("خطأ في حفظ الإعداد");
    }
  };

  // ——— Public Holidays CRUD ———
  const addHoliday = async () => {
    if (!newHoliday.name_ar || !newHoliday.date) {
      showToast("الرجاء ملء الحقول المطلوبة");
      return;
    }
    try {
      const [year, month, day] = newHoliday.date.split("-");
      if (isOdooBackend()) {
        await odooData.createHoliday({ name_ar: newHoliday.name_ar, date: newHoliday.date });
      } else {
        await supabase.from("public_holidays").insert({
          name_ar: newHoliday.name_ar,
          name_en: newHoliday.name_en || null,
          date: newHoliday.date,
          is_recurring: newHoliday.is_recurring,
          recurring_month: newHoliday.is_recurring ? parseInt(month) : null,
          recurring_day: newHoliday.is_recurring ? parseInt(day) : null,
        });
      }
      refetchHolidays();
      setNewHoliday({ name_ar: "", name_en: "", date: "", is_recurring: false });
      setShowNewHolidayForm(false);
      showToast("تم إضافة العطلة بنجاح");
    } catch (err) {
      showToast("خطأ في إضافة العطلة");
    }
  };

  const deleteHoliday = async (holidayId: string) => {
    try {
      if (isOdooBackend()) await odooData.deleteHoliday(holidayId);
      else await supabase.from("public_holidays").delete().eq("id", holidayId);
      refetchHolidays();
      showToast("تم حذف العطلة بنجاح");
    } catch (err) {
      showToast("خطأ في حذف العطلة");
    }
  };

  // ——— Helper: Group modules by category (ES5-safe, no Object.groupBy) ———
  const groupedModules = (sysModules || []).reduce<Record<string, DbSystemModule[]>>((acc, m) => {
    const key = m.category || "system";
    (acc[key] ??= []).push(m);
    return acc;
  }, {});

  // ——— Helper: Group configs by category ———
  const groupedConfigs = (configs || []).reduce<Record<string, DbConfiguration[]>>((acc, c) => {
    const key = c.category || "general";
    (acc[key] ??= []).push(c);
    return acc;
  }, {});

  // ——— Helper: Filter holidays by year ———
  const filteredHolidays = (holidays || []).filter((h: DbPublicHoliday) => {
    const year = new Date(h.date).getFullYear();
    return year === holidayYear;
  });

  const categoryLabels: Record<string, string> = {
    payroll: "الرواتب والتعويضات",
    leave: "الإجازات",
    attendance: "الحضور والانصراف",
    employee: "شؤون الموظفين",
    system: "النظام",
  };

  return (
    <div className="space-y-4">
      {toastMessage && <Toast message={toastMessage} />}

      <div>
        <h1 className="text-gradient-gold">الإعدادات</h1>
        <p className="text-muted-foreground mt-1">إعدادات النظام والتفضيلات</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ══════════ DEPARTMENT COLORS ══════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className={cardCls}
        >
          <div className="flex items-center gap-3 mb-3 pb-2.5 border-b border-border/20">
            <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
              <Palette className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="text-foreground" style={{ fontSize: 14 }}>ألوان الأقسام</h3>
              <p className="text-muted-foreground" style={{ fontSize: 11 }}>يظهر في الهيكل التنظيمي وبطاقات الموظفين</p>
            </div>
          </div>

          {deptLoading ? (
            <div className="text-muted-foreground text-center py-3" style={{ fontSize: 12 }}>جاري التحميل...</div>
          ) : departments.length === 0 ? (
            <div className="text-muted-foreground text-center py-3" style={{ fontSize: 12 }}>لا توجد أقسام</div>
          ) : (
            <div className="space-y-2.5">
              {/* Department chips */}
              <div className="flex flex-wrap gap-2">
                {departments.map(dept => {
                  const currentColor = getDeptColor(dept.id);
                  const isOpen = openColorPicker === dept.id;
                  return (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => setOpenColorPicker(isOpen ? null : dept.id)}
                      className={`relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                        isOpen
                          ? "border-primary/50 bg-primary/10 shadow-sm"
                          : "border-border/40 bg-card/50 hover:border-primary/30 hover:bg-muted/15"
                      }`}
                    >
                      <div className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/20" style={{ background: currentColor }} />
                      <span className="text-foreground whitespace-nowrap" style={{ fontSize: 11 }}>{dept.name}</span>
                      {deptColorEdits[dept.id] && (
                        <div className="absolute -top-0.5 -end-0.5 w-2 h-2 rounded-full bg-amber-400 border border-card" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Inline color palette — appears below chips when a department is selected */}
              {openColorPicker && (() => {
                const activeColor = getDeptColor(openColorPicker);
                const activeDeptName = departments.find(d => d.id === openColorPicker)?.name;
                return (
                  <div className="bg-muted/10 border border-border/30 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-muted-foreground" style={{ fontSize: 11 }}>
                        اختر لوناً لـ <span className="text-foreground">{activeDeptName}</span>:
                      </p>
                      <button type="button" onClick={() => setOpenColorPicker(null)}
                        className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-muted/30 transition-colors">
                        <X className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                    {/* Preset swatches */}
                    <div className="flex flex-wrap gap-1.5">
                      {DEPT_COLOR_PALETTE.map(color => {
                        const isUsed = usedDeptColors.has(color) && color !== activeColor;
                        const isSelected = color === activeColor;
                        return (
                          <button
                            key={color}
                            type="button"
                            onClick={() => {
                              setDeptColorEdits(prev => ({ ...prev, [openColorPicker!]: color }));
                              setOpenColorPicker(null);
                            }}
                            disabled={isUsed}
                            className={`w-8 h-8 rounded-lg border-2 transition-all ${
                              isSelected ? "border-foreground scale-110 ring-2 ring-primary/40" :
                              isUsed ? "border-border/20 opacity-25 cursor-not-allowed" :
                              "border-border/40 hover:scale-110 hover:border-foreground/40"
                            }`}
                            style={{ background: color }}
                            title={isUsed ? "مستخدم بالفعل" : isSelected ? "اللون الحالي" : ""}
                          />
                        );
                      })}
                    </div>
                    {/* Custom color picker */}
                    <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-border/20">
                      <label className="text-muted-foreground shrink-0" style={{ fontSize: 10 }}>لون مخصص:</label>
                      <input
                        type="color"
                        value={activeColor}
                        onChange={(e) => {
                          setDeptColorEdits(prev => ({ ...prev, [openColorPicker!]: e.target.value }));
                        }}
                        className="w-8 h-8 rounded-lg border border-border/40 cursor-pointer bg-transparent p-0"
                        style={{ WebkitAppearance: "none", appearance: "none" }}
                      />
                      <span className="text-muted-foreground font-mono" style={{ fontSize: 10 }}>{activeColor}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Save button */}
              {Object.keys(deptColorEdits).length > 0 && (
                <button
                  type="button"
                  onClick={saveDeptColors}
                  disabled={savingDeptColors}
                  className="w-full px-3 py-1.5 bg-primary hover:bg-primary/80 disabled:opacity-50 text-primary-foreground rounded-lg transition-colors"
                  style={{ fontSize: 12 }}
                >
                  {savingDeptColors ? "جاري الحفظ..." : "حفظ ألوان الأقسام"}
                </button>
              )}
            </div>
          )}
        </motion.div>

        {/* ══════════ SHIFTS & SCHEDULES (Full-Width) ══════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className={`${cardCls} lg:col-span-2`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-foreground">جداول الدوام والورديات</h3>
                <p className="text-muted-foreground text-sm mt-1">إدارة أوقات العمل والورديات — أولوية التطبيق: الموظف ← القسم ← النظام</p>
              </div>
            </div>
            {!showNewShiftForm && (
              <button
                onClick={() => setShowNewShiftForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/80 text-primary-foreground rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة وردية جديدة</span>
              </button>
            )}
          </div>

          {/* New Shift Form */}
          {showNewShiftForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-3 bg-muted/20 rounded-lg border border-border/20">
              <h4 className="text-foreground mb-4">وردية جديدة</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-foreground text-sm mb-2">الاسم</label>
                  <input
                    type="text"
                    value={newShiftForm.name}
                    onChange={(e) => setNewShiftForm({ ...newShiftForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-muted/30 border border-border/40 rounded-lg text-foreground focus:outline-none focus:border-primary"
                    placeholder="اسم الوردية"
                  />
                </div>

                <div>
                  <label className="block text-foreground text-sm mb-2">الوصف</label>
                  <input
                    type="text"
                    value={newShiftForm.description}
                    onChange={(e) => setNewShiftForm({ ...newShiftForm, description: e.target.value })}
                    className="w-full px-3 py-2 bg-muted/30 border border-border/40 rounded-lg text-foreground focus:outline-none focus:border-primary"
                    placeholder="وصف الوردية"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-foreground text-sm mb-2">دقائق التساهل</label>
                    <input
                      type="number"
                      value={newShiftForm.grace_minutes}
                      onChange={(e) => setNewShiftForm({ ...newShiftForm, grace_minutes: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-muted/30 border border-border/40 rounded-lg text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-foreground text-sm mb-2">ساعات التأخير للغياب</label>
                    <input
                      type="number"
                      value={newShiftForm.late_to_absent_hours}
                      onChange={(e) => setNewShiftForm({ ...newShiftForm, late_to_absent_hours: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-muted/30 border border-border/40 rounded-lg text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-foreground text-sm mb-2">ساعات العمل اليومية</label>
                    <input
                      type="number"
                      value={newShiftForm.target_hours_per_day}
                      onChange={(e) => setNewShiftForm({ ...newShiftForm, target_hours_per_day: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-muted/30 border border-border/40 rounded-lg text-foreground focus:outline-none focus:border-primary"
                      step="0.5"
                    />
                  </div>
                </div>

                {/* Days of week configuration */}
                <div>
                  <label className="block text-foreground text-sm mb-3">أيام العمل</label>
                  <div className="space-y-3">
                    {DAYS_OF_WEEK.map((d) => (
                      <div key={d.key} className="flex items-center gap-3 p-3 bg-muted/10 rounded-lg">
                        <input
                          type="checkbox"
                          checked={newShiftForm.days[d.key].is_working}
                          onChange={(e) =>
                            setNewShiftForm({
                              ...newShiftForm,
                              days: {
                                ...newShiftForm.days,
                                [d.key]: { ...newShiftForm.days[d.key], is_working: e.target.checked },
                              },
                            })
                          }
                          className="w-4 h-4 cursor-pointer"
                        />
                        <label className="text-foreground text-sm flex-1">{d.label}</label>
                        {newShiftForm.days[d.key].is_working && (
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={newShiftForm.days[d.key].start}
                              onChange={(e) =>
                                setNewShiftForm({
                                  ...newShiftForm,
                                  days: {
                                    ...newShiftForm.days,
                                    [d.key]: { ...newShiftForm.days[d.key], start: e.target.value },
                                  },
                                })
                              }
                              className="px-2 py-1 bg-muted/30 border border-border/40 rounded text-foreground focus:outline-none focus:border-primary text-sm"
                            />
                            <span className="text-muted-foreground">-</span>
                            <input
                              type="time"
                              value={newShiftForm.days[d.key].end}
                              onChange={(e) =>
                                setNewShiftForm({
                                  ...newShiftForm,
                                  days: {
                                    ...newShiftForm.days,
                                    [d.key]: { ...newShiftForm.days[d.key], end: e.target.value },
                                  },
                                })
                              }
                              className="px-2 py-1 bg-muted/30 border border-border/40 rounded text-foreground focus:outline-none focus:border-primary text-sm"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => createShift(newShiftForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600/20 border border-green-500/50 text-green-400 hover:bg-green-600/30 rounded-lg transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    حفظ
                  </button>
                  <button
                    onClick={() => setShowNewShiftForm(false)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-500/50 text-red-400 hover:bg-red-600/30 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Shifts List */}
          <div className="space-y-2 mb-4">
            {shiftsLoading ? (
              <div className="text-muted-foreground text-center py-4" style={{ fontSize: 13 }}>جاري التحميل...</div>
            ) : shifts.length === 0 ? (
              <div className="text-muted-foreground text-center py-4" style={{ fontSize: 13 }}>لا توجد ورديات</div>
            ) : (
              shifts.map((shift) => (
                <motion.div key={shift.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-muted/10 border border-border/20 rounded-lg overflow-hidden">
                  {/* Collapsed View — compact single row */}
                  <div
                    onClick={() => setExpandedShift(expandedShift === shift.id ? null : shift.id)}
                    className="px-3 py-2.5 cursor-pointer hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <h4 className="text-foreground shrink-0" style={{ fontSize: 13 }}>{shift.name}</h4>
                        {shift.is_default && <span className="px-1.5 py-0.5 bg-primary/20 border border-primary/40 text-primary rounded-full shrink-0" style={{ fontSize: 10 }}>الافتراضي</span>}
                        <span className="text-muted-foreground truncate" style={{ fontSize: 11 }}>{shift.description}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1 flex-wrap">
                          {getWorkingDayLabels(shift).map((label) => (
                            <span key={label} className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded" style={{ fontSize: 10 }}>
                              {label}
                            </span>
                          ))}
                        </div>
                        <span className="text-muted-foreground" style={{ fontSize: 10 }}>
                          {shift.grace_minutes}د | {shift.target_hours_per_day}س
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-muted-foreground transition-transform ${expandedShift === shift.id ? "rotate-180" : ""}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expanded View */}
                  {expandedShift === shift.id && editingShift?.id !== shift.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="border-t border-border/20 px-3 py-3 bg-muted/5 space-y-3">
                      {/* Days schedule table */}
                      <div className="overflow-x-auto">
                        <table className="w-full" style={{ fontSize: 12 }}>
                          <thead>
                            <tr className="border-b border-border/20">
                              <th className="text-start text-muted-foreground py-2">اليوم</th>
                              <th className="text-start text-muted-foreground py-2">الحالة</th>
                              <th className="text-start text-muted-foreground py-2">الوقت</th>
                            </tr>
                          </thead>
                          <tbody>
                            {DAYS_OF_WEEK.map((d) => {
                              const isWorking = shift[`${d.key}_is_working` as keyof DbShift] as boolean;
                              const start = shift[`${d.key}_start` as keyof DbShift] as string;
                              const end = shift[`${d.key}_end` as keyof DbShift] as string;
                              return (
                                <tr key={d.key} className="border-b border-border/10">
                                  <td className="py-2 text-foreground">{d.label}</td>
                                  <td className="py-2">
                                    <span className={`text-xs px-2 py-1 rounded ${isWorking ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                                      {isWorking ? "يوم عمل" : "يوم إجازة"}
                                    </span>
                                  </td>
                                  <td className="py-2 text-muted-foreground">{isWorking ? `${start} - ${end}` : "—"}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex gap-2">
                        <button onClick={() => initEditShift(shift)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600/20 border border-blue-500/50 text-blue-400 hover:bg-blue-600/30 rounded-lg transition-colors" style={{ fontSize: 12 }}>
                          <Edit2 className="w-3.5 h-3.5" /> تعديل
                        </button>
                        <button onClick={() => deleteShift(shift.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-600/20 border border-red-500/50 text-red-400 hover:bg-red-600/30 rounded-lg transition-colors" style={{ fontSize: 12 }}>
                          <Trash2 className="w-3.5 h-3.5" /> حذف
                        </button>
                        {!shift.is_default && (
                          <button onClick={() => setAsDefault(shift.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-yellow-600/20 border border-yellow-500/50 text-yellow-400 hover:bg-yellow-600/30 rounded-lg transition-colors" style={{ fontSize: 12 }}>
                            <Check className="w-3.5 h-3.5" /> تعيين كافتراضي
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Edit Form */}
                  {editingShift?.id === shift.id && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-border/20 p-4 bg-muted/5 space-y-4">
                      <div>
                        <label className="block text-foreground text-sm mb-2">الاسم</label>
                        <input
                          type="text"
                          value={editingShift.name}
                          onChange={(e) => setEditingShift({ ...editingShift, name: e.target.value })}
                          className="w-full px-3 py-2 bg-muted/30 border border-border/40 rounded-lg text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-foreground text-sm mb-2">الوصف</label>
                        <input
                          type="text"
                          value={editingShift.description}
                          onChange={(e) => setEditingShift({ ...editingShift, description: e.target.value })}
                          className="w-full px-3 py-2 bg-muted/30 border border-border/40 rounded-lg text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-foreground text-sm mb-2">دقائق التساهل</label>
                          <input
                            type="number"
                            value={editingShift.grace_minutes}
                            onChange={(e) => setEditingShift({ ...editingShift, grace_minutes: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 bg-muted/30 border border-border/40 rounded-lg text-foreground focus:outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-foreground text-sm mb-2">ساعات التأخير للغياب</label>
                          <input
                            type="number"
                            value={editingShift.late_to_absent_hours}
                            onChange={(e) => setEditingShift({ ...editingShift, late_to_absent_hours: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 bg-muted/30 border border-border/40 rounded-lg text-foreground focus:outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-foreground text-sm mb-2">ساعات العمل اليومية</label>
                          <input
                            type="number"
                            value={editingShift.target_hours_per_day}
                            onChange={(e) => setEditingShift({ ...editingShift, target_hours_per_day: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 bg-muted/30 border border-border/40 rounded-lg text-foreground focus:outline-none focus:border-primary"
                            step="0.5"
                          />
                        </div>
                      </div>

                      {/* Days configuration for editing */}
                      <div>
                        <label className="block text-foreground text-sm mb-3">أيام العمل</label>
                        <div className="space-y-3">
                          {DAYS_OF_WEEK.map((d) => (
                            <div key={d.key} className="flex items-center gap-3 p-3 bg-muted/10 rounded-lg">
                              <input
                                type="checkbox"
                                checked={editingShift.days[d.key].is_working}
                                onChange={(e) =>
                                  setEditingShift({
                                    ...editingShift,
                                    days: {
                                      ...editingShift.days,
                                      [d.key]: { ...editingShift.days[d.key], is_working: e.target.checked },
                                    },
                                  })
                                }
                                className="w-4 h-4 cursor-pointer"
                              />
                              <label className="text-foreground text-sm flex-1">{d.label}</label>
                              {editingShift.days[d.key].is_working && (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="time"
                                    value={editingShift.days[d.key].start}
                                    onChange={(e) =>
                                      setEditingShift({
                                        ...editingShift,
                                        days: {
                                          ...editingShift.days,
                                          [d.key]: { ...editingShift.days[d.key], start: e.target.value },
                                        },
                                      })
                                    }
                                    className="px-2 py-1 bg-muted/30 border border-border/40 rounded text-foreground focus:outline-none focus:border-primary text-sm"
                                  />
                                  <span className="text-muted-foreground">-</span>
                                  <input
                                    type="time"
                                    value={editingShift.days[d.key].end}
                                    onChange={(e) =>
                                      setEditingShift({
                                        ...editingShift,
                                        days: {
                                          ...editingShift.days,
                                          [d.key]: { ...editingShift.days[d.key], end: e.target.value },
                                        },
                                      })
                                    }
                                    className="px-2 py-1 bg-muted/30 border border-border/40 rounded text-foreground focus:outline-none focus:border-primary text-sm"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => saveShift(editingShift)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600/20 border border-green-500/50 text-green-400 hover:bg-green-600/30 rounded-lg transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          حفظ
                        </button>
                        <button
                          onClick={() => setEditingShift(null)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-500/50 text-red-400 hover:bg-red-600/30 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                          إلغاء
                        </button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))
            )}
          </div>

          {/* Department Assignments */}
          <div className="border-t border-border/20 pt-4">
            <h4 className="text-foreground flex items-center gap-2 mb-4">
              <Building2 className="w-4 h-4 text-primary" />
              تعيين الورديات للأقسام
            </h4>
            <div className="space-y-3">
              {deptLoading ? (
                <div className="text-muted-foreground text-center py-6">جاري التحميل...</div>
              ) : departments.length === 0 ? (
                <div className="text-muted-foreground text-center py-6">لا توجد أقسام</div>
              ) : (
                departments.map((dept) => (
                  <div key={dept.id} className="flex items-center gap-3 p-3 bg-muted/10 rounded-lg">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dept.color }} />
                    <span className="text-foreground flex-1">{dept.name}</span>
                    <select
                      value={deptShiftAssignments[dept.id] || ""}
                      onChange={(e) => setDeptShiftAssignments({ ...deptShiftAssignments, [dept.id]: e.target.value })}
                      className="px-3 py-1 bg-muted/30 border border-border/40 rounded text-foreground text-sm focus:outline-none focus:border-primary"
                    >
                      <option value="">الوردية الافتراضية</option>
                      {shifts.map((shift) => (
                        <option key={shift.id} value={shift.id}>
                          {shift.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))
              )}
            </div>
            <button
              onClick={saveDeptAssignments}
              disabled={savingDepts}
              className="mt-4 w-full px-4 py-2 bg-primary hover:bg-primary/80 disabled:opacity-50 text-primary-foreground rounded-lg transition-colors"
            >
              {savingDepts ? "جاري الحفظ..." : "حفظ تعيينات الأقسام"}
            </button>
          </div>

          {/* ── Employee → Shift drag-and-drop assignment (collapsible) ── */}
          <div className="border-t border-border/20 pt-4">
            <button
              onClick={() => setShiftAssignerOpen(!shiftAssignerOpen)}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/20 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <h4 className="text-foreground" style={{ fontSize: 14 }}>تعيين الموظفين للورديات</h4>
                <span className="text-muted-foreground text-xs">— اسحب وأسقط</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${shiftAssignerOpen ? "rotate-180" : ""}`} />
            </button>
            {shiftAssignerOpen && (
              <div className="mt-2">
                <ShiftAssigner />
              </div>
            )}
          </div>
        </motion.div>

        {/* ══════════ FEATURE FLAGS / SYSTEM MODULES (Full-Width) ══════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`${cardCls} lg:col-span-2`}
        >
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-foreground">الوحدات والميزات</h3>
                <p className="text-muted-foreground text-sm mt-1">تفعيل أو تعطيل أي ميزة في النظام — الميزات المعطّلة تختفي من القوائم والحسابات</p>
              </div>
            </div>
          </div>

          {modulesLoading ? (
            <div className="text-muted-foreground text-center py-6">جاري التحميل...</div>
          ) : !sysModules || Object.keys(groupedModules).length === 0 ? (
            <div className="text-muted-foreground text-center py-3" style={{ fontSize: 13 }}>لا توجد وحدات — شغّل الترحيل أولاً</div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedModules).map(([category, modules]) => (
                <div key={category}>
                  <div className="flex items-center gap-3 mb-3 pb-2 border-l-4 border-primary pl-3">
                    <h4 className="text-foreground font-medium">{categoryLabels[category] || category}</h4>
                  </div>
                  <div className="space-y-2">
                    {modules && modules.map((module: DbSystemModule) => (
                      <div key={module.id} className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                        <div className="flex-1">
                          <p className="text-foreground text-sm">{module.name_ar}</p>
                          {module.description_ar && (
                            <p className="text-muted-foreground text-xs mt-1">{module.description_ar}</p>
                          )}
                        </div>
                        <Toggle
                          on={module.is_enabled}
                          onClick={() => toggleModule(module)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ══════════ BUSINESS RULES / CONFIGURATIONS (Full-Width) ══════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`${cardCls} lg:col-span-2`}
        >
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Settings2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-foreground">القواعد والإعدادات</h3>
                <p className="text-muted-foreground text-sm mt-1">جميع القيم القابلة للتعديل — تُطبق مباشرة على الحسابات</p>
              </div>
            </div>
          </div>

          {configsLoading ? (
            <div className="text-muted-foreground text-center py-6">جاري التحميل...</div>
          ) : !configs || Object.keys(groupedConfigs).length === 0 ? (
            <div className="text-muted-foreground text-center py-3" style={{ fontSize: 13 }}>لا توجد إعدادات — شغّل الترحيل أولاً</div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedConfigs).map(([category, categoryConfigs]) => (
                <div key={category}>
                  <div className="flex items-center gap-3 mb-3 pb-2 border-l-4 border-primary pl-3">
                    <h4 className="text-foreground font-medium">{categoryLabels[category] || category}</h4>
                  </div>
                  <div className="space-y-3">
                    {categoryConfigs && categoryConfigs.map((config: DbConfiguration) => {
                      const currentValue = configEdits[config.id] !== undefined ? configEdits[config.id] : config.config_value;
                      const hasChanged = configEdits[config.id] !== undefined;

                      return (
                        <div key={config.id} className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                          <div className="flex-1">
                            <p className="text-foreground text-sm">{config.label_ar}</p>
                            {config.description && (
                              <p className="text-muted-foreground text-xs mt-1">{config.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {config.value_type === "boolean" ? (
                              <Toggle
                                on={currentValue === true || currentValue === "true"}
                                onClick={() => {
                                  const newVal = !(currentValue === true || currentValue === "true");
                                  setConfigEdits({ ...configEdits, [config.id]: newVal });
                                  saveConfigValue(config.id, newVal);
                                }}
                              />
                            ) : config.value_type === "select" && config.key === "attendance.absence_basis" ? (
                              <div className="flex items-center gap-2">
                                <select
                                  value={currentValue || "30_days"}
                                  onChange={(e) => {
                                    setConfigEdits({ ...configEdits, [config.id]: e.target.value });
                                  }}
                                  onBlur={() => saveConfigValue(config.id, currentValue)}
                                  className="bg-background border border-border/60 rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary"
                                >
                                  <option value="30_days">30 يوم ثابت</option>
                                  <option value="calendar_workdays">أيام العمل الفعلية</option>
                                  <option value="fixed_days_per_month">أيام ثابتة مخصصة</option>
                                </select>
                                {hasChanged && (
                                  <button
                                    onClick={() => saveConfigValue(config.id, currentValue)}
                                    className="px-2 py-1 bg-green-600/20 border border-green-500/50 text-green-400 rounded text-xs hover:bg-green-600/30"
                                  >
                                    حفظ
                                  </button>
                                )}
                              </div>
                            ) : config.value_type === "number" ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={currentValue || ""}
                                  onChange={(e) => {
                                    const newVal = e.target.value ? parseFloat(e.target.value) : 0;
                                    setConfigEdits({ ...configEdits, [config.id]: newVal });
                                  }}
                                  onBlur={() => saveConfigValue(config.id, currentValue)}
                                  className="w-24 bg-background border border-border/60 rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary"
                                />
                                {hasChanged && (
                                  <button
                                    onClick={() => saveConfigValue(config.id, currentValue)}
                                    className="px-2 py-1 bg-green-600/20 border border-green-500/50 text-green-400 rounded text-xs hover:bg-green-600/30"
                                  >
                                    حفظ
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={currentValue || ""}
                                  onChange={(e) => {
                                    setConfigEdits({ ...configEdits, [config.id]: e.target.value });
                                  }}
                                  onBlur={() => saveConfigValue(config.id, currentValue)}
                                  className="w-40 bg-background border border-border/60 rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary"
                                />
                                {hasChanged && (
                                  <button
                                    onClick={() => saveConfigValue(config.id, currentValue)}
                                    className="px-2 py-1 bg-green-600/20 border border-green-500/50 text-green-400 rounded text-xs hover:bg-green-600/30"
                                  >
                                    حفظ
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ══════════ PUBLIC HOLIDAYS (Full-Width) ══════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`${cardCls} lg:col-span-2`}
        >
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <PartyPopper className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-foreground">العطل الرسمية</h3>
                <p className="text-muted-foreground text-sm mt-1">أيام العطل تُستثنى من حسابات الغياب والتأخير تلقائياً</p>
              </div>
            </div>
          </div>

          {holidaysLoading ? (
            <div className="text-muted-foreground text-center py-6">جاري التحميل...</div>
          ) : (
            <div className="space-y-6">
              {/* Year Filter and Add Button */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <label className="text-foreground text-sm">السنة:</label>
                  <select
                    value={holidayYear}
                    onChange={(e) => setHolidayYear(parseInt(e.target.value))}
                    className="bg-background border border-border/60 rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary"
                  >
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                    <option value={2027}>2027</option>
                  </select>
                </div>
                {!showNewHolidayForm && (
                  <button
                    onClick={() => setShowNewHolidayForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/80 text-primary-foreground rounded-lg transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    إضافة عطلة
                  </button>
                )}
              </div>

              {/* New Holiday Form */}
              {showNewHolidayForm && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-muted/20 rounded-lg border border-border/20 space-y-4">
                  <h4 className="text-foreground">عطلة جديدة</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-foreground text-sm mb-2">الاسم (عربي) *</label>
                      <input
                        type="text"
                        value={newHoliday.name_ar}
                        onChange={(e) => setNewHoliday({ ...newHoliday, name_ar: e.target.value })}
                        className="w-full px-3 py-2 bg-background border border-border/60 rounded-lg text-foreground focus:outline-none focus:border-primary"
                        placeholder="عيد الفطر"
                      />
                    </div>
                    <div>
                      <label className="block text-foreground text-sm mb-2">الاسم (إنجليزي)</label>
                      <input
                        type="text"
                        value={newHoliday.name_en}
                        onChange={(e) => setNewHoliday({ ...newHoliday, name_en: e.target.value })}
                        className="w-full px-3 py-2 bg-background border border-border/60 rounded-lg text-foreground focus:outline-none focus:border-primary"
                        placeholder="Eid Al-Fitr"
                      />
                    </div>
                    <div>
                      <label className="block text-foreground text-sm mb-2">التاريخ *</label>
                      <input
                        type="date"
                        value={newHoliday.date}
                        onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                        className="w-full px-3 py-2 bg-background border border-border/60 rounded-lg text-foreground focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/10 rounded-lg">
                      <label className="text-foreground text-sm">تكرار سنوي؟</label>
                      <Toggle
                        on={newHoliday.is_recurring}
                        onClick={() => setNewHoliday({ ...newHoliday, is_recurring: !newHoliday.is_recurring })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={addHoliday}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600/20 border border-green-500/50 text-green-400 hover:bg-green-600/30 rounded-lg transition-colors text-sm"
                    >
                      <Save className="w-4 h-4" />
                      حفظ
                    </button>
                    <button
                      onClick={() => {
                        setShowNewHolidayForm(false);
                        setNewHoliday({ name_ar: "", name_en: "", date: "", is_recurring: false });
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-muted/30 border border-border/40 text-foreground hover:bg-muted/40 rounded-lg transition-colors text-sm"
                    >
                      <X className="w-4 h-4" />
                      إلغاء
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Holidays List */}
              {filteredHolidays.length === 0 ? (
                <div className="text-muted-foreground text-center py-6">لا توجد عطل في هذه السنة</div>
              ) : (
                <div className="space-y-2">
                  {filteredHolidays.map((holiday: DbPublicHoliday) => (
                    <div key={holiday.id} className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                      <div className="flex-1">
                        <p className="text-foreground text-sm">{holiday.name_ar}</p>
                        <p className="text-muted-foreground text-xs mt-1">
                          {new Date(holiday.date).toLocaleDateString("ar-IQ")}
                          {holiday.is_recurring && " (تكرار سنوي)"}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteHoliday(holiday.id)}
                        className="flex items-center gap-2 px-3 py-1 bg-red-600/20 border border-red-500/50 text-red-400 hover:bg-red-600/30 rounded text-xs transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        حذف
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* ── Leave Types Settings ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className={cardCls}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-foreground">أنواع الإجازات</h3>
                <p className="text-muted-foreground text-xs mt-0.5">إدارة أنواع الإجازات وسياساتها</p>
              </div>
            </div>
            <button
              onClick={() => setShowNewLeaveTypeForm(!showNewLeaveTypeForm)}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 rounded-lg text-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              إضافة نوع
            </button>
          </div>

          {/* New Leave Type Form */}
          {showNewLeaveTypeForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-4 p-4 border border-primary/20 rounded-lg bg-primary/5 space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <input value={newLeaveType.name_ar} onChange={e => setNewLeaveType(p => ({ ...p, name_ar: e.target.value }))} placeholder="الاسم بالعربي *" className="h-9 px-3 rounded-lg border border-border bg-input-background text-foreground text-sm outline-none" />
                <input value={newLeaveType.name_en} onChange={e => setNewLeaveType(p => ({ ...p, name_en: e.target.value }))} placeholder="English Name" className="h-9 px-3 rounded-lg border border-border bg-input-background text-foreground text-sm outline-none" dir="ltr" />
                <input value={newLeaveType.code} onChange={e => setNewLeaveType(p => ({ ...p, code: e.target.value }))} placeholder="الرمز (annual) *" className="h-9 px-3 rounded-lg border border-border bg-input-background text-foreground text-sm outline-none" dir="ltr" />
                <input type="number" value={newLeaveType.default_days_per_year || ""} onChange={e => setNewLeaveType(p => ({ ...p, default_days_per_year: Number(e.target.value) }))} placeholder="أيام/سنة" className="h-9 px-3 rounded-lg border border-border bg-input-background text-foreground text-sm outline-none" />
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
                  <input type="checkbox" checked={newLeaveType.is_paid} onChange={e => setNewLeaveType(p => ({ ...p, is_paid: e.target.checked }))} className="rounded" /> مدفوعة
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
                  <input type="checkbox" checked={newLeaveType.allow_half_day} onChange={e => setNewLeaveType(p => ({ ...p, allow_half_day: e.target.checked }))} className="rounded" /> نصف يوم
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
                  <input type="checkbox" checked={newLeaveType.requires_attachment} onChange={e => setNewLeaveType(p => ({ ...p, requires_attachment: e.target.checked }))} className="rounded" /> مرفق مطلوب
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
                  <input type="checkbox" checked={newLeaveType.is_carryover_allowed} onChange={e => setNewLeaveType(p => ({ ...p, is_carryover_allowed: e.target.checked }))} className="rounded" /> ترحيل
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
                  <input type="checkbox" checked={newLeaveType.is_encashable} onChange={e => setNewLeaveType(p => ({ ...p, is_encashable: e.target.checked }))} className="rounded" /> قابل للصرف
                </label>
                <select value={newLeaveType.accrual_method} onChange={e => setNewLeaveType(p => ({ ...p, accrual_method: e.target.value }))} className="h-8 px-2 rounded border border-border bg-input-background text-foreground text-xs outline-none">
                  <option value="annual">سنوي</option>
                  <option value="monthly">شهري</option>
                  <option value="none">بدون استحقاق</option>
                </select>
                <input type="color" value={newLeaveType.color} onChange={e => setNewLeaveType(p => ({ ...p, color: e.target.value }))} className="w-8 h-8 rounded cursor-pointer border-0" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (!newLeaveType.name_ar || !newLeaveType.code) return;
                    await supabase.from("leave_types").insert({
                      ...newLeaveType,
                      is_active: true,
                    });
                    refetchLeaveTypes();
                    setShowNewLeaveTypeForm(false);
                    setNewLeaveType({ name_ar: "", name_en: "", code: "", is_paid: true, default_days_per_year: 0, allow_half_day: false, requires_attachment: false, attachment_after_days: 0, accrual_method: "annual", is_carryover_allowed: false, max_carryover_days: 0, carryover_expiry_months: 3, is_encashable: false, encashment_percentage: 100, color: "#3b82f6", sort_order: 0 });
                    setToastMessage("تم إضافة نوع الإجازة");
                    setTimeout(() => setToastMessage(null), 2000);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90 cursor-pointer"
                >
                  <Save className="w-3 h-3" /> حفظ
                </button>
                <button onClick={() => setShowNewLeaveTypeForm(false)} className="px-3 py-1.5 border border-border text-muted-foreground rounded text-xs hover:bg-muted/20 cursor-pointer">إلغاء</button>
              </div>
            </motion.div>
          )}

          {/* Leave Types List */}
          {leaveTypesLoading ? (
            <div className="text-muted-foreground text-center py-6 text-sm">جاري التحميل...</div>
          ) : leaveTypes.length === 0 ? (
            <div className="text-muted-foreground text-center py-6 text-sm">لا توجد أنواع إجازات</div>
          ) : (
            <div className="space-y-2">
              {leaveTypes.map((lt: DbLeaveType) => (
                <div key={lt.id} className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: lt.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-foreground text-sm">{lt.name_ar}</span>
                        {lt.name_en && <span className="text-muted-foreground text-xs" dir="ltr">({lt.name_en})</span>}
                        <span className="text-muted-foreground text-xs px-1.5 py-0.5 bg-muted/20 rounded">{lt.code}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-muted-foreground text-xs">{lt.default_days_per_year} يوم/سنة</span>
                        {!lt.is_paid && <span className="text-destructive text-xs">بدون راتب</span>}
                        {lt.allow_half_day && <span className="text-blue-400 text-xs">نصف يوم</span>}
                        {lt.is_carryover_allowed && <span className="text-purple-400 text-xs">ترحيل {lt.max_carryover_days}d</span>}
                        {lt.is_encashable && <span className="text-emerald-400 text-xs">صرف {lt.encashment_percentage}%</span>}
                        <span className="text-muted-foreground/60 text-xs">
                          {lt.accrual_method === "monthly" ? "شهري" : lt.accrual_method === "annual" ? "سنوي" : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Toggle
                      on={lt.is_active}
                      onClick={async () => {
                        await supabase.from("leave_types").update({ is_active: !lt.is_active }).eq("id", lt.id);
                        refetchLeaveTypes();
                      }}
                    />
                    <button
                      onClick={async () => {
                        if (confirm("هل تريد حذف هذا النوع؟")) {
                          await supabase.from("leave_types").delete().eq("id", lt.id);
                          refetchLeaveTypes();
                        }
                      }}
                      className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── Contract Types ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cardCls}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Briefcase className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-foreground">أنواع العقود</h3>
                <p className="text-muted-foreground text-xs mt-0.5">إدارة أنواع عقود العمل وإعداداتها</p>
              </div>
            </div>
            <button
              onClick={() => setShowNewContractTypeForm(!showNewContractTypeForm)}
              className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors cursor-pointer"
            >
              {showNewContractTypeForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>

          {showNewContractTypeForm && (
            <div className="mb-4 p-4 rounded-lg bg-muted/20 border border-border/30 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="اسم النوع (عربي) *"
                  value={newContractType.name_ar}
                  onChange={e => setNewContractType(p => ({ ...p, name_ar: e.target.value }))}
                  className="p-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
                />
                <input
                  placeholder="Name (English)"
                  value={newContractType.name_en}
                  onChange={e => setNewContractType(p => ({ ...p, name_en: e.target.value }))}
                  className="p-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input
                  placeholder="الرمز *"
                  value={newContractType.code}
                  onChange={e => setNewContractType(p => ({ ...p, code: e.target.value }))}
                  className="p-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
                />
                <input
                  type="number"
                  placeholder="المدة (أشهر)"
                  value={newContractType.default_duration_months}
                  onChange={e => setNewContractType(p => ({ ...p, default_duration_months: +e.target.value }))}
                  className="p-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
                />
                <input
                  type="number"
                  placeholder="فترة التجربة (أيام)"
                  value={newContractType.probation_days}
                  onChange={e => setNewContractType(p => ({ ...p, probation_days: +e.target.value }))}
                  className="p-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="فترة الإشعار (أيام)"
                  value={newContractType.notice_period_days}
                  onChange={e => setNewContractType(p => ({ ...p, notice_period_days: +e.target.value }))}
                  className="p-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
                />
                <input
                  placeholder="الوصف"
                  value={newContractType.description}
                  onChange={e => setNewContractType(p => ({ ...p, description: e.target.value }))}
                  className="p-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={newContractType.is_renewable}
                    onChange={e => setNewContractType(p => ({ ...p, is_renewable: e.target.checked }))}
                    className="accent-primary"
                  />
                  قابل للتجديد
                </label>
              </div>
              <button
                onClick={async () => {
                  if (!newContractType.name_ar || !newContractType.code) return;
                  const ctPayload = {
                    name_ar: newContractType.name_ar,
                    name_en: newContractType.name_en || null,
                    code: newContractType.code,
                    description: newContractType.description || null,
                    default_duration_months: newContractType.default_duration_months,
                    is_renewable: newContractType.is_renewable,
                    probation_days: newContractType.probation_days,
                    notice_period_days: newContractType.notice_period_days,
                    sort_order: newContractType.sort_order,
                  };
                  if (isOdooBackend()) await odooData.createContractType(ctPayload);
                  else await supabase.from("contract_types").insert(ctPayload);
                  showToast("تم إضافة نوع العقد");
                  setShowNewContractTypeForm(false);
                  setNewContractType({ name_ar: "", name_en: "", code: "", description: "", default_duration_months: 12, is_renewable: true, probation_days: 90, notice_period_days: 30, sort_order: 0 });
                  refetchContractTypes();
                }}
                className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer"
              >
                إضافة نوع عقد
              </button>
            </div>
          )}

          {contractTypesLoading ? (
            <p className="text-muted-foreground text-sm text-center py-4">جاري التحميل...</p>
          ) : (
            <div className="space-y-2">
              {contractTypes.map(ct => (
                <div key={ct.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-primary/10 text-primary">{ct.code}</span>
                    <div>
                      <p className="text-sm text-foreground">{ct.name_ar}</p>
                      <p className="text-xs text-muted-foreground">
                        {ct.default_duration_months ? `${ct.default_duration_months} شهر` : "غير محدد"} · تجربة {ct.probation_days} يوم · إشعار {ct.notice_period_days} يوم
                        {ct.is_renewable && " · قابل للتجديد"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Toggle
                      on={ct.is_active}
                      onClick={async () => {
                        if (isOdooBackend()) await odooData.updateContractType(ct.id, { is_active: !ct.is_active });
                        else await supabase.from("contract_types").update({ is_active: !ct.is_active }).eq("id", ct.id);
                        refetchContractTypes();
                      }}
                    />
                    <button
                      onClick={async () => {
                        if (!confirm("حذف نوع العقد؟")) return;
                        if (isOdooBackend()) await odooData.deleteContractType(ct.id);
                        else await supabase.from("contract_types").delete().eq("id", ct.id);
                        showToast("تم حذف نوع العقد");
                        refetchContractTypes();
                      }}
                      className="p-1.5 rounded text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── Document Types ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cardCls}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <FileCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-foreground">أنواع الوثائق</h3>
                <p className="text-muted-foreground text-xs mt-0.5">إدارة أنواع الوثائق والمستندات المطلوبة</p>
              </div>
            </div>
            <button
              onClick={() => setShowNewDocTypeForm(!showNewDocTypeForm)}
              className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors cursor-pointer"
            >
              {showNewDocTypeForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>

          {showNewDocTypeForm && (
            <div className="mb-4 p-4 rounded-lg bg-muted/20 border border-border/30 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="اسم الوثيقة (عربي) *"
                  value={newDocType.name_ar}
                  onChange={e => setNewDocType(p => ({ ...p, name_ar: e.target.value }))}
                  className="p-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
                />
                <input
                  placeholder="Name (English)"
                  value={newDocType.name_en}
                  onChange={e => setNewDocType(p => ({ ...p, name_en: e.target.value }))}
                  className="p-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="الرمز *"
                  value={newDocType.code}
                  onChange={e => setNewDocType(p => ({ ...p, code: e.target.value }))}
                  className="p-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
                />
                <input
                  type="number"
                  placeholder="أيام التنبيه قبل الانتهاء"
                  value={newDocType.expiry_warning_days}
                  onChange={e => setNewDocType(p => ({ ...p, expiry_warning_days: +e.target.value }))}
                  className="p-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
                />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={newDocType.has_expiry}
                    onChange={e => setNewDocType(p => ({ ...p, has_expiry: e.target.checked }))}
                    className="accent-primary"
                  />
                  لها تاريخ انتهاء
                </label>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={newDocType.is_required}
                    onChange={e => setNewDocType(p => ({ ...p, is_required: e.target.checked }))}
                    className="accent-primary"
                  />
                  مطلوبة إلزامياً
                </label>
              </div>
              <button
                onClick={async () => {
                  if (!newDocType.name_ar || !newDocType.code) return;
                  await supabase.from("document_types").insert({
                    name_ar: newDocType.name_ar,
                    name_en: newDocType.name_en || null,
                    code: newDocType.code,
                    has_expiry: newDocType.has_expiry,
                    expiry_warning_days: newDocType.expiry_warning_days,
                    is_required: newDocType.is_required,
                    sort_order: newDocType.sort_order,
                  });
                  showToast("تم إضافة نوع الوثيقة");
                  setShowNewDocTypeForm(false);
                  setNewDocType({ name_ar: "", name_en: "", code: "", has_expiry: true, expiry_warning_days: 30, is_required: false, sort_order: 0 });
                  refetchDocumentTypes();
                }}
                className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer"
              >
                إضافة نوع وثيقة
              </button>
            </div>
          )}

          {documentTypesLoading ? (
            <p className="text-muted-foreground text-sm text-center py-4">جاري التحميل...</p>
          ) : (
            <div className="space-y-2">
              {documentTypes.map(dt => (
                <div key={dt.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-primary/10 text-primary">{dt.code}</span>
                    <div>
                      <p className="text-sm text-foreground">{dt.name_ar}</p>
                      <p className="text-xs text-muted-foreground">
                        {dt.has_expiry ? `تنبيه قبل ${dt.expiry_warning_days} يوم` : "بدون انتهاء"}
                        {dt.is_required && " · إلزامية"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Toggle
                      on={dt.is_active}
                      onClick={async () => {
                        await supabase.from("document_types").update({ is_active: !dt.is_active }).eq("id", dt.id);
                        refetchDocumentTypes();
                      }}
                    />
                    <button
                      onClick={async () => {
                        if (!confirm("حذف نوع الوثيقة؟")) return;
                        await supabase.from("document_types").delete().eq("id", dt.id);
                        showToast("تم حذف نوع الوثيقة");
                        refetchDocumentTypes();
                      }}
                      className="p-1.5 rounded text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── Personal Account ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cardCls}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <User className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-foreground">الحساب الشخصي</h3>
          </div>
          <div className="space-y-4">
            {[
              { label: "الاسم الكامل", value: "مدير الموارد البشرية" },
              { label: "البريد الإلكتروني", value: "hr@company.iq" },
              { label: "رقم الهاتف", value: "07701234567" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                <span className="text-foreground" style={{ fontSize: 13 }}>
                  {item.label}
                </span>
                <span className="text-muted-foreground" style={{ fontSize: 13 }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Notifications ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={cardCls}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-foreground">الإشعارات</h3>
          </div>
          <div className="space-y-4">
            {[
              { label: "إشعارات طلبات الإجازة", key: "leave" as const },
              { label: "إشعارات الحضور المتأخر", key: "lateAttendance" as const },
              { label: "إشعارات الإنذارات الجديدة", key: "warnings" as const },
              { label: "إشعارات التقييمات", key: "evaluations" as const },
              { label: "إشعارات التوظيف", key: "recruitment" as const },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                <span className="text-foreground" style={{ fontSize: 13 }}>
                  {item.label}
                </span>
                <Toggle on={notifToggles[item.key]} onClick={() => toggleNotif(item.key)} />
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Security ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={cardCls}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-foreground">الأمان</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
              <span className="text-foreground" style={{ fontSize: 13 }}>
                تغيير كلمة المرور
              </span>
              <button
                className="px-3 py-1 rounded-md border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                style={{ fontSize: 12 }}
              >
                تعديل
              </button>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
              <span className="text-foreground" style={{ fontSize: 13 }}>
                المصادقة الثنائية
              </span>
              <Toggle on={twoFactor} onClick={() => setTwoFactor(!twoFactor)} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
              <span className="text-foreground" style={{ fontSize: 13 }}>
                سجل الدخول
              </span>
              <button
                className="px-3 py-1 rounded-md border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                style={{ fontSize: 12 }}
              >
                عرض
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── System / Display Settings ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={cardCls}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <SettingsIcon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-foreground">النظام</h3>
          </div>
          <div className="space-y-4">
            {/* Language */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
              <span className="text-foreground" style={{ fontSize: 13 }}>
                اللغة
              </span>
              <span className="text-muted-foreground" style={{ fontSize: 13 }}>
                العربية
              </span>
            </div>
            {/* Timezone */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
              <span className="text-foreground" style={{ fontSize: 13 }}>
                المنطقة الزمنية
              </span>
              <span className="text-muted-foreground" style={{ fontSize: 13 }}>
                بغداد (GMT+3)
              </span>
            </div>

            {/* ── Month Format Selector ── */}
            <div className="p-3 rounded-lg bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-foreground flex items-center gap-2" style={{ fontSize: 13 }}>
                  <Calendar className="w-4 h-4 text-primary" />
                  تنسيق عرض الشهر
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {MONTH_FORMATS.map((fmt) => {
                  const isActive = settings.monthFormat === fmt.value;
                  return (
                    <button
                      key={fmt.value}
                      onClick={() => updateSettings({ monthFormat: fmt.value })}
                      className={`relative p-3 rounded-lg border-2 transition-all cursor-pointer text-start ${
                        isActive ? "border-primary bg-primary/10" : "border-border/30 bg-muted/10 hover:border-border/60"
                      }`}
                    >
                      {isActive && (
                        <div className="absolute top-2 end-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                      <span className="text-foreground block" style={{ fontSize: 13 }}>
                        {fmt.label}
                      </span>
                      <span className="text-primary block mt-1" style={{ fontSize: 15 }} dir="ltr">
                        {fmt.example}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
