import { lazy, memo, Suspense } from "react";
import { AnimatePresence } from "motion/react";
import type { DbApplicant, DbJobOpening } from "@/shared/hooks";

const ApplicantDetailPanel = lazy(() => import("./ApplicantDetailPanel"));
const ApplicantFormModal = lazy(() => import("./ApplicantFormModal"));
const ApplyLinkModal = lazy(() => import("./ApplyLinkModal"));
const JobFormModal = lazy(() => import("./JobFormModal"));

type RecruitmentModalsProps = {
  editingApplicant: DbApplicant | null;
  editingJob: DbJobOpening | null;
  jobs: DbJobOpening[];
  linkJob: DbJobOpening | null;
  selectedApplicant: DbApplicant | null;
  showApplicantForm: boolean;
  showJobForm: boolean;
  onApplicantDelete: (id: string) => void;
  onApplicantEdit: (applicant: DbApplicant) => void;
  onApplicantFormClose: () => void;
  onApplicantSaved: () => void;
  onApplicantScreen: (applicant: DbApplicant) => Promise<void>;
  onApplicantStageUpdate: (id: string, stage: string) => void;
  onApplicantRatingUpdate: (id: string, rating: number) => void;
  onApplicantBookmarkToggle: (applicant: DbApplicant) => void;
  onApplicantRefresh: () => void;
  onApplicantSelectClose: () => void;
  onConvertToEmployee: (applicant: DbApplicant) => Promise<void>;
  onJobFormClose: () => void;
  onJobSaved: () => void;
  onLinkJobClose: () => void;
};

const RecruitmentModals = ({
  editingApplicant,
  editingJob,
  jobs,
  linkJob,
  selectedApplicant,
  showApplicantForm,
  showJobForm,
  onApplicantDelete,
  onApplicantEdit,
  onApplicantFormClose,
  onApplicantSaved,
  onApplicantScreen,
  onApplicantStageUpdate,
  onApplicantRatingUpdate,
  onApplicantBookmarkToggle,
  onApplicantRefresh,
  onApplicantSelectClose,
  onConvertToEmployee,
  onJobFormClose,
  onJobSaved,
  onLinkJobClose,
}: RecruitmentModalsProps) => (
  <AnimatePresence>
    {(showJobForm || editingJob) && (
      <Suspense fallback={null}>
        <JobFormModal
          editingJob={editingJob}
          key={editingJob?.id || "new"}
          onClose={onJobFormClose}
          onSaved={onJobSaved}
        />
      </Suspense>
    )}
    {showApplicantForm && (
      <Suspense fallback={null}>
        <ApplicantFormModal
          jobs={jobs}
          editingApplicant={editingApplicant}
          onClose={onApplicantFormClose}
          onSaved={onApplicantSaved}
        />
      </Suspense>
    )}

    {linkJob && (
      <Suspense fallback={null}>
        <ApplyLinkModal job={linkJob} onClose={onLinkJobClose} />
      </Suspense>
    )}
    {selectedApplicant && (
      <Suspense fallback={null}>
        <ApplicantDetailPanel
          applicant={selectedApplicant}
          onClose={onApplicantSelectClose}
          onEdit={onApplicantEdit}
          onDelete={onApplicantDelete}
          onUpdateStage={onApplicantStageUpdate}
          onUpdateRating={onApplicantRatingUpdate}
          onToggleBookmark={onApplicantBookmarkToggle}
          onRefresh={onApplicantRefresh}
          onConvertToEmployee={onConvertToEmployee}
          onScreen={onApplicantScreen}
        />
      </Suspense>
    )}
  </AnimatePresence>
);

export default memo(RecruitmentModals);
