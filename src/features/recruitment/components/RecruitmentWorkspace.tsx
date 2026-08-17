import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  UserPlus, Plus, Briefcase, MapPin, Clock, Users, FileCheck, Search,
  BookmarkCheck, Trophy, Loader2, Sparkles, Link2, Edit3, Trash2,
} from "lucide-react";
import { EmptyState } from "@/shared/components/EmptyState";
import { ViewToggle } from "@/shared/components/ViewToggle";
import * as odooData from "@/shared/api/odooData";
import {
  useJobOpenings, useApplicants,
  type DbJobOpening, type DbApplicant,
} from "@/shared/hooks";
import { localizedAlert, localizedConfirm } from "@/i18n/native";
import { arabicSource } from "@/i18n/source";
import {
  ALL_STAGES, GENDER_TO_ODOO, JOB_STATUSES, JOB_STATUS_TO_ODOO,
  ODOO_TO_GENDER, ODOO_TO_JOB_STATUS, ODOO_TO_JOB_TYPE, ODOO_TO_STAGE,
  STAGES, STAGE_TO_ODOO, stageColors, statusColors,
} from "../constants/recruitment";
import { effectiveScore } from "../utils/recruitmentRanking";
import { ApplicantsTable } from "../components/ApplicantsTable";
import { CandidateBank } from "../components/CandidateBank";
import { ApplicantDetailPanel } from "../components/ApplicantDetailPanel";
import { JobFormModal } from "../components/JobFormModal";
import { ApplicantFormModal } from "../components/ApplicantFormModal";
import { AiScreeningView } from "../components/AiScreeningView";
import { ApplyLinkModal } from "../components/ApplyLinkModal";
import { StarRating } from "../components/StarRating";

