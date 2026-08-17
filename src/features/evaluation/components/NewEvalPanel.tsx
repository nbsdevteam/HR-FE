import { useState, useEffect, useMemo } from "react";
import {
  Star, X, ChevronDown, Loader2, UserCheck, Save,
  CheckCircle,
} from "lucide-react";
import * as odooData from "@/shared/api/odooData";
import { EmployeeSelect } from "@/features/employees";
import { ModalOverlay } from "@/shared/components";
import { empDisplayName } from "@/shared/hooks";
import type { DbEmployee } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import {
  defaultCriteria as DEFAULT_CRITERIA,
  evaluationCycles as EVAL_CYCLES,
  evaluationStatusToOdoo as EVAL_STATUS_TO_ODOO,
  type EvalCycleType,
} from "../types";
import { evaluationInputClass as inputCls } from "../styles";
import { getPeriodOptions, getRatingInfo, renderStars } from "../utils/evaluationHelpers";

const NewEvalPanel = ({
  employees,
  empMap,
  onClose,
  onCreated,
}: {
  employees: DbEmployee[];
  empMap: Record<string, DbEmployee>;
  onClose: () => void;
  onCreated: () => void;
}) => {
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
    <ModalOverlay
      onClose={onClose}
      overlayClassName="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
      contentClassName="bg-card border border-border rounded-xl p-6 w-full max-w-lg shadow-lg my-8"
      contentMotionProps={{
        initial: { scale: 0.9, opacity: 0, y: 30 },
        animate: { scale: 1, opacity: 1, y: 0 },
        exit: { scale: 0.9, opacity: 0, y: 30 },
      }}
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
    </ModalOverlay>
  );
};

export default NewEvalPanel;
