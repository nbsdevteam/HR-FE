import { useState, useMemo, useRef } from "react";
import {
  Download, Users, FileText, Loader2,
  Upload, FileSpreadsheet, AlertCircle, CheckCircle,
  CalendarDays,
  TriangleAlert,
  UserCheck,
} from "lucide-react";
import * as odooData from "@/shared/api/odooData";
import type { DbEmployee } from "@/shared/hooks";
import {
  parseAttendanceFile,
  type RawAttendanceRecord,
} from "@/features/payroll";
import { arabicSource } from "@/i18n/source";
import { payrollCardClass as cardCls } from "../styles";

const UploadTab = ({
  employees,
  selectedMonth,
  onComplete,
}: {
  employees: DbEmployee[];
  selectedMonth: string;
  onComplete: () => void;
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [parseResult, setParseResult] = useState<{
    records: RawAttendanceRecord[];
    errors: string[];
    totalRows: number;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    setSaved(false);
    const result = await parseAttendanceFile(file);
    setParseResult(result);
    setUploading(false);
  };

  // Summary of parsed data
  const summary = useMemo(() => {
    if (!parseResult) return null;
    const { records } = parseResult;
    const uniqueEmployees = new Set(records.map((r) => r.personId));
    const uniqueDates = new Set(records.map((r) => r.time.substring(0, 10)));
    const checkIns = records.filter((r) => r.attendanceStatus === "Check-in").length;
    const checkOuts = records.filter((r) => r.attendanceStatus === "Check-out").length;
    const nones = records.filter((r) => r.attendanceStatus === "None").length;

    // Match with system employees
    const matched: string[] = [];
    const unmatched: string[] = [];
    for (const pid of uniqueEmployees) {
      const found = employees.find((e) => String(e.person_id) === pid);
      if (found) matched.push(pid);
      else unmatched.push(pid);
    }

    return {
      totalRecords: records.length,
      uniqueEmployees: uniqueEmployees.size,
      uniqueDates: uniqueDates.size,
      checkIns,
      checkOuts,
      nones,
      matched,
      unmatched,
      dateRange: [...uniqueDates].sort(),
    };
  }, [parseResult, employees]);

  const handleSaveToSupabase = async () => {
    if (!parseResult || parseResult.records.length === 0) return;
    setSaving(true);

    try {
      const { records } = parseResult;
      // Group by person+date → build processed attendance records
      const grouped: Record<string, RawAttendanceRecord[]> = {};
      for (const r of records) {
        const key = `${r.personId}__${r.time.substring(0, 10)}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(r);
      }

      const attRows: any[] = [];

      for (const [key, recs] of Object.entries(grouped)) {
        const [personId, date] = key.split("__");
        const emp = employees.find((e) => String(e.person_id) === personId);
        if (!emp) continue;

        const checkIns = recs.filter((r) => r.attendanceStatus === "Check-in").sort((a, b) => a.time.localeCompare(b.time));
        const checkOuts = recs.filter((r) => r.attendanceStatus === "Check-out").sort((a, b) => a.time.localeCompare(b.time));

        let checkInTime: string | null = null;
        let checkOutTime: string | null = null;
        let status = "complete";

        if (checkIns.length > 0 && checkOuts.length > 0) {
          checkInTime = checkIns[0].time.substring(11, 19);
          checkOutTime = checkOuts[checkOuts.length - 1].time.substring(11, 19);
        } else if (checkIns.length >= 2) {
          checkInTime = checkIns[0].time.substring(11, 19);
          checkOutTime = checkIns[checkIns.length - 1].time.substring(11, 19);
        } else if (checkOuts.length >= 2) {
          checkInTime = checkOuts[0].time.substring(11, 19);
          checkOutTime = checkOuts[checkOuts.length - 1].time.substring(11, 19);
        } else if (checkIns.length === 1) {
          checkInTime = checkIns[0].time.substring(11, 19);
          status = "missing_checkout";
        } else if (checkOuts.length === 1) {
          checkOutTime = checkOuts[0].time.substring(11, 19);
          status = "missing_checkin";
        } else {
          status = "absent";
        }

        // Calculate working hours
        let workingHours = 0;
        let overtimeHours = 0;
        let isLate = false;
        let lateMinutes = 0;
        let isEarly = false;

        if (checkInTime && checkOutTime) {
          const inParts = checkInTime.split(":").map(Number);
          const outParts = checkOutTime.split(":").map(Number);
          const inMin = inParts[0] * 60 + inParts[1];
          const outMin = outParts[0] * 60 + outParts[1];
          const totalMin = outMin > inMin ? outMin - inMin : 0;
          workingHours = Math.round((totalMin / 60) * 100) / 100;

          // Check late (assuming 7:00 start + 10 min grace)
          if (inMin > 7 * 60 + 10) {
            isLate = true;
            lateMinutes = inMin - 7 * 60;
          }
          // Check overtime (assuming 16:00 end)
          if (outMin > 16 * 60) {
            overtimeHours = Math.round(((outMin - 16 * 60) / 60) * 100) / 100;
          }
          // Check early
          if (outMin < 15 * 60 + 50) {
            isEarly = true;
          }
        }

        const d = new Date(date + "T00:00:00Z");
        const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const dayOfWeek = dayNames[d.getUTCDay()];

        attRows.push({
          employee_id: emp.id,
          date,
          day_of_week: dayOfWeek,
          check_in_time: checkInTime,
          check_out_time: checkOutTime,
          working_hours: workingHours,
          overtime_hours: overtimeHours,
          is_late: isLate,
          late_minutes: lateMinutes,
          is_early: isEarly,
          status,
          auto_checkout_applied: false,
        });
      }

      if (attRows.length > 0) {
        for (let i = 0; i < attRows.length; i += 100) {
          const batch = attRows.slice(i, i + 100).map((r: any) => ({
            employee_id: r.employee_id,
            date: r.date,
            check_in_time: r.check_in_time,
            check_out_time: r.check_out_time,
            status: r.status,
            source: "manual",
          }));
          await odooData.importAttendance(batch);
        }
      }

      setSaved(true);
    } catch (err: any) {
      console.error("Error saving:", err);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div className={`${cardCls} p-8`}>
        <div className="text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center mx-auto mb-4">
            <FileSpreadsheet className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-foreground mb-2">{arabicSource("payroll.uploading_the_attendance_and_departure_file")}</h3>
          <p className="text-muted-foreground mb-6" style={{ fontSize: 13 }}>
            {arabicSource("payroll.upload_an_excel_or_csv_file_containing_the_columns_person_id_nam")}
          </p>

          <div
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 transition-colors cursor-pointer ${
              parseResult
                ? "border-emerald-500/40 bg-emerald-500/5"
                : "border-border hover:border-primary/50 hover:bg-primary/5"
            }`}
          >
            {uploading ? (
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <span className="text-foreground">{arabicSource("payroll.analyzing_the_file")}</span>
              </div>
            ) : parseResult ? (
              <div className="flex items-center justify-center gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
                <span className="text-emerald-400">{arabicSource("payroll.the_file_was_successfully_parsed_click_to_upload_another_file")}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-primary/60" />
                <span className="text-foreground" style={{ fontSize: 14 }}>{arabicSource("payroll.click_to_select_a_file_or_drag_it_here")}</span>
                <span className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("payroll.excel_xlsx_xls_or_csv_max_10mb")}</span>
              </div>
            )}
          </div>
          <input
            ref={fileRef} type="file" accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
          />
        </div>
      </div>

      {/* Parse Errors */}
      {parseResult && parseResult.errors.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <span className="text-destructive" style={{ fontSize: 14 }}>{arabicSource("payroll.warnings")}{parseResult.errors.length})</span>
          </div>
          <ul className="space-y-1 max-h-32 overflow-y-auto">
            {parseResult.errors.slice(0, 20).map((err, i) => (
              <li key={i} className="text-destructive/80 ps-4" style={{ fontSize: 12 }}>• {err}</li>
            ))}
            {parseResult.errors.length > 20 && (
              <li className="text-destructive/60 ps-4" style={{ fontSize: 12 }}>{arabicSource("payroll.and")} {parseResult.errors.length - 20} {arabicSource("payroll.another_warning")}</li>
            )}
          </ul>
        </div>
      )}

      {/* Parse Summary */}
      {summary && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: arabicSource("common.total_records"), value: summary.totalRecords, icon: FileText },
              { label: arabicSource("common.number_of_employees"), value: summary.uniqueEmployees, icon: Users },
              { label: arabicSource("payroll.number_of_days"), value: summary.uniqueDates, icon: CalendarDays },
              { label: arabicSource("payroll.are_identical_to_the_system"), value: summary.matched.length, icon: UserCheck },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className={`${cardCls} p-4`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-muted-foreground" style={{ fontSize: 12 }}>{s.label}</p>
                      <span className="text-foreground" style={{ fontSize: 20 }}>{s.value}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Details chips */}
          <div className={`${cardCls} p-5`}>
            <div className="flex flex-wrap gap-3">
              <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" style={{ fontSize: 12 }}>
                Check-in: {summary.checkIns}
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400" style={{ fontSize: 12 }}>
                Check-out: {summary.checkOuts}
              </span>
              {summary.nones > 0 && (
                <span className="px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive" style={{ fontSize: 12 }}>
                  {arabicSource("payroll.none_absence")} {summary.nones}
                </span>
              )}
              {summary.dateRange.length > 0 && (
                <span className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary" style={{ fontSize: 12 }}>
                  {arabicSource("common.from")} {summary.dateRange[0]} {arabicSource("common.to")} {summary.dateRange[summary.dateRange.length - 1]}
                </span>
              )}
            </div>

            {summary.unmatched.length > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/15">
                <p className="text-amber-400 mb-1" style={{ fontSize: 13 }}>
                  <TriangleAlert className="w-4 h-4 inline-block me-1" />
                  {summary.unmatched.length} {arabicSource("payroll.an_employee_that_does_not_match_the_system")}
                </p>
                <p className="text-amber-400/70" style={{ fontSize: 12 }}>
                  IDs: {summary.unmatched.join(", ")}
                </p>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-center">
            <button
              onClick={handleSaveToSupabase}
              disabled={saving || saved || summary.matched.length === 0}
              className="flex items-center gap-3 px-8 py-3.5 bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/20 hover:bg-gold-dark transition-colors cursor-pointer disabled:opacity-50"
              style={{ fontSize: 14 }}
            >
              {saving ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> {arabicSource("payroll.saving_to_database")}</>
              ) : saved ? (
                <><CheckCircle className="w-5 h-5" /> {arabicSource("payroll.saved_successfully")}</>
              ) : (
                <><Download className="w-5 h-5" /> {arabicSource("common.save")} {summary.matched.length} {arabicSource("payroll.database_employee")}</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadTab;
