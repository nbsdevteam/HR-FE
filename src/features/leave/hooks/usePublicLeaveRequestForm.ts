import { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { arabicSource } from "@/i18n/source";
import { fileToBase64 } from "@/shared/utils/fileToBase64";
import { todayInBaghdad } from "@/shared/utils/timezone";
import { submitPublicLeaveRequest } from "../api/publicLeaveApi";
import { publicLeaveErrorMessage } from "../utils/publicLeaveErrorMessage";
import type { PublicLeaveRequestFormState, PublicLeaveSubmitResult } from "../types/publicLeave";

const initialForm: PublicLeaveRequestFormState = {
  leave_type_id: null,
  date_from: todayInBaghdad(),
  date_to: "",
  reason: "",
  half_day: false,
  duration_unit: "day",
  hours: "",
  hour_from: "",
  hp: "",
};

interface SubmitVars {
  employeeId: number;
  verification: string | undefined;
  leaveTypeId: number;
}

export const usePublicLeaveRequestForm = (token: string) => {
  const [form, setForm] = useState<PublicLeaveRequestFormState>(initialForm);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [submitError, setSubmitError] = useState("");

  const submitMutation = useMutation<PublicLeaveSubmitResult, Error, SubmitVars>({
    mutationFn: async ({ employeeId, verification, leaveTypeId }) => {
      const attachment = file
        ? { file_name: file.name, file_data: await fileToBase64(file) }
        : undefined;
      const isHourly = form.duration_unit === "hour";
      return submitPublicLeaveRequest({
        token,
        employee_id: employeeId,
        ...(verification !== undefined ? { verification } : {}),
        leave_type_id: leaveTypeId,
        date_from: form.date_from,
        date_to: isHourly ? form.date_from : (form.date_to || form.date_from),
        reason: form.reason.trim(),
        half_day: form.half_day,
        duration_unit: form.duration_unit,
        hours: isHourly ? (Number(form.hours) || null) : null,
        hour_from: isHourly && form.hour_from ? Number(form.hour_from) : null,
        attachment,
        hp: form.hp,
      });
    },
    retry: false,
  });

  const updateForm = useCallback((patch: Partial<PublicLeaveRequestFormState>) => {
    setForm((current) => ({ ...current, ...patch }));
  }, []);

  const acceptFile = useCallback((picked: File | null, acceptedFormats: string[], maxBytes: number) => {
    setFileError("");
    if (!picked) {
      setFile(null);
      return;
    }
    const name = picked.name.toLowerCase();
    if (acceptedFormats.length && !acceptedFormats.some((ext) => name.endsWith(ext.toLowerCase()))) {
      setFileError(arabicSource("public_leave.error_attachment_file_type"));
      return;
    }
    if (maxBytes && picked.size > maxBytes) {
      setFileError(`${arabicSource("public_leave.error_attachment_too_large")} ${Math.round(maxBytes / (1024 * 1024))} MB`);
      return;
    }
    setFile(picked);
  }, []);

  const reset = useCallback(() => {
    setForm(initialForm);
    setFile(null);
    setFileError("");
    setSubmitError("");
    submitMutation.reset();
  }, [submitMutation.reset]);

  const submit = useCallback(async (
    employeeId: number,
    verification: string | undefined,
    leaveTypeId: number,
  ): Promise<boolean> => {
    setSubmitError("");
    try {
      await submitMutation.mutateAsync({ employeeId, verification, leaveTypeId });
      return true;
    } catch (error) {
      setSubmitError(publicLeaveErrorMessage(error, arabicSource("public_leave.error_generic")));
      return false;
    }
  }, [submitMutation.mutateAsync]);

  return {
    acceptFile,
    file,
    fileError,
    form,
    reset,
    result: submitMutation.data ?? null,
    submit,
    submitError,
    submitting: submitMutation.isPending,
    updateForm,
  };
};
