import { memo } from "react";
import { Paperclip } from "lucide-react";
import { arabicSource } from "@/i18n/source";

type TWarningAttachmentIndicatorProps = {
  attachmentCount: number;
  fontSize?: number;
};

/** Paperclip + count, shown on a warning row/card that carries at least one file (§6.5). */
const WarningAttachmentIndicator = ({ attachmentCount, fontSize = 11 }: TWarningAttachmentIndicatorProps) => {
  if (!attachmentCount) return null;

  return (
    <span
      className="inline-flex items-center gap-1 text-muted-foreground"
      style={{ fontSize }}
      title={arabicSource("shared.attachments")}
    >
      <Paperclip className="w-3 h-3" />
      {attachmentCount}
    </span>
  );
};

export default memo(WarningAttachmentIndicator);
