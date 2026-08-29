import { memo, useCallback } from "react";
import { motion } from "motion/react";
import { Trash2 } from "lucide-react";
import { Button, StatusBadge } from "@/shared/components";
import { empDisplayName, type DbDocumentType, type DbEmployee, type DbEmployeeDocument } from "@/shared/hooks";
import Td from "./shared/Td";

type DocumentTableRowProps = {
  doc: DbEmployeeDocument & { computedStatus: string };
  index: number;
  emp: DbEmployee | undefined;
  docType: DbDocumentType | undefined;
  statusLabels: Record<string, string>;
  statusColors: Record<string, string>;
  onDelete: (id: string) => void;
};

const DocumentTableRow = ({ doc: d, index: i, emp, docType: dt, statusLabels, statusColors, onDelete }: DocumentTableRowProps) => {
  const handleDelete = useCallback(() => onDelete(d.id), [onDelete, d.id]);

  return (
    <motion.tr key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
      className="border-b border-border/20 hover:bg-muted/10 transition-colors">
      <Td>{emp ? empDisplayName(emp) : "—"}</Td>
      <Td muted>{dt?.name_ar || "—"}</Td>
      <Td muted dir="ltr">{d.document_number || "—"}</Td>
      <Td muted dir="ltr">{d.issue_date || "—"}</Td>
      <Td muted dir="ltr">{d.expiry_date || "—"}</Td>
      <td className="px-4 py-3">
        <StatusBadge colorClassName={statusColors[d.computedStatus] || ""}>{statusLabels[d.computedStatus] || d.computedStatus}</StatusBadge>
      </td>
      <td className="px-4 py-3">
        <Button
          variant="unstyled"
          size="unstyled"
          rounded="rounded"
          onClick={handleDelete}
          className="p-1 hover:bg-destructive/20"
          icon={Trash2}
          iconClassName="w-3.5 h-3.5 text-muted-foreground"
        />
      </td>
    </motion.tr>
  );
};

export default memo(DocumentTableRow);
