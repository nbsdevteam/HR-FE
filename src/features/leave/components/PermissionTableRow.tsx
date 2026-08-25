import { memo, useCallback } from "react";
import { motion } from "motion/react";
import { Check, X } from "lucide-react";
import { Button, StatusBadge } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { DbLeavePermission } from "@/shared/hooks";
import { leaveStatusColors as statusColors } from "../styles";

type PermissionTableRowProps = {
  permission: DbLeavePermission;
  index: number;
  empName: string;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
};

const PermissionTableRow = ({ permission: p, index: i, empName, onApprove, onReject }: PermissionTableRowProps) => {
  const handleApprove = useCallback(() => onApprove(p.id), [onApprove, p.id]);
  const handleReject = useCallback(() => onReject(p.id), [onReject, p.id]);

  return (
    <motion.tr
      key={p.id}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
      className="border-b border-border/20 hover:bg-muted/10 transition-colors"
    >
      <td className="px-4 py-3 text-foreground" style={{ fontSize: 13 }}>{empName}</td>
      <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} dir="ltr">{p.date}</td>
      <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} dir="ltr">{p.start_time?.substring(0, 5)}</td>
      <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} dir="ltr">{p.end_time?.substring(0, 5)}</td>
      <td className="px-4 py-3 text-foreground" style={{ fontSize: 13 }}>{p.hours} {arabicSource("common.hours")}</td>
      <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }}>{p.reason || "—"}</td>
      <td className="px-4 py-3">
        <StatusBadge colorClassName={statusColors[p.status] || ""}>{p.status}</StatusBadge>
      </td>
      <td className="px-4 py-3">
        {p.status === arabicSource("common.pending") && (
          <div className="flex items-center gap-1">
            <Button
              onClick={handleApprove}
              variant="unstyled"
              size="unstyled"
              rounded="rounded"
              icon={Check}
              iconClassName="w-4 h-4 text-emerald-400"
              className="p-1.5 hover:bg-emerald-500/20"
            />
            <Button
              onClick={handleReject}
              variant="unstyled"
              size="unstyled"
              rounded="rounded"
              icon={X}
              iconClassName="w-4 h-4 text-destructive"
              className="p-1.5 hover:bg-destructive/20"
            />
          </div>
        )}
      </td>
    </motion.tr>
  );
};

export default memo(PermissionTableRow);
