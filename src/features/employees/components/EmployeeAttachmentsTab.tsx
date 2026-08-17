import { motion, AnimatePresence } from "motion/react";
import { Paperclip, PlusCircle } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { Attachment } from "../types";
import EmployeeAddAttachmentForm from "./EmployeeAddAttachmentForm";
import EmployeeAttachmentCard from "./EmployeeAttachmentCard";

type NewAttachment = { name: string; type: string };

type EmployeeAttachmentsTabProps = {
  attachments: Attachment[];
  isEditing: boolean;
  showAddAttachment: boolean;
  newAttachment: NewAttachment;
  onToggleAddAttachment: () => void;
  onNewAttachmentChange: (patch: Partial<NewAttachment>) => void;
  onConfirmAddAttachment: () => void;
  onCancelAddAttachment: () => void;
  onDeleteAttachment: (id: number) => void;
};

const EmployeeAttachmentsTab = ({
  attachments,
  isEditing,
  showAddAttachment,
  newAttachment,
  onToggleAddAttachment,
  onNewAttachmentChange,
  onConfirmAddAttachment,
  onCancelAddAttachment,
  onDeleteAttachment,
}: EmployeeAttachmentsTabProps) => (
  <motion.div
    key="attachments"
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.15 }}
    className="px-6 py-5 space-y-4"
  >
    <div className="flex items-center justify-between">
      <p className="text-muted-foreground" style={{ fontSize: 13 }}>{arabicSource("shared.documents_and_attachments")}</p>
      {isEditing && (
        <button
          onClick={onToggleAddAttachment}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors cursor-pointer"
          style={{ fontSize: 12 }}
        >
          <PlusCircle className="w-4 h-4" />
          {arabicSource("shared.lifting_attachment")}
        </button>
      )}
    </div>

    <AnimatePresence>
      {showAddAttachment && isEditing && (
        <EmployeeAddAttachmentForm
          newAttachment={newAttachment}
          onChange={onNewAttachmentChange}
          onConfirm={onConfirmAddAttachment}
          onCancel={onCancelAddAttachment}
        />
      )}
    </AnimatePresence>

    {attachments.length > 0 ? attachments.map((att) => (
      <EmployeeAttachmentCard key={att.id} attachment={att} isEditing={isEditing} onDelete={onDeleteAttachment} />
    )) : !showAddAttachment && (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Paperclip className="w-10 h-10 mb-3 opacity-30" />
        <p style={{ fontSize: 14 }}>{arabicSource("shared.no_attachments")}</p>
      </div>
    )}
  </motion.div>
);

export default EmployeeAttachmentsTab;
