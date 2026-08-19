import type { Dispatch, SetStateAction } from "react";
import { EmployeeSelect } from "@/features/employees";
import { arabicSource } from "@/i18n/source";
import FormFieldLabel from "./FormFieldLabel";
import ExpandFormCard from "./shared/ExpandFormCard";

export type ExitFormData = {
  employee_id: string;
  exit_type: string;
  exit_date: string;
  last_working_day: string;
  reason: string;
  notice_date: string;
};

type ExitProcessFormPanelProps = {
  formData: ExitFormData;
  setFormData: Dispatch<SetStateAction<ExitFormData>>;
  employees: any[];
  employeeLabels: Record<string, string>;
  exitTypeLabels: Record<string, string>;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  cardCls: string;
  inputCls: string;
};

const ExitProcessFormPanel = ({
  formData, setFormData, employees, employeeLabels, exitTypeLabels, onSave, onCancel, saving, cardCls, inputCls,
}: ExitProcessFormPanelProps) => (
  <ExpandFormCard
    cardClassName={cardCls}
    title={arabicSource("lifecycle.termination_of_an_employee")}
    saveLabel={arabicSource("common.initiate_procedures")}
    saving={saving}
    onSave={onSave}
    onCancel={onCancel}
  >
    <div>
      <FormFieldLabel>{arabicSource("common.employee_3")}</FormFieldLabel>
      <EmployeeSelect
        employees={employees}
        labels={employeeLabels}
        value={formData.employee_id}
        onChange={(id) => setFormData((p) => ({ ...p, employee_id: String(id) }))}
        filter={(e) => e.status !== arabicSource("common.finished")}
      />
    </div>
    <div>
      <FormFieldLabel>{arabicSource("lifecycle.termination_type_2")}</FormFieldLabel>
      <select value={formData.exit_type} onChange={e => setFormData(p => ({ ...p, exit_type: e.target.value }))} className={inputCls}>
        {Object.entries(exitTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
    </div>
    <div>
      <FormFieldLabel>{arabicSource("lifecycle.termination_date_2")}</FormFieldLabel>
      <input type="date" value={formData.exit_date} onChange={e => setFormData(p => ({ ...p, exit_date: e.target.value }))} className={inputCls} dir="ltr" />
    </div>
    <div>
      <FormFieldLabel>{arabicSource("common.last_working_day")}</FormFieldLabel>
      <input type="date" value={formData.last_working_day} onChange={e => setFormData(p => ({ ...p, last_working_day: e.target.value }))} className={inputCls} dir="ltr" />
    </div>
    <div>
      <FormFieldLabel>{arabicSource("lifecycle.notice_date")}</FormFieldLabel>
      <input type="date" value={formData.notice_date} onChange={e => setFormData(p => ({ ...p, notice_date: e.target.value }))} className={inputCls} dir="ltr" />
    </div>
    <div>
      <FormFieldLabel>{arabicSource("common.the_reason")}</FormFieldLabel>
      <input value={formData.reason} onChange={e => setFormData(p => ({ ...p, reason: e.target.value }))} className={inputCls} placeholder={arabicSource("lifecycle.reason_for_termination")} />
    </div>
  </ExpandFormCard>
);

export default ExitProcessFormPanel;
