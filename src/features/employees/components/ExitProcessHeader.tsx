import { memo } from "react";
import { ChevronLeft, LogOut, Pencil } from "lucide-react";
import { Button } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { DbExitProcess } from "@/shared/hooks";

type ExitProcessHeaderProps = {
  proc: DbExitProcess;
  employeeName: string;
  exitTypeLabel: string;
  statusLabel: string;
  statusColor: string;
  editing: boolean;
  busy: boolean;
  onBack: () => void;
  onEditOpen: () => void;
  onCancel: () => void;
};

/** Name, type and last working day, with Edit and Cancel only where the backend's `my_actions` lists them. */
const ExitProcessHeader = ({
  proc, employeeName, exitTypeLabel, statusLabel, statusColor, editing, busy, onBack, onEditOpen, onCancel,
}: ExitProcessHeaderProps) => (
  <>
    <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground cursor-pointer">
      <ChevronLeft className="w-4 h-4" /> {arabicSource("lifecycle.return")}
    </button>

    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
        <LogOut className="w-6 h-6 text-primary" />
      </div>
      <div>
        <h2 className="text-foreground" dir="auto">{employeeName}</h2>
        <p className="text-muted-foreground" style={{ fontSize: 13 }}>
          {exitTypeLabel} — {proc.exit_date}
        </p>
      </div>
      <div className="ms-auto flex flex-wrap items-center gap-2">
        {proc.my_actions.includes("edit") && !editing && (
          <Button variant="outline" size="sm" icon={Pencil} onClick={onEditOpen}>
            {arabicSource("common.edit")}
          </Button>
        )}
        {proc.my_actions.includes("cancel") && (
          <Button variant="destructive" size="sm" disabled={busy} onClick={onCancel} data-exit-cancel>
            {arabicSource("lifecycle.exit_cancel_process")}
          </Button>
        )}
        <span className={`px-3 py-1 rounded-md border ${statusColor}`} style={{ fontSize: 12 }} data-exit-status={proc.status}>
          {statusLabel}
        </span>
      </div>
    </div>
  </>
);

export default memo(ExitProcessHeader);