export const RecruitmentWorkspace = () => {
  const { jobs: rawJobs, loading: jobsLoading, refetch: refetchJobs } = useJobOpenings();
  const { applicants: rawApplicants, loading: appsLoading, refetch: refetchApps } = useApplicants();

  // Translate Odoo enum keys → Arabic display labels used throughout this page
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

  // Filtered & sorted applicants
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

  // Stats
  const stats = useMemo(() => ({
    openJobs: jobs.filter(j => j.status === arabicSource("common.is_open")).length,
    totalApplicants: applicants.length,
    interviewing: applicants.filter(a => a.stage === arabicSource("common.interview")).length,
    hired: applicants.filter(a => a.stage === arabicSource("common.accepted")).length,
    bookmarked: applicants.filter(a => a.is_bookmarked).length,
  }), [jobs, applicants]);

  /* ──── CRUD Handlers ──── */
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

  /** Queue one applicant for AI screening and refresh once it is accepted. */
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

  /**
   * Change a vacancy's status in place — the common HR action (close a filled
   * role, put one on hold) that shouldn't require opening the whole form.
   * `jobs` carries Arabic labels, so map back to the Odoo enum before sending.
   */
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
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="text-muted-foreground ms-3">{arabicSource("recruitment.loading_employment_data")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-gradient-gold">{arabicSource("common.recruitment")}</h1>
          <p className="text-muted-foreground mt-1">{arabicSource("recruitment.manage_job_vacancies_candidate_bank_and_ranking_system")}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <ViewToggle view={viewMode} onChange={setViewMode} />
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setShowApplicantForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-lg cursor-pointer"
            style={{ fontSize: 13 }}>
            <UserPlus className="w-4 h-4" /> {arabicSource("recruitment.add_advanced_2")}
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setShowJobForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg shadow-lg shadow-primary/20 hover:bg-gold-dark transition-colors cursor-pointer"
            style={{ fontSize: 13 }}>
            <Plus className="w-4 h-4" /> {arabicSource("common.new_vacancy")}
          </motion.button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: arabicSource("recruitment.vacancies_2"), value: stats.openJobs, icon: Briefcase },
          { label: arabicSource("common.total_applicants"), value: stats.totalApplicants, icon: Users },
          { label: arabicSource("recruitment.under_interview"), value: stats.interviewing, icon: UserPlus },
          { label: arabicSource("recruitment.hired"), value: stats.hired, icon: FileCheck },
          { label: arabicSource("recruitment.preferred_candidates"), value: stats.bookmarked, icon: BookmarkCheck },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card backdrop-blur-sm border border-border rounded-xl p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground" style={{ fontSize: 12 }}>{stat.label}</p>
                  <span className="text-gradient-gold block mt-1.5" style={{ fontSize: 26 }}>{stat.value}</span>
                </div>
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { id: "jobs" as const, label: arabicSource("recruitment.vacancies") },
          { id: "applicants" as const, label: arabicSource("recruitment.applicants") },
          { id: "ai" as const, label: arabicSource("recruitment.ai_tab") },
          { id: "pipeline" as const, label: arabicSource("recruitment.recruitment_path") },
          { id: "bank" as const, label: arabicSource("recruitment.candidates_bank") },
        ].map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id)}
            className={`px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${view === tab.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
            style={{ fontSize: 13 }}>
            {tab.id === "ai" && <Sparkles className="w-3.5 h-3.5" />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════ JOBS VIEW ══════════ */}
      {view === "jobs" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.length === 0 ? (
            <div className="col-span-full">
              <EmptyState icon={Briefcase} message={arabicSource("recruitment.there_are_no_vacancies_yet")} hint={arabicSource("recruitment.click_new_vacancy_to_add_the_first_job")} className="py-16" />
            </div>
          ) : jobs.map((job, i) => (
            <motion.div key={job.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }} whileHover={{ y: -3 }}
              className="bg-card/30 backdrop-blur-md border border-border/40 rounded-xl p-5 shadow-lg hover:border-primary/40 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-foreground">{job.title}</h3>
                  <p className="text-muted-foreground" style={{ fontSize: 13 }}>{job.department}</p>
                </div>
                {/* Status is editable in place — closing a filled vacancy is
                    the most frequent HR action on this card. */}
                <select value={job.status} onChange={e => handleJobStatusChange(job, e.target.value)}
                  title={arabicSource("recruitment.vacancy_status")}
                  className={`px-2 py-0.5 rounded-md border bg-transparent cursor-pointer outline-none focus:ring-2 focus:ring-primary/40 ${statusColors[job.status] || ""}`}
                  style={{ fontSize: 12 }}>
                  {JOB_STATUSES.map(s => (
                    <option key={s} value={s} className="bg-card text-foreground">{s}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap gap-3 mb-3">
                <span className="flex items-center gap-1 text-muted-foreground" style={{ fontSize: 12 }}>
                  <MapPin className="w-3.5 h-3.5" />{job.location}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground" style={{ fontSize: 12 }}>
                  <Briefcase className="w-3.5 h-3.5" />{job.type}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground" style={{ fontSize: 12 }}>
                  <Users className="w-3.5 h-3.5" />{job.applicant_count || 0} {arabicSource("recruitment.advanced_2")}
                </span>
                {job.deadline && (
                  <span className="flex items-center gap-1 text-muted-foreground" style={{ fontSize: 12 }}>
                    <Clock className="w-3.5 h-3.5" /><span dir="ltr">{job.deadline}</span>
                  </span>
                )}
              </div>
              {job.requirements && job.requirements.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {job.requirements.slice(0, 2).map((req, ri) => (
                    <span key={ri} className="px-2 py-0.5 rounded-md bg-muted/30 text-muted-foreground" style={{ fontSize: 11 }}>{req}</span>
                  ))}
                  {job.requirements.length > 2 && (
                    <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary" style={{ fontSize: 11 }}>
                      +{job.requirements.length - 2}
                    </span>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/20">
                <button onClick={() => setLinkJob(job)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                  style={{ fontSize: 12 }}>
                  <Link2 className="w-3.5 h-3.5" />{arabicSource("recruitment.apply_link")}
                </button>
                <button onClick={() => { setAiJobId(job.id); setView("ai"); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors cursor-pointer"
                  style={{ fontSize: 12 }}>
                  <Sparkles className="w-3.5 h-3.5" />{arabicSource("recruitment.ai_tab")}
                </button>
                <div className="flex items-center gap-1 ms-auto">
                  <button onClick={() => setEditingJob(job)} title={arabicSource("common.edit")}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => { void handleDeleteJob(job); }} title={arabicSource("common.delete")}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ══════════ AI SCREENING VIEW ══════════ */}
      {view === "ai" && (
        <AiScreeningView
          jobs={jobs}
          jobId={aiJobId}
          setJobId={setAiJobId}
          onSelect={setSelectedApplicant}
          onUpdateStage={handleUpdateStage}
        />
      )}

      {/* ══════════ APPLICANTS VIEW ══════════ */}
      {view === "applicants" && (
        <>
          {/* Search & Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input type="text" placeholder={arabicSource("recruitment.search_by_name_email_phone_skills")}
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full h-10 ps-9 pe-4 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none"
                style={{ fontSize: 13 }} />
            </div>
            <select value={filterStage} onChange={e => setFilterStage(e.target.value)}
              className="h-10 px-3 rounded-lg border border-border bg-input-background text-foreground cursor-pointer" style={{ fontSize: 13 }}>
              <option value={arabicSource("common.all")}>{arabicSource("recruitment.all_stages")}</option>
              {ALL_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filterJob} onChange={e => setFilterJob(e.target.value)}
              className="h-10 px-3 rounded-lg border border-border bg-input-background text-foreground cursor-pointer" style={{ fontSize: 13 }}>
              <option value={arabicSource("common.all")}>{arabicSource("recruitment.all_jobs")}</option>
              {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
          </div>

          <ApplicantsTable
            applicants={filteredApplicants}
            onSelect={setSelectedApplicant}
            onToggleBookmark={handleToggleBookmark}
            onUpdateRating={handleUpdateRating}
            onUpdateStage={handleUpdateStage}
          />
        </>
      )}

      {/* ══════════ PIPELINE VIEW ══════════ */}
      {view === "pipeline" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {STAGES.map((stage, si) => {
            const stageApps = applicants.filter(a => a.stage === stage);
            return (
              <motion.div key={stage} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: si * 0.08 }}
                className="bg-card/30 backdrop-blur-md border border-border/40 rounded-xl shadow-lg">
                <div className="p-3 border-b border-border/20">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-md border ${stageColors[stage]}`} style={{ fontSize: 12 }}>{stage}</span>
                    <span className="text-muted-foreground" style={{ fontSize: 11 }}>{stageApps.length}</span>
                  </div>
                </div>
                <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
                  {stageApps.length > 0 ? stageApps.map(app => (
                    <motion.div key={app.id} whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedApplicant(app)}
                      className="p-2.5 rounded-lg bg-muted/20 border border-border/20 cursor-pointer hover:border-primary/30 transition-all">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-foreground" style={{ fontSize: 12 }}>{app.name}</p>
                        {app.is_bookmarked && <BookmarkCheck className="w-3 h-3 text-primary" />}
                      </div>
                      <p className="text-muted-foreground" style={{ fontSize: 10 }}>{app.job_title || "—"}</p>
                      <div className="mt-1.5">
                        <StarRating value={app.rating} size={10} />
                      </div>
                    </motion.div>
                  )) : (
                    <p className="text-muted-foreground text-center py-4" style={{ fontSize: 12 }}>{arabicSource("recruitment.none")}</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ══════════ CANDIDATE BANK VIEW ══════════ */}
      {view === "bank" && (
        <CandidateBank
          applicants={applicants}
          jobs={jobs}
          onSelect={setSelectedApplicant}
          onToggleBookmark={handleToggleBookmark}
          onUpdateRating={handleUpdateRating}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
      )}

      {/* ══════════ MODALS ══════════ */}
      <AnimatePresence>
        {(showJobForm || editingJob) && (
          <JobFormModal
            jobs={jobs}
            editingJob={editingJob}
            // Remount on target change so the form re-seeds from the new job
            // instead of keeping the previous one's useState values.
            key={editingJob?.id || "new"}
            onClose={() => { setShowJobForm(false); setEditingJob(null); }}
            onSaved={() => { setShowJobForm(false); setEditingJob(null); refetchJobs(); }} />
        )}
        {showApplicantForm && (
          <ApplicantFormModal
            jobs={jobs}
            editingApplicant={editingApplicant}
            onClose={() => { setShowApplicantForm(false); setEditingApplicant(null); }}
            onSaved={() => { setShowApplicantForm(false); setEditingApplicant(null); refetchApps(); }}
          />
        )}
        {linkJob && (
          <ApplyLinkModal job={linkJob} onClose={() => setLinkJob(null)} />
        )}
        {selectedApplicant && (
          <ApplicantDetailPanel
            applicant={selectedApplicant}
            onClose={() => setSelectedApplicant(null)}
            onEdit={(a) => { setEditingApplicant(a); setShowApplicantForm(true); setSelectedApplicant(null); }}
            onDelete={handleDeleteApplicant}
            onUpdateStage={handleUpdateStage}
            onUpdateRating={handleUpdateRating}
            onToggleBookmark={handleToggleBookmark}
            onRefresh={refetchApps}
            onConvertToEmployee={handleConvertToEmployee}
            onScreen={handleScreenApplicant}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ════════════════════════════════════════════════════════════ */

/* ──── Applicants Table ──── */
