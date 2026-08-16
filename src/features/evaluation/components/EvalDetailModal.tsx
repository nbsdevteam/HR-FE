import { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import {
  Star, X, Eye, ChevronDown, Loader2, UserCheck, Save, Pencil,
  CheckCircle, Trash2,
} from "lucide-react";
import { localizedConfirm } from "@/i18n/native";
import * as odooData from "@/shared/api/odooData";
import { EmployeeSelect } from "@/features/employees";
import { empDisplayName } from "@/shared/hooks";
import type { DbEmployee } from "@/shared/hooks";
import { CustomRadarChart } from "@/shared/components/custom-radar-chart";
import { arabicSource } from "@/i18n/source";
import {
  defaultCriteria as DEFAULT_CRITERIA,
  evaluationCycles as EVAL_CYCLES,
  evaluationStatusColors as STATUS_COLORS,
  evaluationStatusToOdoo as EVAL_STATUS_TO_ODOO,
  type DbEvalCriteria,
  type DbEvaluation,
  type EvalCycleType,
} from "../types";
import { evaluationInputClass as inputCls } from "../styles";
import { getPeriodOptions, getRatingInfo, renderStars } from "../utils/evaluationHelpers";

export const EvalDetailModal = function EvalDetailModal({
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

