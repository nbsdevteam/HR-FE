import { memo, useCallback } from "react";
import { Paperclip } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { DbLeaveRequest } from "@/shared/hooks";

type LeaveAttachmentIndicatorProps = {
  leave: DbLeaveRequest;
  onViewAttachments: (leave: DbLeaveRequest) => void;
};

/** Paperclip + count, shown on a leave row/card that carries at least one attachment. */
const LeaveAttachmentIndicator = ({ leave, onViewAttachments }: LeaveAttachmentIndicatorProps) => {
  const handleClick = useCallback(() => onViewAttachments(leave), [onViewAttachments, leave]);

  if (leave.attachment_count === 0) return null;

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1 text-primary hover:underline cursor-pointer"
      style={{ fontSize: 11 }}
      title={arabicSource("leave.view_attachments")}
    >
      <Paperclip className="w-3 h-3" />
      {leave.attachment_count}
    </button>
  );
};

export default memo(LeaveAttachmentIndicator);
