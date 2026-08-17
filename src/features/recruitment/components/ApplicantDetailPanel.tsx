import { useState } from "react";
import { motion } from "motion/react";
import {
  UserPlus, X, Briefcase, MapPin, Clock, Users,
  Download, Bookmark, BookmarkCheck,
  GraduationCap, Building2, Phone, Mail, FileText, Trash2, Edit3,
  Loader2, AlertCircle,
  Sparkles, RefreshCw,
} from "lucide-react";
import * as odooData from "@/shared/api/odooData";
import { ModalOverlay } from "@/shared/components";
import { type DbApplicant } from "@/shared/hooks";
import { formatNumber } from "@/i18n/format";
import { arabicSource } from "@/i18n/source";
import {
  ALL_STAGES, IR_STATUS_LABELS, STAGES, stageColors,
} from "../constants/recruitment";
import { effectiveScore, hasIr, rankLabel } from "../utils/recruitmentRanking";
import { handleDownloadResume } from "../utils/resumeDownload";
import InfoRow from "./InfoRow";
import IrDetail from "./IrDetail";
import RankBar from "./RankBar";
import StarRating from "./StarRating";

const ApplicantDetailPanel = ({ applicant, onClose, onEdit, onDelete, onUpdateStage, onUpdateRating, onToggleBookmark, onRefresh, onConvertToEmployee, onScreen }: {
  applicant: DbApplicant;
  onClose: () => void;
  onEdit: (a: DbApplicant) => void;
  onDelete: (id: string) => void;
  onScreen: (a: DbApplicant) => Promise<void>;
  onUpdateStage: (id: string, s: string) => void;
  onUpdateRating: (id: string, r: number) => void;
  onToggleBookmark: (a: DbApplicant) => void;
  onRefresh: () => void;
  onConvertToEmployee: (a: DbApplicant) => void;
}) => {
  const [interviewNotes, setInterviewNotes] = useState(applicant.interview_notes || "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [screening, setScreening] = useState(false);
  const score = effectiveScore(applicant);
  const rank = rankLabel(score, applicant.ir_band);

  const saveNotes = async () => {
    setSavingNotes(true);
    await odooData.updateApplicant(applicant.id, { interview_notes: interviewNotes });
    setSavingNotes(false);
    onRefresh();
  };

  return (
    <ModalOverlay
      onClose={onClose}
      overlayClassName="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto"
      contentClassName="bg-card border border-border rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
      contentMotionProps={{
        initial: { scale: 0.95, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.95, opacity: 0 },
      }}
    >
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
              <button onClick={() => onEdit(applicant)} className="p-2 rounded-lg hover:bg-secondary cursor-pointer" title={arabicSource("common.edit")}>
                <Edit3 className="w-4 h-4 text-muted-foreground" />
              </button>
              <button onClick={() => onDelete(applicant.id)} className="p-2 rounded-lg hover:bg-destructive/10 cursor-pointer" title={arabicSource("common.delete")}>
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
            <label className="text-muted-foreground block mb-2" style={{ fontSize: 12 }}>{arabicSource("recruitment.current_phase")}</label>
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
            <InfoRow icon={<Mail className="w-4 h-4" />} label={arabicSource("common.post")} value={applicant.email} dir="ltr" />
            <InfoRow icon={<Phone className="w-4 h-4" />} label={arabicSource("recruitment.phone")} value={applicant.phone} dir="ltr" />
            <InfoRow icon={<MapPin className="w-4 h-4" />} label={arabicSource("common.city")} value={applicant.city} />
            <InfoRow icon={<Building2 className="w-4 h-4" />} label={arabicSource("common.current_company")} value={applicant.current_company} />
            <InfoRow icon={<GraduationCap className="w-4 h-4" />} label={arabicSource("recruitment.education")} value={applicant.education} />
            <InfoRow icon={<Briefcase className="w-4 h-4" />} label={arabicSource("common.years_of_experience")} value={applicant.experience_years > 0 ? `${applicant.experience_years} ${arabicSource("common.years")}` : null} />
            <InfoRow icon={<Clock className="w-4 h-4" />} label={arabicSource("common.submission_date")} value={applicant.applied_date} dir="ltr" />
            <InfoRow icon={<Users className="w-4 h-4" />} label={arabicSource("common.source")} value={applicant.source} />
          </div>

          {/* Expected Salary */}
          {applicant.expected_salary && (
            <div className="p-3 rounded-lg bg-muted/20 border border-border/20">
              <span className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("recruitment.expected_salary_2")} </span>
              <span className="text-foreground" style={{ fontSize: 13 }}>
                {formatNumber(Number(applicant.expected_salary))} {applicant.salary_currency || "IQD"}
              </span>
            </div>
          )}

          {/* Skills */}
          {applicant.skills && applicant.skills.length > 0 && (
            <div>
              <label className="text-muted-foreground block mb-2" style={{ fontSize: 12 }}>{arabicSource("common.skills")}</label>
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
              <button type="button" onClick={() => { void handleDownloadResume(applicant.id); }}
                className="flex items-center gap-2 text-emerald-400 hover:underline cursor-pointer">
                <FileText className="w-4 h-4" />
                <span style={{ fontSize: 13 }}>{arabicSource("recruitment.download_cv")}</span>
                <Download className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Notes */}
          {applicant.notes && (
            <div>
              <label className="text-muted-foreground block mb-1" style={{ fontSize: 12 }}>{arabicSource("common.notes")}</label>
              <p className="text-foreground p-3 rounded-lg bg-muted/20 border border-border/20" style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>
                {applicant.notes}
              </p>
            </div>
          )}

          {/* Interview Notes */}
          <div>
            <label className="text-muted-foreground block mb-1" style={{ fontSize: 12 }}>{arabicSource("recruitment.interview_notes")}</label>
            <textarea value={interviewNotes} onChange={e => setInterviewNotes(e.target.value)}
              rows={4} placeholder={arabicSource("recruitment.add_interview_notes_here")}
              className="w-full px-4 py-3 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none resize-none"
              style={{ fontSize: 13 }} />
            <button onClick={saveNotes} disabled={savingNotes}
              className="mt-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-gold-dark transition-colors cursor-pointer disabled:opacity-50"
              style={{ fontSize: 12 }}>
              {savingNotes ? arabicSource("common.saving") : arabicSource("recruitment.save_notes")}
            </button>
          </div>

          {/* Initial Rating (IR) — AI screening result, or the fallback estimate */}
          <div>
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <label className="text-muted-foreground flex items-center gap-1.5" style={{ fontSize: 12 }}>
                {hasIr(applicant) && <Sparkles className="w-3.5 h-3.5 text-primary" />}
                {hasIr(applicant)
                  ? arabicSource("recruitment.ir_score")
                  : arabicSource("recruitment.arrangement_details")}
              </label>
              <button
                onClick={async () => { setScreening(true); await onScreen(applicant); setScreening(false); }}
                disabled={screening}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer disabled:opacity-50"
                style={{ fontSize: 11 }}
              >
                {screening
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <RefreshCw className="w-3.5 h-3.5" />}
                {hasIr(applicant)
                  ? arabicSource("recruitment.rescreen")
                  : arabicSource("recruitment.screen_now")}
              </button>
            </div>

            {hasIr(applicant) ? (
              <IrDetail applicant={applicant} />
            ) : (
              <>
                {applicant.ir_status && applicant.ir_status !== "none" && (
                  <div className="mb-3 flex items-center gap-2 rounded-lg border border-border/40 bg-muted/10 px-3 py-2 text-muted-foreground" style={{ fontSize: 12 }}>
                    {applicant.ir_status === "pending" || applicant.ir_status === "processing"
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                      : <AlertCircle className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{IR_STATUS_LABELS[applicant.ir_status] || applicant.ir_status}</span>
                    {applicant.ir_error && <span className="opacity-70" dir="ltr">{applicant.ir_error}</span>}
                  </div>
                )}
                <div className="text-muted-foreground mb-2" style={{ fontSize: 11 }}>
                  {arabicSource("recruitment.ir_estimated")}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <RankBar label={arabicSource("common.evaluation")} value={(applicant.rating / 5) * 100} weight="40%" />
                  <RankBar label={arabicSource("recruitment.progress_of_stages")} value={STAGES.indexOf(applicant.stage as any) >= 0 ? (STAGES.indexOf(applicant.stage as any) / (STAGES.length - 1)) * 100 : 0} weight="20%" />
                  <RankBar label={arabicSource("recruitment.experience")} value={Math.min(applicant.experience_years / 15, 1) * 100} weight="25%" />
                  <RankBar label={arabicSource("common.skills")} value={Math.min((applicant.skills?.length || 0) / 8, 1) * 100} weight="15%" />
                </div>
              </>
            )}
          </div>

          {/* Convert to Employee — only for accepted applicants */}
          {applicant.stage === arabicSource("common.accepted") && (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onConvertToEmployee(applicant)}
              className="w-full py-3 rounded-xl bg-emerald-500 text-white font-medium shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-colors cursor-pointer flex items-center justify-center gap-2"
              style={{ fontSize: 14 }}
            >
              <UserPlus className="w-5 h-5" />
              {arabicSource("recruitment.transfer_to_employee_attach_to_the_system")}
            </motion.button>
          )}
        </div>
    </ModalOverlay>
  );
};

export default ApplicantDetailPanel;
