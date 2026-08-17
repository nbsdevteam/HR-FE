import { useState, useMemo, useCallback } from "react";
import * as odooData from "@/shared/api/odooData";
import {
  useJobOpenings, useApplicants,
  type DbJobOpening, type DbApplicant,
} from "@/shared/hooks";
import { localizedAlert, localizedConfirm } from "@/i18n/native";
import { arabicSource } from "@/i18n/source";
import {
  GENDER_TO_ODOO, JOB_STATUS_TO_ODOO, ODOO_TO_GENDER,
  ODOO_TO_JOB_STATUS, ODOO_TO_JOB_TYPE, ODOO_TO_STAGE, STAGE_TO_ODOO,
} from "../constants/recruitment";
import { effectiveScore } from "../utils/recruitmentRanking";
import AiScreeningView from "../components/AiScreeningView";
import RecruitmentApplicantsView from "./RecruitmentApplicantsView";
import RecruitmentCandidateBankView from "./RecruitmentCandidateBankView";
import RecruitmentHeader from "./RecruitmentHeader";
import RecruitmentJobsView from "./RecruitmentJobsView";
import LoadingState from "@/shared/components/LoadingState";
import RecruitmentModals from "./RecruitmentModals";
import RecruitmentPipelineView from "./RecruitmentPipelineView";
import RecruitmentStats from "./RecruitmentStats";
import RecruitmentTabs from "./RecruitmentTabs";

