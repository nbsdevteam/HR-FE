import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useParams } from "react-router";
import { useMutation, useQuery, type Query } from "@tanstack/react-query";
import {
  fetchApplyJob,
  fetchApplyLinkInfo,
  PublicApiError,
  submitApplication,
  type ApplyLinkInfo,
  type ApplySubmitResult,
  type PublicJob,
} from "@/features/recruitment/api/publicApi";
import { arabicSource } from "@/i18n/source";
import { useAppLanguage } from "@/i18n/useLocalizedName";
import { acceptedResumeTypes, publicApplyErrorKeys } from "../constants/publicApply";
import type { PublicApplyForm } from "../types";
import { fileToBase64 } from "../utils/fileToBase64";

/** Stop polling a "pending" translation after this many completed fetches (initial + retries). */
const MAX_TRANSLATION_POLL_ATTEMPTS = 3;
const TRANSLATION_POLL_INTERVAL_MS = 5000;

function pendingTranslationRefetchInterval<TData extends { job?: PublicJob | null }>(
  query: Query<TData, Error>,
): number | false {
  if (query.state.data?.job?.translation_status !== "pending") return false;
  return query.state.dataUpdateCount < MAX_TRANSLATION_POLL_ATTEMPTS ? TRANSLATION_POLL_INTERVAL_MS : false;
}

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
  const language = useAppLanguage();

  // No retry: a bad/expired link will never succeed on a second try.
  // `language` is part of the key so switching it re-fetches instead of
  // serving the previous language's cached payload.
  const infoQuery = useQuery<ApplyLinkInfo, Error>({
    queryKey: ["publicApplyLinkInfo", token, language],
    queryFn: () => fetchApplyLinkInfo(token, language),
    retry: false,
    refetchInterval: pendingTranslationRefetchInterval,
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

  // `all_open` links carry no per-position description in `open_positions`,
  // so the picked position's Job Description is fetched separately.
  const pickedJobId = form.job_opening_id ? Number(form.job_opening_id) : null;
  const jobQuery = useQuery<{ job: PublicJob }, Error>({
    queryKey: ["publicApplyJob", token, pickedJobId, language],
    queryFn: () => fetchApplyJob(token, pickedJobId!, language),
    enabled: info?.link_scope === "all_open" && Boolean(pickedJobId),
    retry: false,
    refetchInterval: pendingTranslationRefetchInterval,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxBytes = useMemo(() => (info?.max_resume_mb || 10) * 1024 * 1024, [info?.max_resume_mb]);

  // While `jobQuery` is in flight, fall back to the light `open_positions`
  // row so the title/department stay visible instead of blanking the card.
  const selectedJob = useMemo(() => {
    if (!info) return null;
    if (info.link_scope === "job") return info.job;
    return jobQuery.data?.job
      ?? info.open_positions.find((job) => String(job.id) === form.job_opening_id)
      ?? null;
  }, [form.job_opening_id, info, jobQuery.data]);

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
