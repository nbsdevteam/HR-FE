import { AlertCircle, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { AttendanceImportOutcome } from "../hooks/useAttendanceImport";
import UploadFailedRowItem from "./UploadFailedRowItem";

type UploadImportOutcomeProps = {
  outcome: AttendanceImportOutcome;
};

/** "N saved, M failed" after an upload, with the refused rows named underneath. */
const UploadImportOutcome = ({ outcome }: UploadImportOutcomeProps) => {
  const { t } = useTranslation();
  const { saved, failed, failures, requestError } = outcome;
  const unlisted = failed - failures.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-2 text-emerald-400" style={{ fontSize: 14 }}>
        <CheckCircle className="w-5 h-5" />
        <span>{t("payroll.import_saved_count", { count: saved })}</span>
      </div>
      {failed > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <span className="text-destructive" style={{ fontSize: 14 }}>
              {t("payroll.import_failed_count", { count: failed })}
            </span>
          </div>
          {requestError && (
            <p className="text-destructive/80 mb-2" style={{ fontSize: 12 }}>
              {t("payroll.import_request_failed", { error: requestError })}
            </p>
          )}
          <ul className="space-y-1 max-h-40 overflow-y-auto">
            {failures.map((failure) => (
              <UploadFailedRowItem key={`${failure.employeeName}__${failure.date}`} failure={failure} />
            ))}
            {unlisted > 0 && !requestError && (
              <li className="text-destructive/60 ps-4" style={{ fontSize: 12 }}>
                {t("payroll.import_failed_unlisted", { count: unlisted })}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default UploadImportOutcome;
