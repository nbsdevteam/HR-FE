import { useMemo, type ChangeEvent, type Dispatch, type SetStateAction } from "react";
import {
  getEmployeeDescription,
  getEmployeeId,
  getEmployeeSearchText,
} from "@/shared/utils/employeeTypeAhead";
import { Select, TypeAhead } from "@/shared/components";
import { empDisplayName, type DbEmployee } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import FormFieldLabel from "./FormFieldLabel";
import ExpandFormCard from "./shared/ExpandFormCard";

/** Employees who have already left cannot start a new exit process. */
const isNotAlreadyFinished = (e: DbEmployee): boolean =>
  e.status !== arabicSource("common.finished");

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
  employees: DbEmployee[];
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
}: ExitProcessFormPanelProps) => {
  const exitTypeOptions = useMemo(
    () => Object.entries(exitTypeLabels).map(([value, label]) => ({ value, label })),
    [exitTypeLabels],
  );

  const handleEmployeeChange = (id: string): void => {
    setFormData((p) => ({ ...p, employee_id: String(id) }));
  };

  const handleExitTypeChange = (value: string): void => {
    setFormData((p) => ({ ...p, exit_type: value }));
  };

  const handleExitDateChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setFormData((p) => ({ ...p, exit_date: e.target.value }));
  };

  const handleLastWorkingDayChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setFormData((p) => ({ ...p, last_working_day: e.target.value }));
  };

  const handleNoticeDateChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setFormData((p) => ({ ...p, notice_date: e.target.value }));
  };

  const handleReasonChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setFormData((p) => ({ ...p, reason: e.target.value }));
  };

  return (
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
        <TypeAhead
          items={employees}
          getId={getEmployeeId}
          getLabel={empDisplayName}
          getDescription={getEmployeeDescription}
          getSearchText={getEmployeeSearchText}
          fallbackLabels={employeeLabels}
          value={formData.employee_id}
          onChange={handleEmployeeChange}
          filter={isNotAlreadyFinished}
        />
      </div>
      <div>
        <FormFieldLabel>{arabicSource("lifecycle.termination_type_2")}</FormFieldLabel>
        <Select
          value={formData.exit_type}
          onChange={handleExitTypeChange}
          options={exitTypeOptions}
          className={inputCls}
        />
      </div>
      <div>
        <FormFieldLabel>{arabicSource("lifecycle.termination_date_2")}</FormFieldLabel>
        <input type="date" value={formData.exit_date} onChange={handleExitDateChange} className={inputCls} dir="ltr" />
      </div>
      <div>
        <FormFieldLabel>{arabicSource("common.last_working_day")}</FormFieldLabel>
        <input type="date" value={formData.last_working_day} onChange={handleLastWorkingDayChange} className={inputCls} dir="ltr" />
      </div>
      <div>
        <FormFieldLabel>{arabicSource("lifecycle.notice_date")}</FormFieldLabel>
        <input type="date" value={formData.notice_date} onChange={handleNoticeDateChange} className={inputCls} dir="ltr" />
      </div>
      <div>
        <FormFieldLabel>{arabicSource("common.the_reason")}</FormFieldLabel>
        <input value={formData.reason} onChange={handleReasonChange} className={inputCls} placeholder={arabicSource("lifecycle.reason_for_termination")} />
      </div>
    </ExpandFormCard>
  );
};

export default ExitProcessFormPanel;