const RecruitmentWorkspace = () => {
  const { jobs: rawJobs, loading: jobsLoading, refetch: refetchJobs } = useJobOpenings();
  const { applicants: rawApplicants, loading: appsLoading, refetch: refetchApps } = useApplicants();

  const jobs = useMemo(() => (
    rawJobs.map(j => ({
      ...j,
      status: ODOO_TO_JOB_STATUS[j.status] || j.status,
      type: ODOO_TO_JOB_TYPE[j.type] || j.type,
    }))
  ), [rawJobs]);
  const applicants = useMemo(() => (
    rawApplicants.map(a => ({
      ...a,
      stage: ODOO_TO_STAGE[a.stage] || a.stage,
      gender: a.gender ? (ODOO_TO_GENDER[a.gender] || a.gender) : a.gender,
      job_status: a.job_status ? (ODOO_TO_JOB_STATUS[a.job_status] || a.job_status) : a.job_status,
    }))
  ), [rawApplicants]);

  const [view, setView] = useState<"jobs" | "applicants" | "pipeline" | "bank" | "ai">("applicants");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [showJobForm, setShowJobForm] = useState(false);
  const [showApplicantForm, setShowApplicantForm] = useState(false);
  const [linkJob, setLinkJob] = useState<DbJobOpening | null>(null);
  const [aiJobId, setAiJobId] = useState<string | null>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<DbApplicant | null>(null);
  const [editingApplicant, setEditingApplicant] = useState<DbApplicant | null>(null);
  const [editingJob, setEditingJob] = useState<DbJobOpening | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStage, setFilterStage] = useState<string>(arabicSource("common.all"));
  const [filterJob, setFilterJob] = useState<string>(arabicSource("common.all"));
  const [sortBy, setSortBy] = useState<"rank" | "rating" | "date" | "name" | "job" | "stage">("rank");
  const [recSortDir, setRecSortDir] = useState<"asc" | "desc">("desc");
  const [saving, setSaving] = useState(false);
  const loading = jobsLoading || appsLoading;

  const filteredApplicants = useMemo(() => {
    let list = [...applicants];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(a =>
        a.name.toLowerCase().includes(q) ||
        (a.email || "").toLowerCase().includes(q) ||
        (a.phone || "").includes(q) ||
        (a.skills || []).some(s => s.toLowerCase().includes(q)) ||
        (a.job_title || "").toLowerCase().includes(q)
      );
    }
    if (filterStage !== arabicSource("common.all")) list = list.filter(a => a.stage === filterStage);
    if (filterJob !== arabicSource("common.all")) list = list.filter(a => a.job_opening_id === filterJob);

    const dir = recSortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (sortBy === "rank") return dir * (effectiveScore(a) - effectiveScore(b));
      if (sortBy === "rating") return dir * (a.rating - b.rating);
      if (sortBy === "date") return dir * (new Date(a.applied_date).getTime() - new Date(b.applied_date).getTime());
      if (sortBy === "job") return dir * (a.job_title || "").localeCompare(b.job_title || "", "ar");
      if (sortBy === "stage") return dir * (a.stage || "").localeCompare(b.stage || "", "ar");
      return dir * a.name.localeCompare(b.name, "ar");
    });
    return list;
  }, [applicants, searchTerm, filterStage, filterJob, sortBy, recSortDir]);

  const stats = useMemo(() => ({
    openJobs: jobs.filter(j => j.status === arabicSource("common.is_open")).length,
    totalApplicants: applicants.length,
    interviewing: applicants.filter(a => a.stage === arabicSource("common.interview")).length,
    hired: applicants.filter(a => a.stage === arabicSource("common.accepted")).length,
    bookmarked: applicants.filter(a => a.is_bookmarked).length,
  }), [jobs, applicants]);
  const handleToggleBookmark = useCallback(async (app: DbApplicant) => {
    await odooData.updateApplicant(app.id, { is_bookmarked: !app.is_bookmarked });
    refetchApps();
  }, [refetchApps]);
  const handleUpdateRating = useCallback(async (id: string, rating: number) => {
    await odooData.updateApplicant(id, { rating });
    refetchApps();
  }, [refetchApps]);
  const handleUpdateStage = useCallback(async (id: string, stage: string) => {
    await odooData.updateApplicant(id, { stage: STAGE_TO_ODOO[stage] || stage });
    refetchApps();
  }, [refetchApps]);
  const handleScreenApplicant = useCallback(async (app: DbApplicant) => {
    if (!app.resume_url) {
      localizedAlert(arabicSource("recruitment.no_resume_for_screening"));
      return;
    }
    try {
      await odooData.screenApplicant(app.id, { force: true });
      refetchApps();
    } catch (e: any) {
      localizedAlert(e?.message || arabicSource("recruitment.screening_unavailable"));
    }
  }, [refetchApps]);
  const handleJobStatusChange = useCallback(async (job: DbJobOpening, nextStatus: string) => {
    if (nextStatus === job.status) return;
    try {
      await odooData.updateJobOpening(job.id, {
        status: JOB_STATUS_TO_ODOO[nextStatus] || nextStatus,
      });
      refetchJobs();
    } catch (e: any) {
      localizedAlert(e?.message || arabicSource("common.error"));
    }
  }, [refetchJobs]);

  const handleDeleteJob = useCallback(async (job: DbJobOpening) => {
    if (!localizedConfirm(arabicSource("recruitment.are_you_sure_you_want_to_delete_this_vacancy"))) return;
    try {
      await odooData.deleteJobOpening(job.id);
      refetchJobs();
    } catch (e: any) {
      localizedAlert(e?.message || arabicSource("common.error"));
    }
  }, [refetchJobs]);

  const handleDeleteApplicant = useCallback(async (id: string) => {
    if (!localizedConfirm(arabicSource("recruitment.are_you_sure_you_want_to_delete_this_applicant"))) return;
    await odooData.deleteApplicant(id);
    setSelectedApplicant(null);
    refetchApps();
  }, [refetchApps]);

  const handleConvertToEmployee = useCallback(async (app: DbApplicant) => {
    if (!localizedConfirm(`${arabicSource("recruitment.do_you_want_to_convert")}${app.name}${arabicSource("recruitment.to_an_employee_in_the_system")}`)) return;

    try {
      const depts = await odooData.fetchDepartments();
      const dept = depts.find(d => d.name === app.job_department);
      await odooData.createEmployee({
        name: app.name,
        email: app.email || undefined,
        phone: app.phone || undefined,
        department_id: dept?.id || undefined,
        gender: app.gender ? (GENDER_TO_ODOO[app.gender] || app.gender) : undefined,
        monthly_salary: app.expected_salary || undefined,
        status: "active",
      });
      await odooData.updateApplicant(app.id, {
        stage: "hired",
        notes: (app.notes || "") + "\n[تم التحويل لموظف]",
      });
      setSelectedApplicant(null);
      refetchApps();
      alert(`تم إضافة "${app.name}" كموظف بنجاح!`);
    } catch (e: any) {
      alert("خطأ في تحويل المتقدم: " + e.message);
    }
  }, [refetchApps]);

  /* ──── Loading State ──── */
  if (loading) {
    return <LoadingState message={arabicSource("recruitment.loading_employment_data")} />;
  }

  return (
    <div className="space-y-6">
      <RecruitmentHeader
        viewMode={viewMode}
        onApplicantFormOpen={() => setShowApplicantForm(true)}
        onJobFormOpen={() => setShowJobForm(true)}
        onViewModeChange={setViewMode}
      />

      <RecruitmentStats stats={stats} />

      <RecruitmentTabs view={view} onViewChange={setView} />

      {view === "jobs" && (
        <RecruitmentJobsView
          jobs={jobs}
          onAiScreeningOpen={(jobId) => {
            setAiJobId(jobId);
            setView("ai");
          }}
          onDeleteJob={handleDeleteJob}
          onEditJob={setEditingJob}
          onJobStatusChange={handleJobStatusChange}
          onLinkJob={setLinkJob}
        />
      )}

      {view === "ai" && (
        <AiScreeningView
          jobs={jobs}
          jobId={aiJobId}
          setJobId={setAiJobId}
          onSelect={setSelectedApplicant}
          onUpdateStage={handleUpdateStage}
        />
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
        <RecruitmentPipelineView applicants={applicants} onSelectApplicant={setSelectedApplicant} />
      )}

      {view === "bank" && (
        <RecruitmentCandidateBankView
          applicants={applicants}
          jobs={jobs}
          sortBy={sortBy}
          onSelectApplicant={setSelectedApplicant}
          onSortChange={setSortBy}
          onToggleBookmark={handleToggleBookmark}
          onUpdateRating={handleUpdateRating}
        />
      )}

      <RecruitmentModals
        editingApplicant={editingApplicant}
        editingJob={editingJob}
        jobs={jobs}
        linkJob={linkJob}
        selectedApplicant={selectedApplicant}
        showApplicantForm={showApplicantForm}
        showJobForm={showJobForm}
        onApplicantDelete={handleDeleteApplicant}
        onApplicantEdit={(applicant) => {
          setEditingApplicant(applicant);
          setShowApplicantForm(true);
          setSelectedApplicant(null);
        }}
        onApplicantFormClose={() => {
          setShowApplicantForm(false);
          setEditingApplicant(null);
        }}
        onApplicantSaved={() => {
          setShowApplicantForm(false);
          setEditingApplicant(null);
          refetchApps();
        }}
        onApplicantScreen={handleScreenApplicant}
        onApplicantStageUpdate={handleUpdateStage}
        onApplicantRatingUpdate={handleUpdateRating}
        onApplicantBookmarkToggle={handleToggleBookmark}
        onApplicantRefresh={refetchApps}
        onApplicantSelectClose={() => setSelectedApplicant(null)}
        onConvertToEmployee={handleConvertToEmployee}
        onJobFormClose={() => {
          setShowJobForm(false);
          setEditingJob(null);
        }}
        onJobSaved={() => {
          setShowJobForm(false);
          setEditingJob(null);
          refetchJobs();
        }}
        onLinkJobClose={() => setLinkJob(null)}
      />
    </div>
  );
};

export default RecruitmentWorkspace;
