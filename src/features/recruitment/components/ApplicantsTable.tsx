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
import { IrBadge } from "./IrBadge";
import { StarRating } from "./StarRating";

export const ApplicantsTable = function ApplicantsTable({ applicants, onSelect, onToggleBookmark, onUpdateRating, onUpdateStage }: {
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
        <p>{arabicSource("recruitment.there_are_no_applicants")}</p>
        <p style={{ fontSize: 12 }}>{arabicSource("recruitment.click_add_advanced_to_enter_the_first_filter")}</p>
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
                { label: arabicSource("recruitment.advanced"), key: "name" },
                { label: arabicSource("recruitment.function"), key: "job" },
                { label: arabicSource("common.submission_date"), key: "date" },
                { label: arabicSource("common.stage"), key: "stage" },
                { label: arabicSource("common.evaluation"), key: "rating" },
                { label: arabicSource("recruitment.ranking"), key: "rank" },
                { label: "", key: null },
              ]}
              sortBy={sortBy}
              sortDir={recSortDir}
              onSort={(key) => toggleSort(key, sortBy, recSortDir, setSortBy, setRecSortDir)}
            />
          </thead>
          <tbody>
            {applicants.map((app, i) => {
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
                    <IrBadge applicant={app} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {app.resume_url && (
                        <button type="button" onClick={() => { void handleDownloadResume(app.id); }}
                          className="p-1 rounded hover:bg-primary/10 text-primary cursor-pointer" title={arabicSource("recruitment.download_cv_2")}>
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={() => onSelect(app)} className="p-1 rounded hover:bg-primary/10 text-muted-foreground cursor-pointer" title={arabicSource("common.show_details")}>
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
