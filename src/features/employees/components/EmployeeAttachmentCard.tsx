import { motion } from "motion/react";
import { FileText } from "lucide-react";
import type { Attachment } from "../types";
import RecordIconBadge from "./shared/RecordIconBadge";
import RecordDeleteButton from "./shared/RecordDeleteButton";

type EmployeeAttachmentCardProps = {
  attachment: Attachment;
  isEditing: boolean;
  onDelete: (id: number) => void;
};

const EmployeeAttachmentCard = ({ attachment, isEditing, onDelete }: EmployeeAttachmentCardProps) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 5 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, x: -30 }}
    className="flex items-center gap-3 p-4 rounded-xl bg-muted/10 border border-border/30 hover:border-primary/20 transition-colors cursor-pointer"
  >
    <RecordIconBadge icon={FileText} wrapperClassName="p-2.5 rounded-lg bg-primary/10" iconClassName="w-5 h-5 text-primary" />
    <div className="flex-1 min-w-0">
      <p className="text-foreground truncate" style={{ fontSize: 14 }}>{attachment.name}</p>
      <p className="text-muted-foreground mt-0.5" style={{ fontSize: 12 }}>
        {attachment.type} — <span dir="ltr">{attachment.date}</span>
      </p>
    </div>
    {isEditing && <RecordDeleteButton onDelete={() => onDelete(attachment.id)} />}
  </motion.div>
);

export default EmployeeAttachmentCard;
