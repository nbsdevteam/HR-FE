import { motion } from "motion/react";
import { Fingerprint, ShieldCheck, Timer } from "lucide-react";
import { StatusBadge } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { AttendanceRow, ExcuseForm } from "../types";
import { statusColors, statusDotColors } from "../styles";
import { statusDetail, VerifyIcon, verifyModeLabel } from "../utils/attendanceDisplay";
import ElapsedTime from "./ElapsedTime";

type AttendanceTableRowProps = {
  record: AttendanceRow;
  index: number;
  onSelectEmployee: (employeeId: string) => void;
  onOpenExcuse: (record: AttendanceRow, form: ExcuseForm) => void;
};

const AttendanceTableRow = ({ record, index, onSelectEmployee, onOpenExcuse }: AttendanceTableRowProps) => {
  const handleRowClick = (): void => {
    onSelectEmployee(record.employeeId);
  };

  const handleExcuseClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.stopPropagation();
    onOpenExcuse(record, {
      late: record.excusedLate,
      absence: record.excusedAbsence,
      shortfall: record.excusedShortfall,
      note: record.excuseNote || "",
    });
  };

  return (
    <motion.tr
      key={record.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.02 }}
      className="border-b border-border/20 hover:bg-muted/10 transition-colors group cursor-pointer"
      onClick={handleRowClick}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`w-1.5 h-8 rounded-full ${statusDotColors[record.status] || "bg-muted"}`} />
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${!record.deptColor ? "bg-primary/15 border-primary/25" : ""}`}
            style={record.deptColor ? { backgroundColor: `${record.deptColor}20`, borderColor: `${record.deptColor}40` } : undefined}
          >
            <span style={{ fontSize: 12, color: record.deptColor || undefined }} className={!record.deptColor ? "text-primary" : ""}>{record.employee.charAt(0)}</span>
          </div>
          <div className="min-w-0">
            <p className="text-foreground truncate" style={{ fontSize: 13 }}>{record.employee}</p>
          </div>
        </div>
      </td>

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

      <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }}>{record.department}</td>

      <td className="px-4 py-3 text-center">
        {record.rawCheckIn ? (
          <span className="text-emerald-500 font-mono" style={{ fontSize: 13 }} dir="ltr">{record.checkIn}</span>
        ) : (
          <span className="text-muted-foreground/40" style={{ fontSize: 12 }}>—</span>
        )}
      </td>

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

      <td className="px-4 py-3 text-center">
        <div
          className="cursor-pointer hover:bg-primary/5 rounded-lg py-1 px-2 -mx-2 transition-colors group"
          onClick={handleExcuseClick}
        >
          {record.workHoursNum > 0 ? (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1">
                <span className="text-foreground font-mono" style={{ fontSize: 13 }}>{record.workHours}</span>
                {(record.excusedLate || record.excusedAbsence || record.excusedShortfall) && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
              {record.overtimeHours > 0 && <span className="text-primary/70" style={{ fontSize: 9 }}>+{record.overtimeHours.toFixed(1)} {arabicSource("common.additional")}</span>}
            </div>
          ) : record.rawCheckIn && !record.rawCheckOut ? (
            <ElapsedTime checkIn={record.rawCheckIn} />
          ) : (
            <span className="text-muted-foreground/40" style={{ fontSize: 12 }}>0.00</span>
          )}
        </div>
      </td>

      <td className="px-4 py-3">
        {record.source === "device" ? (
          <div className="flex items-center gap-1.5">
            <VerifyIcon mode={record.verifyMode} />
            <span className="text-muted-foreground" style={{ fontSize: 11 }}>{verifyModeLabel(record.verifyMode)}</span>
          </div>
        ) : record.source === "system" ? (
          <span className="text-muted-foreground/60" style={{ fontSize: 11 }}>{arabicSource("attendance.system")}</span>
        ) : (
          <span className="text-muted-foreground/60" style={{ fontSize: 11 }}>{arabicSource("attendance.manual")}</span>
        )}
      </td>

      <td className="px-4 py-3">
        <div className="flex flex-col items-start gap-0.5">
          <div className="flex items-center gap-1.5">
            <StatusBadge colorClassName={statusColors[record.status]}>{record.status}</StatusBadge>
            {record.lateMinutes > 0 && <span className="text-primary/70" style={{ fontSize: 10 }}>({record.lateMinutes} {arabicSource("attendance.d_2")}</span>}
          </div>
          {statusDetail(record) && <span className="text-muted-foreground/50" style={{ fontSize: 9 }}>{statusDetail(record)}</span>}
        </div>
      </td>
    </motion.tr>
  );
};

export default AttendanceTableRow;
