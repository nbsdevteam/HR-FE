import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Clock, Users, AlertTriangle, CheckCircle, XCircle, Calendar,
  TrendingUp, Loader2, Fingerprint, ScanFace, CreditCard, Smartphone,
  Timer, UserCheck, UserX, Coffee, Search, ArrowUpDown, X, ChevronLeft,
  ChevronRight, ChevronDown, ChevronUp, CalendarDays, BarChart3, Eye, TrendingDown, Award, ShieldCheck
} from "lucide-react";
import { CustomGroupedBarChart } from "../components/custom-grouped-bar-chart";
import { ViewToggle } from "../components/ViewToggle";
import { SortableHeaderRow, toggleSort } from "../components/SortableHeader";
import { supabase } from "../lib/supabase";
import { useEmployees, empDisplayName, formatTime, formatWorkHours, mapAttendanceStatus, useShifts, resolveEmployeeShift, shiftToSchedule, useHierarchyData } from "../lib/hooks";
import type { DbAttendanceRecord, DbEmployee } from "../lib/hooks";
import type { EmployeeSchedule } from "../lib/payslip-engine";

interface AttendanceRow {
  id: string;
  employeeId: string;
  employee: string;
  department: string;
  deviceNo: string;
  date: string;
  checkIn: string;
  checkOut: string;
  rawCheckIn: string | null;
  rawCheckOut: string | null;
  status: "حاضر" | "متأخر" | "غائب" | "إجازة";
  rawStatus: string;
  workHours: string;
  workHoursNum: number;
  source: "device" | "manual" | "system" | null;
  verifyMode: string | null;
  lateMinutes: number;
  autoCheckout: boolean;
  overtimeHours: number;
  breakMinutes: number;
  deptColor: string | null;
  excusedLate: boolean;
  excusedAbsence: boolean;
  excusedShortfall: boolean;
  excuseNote: string | null;
}

