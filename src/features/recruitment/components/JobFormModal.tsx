import { useState, useCallback, memo } from "react";
import * as odooData from "@/shared/api/odooData";
import { Button, Modal } from "@/shared/components";
import {
  type DbJobOpening,
  type JobSkillRequirement,
  useDepartments,
  useOdooMutation,
} from "@/shared/hooks";
import { localizedAlert } from "@/i18n/native";
import { arabicSource } from "@/i18n/source";
import { JOB_STATUS_TO_ODOO, JOB_TYPE_TO_ODOO } from "../constants/recruitment";
import JobFormFieldsSection from "./JobFormFieldsSection";
import JobScreeningSpecFields from "./JobScreeningSpecFields";

const JobFormModal = ({
  editingJob,
  onClose,
  onSaved,
}: {
  editingJob: DbJobOpening | null;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const isEdit = !!editingJob;
  const [form, setForm] = useState({
    title: editingJob?.title || "",
    department:
      editingJob?.department || arabicSource("common.information_technology"),
    location: editingJob?.location || arabicSource("common.baghdad"),
    // `jobs` carries Arabic labels, so an editing job's type/status arrive
    // already translated and map straight onto the selects.
    type: editingJob?.type || arabicSource("common.full_time"),
    status: editingJob?.status || "مفتوح",
    deadline: editingJob?.deadline || "",
    description: editingJob?.description || "",
    salary_range: editingJob?.salary_range || "",
    requirements: (editingJob?.requirements || []).join("\n"),
    // AI screening spec — what the Initial Rating is computed against
    min_experience_years: editingJob?.min_experience_years ?? 0,
    education_level: editingJob?.education_level || "none",
    ir_auto_shortlist: editingJob?.ir_auto_shortlist ?? 0,
  });
  const [requiredSkills, setRequiredSkills] = useState<JobSkillRequirement[]>(
    editingJob?.required_skills || [],
  );
  const [niceToHave, setNiceToHave] = useState<JobSkillRequirement[]>(
    editingJob?.nice_to_have_skills || [],
  );
  const { departments: odooDepartments } = useDepartments();
  const saveJobMutation = useOdooMutation<unknown, void>(
    () => {
      const reqs = form.requirements
        .split("\n")
        .map((r) => r.trim())
        .filter(Boolean);

      const dept = odooDepartments.find((d) => d.name === form.department);
      const payload = {
        title: form.title,
        department_id: dept?.id || undefined,
        location: form.location,
        job_type: JOB_TYPE_TO_ODOO[form.type] || "full_time",
        status: JOB_STATUS_TO_ODOO[form.status] || "open",
        deadline: form.deadline || null,
        description: form.description || null,
        salary_range: form.salary_range || null,
        requirements: reqs.length > 0 ? reqs : [],
        required_skills: requiredSkills,
        nice_to_have_skills: niceToHave,
        min_experience_years: form.min_experience_years,
        education_level: form.education_level,
        ir_auto_shortlist: form.ir_auto_shortlist,
      };
      return editingJob
        ? odooData.updateJobOpening(editingJob.id, payload)
        : odooData.createJobOpening(payload);
    },
    "jobOpenings",
  );

  const handleSave = useCallback(async (): Promise<void> => {
    if (!form.title.trim()) return;
    try {
      await saveJobMutation.mutateAsync();
      onSaved();
    } catch (e: any) {
      localizedAlert(e?.message || arabicSource("common.error"));
    }
  }, [form.title, saveJobMutation, onSaved]);

  const handleMinExperienceYearsChange = useCallback((value: number) => {
    setForm((prev) => ({ ...prev, min_experience_years: value }));
  }, []);
  const handleEducationLevelChange = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, education_level: value }));
  }, []);
  const handleIrAutoShortlistChange = useCallback((value: number) => {
    setForm((prev) => ({ ...prev, ir_auto_shortlist: value }));
  }, []);

  const handleFieldChange = useCallback((field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  return (
    <Modal
      onClose={onClose}
      contentClassName="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-lg max-h-[80vh] overflow-y-auto"
      title={
        isEdit
          ? arabicSource("recruitment.edit_vacancy")
          : arabicSource("common.new_vacancy")
      }
      bodyClassName="space-y-4"
    >
        <JobFormFieldsSection
          title={form.title}
          department={form.department}
          location={form.location}
          type={form.type}
          deadline={form.deadline}
          status={form.status}
          salaryRange={form.salary_range}
          requirements={form.requirements}
          description={form.description}
          onFieldChange={handleFieldChange}
        />

        <JobScreeningSpecFields
          requiredSkills={requiredSkills}
          niceToHave={niceToHave}
          minExperienceYears={form.min_experience_years}
          educationLevel={form.education_level}
          irAutoShortlist={form.ir_auto_shortlist}
          onRequiredSkillsChange={setRequiredSkills}
          onNiceToHaveChange={setNiceToHave}
          onMinExperienceYearsChange={handleMinExperienceYearsChange}
          onEducationLevelChange={handleEducationLevelChange}
          onIrAutoShortlistChange={handleIrAutoShortlistChange}
        />

        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleSave}
            disabled={saveJobMutation.isPending || !form.title.trim()}
            className="flex-1 h-11 shadow-lg shadow-primary/20 cursor-pointer"
          >
            {saveJobMutation.isPending
              ? arabicSource("common.saving")
              : isEdit
                ? arabicSource("common.save")
                : arabicSource("recruitment.job_posting")}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 h-11 cursor-pointer"
          >
            {arabicSource("common.cancel")}
          </Button>
        </div>
    </Modal>
  );
};

export default memo(JobFormModal);
