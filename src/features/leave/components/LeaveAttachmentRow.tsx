import { useState, useCallback } from "react";
import { Download, FileText, Loader2, Trash2 } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import * as odooData from "@/shared/api/odooData";
import type { DbLeaveAttachment } from "@/shared/hooks";
import { leaveErrorMessage } from "../utils/leaveErrorMessage";

type LeaveAttachmentRowProps = {
  leaveId: string;
  attachment: DbLeaveAttachment;
  onDeleted: (attachmentId: string) => void;
};

const formatKb = (bytes: number): string => `${Math.max(1, Math.round(bytes / 1024))}KB`;

const LeaveAttachmentRow = ({ leaveId, attachment, onDeleted }: LeaveAttachmentRowProps) => {
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDownload = useCallback(async (): Promise<void> => {
    setDownloading(true);
    setError("");
    try {
      const file = await odooData.downloadLeaveAttachment(leaveId, attachment.id);
      const bytes = Uint8Array.from(atob(file.file_data), (c) => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: file.mimetype }));
      window.open(url, "_blank");
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(leaveErrorMessage(e, "Failed to download attachment"));
    }
    setDownloading(false);
  }, [attachment.id, leaveId]);

  const handleDelete = useCallback(async (): Promise<void> => {
    setDeleting(true);
    setError("");
    try {
      await odooData.deleteLeaveAttachment(leaveId, attachment.id);
      onDeleted(attachment.id);
    } catch (e) {
      setError(leaveErrorMessage(e, "Failed to delete attachment"));
      setDeleting(false);
    }
  }, [attachment.id, leaveId, onDeleted]);

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/10">
      <FileText className="w-5 h-5 text-primary flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-foreground truncate" style={{ fontSize: 13 }}>{attachment.file_name}</p>
        <p className="text-muted-foreground" style={{ fontSize: 11 }}>{formatKb(attachment.file_size)}</p>
        {error && <p className="text-destructive" style={{ fontSize: 11 }}>{error}</p>}
      </div>
      <button
        onClick={handleDownload}
        disabled={downloading || deleting}
        className="p-2 rounded-lg hover:bg-primary/10 text-primary cursor-pointer disabled:opacity-50"
        title={arabicSource("leave.download")}
      >
        {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      </button>
      <button
        onClick={handleDelete}
        disabled={downloading || deleting}
        className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive cursor-pointer disabled:opacity-50"
        title={arabicSource("common.delete")}
      >
        {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      </button>
    </div>
  );
};

export default LeaveAttachmentRow;