/** Live elapsed-time component — updates every 60s */
function ElapsedTime({ checkIn }: { checkIn: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const parts = checkIn.split(":");
  const checkInMinutes = parseInt(parts[0], 10) * 60 + parseInt(parts[1] || "0", 10);
  // Get current Iraq time using Intl (handles DST correctly)
  const iraqTimeStr = new Date(now).toLocaleTimeString("en-GB", { timeZone: "Asia/Baghdad", hour12: false });
  const iraqParts = iraqTimeStr.split(":");
  const nowMinutes = parseInt(iraqParts[0], 10) * 60 + parseInt(iraqParts[1], 10);
  const elapsed = Math.max(0, nowMinutes - checkInMinutes);
  const hrs = Math.floor(elapsed / 60);
  const mins = elapsed % 60;
  const label = hrs > 0 ? `${hrs}:${String(mins).padStart(2, "0")}` : `${mins}د`;

  return (
    <div className="flex items-center justify-center gap-1" dir="ltr">
      <span className="text-emerald-500 font-mono animate-pulse" style={{ fontSize: 13 }}>{label}</span>
      <TrendingUp className="w-3 h-3 text-emerald-400" />
    </div>
  );
}

const attendanceSeries = [
  { key: "present", label: "حاضر", color: "#22C55E" },
  { key: "late", label: "متأخر", color: "#D4AF37" },
  { key: "absent", label: "غائب", color: "#DC2626" },
  { key: "leave", label: "إجازة", color: "#3B82F6" },
];

const statusColors: Record<string, string> = {
  "حاضر": "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  "متأخر": "bg-primary/10 border-primary/20 text-primary",
  "غائب": "bg-destructive/10 border-destructive/20 text-destructive",
  "إجازة": "bg-blue-500/10 border-blue-500/20 text-blue-400",
};

const statusDotColors: Record<string, string> = {
  "حاضر": "bg-emerald-400",
  "متأخر": "bg-primary",
  "غائب": "bg-destructive",
  "إجازة": "bg-blue-400",
};

const dayNames: Record<string, string> = {
  sunday: "الأحد", monday: "الاثنين", tuesday: "الثلاثاء",
  wednesday: "الأربعاء", thursday: "الخميس", friday: "الجمعة", saturday: "السبت",
};

export function Attendance() {
  const { employees } = useEmployees();
  const { shifts: dbShifts } = useShifts();
  const { departments: dbDepartments } = useHierarchyData();
  const [rawRecords, setRawRecords] = useState<DbAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("الكل");
  const [sortBy, setSortBy] = useState<"name" | "deviceNo" | "department" | "checkIn" | "checkOut" | "hours" | "status">("checkIn");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [chartExpanded, setChartExpanded] = useState(false);
  const [excuseModal, setExcuseModal] = useState<{record: AttendanceRow} | null>(null);
  const [excuseForm, setExcuseForm] = useState({late: false, absence: false, shortfall: false, note: ""});
  const [excuseSaving, setExcuseSaving] = useState(false);

  // Fetch attendance records — server-side date filter (last 30 days by default)
  useEffect(() => {
    async function fetch() {
      setLoading(true);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      const { data } = await supabase
        .from("attendance_records")
        .select("*")
        .gte("date", thirtyDaysAgo)
        .order("date", { ascending: false });
      const records = data || [];
      setRawRecords(records);
      if (records.length > 0 && !selectedDate) {
        const dates = [...new Set(records.map(r => r.date))].sort().reverse();
        setSelectedDate(dates[0]);
      }
      setLoading(false);
    }
    fetch();
  }, []);

  const handleSaveExcuse = async () => {
    if (!excuseModal) return;
    setExcuseSaving(true);
    try {
      const { error } = await supabase
        .from("attendance_records")
        .update({
          excused_late: excuseForm.late,
          excused_absence: excuseForm.absence,
          excused_shortfall: excuseForm.shortfall,
          excuse_note: excuseForm.note || null,
          excused_by: "nooralnibras9@gmail.com",
          excused_at: new Date().toISOString(),
        })
        .eq("id", excuseModal.record.id);
      if (error) throw error;
      setRawRecords(prev => prev.map(r => r.id === excuseModal.record.id ? {
        ...r,
        excused_late: excuseForm.late,
        excused_absence: excuseForm.absence,
        excused_shortfall: excuseForm.shortfall,
        excuse_note: excuseForm.note || null,
      } : r));
      setExcuseModal(null);
    } catch (err) {
      alert("خطأ في حفظ الإعذار");
    }
    setExcuseSaving(false);
  };

  // Build employee ID → info map (including device_employee_no)
  // Department color map
  const deptColorMap = useMemo(() => {
    const m: Record<string, string> = {};
    dbDepartments.forEach((d: any) => { if (d.color) m[d.name] = d.color; });
    return m;
  }, [dbDepartments]);

  const empMap = useMemo(() => {
    const m: Record<string, { name: string; dept: string; deviceNo: string; photo: string | null; position: string | null; deptColor: string | null }> = {};
    employees.forEach((e: DbEmployee) => {
      m[e.id] = {
        name: empDisplayName(e),
        dept: e.department || "—",
        deviceNo: e.device_employee_no || "—",
        photo: e.profile_picture || null,
        position: e.position || null,
        deptColor: deptColorMap[e.department] || null,
      };
    });
    return m;
  }, [employees, deptColorMap]);

  // Filter records for selected date and map to UI rows
  const attendanceRows: AttendanceRow[] = useMemo(() => {
    const rows = rawRecords
      .filter(r => r.date === selectedDate)
      .map(r => {
        const emp = empMap[r.employee_id] || { name: r.employee_id.substring(0, 12), dept: "—", deviceNo: "—", photo: null, position: null };
        return {
          id: r.id,
          employeeId: r.employee_id,
          employee: emp.name,
          department: emp.dept,
          deviceNo: r.device_employee_no || emp.deviceNo,
          date: r.date,
          checkIn: formatTime(r.check_in_time),
          checkOut: formatTime(r.check_out_time),
          rawCheckIn: r.check_in_time,
          rawCheckOut: r.check_out_time,
          status: mapAttendanceStatus(r.status, r.is_late),
          rawStatus: r.status,
          workHours: formatWorkHours(r.working_hours || 0),
          workHoursNum: r.working_hours || 0,
          source: r.source || null,
          verifyMode: r.verify_mode || null,
          lateMinutes: r.late_minutes || 0,
          autoCheckout: r.auto_checkout_applied || false,
          overtimeHours: r.overtime_hours || 0,
          breakMinutes: (r as any).total_break_minutes || 0,
          deptColor: emp.deptColor || null,
          excusedLate: r.excused_late || false,
          excusedAbsence: r.excused_absence || false,
          excusedShortfall: r.excused_shortfall || false,
          excuseNote: r.excuse_note || null,
        };
      });

    // Apply search filter
    let filtered = rows;
    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.employee.includes(searchTerm) || r.deviceNo.includes(searchTerm) || r.department.includes(searchTerm)
      );
    }
    if (statusFilter !== "الكل") {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Sort
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortBy === "name") filtered.sort((a, b) => dir * a.employee.localeCompare(b.employee, "ar"));
    else if (sortBy === "deviceNo") filtered.sort((a, b) => dir * (parseInt(a.deviceNo || "0") - parseInt(b.deviceNo || "0")));
    else if (sortBy === "department") filtered.sort((a, b) => dir * a.department.localeCompare(b.department, "ar"));
    else if (sortBy === "checkIn") filtered.sort((a, b) => dir * (a.rawCheckIn || "99:99").localeCompare(b.rawCheckIn || "99:99"));
    else if (sortBy === "checkOut") filtered.sort((a, b) => dir * (a.rawCheckOut || "99:99").localeCompare(b.rawCheckOut || "99:99"));
    else if (sortBy === "hours") filtered.sort((a, b) => dir * (a.workHoursNum - b.workHoursNum));
    else if (sortBy === "status") filtered.sort((a, b) => dir * a.status.localeCompare(b.status, "ar"));

    return filtered;
  }, [rawRecords, selectedDate, empMap, searchTerm, statusFilter, sortBy, sortDir]);

  // Stats
  const allDayRows = useMemo(() =>
    rawRecords.filter(r => r.date === selectedDate).map(r => mapAttendanceStatus(r.status, r.is_late)),
  [rawRecords, selectedDate]);

  const todayStats = {
    present: allDayRows.filter(s => s === "حاضر").length,
    late: allDayRows.filter(s => s === "متأخر").length,
    absent: allDayRows.filter(s => s === "غائب").length,
    leave: allDayRows.filter(s => s === "إجازة").length,
    total: allDayRows.length,
    avgHours: (() => {
      const recs = rawRecords.filter(r => r.date === selectedDate && r.working_hours > 0);
      if (recs.length === 0) return "0";
      return (recs.reduce((s, r) => s + r.working_hours, 0) / recs.length).toFixed(1);
    })(),
    autoCheckouts: rawRecords.filter(r => r.date === selectedDate && r.auto_checkout_applied).length,
  };

  // Helper: verify mode icon
  function verifyModeLabel(mode: string | null): string {
    if (!mode) return "جهاز";
    const m = mode.toLowerCase().trim();
    // Multi-mode combos first
    if (m.includes("fpandcardandpw") || (m.includes("fp") && m.includes("card"))) return "بصمة+بطاقة";
    if (m.includes("cardandpw") || (m.includes("card") && m.includes("pw"))) return "بطاقة+رمز";
    if (m.includes("faceandcard")) return "وجه+بطاقة";
    // Single modes
    if (m.includes("fp") || m.includes("finger")) return "بصمة";
    if (m.includes("face")) return "وجه";
    if (m.includes("card")) return "بطاقة";
    if (m.includes("iris")) return "قزحية";
    if (m.includes("pw") || m.includes("password")) return "رمز";
    return "جهاز";
  }

  function VerifyIcon({ mode }: { mode: string | null }) {
    if (!mode) return null;
    const m = mode.toLowerCase();
    if (m.includes("وجه") || m.includes("face")) return <ScanFace className="w-3.5 h-3.5 text-blue-400" />;
    if (m.includes("بصمة") || m.includes("finger") || m.includes("fp")) return <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />;
    if (m.includes("بطاقة") || m.includes("card")) return <CreditCard className="w-3.5 h-3.5 text-amber-400" />;
    return <Smartphone className="w-3.5 h-3.5 text-muted-foreground" />;
  }

  // Status detail label (Arabic)
  function statusDetail(row: AttendanceRow): string | null {
    if (row.rawStatus === "auto_checkout") return "خروج تلقائي";
    if (row.rawStatus === "missing_checkin") return "بدون دخول";
    if (row.rawStatus === "checked_in") return "لم يسجل خروج";
    if (row.rawStatus === "missing_checkout") return "بدون خروج";
    return null;
  }

  // Weekly chart
  const weeklyAttendance = useMemo(() => {
    const dayMap: Record<string, { present: number; late: number; absent: number; leave: number }> = {};
    const orderedDays = ["sunday", "monday", "tuesday", "wednesday", "thursday"];
    orderedDays.forEach(d => { dayMap[d] = { present: 0, late: 0, absent: 0, leave: 0 }; });
    rawRecords.forEach(r => {
      const d = r.day_of_week?.toLowerCase();
      if (!dayMap[d]) return;
      const st = mapAttendanceStatus(r.status, r.is_late);
      if (st === "حاضر") dayMap[d].present++;
      else if (st === "متأخر") dayMap[d].late++;
      else if (st === "غائب") dayMap[d].absent++;
      else if (st === "إجازة") dayMap[d].leave++;
    });
    return orderedDays.map(d => ({ day: dayNames[d] || d, ...dayMap[d] })).reverse();
  }, [rawRecords]);

  // Available dates
  const availableDates = useMemo(() => {
    return [...new Set(rawRecords.map(r => r.date))].sort().reverse();
  }, [rawRecords]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="text-muted-foreground ms-3">جاري تحميل سجلات الحضور...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gradient-gold">الحضور والانصراف</h1>
          <p className="text-muted-foreground mt-1">متابعة حضور وانصراف الموظفين — بيانات حية</p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle view={viewMode} onChange={setViewMode} />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-11 px-4 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none"
            dir="ltr"
          />
        </div>
      </div>

      {/* Stats Cards — 5 columns */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "حاضرون", value: todayStats.present, icon: CheckCircle, color: "text-emerald-400", accent: "from-emerald-500/10" },
          { label: "متأخرون", value: todayStats.late, icon: Clock, color: "text-primary", accent: "from-primary/10" },
          { label: "غائبون", value: todayStats.absent, icon: XCircle, color: "text-destructive", accent: "from-destructive/10" },
          { label: "إجازة", value: todayStats.leave, icon: Calendar, color: "text-blue-400", accent: "from-blue-500/10" },
          { label: "متوسط الساعات", value: todayStats.avgHours, icon: Timer, color: "text-amber-400", accent: "from-amber-500/10", suffix: "ساعة" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.15)" }}
              className="relative bg-card backdrop-blur-sm border border-border rounded-xl p-4 shadow-lg overflow-hidden hover:border-primary/30 transition-colors"
            >
              <div className={`absolute top-0 end-0 w-28 h-28 bg-gradient-to-bl ${stat.accent} to-transparent rounded-bl-full`} />
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <p className="text-muted-foreground" style={{ fontSize: 12 }}>{stat.label}</p>
                  <div className="flex items-baseline gap-1.5 mt-1.5">
                    <span className="text-gradient-gold" style={{ fontSize: 26 }}>{stat.value}</span>
                    {stat.suffix && <span className="text-muted-foreground" style={{ fontSize: 11 }}>{stat.suffix}</span>}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Icon className={`w-4.5 h-4.5 ${stat.color}`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Source indicators row */}
      <div className="flex items-center gap-4 px-1 flex-wrap">
        {todayStats.total > 0 && (
          <div className="flex items-center gap-1.5">
            <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-muted-foreground" style={{ fontSize: 11 }}>جهاز البصمة: {rawRecords.filter(r => r.date === selectedDate && r.source === "device").length} سجل</span>
          </div>
        )}
        {todayStats.autoCheckouts > 0 && (
          <div className="flex items-center gap-1.5">
            <Timer className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-400/80" style={{ fontSize: 11 }}>خروج تلقائي: {todayStats.autoCheckouts}</span>
          </div>
        )}
      </div>

      {/* Weekly Chart — collapsible */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card/30 backdrop-blur-md border border-border/40 rounded-xl shadow-lg overflow-hidden"
      >
        <button
          onClick={() => setChartExpanded(!chartExpanded)}
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-muted/10 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-foreground" style={{ fontSize: 15 }}>الحضور الأسبوعي</h3>
          </div>
          {chartExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        <AnimatePresence>
          {chartExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="px-5 pb-5"
            >
              <CustomGroupedBarChart data={weeklyAttendance} categoryKey="day" series={attendanceSeries} height={180} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Search & Filters Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground" />
          <input
            type="text"
            placeholder="بحث بالاسم، رقم البصمة، أو القسم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 ps-10 pe-4 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none"
            style={{ fontSize: 13 }}
          />
        </div>
        <div className="flex items-center gap-1.5">
          {["الكل", "حاضر", "متأخر", "غائب", "إجازة"].map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                statusFilter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
              style={{ fontSize: 12 }}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 border-s border-border/30 ps-3">
          <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
          {([
            { key: "checkIn" as const, label: "الوقت" },
            { key: "name" as const, label: "الاسم" },
            { key: "hours" as const, label: "الساعات" },
          ]).map(s => (
            <button
              key={s.key}
              onClick={() => setSortBy(s.key)}
              className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                sortBy === s.key ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
              style={{ fontSize: 11 }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="px-1">
        <span className="text-muted-foreground" style={{ fontSize: 12 }}>
          {attendanceRows.length} سجل {statusFilter !== "الكل" ? `(${statusFilter})` : ""} {searchTerm ? `— بحث: "${searchTerm}"` : ""}
        </span>
      </div>

      {/* Employee Attendance Detail Modal */}
      <AnimatePresence>
        {selectedEmployeeId && (
          <EmployeeAttendanceDetail
            employeeId={selectedEmployeeId}
            employees={employees}
            empMap={empMap}
            dbShifts={dbShifts}
            dbDepartments={dbDepartments}
            onClose={() => setSelectedEmployeeId(null)}
          />
        )}
      </AnimatePresence>

      {/* Attendance Table / Kanban */}
      {viewMode === "list" ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card/30 backdrop-blur-md border border-border/40 rounded-xl overflow-hidden shadow-lg"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <SortableHeaderRow
                  columns={[
                    { label: "الموظف", key: "name" },
                    { label: "رقم البصمة", key: "deviceNo", center: true },
                    { label: "القسم", key: "department" },
                    { label: "الحضور", key: "checkIn", center: true },
                    { label: "الانصراف", key: "checkOut", center: true },
                    { label: "ساعات العمل", key: "hours", center: true },
                    { label: "المصدر", key: null },
                    { label: "الحالة", key: "status" },
                  ]}
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={(key) => toggleSort(key, sortBy, sortDir, setSortBy, setSortDir)}
                />
              </thead>
              <tbody>
                {attendanceRows.length > 0 ? attendanceRows.map((record, i) => (
                  <motion.tr
                    key={record.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-border/20 hover:bg-muted/10 transition-colors group cursor-pointer"
                    onClick={() => setSelectedEmployeeId(record.employeeId)}
                  >
                    {/* Employee Name with avatar */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-1.5 h-8 rounded-full ${statusDotColors[record.status] || "bg-muted"}`} />
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${!record.deptColor ? "bg-primary/15 border-primary/25" : ""}`}
                          style={record.deptColor ? {
                            backgroundColor: `${record.deptColor}20`,
                            borderColor: `${record.deptColor}40`,
                          } : undefined}
                        >
                          <span style={{ fontSize: 12, color: record.deptColor || undefined }} className={!record.deptColor ? "text-primary" : ""}>{record.employee.charAt(0)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-foreground truncate" style={{ fontSize: 13 }}>{record.employee}</p>
                        </div>
                      </div>
                    </td>

                    {/* Device number */}
                    <td className="px-4 py-3 text-center">
                      {record.deviceNo && record.deviceNo !== "—" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted/30 border border-border/30 font-mono text-foreground" style={{ fontSize: 12 }}>
                          <Fingerprint className="w-3 h-3 text-primary/60" />
                          #{record.deviceNo}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40" style={{ fontSize: 11 }}>—</span>
                      )}
                    </td>

                    {/* Department */}
                    <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }}>{record.department}</td>

                    {/* Check-in */}
                    <td className="px-4 py-3 text-center">
                      {record.rawCheckIn ? (
                        <span className="text-emerald-500 font-mono" style={{ fontSize: 13 }} dir="ltr">{record.checkIn}</span>
                      ) : (
                        <span className="text-muted-foreground/40" style={{ fontSize: 12 }}>—</span>
                      )}
                    </td>

                    {/* Check-out */}
                    <td className="px-4 py-3 text-center">
                      {record.rawCheckOut ? (
                        <div className="flex items-center justify-center gap-1">
                          <span className={`font-mono ${record.autoCheckout ? "text-amber-500" : "text-blue-500"}`} style={{ fontSize: 13 }} dir="ltr">{record.checkOut}</span>
                          {record.autoCheckout && <Timer className="w-3 h-3 text-amber-400/60" />}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/40" style={{ fontSize: 12 }}>—</span>
                      )}
                    </td>

                    {/* Working hours */}
                    <td className="px-4 py-3 text-center">
                      <div
                        className="cursor-pointer hover:bg-primary/5 rounded-lg py-1 px-2 -mx-2 transition-colors group"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExcuseForm({
                            late: record.excusedLate,
                            absence: record.excusedAbsence,
                            shortfall: record.excusedShortfall,
                            note: record.excuseNote || "",
                          });
                          setExcuseModal({ record });
                        }}
                      >
                        {record.workHoursNum > 0 ? (
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1">
                              <span className="text-foreground font-mono" style={{ fontSize: 13 }}>{record.workHours}</span>
                              {(record.excusedLate || record.excusedAbsence || record.excusedShortfall) && (
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              )}
                            </div>
                            {record.overtimeHours > 0 && (
                              <span className="text-primary/70" style={{ fontSize: 9 }}>+{record.overtimeHours.toFixed(1)} إضافي</span>
                            )}
                          </div>
                        ) : record.rawCheckIn && !record.rawCheckOut ? (
                          <ElapsedTime checkIn={record.rawCheckIn} />
                        ) : (
                          <span className="text-muted-foreground/40" style={{ fontSize: 12 }}>0.00</span>
                        )}
                      </div>
                    </td>

                    {/* Source/verify mode */}
                    <td className="px-4 py-3">
                      {record.source === "device" ? (
                        <div className="flex items-center gap-1.5">
                          <VerifyIcon mode={record.verifyMode} />
                          <span className="text-muted-foreground" style={{ fontSize: 11 }}>{verifyModeLabel(record.verifyMode)}</span>
                        </div>
                      ) : record.source === "system" ? (
                        <span className="text-muted-foreground/60" style={{ fontSize: 11 }}>نظام</span>
                      ) : (
                        <span className="text-muted-foreground/60" style={{ fontSize: 11 }}>يدوي</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-md border ${statusColors[record.status]}`} style={{ fontSize: 12 }}>
                            {record.status}
                          </span>
                          {record.lateMinutes > 0 && (
                            <span className="text-primary/70" style={{ fontSize: 10 }}>({record.lateMinutes} د)</span>
                          )}
                        </div>
                        {statusDetail(record) && (
                          <span className="text-muted-foreground/50" style={{ fontSize: 9 }}>{statusDetail(record)}</span>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                )) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                      لا توجد سجلات حضور لهذا التاريخ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : (
        /* Kanban View — empty columns collapse to slim strips */
        (() => {
          const kanbanCols = [
            { key: "حاضر" as const, label: "حاضر", accent: "border-emerald-500/40", dotColor: "bg-emerald-500", textColor: "text-emerald-500", icon: UserCheck },
            { key: "متأخر" as const, label: "متأخر", accent: "border-primary/40", dotColor: "bg-primary", textColor: "text-primary", icon: Clock },
            { key: "غائب" as const, label: "غائب", accent: "border-destructive/40", dotColor: "bg-destructive", textColor: "text-destructive", icon: UserX },
            { key: "إجازة" as const, label: "إجازة", accent: "border-blue-500/40", dotColor: "bg-blue-500", textColor: "text-blue-500", icon: Calendar },
          ];
          const colCounts = kanbanCols.map(c => attendanceRows.filter(a => a.status === c.key).length);
          const filledCount = colCounts.filter(n => n > 0).length;

          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="flex gap-3"
            >
              {kanbanCols.map((col, ci) => {
                const items = attendanceRows.filter(a => a.status === col.key);
                const ColIcon = col.icon;
                const isEmpty = items.length === 0;

                /* ── Empty column → slim collapsed strip ── */
                if (isEmpty) {
                  return (
                    <motion.div
                      key={col.key}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: ci * 0.08 }}
                      className={`bg-card/10 backdrop-blur-md border ${col.accent} rounded-xl overflow-hidden flex flex-col items-center py-5 px-2 gap-3`}
                      style={{ minWidth: 56, maxWidth: 64 }}
                    >
                      <ColIcon className={`w-4 h-4 ${col.textColor} opacity-40`} />
                      <span className="text-muted-foreground/40 font-medium" style={{ fontSize: 11, writingMode: "vertical-rl" }}>{col.label}</span>
                      <span className="px-2 py-0.5 rounded-full bg-muted/20 text-muted-foreground/40 font-mono" style={{ fontSize: 11 }}>0</span>
                    </motion.div>
                  );
                }

                /* ── Filled column → full width card list ── */
                return (
                  <motion.div
                    key={col.key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: ci * 0.08 }}
                    className={`bg-card/20 backdrop-blur-md border ${col.accent} rounded-xl shadow-lg overflow-hidden flex-1`}
                    style={{ minWidth: 0 }}
                  >
                    <div className="p-4 border-b border-border/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ColIcon className={`w-4 h-4 ${col.textColor}`} />
                        <span className="text-foreground" style={{ fontSize: 14 }}>{col.label}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-muted/30 text-muted-foreground font-mono" style={{ fontSize: 12 }}>
                        {items.length}
                      </span>
                    </div>
                    <div className="p-3 space-y-2.5 max-h-[500px] overflow-y-auto">
                      {items.map((record, i) => (
                        <motion.div
                          key={record.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.04 }}
                          className="bg-card/60 border border-border/30 rounded-lg p-3 shadow-sm hover:border-border/50 transition-colors cursor-pointer"
                          onClick={() => setSelectedEmployeeId(record.employeeId)}
                        >
                          <div className="flex items-center gap-2.5 mb-2">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${!record.deptColor ? "bg-primary/15 border-primary/25" : ""}`}
                              style={record.deptColor ? {
                                backgroundColor: `${record.deptColor}20`,
                                borderColor: `${record.deptColor}40`,
                              } : undefined}
                            >
                              <span style={{ fontSize: 11, color: record.deptColor || undefined }} className={!record.deptColor ? "text-primary" : ""}>{record.employee.charAt(0)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-foreground truncate" style={{ fontSize: 13 }}>{record.employee}</p>
                              <div className="flex items-center gap-2">
                                <p className="text-muted-foreground" style={{ fontSize: 10 }}>{record.department}</p>
                                {record.deviceNo !== "—" && (
                                  <span className="text-muted-foreground/50 font-mono" style={{ fontSize: 9 }}>#{record.deviceNo}</span>
                                )}
                              </div>
                            </div>
                            {record.source === "device" && <VerifyIcon mode={record.verifyMode} />}
                          </div>
                          <div className="flex items-center justify-between text-muted-foreground" style={{ fontSize: 11 }}>
                            <div className="flex items-center gap-1">
                              <span className="text-emerald-400/80" dir="ltr">{record.checkIn}</span>
                              <span className="text-muted-foreground/30">→</span>
                              <span className={record.autoCheckout ? "text-amber-400/80" : "text-blue-400/80"} dir="ltr">{record.checkOut}</span>
                              {record.autoCheckout && <Timer className="w-2.5 h-2.5 text-amber-400/50" />}
                            </div>
                            {record.workHoursNum > 0 ? (
                              <span className="font-mono" dir="ltr">{record.workHours}</span>
                            ) : record.rawCheckIn && !record.rawCheckOut ? (
                              <ElapsedTime checkIn={record.rawCheckIn} />
                            ) : (
                              <span className="font-mono text-muted-foreground/40" dir="ltr">0:00</span>
                            )}
                          </div>
                          {record.lateMinutes > 0 && (
                            <div className="mt-1.5 text-primary/70" style={{ fontSize: 10 }}>
                              تأخر {record.lateMinutes} دقيقة
                            </div>
                          )}
                          {record.overtimeHours > 0 && (
                            <div className="mt-0.5 text-emerald-400/70" style={{ fontSize: 10 }}>
                              إضافي {record.overtimeHours.toFixed(1)} ساعة
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          );
        })()
      )}

      {/* Excuse Modal */}
      <AnimatePresence>
        {excuseModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setExcuseModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-border/30">
                <div>
                  <h3 className="text-foreground" style={{ fontSize: 16 }}>إعذار الموظف</h3>
                  <p className="text-muted-foreground mt-0.5" style={{ fontSize: 12 }}>
                    {excuseModal.record.employee} — {excuseModal.record.date}
                  </p>
                </div>
                <button onClick={() => setExcuseModal(null)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors cursor-pointer">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                {/* Info chips */}
                <div className="flex flex-wrap gap-2" style={{ fontSize: 12 }}>
                  <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                    الحضور: {excuseModal.record.checkIn || "—"}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                    الانصراف: {excuseModal.record.checkOut || "—"}
                  </span>
                  {excuseModal.record.lateMinutes > 0 && (
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      تأخير: {excuseModal.record.lateMinutes} دقيقة
                    </span>
                  )}
                </div>

                {/* Excuse toggles */}
                <div className="space-y-3">
                  {[
                    { key: "late" as const, label: "إعذار التأخير", desc: "لن يُحسب التأخير في الراتب", show: excuseModal.record.lateMinutes > 0 || excuseModal.record.status === "متأخر" },
                    { key: "shortfall" as const, label: "إعذار نقص الساعات", desc: "لن يُخصم نقص ساعات هذا اليوم", show: true },
                    { key: "absence" as const, label: "إعذار الغياب", desc: "لن يُحسب هذا اليوم كغياب", show: excuseModal.record.status === "غائب" || excuseModal.record.rawStatus === "absent" },
                  ].filter(t => t.show).map(toggle => (
                    <label key={toggle.key} className="flex items-center justify-between p-3 rounded-xl border border-border/30 hover:border-primary/30 transition-colors cursor-pointer">
                      <div>
                        <p className="text-foreground" style={{ fontSize: 13 }}>{toggle.label}</p>
                        <p className="text-muted-foreground" style={{ fontSize: 11 }}>{toggle.desc}</p>
                      </div>
                      <div
                        className={`w-11 h-6 rounded-full cursor-pointer transition-colors relative ${excuseForm[toggle.key] ? "bg-emerald-500" : "bg-muted"}`}
                        onClick={() => setExcuseForm(f => ({ ...f, [toggle.key]: !f[toggle.key] }))}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${excuseForm[toggle.key] ? "start-5" : "start-0.5"}`} />
                      </div>
                    </label>
                  ))}
                </div>

                {/* Note */}
                <div>
                  <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>سبب الإعذار</label>
                  <textarea
                    value={excuseForm.note}
                    onChange={(e) => setExcuseForm(f => ({ ...f, note: e.target.value }))}
                    placeholder="أدخل سبب الإعذار..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none resize-none"
                    style={{ fontSize: 13 }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-5 border-t border-border/30 bg-muted/5">
                {excuseModal.record.excuseNote && (
                  <p className="text-muted-foreground" style={{ fontSize: 11 }}>آخر إعذار: {excuseModal.record.excuseNote.substring(0, 40)}</p>
                )}
                <div className="flex items-center gap-2 ms-auto">
                  <button
                    onClick={() => setExcuseModal(null)}
                    className="px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    style={{ fontSize: 13 }}
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleSaveExcuse}
                    disabled={excuseSaving}
                    className="px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                    style={{ fontSize: 13 }}
                  >
                    {excuseSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    حفظ الإعذار
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// Employee Attendance Detail — Calendar + Monthly + Overall
// ══════════════════════════════════════════════════════════════

const cardCls = "bg-card/30 backdrop-blur-md border border-border/40 rounded-xl overflow-hidden shadow-lg";

const DETAIL_TABS = [
  { id: "calendar" as const, label: "التقويم", icon: CalendarDays },
  { id: "monthly" as const, label: "الملخص الشهري", icon: BarChart3 },
  { id: "overall" as const, label: "الملخص الكلي", icon: TrendingUp },
];
type DetailTabId = (typeof DETAIL_TABS)[number]["id"];

function EmployeeAttendanceDetail({
  employeeId,
  employees,
  empMap,
  dbShifts,
  dbDepartments,
  onClose,
}: {
  employeeId: string;
  employees: DbEmployee[];
  empMap: Record<string, { name: string; dept: string; deviceNo: string; photo: string | null; position: string | null }>;
  dbShifts: any[];
  dbDepartments: any[];
  onClose: () => void;
}) {
  const emp = employees.find(e => e.id === employeeId);
  // Resolve the employee's shift → schedule (determines rest days)
  const empShift = emp ? resolveEmployeeShift(emp, dbDepartments, dbShifts) : null;
  const empSchedule: EmployeeSchedule | null = empShift ? shiftToSchedule(empShift) : null;
  const empInfo = empMap[employeeId];
  const [activeTab, setActiveTab] = useState<DetailTabId>("calendar");
  const [allRecords, setAllRecords] = useState<DbAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Current month for calendar navigation
  const now = new Date();
  const [calMonth, setCalMonth] = useState(now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0"));

  // Fetch ALL attendance records for this employee
  useEffect(() => {
    async function fetch() {
      setLoading(true);
      const { data } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("employee_id", employeeId)
        .order("date", { ascending: true });
      setAllRecords(data || []);
      setLoading(false);
    }
    fetch();
  }, [employeeId]);

  // Records for current calendar month
  const monthRecords = useMemo(() => {
    const [y, m] = calMonth.split("-").map(Number);
    const prefix = `${y}-${String(m).padStart(2, "0")}`;
    return allRecords.filter(r => r.date.startsWith(prefix));
  }, [allRecords, calMonth]);

  // Navigate months
  const prevMonth = useCallback(() => {
    const [y, m] = calMonth.split("-").map(Number);
    const d = new Date(y, m - 2, 1);
    setCalMonth(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"));
  }, [calMonth]);

  const nextMonth = useCallback(() => {
    const [y, m] = calMonth.split("-").map(Number);
    const d = new Date(y, m, 1);
    setCalMonth(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"));
  }, [calMonth]);

  // Month display name
  const monthLabel = useMemo(() => {
    const [y, m] = calMonth.split("-").map(Number);
    const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    return `${months[m - 1]} ${y}`;
  }, [calMonth]);

  // Monthly stats
  const monthStats = useMemo(() => {
    const complete = monthRecords.filter(r => r.status === "complete" || r.status === "auto_checkout");
    const totalHours = monthRecords.reduce((s, r) => s + (r.working_hours || 0), 0);
    const overtime = monthRecords.reduce((s, r) => s + (r.overtime_hours || 0), 0);
    const lateCount = monthRecords.filter(r => r.is_late).length;
    const lateMins = monthRecords.reduce((s, r) => s + (r.late_minutes || 0), 0);
    const absentCount = monthRecords.filter(r => r.status === "absent").length;
    const checkedInOnly = monthRecords.filter(r => r.status === "checked_in" || r.status === "missing_checkout").length;
    const avgHours = complete.length > 0 ? totalHours / complete.length : 0;
    return {
      daysWorked: complete.length + checkedInOnly,
      totalHours,
      avgHours,
      overtime,
      lateCount,
      lateMins,
      absentCount,
      checkedInOnly,
      totalRecords: monthRecords.length,
    };
  }, [monthRecords]);

  // Overall stats (all time)
  const overallStats = useMemo(() => {
    const complete = allRecords.filter(r => r.status === "complete" || r.status === "auto_checkout");
    const totalHours = allRecords.reduce((s, r) => s + (r.working_hours || 0), 0);
    const overtime = allRecords.reduce((s, r) => s + (r.overtime_hours || 0), 0);
    const lateCount = allRecords.filter(r => r.is_late).length;
    const lateMins = allRecords.reduce((s, r) => s + (r.late_minutes || 0), 0);
    const absentCount = allRecords.filter(r => r.status === "absent").length;
    const avgHours = complete.length > 0 ? totalHours / complete.length : 0;

    // Unique months
    const months = new Set(allRecords.map(r => r.date.slice(0, 7)));
    // Date range
    const firstDate = allRecords.length > 0 ? allRecords[0].date : "—";
    const lastDate = allRecords.length > 0 ? allRecords[allRecords.length - 1].date : "—";
    // Attendance rate (days with records / total calendar days in range)
    const present = allRecords.filter(r => ["complete", "auto_checkout", "checked_in", "missing_checkout", "missing_checkin"].includes(r.status)).length;

    return {
      daysWorked: complete.length,
      totalHours,
      avgHours,
      overtime,
      lateCount,
      lateMins,
      absentCount,
      totalRecords: allRecords.length,
      monthsCount: months.size,
      firstDate,
      lastDate,
      presentDays: present,
      attendanceRate: allRecords.length > 0 ? Math.round((present / allRecords.length) * 100) : 0,
    };
  }, [allRecords]);

  // Per-month breakdown for overall tab
  const monthlyBreakdown = useMemo(() => {
    const byMonth: Record<string, { month: string; days: number; hours: number; overtime: number; late: number; absent: number }> = {};
    allRecords.forEach(r => {
      const m = r.date.slice(0, 7);
      if (!byMonth[m]) byMonth[m] = { month: m, days: 0, hours: 0, overtime: 0, late: 0, absent: 0 };
      if (["complete", "auto_checkout", "checked_in", "missing_checkout", "missing_checkin"].includes(r.status)) byMonth[m].days++;
      byMonth[m].hours += r.working_hours || 0;
      byMonth[m].overtime += r.overtime_hours || 0;
      if (r.is_late) byMonth[m].late++;
      if (r.status === "absent") byMonth[m].absent++;
    });
    return Object.values(byMonth).sort((a, b) => b.month.localeCompare(a.month));
  }, [allRecords]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 bg-card/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center">
              <span className="text-primary text-lg">{empInfo?.name?.charAt(0) || "?"}</span>
            </div>
            <div>
              <h2 className="text-foreground text-lg">{empInfo?.name || "موظف"}</h2>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-muted-foreground" style={{ fontSize: 12 }}>{empInfo?.dept}</span>
                {empInfo?.deviceNo && empInfo.deviceNo !== "—" && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/30 border border-border/30 font-mono text-muted-foreground" style={{ fontSize: 11 }}>
                    <Fingerprint className="w-3 h-3 text-primary/60" />#{empInfo.deviceNo}
                  </span>
                )}
                {emp?.person_id && (
                  <span className="text-muted-foreground/60" style={{ fontSize: 11 }}>ID: {emp.person_id}</span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-2 bg-card/30 border-b border-border/20">
          {DETAIL_TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
                style={{ fontSize: 13 }}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <span className="text-muted-foreground ms-3">جاري تحميل البيانات...</span>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === "calendar" && (
                <motion.div key="cal" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <AttendanceCalendarView
                    records={monthRecords}
                    calMonth={calMonth}
                    monthLabel={monthLabel}
                    onPrev={prevMonth}
                    onNext={nextMonth}
                    stats={monthStats}
                    schedule={empSchedule}
                  />
                </motion.div>
              )}
              {activeTab === "monthly" && (
                <motion.div key="monthly" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <MonthlySummaryView
                    stats={monthStats}
                    monthLabel={monthLabel}
                    records={monthRecords}
                    calMonth={calMonth}
                    onPrev={prevMonth}
                    onNext={nextMonth}
                  />
                </motion.div>
              )}
              {activeTab === "overall" && (
                <motion.div key="overall" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <OverallSummaryView stats={overallStats} breakdown={monthlyBreakdown} />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ══════════════════════════ Calendar View ══════════════════════════

function AttendanceCalendarView({
  records,
  calMonth,
  monthLabel,
  onPrev,
  onNext,
  stats,
  schedule,
}: {
  records: DbAttendanceRecord[];
  calMonth: string;
  monthLabel: string;
  onPrev: () => void;
  onNext: () => void;
  stats: { daysWorked: number; totalHours: number; avgHours: number; overtime: number; lateCount: number; absentCount: number; checkedInOnly: number };
  schedule: EmployeeSchedule | null;
}) {
  const [y, m] = calMonth.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const firstDayIdx = new Date(y, m - 1, 1).getDay(); // 0=Sun

  const recordMap: Record<string, DbAttendanceRecord> = {};
  records.forEach(r => { recordMap[r.date] = r; });

  const cells: Array<{ date: string; day: number; dayOfWeek: number } | null> = [];
  for (let i = 0; i < firstDayIdx; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dow = new Date(y, m - 1, d).getDay(); // 0=Sun, 5=Fri, 6=Sat
    cells.push({ date: dateStr, day: d, dayOfWeek: dow });
  }

  const dayHeaders = [
    { label: "الأحد", dow: 0 },
    { label: "الاثنين", dow: 1 },
    { label: "الثلاثاء", dow: 2 },
    { label: "الأربعاء", dow: 3 },
    { label: "الخميس", dow: 4 },
    { label: "الجمعة", dow: 5 },
    { label: "السبت", dow: 6 },
  ];

  // Rest days come from the employee's shift schedule — nothing hardcoded
  const dowToDay = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const isRestDay = (dow: number) => {
    if (!schedule) return false; // no shift assigned → treat all days as work days
    const dayKey = dowToDay[dow];
    return !(schedule[dayKey]?.isWorkingDay ?? true);
  };
  // Which day-of-week indices are rest days (for header styling)
  const restDowSet = new Set(dowToDay.map((_, i) => i).filter(i => isRestDay(i)));
  const isFutureDate = (dateStr: string) => dateStr > new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-5">
      {/* Month stats — compact row */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "أيام العمل", value: stats.daysWorked, icon: CalendarDays, color: "text-emerald-400", bg: "from-emerald-500/10" },
          { label: "إجمالي الساعات", value: formatWorkHours(stats.totalHours), icon: Clock, color: "text-blue-400", bg: "from-blue-500/10" },
          { label: "المتوسط/يوم", value: formatWorkHours(stats.avgHours), icon: Timer, color: "text-amber-400", bg: "from-amber-500/10" },
          { label: "الإضافي", value: formatWorkHours(stats.overtime), icon: TrendingUp, color: "text-emerald-400", bg: "from-emerald-500/10" },
          { label: "الغياب", value: stats.absentCount, icon: XCircle, color: "text-destructive", bg: "from-destructive/10" },
        ].map((chip, i) => {
          const Icon = chip.icon;
          return (
            <motion.div
              key={chip.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -3, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.15)" }}
              className="relative bg-card backdrop-blur-sm border border-border rounded-xl p-3 text-center overflow-hidden shadow-lg hover:border-primary/30 transition-colors cursor-default"
            >
              <div className={`absolute top-0 end-0 w-20 h-20 bg-gradient-to-bl ${chip.bg} to-transparent rounded-bl-full`} />
              <Icon className={`w-4 h-4 mx-auto mb-1 ${chip.color} relative z-10`} />
              <div className={`font-mono relative z-10 ${chip.color}`} style={{ fontSize: 18 }}>{chip.value}</div>
              <div className="text-muted-foreground mt-0.5 relative z-10" style={{ fontSize: 10 }}>{chip.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Calendar grid */}
      <div className="bg-card border border-border/30 rounded-xl overflow-hidden shadow-lg">
        {/* Month navigator */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
          <button onClick={onPrev} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer text-muted-foreground hover:text-foreground">
            <ChevronRight className="w-4 h-4" />
            <span style={{ fontSize: 12 }}>السابق</span>
          </button>
          <h3 className="text-foreground flex items-center gap-2 text-lg">
            <CalendarDays className="w-5 h-5 text-primary" />
            {monthLabel}
          </h3>
          <button onClick={onNext} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer text-muted-foreground hover:text-foreground">
            <span style={{ fontSize: 12 }}>التالي</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Day headers — bold band */}
        <div className="grid grid-cols-7 border-b border-border/30 bg-muted/15">
          {dayHeaders.map(d => (
            <div
              key={d.label}
              className={`text-center py-3 font-semibold ${restDowSet.has(d.dow) ? "text-muted-foreground/50 bg-muted/10" : "text-foreground/60"}`}
              style={{ fontSize: 13 }}
            >
              {d.label}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7">
          {cells.map((cell, i) => {
            const weekIdx = Math.floor(i / 7);
            const weekBg = weekIdx % 2 === 1 ? "bg-muted/[0.03]" : "";

            if (!cell) return <div key={`e-${i}`} className={`min-h-[68px] border-b border-e border-border/20 ${weekBg}`} />;

            const rec = recordMap[cell.date];
            const today = new Date().toISOString().slice(0, 10) === cell.date;
            const isRest = isRestDay(cell.dayOfWeek);
            const isFuture = isFutureDate(cell.date);
            const hasData = rec && rec.check_in_time;

            // Determine cell styling
            let cellBg = weekBg;
            let statusIcon: React.ReactNode = null;

            if (rec) {
              const s = rec.status;
              if (s === "complete" || s === "auto_checkout") {
                if (rec.is_late) {
                  cellBg = "bg-gradient-to-b from-amber-500/8 to-amber-500/3";
                  statusIcon = <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
                } else {
                  cellBg = "bg-gradient-to-b from-emerald-500/8 to-emerald-500/3";
                  statusIcon = <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />;
                }
              } else if (s === "absent") {
                cellBg = "bg-gradient-to-b from-destructive/8 to-destructive/3";
                statusIcon = <XCircle className="w-3.5 h-3.5 text-destructive" />;
              } else if (s === "checked_in" || s === "missing_checkout") {
                cellBg = "bg-gradient-to-b from-orange-500/8 to-orange-500/3";
                statusIcon = <Clock className="w-3.5 h-3.5 text-orange-400" />;
              } else if (s === "missing_checkin") {
                cellBg = "bg-gradient-to-b from-orange-500/8 to-orange-500/3";
                statusIcon = <Clock className="w-3.5 h-3.5 text-orange-400" />;
              } else if (s === "leave") {
                cellBg = "bg-gradient-to-b from-blue-500/8 to-blue-500/3";
              }
            } else if (isRest) {
              cellBg += " bg-muted/5";
            }

            // Dynamic height
            const cellHeight = hasData ? "min-h-[100px]" : rec?.status === "absent" ? "min-h-[80px]" : "min-h-[68px]";

            return (
              <div
                key={cell.date}
                className={`${cellHeight} border-b border-e border-border/20 p-2 flex flex-col transition-all duration-200 ${cellBg} ${today ? "ring-2 ring-inset ring-primary/40" : ""} ${isRest && !rec ? "bg-[repeating-linear-gradient(135deg,transparent,transparent_4px,rgba(128,128,128,0.03)_4px,rgba(128,128,128,0.03)_8px)]" : ""}`}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(212, 175, 55, 0.06)"; e.currentTarget.style.boxShadow = "inset 0 0 0 1px rgba(212, 175, 55, 0.12)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ""; e.currentTarget.style.boxShadow = ""; }}
              >
                {/* Day number + status icon */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`w-6 h-6 flex items-center justify-center rounded-full ${
                      today ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                      : isRest && !rec ? "text-muted-foreground/30"
                      : "text-foreground/70"
                    }`}
                    style={{ fontSize: 12, fontWeight: today ? 700 : 500 }}
                  >
                    {cell.day}
                  </span>
                  {statusIcon}
                </div>

                {/* Attendance data — times + hours hero */}
                {hasData ? (
                  <div className="flex-1 flex flex-col items-center text-center">
                    <div className="space-y-0.5">
                      <div className="text-emerald-500 font-mono" style={{ fontSize: 11 }} dir="ltr">{formatTime(rec.check_in_time)}</div>
                      <div className={`font-mono ${rec.auto_checkout_applied ? "text-amber-500" : "text-blue-500"}`} style={{ fontSize: 11 }} dir="ltr">
                        {rec.check_out_time ? formatTime(rec.check_out_time) : "—"}
                      </div>
                    </div>
                    {/* Hours — hero element */}
                    {rec.working_hours > 0 && (
                      <div className="mt-auto pt-1.5">
                        <span className="text-foreground font-mono font-semibold" style={{ fontSize: 12 }}>
                          {formatWorkHours(rec.working_hours)}
                        </span>
                        {rec.overtime_hours > 0 && (
                          <span className="text-emerald-500 font-mono ms-1" style={{ fontSize: 10 }}>+{formatWorkHours(rec.overtime_hours)}</span>
                        )}
                      </div>
                    )}
                  </div>
                ) : rec?.status === "absent" ? (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <span className="text-destructive font-medium" style={{ fontSize: 11 }}>غياب</span>
                  </div>
                ) : rec?.status === "leave" ? (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <span className="text-blue-400 font-medium" style={{ fontSize: 11 }}>إجازة</span>
                  </div>
                ) : isRest ? (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <span className="text-muted-foreground/25" style={{ fontSize: 10 }}>إجازة</span>
                  </div>
                ) : isFuture ? (
                  <div className="flex-1" />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <span className="text-muted-foreground/15" style={{ fontSize: 14 }}>—</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend — prominent bar */}
        <div className="flex flex-wrap items-center justify-center gap-5 px-5 py-3.5 border-t border-border/30 bg-muted/10">
          {[
            { label: "حاضر", dot: "bg-emerald-500" },
            { label: "متأخر", dot: "bg-amber-400" },
            { label: "دخول فقط", dot: "bg-orange-400" },
            { label: "غياب", dot: "bg-destructive" },
            { label: "إجازة", dot: "bg-blue-400" },
            { label: "يوم راحة", dot: "bg-muted-foreground/30" },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${l.dot}`} />
              <span className="text-muted-foreground" style={{ fontSize: 12 }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════ Monthly Summary ══════════════════════════

function MonthlySummaryView({
  stats,
  monthLabel,
  records,
  calMonth,
  onPrev,
  onNext,
}: {
  stats: { daysWorked: number; totalHours: number; avgHours: number; overtime: number; lateCount: number; lateMins: number; absentCount: number; checkedInOnly: number; totalRecords: number };
  monthLabel: string;
  records: DbAttendanceRecord[];
  calMonth: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  // Per-day breakdown table
  const sortedRecords = useMemo(() =>
    [...records].sort((a, b) => a.date.localeCompare(b.date)),
  [records]);

  const dayNamesShort: Record<string, string> = {
    sunday: "أحد", monday: "اثنين", tuesday: "ثلاثاء",
    wednesday: "أربعاء", thursday: "خميس", friday: "جمعة", saturday: "سبت",
  };

  return (
    <div className="space-y-5">
      {/* Month navigator */}
      <div className="flex items-center justify-center gap-4 mb-2">
        <button onClick={onPrev} className="p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer">
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
        <h3 className="text-foreground text-lg">{monthLabel}</h3>
        <button onClick={onNext} className="p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer">
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: "أيام العمل", value: stats.daysWorked, color: "text-emerald-400", icon: CalendarDays },
          { label: "الساعات", value: formatWorkHours(stats.totalHours), color: "text-blue-400", icon: Clock },
          { label: "المتوسط/يوم", value: formatWorkHours(stats.avgHours), color: "text-amber-400", icon: Timer },
          { label: "الإضافي", value: formatWorkHours(stats.overtime), color: "text-emerald-400", icon: TrendingUp },
          { label: "التأخر", value: `${stats.lateCount} يوم`, color: "text-primary", icon: AlertTriangle },
          { label: "الغياب", value: `${stats.absentCount}`, color: "text-destructive", icon: XCircle },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -3, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.15)" }}
              className="relative bg-card backdrop-blur-sm border border-border rounded-xl p-3 text-center overflow-hidden shadow-lg hover:border-primary/30 transition-colors cursor-default"
            >
              <Icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
              <div className={`font-mono ${s.color}`} style={{ fontSize: 18 }}>{s.value}</div>
              <div className="text-muted-foreground mt-0.5" style={{ fontSize: 10 }}>{s.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Daily records table */}
      <div className={`${cardCls} overflow-hidden`}>
        <div className="px-4 py-3 border-b border-border/20">
          <h4 className="text-foreground" style={{ fontSize: 14 }}>تفاصيل الأيام</h4>
        </div>
        <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-card/90 backdrop-blur-sm">
              <tr className="border-b border-border/20">
                {["التاريخ", "اليوم", "الحضور", "الانصراف", "الساعات", "الإضافي", "الحالة"].map(h => (
                  <th key={h} className="px-3 py-2.5 text-muted-foreground text-center whitespace-nowrap" style={{ fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRecords.length > 0 ? sortedRecords.map(r => {
                const statusLabel = mapAttendanceStatus(r.status, r.is_late);
                const sColor = statusColors[statusLabel] || "";
                return (
                  <tr key={r.id} className="border-b border-border/10 hover:bg-muted/5">
                    <td className="px-3 py-2 text-center font-mono text-foreground" style={{ fontSize: 12 }}>{r.date.slice(5)}</td>
                    <td className="px-3 py-2 text-center text-muted-foreground" style={{ fontSize: 11 }}>{dayNamesShort[r.day_of_week?.toLowerCase()] || "—"}</td>
                    <td className="px-3 py-2 text-center">
                      <span className="text-emerald-400 font-mono" style={{ fontSize: 12 }} dir="ltr">{r.check_in_time ? formatTime(r.check_in_time) : "—"}</span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`font-mono ${r.auto_checkout_applied ? "text-amber-400" : "text-blue-400"}`} style={{ fontSize: 12 }} dir="ltr">
                        {r.check_out_time ? formatTime(r.check_out_time) : "N/A"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center font-mono text-foreground" style={{ fontSize: 12 }}>
                      {r.working_hours > 0 ? formatWorkHours(r.working_hours) : "0h"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {r.overtime_hours > 0 ? (
                        <span className="text-emerald-400 font-mono" style={{ fontSize: 11 }}>{formatWorkHours(r.overtime_hours)}</span>
                      ) : (
                        <span className="text-muted-foreground/30" style={{ fontSize: 11 }}>—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`px-2 py-0.5 rounded-md border ${sColor}`} style={{ fontSize: 10 }}>{statusLabel}</span>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground" style={{ fontSize: 13 }}>
                    لا توجد سجلات لهذا الشهر
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════ Overall Summary ══════════════════════════

function OverallSummaryView({
  stats,
  breakdown,
}: {
  stats: {
    daysWorked: number; totalHours: number; avgHours: number; overtime: number;
    lateCount: number; lateMins: number; absentCount: number; totalRecords: number;
    monthsCount: number; firstDate: string; lastDate: string; presentDays: number; attendanceRate: number;
  };
  breakdown: Array<{ month: string; days: number; hours: number; overtime: number; late: number; absent: number }>;
}) {
  const monthNames: Record<string, string> = {
    "01": "يناير", "02": "فبراير", "03": "مارس", "04": "أبريل",
    "05": "مايو", "06": "يونيو", "07": "يوليو", "08": "أغسطس",
    "09": "سبتمبر", "10": "أكتوبر", "11": "نوفمبر", "12": "ديسمبر",
  };

  return (
    <div className="space-y-5">
      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "إجمالي أيام العمل", value: stats.daysWorked, color: "text-emerald-400", icon: CalendarDays },
          { label: "إجمالي الساعات", value: formatWorkHours(stats.totalHours), color: "text-blue-400", icon: Clock },
          { label: "نسبة الحضور", value: `${stats.attendanceRate}%`, color: stats.attendanceRate >= 80 ? "text-emerald-400" : "text-amber-400", icon: Award },
          { label: "عدد الأشهر", value: stats.monthsCount, color: "text-primary", icon: Calendar },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`${cardCls} p-4 text-center`}>
              <Icon className={`w-5 h-5 mx-auto mb-2 ${s.color}`} />
              <div className={`font-mono ${s.color}`} style={{ fontSize: 24 }}>{s.value}</div>
              <div className="text-muted-foreground mt-1" style={{ fontSize: 11 }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "المتوسط/يوم", value: formatWorkHours(stats.avgHours) },
          { label: "الإضافي الكلي", value: formatWorkHours(stats.overtime) },
          { label: "أيام التأخر", value: `${stats.lateCount} يوم` },
          { label: "أيام الغياب", value: `${stats.absentCount} يوم` },
        ].map(s => (
          <div key={s.label} className={`${cardCls} p-3`}>
            <div className="text-muted-foreground" style={{ fontSize: 10 }}>{s.label}</div>
            <div className="text-foreground font-mono mt-1" style={{ fontSize: 15 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Date range */}
      <div className={`${cardCls} px-4 py-3 flex items-center justify-between`}>
        <span className="text-muted-foreground" style={{ fontSize: 12 }}>فترة البيانات</span>
        <span className="text-foreground font-mono" style={{ fontSize: 13 }}>{stats.firstDate} → {stats.lastDate}</span>
      </div>

      {/* Monthly breakdown table */}
      <div className={`${cardCls} overflow-hidden`}>
        <div className="px-4 py-3 border-b border-border/20">
          <h4 className="text-foreground" style={{ fontSize: 14 }}>تفاصيل الأشهر</h4>
        </div>
        <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-card/90 backdrop-blur-sm">
              <tr className="border-b border-border/20">
                {["الشهر", "الأيام", "الساعات", "المتوسط", "الإضافي", "التأخر", "الغياب"].map(h => (
                  <th key={h} className="px-3 py-2.5 text-muted-foreground text-center whitespace-nowrap" style={{ fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {breakdown.map(row => {
                const [yr, mn] = row.month.split("-");
                const avg = row.days > 0 ? row.hours / row.days : 0;
                return (
                  <tr key={row.month} className="border-b border-border/10 hover:bg-muted/5">
                    <td className="px-3 py-2 text-center text-foreground" style={{ fontSize: 12 }}>
                      {monthNames[mn] || mn} {yr}
                    </td>
                    <td className="px-3 py-2 text-center font-mono text-emerald-400" style={{ fontSize: 12 }}>{row.days}</td>
                    <td className="px-3 py-2 text-center font-mono text-blue-400" style={{ fontSize: 12 }}>{formatWorkHours(row.hours)}</td>
                    <td className="px-3 py-2 text-center font-mono text-amber-400" style={{ fontSize: 12 }}>{formatWorkHours(avg)}</td>
                    <td className="px-3 py-2 text-center font-mono text-emerald-400" style={{ fontSize: 12 }}>{row.overtime > 0 ? formatWorkHours(row.overtime) : "—"}</td>
                    <td className="px-3 py-2 text-center" style={{ fontSize: 12 }}>
                      {row.late > 0 ? <span className="text-primary">{row.late}</span> : <span className="text-muted-foreground/30">—</span>}
                    </td>
                    <td className="px-3 py-2 text-center" style={{ fontSize: 12 }}>
                      {row.absent > 0 ? <span className="text-destructive">{row.absent}</span> : <span className="text-muted-foreground/30">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
