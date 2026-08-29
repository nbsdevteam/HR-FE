import { motion, AnimatePresence } from "motion/react";
import { Paperclip } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { Attachment } from "../types";
import EmployeeAddAttachmentForm from "./EmployeeAddAttachmentForm";
import EmployeeAttachmentCard from "./EmployeeAttachmentCard";
import TabAddToggleHeader from "./shared/TabAddToggleHeader";
import TabShellEmptyState from "./shared/TabShellEmptyState";

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
    <TabAddToggleHeader
      description={arabicSource("shared.documents_and_attachments")}
      isEditing={isEditing}
      addLabel={arabicSource("shared.lifting_attachment")}
      onToggle={onToggleAddAttachment}
    />

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
      <TabShellEmptyState icon={Paperclip} message={arabicSource("shared.no_attachments")} />
    )}
  </motion.div>
);

export default EmployeeAttachmentsTab;
