import { useState, useEffect, useMemo, useCallback } from "react";
import {
  X, Pencil,
  Trash2,
} from "lucide-react";
import { localizedConfirm } from "@/i18n/native";
import * as odooData from "@/shared/api/odooData";
import { empDisplayName } from "@/shared/hooks";
import type { DbEmployee } from "@/shared/hooks";
import { Button, ModalOverlay, StatusBadge } from "@/shared/components";
import CustomRadarChart from "@/shared/components/custom-radar-chart";
import { arabicSource } from "@/i18n/source";
import {
  defaultCriteria as DEFAULT_CRITERIA,
  evaluationStatusColors as STATUS_COLORS,
  evaluationStatusToOdoo as EVAL_STATUS_TO_ODOO,
  type DbEvalCriteria,
  type DbEvaluation,
} from "../types";
import { getRatingInfo, renderStars } from "../utils/evaluationHelpers";
import EvalDetailCriterionRow from "./shared/EvalDetailCriterionRow";
import EvaluationSaveActions from "./shared/EvaluationSaveActions";

const EvalDetailModal = ({
  evaluation,
  empMap,
  criteria,
  onClose,
  onUpdate,
}: {
  evaluation: DbEvaluation;
  empMap: Record<string, DbEmployee>;
  criteria: DbEvalCriteria[];
  onClose: () => void;
  onUpdate: () => void;
}) => {
  const emp = empMap[evaluation.employee_id];
  const evaluator = evaluation.evaluator_id ? empMap[evaluation.evaluator_id] : null;

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

  const criterionNames = useMemo(
    () => (editing ? DEFAULT_CRITERIA : criteria.map((c) => c.criterion_name)),
    [editing, criteria],
  );

  const radarData = useMemo(
    () => criteria.map((c) => ({ name: c.criterion_name, score: c.score })),
    [criteria],
  );

  const handleSave = useCallback(async (status: string) => {
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
  }, [scores, evaluation.id, overallRating, comments, onUpdate, onClose]);

  const handleDelete = useCallback(async () => {
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
  }, [evaluation.id, onUpdate, onClose]);

  const saveDraft = useCallback(() => handleSave(arabicSource("common.under_evaluation")), [handleSave]);
  const saveComplete = useCallback(() => handleSave(arabicSource("common.complete")), [handleSave]);
  const startEditing = useCallback(() => setEditing(true), []);

  const handleScoreChange = useCallback((criterionName: string, value: number): void => {
    setScores(prev => ({ ...prev, [criterionName]: value }));
  }, []);

  const handleCommentsChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setComments(e.target.value);
  };

  return (
    <ModalOverlay
      onClose={onClose}
      contentClassName="bg-card border border-border rounded-xl p-6 w-full max-w-2xl shadow-lg max-h-[85vh] overflow-y-auto"
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
              <StatusBadge colorClassName={STATUS_COLORS[evaluation.status] || ""} fontSize={10}>{evaluation.status}</StatusBadge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {evaluation.status !== arabicSource("common.complete") && !editing && (
              <Button
                onClick={startEditing}
                variant="unstyled"
                size="icon"
                rounded="rounded-lg"
                className="hover:bg-secondary"
                icon={Pencil}
                iconClassName="w-4 h-4 text-muted-foreground"
                title={arabicSource("common.edit")}
              />
            )}
            <Button
              onClick={handleDelete}
              loading={deleting}
              variant="unstyled"
              size="icon"
              rounded="rounded-lg"
              className="hover:bg-destructive/10"
              icon={Trash2}
              iconClassName="w-4 h-4 text-destructive"
              title={arabicSource("common.delete")}
            />
            <Button
              onClick={onClose}
              variant="unstyled"
              size="icon"
              rounded="rounded-lg"
              className="hover:bg-secondary"
              icon={X}
              iconClassName="w-5 h-5 text-muted-foreground"
            />
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
              data={radarData}
              maxValue={5}
              height={280}
            />
          </div>
        )}

        {/* Criteria */}
        <div className="space-y-3 mb-6">
          <h3 className="text-foreground">{arabicSource("evaluation.standards")}</h3>
          {criterionNames.map((name, i) => (
            <EvalDetailCriterionRow
              key={`${name}-${i}`}
              criterion={name}
              score={scores[name] || 3}
              editing={editing}
              onScoreChange={handleScoreChange}
            />
          ))}
        </div>

        {/* Comments */}
        <div className="mb-6">
          <h3 className="text-foreground mb-2">{arabicSource("evaluation.evaluator_s_notes")}</h3>
          {editing ? (
            <textarea
              rows={3}
              value={comments}
              onChange={handleCommentsChange}
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
          <EvaluationSaveActions saving={saving} onSaveDraft={saveDraft} onComplete={saveComplete} />
        )}

        {/* Edit button for completed evaluations */}
        {!editing && evaluation.status === arabicSource("common.complete") && (
          <Button
            onClick={startEditing}
            variant="unstyled"
            size="unstyled"
            rounded="rounded-lg"
            className="w-full h-10 border border-border text-muted-foreground hover:border-primary/40 hover:text-primary flex gap-2"
            icon={Pencil}
          >
            {arabicSource("evaluation.edit_rating")}
          </Button>
        )}
    </ModalOverlay>
  );
};

export default EvalDetailModal;

