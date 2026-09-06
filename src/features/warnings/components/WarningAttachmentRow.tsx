import { useState, useCallback } from "react";
import { Download, FileText, Loader2, Trash2 } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import * as odooData from "@/shared/api/odooData";
import { useOdooMutation } from "@/shared/hooks";
import type { DbWarningAttachment } from "@/shared/hooks";
import { warningErrorMessage } from "../utils/warningErrorMessage";

type TWarningAttachmentRowProps = {
  warningId: string;
  attachment: DbWarningAttachment;
  canEdit: boolean;
  onDeleted: () => void;
};

const formatKb = (bytes: number): string => `${Math.max(1, Math.round(bytes / 1024))}KB`;

/**
 * One file on a warning. Download goes through the API route and rebuilds the
 * bytes as a Blob — the attachment is not `public`, so `/web/content/<id>`
 * 404s for a browser that carries neither the JWT nor an Odoo cookie (§2).
 */
const WarningAttachmentRow = ({ warningId, attachment, canEdit, onDeleted }: TWarningAttachmentRowProps) => {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const deleteAttachmentMutation = useOdooMutation<unknown, void>(
    () => odooData.deleteWarningAttachment(warningId, attachment.id),
    "warnings",
  );

  const handleDownload = useCallback(async (): Promise<void> => {
    setDownloading(true);
    setError("");
    try {
      const file = await odooData.downloadWarningAttachment(warningId, attachment.id);
      const bytes = Uint8Array.from(atob(file.file_data), (c) => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: file.mimetype }));
      const link = document.createElement("a");
      link.href = url;
      link.download = file.file_name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Revoking synchronously cancels the download in some browsers.
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (e) {
      setError(warningErrorMessage(e, arabicSource("warnings.attachment_download_failed")));
    }
    setDownloading(false);
  }, [attachment.id, warningId]);

  const handleDelete = useCallback(async (): Promise<void> => {
    setError("");
    try {
      await deleteAttachmentMutation.mutateAsync();
      onDeleted();
    } catch (e) {
      setError(warningErrorMessage(e, arabicSource("warnings.attachment_delete_failed")));
    }
  }, [deleteAttachmentMutation, onDeleted]);

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/10">
      <FileText className="w-5 h-5 text-primary flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-foreground truncate" style={{ fontSize: 13 }}>{attachment.file_name}</p>
        <p className="text-muted-foreground" style={{ fontSize: 11 }}>{formatKb(attachment.file_size)}</p>
        {error && <p className="text-destructive" style={{ fontSize: 11 }}>{error}</p>}
      </div>
      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading || deleteAttachmentMutation.isPending}
        className="p-2 rounded-lg hover:bg-primary/10 text-primary cursor-pointer disabled:opacity-50"
        title={arabicSource("leave.download")}
      >
        {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      </button>
      {canEdit && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={downloading || deleteAttachmentMutation.isPending}
          className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive cursor-pointer disabled:opacity-50"
          title={arabicSource("common.delete")}
        >
          {deleteAttachmentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
};

export default WarningAttachmentRow;
