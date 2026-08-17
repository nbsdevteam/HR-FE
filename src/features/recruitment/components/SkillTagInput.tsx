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

export const SkillTagInput = function SkillTagInput({ label, skills, onChange, weighted = false }: {
  label: string;
  skills: JobSkillRequirement[];
  onChange: (skills: JobSkillRequirement[]) => void;
  weighted?: boolean;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const name = draft.trim();
    if (!name || skills.some(s => s.name.toLowerCase() === name.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...skills, { name, weight: weighted ? 2 : 1 }]);
    setDraft("");
  };

  return (
    <div>
      <label className={labelCls} style={{ fontSize: 12 }}>{label}</label>
      <input
        type="text"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
        onBlur={add}
        placeholder={arabicSource("recruitment.add_skill")}
        className={inputCls}
      />
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {skills.map((skill, i) => (
            <span key={`${skill.name}-${i}`}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border/40 bg-muted/20 text-foreground"
              style={{ fontSize: 11 }}>
              {skill.name}
              {weighted && (
                <select
                  value={skill.weight || 2}
                  onChange={e => onChange(skills.map((s, si) =>
                    si === i ? { ...s, weight: Number(e.target.value) } : s))}
                  className="bg-transparent text-primary cursor-pointer outline-none"
                  style={{ fontSize: 10 }}
                  dir="ltr"
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                </select>
              )}
              <button type="button" onClick={() => onChange(skills.filter((_, si) => si !== i))}
                className="text-destructive cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
