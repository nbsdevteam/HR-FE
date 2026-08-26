import { motion } from "motion/react";
import { Calendar, Hash, Laptop, StickyNote } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { StatusBadge } from "@/shared/components";
import type { Custody, CustodyStatus } from "../types";
import { CUSTODY_STATUS_KEYS, custodyStatusColors, custodyStatusLabels } from "../utils/custodyStatus";
import { dashedRecordInputClass } from "./shared/DashedAddRecordCard";
import RecordIconBadge from "./shared/RecordIconBadge";
import RecordDeleteButton from "./shared/RecordDeleteButton";
import RecordMetaItem from "./shared/RecordMetaItem";
import SelectOptionElement from "./shared/SelectOptionElement";

type EmployeeCustodyCardProps = {
  custody: Custody;
  isEditing: boolean;
  onDelete: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Pick<Custody, "status" | "returnDate">>) => void;
};

const EmployeeCustodyCard = ({ custody, isEditing, onDelete, onUpdate }: EmployeeCustodyCardProps) => {
  const handleDeleteClick = (): void => {
    onDelete(custody.id);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    onUpdate(custody.id, { status: e.target.value as CustodyStatus });
  };

  const handleReturnDateChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onUpdate(custody.id, { returnDate: e.target.value || null });
  };

  return (
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
      <div className="flex items-center gap-2 shrink-0">
        {isEditing ? (
          <select
            value={custody.status}
            onChange={handleStatusChange}
            className={`${dashedRecordInputClass} h-8 w-auto px-2`}
            style={{ fontSize: 12 }}
          >
            {CUSTODY_STATUS_KEYS.map((key) => (
              <SelectOptionElement key={key} value={key} label={custodyStatusLabels[key]} />
            ))}
          </select>
        ) : (
          <StatusBadge colorClassName={custodyStatusColors[custody.status]}>
            {custodyStatusLabels[custody.status]}
          </StatusBadge>
        )}
        {isEditing && <RecordDeleteButton onDelete={handleDeleteClick} />}
      </div>
    </div>
    <div className="flex flex-wrap items-center gap-5 mt-3 ps-11">
      <RecordMetaItem icon={Calendar} label={arabicSource("shared.received_date")} value={custody.dateReceived} />
      {custody.serialNumber && (
        <RecordMetaItem icon={Hash} value={custody.serialNumber} />
      )}
      {custody.status === "returned" && (
        isEditing ? (
          <label className="flex items-center gap-1.5 text-muted-foreground" style={{ fontSize: 12 }}>
            {arabicSource("shared.return_date")}
            <input
              type="date"
              dir="ltr"
              value={custody.returnDate ?? ""}
              onChange={handleReturnDateChange}
              className={`${dashedRecordInputClass} h-8 w-auto px-2`}
              style={{ fontSize: 12 }}
            />
          </label>
        ) : custody.returnDate && (
          <RecordMetaItem icon={Calendar} label={arabicSource("shared.return_date")} value={custody.returnDate} />
        )
      )}
    </div>
    {custody.notes && (
      <p className="flex items-start gap-1.5 mt-2 ps-11 text-muted-foreground" style={{ fontSize: 12 }}>
        <StickyNote className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        {custody.notes}
      </p>
    )}
  </motion.div>
  );
};

export default EmployeeCustodyCard;
