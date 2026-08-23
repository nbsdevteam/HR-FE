import { motion } from "motion/react";
import { Check, UserX, X } from "lucide-react";
import { StatusBadge } from "@/shared/components";
import { empDisplayName, type DbContractType, type DbEmployeeContract } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";

type ContractTableRowProps = {
  contract: DbEmployeeContract;
  index: number;
  emp: any;
  contractType: DbContractType | undefined;
  statusLabels: Record<string, string>;
  statusColors: Record<string, string>;
  onProbationUpdate: (contractId: string, status: "passed" | "failed") => void;
  onTerminate: (contractId: string) => void;
};

const ContractTableRow = ({
  contract: c, index: i, emp, contractType: ct, statusLabels, statusColors, onProbationUpdate, onTerminate,
}: ContractTableRowProps) => {
  const probDaysLeft = c.probation_end_date
    ? Math.ceil((new Date(c.probation_end_date).getTime() - Date.now()) / 86400000)
    : null;

  const handleProbationPassedClick = (): void => {
    onProbationUpdate(c.id, "passed");
  };

  const handleProbationFailedClick = (): void => {
    onProbationUpdate(c.id, "failed");
  };

  const handleTerminateClick = (): void => {
    onTerminate(c.id);
  };

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: i * 0.02 }}
      className="border-b border-border/20 hover:bg-muted/10 transition-colors"
    >
      <td className="px-4 py-3 text-foreground" style={{ fontSize: 13 }}>{emp ? empDisplayName(emp) : "—"}</td>
      <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }}>{ct?.name_ar || "—"}</td>
      <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} dir="ltr">{c.contract_number || "—"}</td>
      <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} dir="ltr">{c.start_date}</td>
      <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} dir="ltr">{c.end_date || arabicSource("common.not_specified")}</td>
      <td className="px-4 py-3">
        {c.probation_status === "pending" && probDaysLeft !== null ? (
          <span className={`text-xs ${probDaysLeft <= 14 ? "text-amber-400" : "text-muted-foreground"}`}>
            {probDaysLeft > 0 ? `${probDaysLeft} ${arabicSource("common.days_left")}` : arabicSource("lifecycle.finished")}
          </span>
        ) : (
          <span className={`px-2 py-0.5 rounded-md border ${statusColors[c.probation_status] || ""}`} style={{ fontSize: 11 }}>
            {statusLabels[c.probation_status] || c.probation_status}
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <StatusBadge colorClassName={statusColors[c.status] || ""}>{statusLabels[c.status] || c.status}</StatusBadge>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {c.probation_status === "pending" && (
            <>
              <button onClick={handleProbationPassedClick} className="p-1 rounded hover:bg-emerald-500/20 cursor-pointer" title={arabicSource("lifecycle.passed_the_test")}>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              </button>
              <button onClick={handleProbationFailedClick} className="p-1 rounded hover:bg-destructive/20 cursor-pointer" title={arabicSource("lifecycle.did_not_pass")}>
                <X className="w-3.5 h-3.5 text-destructive" />
              </button>
            </>
          )}
          {c.status === "active" && (
            <button onClick={handleTerminateClick} className="p-1 rounded hover:bg-destructive/20 cursor-pointer" title={arabicSource("common.end")}>
              <UserX className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </td>
    </motion.tr>
  );
};

export default ContractTableRow;
