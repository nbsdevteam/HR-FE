import { motion } from "motion/react";
import { Calendar, Hash, Laptop, Trash2 } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { Custody } from "../types";

type EmployeeCustodyCardProps = {
  custody: Custody;
  isEditing: boolean;
  onDelete: (id: number) => void;
};

const EmployeeCustodyCard = ({ custody, isEditing, onDelete }: EmployeeCustodyCardProps) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 5 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, x: -30 }}
    className="p-4 rounded-xl bg-muted/10 border border-border/30 hover:border-primary/20 transition-colors"
  >
    <div className="flex items-start justify-between">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10 mt-0.5">
          <Laptop className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-foreground" style={{ fontSize: 14 }}>{custody.item}</p>
          <p className="text-muted-foreground mt-0.5" style={{ fontSize: 13 }}>{custody.description}</p>
        </div>
      </div>
      {isEditing && (
        <button
          onClick={() => onDelete(custody.id)}
          className="p-1.5 rounded-lg hover:bg-destructive/15 cursor-pointer transition-colors"
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </button>
      )}
    </div>
    <div className="flex items-center gap-5 mt-3 ps-11">
      <span className="flex items-center gap-1.5 text-muted-foreground" style={{ fontSize: 12 }}>
        <Calendar className="w-3.5 h-3.5" />
        {arabicSource("shared.received_date")} <span dir="ltr" className="text-foreground">{custody.dateReceived}</span>
      </span>
      {custody.serialNumber && (
        <span className="flex items-center gap-1.5 text-muted-foreground" style={{ fontSize: 12 }}>
          <Hash className="w-3.5 h-3.5" />
          <span dir="ltr" className="text-foreground">{custody.serialNumber}</span>
        </span>
      )}
    </div>
  </motion.div>
);

export default EmployeeCustodyCard;
