import { useCallback, useEffect, useState } from "react";
import { AnimatePresence } from "motion/react";
import { Plus, UserX } from "lucide-react";
import { useSearchParams } from "react-router";
import { Button, DataTable, EmptyState, TableHeaderRow } from "@/shared/components";
import {
  useExitChecklist,
  useMyTasks,
  type DbEmployee, type DbExitProcess, type DbExitChecklistItem, type ExitStatus,
} from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { lifecycleCardClass as cardCls, lifecycleInputClass as inputCls } from "../styles/lifecycle";
import type { EmployeeMap } from "../types/lifecycle";
import { useExitDecisionActions } from "../hooks/useExitDecisionActions";
import { useExitProcessActions } from "../hooks/useExitProcessActions";
import { useExitProcessFilter } from "../hooks/useExitProcessFilter";
import ExitProcessCard from "./ExitProcessCard";
import ExitProcessFormPanel, { type ExitFormData } from "./ExitProcessFormPanel";
import ExitProcessTableRow from "./ExitProcessTableRow";
import ExitProcessDetailView from "./ExitProcessDetailView";
import ExitStageFilterBar from "./ExitStageFilterBar";
import type { ExitEditPayload } from "./ExitProcessEditPanel";

const EMPTY_EXIT_FORM: ExitFormData = {
  employee_id: "", exit_type: "resignation", exit_date: "",
  last_working_day: "", reason: "", notice_date: "",
};

/** `?exit=<id>` — the deep link the clearance notifications carry. */
const EXIT_PARAM = "exit";

/** `?start=<employeeId>` — opens the new End of Service form for that employee. */
const START_PARAM = "start";

