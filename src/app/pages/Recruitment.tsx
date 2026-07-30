import { useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  UserPlus, Plus, X, Briefcase, MapPin, Clock, Users, FileCheck, Search,
  Star, Upload, Download, Bookmark, BookmarkCheck, Eye,
  GraduationCap, Building2, Phone, Mail, FileText, Trash2, Edit3,
  Trophy, TrendingUp, Loader2, AlertCircle
} from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { ViewToggle } from "../components/ViewToggle";
import { SortableHeaderRow, toggleSort } from "../components/SortableHeader";
import { supabase } from "../lib/supabase";
import { useJobOpenings, useApplicants, type DbJobOpening, type DbApplicant } from "../lib/hooks";
import { DEPARTMENTS } from "../lib/constants";
import { formatNumber } from "../i18n/format";

/* ──────── Constants ──────── */
const STAGES = ["تقديم", "فرز أولي", "مقابلة", "اختبار", "عرض", "مقبول"] as const;
const ALL_STAGES = [...STAGES, "مرفوض"] as const;

const stageColors: Record<string, string> = {
  "تقديم": "bg-blue-500/10 border-blue-500/30 text-blue-400",
  "فرز أولي": "bg-purple-500/10 border-purple-500/30 text-purple-400",
  "مقابلة": "bg-primary/10 border-primary/30 text-primary",
  "اختبار": "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
  "عرض": "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  "مقبول": "bg-green-500/10 border-green-500/30 text-green-400",
  "مرفوض": "bg-destructive/10 border-destructive/30 text-destructive",
};

const statusColors: Record<string, string> = {
  "مفتوح": "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  "مغلق": "bg-muted/30 border-border text-muted-foreground",
  "قيد المراجعة": "bg-primary/10 border-primary/30 text-primary",
};

const sourceOptions = ["مباشر", "لينكدإن", "إحالة موظف", "موقع توظيف", "أخرى"];

/* ──────── Ranking Algorithm ──────── */
function calcRankScore(a: DbApplicant): number {
  // Rating weight: 40%
  const ratingScore = (a.rating / 5) * 40;
  // Stage progress weight: 20%
  const stageIdx = STAGES.indexOf(a.stage as any);
  const stageScore = stageIdx >= 0 ? (stageIdx / (STAGES.length - 1)) * 20 : 0;
  // Experience weight: 25%
  const expScore = Math.min(a.experience_years / 15, 1) * 25;
  // Skills count weight: 15%
  const skillsCount = a.skills?.length || 0;
  const skillsScore = Math.min(skillsCount / 8, 1) * 15;
  return Math.round(ratingScore + stageScore + expScore + skillsScore);
}

function rankLabel(score: number): { text: string; color: string } {
  if (score >= 80) return { text: "ممتاز", color: "text-green-400 bg-green-500/10 border-green-500/30" };
  if (score >= 60) return { text: "جيد جداً", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };
  if (score >= 40) return { text: "جيد", color: "text-primary bg-primary/10 border-primary/30" };
  if (score >= 20) return { text: "مقبول", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" };
  return { text: "ضعيف", color: "text-red-400 bg-red-500/10 border-red-500/30" };
}

/* ──────── Star Rating Component ──────── */
function StarRating({ value, onChange, size = 14 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i)}
          className={`transition-colors ${onChange ? "cursor-pointer hover:scale-110" : "cursor-default"}`}
          disabled={!onChange}
        >
          <Star
            style={{ width: size, height: size }}
            className={i <= value ? "text-primary fill-primary" : "text-muted-foreground/30"}
          />
        </button>
      ))}
    </div>
  );
}

/* ──────── Input Field Helper ──────── */
const inputCls = "w-full h-11 px-4 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none";
const selectCls = inputCls;
const labelCls = "text-foreground block mb-1.5";

