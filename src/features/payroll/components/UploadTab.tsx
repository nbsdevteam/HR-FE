import { useState, useMemo, useRef, useCallback, memo } from "react";
import { Download, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/shared/components";
import type { DbEmployee } from "@/shared/hooks";
import { parseAttendanceFile } from "@/features/payroll/services/payslip-parsing";
import type { RawAttendanceRecord } from "@/features/payroll";
import { arabicSource } from "@/i18n/source";
import { useAttendanceImport } from "../hooks/useAttendanceImport";
import UploadDropzone from "./UploadDropzone";
import UploadErrorsPanel from "./UploadErrorsPanel";
import UploadImportOutcome from "./UploadImportOutcome";
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

  const { saving, outcome, saveRecords, resetOutcome } = useAttendanceImport(employees);

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
    resetOutcome();
    const result = await parseAttendanceFile(file);
    setParseResult(result);
    setUploading(false);
  }, [resetOutcome]);

  const handleSaveToSupabase = useCallback(async () => {
    if (!parseResult || parseResult.records.length === 0) return;
    await saveRecords(parseResult.records);
  }, [parseResult, saveRecords]);

  // A run with refused rows is not "saved": the button stays usable so HR can fix the file and retry.
  const saved = outcome !== null && outcome.failed === 0;

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
            <Button
              onClick={handleSaveToSupabase}
              disabled={saving || saved || summary.matched.length === 0}
              variant="primary"
              size="unstyled"
              rounded="rounded-xl"
              className="flex items-center gap-3 px-8 py-3.5 shadow-lg shadow-primary/20"
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
            </Button>
          </div>

          {outcome && <UploadImportOutcome outcome={outcome} />}
        </div>
      )}
    </div>
  );
};

export default memo(UploadTab);
