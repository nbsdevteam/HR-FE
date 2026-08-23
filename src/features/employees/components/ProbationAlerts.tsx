import { AlertTriangle } from "lucide-react";
import type { DbEmployeeContract } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import type { EmployeeMap } from "../types/lifecycle";
import ProbationAlertRow from "./ProbationAlertRow";

type ProbationAlertsProps = {
  probationAlerts: DbEmployeeContract[];
  empMap: EmployeeMap;
};

const ProbationAlerts = ({ probationAlerts, empMap }: ProbationAlertsProps) => {
  if (probationAlerts.length === 0) return null;

  return (
    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-amber-400" />
        <span className="text-amber-400" style={{ fontSize: 14 }}>{arabicSource("lifecycle.trial_period_alerts")}</span>
      </div>
      <div className="space-y-1">
        {probationAlerts.map(contract => (
          <ProbationAlertRow
            key={contract.id}
            employee={empMap[contract.employee_id]}
            probationEndDate={contract.probation_end_date!}
          />
        ))}
      </div>
    </div>
  );
};

export default ProbationAlerts;
