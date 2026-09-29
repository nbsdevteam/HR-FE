import { memo } from "react";
import { BellRing } from "lucide-react";
import { formatDate } from "@/i18n/format";
import { arabicSource } from "@/i18n/source";
import type { DbExitProcess } from "@/shared/hooks";

type ExitClearanceNoticeProps = {
  proc: DbExitProcess;
  cardCls: string;
};

/** When clearance started and who the one-time notifications reached. */
const ExitClearanceNotice = ({ proc, cardCls }: ExitClearanceNoticeProps) => {
  if (!proc.clearance_started_at) return null;
  const teams = proc.clearance_notifications.teams ?? {};
  const employee = proc.clearance_notifications.employee;

  return (
    <div className={`${cardCls} p-4 flex flex-wrap items-center gap-x-6 gap-y-1`} style={{ fontSize: 12 }}>
      <span className="flex items-center gap-1.5 text-foreground">
        <BellRing className="w-4 h-4 text-primary" />
        {arabicSource("lifecycle.exit_clearance_started")}: <span dir="ltr">{formatDate(proc.clearance_started_at)}</span>
      </span>
      {teams.finance && (
        <span className="text-muted-foreground" data-exit-notified="finance">
          {arabicSource("lifecycle.exit_notified_finance")}: {teams.finance.recipients}
        </span>
      )}
      {teams.it && (
        <span className="text-muted-foreground" data-exit-notified="it">
          {arabicSource("lifecycle.exit_notified_it")}: {teams.it.recipients}
        </span>
      )}
      {employee && (
        <span className={employee.email ? "text-muted-foreground" : "text-amber-400"}>
          {employee.email
            ? <>{arabicSource("lifecycle.exit_notified_employee_email")}: <span dir="ltr">{employee.email}</span></>
            : arabicSource("lifecycle.exit_employee_unreachable")}
        </span>
      )}
    </div>
  );
};

export default memo(ExitClearanceNotice);
