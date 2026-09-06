import { useCallback, useState } from "react";
import { AnimatePresence } from "motion/react";
import { Plus, UserX } from "lucide-react";
import * as odooData from "@/shared/api/odooData";
import { Button, DataTable, EmptyState, TableHeaderRow } from "@/shared/components";
import {
  useExitChecklist,
  type DbEmployee, type DbExitProcess, type DbExitChecklistItem, type DbCustody,
} from "@/shared/hooks";
import { useOdooMutation } from "@/shared/hooks/useOdooMutation";
import { calculateEOS, DEFAULT_EOS_CONFIG } from "@/features/payroll/services/payslip-engine";
import { arabicSource } from "@/i18n/source";
import { localizedAlert } from "@/i18n/native";
import { errorMessage } from "../utils/errorMessage";
import { lifecycleCardClass as cardCls, lifecycleInputClass as inputCls } from "../styles/lifecycle";
import type { EmployeeMap } from "../types/lifecycle";
import ExitProcessFormPanel, { type ExitFormData } from "./ExitProcessFormPanel";
import ExitProcessTableRow from "./ExitProcessTableRow";
import ExitProcessDetailView from "./ExitProcessDetailView";

const EMPTY_EXIT_FORM: ExitFormData = {
  employee_id: "", exit_type: "resignation", exit_date: "",
  last_working_day: "", reason: "", notice_date: "",
};

const ExitTab = ({
  processes, exitItems, empMap, employees, employeeLabels, refetch,
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
  const [saving, setSaving] = useState(false);

  // Fetch checklist for selected process
  const { checklist } = useExitChecklist(selectedProcess || undefined);

  const createExitProcessMutation = useOdooMutation(
    (payload: Record<string, unknown>) => odooData.createExitProcess(payload),
    "exitProcesses",
  );
  const updateExitChecklistLineMutation = useOdooMutation(
    (variables: { id: string; payload: Record<string, unknown> }) =>
      odooData.updateExitChecklistLine(variables.id, variables.payload),
    "exitChecklist",
  );
  const updateExitProcessMutation = useOdooMutation(
    (variables: { id: string; payload: Record<string, unknown> }) =>
      odooData.updateExitProcess(variables.id, variables.payload),
    "exitProcesses",
  );
  const setEmployeeStatusMutation = useOdooMutation(
    (variables: { id: string; status: string }) => odooData.setEmployeeStatus(variables.id, variables.status),
    "employees",
  );
  // Custody rows aren't backed by a TanStack Query read hook (ExitTab only
  // fetches them ad hoc here to clear them out on exit), so there's no cache
  // key to invalidate.
  const updateCustodyMutation = useOdooMutation(
    (variables: { id: string; payload: Record<string, unknown> }) =>
      odooData.updateCustody(variables.id, variables.payload),
    [],
  );

  const handleCreate = useCallback(async () => {
    if (!formData.employee_id || !formData.exit_date) return;
    setSaving(true);

    // Calculate EOS
    const emp = empMap[formData.employee_id];
    let eosAmount = 0;
    if (emp?.join_date && emp?.monthly_salary) {
      eosAmount = calculateEOS(
        emp.join_date,
        emp.monthly_salary,
        emp.currency || "IQD",
        DEFAULT_EOS_CONFIG,
        formData.exit_date,
      )?.amount ?? 0;
    }

    try {
      // Backend auto-creates checklist lines from active checklist items.
      await createExitProcessMutation.mutateAsync({
        employee_id: formData.employee_id,
        exit_type: formData.exit_type,
        exit_date: formData.exit_date,
        last_working_day: formData.last_working_day || formData.exit_date,
        reason: formData.reason || null,
        notice_date: formData.notice_date || null,
        eos_amount: eosAmount,
        status: "in_progress",
      });
      setShowForm(false);
      setFormData(EMPTY_EXIT_FORM);
    } catch (e) {
      console.error(e);
      localizedAlert("خطأ في إنشاء إجراء إنهاء الخدمة " + errorMessage(e));
    }
    setSaving(false);
  }, [formData, empMap, createExitProcessMutation.mutateAsync]);

  const handleChecklistToggle = useCallback(async (checklistId: string, completed: boolean) => {
    try {
      await updateExitChecklistLineMutation.mutateAsync({ id: checklistId, payload: { is_completed: completed } });
    } catch (e) {
      console.error(e);
      localizedAlert("خطأ في تحديث قائمة إخلاء الطرف " + errorMessage(e));
    }
  }, [updateExitChecklistLineMutation.mutateAsync]);

  const handleStatusUpdate = useCallback(async (processId: string, status: string) => {
    try {
      await updateExitProcessMutation.mutateAsync({ id: processId, payload: { status } });
      if (status === "completed") {
        const proc = processes.find(p => p.id === processId);
        if (proc) {
          await setEmployeeStatusMutation.mutateAsync({ id: proc.employee_id, status: "exited" });
          // Return open custodies so exit clears outstanding assets. The
          // backend stamps return_date to the Baghdad business day itself
          // when status flips to "returned" and no date is sent — see
          // FE hand-off §4.
          try {
            const open: DbCustody[] = await odooData.fetchCustodies(proc.employee_id);
            await Promise.all(
              (open || [])
                .filter(c => !c.return_date && c.status !== "returned")
                .map(c => updateCustodyMutation.mutateAsync({ id: c.id, payload: { status: "returned" } })),
            );
          } catch (custodyErr) {
            console.error(custodyErr);
          }
        }
      }
    } catch (e) {
      console.error(e);
      localizedAlert("خطأ في تحديث حالة إجراء الإنهاء " + errorMessage(e));
    }
  }, [processes, setEmployeeStatusMutation.mutateAsync, updateCustodyMutation.mutateAsync, updateExitProcessMutation.mutateAsync]);

  const toggleForm = useCallback(() => setShowForm((v) => !v), []);
  const closeForm = useCallback(() => setShowForm(false), []);
  const openDetail = useCallback((processId: string) => setSelectedProcess(processId), []);
  const closeDetail = useCallback(() => setSelectedProcess(null), []);

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
        onView={openDetail}
      />
    ),
    [empMap, exitTypeLabels, statusLabels, statusColors, openDetail],
  );

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
        onBack={closeDetail}
        onStatusUpdate={handleStatusUpdate}
        onChecklistToggle={handleChecklistToggle}
      />
    );
  }

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
            saving={saving}
            cardCls={cardCls}
            inputCls={inputCls}
          />
        )}
      </AnimatePresence>

      {/* Exit Processes List */}
      <DataTable
        wrapperClassName={cardCls}
        items={processes}
        header={<TableHeaderRow headings={[arabicSource("common.employee"), arabicSource("lifecycle.termination_type"), arabicSource("lifecycle.termination_date"), arabicSource("lifecycle.n_kh_receivables"), arabicSource("common.status"), arabicSource("common.width")]} />}
        renderRow={renderExitProcessRow}
        emptyRow={<tr><td colSpan={6}><EmptyState icon={UserX} message={arabicSource("lifecycle.no_termination_procedures")} /></td></tr>}
      />
    </div>
  );
};

export default ExitTab;