const ExitTab = ({
  processes, exitItems, empMap, employees, employeeLabels,
  exitTypeLabels, statusLabels, statusColors, checklistCategoryLabels,
}: {
  processes: DbExitProcess[];
  exitItems: DbExitChecklistItem[];
  empMap: EmployeeMap;
  employees: DbEmployee[];
  employeeLabels: Record<string, string>;
  refetch: () => void;
  exitTypeLabels: Record<string, string>;
  statusLabels: Record<string, string>;
  statusColors: Record<string, string>;
  checklistCategoryLabels: Record<string, string>;
}) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<string | null>(null);
  const [formData, setFormData] = useState<ExitFormData>(EMPTY_EXIT_FORM);

  // Fetch checklist for selected process
  const { checklist } = useExitChecklist(selectedProcess || undefined);
  const { busy, createExit, transition, saveEdit, toggleChecklist } = useExitProcessActions(setSelectedProcess);
  const decisionActions = useExitDecisionActions();
  const { tasks } = useMyTasks();
  const { counts, filter, selectFilter, tasksByExit, visible } = useExitProcessFilter(processes, tasks);
  const [searchParams, setSearchParams] = useSearchParams();

  const handleCreate = useCallback(async () => {
    if (!formData.employee_id || !formData.exit_date) return;

    // The benefits and settlement amounts are the server's: entering settlement
    // calculates the statement, and `/exit/create` ignores any amount sent.
    // Backend auto-creates checklist lines from active checklist items.
    const created = await createExit({
      employee_id: formData.employee_id,
      exit_type: formData.exit_type,
      exit_date: formData.exit_date,
      last_working_day: formData.last_working_day || formData.exit_date,
      reason: formData.reason || null,
      notice_date: formData.notice_date || null,
    });
    if (created) {
      setShowForm(false);
      setFormData(EMPTY_EXIT_FORM);
    }
  }, [formData, createExit]);

  const handleTransition = useCallback((processId: string, status: ExitStatus): void => {
    void transition(processId, status);
  }, [transition]);

  const handleEditSave = useCallback(
    (processId: string, payload: ExitEditPayload): Promise<boolean> => saveEdit(processId, payload),
    [saveEdit],
  );

  const handleChecklistToggle = useCallback((checklistId: string, completed: boolean): void => {
    void toggleChecklist(checklistId, completed);
  }, [toggleChecklist]);

  const toggleForm = useCallback(() => setShowForm((v) => !v), []);
  const closeForm = useCallback(() => setShowForm(false), []);
  const openDetail = useCallback((processId: string) => setSelectedProcess(processId), []);
  const closeDetail = useCallback(() => {
    setSelectedProcess(null);
    if (searchParams.has(EXIT_PARAM)) {
      const next = new URLSearchParams(searchParams);
      next.delete(EXIT_PARAM);
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const renderExitProcessRow = useCallback(
    (p: DbExitProcess, i: number) => (
      <ExitProcessTableRow
        key={p.id}
        process={p}
        index={i}
        emp={empMap[p.employee_id]}
        exitTypeLabels={exitTypeLabels}
        statusLabels={statusLabels}
        statusColors={statusColors}
        categoryLabels={checklistCategoryLabels}
        task={tasksByExit.get(p.id) ?? null}
        onView={openDetail}
      />
    ),
    [empMap, exitTypeLabels, statusLabels, statusColors, checklistCategoryLabels, tasksByExit, openDetail],
  );

  const renderExitProcessCard = useCallback(
    (p: DbExitProcess) => (
      <ExitProcessCard
        key={p.id}
        process={p}
        emp={empMap[p.employee_id]}
        exitTypeLabels={exitTypeLabels}
        statusLabels={statusLabels}
        statusColors={statusColors}
        categoryLabels={checklistCategoryLabels}
        task={tasksByExit.get(p.id) ?? null}
        cardCls={cardCls}
        onView={openDetail}
      />
    ),
    [empMap, exitTypeLabels, statusLabels, statusColors, checklistCategoryLabels, tasksByExit, openDetail],
  );

  // Start End of Service for the employee an Employees action was refused for.
  useEffect(() => {
    const employeeId = searchParams.get(START_PARAM);
    if (!employeeId) return;
    setFormData({ ...EMPTY_EXIT_FORM, employee_id: employeeId });
    setShowForm(true);
    const next = new URLSearchParams(searchParams);
    next.delete(START_PARAM);
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  // Open the process a notification links to, once the list has it.
  useEffect(() => {
    const linked = searchParams.get(EXIT_PARAM);
    if (linked && processes.some(p => p.id === linked)) setSelectedProcess(linked);
  }, [processes, searchParams]);

  // Detail view
  if (selectedProcess) {
    const proc = processes.find(p => p.id === selectedProcess);
    if (!proc) { setSelectedProcess(null); return null; }
    const emp = empMap[proc.employee_id];

    return (
      <ExitProcessDetailView
        proc={proc}
        emp={emp}
        checklist={checklist}
        exitItems={exitItems}
        categoryLabels={checklistCategoryLabels}
        exitTypeLabels={exitTypeLabels}
        statusLabels={statusLabels}
        statusColors={statusColors}
        cardCls={cardCls}
        inputCls={inputCls}
        busy={busy}
        decisionActions={decisionActions}
        onBack={closeDetail}
        onTransition={handleTransition}
        onEditSave={handleEditSave}
        onChecklistToggle={handleChecklistToggle}
      />
    );
  }

  const emptyMessage = arabicSource(processes.length === 0 ? "lifecycle.no_termination_procedures" : "lifecycle.exit_progress_no_matches");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button size="lg" icon={Plus} onClick={toggleForm} className="shadow-lg shadow-primary/20">
          {arabicSource("common.termination_of_service")}
        </Button>
      </div>

      {/* New Exit Form */}
      <AnimatePresence>
        {showForm && (
          <ExitProcessFormPanel
            formData={formData}
            setFormData={setFormData}
            employees={employees}
            employeeLabels={employeeLabels}
            exitTypeLabels={exitTypeLabels}
            onSave={handleCreate}
            onCancel={closeForm}
            saving={busy}
            cardCls={cardCls}
            inputCls={inputCls}
          />
        )}
      </AnimatePresence>

      <ExitStageFilterBar filter={filter} counts={counts} statusLabels={statusLabels} onSelect={selectFilter} />

      {/* Exit Processes List */}
      <DataTable
        wrapperClassName={`${cardCls} hidden md:block`}
        items={visible}
        header={<TableHeaderRow headings={[arabicSource("common.employee"), arabicSource("common.status"), arabicSource("employees.lifecycle_waiting_on"), arabicSource("lifecycle.exit_progress_next"), arabicSource("lifecycle.exit_progress_in_stage")]} />}
        renderRow={renderExitProcessRow}
        emptyRow={<tr><td colSpan={5}><EmptyState icon={UserX} message={emptyMessage} /></td></tr>}
      />
      <div className="space-y-3 md:hidden">
        {visible.length === 0 ? <EmptyState icon={UserX} message={emptyMessage} /> : visible.map(renderExitProcessCard)}
      </div>
    </div>
  );
};

export default ExitTab;
