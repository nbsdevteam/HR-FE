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

export const RankBar = function RankBar({ label, value, weight }: { label: string; value: number; weight: string }) {
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
