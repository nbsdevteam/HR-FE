import { useCallback } from "react";
import { Paperclip } from "lucide-react";
import { ModalHeader, ModalOverlay } from "@/shared/components";
import EmptyState from "@/shared/components/EmptyState";
import { arabicSource } from "@/i18n/source";
import type { DbLeaveRequest, DbLeaveSettings } from "@/shared/hooks";
import { useLeaveAttachmentUpload } from "../hooks/useLeaveAttachmentUpload";
import LeaveAttachmentRow from "./LeaveAttachmentRow";
import LeaveAttachmentUploadField from "./LeaveAttachmentUploadField";

type LeaveAttachmentsModalProps = {
  leave: DbLeaveRequest;
  settings: DbLeaveSettings | null;
  onClose: () => void;
  onChanged: () => void;
};

/**
 * Attachment browser + manager for a leave request: list + download from the
 * data already embedded on the leave object (backend §4 — no extra fetch for
 * the list), plus upload-after-creation and delete (backend §3.4/§3.7).
 */
const LeaveAttachmentsModal = ({ leave, settings, onClose, onChanged }: LeaveAttachmentsModalProps) => {
  const { acceptedFormats, error, handleFileSelected, uploading } = useLeaveAttachmentUpload({
    leaveId: leave.id,
    settings,
    onUploaded: onChanged,
  });

  const handleDeleted = useCallback((): void => {
    onChanged();
  }, [onChanged]);

  return (
    <ModalOverlay
      onClose={onClose}
      contentClassName="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-lg max-h-[80vh] overflow-y-auto"
    >
      <ModalHeader title={arabicSource("shared.attachments")} onClose={onClose} />
      <div className="space-y-2 mb-3">
        {leave.attachments.length === 0 ? (
          <EmptyState icon={Paperclip} message={arabicSource("shared.no_attachments")} />
        ) : (
          leave.attachments.map((attachment) => (
            <LeaveAttachmentRow key={attachment.id} leaveId={leave.id} attachment={attachment} onDeleted={handleDeleted} />
          ))
        )}
      </div>
      <LeaveAttachmentUploadField
        uploading={uploading}
        error={error}
        acceptedFormats={acceptedFormats}
        onFileSelected={handleFileSelected}
      />
    </ModalOverlay>
  );
};

export default LeaveAttachmentsModal;
