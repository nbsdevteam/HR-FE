import { useCallback } from "react";
import { LogOut, Pencil, Plus } from "lucide-react";
import { Button } from "@/shared/components";
import type { LifecycleExit } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { exitStageLabel } from "../utils/lifecycleActions";
import ExitStageBlockerNote from "./ExitStageBlockerNote";

type EmployeeLifecycleExitCardProps = {
  exit: LifecycleExit | null;
  canStart: boolean;
  canEdit: boolean;
  onStart: () => void;
  onOpen: (exitId: string) => void;
};

/**
 * End of Service on the profile: the backend's stage, since, who it waits on
 * and blockers, plus the Start / Edit action it offers. `waiting_on` is a stage
 * label, not an assigned person, until the later phases add named owners.
 */
const EmployeeLifecycleExitCard = ({ exit, canStart, canEdit, onStart, onOpen }: EmployeeLifecycleExitCardProps) => {
  const handleOpen = useCallback((): void => {
    if (exit) onOpen(exit.id);
  }, [exit, onOpen]);

  return (
    <section className="rounded-xl border border-border/40 bg-card/30 p-4" data-lifecycle-exit={exit?.stage ?? "none"}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <h4 className="flex items-center gap-2 text-foreground" style={{ fontSize: 14 }}>
          <LogOut className="w-4 h-4 text-primary" />
          {arabicSource("lifecycle.end_of_service")}
        </h4>
        {exit && canEdit && (
          <Button variant="outline" size="sm" icon={Pencil} onClick={handleOpen}>
            {arabicSource("employees.lifecycle_edit_exit")}
          </Button>
        )}
        {!exit && canStart && (
          <Button variant="outline" size="sm" icon={Plus} onClick={onStart}>
            {arabicSource("employees.exit_redirect_start")}
          </Button>
        )}
      </div>
      {exit ? (
        <div className="space-y-2" style={{ fontSize: 13 }}>
          <p className="text-foreground">
            <span className="text-muted-foreground">{arabicSource("common.status")}: </span>
            {exitStageLabel(exit.stage)}
          </p>
          {exit.since && (
            <p className="text-foreground">
              <span className="text-muted-foreground">{arabicSource("employees.lifecycle_since")}: </span>
              <span dir="ltr">{exit.since}</span>
            </p>
          )}
          {exit.waiting_on && (
            <p className="text-foreground">
              <span className="text-muted-foreground">{arabicSource("employees.lifecycle_waiting_on")}: </span>
              {exitStageLabel(exit.waiting_on)}
            </p>
          )}
          {exit.blockers.map(code => (
            <ExitStageBlockerNote key={code} code={code} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("employees.lifecycle_no_exit")}</p>
      )}
    </section>
  );
};

export default EmployeeLifecycleExitCard;
