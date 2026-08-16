import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Briefcase, MapPin, CalendarClock, Upload, FileText, X, CheckCircle2,
  AlertCircle, Loader2, Send,
} from "lucide-react";
import {
  fetchApplyLinkInfo, submitApplication, PublicApiError,
  type ApplyLinkInfo, type ApplySubmitResult,
} from "@/features/recruitment/api/publicApi";
import { LanguageSwitcher } from "@/app/providers";
import { getLanguageDirection, normalizeLanguage } from "@/i18n";
import { arabicSource } from "@/i18n/source";

/**
 * Candidate-facing application page. Rendered outside the auth gate — no token,
 * no sidebar, mobile-first, because candidates arrive from a shared link
 * (usually on a phone) and are not users of the HR system.
 */

const ACCEPTED = ".pdf,.doc,.docx,.txt,.rtf";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(((reader.result as string) || "").split(",").pop() || "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const ERROR_KEYS: Record<string, Parameters<typeof arabicSource>[0]> = {
  file_too_large: "apply.error_file_too_large",
  file_type: "apply.error_file_type",
  rate_limited: "apply.error_rate_limited",
};

export function PublicApply() {
  const { token = "" } = useParams();
  const [info, setInfo] = useState<ApplyLinkInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [result, setResult] = useState<ApplySubmitResult | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    job_opening_id: "",
    name: "",
    email: "",
    phone: "",
    city: "",
    expected_salary: "",
    consent: false,
    hp: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const data = await fetchApplyLinkInfo(token);
      setInfo(data);
      if (data.link_scope === "job" && data.job) {
        setForm(f => ({ ...f, job_opening_id: String(data.job!.id) }));
      }
    } catch (e) {
      setLoadError(e instanceof PublicApiError ? e.code : "invalid_link");
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const maxBytes = (info?.max_resume_mb || 10) * 1024 * 1024;

  const selectedJob = useMemo(() => {
    if (!info) return null;
    if (info.link_scope === "job") return info.job;
    return info.open_positions.find(j => String(j.id) === form.job_opening_id) || null;
  }, [info, form.job_opening_id]);

  const acceptFile = useCallback((picked: File | null) => {
    setSubmitError("");
    if (!picked) return;
    const name = picked.name.toLowerCase();
    if (!ACCEPTED.split(",").some(ext => name.endsWith(ext))) {
      setSubmitError(arabicSource("apply.error_file_type"));
      return;
    }
    if (picked.size > maxBytes) {
      setSubmitError(arabicSource("apply.error_file_too_large"));
      return;
    }
    setFile(picked);
  }, [maxBytes]);

  const canSubmit =
    Boolean(form.name.trim() && form.email.trim() && form.phone.trim() && file && form.consent)
    && (info?.link_scope === "job" || Boolean(form.job_opening_id));

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
    } catch (e) {
      const code = e instanceof PublicApiError ? e.code : "";
      const messageKey = ERROR_KEYS[code];
      setSubmitError(
        messageKey ? arabicSource(messageKey)
          : (e instanceof PublicApiError && e.message) || arabicSource("apply.error_generic"),
      );
    }
    setSubmitting(false);
  }, [canSubmit, file, form, submitting, token]);

  /* ── states ── */

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span style={{ fontSize: 14 }}>{arabicSource("apply.loading")}</span>
        </div>
      </Shell>
    );
  }

  if (loadError || !info) {
    return (
      <Shell>
        <Notice
          tone="error"
          title={arabicSource("apply.invalid_link_title")}
          body={arabicSource("apply.invalid_link_body")}
        />
      </Shell>
    );
  }

  if (info.unusable_reason) {
    return (
      <Shell>
        <Notice
          tone="error"
          title={arabicSource("apply.closed_title")}
          body={arabicSource("apply.closed_body")}
        />
      </Shell>
    );
  }

  if (result) {
    return (
      <Shell>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center"
        >
          <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-foreground mb-2" style={{ fontSize: 20 }}>
            {arabicSource("apply.success_title")}
          </h2>
          <p className="text-muted-foreground mb-5" style={{ fontSize: 14 }}>
            {result.resubmitted
              ? arabicSource("apply.resubmitted_body")
              : arabicSource("apply.success_body")}
          </p>
          <div className="inline-flex flex-col items-center gap-1 rounded-xl border border-border bg-muted/10 px-6 py-4">
            <span className="text-muted-foreground" style={{ fontSize: 11 }}>
              {arabicSource("apply.reference")}
            </span>
            <span className="text-primary" style={{ fontSize: 20, letterSpacing: 1 }} dir="ltr">
              {result.reference_code}
            </span>
          </div>
          <div>
            <button
              onClick={() => { setResult(null); setFile(null); setForm(f => ({ ...f, name: "", email: "", phone: "", city: "", expected_salary: "", consent: false })); }}
              className="mt-6 px-5 py-2.5 rounded-lg border border-border text-foreground hover:bg-muted/20 transition-colors cursor-pointer"
              style={{ fontSize: 13 }}
            >
              {arabicSource("apply.apply_another")}
            </button>
          </div>
        </motion.div>
      </Shell>
    );
  }

  /* ── form ── */

  return (
    <Shell companyName={info.company_name}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
        <div>
          <h1 className="text-foreground" style={{ fontSize: 22 }}>{arabicSource("apply.title")}</h1>
          <p className="text-muted-foreground mt-1" style={{ fontSize: 13 }}>
            {arabicSource("apply.subtitle")}
          </p>
        </div>

        {selectedJob && (
          <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-2">
            <div className="flex items-start gap-2">
              <Briefcase className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
              <div>
                <div className="text-foreground" style={{ fontSize: 16 }}>{selectedJob.title}</div>
                <div className="text-muted-foreground flex flex-wrap items-center gap-3 mt-1" style={{ fontSize: 12 }}>
                  {selectedJob.department && <span>{selectedJob.department}</span>}
                  {selectedJob.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{selectedJob.location}
                    </span>
                  )}
                  {selectedJob.deadline && (
                    <span className="flex items-center gap-1">
                      <CalendarClock className="w-3 h-3" />
                      {arabicSource("apply.deadline_label")}: <span dir="ltr">{selectedJob.deadline}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            {selectedJob.description && (
              <p className="text-muted-foreground whitespace-pre-line" style={{ fontSize: 12.5 }}>
                {selectedJob.description}
              </p>
            )}
            {Boolean(selectedJob.requirements?.length) && (
              <div>
                <div className="text-muted-foreground mb-1.5" style={{ fontSize: 11 }}>
                  {arabicSource("apply.requirements_label")}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedJob.requirements!.map((req, i) => (
                    <span key={i} className="px-2 py-1 rounded-md bg-muted/20 border border-border/40 text-foreground"
                      style={{ fontSize: 11 }}>
                      {req}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {info.link_scope === "all_open" && (
          <Field label={arabicSource("apply.select_position")} required>
            <select
              value={form.job_opening_id}
              onChange={e => setForm({ ...form, job_opening_id: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none cursor-pointer"
              style={{ fontSize: 14 }}
            >
              <option value="">{arabicSource("apply.select_position_placeholder")}</option>
              {info.open_positions.map(job => (
                <option key={job.id} value={job.id}>
                  {job.title}{job.department ? ` — ${job.department}` : ""}
                </option>
              ))}
            </select>
          </Field>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={arabicSource("apply.full_name")} required>
            <Input value={form.name} onChange={v => setForm({ ...form, name: v })} />
          </Field>
          <Field label={arabicSource("common.email")} required>
            <Input value={form.email} onChange={v => setForm({ ...form, email: v })} type="email" dir="ltr" />
          </Field>
          <Field label={arabicSource("common.phone_number")} required>
            <Input value={form.phone} onChange={v => setForm({ ...form, phone: v })} type="tel" dir="ltr" />
          </Field>
          <Field label={arabicSource("common.city")}>
            <Input value={form.city} onChange={v => setForm({ ...form, city: v })} />
          </Field>
          <Field label={arabicSource("apply.expected_salary")}>
            <Input value={form.expected_salary} onChange={v => setForm({ ...form, expected_salary: v })}
              type="number" dir="ltr" />
          </Field>
        </div>

        {/* CV upload */}
        <Field label={arabicSource("apply.cv")} required>
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); acceptFile(e.dataTransfer.files?.[0] || null); }}
            onClick={() => fileInputRef.current?.click()}
            className={`rounded-xl border-2 border-dashed px-5 py-8 text-center cursor-pointer transition-colors ${
              dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
          >
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-5 h-5 text-primary" />
                <span className="text-foreground" style={{ fontSize: 13 }} dir="ltr">{file.name}</span>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); setFile(null); }}
                  aria-label={arabicSource("apply.remove_file")}
                  className="p-1 rounded-md hover:bg-destructive/10 text-destructive cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-7 h-7 text-primary mx-auto mb-2" />
                <div className="text-foreground" style={{ fontSize: 13 }}>{arabicSource("apply.cv_hint")}</div>
                <div className="text-muted-foreground mt-1" style={{ fontSize: 11 }}>
                  {arabicSource("apply.cv_formats")} — {info.max_resume_mb} MB
                </div>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED}
              className="hidden"
              onChange={e => acceptFile(e.target.files?.[0] || null)}
            />
          </div>
        </Field>

        {/* Honeypot — hidden from humans, catches naive bots */}
        <input
          type="text"
          value={form.hp}
          onChange={e => setForm({ ...form, hp: e.target.value })}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.consent}
            onChange={e => setForm({ ...form, consent: e.target.checked })}
            className="mt-0.5 w-4 h-4 accent-current text-primary cursor-pointer"
          />
          <span className="text-muted-foreground" style={{ fontSize: 12.5 }}>
            {arabicSource("apply.consent")}
          </span>
        </label>

        {submitError && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span style={{ fontSize: 12.5 }}>{submitError}</span>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground hover:bg-gold-dark transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ fontSize: 15 }}
        >
          {submitting
            ? <><Loader2 className="w-4 h-4 animate-spin" />{arabicSource("apply.submitting")}</>
            : <><Send className="w-4 h-4" />{arabicSource("apply.submit")}</>}
        </button>
      </motion.div>
    </Shell>
  );
}

/* ──────── Presentational helpers ──────── */

function Shell({ children, companyName }: { children: React.ReactNode; companyName?: string }) {
  const { i18n } = useTranslation();
  // Candidates are not system users and arrive with no stored preference, so
  // the page must offer the language choice itself. Direction follows that
  // choice — hardcoding rtl leaves the English form reading right-to-left.
  const direction = getLanguageDirection(
    normalizeLanguage(i18n.resolvedLanguage ?? i18n.language),
  );
  return (
    <div className="min-h-screen bg-background px-4 py-8" dir={direction}>
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="text-primary" style={{ fontSize: 14 }}>{companyName || ""}</span>
          <LanguageSwitcher />
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">{children}</div>
      </div>
    </div>
  );
}

function Notice({ tone, title, body }: { tone: "error" | "info"; title: string; body: string }) {
  const color = tone === "error" ? "text-destructive" : "text-primary";
  return (
    <div className="py-10 text-center">
      <AlertCircle className={`w-12 h-12 mx-auto mb-4 ${color}`} />
      <h2 className="text-foreground mb-2" style={{ fontSize: 18 }}>{title}</h2>
      <p className="text-muted-foreground" style={{ fontSize: 13 }}>{body}</p>
    </div>
  );
}

function Field({ label, required, children }: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-muted-foreground block mb-1.5" style={{ fontSize: 12 }}>
        {label}{required && <span className="text-destructive"> *</span>}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, type = "text", dir }: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  dir?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      dir={dir}
      onChange={e => onChange(e.target.value)}
      className="w-full px-4 py-3 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none"
      style={{ fontSize: 14 }}
    />
  );
}
