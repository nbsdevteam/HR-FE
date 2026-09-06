import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useParams } from "react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  fetchApplyLinkInfo,
  PublicApiError,
  submitApplication,
  type ApplyLinkInfo,
  type ApplySubmitResult,
} from "@/features/recruitment/api/publicApi";
import { arabicSource } from "@/i18n/source";
import { acceptedResumeTypes, publicApplyErrorKeys } from "../constants/publicApply";
import type { PublicApplyForm } from "../types";
import { fileToBase64 } from "../utils/fileToBase64";

const initialForm: PublicApplyForm = {
  job_opening_id: "",
  name: "",
  email: "",
  phone: "",
  city: "",
  expected_salary: "",
  consent: false,
  hp: "",
};

export const usePublicApplyPage = () => {
  const [submitError, setSubmitError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [form, setForm] = useState<PublicApplyForm>(initialForm);

  const { token = "" } = useParams();

  // No retry: a bad/expired link will never succeed on a second try.
  const infoQuery = useQuery<ApplyLinkInfo, Error>({
    queryKey: ["publicApplyLinkInfo", token],
    queryFn: () => fetchApplyLinkInfo(token),
    retry: false,
  });
  const info = infoQuery.data ?? null;

  const submitMutation = useMutation<ApplySubmitResult, Error, void>({
    mutationFn: async () => {
      if (!file) throw new Error("No file selected");
      return submitApplication({
        token,
        job_opening_id: form.job_opening_id ? Number(form.job_opening_id) : null,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        expected_salary: form.expected_salary ? Number(form.expected_salary) : null,
        file_name: file.name,
        file_data: await fileToBase64(file),
        consent: form.consent,
        hp: form.hp,
      });
    },
    retry: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxBytes = useMemo(() => (info?.max_resume_mb || 10) * 1024 * 1024, [info?.max_resume_mb]);

  const selectedJob = useMemo(() => {
    if (!info) return null;
    if (info.link_scope === "job") return info.job;
    return info.open_positions.find((job) => String(job.id) === form.job_opening_id) || null;
  }, [form.job_opening_id, info]);

  const canSubmit = useMemo(() => (
    Boolean(form.name.trim() && form.email.trim() && form.phone.trim() && file && form.consent)
    && (info?.link_scope === "job" || Boolean(form.job_opening_id))
  ), [file, form, info?.link_scope]);

  const updateForm = useCallback((patch: Partial<PublicApplyForm>) => {
    setForm((current) => ({ ...current, ...patch }));
  }, []);

  const resetForAnotherApplication = useCallback(() => {
    submitMutation.reset();
    setFile(null);
    setForm((current) => ({
      ...current,
      name: "",
      email: "",
      phone: "",
      city: "",
      expected_salary: "",
      consent: false,
    }));
  }, [submitMutation.reset]);

  const acceptFile = useCallback((picked: File | null) => {
    setSubmitError("");
    if (!picked) return;
    const name = picked.name.toLowerCase();
    if (!acceptedResumeTypes.split(",").some((extension) => name.endsWith(extension))) {
      setSubmitError(arabicSource("apply.error_file_type"));
      return;
    }
    if (picked.size > maxBytes) {
      setSubmitError(arabicSource("apply.error_file_too_large"));
      return;
    }
    setFile(picked);
  }, [maxBytes]);

  const handleSubmit = useCallback(async () => {
    if (!file || !canSubmit || submitMutation.isPending) return;
    setSubmitError("");
    try {
      await submitMutation.mutateAsync();
    } catch (error) {
      const code = error instanceof PublicApiError ? error.code : "";
      const messageKey = publicApplyErrorKeys[code];
      setSubmitError(
        messageKey ? arabicSource(messageKey)
          : (error instanceof PublicApiError && error.message) || arabicSource("apply.error_generic"),
      );
    }
  }, [canSubmit, file, submitMutation]);

  useEffect(() => {
    if (info?.link_scope === "job" && info.job) {
      setForm((current) => ({ ...current, job_opening_id: String(info.job!.id) }));
    }
  }, [info]);

  return {
    acceptFile,
    canSubmit,
    dragging,
    file,
    fileInputRef,
    form,
    handleSubmit,
    info,
    loadError: infoQuery.error ? (infoQuery.error instanceof PublicApiError ? infoQuery.error.code : "invalid_link") : "",
    loading: infoQuery.isFetching,
    maxResumeMb: info?.max_resume_mb || 10,
    resetForAnotherApplication,
    result: submitMutation.data ?? null,
    selectedJob,
    setDragging,
    setFile,
    submitError,
    submitting: submitMutation.isPending,
    updateForm,
  };
};
