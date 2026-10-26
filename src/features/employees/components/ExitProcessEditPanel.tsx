import { useCallback, useMemo, useState, type ChangeEvent } from "react";
import { DatePicker, Select } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { DbExitProcess } from "@/shared/hooks";
import FormFieldLabel from "./FormFieldLabel";
import ExpandFormCard from "./shared/ExpandFormCard";

/**
 * The details `/api/hr/exit/<id>/update` accepts while the process is open. The
 * amounts are not among them: `eos_amount`, `eos_currency` and
 * `final_settlement_amount` are written by the server's settlement only.
 */
export type ExitEditPayload = {
  exit_type: string;
  exit_date: string;
  last_working_day: string;
  notice_date: string;
  notice_period_days: number;
  reason: string;
  notes: string;
};

type ExitProcessEditPanelProps = {
  proc: DbExitProcess;
  exitTypeLabels: Record<string, string>;
  saving: boolean;
  cardCls: string;
  inputCls: string;
  onSave: (payload: ExitEditPayload) => void;
  onCancel: () => void;
};

const fromProcess = (proc: DbExitProcess): ExitEditPayload => ({
  exit_type: proc.exit_type,
  exit_date: proc.exit_date || "",
  last_working_day: proc.last_working_day || "",
  notice_date: proc.notice_date || "",
  notice_period_days: proc.notice_period_days ?? 0,
  reason: proc.reason || "",
  notes: proc.notes || "",
});

/** A non-negative number from a numeric input; the backend refuses negatives too. */
const toAmount = (value: string): number => Math.max(0, Number(value) || 0);

const ExitProcessEditPanel = ({
  proc, exitTypeLabels, saving, cardCls, inputCls, onSave, onCancel,
}: ExitProcessEditPanelProps) => {
  const [form, setForm] = useState<ExitEditPayload>(() => fromProcess(proc));

  const exitTypeOptions = useMemo(() => {
    const options = Object.entries(exitTypeLabels).map(([value, label]) => ({ value, label }));
    // A stored type the configured list no longer offers stays selectable.
    return options.some(o => o.value === proc.exit_type)
      ? options
      : [...options, { value: proc.exit_type, label: proc.exit_type }];
  }, [exitTypeLabels, proc.exit_type]);

  const handleSave = useCallback((): void => {
    onSave(form);
  }, [form, onSave]);

  const handleExitTypeChange = (value: string): void => {
    setForm(p => ({ ...p, exit_type: value }));
  };
  const handleExitDateChange = (value: string): void => {
    setForm(p => ({ ...p, exit_date: value }));
  };
  const handleLastWorkingDayChange = (value: string): void => {
    setForm(p => ({ ...p, last_working_day: value }));
  };
  const handleNoticeDateChange = (value: string): void => {
    setForm(p => ({ ...p, notice_date: value }));
  };
  const handleNoticePeriodChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setForm(p => ({ ...p, notice_period_days: Math.trunc(toAmount(e.target.value)) }));
  };
  const handleReasonChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setForm(p => ({ ...p, reason: e.target.value }));
  };
  const handleNotesChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setForm(p => ({ ...p, notes: e.target.value }));
  };

  return (
    <ExpandFormCard
      cardClassName={cardCls}
      title={arabicSource("lifecycle.exit_edit_details")}
      saveLabel={arabicSource("common.save_changes")}
      saving={saving}
      onSave={handleSave}
      onCancel={onCancel}
    >
      <div>
        <FormFieldLabel>{arabicSource("lifecycle.termination_type_2")}</FormFieldLabel>
        <Select value={form.exit_type} onChange={handleExitTypeChange} options={exitTypeOptions} className={inputCls} />
      </div>
      <div>
        <FormFieldLabel>{arabicSource("lifecycle.termination_date_2")}</FormFieldLabel>
        <DatePicker value={form.exit_date} onChange={handleExitDateChange} className="w-full" />
      </div>
      <div>
        <FormFieldLabel>{arabicSource("common.last_working_day")}</FormFieldLabel>
        <DatePicker value={form.last_working_day} onChange={handleLastWorkingDayChange} className="w-full" />
      </div>
      <div>
        <FormFieldLabel>{arabicSource("lifecycle.notice_date")}</FormFieldLabel>
        <DatePicker value={form.notice_date} onChange={handleNoticeDateChange} className="w-full" />
      </div>
      <div>
        <FormFieldLabel>{arabicSource("lifecycle.exit_notice_period_days")}</FormFieldLabel>
        <input type="number" min={0} value={form.notice_period_days} onChange={handleNoticePeriodChange} className={inputCls} dir="ltr" />
      </div>
      <div>
        <FormFieldLabel>{arabicSource("common.the_reason")}</FormFieldLabel>
        <input value={form.reason} onChange={handleReasonChange} className={inputCls} />
      </div>
      <div className="md:col-span-3">
        <FormFieldLabel>{arabicSource("common.notes")}</FormFieldLabel>
        <textarea value={form.notes} onChange={handleNotesChange} className={`${inputCls} h-20 py-2`} />
      </div>
    </ExpandFormCard>
  );
};

export default ExitProcessEditPanel;
