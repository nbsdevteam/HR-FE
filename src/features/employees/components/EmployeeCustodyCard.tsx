import { motion } from "motion/react";
import { Calendar, Hash, Laptop } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { Custody } from "../types";
import RecordIconBadge from "./shared/RecordIconBadge";
import RecordDeleteButton from "./shared/RecordDeleteButton";
import RecordMetaItem from "./shared/RecordMetaItem";

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
        <RecordIconBadge icon={Laptop} wrapperClassName="p-2 rounded-lg bg-primary/10 mt-0.5" iconClassName="w-4 h-4 text-primary" />
        <div>
          <p className="text-foreground" style={{ fontSize: 14 }}>{custody.item}</p>
          <p className="text-muted-foreground mt-0.5" style={{ fontSize: 13 }}>{custody.description}</p>
        </div>
      </div>
      {isEditing && <RecordDeleteButton onDelete={() => onDelete(custody.id)} />}
    </div>
    <div className="flex items-center gap-5 mt-3 ps-11">
      <RecordMetaItem icon={Calendar} label={arabicSource("shared.received_date")} value={custody.dateReceived} />
      {custody.serialNumber && (
        <RecordMetaItem icon={Hash} value={custody.serialNumber} />
      )}
    </div>
  </motion.div>
);

export default EmployeeCustodyCard;
