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
import { useAppSettings, type MonthFormat, formatMonthYear } from "@/app/providers";
import * as odooData from "@/shared/api/odooData";
import { useShifts, useHierarchyData, useSystemModules, useConfigurations, usePublicHolidays, useLeaveTypes, useContractTypes, useDocumentTypes, type DbShift, type DbSystemModule, type DbConfiguration, type DbPublicHoliday, type DbLeaveType, type DbContractType, type DbDocumentType } from "@/shared/hooks";
import { ShiftAssigner } from "@/features/attendance/components/ShiftAssigner";
import { formatDate } from "@/i18n/format";
import { localizedConfirm } from "@/i18n/native";
import { arabicSource } from "@/i18n/source";

// ── Curated department color palette — 15 distinct, accessible hues ──
const DEPT_COLOR_PALETTE = [
  "#FFD700", // Gold — reserved for senior management.
  "#8B5CF6", // Violet
  "#3B82F6", // Blue
  "#06B6D4", // Cyan
  "#22C55E", // Green
  "#EC4899", // Pink
  "#EF4444", // Red
  "#F59E0B", // Orange
  "#14B8A6", // Teal
  "#6366F1", // Indigo
  "#A855F7", // Purple
  "#0EA5E9", // Light blue
  "#D946EF", // Fuchsia
  "#84CC16", // Lime
  "#F43F5E", // Crimson
];

const MONTH_FORMATS: { value: MonthFormat; label: string; example: string }[] = [
  { value: "name", label: arabicSource("settings.name_of_the_month"), example: formatMonthYear("2026-02", "name") },
  { value: "numeric", label: arabicSource("settings.digital"), example: formatMonthYear("2026-02", "numeric") },
];

