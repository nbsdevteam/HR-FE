import { useState, useRef, useCallback, useMemo, memo } from "react";
import { UserPlus, X, FileCheck } from "lucide-react";
import * as odooData from "@/shared/api/odooData";
import { Button, ModalOverlay } from "@/shared/components";
import {
  type DbJobOpening,
  type DbApplicant,
  useOdooMutation,
} from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { GENDER_TO_ODOO, STAGE_TO_ODOO } from "../constants/recruitment";
import { fileToBase64 } from "../utils/fileToBase64";
import ApplicantFormBasicSection from "./ApplicantFormBasicSection";
import ApplicantFormContactSection from "./ApplicantFormContactSection";
import ApplicantFormQualificationsSection from "./ApplicantFormQualificationsSection";
import ApplicantFormResumeSection from "./ApplicantFormResumeSection";
import ApplicantFormSalarySection from "./ApplicantFormSalarySection";

const ApplicantFormModal = ({
  jobs,
  editingApplicant,
  onClose,
  onSaved,
}: {
  jobs: DbJobOpening[];
  editingApplicant: DbApplicant | null;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const isEdit = !!editingApplicant;
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [pendingResumeFile, setPendingResumeFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    name: editingApplicant?.name || "",
    email: editingApplicant?.email || "",
    phone: editingApplicant?.phone || "",
    job_opening_id: editingApplicant?.job_opening_id || jobs[0]?.id || "",
    stage: editingApplicant?.stage || arabicSource("common.introduction"),
    rating: editingApplicant?.rating || 0,
    skills: (editingApplicant?.skills || []).join(", "),
    experience_years: editingApplicant?.experience_years || 0,
    education: editingApplicant?.education || "",
    current_company: editingApplicant?.current_company || "",
    city: editingApplicant?.city || arabicSource("common.baghdad"),
    gender: editingApplicant?.gender || "",
    source: editingApplicant?.source || arabicSource("common.live"),
    expected_salary: editingApplicant?.expected_salary || "",
    salary_currency: editingApplicant?.salary_currency || "IQD",
    notes: editingApplicant?.notes || "",
    resume_url: editingApplicant?.resume_url || "",
  });
  const saveApplicantMutation = useOdooMutation<string | number | undefined, void>(
    async () => {
      const skillsArr = form.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const odooPayload: Record<string, unknown> = {
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        job_opening_id: form.job_opening_id,
        stage: STAGE_TO_ODOO[form.stage] || form.stage,
        rating: form.rating,
        skills: skillsArr.length > 0 ? skillsArr : [],
        experience_years: Number(form.experience_years) || 0,
        education: form.education || null,
        current_company: form.current_company || null,
        city: form.city || null,
        gender: form.gender ? GENDER_TO_ODOO[form.gender] || form.gender : null,
        source: form.source || "مباشر",
        expected_salary: form.expected_salary
          ? Number(form.expected_salary)
          : null,
        salary_currency: form.salary_currency || "IQD",
        notes: form.notes || null,
      };
      let applicantId: string | number | undefined;
      if (isEdit) {
        await odooData.updateApplicant(editingApplicant!.id, odooPayload);
        applicantId = editingApplicant!.id;
      } else {
        const res: any = await odooData.createApplicant(odooPayload);
        applicantId = res?.id;
      }
      if (pendingResumeFile && applicantId) {
        const base64 = await fileToBase64(pendingResumeFile);
        await odooData.uploadApplicantResume(
          applicantId,
          base64,
          pendingResumeFile.name,
        );
      }
      return applicantId;
    },
    isEdit ? "applicants" : ["applicants", "jobOpenings"],
  );
  const fileRef = useRef<HTMLInputElement>(null);

  const openJobs = useMemo(
    () =>
      jobs.filter(
        (j) =>
          j.status === arabicSource("common.is_open") ||
          j.status === arabicSource("common.is_under_review"),
      ),
    [jobs],
  );

  const handleFieldChange = useCallback(
    (field: string, value: string | number) =>
      setForm((prev) => ({ ...prev, [field]: value })),
    [],
  );
  const handleRatingChange = useCallback(
    (r: number) => setForm((prev) => ({ ...prev, rating: r })),
    [],
  );

  const handleFileUpload = useCallback((file: File) => {
    setUploading(true);
    setUploadError("");

    // Odoo's upload endpoint requires an existing applicant id, so we
    // stage the file and upload it right after create/update succeeds.
    setPendingResumeFile(file);
    setForm((prev) => ({ ...prev, resume_url: "pending" }));
    setUploading(false);
  }, []);

  const handleSave = useCallback(async (): Promise<void> => {
    if (!form.name.trim() || !form.job_opening_id) return;
    try {
      await saveApplicantMutation.mutateAsync();
      onSaved();
    } catch (e: any) {
      setUploadError(e.message || "فشل الحفظ");
    }
  }, [form.name, form.job_opening_id, saveApplicantMutation, onSaved]);

  return (
    <ModalOverlay
      onClose={onClose}
      overlayClassName="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
      contentClassName="fixed inset-y-0 end-0 w-full max-w-2xl bg-card border-s border-border shadow-2xl flex flex-col"
      contentMotionProps={{
        initial: { x: "100%" },
        animate: { x: 0 },
        exit: { x: "100%" },
        transition: { type: "spring", stiffness: 300, damping: 30 },
      }}
    >
      {/* ── Sticky Header ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-card/95 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-foreground">
              {isEdit
                ? arabicSource("recruitment.modify_applicant_data")
                : arabicSource("recruitment.add_a_new_applicant")}
            </h2>
            <p className="text-muted-foreground" style={{ fontSize: 12 }}>
              {arabicSource(
                "recruitment.enter_all_the_data_required_for_the_candidate",
              )}
            </p>
          </div>
        </div>
        <Button
          onClick={onClose}
          variant="unstyled"
          size="icon"
          rounded="rounded-lg"
          className="hover:bg-secondary"
          icon={X}
          iconClassName="w-5 h-5 text-muted-foreground"
        />
      </div>

      {/* ── Scrollable Body ── */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        <ApplicantFormBasicSection
          name={form.name}
          jobOpeningId={form.job_opening_id}
          gender={form.gender}
          city={form.city}
          openJobs={openJobs}
          onFieldChange={handleFieldChange}
        />

        <ApplicantFormContactSection
          email={form.email}
          phone={form.phone}
          onFieldChange={handleFieldChange}
        />

        <ApplicantFormQualificationsSection
          education={form.education}
          experienceYears={form.experience_years}
          currentCompany={form.current_company}
          source={form.source}
          skills={form.skills}
          onFieldChange={handleFieldChange}
        />

        <ApplicantFormSalarySection
          expectedSalary={form.expected_salary}
          salaryCurrency={form.salary_currency}
          rating={form.rating}
          stage={form.stage}
          onFieldChange={handleFieldChange}
          onRatingChange={handleRatingChange}
        />

        <ApplicantFormResumeSection
          resumeUrl={form.resume_url}
          notes={form.notes}
          uploading={uploading}
          uploadError={uploadError}
          fileRef={fileRef}
          onFileSelected={handleFileUpload}
          onFieldChange={handleFieldChange}
        />
      </div>

      {/* ── Sticky Footer ── */}
      <div className="px-6 py-4 border-t border-border/40 bg-card/95 backdrop-blur-sm flex-shrink-0">
        <div className="flex gap-3">
          <Button
            variant="primary"
            rounded="rounded-xl"
            icon={FileCheck}
            loading={saveApplicantMutation.isPending}
            onClick={handleSave}
            disabled={
              saveApplicantMutation.isPending ||
              !form.name.trim() ||
              !form.job_opening_id
            }
            className="flex-1 h-12 shadow-lg shadow-primary/20"
            style={{ fontSize: 14 }}
          >
            {saveApplicantMutation.isPending
              ? arabicSource("common.saving")
              : isEdit
                ? arabicSource("recruitment.update_data")
                : arabicSource("recruitment.add_advanced")}
          </Button>
          <Button
            onClick={onClose}
            variant="unstyled"
            size="unstyled"
            rounded="rounded-xl"
            className="px-6 h-12 border-2 border-border text-foreground hover:bg-secondary"
            style={{ fontSize: 14 }}
          >
            {arabicSource("common.cancel")}
          </Button>
        </div>
      </div>
    </ModalOverlay>
  );
};

export default memo(ApplicantFormModal);
