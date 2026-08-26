import { useCallback, useRef } from "react";
import { AlertCircle, Loader2, Paperclip, Upload } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { DbWarningAttachment, DbWarningAttachmentSettings } from "@/shared/hooks";
import { useWarningAttachmentUpload } from "../hooks/useWarningAttachmentUpload";
import WarningAttachmentRow from "./WarningAttachmentRow";

type TWarningAttachmentsSectionProps = {
  warningId: string;
  attachments: DbWarningAttachment[];
  settings: DbWarningAttachmentSettings | null;
  /** `hr.warnings.edit`; a view-only user may download but not upload or delete (§6.9). */
  canEdit: boolean;
  onChanged: () => void;
};

/**
 * Files on an existing warning: listed from the data already embedded on the
 * warning payload (§4 — no extra fetch), plus upload and delete for editors.
 */
const WarningAttachmentsSection = ({
  warningId,
  attachments,
  settings,
  canEdit,
  onChanged,
}: TWarningAttachmentsSectionProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { acceptedFormats, error, handleFileSelected, uploading } = useWarningAttachmentUpload({
    warningId,
    settings,
    onUploaded: onChanged,
  });

  const handleZoneClick = useCallback((): void => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files?.[0]) handleFileSelected(e.target.files[0]);
    e.target.value = "";
  }, [handleFileSelected]);

  return (
    <div className="pt-3 border-t border-border/20">
      <p className="text-muted-foreground mb-2 flex items-center gap-1.5" style={{ fontSize: 13 }}>
        <Paperclip className="w-3.5 h-3.5" />
        {arabicSource("shared.attachments")} ({attachments.length})
      </p>

      <div className="space-y-2">
        {attachments.length === 0 ? (
          <p className="text-muted-foreground" style={{ fontSize: 12 }}>
            {arabicSource("shared.no_attachments")}
          </p>
        ) : (
          attachments.map((attachment) => (
            <WarningAttachmentRow
              key={attachment.id}
              warningId={warningId}
              attachment={attachment}
              canEdit={canEdit}
              onDeleted={onChanged}
            />
          ))
        )}
      </div>

      {canEdit && (
        <>
          <div
            onClick={handleZoneClick}
            className="flex items-center gap-3 p-3 mt-2 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 text-primary/60 animate-spin flex-shrink-0" />
            ) : (
              <Upload className="w-5 h-5 text-primary/60 flex-shrink-0" />
            )}
            <span className="text-muted-foreground" style={{ fontSize: 13 }}>
              {arabicSource("leave.attach_file")}
            </span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.join(",")}
            className="hidden"
            onChange={handleFileInputChange}
          />
        </>
      )}

      {error && (
        <p className="text-destructive mt-1 flex items-center gap-1" style={{ fontSize: 12 }}>
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </p>
      )}
    </div>
  );
};

export default WarningAttachmentsSection;
