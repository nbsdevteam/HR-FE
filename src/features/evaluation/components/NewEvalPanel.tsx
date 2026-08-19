import { useState, useMemo, useCallback, useEffect } from "react";
import { X } from "lucide-react";
import * as odooData from "@/shared/api/odooData";
import { ModalOverlay } from "@/shared/components";
import { empDisplayName } from "@/shared/hooks";
import type { DbEmployee } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import {
  defaultCriteria as DEFAULT_CRITERIA,
  evaluationStatusToOdoo as EVAL_STATUS_TO_ODOO,
  type EvalCycleType,
} from "../types";
import { getPeriodOptions } from "../utils/evaluationHelpers";
import NewEvalStepOne from "./NewEvalStepOne";
import NewEvalStepTwo from "./NewEvalStepTwo";

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

  const activeEmployees = useMemo(
    () => employees.filter(e => !e.status || e.status === arabicSource("common.is_active")),
    [employees],
  );

  const employeeLabels = useMemo(
    () => Object.fromEntries(activeEmployees.map((e) => [String(e.id), empDisplayName(e)])),
    [activeEmployees],
  );

  const overallRating = useMemo(() => {
    const vals = Object.values(scores);
    return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
  }, [scores]);

  const currentYear = new Date().getFullYear();
  const periodOptions = getPeriodOptions(cycle, currentYear);

  const selectedEmp = selectedEmpId ? empMap[selectedEmpId] : null;
  const evaluatorEmp = evaluatorId ? empMap[evaluatorId] : null;

  const handleCreate = useCallback(async (status: string) => {
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
  }, [selectedEmpId, period, evaluatorId, overallRating, comments, scores, onCreated]);

  const handleCycleChange = useCallback((next: EvalCycleType) => {
    setCycle(next);
    setPeriod("");
  }, []);

  const handleScoreChange = useCallback((criterion: string, value: number) => {
    setScores(prev => ({ ...prev, [criterion]: value }));
  }, []);

  const goToStepTwo = useCallback(() => setStep(2), []);
  const goToStepOne = useCallback(() => setStep(1), []);
  const saveDraft = useCallback(() => handleCreate(arabicSource("common.under_evaluation")), [handleCreate]);
  const saveComplete = useCallback(() => handleCreate(arabicSource("common.complete")), [handleCreate]);

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
          <NewEvalStepOne
            activeEmployees={activeEmployees}
            employeeLabels={employeeLabels}
            selectedEmpId={selectedEmpId}
            onSelectedEmpIdChange={setSelectedEmpId}
            evaluatorId={evaluatorId}
            onEvaluatorIdChange={setEvaluatorId}
            selectedEmp={selectedEmp}
            evaluatorEmp={evaluatorEmp}
            cycle={cycle}
            onCycleChange={handleCycleChange}
            period={period}
            onPeriodChange={setPeriod}
            periodOptions={periodOptions}
            onNext={goToStepTwo}
          />
        ) : (
          <NewEvalStepTwo
            selectedEmp={selectedEmp}
            evaluatorEmp={evaluatorEmp}
            period={period}
            overallRating={overallRating}
            scores={scores}
            onScoreChange={handleScoreChange}
            comments={comments}
            onCommentsChange={setComments}
            saving={saving}
            onBack={goToStepOne}
            onSaveDraft={saveDraft}
            onComplete={saveComplete}
            onCancel={onClose}
          />
        )}
    </ModalOverlay>
  );
};

export default NewEvalPanel;
