import { memo, useCallback } from "react";
import { motion } from "motion/react";
import { Trash2 } from "lucide-react";
import { StatusBadge } from "@/shared/components";
import { empDisplayName, type DbDocumentType, type DbEmployeeDocument } from "@/shared/hooks";

type DocumentTableRowProps = {
  doc: DbEmployeeDocument & { computedStatus: string };
  index: number;
  emp: any;
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
      <td className="px-4 py-3 text-foreground" style={{ fontSize: 13 }}>{emp ? empDisplayName(emp) : "—"}</td>
      <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }}>{dt?.name_ar || "—"}</td>
      <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} dir="ltr">{d.document_number || "—"}</td>
      <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} dir="ltr">{d.issue_date || "—"}</td>
      <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} dir="ltr">{d.expiry_date || "—"}</td>
      <td className="px-4 py-3">
        <StatusBadge colorClassName={statusColors[d.computedStatus] || ""}>{statusLabels[d.computedStatus] || d.computedStatus}</StatusBadge>
      </td>
      <td className="px-4 py-3">
        <button onClick={handleDelete} className="p-1 rounded hover:bg-destructive/20 cursor-pointer"><Trash2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
      </td>
    </motion.tr>
  );
};

export default memo(DocumentTableRow);
