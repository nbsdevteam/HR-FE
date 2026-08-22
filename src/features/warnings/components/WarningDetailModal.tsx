import { memo } from "react";
import { motion } from "motion/react";
import { CheckCircle, Trash2, XCircle } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { Modal } from "@/shared/components";
import type { WarningWithEmployee } from "../types";
import WarningDetailRow from "./WarningDetailRow";

type TWarningDetailModalProps = {
  warning: WarningWithEmployee;
  typeColors: Record<string, string>;
  statusColors: Record<string, string>;
  onClose: () => void;
  onEdit: () => void;
  onActivate: () => void;
  onEnd: () => void;
  onDelete: () => void;
};

const WarningDetailModal = ({
  warning,
  typeColors,
  statusColors,
  onClose,
  onEdit,
  onActivate,
  onEnd,
  onDelete,
}: TWarningDetailModalProps) => (
  <Modal
    onClose={onClose}
    contentClassName="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-lg max-h-[90vh] overflow-y-auto"
    title={arabicSource("warnings.alarm_details")}
    bodyClassName="space-y-3"
    footer={
      <div className="flex gap-2 mt-6 pt-6 border-t border-border/20">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onEdit}
          className="flex-1 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors cursor-pointer"
        >
          {arabicSource("common.edit")}
        </motion.button>
        {warning.status !== arabicSource("common.is_active") && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onActivate}
            className="flex-1 py-2 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            {arabicSource("common.activate")}
          </motion.button>
        )}
        {warning.status !== arabicSource("common.finished") && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onEnd}
            className="flex-1 py-2 rounded-lg bg-muted/30 text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            {arabicSource("common.end")}
          </motion.button>
        )}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onDelete}
          className="flex-1 py-2 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/30 transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          {arabicSource("common.delete")}
        </motion.button>
      </div>
    }
  >
      <WarningDetailRow label={arabicSource("warnings.employee")}>
        <span className="text-foreground">{warning.employeeName}</span>
      </WarningDetailRow>
      <WarningDetailRow label={arabicSource("warnings.section")}>
        <span className="text-foreground">{warning.employeeDepartment}</span>
      </WarningDetailRow>
      <WarningDetailRow label={arabicSource("warnings.alarm_type")}>
        <span
          className={`px-2 py-0.5 rounded-md border ${typeColors[warning.type]}`}
          style={{ fontSize: 12 }}
        >
          {warning.type}
        </span>
      </WarningDetailRow>
      <WarningDetailRow label={arabicSource("warnings.reason")}>
        <span className="text-foreground">{warning.reason}</span>
      </WarningDetailRow>
      {warning.details && (
        <WarningDetailRow label={arabicSource("warnings.details")}>
          <p className="text-foreground mt-1">{warning.details}</p>
        </WarningDetailRow>
      )}
      <WarningDetailRow label={arabicSource("warnings.date")}>
        <span className="text-foreground" dir="ltr">
          {warning.date}
        </span>
      </WarningDetailRow>
      {warning.expiry_date && (
        <WarningDetailRow label={arabicSource("warnings.completion_date")}>
          <span className="text-foreground" dir="ltr">
            {warning.expiry_date}
          </span>
        </WarningDetailRow>
      )}
      <WarningDetailRow label={arabicSource("warnings.issued_by_2")}>
        <span className="text-foreground">{warning.issued_by || "—"}</span>
      </WarningDetailRow>
      <WarningDetailRow label={arabicSource("warnings.condition")}>
        <span
          className={`px-2 py-0.5 rounded-md border ${statusColors[warning.status]}`}
          style={{ fontSize: 12 }}
        >
          {warning.status}
        </span>
      </WarningDetailRow>
  </Modal>
);

export default memo(WarningDetailModal);
