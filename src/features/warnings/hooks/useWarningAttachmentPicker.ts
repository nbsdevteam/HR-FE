import { useState, useCallback } from "react";
import { arabicSource } from "@/i18n/source";
import type { DbWarningAttachmentSettings } from "@/shared/hooks";
import { fileToBase64 } from "@/shared/utils/fileToBase64";
import {
  DEFAULT_WARNING_ATTACHMENT_FORMATS,
  DEFAULT_WARNING_ATTACHMENT_MAX_BYTES,
} from "../constants/warnings";

export type WarningAttachmentPayload = { file_name: string; file_data: string };

type UseWarningAttachmentPickerArgs = {
  settings: DbWarningAttachmentSettings | null;
};

/**
 * Files staged on the create-warning form. They are base64-encoded only at
 * submit time and travel with `/warnings/create` itself (backend §1) — a
 * rejected file fails the whole request, so there is no half-saved warning.
 */
export const useWarningAttachmentPicker = ({ settings }: UseWarningAttachmentPickerArgs) => {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");

  const acceptedFormats = settings?.attachment_accepted_formats ?? DEFAULT_WARNING_ATTACHMENT_FORMATS;
  const maxBytes = settings?.attachment_max_bytes ?? DEFAULT_WARNING_ATTACHMENT_MAX_BYTES;

  const validateFile = useCallback((file: File): string => {
    const ext = `.${file.name.split(".").pop()?.toLowerCase() || ""}`;
    if (!acceptedFormats.includes(ext)) {
      return `${arabicSource("warnings.error_attachment_file_type")} (${arabicSource("leave.accepted_formats")}: ${acceptedFormats.join(", ")})`;
    }
    if (file.size > maxBytes) return arabicSource("warnings.error_attachment_too_large");
    return "";
  }, [acceptedFormats, maxBytes]);

  const handleFilesSelected = useCallback((selected: File[]): void => {
    const rejected = selected.map(validateFile).find(Boolean);
    if (rejected) {
      setError(rejected);
      return;
    }
    setError("");
    setFiles((prev) => [...prev, ...selected]);
  }, [validateFile]);

  const handleRemoveFile = useCallback((name: string): void => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
    setError("");
  }, []);

  const reset = useCallback((): void => {
    setFiles([]);
    setError("");
  }, []);

  /** `attachment` for a single file, `attachments` for several (backend §1). */
  const buildAttachmentFields = useCallback(async (): Promise<Record<string, unknown>> => {
    if (files.length === 0) return {};
    const encoded: WarningAttachmentPayload[] = await Promise.all(
      files.map(async (file) => ({ file_name: file.name, file_data: await fileToBase64(file) })),
    );
    return encoded.length === 1 ? { attachment: encoded[0] } : { attachments: encoded };
  }, [files]);

  return {
    acceptedFormats,
    buildAttachmentFields,
    error,
    files,
    handleFilesSelected,
    handleRemoveFile,
    maxBytes,
    reset,
    setError,
  };
};
