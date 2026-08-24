import { memo, useCallback } from "react";
import { motion } from "motion/react";
import { Eye } from "lucide-react";
import { StatusBadge } from "@/shared/components";
import { empDisplayName, type DbEmployee, type DbExitProcess } from "@/shared/hooks";
import { formatNumber } from "@/i18n/format";
import Td from "./shared/Td";

type ExitProcessTableRowProps = {
  process: DbExitProcess;
  index: number;
  emp: DbEmployee | undefined;
  exitTypeLabels: Record<string, string>;
  statusLabels: Record<string, string>;
  statusColors: Record<string, string>;
  onView: (processId: string) => void;
};

const ExitProcessTableRow = ({ process: p, index: i, emp, exitTypeLabels, statusLabels, statusColors, onView }: ExitProcessTableRowProps) => {
  const handleViewClick = useCallback((): void => {
    onView(p.id);
  }, [onView, p.id]);

  return (
    <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
      className="border-b border-border/20 hover:bg-muted/10 transition-colors">
      <Td>{emp ? empDisplayName(emp) : "—"}</Td>
      <Td muted>{exitTypeLabels[p.exit_type] || p.exit_type}</Td>
      <Td muted dir="ltr">{p.exit_date}</Td>
      <Td dir="ltr">
        {p.eos_amount ? `${formatNumber(Number(p.eos_amount))} ${p.eos_currency}` : "—"}
      </Td>
      <td className="px-4 py-3">
        <StatusBadge colorClassName={statusColors[p.status] || ""}>{statusLabels[p.status] || p.status}</StatusBadge>
      </td>
      <td className="px-4 py-3">
        <button onClick={handleViewClick} className="p-1.5 rounded hover:bg-primary/10 text-primary cursor-pointer">
          <Eye className="w-4 h-4" />
        </button>
      </td>
    </motion.tr>
  );
};

export default memo(ExitProcessTableRow);
