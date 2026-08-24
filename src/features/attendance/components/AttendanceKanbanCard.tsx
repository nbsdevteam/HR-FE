import { memo } from "react";
import { motion } from "motion/react";
import { Timer } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { AttendanceRow } from "../types";
import { VerifyIcon } from "../utils/attendanceDisplay";
import DeptAvatarBadge from "./DeptAvatarBadge";
import ElapsedTime from "./ElapsedTime";

type AttendanceKanbanCardProps = {
  record: AttendanceRow;
  index: number;
  onSelectEmployee: (employeeId: string) => void;
};

const AttendanceKanbanCard = ({ record, index, onSelectEmployee }: AttendanceKanbanCardProps) => {
  const handleCardClick = (): void => {
    onSelectEmployee(record.employeeId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04 }}
      className="bg-card/60 border border-border/30 rounded-lg p-3 shadow-sm hover:border-border/50 transition-colors cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <DeptAvatarBadge initial={record.employee.charAt(0)} deptColor={record.deptColor} fontSize={11} />
        <div className="flex-1 min-w-0">
          <p className="text-foreground truncate" style={{ fontSize: 13 }}>{record.employee}</p>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground" style={{ fontSize: 10 }}>{record.department}</p>
            {record.deviceNo !== "—" && <span className="text-muted-foreground/50 font-mono" style={{ fontSize: 9 }}>#{record.deviceNo}</span>}
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
      {record.lateMinutes > 0 && <div className="mt-1.5 text-primary/70" style={{ fontSize: 10 }}>{arabicSource("attendance.delayed")} {record.lateMinutes} {arabicSource("common.min")}</div>}
      {record.overtimeHours > 0 && <div className="mt-0.5 text-emerald-400/70" style={{ fontSize: 10 }}>{arabicSource("common.additional")} {record.overtimeHours.toFixed(1)} {arabicSource("common.hours")}</div>}
    </motion.div>
  );
};

export default memo(AttendanceKanbanCard);
