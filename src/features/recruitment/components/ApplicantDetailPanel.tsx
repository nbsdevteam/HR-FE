import { useState, useCallback, memo } from "react";
import { ModalOverlay } from "@/shared/components";
import { type DbApplicant, useOdooMutation } from "@/shared/hooks";
import * as odooData from "@/shared/api/odooData";
import { arabicSource } from "@/i18n/source";
import { ALL_STAGES } from "../constants/recruitment";
import { effectiveScore, rankLabel } from "../utils/recruitmentRanking";
import ApplicantConvertToEmployeeButton from "./ApplicantConvertToEmployeeButton";
import ApplicantContactInfoGrid from "./ApplicantContactInfoGrid";
import ApplicantDetailHeader from "./ApplicantDetailHeader";
import ApplicantExpectedSalaryCard from "./ApplicantExpectedSalaryCard";
import ApplicantInterviewNotesSection from "./ApplicantInterviewNotesSection";
import ApplicantIrSection from "./ApplicantIrSection";
import ApplicantNotesCard from "./ApplicantNotesCard";
import ApplicantResumeCard from "./ApplicantResumeCard";
import ApplicantSkillsSection from "./ApplicantSkillsSection";
import ApplicantStageButton from "./ApplicantStageButton";

interface ApplicantDetailPanelProps {
  applicant: DbApplicant;
  onClose: () => void;
  onEdit: (a: DbApplicant) => void;
  onDelete: (id: string) => void;
  onScreen: (a: DbApplicant) => Promise<void>;
  onUpdateStage: (id: string, s: string) => void;
  onUpdateRating: (id: string, r: number) => void;
  onToggleBookmark: (a: DbApplicant) => void;
  onRefresh: () => void;
  onConvertToEmployee: (a: DbApplicant) => void;
}

const ApplicantDetailPanel = ({
  applicant,
  onClose,
  onEdit,
  onDelete,
  onUpdateStage,
  onUpdateRating,
  onToggleBookmark,
  onConvertToEmployee,
  onScreen,
}: ApplicantDetailPanelProps) => {
  const [interviewNotes, setInterviewNotes] = useState(
    applicant.interview_notes || "",
  );
  const updateNotesMutation = useOdooMutation<unknown, void>(
    () =>
      odooData.updateApplicant(applicant.id, {
        interview_notes: interviewNotes,
      }),
    "applicants",
  );
  const score = effectiveScore(applicant);
  const rank = rankLabel(score, applicant.ir_band);

  const saveNotes = useCallback(async () => {
    await updateNotesMutation.mutateAsync();
  }, [updateNotesMutation]);

  const handleRatingChange = useCallback(
    (r: number) => onUpdateRating(applicant.id, r),
    [applicant.id, onUpdateRating],
  );
  const handleStageSelect = useCallback(
    (s: string) => onUpdateStage(applicant.id, s),
    [applicant.id, onUpdateStage],
  );
  const handleConvertToEmployee = useCallback(
    () => onConvertToEmployee(applicant),
    [applicant, onConvertToEmployee],
  );

  return (
    <ModalOverlay
      onClose={onClose}
      overlayClassName="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto"
      contentClassName="bg-card border border-border rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
      contentMotionProps={{
        initial: { scale: 0.95, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0.95, opacity: 0 },
      }}
    >
      <ApplicantDetailHeader
        applicant={applicant}
        score={score}
        rankColor={rank.color}
        rankText={rank.text}
        onRatingChange={handleRatingChange}
        onToggleBookmark={onToggleBookmark}
        onEdit={onEdit}
        onDelete={onDelete}
        onClose={onClose}
      />

      <div className="p-6 space-y-5">
        {/* Stage */}
        <div>
          <label
            className="text-muted-foreground block mb-2"
            style={{ fontSize: 12 }}
          >
            {arabicSource("recruitment.current_phase")}
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {ALL_STAGES.map((s) => (
              <ApplicantStageButton
                key={s}
                stage={s}
                isActive={applicant.stage === s}
                // onSelect={handleStageSelect}
              />
            ))}
          </div>
        </div>

        <ApplicantContactInfoGrid applicant={applicant} />

        {applicant.expected_salary && (
          <ApplicantExpectedSalaryCard
            expectedSalary={applicant.expected_salary}
            salaryCurrency={applicant.salary_currency}
          />
        )}

        {applicant.skills && applicant.skills.length > 0 && (
          <ApplicantSkillsSection skills={applicant.skills} />
        )}

        {applicant.resume_url && (
          <ApplicantResumeCard applicantId={applicant.id} />
        )}

        {applicant.notes && <ApplicantNotesCard notes={applicant.notes} />}

        <ApplicantInterviewNotesSection
          interviewNotes={interviewNotes}
          saving={updateNotesMutation.isPending}
          onNotesChange={setInterviewNotes}
          onSave={saveNotes}
        />

        <ApplicantIrSection applicant={applicant} onScreen={onScreen} />

        {applicant.stage === arabicSource("common.accepted") && (
          <ApplicantConvertToEmployeeButton onClick={handleConvertToEmployee} />
        )}
      </div>
    </ModalOverlay>
  );
};

export default memo(ApplicantDetailPanel);
