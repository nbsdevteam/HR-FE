import { CreditCard, Fingerprint, ScanFace, Smartphone } from "lucide-react";
import { getIntlLocale, normalizeLanguage, type AppLanguage } from "@/i18n";
import { arabicSource } from "@/i18n/source";
import { mapAttendanceStatus, type DbAttendanceRecord } from "@/shared/hooks";
import type { AttendanceRow, AttendanceStatusCountKey, TodayAttendanceStats } from "../types";

const attendanceStatusKeyByLabel: Record<string, AttendanceStatusCountKey> = {
  [arabicSource("common.present")]: "present",
  [arabicSource("common.late")]: "late",
  [arabicSource("common.absent")]: "absent",
  [arabicSource("common.leave")]: "leave",
};

const createEmptyAttendanceCounts = (): Record<AttendanceStatusCountKey, number> => ({
  present: 0,
  late: 0,
  absent: 0,
  leave: 0,
});

const formatAverageHours = (hours: number, language?: AppLanguage | string): string => {
  if (hours === 0) return "0";

  return new Intl.NumberFormat(getIntlLocale(normalizeLanguage(language)), {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(hours);
};

export const buildTodayAttendanceStats = (
  records: DbAttendanceRecord[],
  selectedDate: string,
  language?: AppLanguage | string,
): TodayAttendanceStats => {
  const counts = createEmptyAttendanceCounts();
  let total = 0;
  let totalWorkingHours = 0;
  let validHoursCount = 0;
  let autoCheckouts = 0;

  records.forEach((record) => {
    if (record.date !== selectedDate) return;

    total++;

    const status = mapAttendanceStatus(record.status, record.is_late);
    const countKey = attendanceStatusKeyByLabel[status];
    if (countKey) counts[countKey]++;

    if (record.working_hours > 0) {
      totalWorkingHours += record.working_hours;
      validHoursCount++;
    }

    if (record.auto_checkout_applied) {
      autoCheckouts++;
    }
  });

  const averageHours = validHoursCount === 0 ? 0 : totalWorkingHours / validHoursCount;

  return {
    ...counts,
    total,
    avgHours: formatAverageHours(averageHours, language),
    autoCheckouts,
  };
};

export const verifyModeLabel = (mode: string | null): string => {
  if (!mode) return arabicSource("common.device");
  const m = mode.toLowerCase().trim();
  if (m.includes("fpandcardandpw") || (m.includes("fp") && m.includes("card"))) return arabicSource("attendance.fingerprint_card");
  if (m.includes("cardandpw") || (m.includes("card") && m.includes("pw"))) return arabicSource("attendance.card_token");
  if (m.includes("faceandcard")) return arabicSource("attendance.face_card");
  if (m.includes("fp") || m.includes("finger")) return arabicSource("common.fingerprint");
  if (m.includes("face")) return arabicSource("common.face");
  if (m.includes("card")) return arabicSource("common.card");
  if (m.includes("iris")) return arabicSource("attendance.iris");
  if (m.includes("pw") || m.includes("password")) return arabicSource("attendance.code");
  return arabicSource("common.device");
};

export const VerifyIcon = ({ mode }: { mode: string | null }) => {
  if (!mode) return null;
  const m = mode.toLowerCase();
  if (m.includes(arabicSource("common.face")) || m.includes("face")) return <ScanFace className="w-3.5 h-3.5 text-blue-400" />;
  if (m.includes(arabicSource("common.fingerprint")) || m.includes("finger") || m.includes("fp")) return <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />;
  if (m.includes(arabicSource("common.card")) || m.includes("card")) return <CreditCard className="w-3.5 h-3.5 text-amber-400" />;
  return <Smartphone className="w-3.5 h-3.5 text-muted-foreground" />;
};

export const statusDetail = (row: AttendanceRow): string | null => {
  if (row.rawStatus === "auto_checkout") return arabicSource("attendance.auto_exit");
  if (row.rawStatus === "missing_checkin") return arabicSource("attendance.no_entry");
  if (row.rawStatus === "checked_in") return arabicSource("attendance.did_not_log_out");
  if (row.rawStatus === "missing_checkout") return arabicSource("attendance.no_exit");
  return null;
};
