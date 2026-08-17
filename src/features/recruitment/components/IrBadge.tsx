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

export const IrBadge = function IrBadge({ applicant, showStatus = true }: { applicant: DbApplicant; showStatus?: boolean }) {
  const status = applicant.ir_status || "none";

  if (!hasIr(applicant)) {
    if (showStatus && (status === "pending" || status === "processing")) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-border/40 bg-muted/10 text-muted-foreground" style={{ fontSize: 11 }}>
          <Loader2 className="w-3 h-3 animate-spin" />{IR_STATUS_LABELS[status]}
        </span>
      );
    }
    const estimate = calcRankScore(applicant);
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-border/40 bg-muted/10 text-muted-foreground"
        style={{ fontSize: 11 }} title={arabicSource("recruitment.ir_estimated")}>
        {estimate}% — {arabicSource("recruitment.ir_estimated")}
      </span>
    );
  }

  const score = Math.round(applicant.ir_score as number);
  const band = rankLabel(score, applicant.ir_band);
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border ${band.color}`} style={{ fontSize: 11 }}>
      <Sparkles className="w-3 h-3" />{score}% — {band.text}
      {applicant.ir_needs_review && <ShieldAlert className="w-3 h-3 text-amber-400" />}
      {status === "stale" && <RefreshCw className="w-3 h-3 opacity-60" />}
    </span>
  );
}

/** Full IR breakdown: components with evidence, penalties, skills and flags. */
