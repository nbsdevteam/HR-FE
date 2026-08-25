import { useState, useCallback } from "react";
import { arabicSource } from "@/i18n/source";
import type { DbLeaveSettings, DbLeaveType } from "@/shared/hooks";
import { fileToBase64 } from "@/shared/utils/fileToBase64";

export type LeaveDurationUnit = "day" | "hour";

export type LeaveRequestFields = {
  duration_unit?: "day" | "hour";
  hours?: number;
  hour_from?: number;
  attachment?: { file_name: string; file_data: string };
};

type UseLeaveHourlyAttachmentArgs = {
  selectedType: DbLeaveType | null;
  settings: DbLeaveSettings | null;
};

const DEFAULT_ACCEPTED_FORMATS = [".pdf", ".doc", ".docx", ".txt", ".rtf", ".png", ".jpg", ".jpeg"];
const DEFAULT_MAX_BYTES = 10485760;

/**
 * Hour-based duration + attachment state for the new-leave-request form,
 * kept out of `useLeaveRequestForm` so neither hook grows unreadable.
 */
export const useLeaveHourlyAttachment = ({ selectedType, settings }: UseLeaveHourlyAttachmentArgs) => {
  const [durationUnit, setDurationUnit] = useState<LeaveDurationUnit>("day");
  const [hours, setHours] = useState(1);
  const [hourFrom, setHourFrom] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentError, setAttachmentError] = useState("");

  const maxHours = settings?.max_hours_per_request ?? 4;
  const acceptedFormats = settings?.attachment_accepted_formats ?? DEFAULT_ACCEPTED_FORMATS;
  const maxBytes = settings?.attachment_max_bytes ?? DEFAULT_MAX_BYTES;

  const handleSelectDurationUnit = useCallback((unit: LeaveDurationUnit): void => {
    setDurationUnit(unit);
  }, []);

  const handleHoursChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setHours(Number(e.target.value) || 0);
  }, []);

  const handleHourFromChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setHourFrom(e.target.value);
  }, []);

  const handleAttachmentSelected = useCallback((file: File): void => {
    const ext = `.${file.name.split(".").pop()?.toLowerCase() || ""}`;
    if (!acceptedFormats.includes(ext)) {
      setAttachmentError(`${arabicSource("leave.error_attachment_file_type")} (${arabicSource("leave.accepted_formats")}: ${acceptedFormats.join(", ")})`);
      return;
    }
    if (file.size > maxBytes) {
      setAttachmentError(arabicSource("leave.error_attachment_too_large"));
      return;
    }
    setAttachmentError("");
    setAttachmentFile(file);
  }, [acceptedFormats, maxBytes]);

  const handleRemoveAttachment = useCallback((): void => {
    setAttachmentFile(null);
    setAttachmentError("");
  }, []);

  /** Force back to day mode when the newly selected type doesn't allow hourly. */
  const resetForType = useCallback((type: DbLeaveType | null): void => {
    if (!type?.allow_hourly) setDurationUnit("day");
  }, []);

  const validate = useCallback((): string => {
    if (durationUnit === "hour") {
      if (!(hours > 0)) return arabicSource("leave.error_invalid_hours");
      if (hours > maxHours) return arabicSource("leave.error_hours_exceed_maximum");
      if (hourFrom !== "") {
        const from = Number(hourFrom);
        if (Number.isNaN(from) || from < 0 || from >= 24) return arabicSource("leave.error_invalid_hour_from");
        if (from + hours > 24) return arabicSource("leave.error_invalid_hour_range");
      }
    }
    if (selectedType?.requires_attachment && !attachmentFile) {
      return arabicSource("leave.error_attachment_required");
    }
    return "";
  }, [attachmentFile, durationUnit, hourFrom, hours, maxHours, selectedType]);

  const buildRequestFields = useCallback(async (): Promise<LeaveRequestFields> => {
    const fields: LeaveRequestFields = {};
    if (durationUnit === "hour") {
      fields.duration_unit = "hour";
      fields.hours = hours;
      if (hourFrom !== "") fields.hour_from = Number(hourFrom);
    }
    if (attachmentFile) {
      fields.attachment = { file_name: attachmentFile.name, file_data: await fileToBase64(attachmentFile) };
    }
    return fields;
  }, [attachmentFile, durationUnit, hourFrom, hours]);

  const reset = useCallback((): void => {
    setDurationUnit("day");
    setHours(1);
    setHourFrom("");
    setAttachmentFile(null);
    setAttachmentError("");
  }, []);

  return {
    acceptedFormats,
    attachmentError,
    attachmentFile,
    buildRequestFields,
    durationUnit,
    handleAttachmentSelected,
    handleHourFromChange,
    handleHoursChange,
    handleRemoveAttachment,
    handleSelectDurationUnit,
    hourFrom,
    hours,
    maxBytes,
    maxHours,
    reset,
    resetForType,
    validate,
  };
};
