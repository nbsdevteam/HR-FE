import { Fingerprint, X } from "lucide-react";
import type { DbEmployee } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";

type EmployeeAttendanceDetailHeaderProps = {
  empInfo?: { name: string; dept: string; deviceNo: string };
  emp?: DbEmployee;
  onClose: () => void;
};

const EmployeeAttendanceDetailHeader = ({
  empInfo,
  emp,
  onClose,
}: EmployeeAttendanceDetailHeaderProps) => (
  <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 bg-card/50">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center">
        <span className="text-primary text-lg">
          {empInfo?.name?.charAt(0) || "?"}
        </span>
      </div>
      <div>
        <h2 className="text-foreground text-lg">
          {empInfo?.name || arabicSource("common.employee_2")}
        </h2>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-muted-foreground" style={{ fontSize: 12 }}>
            {empInfo?.dept}
          </span>
          {empInfo?.deviceNo && empInfo.deviceNo !== "—" && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/30 border border-border/30 font-mono text-muted-foreground"
              style={{ fontSize: 11 }}
            >
              <Fingerprint className="w-3 h-3 text-primary/60" />#
              {empInfo.deviceNo}
            </span>
          )}
          {emp?.person_id && (
            <span
              className="text-muted-foreground/60"
              style={{ fontSize: 11 }}
            >
              ID: {emp.person_id}
            </span>
          )}
        </div>
      </div>
    </div>
    <button
      onClick={onClose}
      className="p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
    >
      <X className="w-5 h-5 text-muted-foreground" />
    </button>
  </div>
);

export default EmployeeAttendanceDetailHeader;
