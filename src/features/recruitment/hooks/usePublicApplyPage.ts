import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useParams } from "react-router";
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
  const [info, setInfo] = useState<ApplyLinkInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [result, setResult] = useState<ApplySubmitResult | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [form, setForm] = useState<PublicApplyForm>(initialForm);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { token = "" } = useParams();

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

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const data = await fetchApplyLinkInfo(token);
      setInfo(data);
      if (data.link_scope === "job" && data.job) {
        setForm((current) => ({ ...current, job_opening_id: String(data.job!.id) }));
      }
    } catch (error) {
      setLoadError(error instanceof PublicApiError ? error.code : "invalid_link");
    }
    setLoading(false);
  }, [token]);

  const updateForm = useCallback((patch: Partial<PublicApplyForm>) => {
    setForm((current) => ({ ...current, ...patch }));
  }, []);

  const resetForAnotherApplication = useCallback(() => {
    setResult(null);
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
  }, []);

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
    if (!file || !canSubmit || submitting) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const payload = await submitApplication({
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
      setResult(payload);
    } catch (error) {
      const code = error instanceof PublicApiError ? error.code : "";
      const messageKey = publicApplyErrorKeys[code];
      setSubmitError(
        messageKey ? arabicSource(messageKey)
          : (error instanceof PublicApiError && error.message) || arabicSource("apply.error_generic"),
      );
    }
    setSubmitting(false);
  }, [canSubmit, file, form, submitting, token]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    acceptFile,
    canSubmit,
    dragging,
    file,
    fileInputRef,
    form,
    handleSubmit,
    info,
    loadError,
    loading,
    maxResumeMb: info?.max_resume_mb || 10,
    resetForAnotherApplication,
    result,
    selectedJob,
    setDragging,
    setFile,
    submitError,
    submitting,
    updateForm,
  };
};
