import { AlertTriangle } from "lucide-react";
import { empDisplayName, type DbEmployee, type DbEmployeeContract } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import type { EmployeeMap } from "../types/lifecycle";

type ProbationAlertsProps = {
  probationAlerts: DbEmployeeContract[];
  empMap: EmployeeMap;
};

export const ProbationAlerts = ({ probationAlerts, empMap }: ProbationAlertsProps) => {
  if (probationAlerts.length === 0) return null;

  return (
    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-amber-400" />
        <span className="text-amber-400" style={{ fontSize: 14 }}>{arabicSource("lifecycle.trial_period_alerts")}</span>
      </div>
      <div className="space-y-1">
        {probationAlerts.map(contract => {
          const employee = empMap[contract.employee_id] as DbEmployee | undefined;
          const daysLeft = Math.ceil((new Date(contract.probation_end_date!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          return (
            <p key={contract.id} className="text-foreground" style={{ fontSize: 13 }}>
              {employee ? empDisplayName(employee) : "—"} {arabicSource("lifecycle.the_trial_period_ends_yet")} <span className="text-amber-400">{daysLeft} {arabicSource("common.days_2")}</span>
            </p>
          );
        })}
      </div>
    </div>
  );
};
