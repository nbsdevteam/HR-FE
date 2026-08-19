import { ChevronDown, UserCheck } from "lucide-react";
import { EmployeeSelect } from "@/features/employees";
import { empDisplayName } from "@/shared/hooks";
import type { DbEmployee } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { evaluationCycles as EVAL_CYCLES, type EvalCycleType } from "../types";
import { evaluationInputClass as inputCls } from "../styles";

type NewEvalStepOneProps = {
  activeEmployees: DbEmployee[];
  employeeLabels: Record<string, string>;
  selectedEmpId: string;
  onSelectedEmpIdChange: (id: string) => void;
  evaluatorId: string;
  onEvaluatorIdChange: (id: string) => void;
  selectedEmp: DbEmployee | null;
  evaluatorEmp: DbEmployee | null;
  cycle: EvalCycleType;
  onCycleChange: (cycle: EvalCycleType) => void;
  period: string;
  onPeriodChange: (period: string) => void;
  periodOptions: string[];
  onNext: () => void;
};

const NewEvalStepOne = ({
  activeEmployees, employeeLabels, selectedEmpId, onSelectedEmpIdChange,
  evaluatorId, onEvaluatorIdChange, selectedEmp, evaluatorEmp,
  cycle, onCycleChange, period, onPeriodChange, periodOptions, onNext,
}: NewEvalStepOneProps) => (
  <div className="space-y-4">
    {/* Employee Selection */}
    <div>
      <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>{arabicSource("common.employee")}</label>
      <EmployeeSelect
        employees={activeEmployees}
        labels={employeeLabels}
        value={selectedEmpId}
        onChange={(id) => onSelectedEmpIdChange(String(id))}
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
                labels={employeeLabels}
                value={evaluatorId}
                onChange={(id) => onEvaluatorIdChange(String(id))}
                placeholder={arabicSource("common.select_evaluator")}
                excludeIds={selectedEmpId ? [selectedEmpId] : []}
              />
            </div>
          </div>
        )}
        {evaluatorEmp && (
          <button
            onClick={() => onEvaluatorIdChange("")}
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer ps-6 mt-1"
            style={{ fontSize: 11 }}
          >
            {arabicSource("evaluation.change_assessor")}
          </button>
        )}
      </div>
    )}

    {/* Override the evaluator when the user chooses the change-evaluator action. */}
    {selectedEmp && evaluatorId === "" && selectedEmp.manager_id && (
      <div>
        <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>{arabicSource("evaluation.choose_another_rater")}</label>
        <EmployeeSelect
          employees={activeEmployees}
          labels={employeeLabels}
          value={evaluatorId}
          onChange={(id) => onEvaluatorIdChange(String(id))}
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
              onClick={() => onCycleChange(c.value)}
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
        onChange={e => onPeriodChange(e.target.value)}
        className={inputCls}
      >
        {periodOptions.map(p => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
    </div>

    {/* Next */}
    <button
      onClick={onNext}
      disabled={!selectedEmpId || !period}
      className="w-full h-11 rounded-lg bg-primary text-primary-foreground hover:bg-gold-dark transition-colors shadow-lg shadow-primary/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {arabicSource("evaluation.next_evaluation_of_criteria")}
      <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
    </button>
  </div>
);

export default NewEvalStepOne;
