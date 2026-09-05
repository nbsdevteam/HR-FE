import { useState, useCallback, memo, lazy, Suspense } from "react";
import { AnimatePresence } from "motion/react";
import type { DbJobOpening, DbApplicant } from "@/shared/hooks";
import { useJobOpenings, useApplicants } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { ConfirmDeleteModal } from "@/shared/components";
import { useRecruitmentWorkspaceData } from "../hooks/useRecruitmentWorkspaceData";
import { useRecruitmentActions } from "../hooks/useRecruitmentActions";
import RecruitmentApplicantsView from "./RecruitmentApplicantsView";
import RecruitmentHeader from "./RecruitmentHeader";
import LoadingState from "@/shared/components/LoadingState";
import RecruitmentModals from "./RecruitmentModals";
import RecruitmentStats from "./RecruitmentStats";
import RecruitmentTabs from "./RecruitmentTabs";
import { sortTypes, viewType } from "../types";

const AiScreeningView = lazy(() => import("../components/AiScreeningView"));
const RecruitmentJobsView = lazy(() => import("./RecruitmentJobsView"));
const RecruitmentPipelineView = lazy(() => import("./RecruitmentPipelineView"));
const RecruitmentCandidateBankView = lazy(
  () => import("./RecruitmentCandidateBankView"),
);

