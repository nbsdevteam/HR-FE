import { motion } from "motion/react";
import { AlertCircle, Loader2, Send } from "lucide-react";
import { Select } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { ApplyLinkInfo } from "@/features/recruitment/api/publicApi";
import type { PublicApplyForm as PublicApplyFormState } from "../types";
import PublicApplyField from "./PublicApplyField";
import PublicApplyInput from "./PublicApplyInput";
import PublicApplyJobSummary from "./PublicApplyJobSummary";
import PublicApplyUpload from "./PublicApplyUpload";

type PublicApplyFormProps = {
  acceptFile: (file: File | null) => void;
  canSubmit: boolean;
  dragging: boolean;
  file: File | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  form: PublicApplyFormState;
  info: ApplyLinkInfo;
  maxResumeMb: number;
  selectedJob: ApplyLinkInfo["job"];
  submitError: string;
  submitting: boolean;
  onDraggingChange: (dragging: boolean) => void;
  onFileChange: (file: File | null) => void;
  onSubmit: () => void;
  onUpdateForm: (patch: Partial<PublicApplyFormState>) => void;
};

const PublicApplyForm = ({
  acceptFile,
  canSubmit,
  dragging,
  file,
  fileInputRef,
  form,
  info,
  maxResumeMb,
  selectedJob,
  submitError,
  submitting,
  onDraggingChange,
  onFileChange,
  onSubmit,
  onUpdateForm,
}: PublicApplyFormProps) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
    <div>
      <h1 className="text-foreground" style={{ fontSize: 22 }}>{arabicSource("apply.title")}</h1>
      <p className="text-muted-foreground mt-1" style={{ fontSize: 13 }}>
        {arabicSource("apply.subtitle")}
      </p>
    </div>

    {selectedJob && <PublicApplyJobSummary job={selectedJob} />}

    {info.link_scope === "all_open" && (
      <PublicApplyField label={arabicSource("apply.select_position")} required>
        <Select
          value={form.job_opening_id}
          onChange={(event) => onUpdateForm({ job_opening_id: event.target.value })}
          className="w-full px-4 py-3 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none cursor-pointer"
          style={{ fontSize: 14 }}
        >
          <option value="">{arabicSource("apply.select_position_placeholder")}</option>
          {info.open_positions.map((job) => (
            <option key={job.id} value={job.id}>
              {job.title}{job.department ? ` — ${job.department}` : ""}
            </option>
          ))}
        </Select>
      </PublicApplyField>
    )}

    <div className="grid gap-4 sm:grid-cols-2">
      <PublicApplyField label={arabicSource("apply.full_name")} required>
        <PublicApplyInput value={form.name} onChange={(value) => onUpdateForm({ name: value })} />
      </PublicApplyField>
      <PublicApplyField label={arabicSource("common.email")} required>
        <PublicApplyInput value={form.email} onChange={(value) => onUpdateForm({ email: value })} type="email" dir="ltr" />
      </PublicApplyField>
      <PublicApplyField label={arabicSource("common.phone_number")} required>
        <PublicApplyInput value={form.phone} onChange={(value) => onUpdateForm({ phone: value })} type="tel" dir="ltr" />
      </PublicApplyField>
      <PublicApplyField label={arabicSource("common.city")}>
        <PublicApplyInput value={form.city} onChange={(value) => onUpdateForm({ city: value })} />
      </PublicApplyField>
      <PublicApplyField label={arabicSource("apply.expected_salary")}>
        <PublicApplyInput value={form.expected_salary} onChange={(value) => onUpdateForm({ expected_salary: value })} type="number" dir="ltr" />
      </PublicApplyField>
    </div>

    <PublicApplyField label={arabicSource("apply.cv")} required>
      <PublicApplyUpload
        dragging={dragging}
        file={file}
        fileInputRef={fileInputRef}
        maxResumeMb={maxResumeMb}
        onAcceptFile={acceptFile}
        onDraggingChange={onDraggingChange}
        onFileChange={onFileChange}
      />
    </PublicApplyField>

    <input
      type="text"
      value={form.hp}
      onChange={(event) => onUpdateForm({ hp: event.target.value })}
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
      className="hidden"
    />

    <label className="flex items-start gap-2.5 cursor-pointer">
      <input
        type="checkbox"
        checked={form.consent}
        onChange={(event) => onUpdateForm({ consent: event.target.checked })}
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
      onClick={onSubmit}
      disabled={!canSubmit || submitting}
      className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground hover:bg-gold-dark transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      style={{ fontSize: 15 }}
    >
      {submitting
        ? <><Loader2 className="w-4 h-4 animate-spin" />{arabicSource("apply.submitting")}</>
        : <><Send className="w-4 h-4" />{arabicSource("apply.submit")}</>}
    </button>
  </motion.div>
);

export default PublicApplyForm;
