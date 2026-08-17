import { motion } from "motion/react";
import { CheckCircle, Trash2, X, XCircle } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { WarningWithEmployee } from "../types";

type WarningDetailModalProps = {
  warning: WarningWithEmployee;
  typeColors: Record<string, string>;
  statusColors: Record<string, string>;
  onClose: () => void;
  onEdit: () => void;
  onActivate: () => void;
  onEnd: () => void;
  onDelete: () => void;
};

export const WarningDetailModal = ({
  warning,
  typeColors,
  statusColors,
  onClose,
  onEdit,
  onActivate,
  onEnd,
  onDelete,
}: WarningDetailModalProps) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      onClick={(e) => e.stopPropagation()}
      className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-lg max-h-[90vh] overflow-y-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-foreground">{arabicSource("warnings.alarm_details")}</h2>
        <button onClick={onClose} className="p-1 rounded hover:bg-secondary cursor-pointer">
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
      <div className="space-y-3">
        <div className="p-3 rounded-lg bg-muted/20">
          <span className="text-muted-foreground" style={{ fontSize: 13 }}>{arabicSource("warnings.employee")} </span>
          <span className="text-foreground">{warning.employeeName}</span>
        </div>
        <div className="p-3 rounded-lg bg-muted/20">
          <span className="text-muted-foreground" style={{ fontSize: 13 }}>{arabicSource("warnings.section")} </span>
          <span className="text-foreground">{warning.employeeDepartment}</span>
        </div>
        <div className="p-3 rounded-lg bg-muted/20">
          <span className="text-muted-foreground" style={{ fontSize: 13 }}>{arabicSource("warnings.alarm_type")} </span>
          <span className={`px-2 py-0.5 rounded-md border ${typeColors[warning.type]}`} style={{ fontSize: 12 }}>
            {warning.type}
          </span>
        </div>
        <div className="p-3 rounded-lg bg-muted/20">
          <span className="text-muted-foreground" style={{ fontSize: 13 }}>{arabicSource("warnings.reason")} </span>
          <span className="text-foreground">{warning.reason}</span>
        </div>
        {warning.details && (
          <div className="p-3 rounded-lg bg-muted/20">
            <span className="text-muted-foreground" style={{ fontSize: 13 }}>{arabicSource("warnings.details")} </span>
            <p className="text-foreground mt-1">{warning.details}</p>
          </div>
        )}
        <div className="p-3 rounded-lg bg-muted/20">
          <span className="text-muted-foreground" style={{ fontSize: 13 }}>{arabicSource("warnings.date")} </span>
          <span className="text-foreground" dir="ltr">{warning.date}</span>
        </div>
        {warning.expiry_date && (
          <div className="p-3 rounded-lg bg-muted/20">
            <span className="text-muted-foreground" style={{ fontSize: 13 }}>{arabicSource("warnings.completion_date")} </span>
            <span className="text-foreground" dir="ltr">{warning.expiry_date}</span>
          </div>
        )}
        <div className="p-3 rounded-lg bg-muted/20">
          <span className="text-muted-foreground" style={{ fontSize: 13 }}>{arabicSource("warnings.issued_by_2")} </span>
          <span className="text-foreground">{warning.issued_by || "—"}</span>
        </div>
        <div className="p-3 rounded-lg bg-muted/20">
          <span className="text-muted-foreground" style={{ fontSize: 13 }}>{arabicSource("warnings.condition")} </span>
          <span className={`px-2 py-0.5 rounded-md border ${statusColors[warning.status]}`} style={{ fontSize: 12 }}>
            {warning.status}
          </span>
        </div>
      </div>

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
    </motion.div>
  </motion.div>
);