const DAYS_OF_WEEK = [
  { key: "sunday", label: arabicSource("common.sunday_2") },
  { key: "monday", label: arabicSource("settings.monday") },
  { key: "tuesday", label: arabicSource("common.tuesday") },
  { key: "wednesday", label: arabicSource("common.wednesday") },
  { key: "thursday", label: arabicSource("common.thursday") },
  { key: "friday", label: arabicSource("common.friday") },
  { key: "saturday", label: arabicSource("common.saturday") },
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
        await odooData.updateDepartment(deptId, { color });
      }
      setDeptColorEdits({});
      showToast(arabicSource("settings.section_colors_were_saved_successfully"));
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
      className="fixed top-4 start-4 end-4 bg-green-500/20 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg z-50"
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
      showToast(arabicSource("common.you_must_enter_the_name_of_the_shift"));
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
      await odooData.updateShift(state.id, updateData);
      showToast(arabicSource("settings.the_shift_has_been_saved_successfully"));
      setEditingShift(null);
      refetchShifts();
    } catch (err) {
      showToast(arabicSource("settings.error_saving_the_shift"));
    }
  };

  const createShift = async (state: ShiftEditState) => {
    if (!state.name.trim()) {
      showToast(arabicSource("common.you_must_enter_the_name_of_the_shift"));
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
      await odooData.createShift(insertData);
      showToast(arabicSource("settings.the_shift_was_created_successfully"));
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
      showToast(arabicSource("settings.error_creating_shift"));
    }
  };

  const deleteShift = async (shiftId: string) => {
    if (!localizedConfirm(arabicSource("settings.do_you_really_want_to_delete_this_shift"))) return;
    try {
      await odooData.deleteShift(shiftId);
      showToast(arabicSource("settings.the_shift_has_been_successfully_deleted"));
      refetchShifts();
    } catch (err) {
      showToast(arabicSource("settings.error_deleting_shift"));
    }
  };

  const setAsDefault = async (_shiftId: string) => {
    // Odoo shifts have no is_default flag on model; mark via description is skipped — no-op toast
    showToast("تعيين الافتراضي غير متاح على Odoo بعد — عيّن القسم/الموظف مباشرة");
  };

  const saveDeptAssignments = async () => {
    setSavingDepts(true);
    try {
      for (const [deptId, shiftId] of Object.entries(deptShiftAssignments)) {
        const updateData = shiftId ? { default_shift_id: shiftId } : { default_shift_id: null };
        await odooData.updateDepartment(deptId, updateData);
      }
      showToast(arabicSource("settings.section_assignments_were_saved_successfully"));
    } catch (err) {
      showToast(arabicSource("settings.error_saving_partition_assignments"));
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
      await odooData.updateModule(module.id, !module.is_enabled);
      refetchModules();
      showToast(`${arabicSource("common.done")} ${!module.is_enabled ? arabicSource("common.activate") : arabicSource("settings.disabled")} ${arabicSource("settings.feature_successfully")}`);
    } catch (err) {
      showToast(arabicSource("settings.feature_update_error"));
    }
  };

  // ——— Configuration Edit ———
  const saveConfigValue = async (configId: string, value: any) => {
    try {
      await odooData.updateConfig(configId, value);
      refetchConfigs();
      showToast(arabicSource("settings.the_setting_was_saved_successfully"));
      setConfigEdits((prev) => {
        const newEdits = { ...prev };
        delete newEdits[configId];
        return newEdits;
      });
    } catch (err) {
      showToast(arabicSource("settings.error_saving_setting"));
    }
  };

  // ——— Public Holidays CRUD ———
  const addHoliday = async () => {
    if (!newHoliday.name_ar || !newHoliday.date) {
      showToast(arabicSource("settings.please_fill_out_the_required_fields"));
      return;
    }
    try {
      await odooData.createHoliday({ name_ar: newHoliday.name_ar, date: newHoliday.date });
      refetchHolidays();
      setNewHoliday({ name_ar: "", name_en: "", date: "", is_recurring: false });
      setShowNewHolidayForm(false);
      showToast(arabicSource("settings.holiday_added_successfully"));
    } catch (err) {
      showToast(arabicSource("settings.error_adding_holiday"));
    }
  };

  const deleteHoliday = async (holidayId: string) => {
    try {
      await odooData.deleteHoliday(holidayId);
      refetchHolidays();
      showToast(arabicSource("settings.vacation_has_been_successfully_deleted"));
    } catch (err) {
      showToast(arabicSource("settings.error_deleting_holiday"));
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
    payroll: arabicSource("settings.salaries_and_compensation"),
    leave: arabicSource("common.vacations"),
    attendance: arabicSource("common.attendance_and_departure"),
    employee: arabicSource("settings.personnel_affairs"),
    system: arabicSource("common.system"),
  };

  return (
    <div className="space-y-4">
      {toastMessage && <Toast message={toastMessage} />}

      <div>
        <h1 className="text-gradient-gold">{arabicSource("common.settings")}</h1>
        <p className="text-muted-foreground mt-1">{arabicSource("settings.system_settings_and_preferences")}</p>
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
              <h3 className="text-foreground" style={{ fontSize: 14 }}>{arabicSource("settings.section_colors")}</h3>
              <p className="text-muted-foreground" style={{ fontSize: 11 }}>{arabicSource("settings.appears_on_the_organizational_chart_and_employee_cards")}</p>
            </div>
          </div>

          {deptLoading ? (
            <div className="text-muted-foreground text-center py-3" style={{ fontSize: 12 }}>{arabicSource("common.loading")}</div>
          ) : departments.length === 0 ? (
            <div className="text-muted-foreground text-center py-3" style={{ fontSize: 12 }}>{arabicSource("common.there_are_no_sections")}</div>
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
                        {arabicSource("settings.choose_a_color_for")} <span className="text-foreground">{activeDeptName}</span>:
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
                            title={isUsed ? arabicSource("settings.is_already_in_use") : isSelected ? arabicSource("settings.current_color") : ""}
                          />
                        );
                      })}
                    </div>
                    {/* Custom color picker */}
                    <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-border/20">
                      <label className="text-muted-foreground shrink-0" style={{ fontSize: 10 }}>{arabicSource("settings.customized_color")}</label>
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
                  {savingDeptColors ? arabicSource("common.saving") : arabicSource("settings.save_section_colors")}
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
                <h3 className="text-foreground">{arabicSource("settings.time_and_shift_schedules")}</h3>
                <p className="text-muted-foreground text-sm mt-1">{arabicSource("settings.managing_work_times_and_shifts_application_priority_employee_dep")}</p>
              </div>
            </div>
            {!showNewShiftForm && (
              <button
                onClick={() => setShowNewShiftForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/80 text-primary-foreground rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>{arabicSource("settings.new_shift_added")}</span>
              </button>
            )}
          </div>

          {/* New Shift Form */}
          {showNewShiftForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-3 bg-muted/20 rounded-lg border border-border/20">
              <h4 className="text-foreground mb-4">{arabicSource("settings.new_shift")}</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-foreground text-sm mb-2">{arabicSource("common.name")}</label>
                  <input
                    type="text"
                    value={newShiftForm.name}
                    onChange={(e) => setNewShiftForm({ ...newShiftForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-muted/30 border border-border/40 rounded-lg text-foreground focus:outline-none focus:border-primary"
                    placeholder={arabicSource("settings.the_name_of_the_shift")}
                  />
                </div>

                <div>
                  <label className="block text-foreground text-sm mb-2">{arabicSource("common.description")}</label>
                  <input
                    type="text"
                    value={newShiftForm.description}
                    onChange={(e) => setNewShiftForm({ ...newShiftForm, description: e.target.value })}
                    className="w-full px-3 py-2 bg-muted/30 border border-border/40 rounded-lg text-foreground focus:outline-none focus:border-primary"
                    placeholder={arabicSource("settings.description_of_the_shift")}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-foreground text-sm mb-2">{arabicSource("common.leniency_minutes")}</label>
                    <input
                      type="number"
                      value={newShiftForm.grace_minutes}
                      onChange={(e) => setNewShiftForm({ ...newShiftForm, grace_minutes: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-muted/30 border border-border/40 rounded-lg text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-foreground text-sm mb-2">{arabicSource("common.late_hours_for_absence")}</label>
                    <input
                      type="number"
                      value={newShiftForm.late_to_absent_hours}
                      onChange={(e) => setNewShiftForm({ ...newShiftForm, late_to_absent_hours: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-muted/30 border border-border/40 rounded-lg text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-foreground text-sm mb-2">{arabicSource("common.daily_working_hours")}</label>
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
                  <label className="block text-foreground text-sm mb-3">{arabicSource("common.working_days")}</label>
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
                    {arabicSource("common.save")}
                  </button>
                  <button
                    onClick={() => setShowNewShiftForm(false)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-500/50 text-red-400 hover:bg-red-600/30 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    {arabicSource("common.cancel")}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Shifts List */}
          <div className="space-y-2 mb-4">
            {shiftsLoading ? (
              <div className="text-muted-foreground text-center py-4" style={{ fontSize: 13 }}>{arabicSource("common.loading")}</div>
            ) : shifts.length === 0 ? (
              <div className="text-muted-foreground text-center py-4" style={{ fontSize: 13 }}>{arabicSource("settings.no_shifts")}</div>
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
                        {shift.is_default && <span className="px-1.5 py-0.5 bg-primary/20 border border-primary/40 text-primary rounded-full shrink-0" style={{ fontSize: 10 }}>{arabicSource("settings.default")}</span>}
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
                          {shift.grace_minutes}{arabicSource("settings.d")} {shift.target_hours_per_day}{arabicSource("settings.s")}
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
                              <th className="text-start text-muted-foreground py-2">{arabicSource("common.today")}</th>
                              <th className="text-start text-muted-foreground py-2">{arabicSource("common.status")}</th>
                              <th className="text-start text-muted-foreground py-2">{arabicSource("common.time")}</th>
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
                                      {isWorking ? arabicSource("settings.business_day") : arabicSource("settings.day_off")}
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
                          <Edit2 className="w-3.5 h-3.5" /> {arabicSource("common.edit")}
                        </button>
                        <button onClick={() => deleteShift(shift.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-600/20 border border-red-500/50 text-red-400 hover:bg-red-600/30 rounded-lg transition-colors" style={{ fontSize: 12 }}>
                          <Trash2 className="w-3.5 h-3.5" /> {arabicSource("common.delete")}
                        </button>
                        {!shift.is_default && (
                          <button onClick={() => setAsDefault(shift.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-yellow-600/20 border border-yellow-500/50 text-yellow-400 hover:bg-yellow-600/30 rounded-lg transition-colors" style={{ fontSize: 12 }}>
                            <Check className="w-3.5 h-3.5" /> {arabicSource("settings.set_as_default")}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Edit Form */}
                  {editingShift?.id === shift.id && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-border/20 p-4 bg-muted/5 space-y-4">
                      <div>
                        <label className="block text-foreground text-sm mb-2">{arabicSource("common.name")}</label>
                        <input
                          type="text"
                          value={editingShift.name}
                          onChange={(e) => setEditingShift({ ...editingShift, name: e.target.value })}
                          className="w-full px-3 py-2 bg-muted/30 border border-border/40 rounded-lg text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-foreground text-sm mb-2">{arabicSource("common.description")}</label>
                        <input
                          type="text"
                          value={editingShift.description}
                          onChange={(e) => setEditingShift({ ...editingShift, description: e.target.value })}
                          className="w-full px-3 py-2 bg-muted/30 border border-border/40 rounded-lg text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-foreground text-sm mb-2">{arabicSource("common.leniency_minutes")}</label>
                          <input
                            type="number"
                            value={editingShift.grace_minutes}
                            onChange={(e) => setEditingShift({ ...editingShift, grace_minutes: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 bg-muted/30 border border-border/40 rounded-lg text-foreground focus:outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-foreground text-sm mb-2">{arabicSource("common.late_hours_for_absence")}</label>
                          <input
                            type="number"
                            value={editingShift.late_to_absent_hours}
                            onChange={(e) => setEditingShift({ ...editingShift, late_to_absent_hours: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 bg-muted/30 border border-border/40 rounded-lg text-foreground focus:outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-foreground text-sm mb-2">{arabicSource("common.daily_working_hours")}</label>
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
                        <label className="block text-foreground text-sm mb-3">{arabicSource("common.working_days")}</label>
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
                          {arabicSource("common.save")}
                        </button>
                        <button
                          onClick={() => setEditingShift(null)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-500/50 text-red-400 hover:bg-red-600/30 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                          {arabicSource("common.cancel")}
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
              {arabicSource("settings.assigning_shifts_to_departments")}
            </h4>
            <div className="space-y-3">
              {deptLoading ? (
                <div className="text-muted-foreground text-center py-6">{arabicSource("common.loading")}</div>
              ) : departments.length === 0 ? (
                <div className="text-muted-foreground text-center py-6">{arabicSource("common.there_are_no_sections")}</div>
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
                      <option value="">{arabicSource("settings.virtual_shift")}</option>
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
              {savingDepts ? arabicSource("common.saving") : arabicSource("settings.save_partition_assignments")}
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
                <h4 className="text-foreground" style={{ fontSize: 14 }}>{arabicSource("settings.assigning_employees_to_shifts")}</h4>
                <span className="text-muted-foreground text-xs">{arabicSource("settings.drag_and_drop")}</span>
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
                <h3 className="text-foreground">{arabicSource("settings.units_and_features")}</h3>
                <p className="text-muted-foreground text-sm mt-1">{arabicSource("settings.activate_or_disable_any_feature_in_the_system_disabled_features")}</p>
              </div>
            </div>
          </div>

          {modulesLoading ? (
            <div className="text-muted-foreground text-center py-6">{arabicSource("common.loading")}</div>
          ) : !sysModules || Object.keys(groupedModules).length === 0 ? (
            <div className="text-muted-foreground text-center py-3" style={{ fontSize: 13 }}>{arabicSource("settings.no_units_turn_on_the_relay_first")}</div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedModules).map(([category, modules]) => (
                <div key={category}>
                  <div className="flex items-center gap-3 mb-3 pb-2 border-s-4 border-primary ps-3">
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
                <h3 className="text-foreground">{arabicSource("settings.rules_and_settings")}</h3>
                <p className="text-muted-foreground text-sm mt-1">{arabicSource("settings.all_editable_values_applied_directly_to_calculations")}</p>
              </div>
            </div>
          </div>

          {configsLoading ? (
            <div className="text-muted-foreground text-center py-6">{arabicSource("common.loading")}</div>
          ) : !configs || Object.keys(groupedConfigs).length === 0 ? (
            <div className="text-muted-foreground text-center py-3" style={{ fontSize: 13 }}>{arabicSource("settings.no_settings_run_the_relay_first")}</div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedConfigs).map(([category, categoryConfigs]) => (
                <div key={category}>
                  <div className="flex items-center gap-3 mb-3 pb-2 border-s-4 border-primary ps-3">
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
                            {config.description_ar && (
                              <p className="text-muted-foreground text-xs mt-1">{config.description_ar}</p>
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
                            ) : config.value_type === "select" && config.config_key === "attendance.absence_basis" ? (
                              <div className="flex items-center gap-2">
                                <select
                                  value={currentValue || "30_days"}
                                  onChange={(e) => {
                                    setConfigEdits({ ...configEdits, [config.id]: e.target.value });
                                  }}
                                  onBlur={() => saveConfigValue(config.id, currentValue)}
                                  className="bg-background border border-border/60 rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary"
                                >
                                  <option value="30_days">{arabicSource("settings.30_days_fixed")}</option>
                                  <option value="calendar_workdays">{arabicSource("settings.actual_working_days")}</option>
                                  <option value="fixed_days_per_month">{arabicSource("settings.custom_fixed_days")}</option>
                                </select>
                                {hasChanged && (
                                  <button
                                    onClick={() => saveConfigValue(config.id, currentValue)}
                                    className="px-2 py-1 bg-green-600/20 border border-green-500/50 text-green-400 rounded text-xs hover:bg-green-600/30"
                                  >
                                    {arabicSource("common.save")}
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
                                    {arabicSource("common.save")}
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
                                    {arabicSource("common.save")}
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
                <h3 className="text-foreground">{arabicSource("settings.public_holidays")}</h3>
                <p className="text-muted-foreground text-sm mt-1">{arabicSource("settings.holidays_are_automatically_excluded_from_absence_and_tardiness_c")}</p>
              </div>
            </div>
          </div>

          {holidaysLoading ? (
            <div className="text-muted-foreground text-center py-6">{arabicSource("common.loading")}</div>
          ) : (
            <div className="space-y-6">
              {/* Year Filter and Add Button */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <label className="text-foreground text-sm">{arabicSource("settings.year")}</label>
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
                    {arabicSource("settings.add_holiday")}
                  </button>
                )}
              </div>

              {/* New Holiday Form */}
              {showNewHolidayForm && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-muted/20 rounded-lg border border-border/20 space-y-4">
                  <h4 className="text-foreground">{arabicSource("settings.new_holiday")}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-foreground text-sm mb-2">{arabicSource("settings.name_arabic")}</label>
                      <input
                        type="text"
                        value={newHoliday.name_ar}
                        onChange={(e) => setNewHoliday({ ...newHoliday, name_ar: e.target.value })}
                        className="w-full px-3 py-2 bg-background border border-border/60 rounded-lg text-foreground focus:outline-none focus:border-primary"
                        placeholder={arabicSource("settings.eid_al_fitr")}
                      />
                    </div>
                    <div>
                      <label className="block text-foreground text-sm mb-2">{arabicSource("settings.name_english")}</label>
                      <input
                        type="text"
                        value={newHoliday.name_en}
                        onChange={(e) => setNewHoliday({ ...newHoliday, name_en: e.target.value })}
                        className="w-full px-3 py-2 bg-background border border-border/60 rounded-lg text-foreground focus:outline-none focus:border-primary"
                        placeholder={arabicSource("settings.eid_al_fitr")}
                      />
                    </div>
                    <div>
                      <label className="block text-foreground text-sm mb-2">{arabicSource("common.date_2")}</label>
                      <input
                        type="date"
                        value={newHoliday.date}
                        onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                        className="w-full px-3 py-2 bg-background border border-border/60 rounded-lg text-foreground focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/10 rounded-lg">
                      <label className="text-foreground text-sm">{arabicSource("settings.annual_frequency_2")}</label>
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
                      {arabicSource("common.save")}
                    </button>
                    <button
                      onClick={() => {
                        setShowNewHolidayForm(false);
                        setNewHoliday({ name_ar: "", name_en: "", date: "", is_recurring: false });
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-muted/30 border border-border/40 text-foreground hover:bg-muted/40 rounded-lg transition-colors text-sm"
                    >
                      <X className="w-4 h-4" />
                      {arabicSource("common.cancel")}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Holidays List */}
              {filteredHolidays.length === 0 ? (
                <div className="text-muted-foreground text-center py-6">{arabicSource("settings.there_are_no_holidays_this_year")}</div>
              ) : (
                <div className="space-y-2">
                  {filteredHolidays.map((holiday: DbPublicHoliday) => (
                    <div key={holiday.id} className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                      <div className="flex-1">
                        <p className="text-foreground text-sm">{holiday.name_ar}</p>
                        <p className="text-muted-foreground text-xs mt-1">
                          {formatDate(holiday.date)}
                          {holiday.is_recurring && " " + arabicSource("settings.annual_frequency")}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteHoliday(holiday.id)}
                        className="flex items-center gap-2 px-3 py-1 bg-red-600/20 border border-red-500/50 text-red-400 hover:bg-red-600/30 rounded text-xs transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        {arabicSource("common.delete")}
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
                <h3 className="text-foreground">{arabicSource("settings.types_of_leave")}</h3>
                <p className="text-muted-foreground text-xs mt-0.5">{arabicSource("settings.managing_leave_types_and_policies")}</p>
              </div>
            </div>
            <button
              onClick={() => setShowNewLeaveTypeForm(!showNewLeaveTypeForm)}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 rounded-lg text-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              {arabicSource("settings.add_type")}
            </button>
          </div>

          {/* New Leave Type Form */}
          {showNewLeaveTypeForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-4 p-4 border border-primary/20 rounded-lg bg-primary/5 space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <input value={newLeaveType.name_ar} onChange={e => setNewLeaveType(p => ({ ...p, name_ar: e.target.value }))} placeholder={arabicSource("settings.name_in_arabic")} className="h-9 px-3 rounded-lg border border-border bg-input-background text-foreground text-sm outline-none" />
                <input value={newLeaveType.name_en} onChange={e => setNewLeaveType(p => ({ ...p, name_en: e.target.value }))} placeholder={arabicSource("settings.name_english")} className="h-9 px-3 rounded-lg border border-border bg-input-background text-foreground text-sm outline-none" dir="ltr" />
                <input value={newLeaveType.code} onChange={e => setNewLeaveType(p => ({ ...p, code: e.target.value }))} placeholder={arabicSource("settings.code_annual")} className="h-9 px-3 rounded-lg border border-border bg-input-background text-foreground text-sm outline-none" dir="ltr" />
                <input type="number" value={newLeaveType.default_days_per_year || ""} onChange={e => setNewLeaveType(p => ({ ...p, default_days_per_year: Number(e.target.value) }))} placeholder={arabicSource("settings.days_year")} className="h-9 px-3 rounded-lg border border-border bg-input-background text-foreground text-sm outline-none" />
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
                  <input type="checkbox" checked={newLeaveType.is_paid} onChange={e => setNewLeaveType(p => ({ ...p, is_paid: e.target.checked }))} className="rounded" /> {arabicSource("settings.driven")}
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
                  <input type="checkbox" checked={newLeaveType.allow_half_day} onChange={e => setNewLeaveType(p => ({ ...p, allow_half_day: e.target.checked }))} className="rounded" /> {arabicSource("common.half_a_day")}
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
                  <input type="checkbox" checked={newLeaveType.requires_attachment} onChange={e => setNewLeaveType(p => ({ ...p, requires_attachment: e.target.checked }))} className="rounded" /> {arabicSource("settings.attachment_required")}
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
                  <input type="checkbox" checked={newLeaveType.is_carryover_allowed} onChange={e => setNewLeaveType(p => ({ ...p, is_carryover_allowed: e.target.checked }))} className="rounded" /> {arabicSource("common.relay")}
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
                  <input type="checkbox" checked={newLeaveType.is_encashable} onChange={e => setNewLeaveType(p => ({ ...p, is_encashable: e.target.checked }))} className="rounded" /> {arabicSource("common.exchangeable")}
                </label>
                <select value={newLeaveType.accrual_method} onChange={e => setNewLeaveType(p => ({ ...p, accrual_method: e.target.value }))} className="h-8 px-2 rounded border border-border bg-input-background text-foreground text-xs outline-none">
                  <option value="annual">{arabicSource("common.annual")}</option>
                  <option value="monthly">{arabicSource("common.monthly")}</option>
                  <option value="none">{arabicSource("settings.without_merit")}</option>
                </select>
                <input type="color" value={newLeaveType.color} onChange={e => setNewLeaveType(p => ({ ...p, color: e.target.value }))} className="w-8 h-8 rounded cursor-pointer border-0" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    try {
                      await odooData.createLeaveType({
                        name: newLeaveType.name_en || newLeaveType.name_ar,
                        name_ar: newLeaveType.name_ar,
                        code: newLeaveType.code,
                        is_paid: newLeaveType.is_paid,
                        default_days_per_year: newLeaveType.default_days_per_year,
                        allow_half_day: newLeaveType.allow_half_day,
                        requires_attachment: newLeaveType.requires_attachment,
                        is_carryover_allowed: newLeaveType.is_carryover_allowed,
                        max_carryover_days: newLeaveType.max_carryover_days,
                        is_encashable: newLeaveType.is_encashable,
                        encashment_percentage: newLeaveType.encashment_percentage,
                        accrual_method: newLeaveType.accrual_method === "annual" ? "yearly" : newLeaveType.accrual_method,
                        color: newLeaveType.color,
                        sort_order: newLeaveType.sort_order,
                      });
                      setShowNewLeaveTypeForm(false);
                      await refetchLeaveTypes();
                      setToastMessage("Saved");
                    } catch (e: any) {
                      setToastMessage(e?.message || "Failed to create leave type");
                    }
                    setTimeout(() => setToastMessage(null), 2500);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90 cursor-pointer"
                >
                  <Save className="w-3 h-3" /> {arabicSource("common.save")}
                </button>
                <button onClick={() => setShowNewLeaveTypeForm(false)} className="px-3 py-1.5 border border-border text-muted-foreground rounded text-xs hover:bg-muted/20 cursor-pointer">{arabicSource("common.cancel")}</button>
              </div>
            </motion.div>
          )}

          {/* Leave Types List */}
          {leaveTypesLoading ? (
            <div className="text-muted-foreground text-center py-6 text-sm">{arabicSource("common.loading")}</div>
          ) : leaveTypes.length === 0 ? (
            <div className="text-muted-foreground text-center py-6 text-sm">{arabicSource("settings.there_are_no_leave_types")}</div>
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
                        <span className="text-muted-foreground text-xs">{lt.default_days_per_year} {arabicSource("settings.day_year")}</span>
                        {!lt.is_paid && <span className="text-destructive text-xs">{arabicSource("common.without_salary")}</span>}
                        {lt.allow_half_day && <span className="text-blue-400 text-xs">{arabicSource("common.half_a_day")}</span>}
                        {lt.is_carryover_allowed && <span className="text-purple-400 text-xs">{arabicSource("common.relay")} {lt.max_carryover_days}d</span>}
                        {lt.is_encashable && <span className="text-emerald-400 text-xs">{arabicSource("settings.exchange")} {lt.encashment_percentage}%</span>}
                        <span className="text-muted-foreground/60 text-xs">
                          {lt.accrual_method === "monthly" ? arabicSource("common.monthly") : lt.accrual_method === "annual" ? arabicSource("common.annual") : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Toggle
                      on={lt.is_active}
                      onClick={async () => {
                        try {
                          await odooData.updateLeaveType(lt.id, { is_active: !lt.is_active });
                          await refetchLeaveTypes();
                        } catch (e: any) {
                          setToastMessage(e?.message || "Failed to update leave type");
                          setTimeout(() => setToastMessage(null), 2500);
                        }
                      }}
                    />
                    <button
                      onClick={async () => {
                        try {
                          await odooData.deleteLeaveType(lt.id);
                          await refetchLeaveTypes();
                        } catch (e: any) {
                          setToastMessage(e?.message || "Failed to delete leave type");
                          setTimeout(() => setToastMessage(null), 2500);
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
                <h3 className="text-foreground">{arabicSource("settings.types_of_contracts")}</h3>
                <p className="text-muted-foreground text-xs mt-0.5">{arabicSource("settings.managing_employment_contract_types_and_settings")}</p>
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
                  placeholder={arabicSource("settings.species_name_arabic")}
                  value={newContractType.name_ar}
                  onChange={e => setNewContractType(p => ({ ...p, name_ar: e.target.value }))}
                  className="p-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
                />
                <input
                  placeholder={arabicSource("settings.name_english")}
                  value={newContractType.name_en}
                  onChange={e => setNewContractType(p => ({ ...p, name_en: e.target.value }))}
                  className="p-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input
                  placeholder={arabicSource("common.code")}
                  value={newContractType.code}
                  onChange={e => setNewContractType(p => ({ ...p, code: e.target.value }))}
                  className="p-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
                />
                <input
                  type="number"
                  placeholder={arabicSource("settings.duration_months")}
                  value={newContractType.default_duration_months}
                  onChange={e => setNewContractType(p => ({ ...p, default_duration_months: +e.target.value }))}
                  className="p-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
                />
                <input
                  type="number"
                  placeholder={arabicSource("settings.trial_period_days")}
                  value={newContractType.probation_days}
                  onChange={e => setNewContractType(p => ({ ...p, probation_days: +e.target.value }))}
                  className="p-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder={arabicSource("settings.notice_period_days")}
                  value={newContractType.notice_period_days}
                  onChange={e => setNewContractType(p => ({ ...p, notice_period_days: +e.target.value }))}
                  className="p-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
                />
                <input
                  placeholder={arabicSource("common.description")}
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
                  {arabicSource("settings.renewable_2")}
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
                  await odooData.createContractType(ctPayload);
                  showToast(arabicSource("settings.contract_type_added"));
                  setShowNewContractTypeForm(false);
                  setNewContractType({ name_ar: "", name_en: "", code: "", description: "", default_duration_months: 12, is_renewable: true, probation_days: 90, notice_period_days: 30, sort_order: 0 });
                  refetchContractTypes();
                }}
                className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer"
              >
                {arabicSource("settings.add_a_contract_type")}
              </button>
            </div>
          )}

          {contractTypesLoading ? (
            <p className="text-muted-foreground text-sm text-center py-4">{arabicSource("common.loading")}</p>
          ) : (
            <div className="space-y-2">
              {contractTypes.map(ct => (
                <div key={ct.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-primary/10 text-primary">{ct.code}</span>
                    <div>
                      <p className="text-sm text-foreground">{ct.name_ar}</p>
                      <p className="text-xs text-muted-foreground">
                        {ct.default_duration_months ? `${ct.default_duration_months} ${arabicSource("settings.month")}` : arabicSource("common.not_specified")} {arabicSource("settings.experiment")} {ct.probation_days} {arabicSource("settings.day_notice")} {ct.notice_period_days} {arabicSource("common.days_2")}
                        {ct.is_renewable && " " + arabicSource("settings.renewable")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Toggle
                      on={ct.is_active}
                      onClick={async () => {
                        await odooData.updateContractType(ct.id, { is_active: !ct.is_active });
                        refetchContractTypes();
                      }}
                    />
                    <button
                      onClick={async () => {
                        if (!localizedConfirm(arabicSource("settings.delete_contract_type"))) return;
                        await odooData.deleteContractType(ct.id);
                        showToast(arabicSource("settings.contract_type_deleted"));
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
                <h3 className="text-foreground">{arabicSource("settings.types_of_documents")}</h3>
                <p className="text-muted-foreground text-xs mt-0.5">{arabicSource("settings.manage_the_types_of_documents_and_documents_required")}</p>
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
                  placeholder={arabicSource("settings.document_name_arabic")}
                  value={newDocType.name_ar}
                  onChange={e => setNewDocType(p => ({ ...p, name_ar: e.target.value }))}
                  className="p-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
                />
                <input
                  placeholder={arabicSource("settings.name_english")}
                  value={newDocType.name_en}
                  onChange={e => setNewDocType(p => ({ ...p, name_en: e.target.value }))}
                  className="p-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder={arabicSource("common.code")}
                  value={newDocType.code}
                  onChange={e => setNewDocType(p => ({ ...p, code: e.target.value }))}
                  className="p-2 rounded-lg bg-input border border-border/50 text-foreground text-sm"
                />
                <input
                  type="number"
                  placeholder={arabicSource("settings.alert_days_before_expiry")}
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
                  {arabicSource("settings.has_an_expiration_date")}
                </label>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={newDocType.is_required}
                    onChange={e => setNewDocType(p => ({ ...p, is_required: e.target.checked }))}
                    className="accent-primary"
                  />
                  {arabicSource("settings.mandatory_required")}
                </label>
              </div>
              <button
                onClick={async () => {
                  try {
                    await odooData.createDocumentType({
                      name: newDocType.name_ar || newDocType.name_en,
                      code: newDocType.code,
                      sequence: newDocType.sort_order || 10,
                      active: true,
                    });
                    setShowNewDocTypeForm(false);
                    await refetchDocumentTypes();
                    showToast("Saved");
                  } catch (e: any) {
                    showToast(e?.message || "Failed to create document type");
                  }
                }}
                className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer"
              >
                {arabicSource("settings.add_document_type")}
              </button>
            </div>
          )}

          {documentTypesLoading ? (
            <p className="text-muted-foreground text-sm text-center py-4">{arabicSource("common.loading")}</p>
          ) : (
            <div className="space-y-2">
              {documentTypes.map(dt => (
                <div key={dt.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-primary/10 text-primary">{dt.code}</span>
                    <div>
                      <p className="text-sm text-foreground">{dt.name_ar}</p>
                      <p className="text-xs text-muted-foreground">
                        {dt.has_expiry ? `${arabicSource("settings.warning_before")} ${dt.expiry_warning_days} ${arabicSource("common.days_2")}` : arabicSource("settings.without_ending")}
                        {dt.is_required && " " + arabicSource("settings.mandatory")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Toggle
                      on={dt.is_active}
                      onClick={async () => {
                        try {
                          await odooData.updateDocumentType(dt.id, { active: !dt.is_active });
                          await refetchDocumentTypes();
                        } catch (e: any) {
                          showToast(e?.message || "Failed to update document type");
                        }
                      }}
                    />
                    <button
                      onClick={async () => {
                        try {
                          await odooData.deleteDocumentType(dt.id);
                          await refetchDocumentTypes();
                        } catch (e: any) {
                          showToast(e?.message || "Failed to delete document type");
                        }
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
            <h3 className="text-foreground">{arabicSource("settings.personal_account")}</h3>
          </div>
          <div className="space-y-4">
            {[
              { label: arabicSource("settings.full_name"), value: arabicSource("common.human_resources_manager") },
              { label: arabicSource("common.email"), value: "hr@company.iq" },
              { label: arabicSource("common.phone_number"), value: "07701234567" },
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
            <h3 className="text-foreground">{arabicSource("common.notices")}</h3>
          </div>
          <div className="space-y-4">
            {[
              { label: arabicSource("settings.leave_request_notices"), key: "leave" as const },
              { label: arabicSource("settings.late_attendance_notices"), key: "lateAttendance" as const },
              { label: arabicSource("settings.notifications_of_new_alarms"), key: "warnings" as const },
              { label: arabicSource("settings.assessments_notices"), key: "evaluations" as const },
              { label: arabicSource("settings.recruitment_notices"), key: "recruitment" as const },
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
            <h3 className="text-foreground">{arabicSource("settings.security")}</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
              <span className="text-foreground" style={{ fontSize: 13 }}>
                {arabicSource("settings.change_password")}
              </span>
              <button
                className="px-3 py-1 rounded-md border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                style={{ fontSize: 12 }}
              >
                {arabicSource("common.edit")}
              </button>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
              <span className="text-foreground" style={{ fontSize: 13 }}>
                {arabicSource("settings.two_factor_authentication")}
              </span>
              <Toggle on={twoFactor} onClick={() => setTwoFactor(!twoFactor)} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
              <span className="text-foreground" style={{ fontSize: 13 }}>
                {arabicSource("settings.log_in")}
              </span>
              <button
                className="px-3 py-1 rounded-md border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                style={{ fontSize: 12 }}
              >
                {arabicSource("common.width")}
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
            <h3 className="text-foreground">{arabicSource("common.system")}</h3>
          </div>
          <div className="space-y-4">
            {/* Language */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
              <span className="text-foreground" style={{ fontSize: 13 }}>
                {arabicSource("settings.language")}
              </span>
              <span className="text-muted-foreground" style={{ fontSize: 13 }}>
                {arabicSource("settings.arabic")}
              </span>
            </div>
            {/* Timezone */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
              <span className="text-foreground" style={{ fontSize: 13 }}>
                {arabicSource("settings.time_zone")}
              </span>
              <span className="text-muted-foreground" style={{ fontSize: 13 }}>
                {arabicSource("settings.baghdad_gmt_3")}
              </span>
            </div>

            {/* ── Month Format Selector ── */}
            <div className="p-3 rounded-lg bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-foreground flex items-center gap-2" style={{ fontSize: 13 }}>
                  <Calendar className="w-4 h-4 text-primary" />
                  {arabicSource("settings.month_display_format")}
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