/* ──────── Main Component ──────── */
export function Recruitment() {
  const { jobs, loading: jobsLoading, refetch: refetchJobs } = useJobOpenings();
  const { applicants, loading: appsLoading, refetch: refetchApps } = useApplicants();

  const [view, setView] = useState<"jobs" | "applicants" | "pipeline" | "bank">("applicants");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [showJobForm, setShowJobForm] = useState(false);
  const [showApplicantForm, setShowApplicantForm] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<DbApplicant | null>(null);
  const [editingApplicant, setEditingApplicant] = useState<DbApplicant | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStage, setFilterStage] = useState<string>("الكل");
  const [filterJob, setFilterJob] = useState<string>("الكل");
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
    if (filterStage !== "الكل") list = list.filter(a => a.stage === filterStage);
    if (filterJob !== "الكل") list = list.filter(a => a.job_opening_id === filterJob);

    const dir = recSortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (sortBy === "rank") return dir * (calcRankScore(a) - calcRankScore(b));
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
    openJobs: jobs.filter(j => j.status === "مفتوح").length,
    totalApplicants: applicants.length,
    interviewing: applicants.filter(a => a.stage === "مقابلة").length,
    hired: applicants.filter(a => a.stage === "مقبول").length,
    bookmarked: applicants.filter(a => a.is_bookmarked).length,
  }), [jobs, applicants]);

  /* ──── CRUD Handlers ──── */
  const handleToggleBookmark = useCallback(async (app: DbApplicant) => {
    const { error } = await supabase
      .from("applicants")
      .update({ is_bookmarked: !app.is_bookmarked })
      .eq("id", app.id);
    if (!error) refetchApps();
  }, [refetchApps]);

  const handleUpdateRating = useCallback(async (id: string, rating: number) => {
    const { error } = await supabase.from("applicants").update({ rating }).eq("id", id);
    if (!error) refetchApps();
  }, [refetchApps]);

  const handleUpdateStage = useCallback(async (id: string, stage: string) => {
    const { error } = await supabase.from("applicants").update({ stage }).eq("id", id);
    if (!error) refetchApps();
  }, [refetchApps]);

  const handleDeleteApplicant = useCallback(async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المتقدم؟")) return;
    const { error } = await supabase.from("applicants").delete().eq("id", id);
    if (!error) {
      setSelectedApplicant(null);
      refetchApps();
    }
  }, [refetchApps]);

  const handleConvertToEmployee = useCallback(async (app: DbApplicant) => {
    if (!confirm(`هل تريد تحويل "${app.name}" إلى موظف في النظام؟`)) return;

    // Retry loop handles TOCTOU race on person_id (two concurrent inserts could pick same ID)
    const MAX_RETRIES = 3;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        // Get next person_id
        const { data: maxRow } = await supabase.from("employees").select("person_id").order("person_id", { ascending: false }).limit(1);
        const nextPid = (maxRow?.[0]?.person_id ?? 0) + 1;

        const { error } = await supabase.from("employees").insert({
          person_id: nextPid,
          name: app.name,
          arabic_name: app.name,
          english_name: app.name,
          email: app.email || null,
          personal_phone: app.phone || null,
          department: app.job_department || "غير محدد",
          position: app.job_title || null,
          monthly_salary: app.expected_salary || 0,
          currency: app.salary_currency || "IQD",
          join_date: new Date().toISOString().substring(0, 10),
          status: "نشط",
          overtime_rate: 1.5,
          overtime_enabled: false,
          allowed_late_minutes: 15,
          device_employee_no: String(nextPid),
          source: "recruitment",
        });

        if (error) {
          // If unique constraint violation on person_id, retry with next ID
          if (error.code === "23505" && attempt < MAX_RETRIES - 1) continue;
          throw error;
        }

        // Mark applicant as converted
        await supabase.from("applicants").update({ stage: "مقبول", notes: (app.notes || "") + "\n[تم التحويل لموظف]" }).eq("id", app.id);

        setSelectedApplicant(null);
        refetchApps();
        alert(`تم إضافة "${app.name}" كموظف برقم ${nextPid} بنجاح!`);
        return; // Success — exit retry loop
      } catch (e: any) {
        if (attempt === MAX_RETRIES - 1) {
          alert("خطأ في تحويل المتقدم: " + e.message);
        }
      }
    }
  }, [refetchApps]);

  /* ──── Loading State ──── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="text-muted-foreground ms-3">جاري تحميل بيانات التوظيف...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-gradient-gold">التوظيف</h1>
          <p className="text-muted-foreground mt-1">إدارة الوظائف الشاغرة وبنك المرشحين ونظام الترتيب</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <ViewToggle view={viewMode} onChange={setViewMode} />
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setShowApplicantForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-lg cursor-pointer"
            style={{ fontSize: 13 }}>
            <UserPlus className="w-4 h-4" /> إضافة متقدم
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setShowJobForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg shadow-lg shadow-primary/20 hover:bg-gold-dark transition-colors cursor-pointer"
            style={{ fontSize: 13 }}>
            <Plus className="w-4 h-4" /> وظيفة شاغرة جديدة
          </motion.button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "وظائف شاغرة", value: stats.openJobs, icon: Briefcase },
          { label: "إجمالي المتقدمين", value: stats.totalApplicants, icon: Users },
          { label: "قيد المقابلة", value: stats.interviewing, icon: UserPlus },
          { label: "تم التوظيف", value: stats.hired, icon: FileCheck },
          { label: "مرشحين مفضلين", value: stats.bookmarked, icon: BookmarkCheck },
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
          { id: "jobs" as const, label: "الوظائف الشاغرة" },
          { id: "applicants" as const, label: "المتقدمين" },
          { id: "pipeline" as const, label: "مسار التوظيف" },
          { id: "bank" as const, label: "بنك المرشحين" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id)}
            className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${view === tab.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
            style={{ fontSize: 13 }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════ JOBS VIEW ══════════ */}
      {view === "jobs" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.length === 0 ? (
            <div className="col-span-full">
              <EmptyState icon={Briefcase} message="لا توجد وظائف شاغرة بعد" hint="اضغط &quot;وظيفة شاغرة جديدة&quot; لإضافة أول وظيفة" className="py-16" />
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
                <span className={`px-2 py-0.5 rounded-md border ${statusColors[job.status] || ""}`} style={{ fontSize: 12 }}>
                  {job.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 mb-3">
                <span className="flex items-center gap-1 text-muted-foreground" style={{ fontSize: 12 }}>
                  <MapPin className="w-3.5 h-3.5" />{job.location}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground" style={{ fontSize: 12 }}>
                  <Briefcase className="w-3.5 h-3.5" />{job.type}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground" style={{ fontSize: 12 }}>
                  <Users className="w-3.5 h-3.5" />{job.applicant_count || 0} متقدم
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
            </motion.div>
          ))}
        </div>
      )}

      {/* ══════════ APPLICANTS VIEW ══════════ */}
      {view === "applicants" && (
        <>
          {/* Search & Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input type="text" placeholder="بحث بالاسم، البريد، الهاتف، المهارات..."
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full h-10 ps-9 pe-4 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none"
                style={{ fontSize: 13 }} />
            </div>
            <select value={filterStage} onChange={e => setFilterStage(e.target.value)}
              className="h-10 px-3 rounded-lg border border-border bg-input-background text-foreground cursor-pointer" style={{ fontSize: 13 }}>
              <option value="الكل">كل المراحل</option>
              {ALL_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filterJob} onChange={e => setFilterJob(e.target.value)}
              className="h-10 px-3 rounded-lg border border-border bg-input-background text-foreground cursor-pointer" style={{ fontSize: 13 }}>
              <option value="الكل">كل الوظائف</option>
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
                    <p className="text-muted-foreground text-center py-4" style={{ fontSize: 12 }}>لا يوجد</p>
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
        {showJobForm && (
          <JobFormModal jobs={jobs} onClose={() => setShowJobForm(false)} onSaved={() => { setShowJobForm(false); refetchJobs(); }} />
        )}
        {showApplicantForm && (
          <ApplicantFormModal
            jobs={jobs}
            editingApplicant={editingApplicant}
            onClose={() => { setShowApplicantForm(false); setEditingApplicant(null); }}
            onSaved={() => { setShowApplicantForm(false); setEditingApplicant(null); refetchApps(); }}
          />
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
function ApplicantsTable({ applicants, onSelect, onToggleBookmark, onUpdateRating, onUpdateStage }: {
  applicants: DbApplicant[];
  onSelect: (a: DbApplicant) => void;
  onToggleBookmark: (a: DbApplicant) => void;
  onUpdateRating: (id: string, r: number) => void;
  onUpdateStage: (id: string, s: string) => void;
}) {
  const [sortBy, setSortBy] = useState("rank");
  const [recSortDir, setRecSortDir] = useState<"asc" | "desc">("desc");

  if (applicants.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>لا يوجد متقدمين</p>
        <p style={{ fontSize: 12 }}>اضغط "إضافة متقدم" لإدخال أول مرشح</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card/30 backdrop-blur-md border border-border/40 rounded-xl overflow-hidden shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <SortableHeaderRow
              columns={[
                { label: "", key: null },
                { label: "المتقدم", key: "name" },
                { label: "الوظيفة", key: "job" },
                { label: "تاريخ التقديم", key: "date" },
                { label: "المرحلة", key: "stage" },
                { label: "التقييم", key: "rating" },
                { label: "الترتيب", key: "rank" },
                { label: "", key: null },
              ]}
              sortBy={sortBy}
              sortDir={recSortDir}
              onSort={(key) => toggleSort(key, sortBy, recSortDir, setSortBy, setRecSortDir)}
            />
          </thead>
          <tbody>
            {applicants.map((app, i) => {
              const score = calcRankScore(app);
              const rank = rankLabel(score);
              return (
                <motion.tr key={app.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                  <td className="px-3 py-3">
                    <button onClick={() => onToggleBookmark(app)} className="cursor-pointer p-1 rounded hover:bg-primary/10">
                      {app.is_bookmarked
                        ? <BookmarkCheck className="w-4 h-4 text-primary" />
                        : <Bookmark className="w-4 h-4 text-muted-foreground/40" />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => onSelect(app)} className="flex items-center gap-3 cursor-pointer hover:text-primary transition-colors">
                      <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary" style={{ fontSize: 12 }}>{app.name.charAt(0)}</span>
                      </div>
                      <div className="text-start">
                        <span className="text-foreground block">{app.name}</span>
                        {app.email && <span className="text-muted-foreground block" style={{ fontSize: 11 }} dir="ltr">{app.email}</span>}
                      </div>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }}>{app.job_title || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }} dir="ltr">{app.applied_date}</td>
                  <td className="px-4 py-3">
                    <select value={app.stage}
                      onChange={e => onUpdateStage(app.id, e.target.value)}
                      className={`px-2 py-0.5 rounded-md border cursor-pointer bg-transparent ${stageColors[app.stage] || ""}`}
                      style={{ fontSize: 12 }}>
                      {ALL_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <StarRating value={app.rating} onChange={r => onUpdateRating(app.id, r)} size={12} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-md border ${rank.color}`} style={{ fontSize: 11 }}>
                      {score}% — {rank.text}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {app.resume_url && (
                        <a href={app.resume_url} target="_blank" rel="noopener noreferrer"
                          className="p-1 rounded hover:bg-primary/10 text-primary" title="تحميل CV">
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button onClick={() => onSelect(app)} className="p-1 rounded hover:bg-primary/10 text-muted-foreground cursor-pointer" title="عرض التفاصيل">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

/* ──── Candidate Bank ──── */
function CandidateBank({ applicants, jobs, onSelect, onToggleBookmark, onUpdateRating, sortBy, setSortBy }: {
  applicants: DbApplicant[];
  jobs: DbJobOpening[];
  onSelect: (a: DbApplicant) => void;
  onToggleBookmark: (a: DbApplicant) => void;
  onUpdateRating: (id: string, r: number) => void;
  sortBy: string;
  setSortBy: (s: any) => void;
}) {
  const [bankSearch, setBankSearch] = useState("");
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  const [skillFilter, setSkillFilter] = useState("");

  // All unique skills
  const allSkills = useMemo(() => {
    const set = new Set<string>();
    applicants.forEach(a => (a.skills || []).forEach(s => set.add(s)));
    return Array.from(set).sort();
  }, [applicants]);

  const filtered = useMemo(() => {
    let list = [...applicants];
    if (onlyBookmarked) list = list.filter(a => a.is_bookmarked);
    if (bankSearch) {
      const q = bankSearch.toLowerCase();
      list = list.filter(a =>
        a.name.toLowerCase().includes(q) ||
        (a.skills || []).some(s => s.toLowerCase().includes(q)) ||
        (a.education || "").toLowerCase().includes(q) ||
        (a.current_company || "").toLowerCase().includes(q)
      );
    }
    if (skillFilter) list = list.filter(a => (a.skills || []).includes(skillFilter));

    list.sort((a, b) => {
      if (sortBy === "rank") return calcRankScore(b) - calcRankScore(a);
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "date") return new Date(b.applied_date).getTime() - new Date(a.applied_date).getTime();
      return a.name.localeCompare(b.name, "ar");
    });
    return list;
  }, [applicants, bankSearch, onlyBookmarked, skillFilter, sortBy]);

  return (
    <div className="space-y-4">
      {/* Bank header */}
      <div className="bg-card/30 backdrop-blur-md border border-border/40 rounded-xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            <h3 className="text-foreground">بنك المرشحين — نظام الترتيب الذكي</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setOnlyBookmarked(!onlyBookmarked)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${onlyBookmarked ? "bg-primary/10 border-primary/30 text-primary" : "border-border text-muted-foreground hover:bg-muted/20"}`}
              style={{ fontSize: 12 }}>
              <BookmarkCheck className="w-3.5 h-3.5" /> المفضلين فقط
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input type="text" placeholder="بحث بالاسم، المهارات، الشركة، التعليم..."
              value={bankSearch} onChange={e => setBankSearch(e.target.value)}
              className="w-full h-10 ps-9 pe-4 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none"
              style={{ fontSize: 13 }} />
          </div>
          <select value={skillFilter} onChange={e => setSkillFilter(e.target.value)}
            className="h-10 px-3 rounded-lg border border-border bg-input-background text-foreground cursor-pointer" style={{ fontSize: 13 }}>
            <option value="">كل المهارات</option>
            {allSkills.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="h-10 px-3 rounded-lg border border-border bg-input-background text-foreground cursor-pointer" style={{ fontSize: 13 }}>
            <option value="rank">ترتيب حسب الكفاءة</option>
            <option value="rating">ترتيب حسب التقييم</option>
            <option value="date">ترتيب حسب التاريخ</option>
            <option value="name">ترتيب أبجدي</option>
          </select>
        </div>
      </div>

      {/* Ranking explanation */}
      <div className="bg-gradient-to-l from-primary/5 to-transparent border border-primary/20 rounded-xl p-4">
        <p className="text-muted-foreground" style={{ fontSize: 12 }}>
          <TrendingUp className="w-4 h-4 text-primary inline-block me-1" />
          <strong className="text-foreground">خوارزمية الترتيب:</strong>{" "}
          التقييم اليدوي (40%) + تقدّم المراحل (20%) + سنوات الخبرة (25%) + عدد المهارات (15%)
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-16 text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا يوجد مرشحين مطابقين</p>
          </div>
        ) : filtered.map((app, i) => {
          const score = calcRankScore(app);
          const rank = rankLabel(score);
          return (
            <motion.div key={app.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }} whileHover={{ y: -3 }}
              onClick={() => onSelect(app)}
              className="bg-card/30 backdrop-blur-md border border-border/40 rounded-xl p-4 shadow-lg hover:border-primary/40 transition-all cursor-pointer relative">
              {/* Rank badge */}
              <div className="absolute top-3 start-3">
                <span className={`px-2 py-0.5 rounded-md border ${rank.color}`} style={{ fontSize: 11 }}>
                  {score}%
                </span>
              </div>
              {/* Bookmark */}
              <div className="absolute top-3 end-3">
                <button onClick={e => { e.stopPropagation(); onToggleBookmark(app); }}
                  className="p-1 rounded hover:bg-primary/10 cursor-pointer">
                  {app.is_bookmarked
                    ? <BookmarkCheck className="w-4 h-4 text-primary" />
                    : <Bookmark className="w-4 h-4 text-muted-foreground/30" />}
                </button>
              </div>

              <div className="flex flex-col items-center pt-6 pb-3">
                <div className="w-14 h-14 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center mb-2">
                  <span className="text-primary" style={{ fontSize: 20 }}>{app.name.charAt(0)}</span>
                </div>
                <h4 className="text-foreground">{app.name}</h4>
                <p className="text-muted-foreground" style={{ fontSize: 12 }}>{app.job_title || "—"}</p>
                <div className="mt-2">
                  <StarRating value={app.rating} onChange={r => { onUpdateRating(app.id, r); }} size={14} />
                </div>
              </div>

              <div className="border-t border-border/20 pt-3 space-y-2">
                {app.experience_years > 0 && (
                  <div className="flex items-center gap-2 text-muted-foreground" style={{ fontSize: 12 }}>
                    <Briefcase className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{app.experience_years} سنة خبرة</span>
                    {app.current_company && <span>— {app.current_company}</span>}
                  </div>
                )}
                {app.education && (
                  <div className="flex items-center gap-2 text-muted-foreground" style={{ fontSize: 12 }}>
                    <GraduationCap className="w-3.5 h-3.5 flex-shrink-0" /> {app.education}
                  </div>
                )}
                {app.skills && app.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {app.skills.slice(0, 4).map(s => (
                      <span key={s} className="px-1.5 py-0.5 rounded bg-primary/10 text-primary" style={{ fontSize: 10 }}>{s}</span>
                    ))}
                    {app.skills.length > 4 && (
                      <span className="px-1.5 py-0.5 rounded bg-muted/30 text-muted-foreground" style={{ fontSize: 10 }}>+{app.skills.length - 4}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/20">
                <span className={`px-2 py-0.5 rounded-md border ${stageColors[app.stage] || ""}`} style={{ fontSize: 11 }}>
                  {app.stage}
                </span>
                <span className={`px-2 py-0.5 rounded-md border ${rank.color}`} style={{ fontSize: 11 }}>
                  {rank.text}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ──── Applicant Detail Panel ──── */
function ApplicantDetailPanel({ applicant, onClose, onEdit, onDelete, onUpdateStage, onUpdateRating, onToggleBookmark, onRefresh, onConvertToEmployee }: {
  applicant: DbApplicant;
  onClose: () => void;
  onEdit: (a: DbApplicant) => void;
  onDelete: (id: string) => void;
  onUpdateStage: (id: string, s: string) => void;
  onUpdateRating: (id: string, r: number) => void;
  onToggleBookmark: (a: DbApplicant) => void;
  onRefresh: () => void;
  onConvertToEmployee: (a: DbApplicant) => void;
}) {
  const [interviewNotes, setInterviewNotes] = useState(applicant.interview_notes || "");
  const [savingNotes, setSavingNotes] = useState(false);
  const score = calcRankScore(applicant);
  const rank = rankLabel(score);

  const saveNotes = async () => {
    setSavingNotes(true);
    await supabase.from("applicants").update({ interview_notes: interviewNotes }).eq("id", applicant.id);
    setSavingNotes(false);
    onRefresh();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-card border border-border rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-border/40">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center">
                <span className="text-primary" style={{ fontSize: 24 }}>{applicant.name.charAt(0)}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-foreground">{applicant.name}</h2>
                  <button onClick={() => onToggleBookmark(applicant)} className="cursor-pointer">
                    {applicant.is_bookmarked
                      ? <BookmarkCheck className="w-5 h-5 text-primary" />
                      : <Bookmark className="w-5 h-5 text-muted-foreground/40" />}
                  </button>
                </div>
                <p className="text-muted-foreground" style={{ fontSize: 13 }}>{applicant.job_title || "—"} — {applicant.job_department || ""}</p>
                <div className="flex items-center gap-3 mt-2">
                  <StarRating value={applicant.rating} onChange={r => onUpdateRating(applicant.id, r)} />
                  <span className={`px-2 py-0.5 rounded-md border ${rank.color}`} style={{ fontSize: 11 }}>
                    {score}% — {rank.text}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => onEdit(applicant)} className="p-2 rounded-lg hover:bg-secondary cursor-pointer" title="تعديل">
                <Edit3 className="w-4 h-4 text-muted-foreground" />
              </button>
              <button onClick={() => onDelete(applicant.id)} className="p-2 rounded-lg hover:bg-destructive/10 cursor-pointer" title="حذف">
                <Trash2 className="w-4 h-4 text-destructive" />
              </button>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary cursor-pointer">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Stage */}
          <div>
            <label className="text-muted-foreground block mb-2" style={{ fontSize: 12 }}>المرحلة الحالية</label>
            <div className="flex items-center gap-2 flex-wrap">
              {ALL_STAGES.map(s => (
                <button key={s} onClick={() => onUpdateStage(applicant.id, s)}
                  className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${applicant.stage === s ? stageColors[s] : "border-border/30 text-muted-foreground hover:bg-muted/20"}`}
                  style={{ fontSize: 12 }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoRow icon={<Mail className="w-4 h-4" />} label="البريد" value={applicant.email} dir="ltr" />
            <InfoRow icon={<Phone className="w-4 h-4" />} label="الهاتف" value={applicant.phone} dir="ltr" />
            <InfoRow icon={<MapPin className="w-4 h-4" />} label="المدينة" value={applicant.city} />
            <InfoRow icon={<Building2 className="w-4 h-4" />} label="الشركة الحالية" value={applicant.current_company} />
            <InfoRow icon={<GraduationCap className="w-4 h-4" />} label="التعليم" value={applicant.education} />
            <InfoRow icon={<Briefcase className="w-4 h-4" />} label="سنوات الخبرة" value={applicant.experience_years > 0 ? `${applicant.experience_years} سنة` : null} />
            <InfoRow icon={<Clock className="w-4 h-4" />} label="تاريخ التقديم" value={applicant.applied_date} dir="ltr" />
            <InfoRow icon={<Users className="w-4 h-4" />} label="المصدر" value={applicant.source} />
          </div>

          {/* Expected Salary */}
          {applicant.expected_salary && (
            <div className="p-3 rounded-lg bg-muted/20 border border-border/20">
              <span className="text-muted-foreground" style={{ fontSize: 12 }}>الراتب المتوقع: </span>
              <span className="text-foreground" style={{ fontSize: 13 }}>
                {formatNumber(Number(applicant.expected_salary))} {applicant.salary_currency || "IQD"}
              </span>
            </div>
          )}

          {/* Skills */}
          {applicant.skills && applicant.skills.length > 0 && (
            <div>
              <label className="text-muted-foreground block mb-2" style={{ fontSize: 12 }}>المهارات</label>
              <div className="flex flex-wrap gap-2">
                {applicant.skills.map(s => (
                  <span key={s} className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary" style={{ fontSize: 12 }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* CV */}
          {applicant.resume_url && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <a href={applicant.resume_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-emerald-400 hover:underline">
                <FileText className="w-4 h-4" />
                <span style={{ fontSize: 13 }}>تحميل السيرة الذاتية</span>
                <Download className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Notes */}
          {applicant.notes && (
            <div>
              <label className="text-muted-foreground block mb-1" style={{ fontSize: 12 }}>ملاحظات</label>
              <p className="text-foreground p-3 rounded-lg bg-muted/20 border border-border/20" style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>
                {applicant.notes}
              </p>
            </div>
          )}

          {/* Interview Notes */}
          <div>
            <label className="text-muted-foreground block mb-1" style={{ fontSize: 12 }}>ملاحظات المقابلة</label>
            <textarea value={interviewNotes} onChange={e => setInterviewNotes(e.target.value)}
              rows={4} placeholder="أضف ملاحظات المقابلة هنا..."
              className="w-full px-4 py-3 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none resize-none"
              style={{ fontSize: 13 }} />
            <button onClick={saveNotes} disabled={savingNotes}
              className="mt-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-gold-dark transition-colors cursor-pointer disabled:opacity-50"
              style={{ fontSize: 12 }}>
              {savingNotes ? "جاري الحفظ..." : "حفظ الملاحظات"}
            </button>
          </div>

          {/* Ranking Breakdown */}
          <div>
            <label className="text-muted-foreground block mb-2" style={{ fontSize: 12 }}>تفاصيل الترتيب</label>
            <div className="grid grid-cols-2 gap-3">
              <RankBar label="التقييم" value={(applicant.rating / 5) * 100} weight="40%" />
              <RankBar label="تقدّم المراحل" value={STAGES.indexOf(applicant.stage as any) >= 0 ? (STAGES.indexOf(applicant.stage as any) / (STAGES.length - 1)) * 100 : 0} weight="20%" />
              <RankBar label="الخبرة" value={Math.min(applicant.experience_years / 15, 1) * 100} weight="25%" />
              <RankBar label="المهارات" value={Math.min((applicant.skills?.length || 0) / 8, 1) * 100} weight="15%" />
            </div>
          </div>

          {/* Convert to Employee — only for accepted applicants */}
          {applicant.stage === "مقبول" && (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onConvertToEmployee(applicant)}
              className="w-full py-3 rounded-xl bg-emerald-500 text-white font-medium shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-colors cursor-pointer flex items-center justify-center gap-2"
              style={{ fontSize: 14 }}
            >
              <UserPlus className="w-5 h-5" />
              تحويل إلى موظف (إلحاق بالنظام)
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function InfoRow({ icon, label, value, dir }: { icon: React.ReactNode; label: string; value: string | null | undefined; dir?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/10 border border-border/10">
      <span className="text-primary flex-shrink-0">{icon}</span>
      <div>
        <span className="text-muted-foreground block" style={{ fontSize: 11 }}>{label}</span>
        <span className="text-foreground" style={{ fontSize: 13, direction: dir as any }}>{value}</span>
      </div>
    </div>
  );
}

function RankBar({ label, value, weight }: { label: string; value: number; weight: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-muted-foreground" style={{ fontSize: 11 }}>{label} ({weight})</span>
        <span className="text-foreground" style={{ fontSize: 11 }}>{Math.round(value)}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-muted/30 overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full bg-primary" />
      </div>
    </div>
  );
}

/* ──── Job Form Modal ──── */
function JobFormModal({ jobs, onClose, onSaved }: {
  jobs: DbJobOpening[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: "", department: "تقنية المعلومات", location: "بغداد",
    type: "دوام كامل", deadline: "", description: "", salary_range: "",
    requirements: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const reqs = form.requirements.split("\n").map(r => r.trim()).filter(Boolean);
    const { error } = await supabase.from("job_openings").insert({
      title: form.title,
      department: form.department,
      location: form.location,
      type: form.type,
      deadline: form.deadline || null,
      description: form.description || null,
      salary_range: form.salary_range || null,
      requirements: reqs.length > 0 ? reqs : null,
    });
    setSaving(false);
    if (!error) onSaved();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-lg max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-foreground">وظيفة شاغرة جديدة</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary cursor-pointer"><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className={labelCls} style={{ fontSize: 13 }}>المسمى الوظيفي *</label>
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="عنوان الوظيفة" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} style={{ fontSize: 13 }}>القسم</label>
              <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className={selectCls}>
                {DEPARTMENTS.map(d => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} style={{ fontSize: 13 }}>الموقع</label>
              <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} style={{ fontSize: 13 }}>نوع الدوام</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className={selectCls}>
                <option>دوام كامل</option><option>دوام جزئي</option><option>عقد مؤقت</option>
              </select>
            </div>
            <div>
              <label className={labelCls} style={{ fontSize: 13 }}>الموعد النهائي</label>
              <input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} className={inputCls} dir="ltr" />
            </div>
          </div>
          <div>
            <label className={labelCls} style={{ fontSize: 13 }}>نطاق الراتب</label>
            <input type="text" value={form.salary_range} onChange={e => setForm({ ...form, salary_range: e.target.value })}
              placeholder="مثال: 1,500,000 - 2,500,000 IQD" className={inputCls} />
          </div>
          <div>
            <label className={labelCls} style={{ fontSize: 13 }}>المتطلبات (سطر لكل متطلب)</label>
            <textarea value={form.requirements} onChange={e => setForm({ ...form, requirements: e.target.value })}
              rows={3} placeholder="خبرة 5 سنوات..." className={`${inputCls} h-auto py-3 resize-none`} />
          </div>
          <div>
            <label className={labelCls} style={{ fontSize: 13 }}>الوصف</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3} placeholder="وصف الوظيفة..." className={`${inputCls} h-auto py-3 resize-none`} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving || !form.title.trim()}
              className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground hover:bg-gold-dark transition-colors shadow-lg shadow-primary/20 cursor-pointer disabled:opacity-50">
              {saving ? "جاري الحفظ..." : "نشر الوظيفة"}
            </button>
            <button onClick={onClose} className="flex-1 h-11 rounded-lg border-2 border-border text-foreground hover:bg-secondary transition-colors cursor-pointer">إلغاء</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ──── Applicant Form Modal ──── */
function ApplicantFormModal({ jobs, editingApplicant, onClose, onSaved }: {
  jobs: DbJobOpening[];
  editingApplicant: DbApplicant | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!editingApplicant;
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [form, setForm] = useState({
    name: editingApplicant?.name || "",
    email: editingApplicant?.email || "",
    phone: editingApplicant?.phone || "",
    job_opening_id: editingApplicant?.job_opening_id || (jobs[0]?.id || ""),
    stage: editingApplicant?.stage || "تقديم",
    rating: editingApplicant?.rating || 0,
    skills: (editingApplicant?.skills || []).join(", "),
    experience_years: editingApplicant?.experience_years || 0,
    education: editingApplicant?.education || "",
    current_company: editingApplicant?.current_company || "",
    city: editingApplicant?.city || "بغداد",
    gender: editingApplicant?.gender || "",
    source: editingApplicant?.source || "مباشر",
    expected_salary: editingApplicant?.expected_salary || "",
    salary_currency: editingApplicant?.salary_currency || "IQD",
    notes: editingApplicant?.notes || "",
    resume_url: editingApplicant?.resume_url || "",
  });

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setUploadError("");
    const ext = file.name.split(".").pop();
    const path = `cv-${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage.from("resumes").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      setUploadError("فشل رفع الملف: " + error.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("resumes").getPublicUrl(path);
    setForm(prev => ({ ...prev, resume_url: urlData.publicUrl }));
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.job_opening_id) return;
    setSaving(true);
    const skillsArr = form.skills.split(",").map(s => s.trim()).filter(Boolean);

    const payload: any = {
      name: form.name,
      email: form.email || null,
      phone: form.phone || null,
      job_opening_id: form.job_opening_id,
      stage: form.stage,
      rating: form.rating,
      skills: skillsArr.length > 0 ? skillsArr : [],
      experience_years: Number(form.experience_years) || 0,
      education: form.education || null,
      current_company: form.current_company || null,
      city: form.city || null,
      gender: form.gender || null,
      source: form.source || "مباشر",
      expected_salary: form.expected_salary ? Number(form.expected_salary) : null,
      salary_currency: form.salary_currency || "IQD",
      notes: form.notes || null,
      resume_url: form.resume_url || null,
    };

    if (isEdit) {
      await supabase.from("applicants").update(payload).eq("id", editingApplicant!.id);
    } else {
      await supabase.from("applicants").insert(payload);
    }
    setSaving(false);
    onSaved();
  };

  const openJobs = jobs.filter(j => j.status === "مفتوح" || j.status === "قيد المراجعة");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={onClose}>
      <motion.div
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="fixed inset-y-0 end-0 w-full max-w-2xl bg-card border-s border-border shadow-2xl flex flex-col"
      >
        {/* ── Sticky Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-card/95 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-foreground">{isEdit ? "تعديل بيانات المتقدم" : "إضافة متقدم جديد"}</h2>
              <p className="text-muted-foreground" style={{ fontSize: 12 }}>أدخل جميع البيانات المطلوبة للمرشح</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary transition-colors cursor-pointer">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Section 1: المعلومات الأساسية */}
          <fieldset className="rounded-xl border border-border/30 p-4 space-y-4">
            <legend className="px-2 text-primary flex items-center gap-1.5" style={{ fontSize: 13 }}>
              <Users className="w-4 h-4" /> المعلومات الأساسية
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls} style={{ fontSize: 13 }}>الاسم الكامل *</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="اسم المتقدم" className={inputCls} />
              </div>
              <div>
                <label className={labelCls} style={{ fontSize: 13 }}>الوظيفة المتقدم لها *</label>
                <select value={form.job_opening_id} onChange={e => setForm({ ...form, job_opening_id: e.target.value })} className={selectCls}>
                  {openJobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                  {openJobs.length === 0 && <option value="">لا توجد وظائف مفتوحة</option>}
                </select>
              </div>
              <div>
                <label className={labelCls} style={{ fontSize: 13 }}>الجنس</label>
                <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className={selectCls}>
                  <option value="">— اختر —</option>
                  <option>ذكر</option>
                  <option>أنثى</option>
                </select>
              </div>
              <div>
                <label className={labelCls} style={{ fontSize: 13 }}>المدينة</label>
                <input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
                  placeholder="بغداد" className={inputCls} />
              </div>
            </div>
          </fieldset>

          {/* Section 2: معلومات التواصل */}
          <fieldset className="rounded-xl border border-border/30 p-4 space-y-4">
            <legend className="px-2 text-primary flex items-center gap-1.5" style={{ fontSize: 13 }}>
              <Phone className="w-4 h-4" /> معلومات التواصل
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls} style={{ fontSize: 13 }}>البريد الإلكتروني</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="email@example.com" className={inputCls} dir="ltr" />
              </div>
              <div>
                <label className={labelCls} style={{ fontSize: 13 }}>رقم الهاتف</label>
                <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="07xxxxxxxxx" className={inputCls} dir="ltr" />
              </div>
            </div>
          </fieldset>

          {/* Section 3: المؤهلات والخبرة */}
          <fieldset className="rounded-xl border border-border/30 p-4 space-y-4">
            <legend className="px-2 text-primary flex items-center gap-1.5" style={{ fontSize: 13 }}>
              <GraduationCap className="w-4 h-4" /> المؤهلات والخبرة
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls} style={{ fontSize: 13 }}>المؤهل العلمي</label>
                <select value={form.education} onChange={e => setForm({ ...form, education: e.target.value })} className={selectCls}>
                  <option value="">— اختر —</option>
                  <option>إعدادية</option>
                  <option>دبلوم</option>
                  <option>بكالوريوس</option>
                  <option>ماجستير</option>
                  <option>دكتوراه</option>
                </select>
              </div>
              <div>
                <label className={labelCls} style={{ fontSize: 13 }}>سنوات الخبرة</label>
                <input type="number" min={0} max={50} value={form.experience_years}
                  onChange={e => setForm({ ...form, experience_years: Number(e.target.value) })}
                  className={inputCls} dir="ltr" />
              </div>
              <div>
                <label className={labelCls} style={{ fontSize: 13 }}>الشركة الحالية</label>
                <input type="text" value={form.current_company} onChange={e => setForm({ ...form, current_company: e.target.value })}
                  placeholder="اسم الشركة" className={inputCls} />
              </div>
              <div>
                <label className={labelCls} style={{ fontSize: 13 }}>مصدر التقديم</label>
                <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} className={selectCls}>
                  {sourceOptions.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls} style={{ fontSize: 13 }}>المهارات (مفصولة بفاصلة)</label>
              <input type="text" value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })}
                placeholder="React, Node.js, SQL, إدارة مشاريع" className={inputCls} />
              {form.skills && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.skills.split(",").map(s => s.trim()).filter(Boolean).map((s, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary" style={{ fontSize: 11 }}>{s}</span>
                  ))}
                </div>
              )}
            </div>
          </fieldset>

          {/* Section 4: الراتب والتقييم */}
          <fieldset className="rounded-xl border border-border/30 p-4 space-y-4">
            <legend className="px-2 text-primary flex items-center gap-1.5" style={{ fontSize: 13 }}>
              <Trophy className="w-4 h-4" /> الراتب والتقييم
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls} style={{ fontSize: 13 }}>الراتب المتوقع</label>
                <input type="number" value={form.expected_salary} onChange={e => setForm({ ...form, expected_salary: e.target.value })}
                  placeholder="0" className={inputCls} dir="ltr" />
              </div>
              <div>
                <label className={labelCls} style={{ fontSize: 13 }}>العملة</label>
                <select value={form.salary_currency} onChange={e => setForm({ ...form, salary_currency: e.target.value })} className={selectCls}>
                  <option>IQD</option>
                  <option>USD</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls} style={{ fontSize: 13 }}>التقييم الأولي</label>
                <div className="pt-1.5">
                  <StarRating value={form.rating} onChange={r => setForm({ ...form, rating: r })} size={22} />
                </div>
              </div>
              <div>
                <label className={labelCls} style={{ fontSize: 13 }}>المرحلة</label>
                <select value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })} className={selectCls}>
                  {ALL_STAGES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </fieldset>

          {/* Section 5: السيرة الذاتية والملاحظات */}
          <fieldset className="rounded-xl border border-border/30 p-4 space-y-4">
            <legend className="px-2 text-primary flex items-center gap-1.5" style={{ fontSize: 13 }}>
              <FileText className="w-4 h-4" /> السيرة الذاتية والملاحظات
            </legend>
            <div>
              <label className={labelCls} style={{ fontSize: 13 }}>السيرة الذاتية (CV)</label>
              <div
                onClick={() => fileRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed transition-colors cursor-pointer ${form.resume_url ? "border-emerald-500/40 bg-emerald-500/5" : "border-border hover:border-primary/50 hover:bg-primary/5"}`}
              >
                {form.resume_url ? (
                  <>
                    <FileCheck className="w-8 h-8 text-emerald-400" />
                    <span className="text-emerald-400" style={{ fontSize: 13 }}>تم رفع الملف بنجاح</span>
                    <span className="text-muted-foreground" style={{ fontSize: 11 }}>اضغط لتغيير الملف</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-primary/60" />
                    <span className="text-foreground" style={{ fontSize: 13 }}>
                      {uploading ? "جاري الرفع..." : "اضغط لرفع ملف CV"}
                    </span>
                    <span className="text-muted-foreground" style={{ fontSize: 11 }}>PDF, DOC, DOCX — حد أقصى 5MB</span>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
                onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }} />
              {uploadError && (
                <p className="text-destructive mt-2 flex items-center gap-1" style={{ fontSize: 12 }}>
                  <AlertCircle className="w-3.5 h-3.5" /> {uploadError}
                </p>
              )}
            </div>
            <div>
              <label className={labelCls} style={{ fontSize: 13 }}>ملاحظات</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                rows={4} placeholder="ملاحظات إضافية عن المرشح..." className={`${inputCls} h-auto py-3 resize-none`} />
            </div>
          </fieldset>
        </div>

        {/* ── Sticky Footer ── */}
        <div className="px-6 py-4 border-t border-border/40 bg-card/95 backdrop-blur-sm flex-shrink-0">
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving || !form.name.trim() || !form.job_opening_id}
              className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground hover:bg-gold-dark transition-colors shadow-lg shadow-primary/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ fontSize: 14 }}>
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ...</>
              ) : (
                <><FileCheck className="w-4 h-4" /> {isEdit ? "تحديث البيانات" : "إضافة المتقدم"}</>
              )}
            </button>
            <button onClick={onClose}
              className="px-6 h-12 rounded-xl border-2 border-border text-foreground hover:bg-secondary transition-colors cursor-pointer"
              style={{ fontSize: 14 }}>إلغاء</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