const RecruitmentWorkspace = () => {
  const [view, setView] = useState<viewType>("applicants");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [showJobForm, setShowJobForm] = useState(false);
  const [showApplicantForm, setShowApplicantForm] = useState(false);
  const [linkJob, setLinkJob] = useState<DbJobOpening | null>(null);
  const [aiJobId, setAiJobId] = useState<string | null>(null);
  const [selectedApplicant, setSelectedApplicant] =
    useState<DbApplicant | null>(null);
  const [editingApplicant, setEditingApplicant] = useState<DbApplicant | null>(
    null,
  );

  const [editingJob, setEditingJob] = useState<DbJobOpening | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStage, setFilterStage] = useState<string>(
    arabicSource("common.all"),
  );

  const [filterJob, setFilterJob] = useState<string>(
    arabicSource("common.all"),
  );

  const [sortBy, setSortBy] = useState<sortTypes>("rank");
  const [recSortDir] = useState<"asc" | "desc">("desc");
  const {
    jobs: rawJobs,
    loading: jobsLoading,
    refetch: refetchJobs,
  } = useJobOpenings();

  const {
    applicants: rawApplicants,
    loading: appsLoading,
    refetch: refetchApps,
  } = useApplicants();
  // `jobsLoading`/`appsLoading` mirror `isFetching`, so they also flip true on
  // background refetches (e.g. the applicants list re-fetching after a rating
  // or stage mutation). Only gate the full-page loader on the very first load
  // — once data has landed once, later refetches should update in place
  // instead of unmounting the page back to the spinner.
  const loading = (jobsLoading && rawJobs.length === 0) || (appsLoading && rawApplicants.length === 0);

  const { jobs, applicants, filteredApplicants, stats } =
    useRecruitmentWorkspaceData(
      rawJobs,
      rawApplicants,
      searchTerm,
      filterStage,
      filterJob,
      sortBy,
      recSortDir,
    );

  const {
    handleToggleBookmark,
    handleUpdateRating,
    handleUpdateStage,
    handleScreenApplicant,
    handleJobStatusChange,
    handleConvertToEmployee,
    pendingDeleteJob,
    deletingJob,
    requestDeleteJob,
    cancelDeleteJob,
    confirmDeleteJob,
    pendingDeleteApplicantId,
    deletingApplicant,
    requestDeleteApplicant,
    cancelDeleteApplicant,
    confirmDeleteApplicant,
  } = useRecruitmentActions(refetchJobs, refetchApps, setSelectedApplicant);

  const handleApplicantFormOpen = useCallback(
    () => setShowApplicantForm(true),
    [],
  );
  const handleJobFormOpen = useCallback(() => setShowJobForm(true), []);

  const handleAiScreeningOpen = useCallback((jobId: string) => {
    setAiJobId(jobId);
    setView("ai");
  }, []);

  const handleApplicantEdit = useCallback((applicant: DbApplicant) => {
    setEditingApplicant(applicant);
    setShowApplicantForm(true);
    setSelectedApplicant(null);
  }, []);

  const handleApplicantFormClose = useCallback(() => {
    setShowApplicantForm(false);
    setEditingApplicant(null);
  }, []);

  const handleApplicantSaved = useCallback(() => {
    setShowApplicantForm(false);
    setEditingApplicant(null);
    refetchApps();
  }, [refetchApps]);

  const handleApplicantSelectClose = useCallback(
    () => setSelectedApplicant(null),
    [],
  );

  const handleJobFormClose = useCallback(() => {
    setShowJobForm(false);
    setEditingJob(null);
  }, []);

  const handleJobSaved = useCallback(() => {
    setShowJobForm(false);
    setEditingJob(null);
    refetchJobs();
  }, [refetchJobs]);

  const handleLinkJobClose = useCallback(() => setLinkJob(null), []);

  /* ──── Loading State ──── */
  if (loading) {
    return (
      <LoadingState
        message={arabicSource("recruitment.loading_employment_data")}
      />
    );
  }

  return (
    <div className="space-y-6">
      <RecruitmentHeader
        viewMode={viewMode}
        onApplicantFormOpen={handleApplicantFormOpen}
        onJobFormOpen={handleJobFormOpen}
        onViewModeChange={setViewMode}
      />

      <RecruitmentStats stats={stats} />

      <RecruitmentTabs view={view} onViewChange={setView} />

      {view === "jobs" && (
        <Suspense fallback={null}>
          <RecruitmentJobsView
            jobs={jobs}
            onAiScreeningOpen={handleAiScreeningOpen}
            onDeleteJob={requestDeleteJob}
            onEditJob={setEditingJob}
            onJobStatusChange={handleJobStatusChange}
            onLinkJob={setLinkJob}
          />
        </Suspense>
      )}

      {view === "ai" && (
        <Suspense fallback={null}>
          <AiScreeningView
            jobs={jobs}
            jobId={aiJobId}
            setJobId={setAiJobId}
            onSelect={setSelectedApplicant}
            onUpdateStage={handleUpdateStage}
          />
        </Suspense>
      )}

      {view === "applicants" && (
        <RecruitmentApplicantsView
          applicants={filteredApplicants}
          filterJob={filterJob}
          filterStage={filterStage}
          jobs={jobs}
          searchTerm={searchTerm}
          onFilterJobChange={setFilterJob}
          onFilterStageChange={setFilterStage}
          onSearchTermChange={setSearchTerm}
          onSelectApplicant={setSelectedApplicant}
          onToggleBookmark={handleToggleBookmark}
          onUpdateRating={handleUpdateRating}
          onUpdateStage={handleUpdateStage}
        />
      )}

      {view === "pipeline" && (
        <Suspense fallback={null}>
          <RecruitmentPipelineView
            applicants={applicants}
            onSelectApplicant={setSelectedApplicant}
          />
        </Suspense>
      )}

      {view === "bank" && (
        <Suspense fallback={null}>
          <RecruitmentCandidateBankView
            applicants={applicants}
            sortBy={sortBy}
            onSelectApplicant={setSelectedApplicant}
            onSortChange={setSortBy}
            onToggleBookmark={handleToggleBookmark}
            onUpdateRating={handleUpdateRating}
          />
        </Suspense>
      )}

      <RecruitmentModals
        editingApplicant={editingApplicant}
        editingJob={editingJob}
        jobs={jobs}
        linkJob={linkJob}
        selectedApplicant={selectedApplicant}
        showApplicantForm={showApplicantForm}
        showJobForm={showJobForm}
        onApplicantDelete={requestDeleteApplicant}
        onApplicantEdit={handleApplicantEdit}
        onApplicantFormClose={handleApplicantFormClose}
        onApplicantSaved={handleApplicantSaved}
        onApplicantScreen={handleScreenApplicant}
        onApplicantStageUpdate={handleUpdateStage}
        onApplicantRatingUpdate={handleUpdateRating}
        onApplicantBookmarkToggle={handleToggleBookmark}
        onApplicantRefresh={refetchApps}
        onApplicantSelectClose={handleApplicantSelectClose}
        onConvertToEmployee={handleConvertToEmployee}
        onJobFormClose={handleJobFormClose}
        onJobSaved={handleJobSaved}
        onLinkJobClose={handleLinkJobClose}
      />

      <AnimatePresence>
        {pendingDeleteJob && (
          <ConfirmDeleteModal
            onClose={cancelDeleteJob}
            onConfirm={confirmDeleteJob}
            title={arabicSource("employees.confirm_deletion")}
            message={arabicSource("recruitment.are_you_sure_you_want_to_delete_this_vacancy")}
            loading={deletingJob}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pendingDeleteApplicantId && (
          <ConfirmDeleteModal
            onClose={cancelDeleteApplicant}
            onConfirm={confirmDeleteApplicant}
            title={arabicSource("employees.confirm_deletion")}
            message={arabicSource("recruitment.are_you_sure_you_want_to_delete_this_applicant")}
            loading={deletingApplicant}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default memo(RecruitmentWorkspace);
