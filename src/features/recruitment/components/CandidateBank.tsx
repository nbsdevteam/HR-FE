import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import {
  UserPlus, Plus, X, Briefcase, MapPin, Clock, Users, FileCheck, Search,
  Star, Upload, Download, Bookmark, BookmarkCheck, Eye,
  GraduationCap, Building2, Phone, Mail, FileText, Trash2, Edit3,
  Trophy, TrendingUp, Loader2, AlertCircle,
  Sparkles, Link2, Copy, RefreshCw, ShieldAlert, Check, MessageCircle,
} from "lucide-react";
import { EmptyState } from "@/shared/components/EmptyState";
import { ViewToggle } from "@/shared/components/ViewToggle";
import { SortableHeaderRow, toggleSort } from "@/shared/components/SortableHeader";
import * as odooData from "@/shared/api/odooData";
import {
  useJobOpenings, useApplicants, useJobRanking,
  type DbJobOpening, type DbApplicant, type DbDepartment,
  type ApplicationLink, type IrBand, type JobSkillRequirement,
} from "@/shared/hooks";
import { DEPARTMENTS } from "@/shared/constants";
import { formatNumber } from "@/i18n/format";
import { localizedAlert, localizedConfirm } from "@/i18n/native";
import { arabicSource } from "@/i18n/source";
import { normalizeLanguage } from "@/i18n";
import {
  ALL_STAGES, EDUCATION_LEVELS, GENDER_TO_ODOO, IR_COMPONENT_LABELS,
  IR_STATUS_LABELS, JOB_STATUSES, JOB_STATUS_TO_ODOO, JOB_TYPE_TO_ODOO,
  MISSING_INFO_LABELS, ODOO_TO_GENDER, STAGES, STAGE_TO_ODOO,
  sourceOptions, stageColors, statusColors,
} from "../constants/recruitment";
import { inputCls, labelCls, selectCls } from "../styles";
import { bandFromScore, calcRankScore, effectiveScore, hasIr, rankLabel } from "../utils/recruitmentRanking";
import { fileToBase64 } from "../utils/fileToBase64";
import { handleDownloadResume } from "../utils/resumeDownload";
import { StarRating } from "./StarRating";

export const CandidateBank = function CandidateBank({ applicants, jobs, onSelect, onToggleBookmark, onUpdateRating, sortBy, setSortBy }: {
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
      if (sortBy === "rank") return effectiveScore(b) - effectiveScore(a);
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
            <h3 className="text-foreground">{arabicSource("recruitment.candidate_bank_smart_ranking_system")}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setOnlyBookmarked(!onlyBookmarked)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${onlyBookmarked ? "bg-primary/10 border-primary/30 text-primary" : "border-border text-muted-foreground hover:bg-muted/20"}`}
              style={{ fontSize: 12 }}>
              <BookmarkCheck className="w-3.5 h-3.5" /> {arabicSource("recruitment.favorites_only")}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input type="text" placeholder={arabicSource("recruitment.search_by_name_skills_company_education")}
              value={bankSearch} onChange={e => setBankSearch(e.target.value)}
              className="w-full h-10 ps-9 pe-4 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none"
              style={{ fontSize: 13 }} />
          </div>
          <select value={skillFilter} onChange={e => setSkillFilter(e.target.value)}
            className="h-10 px-3 rounded-lg border border-border bg-input-background text-foreground cursor-pointer" style={{ fontSize: 13 }}>
            <option value="">{arabicSource("recruitment.all_skills")}</option>
            {allSkills.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="h-10 px-3 rounded-lg border border-border bg-input-background text-foreground cursor-pointer" style={{ fontSize: 13 }}>
            <option value="rank">{arabicSource("recruitment.sort_by_efficiency")}</option>
            <option value="rating">{arabicSource("recruitment.sort_by_rating")}</option>
            <option value="date">{arabicSource("recruitment.sort_by_date")}</option>
            <option value="name">{arabicSource("recruitment.alphabetical_order")}</option>
          </select>
        </div>
      </div>

      {/* Ranking explanation */}
      <div className="bg-gradient-to-l from-primary/5 to-transparent border border-primary/20 rounded-xl p-4">
        <p className="text-muted-foreground" style={{ fontSize: 12 }}>
          <TrendingUp className="w-4 h-4 text-primary inline-block me-1" />
          <strong className="text-foreground">{arabicSource("recruitment.ranking_algorithm")}</strong>{" "}
          {arabicSource("recruitment.manual_evaluation_40_stage_progression_20_years_of_experience_25")}
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-16 text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{arabicSource("recruitment.there_are_no_matching_candidates")}</p>
          </div>
        ) : filtered.map((app, i) => {
          const score = effectiveScore(app);
          const rank = rankLabel(score, app.ir_band);
          return (
            <motion.div key={app.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }} whileHover={{ y: -3 }}
              onClick={() => onSelect(app)}
              className="bg-card/30 backdrop-blur-md border border-border/40 rounded-xl p-4 shadow-lg hover:border-primary/40 transition-all cursor-pointer relative">
              {/* Rank badge */}
              <div className="absolute top-3 start-3 flex items-center gap-1">
                <span className={`px-2 py-0.5 rounded-md border ${rank.color}`} style={{ fontSize: 11 }}>
                  {score}%
                </span>
                {hasIr(app) && <Sparkles className="w-3 h-3 text-primary" />}
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
                    <span>{app.experience_years} {arabicSource("recruitment.years_of_experience")}</span>
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
