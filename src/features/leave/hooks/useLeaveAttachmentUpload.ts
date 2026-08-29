import { useState, useCallback } from "react";
import * as odooData from "@/shared/api/odooData";
import type { DbLeaveSettings } from "@/shared/hooks";
import { fileToBase64 } from "@/shared/utils/fileToBase64";
import { arabicSource } from "@/i18n/source";
import { leaveErrorMessage } from "../utils/leaveErrorMessage";

const DEFAULT_ACCEPTED_FORMATS = [".pdf", ".doc", ".docx", ".txt", ".rtf", ".png", ".jpg", ".jpeg"];
const DEFAULT_MAX_BYTES = 10485760;

type UseLeaveAttachmentUploadArgs = {
  leaveId: string;
  settings: DbLeaveSettings | null;
  onUploaded: () => void;
};

/** Uploads a document onto an already-created leave request (backend §3.4) — immediate, not staged for a form submit. */
export const useLeaveAttachmentUpload = ({ leaveId, settings, onUploaded }: UseLeaveAttachmentUploadArgs) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const acceptedFormats = settings?.attachment_accepted_formats ?? DEFAULT_ACCEPTED_FORMATS;
  const maxBytes = settings?.attachment_max_bytes ?? DEFAULT_MAX_BYTES;

  const handleFileSelected = useCallback(async (file: File): Promise<void> => {
    const ext = `.${file.name.split(".").pop()?.toLowerCase() || ""}`;
    if (!acceptedFormats.includes(ext)) {
      setError(`${arabicSource("leave.error_attachment_file_type")} (${arabicSource("leave.accepted_formats")}: ${acceptedFormats.join(", ")})`);
      return;
    }
    if (file.size > maxBytes) {
      setError(arabicSource("leave.error_attachment_too_large"));
      return;
    }

    setError("");
    setUploading(true);
    try {
      const file_data = await fileToBase64(file);
      await odooData.uploadLeaveAttachment(leaveId, { file_name: file.name, file_data });
      onUploaded();
    } catch (e) {
      setError(leaveErrorMessage(e, "Failed to upload attachment"));
    }
    setUploading(false);
  }, [acceptedFormats, leaveId, maxBytes, onUploaded]);

  return { acceptedFormats, error, handleFileSelected, maxBytes, uploading };
};
