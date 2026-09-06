import { useState, useCallback } from "react";
import * as odooData from "@/shared/api/odooData";
import { arabicSource } from "@/i18n/source";
import { useOdooMutation } from "@/shared/hooks";
import type { DbWarningAttachment, DbWarningAttachmentSettings } from "@/shared/hooks";
import { fileToBase64 } from "@/shared/utils/fileToBase64";
import {
  DEFAULT_WARNING_ATTACHMENT_FORMATS,
  DEFAULT_WARNING_ATTACHMENT_MAX_BYTES,
} from "../constants/warnings";
import { warningErrorMessage } from "../utils/warningErrorMessage";

type UseWarningAttachmentUploadArgs = {
  warningId: string;
  settings: DbWarningAttachmentSettings | null;
  onUploaded: () => void;
};

/** Uploads a file onto an already-created warning (backend §2) — immediate, not staged. */
export const useWarningAttachmentUpload = ({
  warningId,
  settings,
  onUploaded,
}: UseWarningAttachmentUploadArgs) => {
  const [error, setError] = useState("");

  const uploadMutation = useOdooMutation<DbWarningAttachment, { file_name: string; file_data: string }>(
    (file) => odooData.uploadWarningAttachment(warningId, file),
    "warnings",
  );

  const acceptedFormats = settings?.attachment_accepted_formats ?? DEFAULT_WARNING_ATTACHMENT_FORMATS;
  const maxBytes = settings?.attachment_max_bytes ?? DEFAULT_WARNING_ATTACHMENT_MAX_BYTES;

  const handleFileSelected = useCallback(async (file: File): Promise<void> => {
    const ext = `.${file.name.split(".").pop()?.toLowerCase() || ""}`;
    if (!acceptedFormats.includes(ext)) {
      setError(`${arabicSource("warnings.error_attachment_file_type")} (${arabicSource("leave.accepted_formats")}: ${acceptedFormats.join(", ")})`);
      return;
    }
    if (file.size > maxBytes) {
      setError(arabicSource("warnings.error_attachment_too_large"));
      return;
    }

    setError("");
    try {
      const file_data = await fileToBase64(file);
      await uploadMutation.mutateAsync({ file_name: file.name, file_data });
      onUploaded();
    } catch (e) {
      setError(warningErrorMessage(e, arabicSource("warnings.attachment_upload_failed")));
    }
  }, [acceptedFormats, maxBytes, onUploaded, uploadMutation]);

  return { acceptedFormats, error, handleFileSelected, maxBytes, uploading: uploadMutation.isPending };
};
