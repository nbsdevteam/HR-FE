import type { Dispatch, SetStateAction } from "react";
import { motion } from "motion/react";
import { Loader2, Save } from "lucide-react";
import { EmployeeSelect } from "@/features/employees";
import { Select } from "@/shared/components";
import type { DbContractType } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import FormFieldLabel from "./FormFieldLabel";

export type ContractFormData = {
  employee_id: string;
  contract_type_id: string;
  start_date: string;
  end_date: string;
  salary_amount: number;
  salary_currency: string;
  contract_number: string;
  notes: string;
};

type ContractFormPanelProps = {
  formData: ContractFormData;
  setFormData: Dispatch<SetStateAction<ContractFormData>>;
  employees: any[];
  employeeLabels: Record<string, string>;
  contractTypes: DbContractType[];
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  cardCls: string;
  inputCls: string;
};

const ContractFormPanel = ({
  formData,
  setFormData,
  employees,
  employeeLabels,
  contractTypes,
  onSave,
  onCancel,
  saving,
  cardCls,
  inputCls,
}: ContractFormPanelProps) => (
  <motion.div
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: "auto" }}
    exit={{ opacity: 0, height: 0 }}
    className={`${cardCls} p-5`}
  >
    <h3 className="text-foreground mb-4">
      {arabicSource("common.new_contract")}
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div>
        <FormFieldLabel>{arabicSource("common.employee_3")}</FormFieldLabel>
        <EmployeeSelect
          employees={employees}
          labels={employeeLabels}
          value={formData.employee_id}
          onChange={(id) =>
            setFormData((p) => ({ ...p, employee_id: String(id) }))
          }
        />
      </div>
      <div>
        <FormFieldLabel>
          {arabicSource("lifecycle.contract_type_2")}
        </FormFieldLabel>
        <Select
          value={formData?.contract_type_id}
          onChange={(e) =>
            setFormData((p) => ({ ...p, contract_type_id: e.target.value }))
          }
          className={inputCls}
        >
          <option value="">{arabicSource("common.choose")}</option>
          {contractTypes
            .filter((t) => t.is_active)
            .map((t) => (
              <option key={t.id} value={t.id}>
                {t.name_ar}
              </option>
            ))}
        </Select>
      </div>
      <div>
        <FormFieldLabel>
          {arabicSource("common.contract_number")}
        </FormFieldLabel>
        <input
          value={formData.contract_number}
          onChange={(e) =>
            setFormData((p) => ({ ...p, contract_number: e.target.value }))
          }
          className={inputCls}
          dir="ltr"
        />
      </div>
      <div>
        <FormFieldLabel>{arabicSource("lifecycle.start_date")}</FormFieldLabel>
        <input
          type="date"
          value={formData.start_date}
          onChange={(e) =>
            setFormData((p) => ({ ...p, start_date: e.target.value }))
          }
          className={inputCls}
          dir="ltr"
        />
      </div>
      <div>
        <FormFieldLabel>{arabicSource("common.end_date")}</FormFieldLabel>
        <input
          type="date"
          value={formData.end_date}
          onChange={(e) =>
            setFormData((p) => ({ ...p, end_date: e.target.value }))
          }
          className={inputCls}
          dir="ltr"
        />
      </div>
      <div>
        <FormFieldLabel>{arabicSource("common.salary")}</FormFieldLabel>
        <div className="flex gap-2">
          <input
            type="number"
            value={formData.salary_amount || ""}
            onChange={(e) =>
              setFormData((p) => ({
                ...p,
                salary_amount: Number(e.target.value),
              }))
            }
            className={`${inputCls} flex-1`}
            dir="ltr"
          />
          <Select
            value={formData.salary_currency}
            onChange={(e) =>
              setFormData((p) => ({ ...p, salary_currency: e.target.value }))
            }
            className="w-20 h-10 px-2 rounded-lg border border-border bg-input-background text-foreground text-xs outline-none"
          >
            <option value="IQD">IQD</option>
            <option value="USD">USD</option>
          </Select>
        </div>
      </div>
    </div>
    <div className="flex gap-2 mt-4">
      <button
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs hover:bg-primary/90 cursor-pointer disabled:opacity-50"
      >
        {saving ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Save className="w-3 h-3" />
        )}{" "}
        {arabicSource("common.save")}
      </button>
      <button
        onClick={onCancel}
        className="px-4 py-2 border border-border text-muted-foreground rounded-lg text-xs hover:bg-muted/20 cursor-pointer"
      >
        {arabicSource("common.cancel")}
      </button>
    </div>
  </motion.div>
);

export default ContractFormPanel;
