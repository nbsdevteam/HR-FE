import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ClipboardCheck, Star, Plus, X, Eye, TrendingUp, Users, Award, Target,
  ChevronDown, Loader2, Search, CalendarRange, UserCheck, Save, Pencil,
  Calendar, BarChart3, CheckCircle, Clock, AlertCircle, Trash2,
} from "lucide-react";
import { localizedConfirm } from "../i18n/native";
import * as odooData from "../lib/api/odooData";
import { EmployeeSelect } from "../components/EmployeeSelect";
import { useEmployees, empDisplayName } from "../lib/hooks";
import type { DbEmployee } from "../lib/hooks";

// Odoo's lugal.hr.evaluation uses a fixed English status selection; the FE
// displays Arabic labels directly. Map between them explicitly.
const EVAL_STATUS_TO_ODOO: Record<string, string> = {
  "قيد التقييم": "draft",
  "مكتمل": "completed",
  "لم يبدأ": "draft",
};
const ODOO_STATUS_TO_EVAL: Record<string, string> = {
  draft: "قيد التقييم",
  completed: "مكتمل",
  approved: "مكتمل",
};
import { CustomBarChart } from "../components/custom-bar-chart";
import { CustomRadarChart } from "../components/custom-radar-chart";
import { ViewToggle } from "../components/ViewToggle";
import { SortableHeaderRow, toggleSort } from "../components/SortableHeader";
import { EmptyState } from "../components/EmptyState";
import { arabicSource } from "../i18n/source";

// ──────────────────────── Types & Constants ────────────────────────

const cardCls = "bg-card/30 backdrop-blur-md border border-border/40 rounded-xl overflow-hidden shadow-lg";
const inputCls = "w-full h-11 px-4 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none";

