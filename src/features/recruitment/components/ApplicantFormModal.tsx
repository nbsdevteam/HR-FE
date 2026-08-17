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

export const ApplicantFormModal = function ApplicantFormModal({ jobs, editingApplicant, onClose, onSaved }: {
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
  const [pendingResumeFile, setPendingResumeFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    name: editingApplicant?.name || "",
    email: editingApplicant?.email || "",
    phone: editingApplicant?.phone || "",
    job_opening_id: editingApplicant?.job_opening_id || (jobs[0]?.id || ""),
    stage: editingApplicant?.stage || arabicSource("common.introduction"),
    rating: editingApplicant?.rating || 0,
    skills: (editingApplicant?.skills || []).join(", "),
    experience_years: editingApplicant?.experience_years || 0,
    education: editingApplicant?.education || "",
    current_company: editingApplicant?.current_company || "",
    city: editingApplicant?.city || arabicSource("common.baghdad"),
    gender: editingApplicant?.gender || "",
    source: editingApplicant?.source || arabicSource("common.live"),
    expected_salary: editingApplicant?.expected_salary || "",
    salary_currency: editingApplicant?.salary_currency || "IQD",
    notes: editingApplicant?.notes || "",
    resume_url: editingApplicant?.resume_url || "",
  });

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setUploadError("");

    // Odoo's upload endpoint requires an existing applicant id, so we
    // stage the file and upload it right after create/update succeeds.
    setPendingResumeFile(file);
    setForm(prev => ({ ...prev, resume_url: "pending" }));
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.job_opening_id) return;
    setSaving(true);
    const skillsArr = form.skills.split(",").map(s => s.trim()).filter(Boolean);

    try {
      const odooPayload: Record<string, unknown> = {
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        job_opening_id: form.job_opening_id,
        stage: STAGE_TO_ODOO[form.stage] || form.stage,
        rating: form.rating,
        skills: skillsArr.length > 0 ? skillsArr : [],
        experience_years: Number(form.experience_years) || 0,
        education: form.education || null,
        current_company: form.current_company || null,
        city: form.city || null,
        gender: form.gender ? (GENDER_TO_ODOO[form.gender] || form.gender) : null,
        source: form.source || "مباشر",
        expected_salary: form.expected_salary ? Number(form.expected_salary) : null,
        salary_currency: form.salary_currency || "IQD",
        notes: form.notes || null,
      };
      let applicantId: string | number;
      if (isEdit) {
        await odooData.updateApplicant(editingApplicant!.id, odooPayload);
        applicantId = editingApplicant!.id;
      } else {
        const res: any = await odooData.createApplicant(odooPayload);
        applicantId = res?.data?.id;
      }
      if (pendingResumeFile && applicantId) {
        const base64 = await fileToBase64(pendingResumeFile);
        await odooData.uploadApplicantResume(applicantId, base64, pendingResumeFile.name);
      }
      setSaving(false);
      onSaved();
    } catch (e: any) {
      setSaving(false);
      setUploadError(e.message || "فشل الحفظ");
    }
  };

  const openJobs = jobs.filter(j => j.status === arabicSource("common.is_open") || j.status === arabicSource("common.is_under_review"));

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
              <h2 className="text-foreground">{isEdit ? arabicSource("recruitment.modify_applicant_data") : arabicSource("recruitment.add_a_new_applicant")}</h2>
              <p className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("recruitment.enter_all_the_data_required_for_the_candidate")}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary transition-colors cursor-pointer">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Section 1: Basic information */}
          <fieldset className="rounded-xl border border-border/30 p-4 space-y-4">
            <legend className="px-2 text-primary flex items-center gap-1.5" style={{ fontSize: 13 }}>
              <Users className="w-4 h-4" /> {arabicSource("recruitment.basic_information")}
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls} style={{ fontSize: 13 }}>{arabicSource("common.full_name")}</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder={arabicSource("recruitment.applicant_s_name")} className={inputCls} />
              </div>
              <div>
                <label className={labelCls} style={{ fontSize: 13 }}>{arabicSource("recruitment.the_job_applied_for")}</label>
                <select value={form.job_opening_id} onChange={e => setForm({ ...form, job_opening_id: e.target.value })} className={selectCls}>
                  {openJobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                  {openJobs.length === 0 && <option value="">{arabicSource("recruitment.there_are_no_open_positions")}</option>}
                </select>
              </div>
              <div>
                <label className={labelCls} style={{ fontSize: 13 }}>{arabicSource("recruitment.sex")}</label>
                <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className={selectCls}>
                  <option value="">{arabicSource("common.select")}</option>
                  <option>{arabicSource("common.male")}</option>
                  <option>{arabicSource("common.female")}</option>
                </select>
              </div>
              <div>
                <label className={labelCls} style={{ fontSize: 13 }}>{arabicSource("common.city")}</label>
                <input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
                  placeholder={arabicSource("common.baghdad")} className={inputCls} />
              </div>
            </div>
          </fieldset>

          {/* Section 2: Contact information */}
          <fieldset className="rounded-xl border border-border/30 p-4 space-y-4">
            <legend className="px-2 text-primary flex items-center gap-1.5" style={{ fontSize: 13 }}>
              <Phone className="w-4 h-4" /> {arabicSource("recruitment.contact_information")}
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls} style={{ fontSize: 13 }}>{arabicSource("common.email")}</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="email@example.com" className={inputCls} dir="ltr" />
              </div>
              <div>
                <label className={labelCls} style={{ fontSize: 13 }}>{arabicSource("common.phone_number")}</label>
                <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="07xxxxxxxxx" className={inputCls} dir="ltr" />
              </div>
            </div>
          </fieldset>

          {/* Section 3: Qualifications and experience */}
          <fieldset className="rounded-xl border border-border/30 p-4 space-y-4">
            <legend className="px-2 text-primary flex items-center gap-1.5" style={{ fontSize: 13 }}>
              <GraduationCap className="w-4 h-4" /> {arabicSource("recruitment.qualifications_and_experience")}
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls} style={{ fontSize: 13 }}>{arabicSource("recruitment.academic_qualification")}</label>
                <select value={form.education} onChange={e => setForm({ ...form, education: e.target.value })} className={selectCls}>
                  <option value="">{arabicSource("common.select")}</option>
                  <option>{arabicSource("recruitment.preparatory_school")}</option>
                  <option>{arabicSource("recruitment.diploma")}</option>
                  <option>{arabicSource("recruitment.bachelor_s_degree")}</option>
                  <option>{arabicSource("recruitment.master")}</option>
                  <option>{arabicSource("recruitment.ph_d")}</option>
                </select>
              </div>
              <div>
                <label className={labelCls} style={{ fontSize: 13 }}>{arabicSource("common.years_of_experience")}</label>
                <input type="number" min={0} max={50} value={form.experience_years}
                  onChange={e => setForm({ ...form, experience_years: Number(e.target.value) })}
                  className={inputCls} dir="ltr" />
              </div>
              <div>
                <label className={labelCls} style={{ fontSize: 13 }}>{arabicSource("common.current_company")}</label>
                <input type="text" value={form.current_company} onChange={e => setForm({ ...form, current_company: e.target.value })}
                  placeholder={arabicSource("recruitment.company_name")} className={inputCls} />
              </div>
              <div>
                <label className={labelCls} style={{ fontSize: 13 }}>{arabicSource("recruitment.submission_source")}</label>
                <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} className={selectCls}>
                  {sourceOptions.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls} style={{ fontSize: 13 }}>{arabicSource("recruitment.skills_comma_separated")}</label>
              <input type="text" value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })}
                placeholder={arabicSource("recruitment.react_node_js_sql_project_management")} className={inputCls} />
              {form.skills && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.skills.split(",").map(s => s.trim()).filter(Boolean).map((s, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary" style={{ fontSize: 11 }}>{s}</span>
                  ))}
                </div>
              )}
            </div>
          </fieldset>

          {/* Section 4: Salary and rating */}
          <fieldset className="rounded-xl border border-border/30 p-4 space-y-4">
            <legend className="px-2 text-primary flex items-center gap-1.5" style={{ fontSize: 13 }}>
              <Trophy className="w-4 h-4" /> {arabicSource("recruitment.salary_and_evaluation")}
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls} style={{ fontSize: 13 }}>{arabicSource("recruitment.expected_salary")}</label>
                <input type="number" value={form.expected_salary} onChange={e => setForm({ ...form, expected_salary: e.target.value })}
                  placeholder="0" className={inputCls} dir="ltr" />
              </div>
              <div>
                <label className={labelCls} style={{ fontSize: 13 }}>{arabicSource("recruitment.currency")}</label>
                <select value={form.salary_currency} onChange={e => setForm({ ...form, salary_currency: e.target.value })} className={selectCls}>
                  <option>IQD</option>
                  <option>USD</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls} style={{ fontSize: 13 }}>{arabicSource("recruitment.initial_assessment")}</label>
                <div className="pt-1.5">
                  <StarRating value={form.rating} onChange={r => setForm({ ...form, rating: r })} size={22} />
                </div>
              </div>
              <div>
                <label className={labelCls} style={{ fontSize: 13 }}>{arabicSource("common.stage")}</label>
                <select value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })} className={selectCls}>
                  {ALL_STAGES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </fieldset>

          {/* Section 5: Resume and notes */}
          <fieldset className="rounded-xl border border-border/30 p-4 space-y-4">
            <legend className="px-2 text-primary flex items-center gap-1.5" style={{ fontSize: 13 }}>
              <FileText className="w-4 h-4" /> {arabicSource("recruitment.biography_and_notes")}
            </legend>
            <div>
              <label className={labelCls} style={{ fontSize: 13 }}>{arabicSource("recruitment.curriculum_vitae_cv")}</label>
              <div
                onClick={() => fileRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed transition-colors cursor-pointer ${form.resume_url ? "border-emerald-500/40 bg-emerald-500/5" : "border-border hover:border-primary/50 hover:bg-primary/5"}`}
              >
                {form.resume_url ? (
                  <>
                    <FileCheck className="w-8 h-8 text-emerald-400" />
                    <span className="text-emerald-400" style={{ fontSize: 13 }}>{arabicSource("recruitment.the_file_was_uploaded_successfully")}</span>
                    <span className="text-muted-foreground" style={{ fontSize: 11 }}>{arabicSource("recruitment.click_to_change_the_file")}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-primary/60" />
                    <span className="text-foreground" style={{ fontSize: 13 }}>
                      {uploading ? arabicSource("recruitment.uploading") : arabicSource("recruitment.click_to_upload_your_cv_file")}
                    </span>
                    <span className="text-muted-foreground" style={{ fontSize: 11 }}>{arabicSource("recruitment.pdf_doc_docx_max_5mb")}</span>
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
              <label className={labelCls} style={{ fontSize: 13 }}>{arabicSource("common.notes")}</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                rows={4} placeholder={arabicSource("recruitment.additional_notes_about_the_candidate")} className={`${inputCls} h-auto py-3 resize-none`} />
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
                <><Loader2 className="w-4 h-4 animate-spin" /> {arabicSource("common.saving")}</>
              ) : (
                <><FileCheck className="w-4 h-4" /> {isEdit ? arabicSource("recruitment.update_data") : arabicSource("recruitment.add_advanced")}</>
              )}
            </button>
            <button onClick={onClose}
              className="px-6 h-12 rounded-xl border-2 border-border text-foreground hover:bg-secondary transition-colors cursor-pointer"
              style={{ fontSize: 14 }}>{arabicSource("common.cancel")}</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════
   AI SCREENING — Initial Rating (IR)
   ════════════════════════════════════════════════════════════ */

/**
 * Compact score chip. A real IR carries the sparkle mark; the client-side
 * estimate is rendered muted so HR never mistakes one for the other.
 */
