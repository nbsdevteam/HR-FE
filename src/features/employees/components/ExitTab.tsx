import { useCallback, useState } from "react";
import { AnimatePresence } from "motion/react";
import { Plus, UserX } from "lucide-react";
import * as odooData from "@/shared/api/odooData";
import { Button, DataTable, EmptyState, TableHeaderRow } from "@/shared/components";
import {
  useExitChecklist,
  type DbEmployee, type DbExitProcess, type DbExitChecklistItem,
} from "@/shared/hooks";
import { calculateEOS, DEFAULT_EOS_CONFIG } from "@/features/payroll/services/payslip-engine";
import { arabicSource } from "@/i18n/source";
import { localizedAlert } from "@/i18n/native";
import { errorMessage } from "../utils/errorMessage";
import { lifecycleCardClass as cardCls, lifecycleInputClass as inputCls } from "../styles/lifecycle";
import type { EmployeeMap } from "../types/lifecycle";

/** Minimal shape of a custody row — `odooData.fetchCustodies` is typed `any[]`. */
type OpenCustody = { id: string; return_date?: string | null; status?: string | null };
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
  const { checklist, refetch: refetchChecklist } = useExitChecklist(selectedProcess || undefined);

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
      await odooData.createExitProcess({
        employee_id: formData.employee_id,
        exit_type: formData.exit_type,
        exit_date: formData.exit_date,
        last_working_day: formData.last_working_day || formData.exit_date,
        reason: formData.reason || null,
        notice_date: formData.notice_date || null,
        eos_amount: eosAmount,
        status: "in_progress",
      });
      refetch();
      setShowForm(false);
      setFormData(EMPTY_EXIT_FORM);
    } catch (e) {
      console.error(e);
      localizedAlert("خطأ في إنشاء إجراء إنهاء الخدمة " + errorMessage(e));
    }
    setSaving(false);
  }, [formData, empMap, refetch]);

  const handleChecklistToggle = useCallback(async (checklistId: string, completed: boolean) => {
    try {
      await odooData.updateExitChecklistLine(checklistId, { is_completed: completed });
      refetchChecklist();
    } catch (e) {
      console.error(e);
      localizedAlert("خطأ في تحديث قائمة إخلاء الطرف " + errorMessage(e));
    }
  }, [refetchChecklist]);

  const handleStatusUpdate = useCallback(async (processId: string, status: string) => {
    try {
      await odooData.updateExitProcess(processId, { status });
      if (status === "completed") {
        const proc = processes.find(p => p.id === processId);
        if (proc) {
          await odooData.setEmployeeStatus(proc.employee_id, "exited");
          // Return open custodies so exit clears outstanding assets.
          try {
            const open: OpenCustody[] = await odooData.fetchCustodies(proc.employee_id);
            const today = new Date().toISOString().slice(0, 10);
            await Promise.all(
              (open || [])
                .filter(c => !c.return_date && c.status !== "returned")
                .map(c =>
                  odooData.updateCustody(c.id, {
                    status: "returned",
                    return_date: today,
                  }),
                ),
            );
          } catch (custodyErr) {
            console.error(custodyErr);
          }
        }
      }
      refetch();
    } catch (e) {
      console.error(e);
      localizedAlert("خطأ في تحديث حالة إجراء الإنهاء " + errorMessage(e));
    }
  }, [processes, refetch]);

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
