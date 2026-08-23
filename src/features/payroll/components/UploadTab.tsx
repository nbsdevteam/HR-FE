import { useState, useMemo, useRef, useCallback, memo } from "react";
import { Download, Loader2, CheckCircle } from "lucide-react";
import * as odooData from "@/shared/api/odooData";
import type { DbEmployee } from "@/shared/hooks";
import { parseAttendanceFile } from "@/features/payroll/services/payslip-parsing";
import type { RawAttendanceRecord } from "@/features/payroll";
import { arabicSource } from "@/i18n/source";
import UploadDropzone from "./UploadDropzone";
import UploadErrorsPanel from "./UploadErrorsPanel";
import UploadSummaryCards from "./UploadSummaryCards";
import UploadSummaryDetails from "./UploadSummaryDetails";

const UploadTab = ({
  employees,
}: {
  employees: DbEmployee[];
}) => {
  const [uploading, setUploading] = useState(false);
  const [parseResult, setParseResult] = useState<{
    records: RawAttendanceRecord[];
    errors: string[];
    totalRows: number;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  // Summary of parsed data
  const summary = useMemo(() => {
    if (!parseResult) return null;
    const { records } = parseResult;
    const uniqueEmployees = new Set(records.map((r) => r.personId));
    const uniqueDates = new Set(records.map((r) => r.time.substring(0, 10)));
    const checkIns = records.filter(
      (r) => r.attendanceStatus === "Check-in",
    ).length;
    const checkOuts = records.filter(
      (r) => r.attendanceStatus === "Check-out",
    ).length;
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

  const handleFile = useCallback(async (file: File) => {
    setUploading(true);
    setSaved(false);
    const result = await parseAttendanceFile(file);
    setParseResult(result);
    setUploading(false);
  }, []);

  const handleSaveToSupabase = useCallback(async () => {
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

        const checkIns = recs
          .filter((r) => r.attendanceStatus === "Check-in")
          .sort((a, b) => a.time.localeCompare(b.time));
        const checkOuts = recs
          .filter((r) => r.attendanceStatus === "Check-out")
          .sort((a, b) => a.time.localeCompare(b.time));

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
        const dayNames = [
          "sunday",
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
        ];
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
  }, [parseResult, employees]);

  return (
    <div className="space-y-6">
      <UploadDropzone
        fileInputRef={fileRef}
        uploading={uploading}
        hasResult={!!parseResult}
        onFileSelected={handleFile}
      />

      {parseResult && parseResult.errors.length > 0 && (
        <UploadErrorsPanel errors={parseResult.errors} />
      )}

      {/* Parse Summary */}
      {summary && (
        <div className="space-y-4">
          <UploadSummaryCards
            totalRecords={summary.totalRecords}
            uniqueEmployees={summary.uniqueEmployees}
            uniqueDates={summary.uniqueDates}
            matchedCount={summary.matched.length}
          />

          <UploadSummaryDetails
            checkIns={summary.checkIns}
            checkOuts={summary.checkOuts}
            nones={summary.nones}
            dateRange={summary.dateRange}
            unmatched={summary.unmatched}
          />

          {/* Save Button */}
          <div className="flex justify-center">
            <button
              onClick={handleSaveToSupabase}
              disabled={saving || saved || summary.matched.length === 0}
              className="flex items-center gap-3 px-8 py-3.5 bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/20 hover:bg-gold-dark transition-colors cursor-pointer disabled:opacity-50"
              style={{ fontSize: 14 }}
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />{" "}
                  {arabicSource("payroll.saving_to_database")}
                </>
              ) : saved ? (
                <>
                  <CheckCircle className="w-5 h-5" />{" "}
                  {arabicSource("payroll.saved_successfully")}
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" /> {arabicSource("common.save")}{" "}
                  {summary.matched.length}{" "}
                  {arabicSource("payroll.database_employee")}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(UploadTab);