const RATING_SCALE = [
  { value: 1, label: arabicSource("evaluation.not_achieved"), labelEn: "No Achieve", color: "#DC2626", bgColor: "bg-red-500/10 border-red-500/20 text-red-400" },
  { value: 2, label: arabicSource("evaluation.below_expectations"), labelEn: "Below Expectation", color: "#F59E0B", bgColor: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" },
  { value: 3, label: arabicSource("evaluation.is_within_expected"), labelEn: "Within Expected", color: "#3B82F6", bgColor: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
  { value: 4, label: arabicSource("evaluation.exceeded_expectations"), labelEn: "Exceeded Expectation", color: "#22C55E", bgColor: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
  { value: 5, label: arabicSource("evaluation.outstanding_performance"), labelEn: "Outstanding / Distinguished", color: "#D4AF37", bgColor: "bg-primary/10 border-primary/20 text-primary" },
];

const DEFAULT_CRITERIA = [
  arabicSource("evaluation.quality_of_work"),
  arabicSource("evaluation.commitment"),
  arabicSource("evaluation.teamwork"),
  arabicSource("evaluation.initiative"),
  arabicSource("evaluation.leadership_skills"),
  arabicSource("evaluation.communication"),
];

const EVAL_CYCLES = [
  { value: arabicSource("common.quarterly"), label: arabicSource("evaluation.quarterly_every_3_months"), icon: CalendarRange },
  { value: arabicSource("common.semi_annually"), label: arabicSource("evaluation.semi_annually_every_6_months"), icon: Calendar },
  { value: arabicSource("common.annual"), label: arabicSource("common.annual"), icon: BarChart3 },
  { value: arabicSource("common.probationary_period"), label: arabicSource("evaluation.probation_period_for_new_employees"), icon: UserCheck },
] as const;

type EvalCycleType = typeof EVAL_CYCLES[number]["value"];

function getPeriodOptions(cycle: EvalCycleType, year: number): string[] {
  switch (cycle) {
    case arabicSource("common.quarterly"):
      return [`${arabicSource("evaluation.first_quarter")} ${year}`, `${arabicSource("evaluation.second_quarter")} ${year}`, `${arabicSource("evaluation.third_quarter")} ${year}`, `${arabicSource("evaluation.fourth_quarter")} ${year}`];
    case arabicSource("common.semi_annually"):
      return [`${arabicSource("evaluation.first_half")} ${year}`, `${arabicSource("evaluation.the_second_half")} ${year}`];
    case arabicSource("common.annual"):
      return [`${arabicSource("evaluation.year")} ${year}`];
    case arabicSource("common.probationary_period"):
      return [`${arabicSource("common.probation_period")} ${year}`];
    default:
      return [];
  }
}

const STATUS_COLORS: Record<string, string> = {
  [arabicSource("common.complete")]: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  [arabicSource("common.under_evaluation")]: "bg-primary/10 border-primary/20 text-primary",
  [arabicSource("common.did_not_start")]: "bg-muted/30 border-border text-muted-foreground",
};

interface DbEvaluation {
  id: string;
  employee_id: string;
  evaluator_id: string | null;
  evaluator_name?: string | null;
  period: string;
  overall_rating: number;
  status: string;
  comments: string | null;
  created_at: string;
  updated_at: string;
}

interface DbEvalCriteria {
  id: string;
  evaluation_id: string;
  criterion_name: string;
  score: number;
  created_at: string;
}

// ──────────────────────── Helpers ────────────────────────

function getRatingInfo(rating: number) {
  return RATING_SCALE.find(r => r.value === rating) || RATING_SCALE[2];
}

function renderStars(rating: number, size = 16) {
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={`${i < rating ? "text-primary fill-primary" : "text-muted-foreground/30"}`}
      style={{ width: size, height: size }}
    />
  ));
}

// ──────────────────────── Main Component ────────────────────────

export function EvaluationPage() {
  const { employees, loading: empLoading } = useEmployees();
  const [evaluations, setEvaluations] = useState<DbEvaluation[]>([]);
  const [criteria, setCriteria] = useState<DbEvalCriteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEval, setSelectedEval] = useState<DbEvaluation | null>(null);
  const [showNewEval, setShowNewEval] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>(arabicSource("common.all"));
  const [filterCycle, setFilterCycle] = useState<string>(arabicSource("common.all"));
  const [evalSortBy, setEvalSortBy] = useState<"employee" | "department" | "evaluator" | "period" | "rating" | "status">("period");
  const [evalSortDir, setEvalSortDir] = useState<"asc" | "desc">("desc");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { evaluations: evs, criteria: crit } = await odooData.fetchEvaluationsWithCriteria();
      setEvaluations(evs.map(e => ({ ...e, status: ODOO_STATUS_TO_EVAL[e.status] || e.status })) as any);
      setCriteria(crit as any);
    } catch (e) {
      console.error(e);
      setEvaluations([]);
      setCriteria([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Maps
  const empMap = useMemo(() => {
    const m: Record<string, DbEmployee> = {};
    employees.forEach(e => { m[e.id] = e; });
    return m;
  }, [employees]);

  // Filtered evaluations
  const filtered = useMemo(() => {
    let result = [...evaluations];
    if (filterStatus !== arabicSource("common.all")) {
      result = result.filter(e => e.status === filterStatus);
    }
    if (searchText) {
      result = result.filter(e => {
        const emp = empMap[e.employee_id];
        const name = emp ? empDisplayName(emp) : "";
        return name.includes(searchText) || e.period.includes(searchText);
      });
    }
    const dir = evalSortDir === "asc" ? 1 : -1;
    result.sort((a, b) => {
      if (evalSortBy === "employee") {
        const na = empMap[a.employee_id] ? empDisplayName(empMap[a.employee_id]) : "";
        const nb = empMap[b.employee_id] ? empDisplayName(empMap[b.employee_id]) : "";
        return dir * na.localeCompare(nb, "ar");
      }
      if (evalSortBy === "department") {
        const da = empMap[a.employee_id]?.department || "";
        const db = empMap[b.employee_id]?.department || "";
        return dir * da.localeCompare(db, "ar");
      }
      if (evalSortBy === "evaluator") return dir * (a.evaluator_name || "").localeCompare(b.evaluator_name || "", "ar");
      if (evalSortBy === "period") return dir * (a.period || "").localeCompare(b.period || "");
      if (evalSortBy === "rating") return dir * ((a.overall_rating || 0) - (b.overall_rating || 0));
      if (evalSortBy === "status") return dir * (a.status || "").localeCompare(b.status || "", "ar");
      return 0;
    });
    return result;
  }, [evaluations, filterStatus, searchText, empMap, evalSortBy, evalSortDir]);

  // Stats
  const totalEvals = evaluations.length;
  const completedCount = evaluations.filter(e => e.status === arabicSource("common.complete")).length;
  const inProgressCount = evaluations.filter(e => e.status === arabicSource("common.under_evaluation")).length;
  const avgRating = completedCount > 0
    ? (evaluations.filter(e => e.status === arabicSource("common.complete") && e.overall_rating > 0).reduce((s, e) => s + e.overall_rating, 0) / completedCount).toFixed(1)
    : "—";

  // Rating distribution
  const ratingDistribution = RATING_SCALE.map(scale => ({
    label: scale.label,
    value: evaluations.filter(e => e.overall_rating === scale.value && e.status === arabicSource("common.complete")).length,
  }));

  if (loading || empLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="text-muted-foreground ms-3">{arabicSource("evaluation.loading_reviews")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-gradient-gold">{arabicSource("common.performance_evaluation")}</h1>
          <p className="text-muted-foreground mt-1">{arabicSource("evaluation.five_point_performance_scale_evaluation_system_the_line_manager")}</p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle view={viewMode} onChange={setViewMode} />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNewEval(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg shadow-lg shadow-primary/20 hover:bg-gold-dark transition-colors cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            {arabicSource("evaluation.new_evaluation")}
          </motion.button>
        </div>
      </div>

      {/* Evaluation Cycle Info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`${cardCls} p-6`}>
        <h3 className="text-foreground mb-2">{arabicSource("evaluation.how_does_the_evaluation_system_work")}</h3>
        <p className="text-muted-foreground mb-4" style={{ fontSize: 13 }}>
          {arabicSource("evaluation.the_line_manager_depending_on_the_organizational_structure_is_re")}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {EVAL_CYCLES.map(cycle => {
            const Icon = cycle.icon;
            return (
              <div key={cycle.value} className="flex items-center gap-3 p-3 rounded-lg bg-muted/10 border border-border/20">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-foreground" style={{ fontSize: 13 }}>{cycle.value}</p>
                  <p className="text-muted-foreground" style={{ fontSize: 10 }}>{cycle.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Rating Scale Reference */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className={`${cardCls} p-6`}>
        <h3 className="text-foreground mb-4">{arabicSource("evaluation.five_point_rating_scale")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {RATING_SCALE.map(scale => (
            <div key={scale.value} className={`p-3 rounded-lg border ${scale.bgColor} text-center`}>
              <div className="flex justify-center mb-2">{renderStars(scale.value)}</div>
              <p className="text-foreground" style={{ fontSize: 13 }}>{scale.label}</p>
              <p className="text-muted-foreground" style={{ fontSize: 11 }}>{scale.labelEn}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: arabicSource("evaluation.total_ratings"), value: totalEvals, icon: ClipboardCheck },
          { label: arabicSource("common.complete_2"), value: completedCount, icon: Award },
          { label: arabicSource("common.under_evaluation"), value: inProgressCount, icon: Target },
          { label: arabicSource("evaluation.average_rating"), value: avgRating, icon: TrendingUp },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.15)" }}
              className="bg-card backdrop-blur-sm border border-border rounded-xl p-4 shadow-lg relative overflow-hidden hover:border-primary/30 transition-colors"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent w-28 pointer-events-none" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-muted-foreground" style={{ fontSize: 13 }}>{stat.label}</p>
                  <span className="text-gradient-gold block mt-2" style={{ fontSize: 28 }}>{stat.value}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Rating Distribution */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={`${cardCls} p-6`}>
        <h3 className="text-foreground mb-4">{arabicSource("evaluation.distribution_of_ratings")}</h3>
        <CustomBarChart data={ratingDistribution} barLabel={arabicSource("common.number_of_employees")} height={250} color="#D4AF37" />
      </motion.div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder={arabicSource("evaluation.search_by_name_or_period")}
            className={`${inputCls} flex-1`}
            style={{ height: 38 }}
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className={inputCls}
          style={{ width: 160, height: 38 }}
        >
          <option value={arabicSource("common.all")}>{arabicSource("common.all")}</option>
          <option value={arabicSource("common.complete")}>{arabicSource("common.complete")}</option>
          <option value={arabicSource("common.under_evaluation")}>{arabicSource("common.under_evaluation")}</option>
          <option value={arabicSource("common.did_not_start")}>{arabicSource("common.did_not_start")}</option>
        </select>
      </div>

      {/* Evaluations Table / Kanban */}
      <AnimatePresence mode="wait">
        {viewMode === "list" ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cardCls}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <SortableHeaderRow
                    columns={[
                      { label: arabicSource("common.employee"), key: "employee" },
                      { label: arabicSource("common.section"), key: "department" },
                      { label: arabicSource("evaluation.assessor_2"), key: "evaluator" },
                      { label: arabicSource("common.period"), key: "period" },
                      { label: arabicSource("common.evaluation"), key: "rating" },
                      { label: arabicSource("common.status"), key: "status" },
                      { label: arabicSource("common.procedures"), key: null },
                    ]}
                    sortBy={evalSortBy}
                    sortDir={evalSortDir}
                    onSort={(key) => toggleSort(key, evalSortBy, evalSortDir, setEvalSortBy, setEvalSortDir)}
                  />
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <EmptyState
                          icon={ClipboardCheck}
                          message={evaluations.length === 0 ? arabicSource("evaluation.there_are_no_reviews_yet") : arabicSource("evaluation.there_are_no_results_matching_your_search")}
                          hint={evaluations.length === 0 ? arabicSource("evaluation.start_creating_a_new_assessment") : undefined}
                        />
                      </td>
                    </tr>
                  ) : filtered.map((ev, i) => {
                    const emp = empMap[ev.employee_id];
                    const evaluator = ev.evaluator_id ? empMap[ev.evaluator_id] : null;
                    const ratingInfo = getRatingInfo(ev.overall_rating);
                    return (
                      <motion.tr
                        key={ev.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-border/20 hover:bg-muted/10 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                              <span className="text-primary" style={{ fontSize: 12 }}>
                                {emp ? empDisplayName(emp).charAt(0) : "?"}
                              </span>
                            </div>
                            <span className="text-foreground">{emp ? empDisplayName(emp) : "—"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }}>
                          {emp?.department || "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }}>
                          {evaluator ? empDisplayName(evaluator) : "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: 13 }}>
                          {ev.period}
                        </td>
                        <td className="px-4 py-3">
                          {ev.overall_rating > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="flex">{renderStars(ev.overall_rating)}</div>
                              <span className={`px-2 py-0.5 rounded-md border ${ratingInfo.bgColor}`} style={{ fontSize: 11 }}>
                                {ratingInfo.label}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground" style={{ fontSize: 13 }}>—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-md border ${STATUS_COLORS[ev.status] || STATUS_COLORS[arabicSource("common.did_not_start")]}`} style={{ fontSize: 12 }}>
                            {ev.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setSelectedEval(ev)}
                              className="p-1.5 rounded hover:bg-secondary transition-colors cursor-pointer"
                              title={arabicSource("common.show_details")}
                            >
                              <Eye className="w-4 h-4 text-muted-foreground" />
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
        ) : (
          <KanbanView
            evaluations={filtered}
            empMap={empMap}
            criteria={criteria}
            onSelect={setSelectedEval}
          />
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedEval && (
          <EvalDetailModal
            evaluation={selectedEval}
            empMap={empMap}
            criteria={criteria.filter(c => c.evaluation_id === selectedEval.id)}
            allCriteria={criteria}
            onClose={() => setSelectedEval(null)}
            onUpdate={fetchData}
          />
        )}
      </AnimatePresence>

      {/* New Evaluation Panel */}
      <AnimatePresence>
        {showNewEval && (
          <NewEvalPanel
            employees={employees}
            empMap={empMap}
            onClose={() => setShowNewEval(false)}
            onCreated={() => { setShowNewEval(false); fetchData(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ══════════════════════════ Kanban View ══════════════════════════

function KanbanView({
  evaluations,
  empMap,
  criteria,
  onSelect,
}: {
  evaluations: DbEvaluation[];
  empMap: Record<string, DbEmployee>;
  criteria: DbEvalCriteria[];
  onSelect: (ev: DbEvaluation) => void;
}) {
  const columns = [
    { key: arabicSource("common.complete"), label: arabicSource("common.complete"), accent: "border-emerald-500/40", dotColor: "bg-emerald-500" },
    { key: arabicSource("common.under_evaluation"), label: arabicSource("common.under_evaluation"), accent: "border-primary/40", dotColor: "bg-primary" },
    { key: arabicSource("common.did_not_start"), label: arabicSource("common.did_not_start"), accent: "border-muted-foreground/40", dotColor: "bg-muted-foreground" },
  ];

  return (
    <motion.div
      key="kanban"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="grid grid-cols-1 md:grid-cols-3 gap-4"
    >
      {columns.map((col, ci) => {
        const items = evaluations.filter(e => e.status === col.key);
        return (
          <motion.div
            key={col.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: ci * 0.1 }}
            className={`bg-card/20 backdrop-blur-md border ${col.accent} rounded-xl shadow-lg overflow-hidden`}
          >
            <div className="p-4 border-b border-border/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                <span className="text-foreground" style={{ fontSize: 14 }}>{col.label}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground" style={{ fontSize: 11 }}>
                {items.length}
              </span>
            </div>
            <div className="p-3 space-y-3 min-h-[200px]">
              {items.length > 0 ? items.map((ev, i) => {
                const emp = empMap[ev.employee_id];
                const ratingInfo = getRatingInfo(ev.overall_rating);
                const evaluator = ev.evaluator_id ? empMap[ev.evaluator_id] : null;
                return (
                  <motion.div
                    key={ev.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -2 }}
                    onClick={() => onSelect(ev)}
                    className="bg-card/60 border border-border/30 rounded-lg p-3 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                        <span className="text-primary" style={{ fontSize: 12 }}>
                          {emp ? empDisplayName(emp).charAt(0) : "?"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground truncate" style={{ fontSize: 13 }}>{emp ? empDisplayName(emp) : "—"}</p>
                        <p className="text-muted-foreground truncate" style={{ fontSize: 11 }}>{emp?.department || ""}</p>
                      </div>
                    </div>
                    {ev.overall_rating > 0 ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1">{renderStars(ev.overall_rating, 14)}</div>
                        <span className={`inline-block px-2 py-0.5 rounded-md border ${ratingInfo.bgColor}`} style={{ fontSize: 10 }}>
                          {ratingInfo.label}
                        </span>
                      </div>
                    ) : (
                      <p className="text-muted-foreground" style={{ fontSize: 11 }}>{arabicSource("evaluation.not_evaluated_yet")}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-muted-foreground" style={{ fontSize: 10 }}>
                        {evaluator ? empDisplayName(evaluator) : "—"}
                      </span>
                      <span className="text-muted-foreground" style={{ fontSize: 10 }}>{ev.period}</span>
                    </div>
                  </motion.div>
                );
              }) : (
                <EmptyState icon={ClipboardCheck} message={arabicSource("evaluation.there_are_no_reviews")} className="py-8" />
              )}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// ══════════════════════════ Detail Modal ══════════════════════════

function EvalDetailModal({
  evaluation,
  empMap,
  criteria,
  allCriteria,
  onClose,
  onUpdate,
}: {
  evaluation: DbEvaluation;
  empMap: Record<string, DbEmployee>;
  criteria: DbEvalCriteria[];
  allCriteria: DbEvalCriteria[];
  onClose: () => void;
  onUpdate: () => void;
}) {
  const emp = empMap[evaluation.employee_id];
  const evaluator = evaluation.evaluator_id ? empMap[evaluation.evaluator_id] : null;
  const ratingInfo = getRatingInfo(evaluation.overall_rating);

  const [editing, setEditing] = useState(evaluation.status !== arabicSource("common.complete"));
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState(evaluation.comments || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const map: Record<string, number> = {};
    if (criteria.length > 0) {
      criteria.forEach(c => { map[c.criterion_name] = c.score; });
    } else {
      DEFAULT_CRITERIA.forEach(c => { map[c] = 3; });
    }
    setScores(map);
    setComments(evaluation.comments || "");
  }, [evaluation, criteria]);

  const overallRating = useMemo(() => {
    const vals = Object.values(scores);
    if (vals.length === 0) return 0;
    return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
  }, [scores]);

  const handleSave = async (status: string | string) => {
    setSaving(true);
    try {
      const criteriaPayload = Object.entries(scores).map(([name, score]) => ({
        criterion_name: name,
        score,
      }));
      await odooData.updateEvaluation(evaluation.id, {
        overall_rating: overallRating,
        status: EVAL_STATUS_TO_ODOO[status] || "draft",
        comments: comments || null,
        criteria: criteriaPayload,
      });
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
    setEditing(false);
    onUpdate();
    if (status === arabicSource("common.complete")) onClose();
  };

  const handleDelete = async () => {
    if (!localizedConfirm(arabicSource("evaluation.are_you_sure_you_want_to_delete_this_review"))) return;
    setDeleting(true);
    try {
      await odooData.deleteEvaluation(evaluation.id);
    } catch (e) {
      console.error(e);
    }
    setDeleting(false);
    onUpdate();
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-card border border-border rounded-xl p-6 w-full max-w-2xl shadow-lg max-h-[85vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-foreground">{arabicSource("evaluation.evaluation_details")} {emp ? empDisplayName(emp) : "—"}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-muted-foreground" style={{ fontSize: 12 }}>
                {arabicSource("evaluation.assessor_3")} {evaluator ? empDisplayName(evaluator) : "—"}
              </span>
              <span className="text-muted-foreground" style={{ fontSize: 12 }}>|</span>
              <span className="text-muted-foreground" style={{ fontSize: 12 }}>{evaluation.period}</span>
              <span className={`px-2 py-0.5 rounded-md border ${STATUS_COLORS[evaluation.status] || ""}`} style={{ fontSize: 10 }}>
                {evaluation.status}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {evaluation.status !== arabicSource("common.complete") && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="p-2 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
                title={arabicSource("common.edit")}
              >
                <Pencil className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-2 rounded-lg hover:bg-destructive/10 transition-colors cursor-pointer"
              title={arabicSource("common.delete")}
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin text-destructive" /> : <Trash2 className="w-4 h-4 text-destructive" />}
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary cursor-pointer">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Overall Rating */}
        <div className="text-center p-4 rounded-xl bg-muted/20 border border-border/40 mb-6">
          <p className="text-muted-foreground mb-2">{arabicSource("evaluation.overall_evaluation")}</p>
          <div className="flex justify-center mb-2">{renderStars(editing ? overallRating : evaluation.overall_rating)}</div>
          <span className={`inline-block px-3 py-1 rounded-md border ${getRatingInfo(editing ? overallRating : evaluation.overall_rating).bgColor}`}>
            {getRatingInfo(editing ? overallRating : evaluation.overall_rating).label}
          </span>
          {editing && (
            <p className="text-muted-foreground mt-2" style={{ fontSize: 11 }}>
              {arabicSource("evaluation.is_automatically_calculated_from_the_average_of_the_criteria_sco")}
            </p>
          )}
        </div>

        {/* Radar Chart (view mode only) */}
        {!editing && criteria.length > 0 && (
          <div className="mb-6">
            <h3 className="text-foreground mb-3">{arabicSource("evaluation.criteria_analysis")}</h3>
            <CustomRadarChart
              data={criteria.map(c => ({ name: c.criterion_name, score: c.score }))}
              maxValue={5}
              height={280}
            />
          </div>
        )}

        {/* Criteria */}
        <div className="space-y-3 mb-6">
          <h3 className="text-foreground">{arabicSource("evaluation.standards")}</h3>
          {(editing ? DEFAULT_CRITERIA : criteria.map(c => c.criterion_name)).map((name, i) => {
            const criterionName = typeof name === "string" ? name : "";
            const score = scores[criterionName] || 3;
            const cRatingInfo = getRatingInfo(score);
            return (
              <div key={criterionName + i} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                <span className="text-foreground" style={{ fontSize: 13 }}>{criterionName}</span>
                {editing ? (
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map(v => (
                      <button
                        key={v}
                        onClick={() => setScores(prev => ({ ...prev, [criterionName]: v }))}
                        className="cursor-pointer"
                      >
                        <Star
                          className={`w-5 h-5 transition-colors ${v <= score ? "text-primary fill-primary" : "text-muted-foreground/30 hover:text-primary/50"}`}
                        />
                      </button>
                    ))}
                    <span className={`px-2 py-0.5 rounded-md border ms-2 ${cRatingInfo.bgColor}`} style={{ fontSize: 10 }}>
                      {cRatingInfo.label}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex">{renderStars(score)}</div>
                    <span className="text-muted-foreground" style={{ fontSize: 12 }}>({score}/5)</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Comments */}
        <div className="mb-6">
          <h3 className="text-foreground mb-2">{arabicSource("evaluation.evaluator_s_notes")}</h3>
          {editing ? (
            <textarea
              rows={3}
              value={comments}
              onChange={e => setComments(e.target.value)}
              placeholder={arabicSource("common.observations_about_the_employee_s_performance")}
              className="w-full px-4 py-3 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none resize-none"
            />
          ) : (
            <div className="p-4 rounded-xl bg-muted/20 border border-border/40">
              <p className="text-foreground">{evaluation.comments || arabicSource("evaluation.no_notes")}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        {editing && (
          <div className="flex gap-3">
            <button
              onClick={() => handleSave(arabicSource("common.under_evaluation"))}
              disabled={saving}
              className="flex-1 h-11 rounded-lg border-2 border-primary text-primary hover:bg-primary/10 transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {arabicSource("common.save_as_draft")}
            </button>
            <button
              onClick={() => handleSave(arabicSource("common.complete"))}
              disabled={saving}
              className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground hover:bg-gold-dark transition-colors shadow-lg shadow-primary/20 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {arabicSource("common.complete_the_assessment")}
            </button>
          </div>
        )}

        {/* Edit button for completed evaluations */}
        {!editing && evaluation.status === arabicSource("common.complete") && (
          <button
            onClick={() => setEditing(true)}
            className="w-full h-10 rounded-lg border border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Pencil className="w-4 h-4" />
            {arabicSource("evaluation.edit_rating")}
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}

// ══════════════════════════ New Evaluation Panel ══════════════════════════

function NewEvalPanel({
  employees,
  empMap,
  onClose,
  onCreated,
}: {
  employees: DbEmployee[];
  empMap: Record<string, DbEmployee>;
  onClose: () => void;
  onCreated: () => void;
}) {
  const activeEmployees = employees.filter(e => !e.status || e.status === arabicSource("common.is_active"));
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [evaluatorId, setEvaluatorId] = useState("");
  const [cycle, setCycle] = useState<EvalCycleType>(arabicSource("common.quarterly"));
  const [period, setPeriod] = useState("");
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    DEFAULT_CRITERIA.forEach(c => { map[c] = 3; });
    return map;
  });
  const [comments, setComments] = useState("");
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1); // 1=select employee, 2=score criteria

  const currentYear = new Date().getFullYear();
  const periodOptions = getPeriodOptions(cycle, currentYear);

  // Auto-set evaluator to direct manager
  useEffect(() => {
    if (selectedEmpId) {
      const emp = empMap[selectedEmpId];
      if (emp?.manager_id) {
        setEvaluatorId(emp.manager_id);
      }
    }
  }, [selectedEmpId, empMap]);

  // Auto-set first period option
  useEffect(() => {
    if (periodOptions.length > 0 && !period) {
      setPeriod(periodOptions[0]);
    }
  }, [cycle]);

  const selectedEmp = selectedEmpId ? empMap[selectedEmpId] : null;
  const evaluatorEmp = evaluatorId ? empMap[evaluatorId] : null;

  const overallRating = useMemo(() => {
    const vals = Object.values(scores);
    return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
  }, [scores]);

  const handleCreate = async (status: string | string) => {
    if (!selectedEmpId || !period) return;
    setSaving(true);
    try {
      await odooData.createEvaluation({
        employee_id: selectedEmpId,
        evaluator_id: evaluatorId || null,
        period,
        overall_rating: overallRating,
        status: EVAL_STATUS_TO_ODOO[status] || "draft",
        comments: comments || null,
        criteria: Object.entries(scores).map(([name, score]) => ({
          criterion_name: name,
          score,
        })),
      });
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
    onCreated();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 30 }}
        onClick={e => e.stopPropagation()}
        className="bg-card border border-border rounded-xl p-6 w-full max-w-lg shadow-lg my-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-foreground">{arabicSource("evaluation.new_performance_evaluation")}</h2>
            <p className="text-muted-foreground" style={{ fontSize: 12 }}>
              {step === 1 ? arabicSource("evaluation.select_employee_and_period") : arabicSource("evaluation.evaluate_the_employee_s_performance")}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary cursor-pointer">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {step === 1 ? (
          <div className="space-y-4">
            {/* Employee Selection */}
            <div>
              <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>{arabicSource("common.employee")}</label>
              <EmployeeSelect
                employees={activeEmployees}
                labels={Object.fromEntries(activeEmployees.map((e) => [String(e.id), empDisplayName(e)]))}
                value={selectedEmpId}
                onChange={(id) => setSelectedEmpId(String(id))}
                placeholder={arabicSource("evaluation.select_employee")}
              />
            </div>

            {/* Auto-detected Manager */}
            {selectedEmp && (
              <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                <div className="flex items-center gap-2 mb-1">
                  <UserCheck className="w-4 h-4 text-primary" />
                  <span className="text-foreground" style={{ fontSize: 13 }}>{arabicSource("evaluation.evaluator_direct_manager")}</span>
                </div>
                {evaluatorEmp ? (
                  <p className="text-primary ps-6" style={{ fontSize: 14 }}>
                    {empDisplayName(evaluatorEmp)}
                    <span className="text-muted-foreground ms-2" style={{ fontSize: 11 }}>({evaluatorEmp.position || evaluatorEmp.department})</span>
                  </p>
                ) : (
                  <div className="ps-6">
                    <p className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("evaluation.there_is_no_direct_manager_assigned_choose_an_evaluator_manually")}</p>
                    <div className="mt-2">
                      <EmployeeSelect
                        employees={activeEmployees}
                        labels={Object.fromEntries(activeEmployees.map((e) => [String(e.id), empDisplayName(e)]))}
                        value={evaluatorId}
                        onChange={(id) => setEvaluatorId(String(id))}
                        placeholder={arabicSource("common.select_evaluator")}
                        excludeIds={selectedEmpId ? [selectedEmpId] : []}
                      />
                    </div>
                  </div>
                )}
                {evaluatorEmp && (
                  <button
                    onClick={() => setEvaluatorId("")}
                    className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer ps-6 mt-1"
                    style={{ fontSize: 11 }}
                  >
                    {arabicSource("evaluation.change_assessor")}
                  </button>
                )}
                {!evaluatorEmp && evaluatorId === "" && selectedEmp.manager_id === null && (
                  <></>
                )}
              </div>
            )}

            {/* Override the evaluator when the user chooses the change-evaluator action. */}
            {selectedEmp && evaluatorId === "" && selectedEmp.manager_id && (
              <div>
                <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>{arabicSource("evaluation.choose_another_rater")}</label>
                <EmployeeSelect
                  employees={activeEmployees}
                  labels={Object.fromEntries(activeEmployees.map((e) => [String(e.id), empDisplayName(e)]))}
                  value={evaluatorId}
                  onChange={(id) => setEvaluatorId(String(id))}
                  placeholder={arabicSource("common.select_evaluator")}
                  excludeIds={selectedEmpId ? [selectedEmpId] : []}
                />
              </div>
            )}

            {/* Evaluation Cycle */}
            <div>
              <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>{arabicSource("evaluation.evaluation_cycle")}</label>
              <div className="grid grid-cols-2 gap-2">
                {EVAL_CYCLES.map(c => {
                  const Icon = c.icon;
                  const isActive = cycle === c.value;
                  return (
                    <button
                      key={c.value}
                      onClick={() => { setCycle(c.value); setPeriod(""); }}
                      className={`flex items-center gap-2 p-3 rounded-lg border transition-all cursor-pointer ${
                        isActive
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "bg-muted/10 border-border/30 text-muted-foreground hover:border-primary/20"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span style={{ fontSize: 12 }}>{c.value}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Period */}
            <div>
              <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>{arabicSource("common.period")}</label>
              <select
                value={period}
                onChange={e => setPeriod(e.target.value)}
                className={inputCls}
              >
                {periodOptions.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Next */}
            <button
              onClick={() => setStep(2)}
              disabled={!selectedEmpId || !period}
              className="w-full h-11 rounded-lg bg-primary text-primary-foreground hover:bg-gold-dark transition-colors shadow-lg shadow-primary/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {arabicSource("evaluation.next_evaluation_of_criteria")}
              <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Employee Info Summary */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/30">
              <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                <span className="text-primary" style={{ fontSize: 14 }}>
                  {selectedEmp ? empDisplayName(selectedEmp).charAt(0) : "?"}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-foreground">{selectedEmp ? empDisplayName(selectedEmp) : "—"}</p>
                <p className="text-muted-foreground" style={{ fontSize: 11 }}>
                  {selectedEmp?.department} — {period}
                  {evaluatorEmp && ` ${arabicSource("evaluation.assessor")} ${empDisplayName(evaluatorEmp)}`}
                </p>
              </div>
              <button
                onClick={() => setStep(1)}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                style={{ fontSize: 11 }}
              >
                {arabicSource("evaluation.change")}
              </button>
            </div>

            {/* Overall Rating Preview */}
            <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/15">
              <div className="flex justify-center mb-1">{renderStars(overallRating)}</div>
              <span className={`inline-block px-2 py-0.5 rounded-md border ${getRatingInfo(overallRating).bgColor}`} style={{ fontSize: 11 }}>
                {getRatingInfo(overallRating).label}
              </span>
              <p className="text-muted-foreground mt-1" style={{ fontSize: 10 }}>{arabicSource("evaluation.auto_average")}</p>
            </div>

            {/* Criteria Scoring */}
            <div className="space-y-2">
              <label className="text-foreground block" style={{ fontSize: 13 }}>{arabicSource("evaluation.evaluation_criteria")}</label>
              {DEFAULT_CRITERIA.map(criterion => {
                const score = scores[criterion] || 3;
                const cRatingInfo = getRatingInfo(score);
                return (
                  <div key={criterion} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                    <span className="text-foreground" style={{ fontSize: 13 }}>{criterion}</span>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map(v => (
                        <button
                          key={v}
                          onClick={() => setScores(prev => ({ ...prev, [criterion]: v }))}
                          className="cursor-pointer"
                        >
                          <Star
                            className={`w-5 h-5 transition-colors ${v <= score ? "text-primary fill-primary" : "text-muted-foreground/30 hover:text-primary/50"}`}
                          />
                        </button>
                      ))}
                      <span className={`px-1.5 py-0.5 rounded border ms-1 ${cRatingInfo.bgColor}`} style={{ fontSize: 9 }}>
                        {score}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Comments */}
            <div>
              <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>{arabicSource("common.notes")}</label>
              <textarea
                rows={3}
                value={comments}
                onChange={e => setComments(e.target.value)}
                placeholder={arabicSource("common.observations_about_the_employee_s_performance")}
                className="w-full px-4 py-3 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleCreate(arabicSource("common.under_evaluation"))}
                disabled={saving}
                className="flex-1 h-11 rounded-lg border-2 border-primary text-primary hover:bg-primary/10 transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {arabicSource("common.save_as_draft")}
              </button>
              <button
                onClick={() => handleCreate(arabicSource("common.complete"))}
                disabled={saving}
                className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground hover:bg-gold-dark transition-colors shadow-lg shadow-primary/20 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {arabicSource("common.complete_the_assessment")}
              </button>
            </div>
            <button
              onClick={onClose}
              className="w-full h-10 rounded-lg border border-border text-muted-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              {arabicSource("common.cancel")}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
