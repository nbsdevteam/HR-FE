import { Button } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type {
  NewContractTypeForm as NewContractTypeFormState,
  TypeFormCheckboxConfig,
  TypeFormRowConfig,
} from "../types";
import NewTypeForm from "./NewTypeForm";

type TNewContractTypeFormProps = {
  form: NewContractTypeFormState;
  onFieldChange: (patch: Partial<NewContractTypeFormState>) => void;
  onSave: () => void;
};

const ROWS: TypeFormRowConfig<NewContractTypeFormState>[] = [
  {
    id: "names",
    gridClassName: "grid grid-cols-1 sm:grid-cols-2 gap-3",
    fields: [
      { key: "name_ar", placeholder: arabicSource("settings.species_name_arabic") },
      { key: "name_en", placeholder: arabicSource("settings.name_english") },
    ],
  },
  {
    id: "durations",
    gridClassName: "grid grid-cols-1 sm:grid-cols-3 gap-3",
    fields: [
      { key: "code", placeholder: arabicSource("common.code") },
      { key: "default_duration_months", type: "number", placeholder: arabicSource("settings.duration_months") },
      { key: "probation_days", type: "number", placeholder: arabicSource("settings.trial_period_days") },
    ],
  },
  {
    id: "notice",
    gridClassName: "grid grid-cols-1 sm:grid-cols-2 gap-3",
    fields: [
      { key: "notice_period_days", type: "number", placeholder: arabicSource("settings.notice_period_days") },
      { key: "description", placeholder: arabicSource("common.description") },
    ],
  },
];

const CHECKBOXES: TypeFormCheckboxConfig<NewContractTypeFormState>[] = [
  { key: "is_renewable", label: arabicSource("settings.renewable_2") },
];

const NewContractTypeForm = ({
  form,
  onFieldChange,
  onSave,
}: TNewContractTypeFormProps) => (
  <NewTypeForm
    form={form}
    rows={ROWS}
    checkboxes={CHECKBOXES}
    onFieldChange={onFieldChange}
    checkboxRowClassName="flex items-center gap-4"
    footer={
      <Button onClick={onSave} className="w-full font-medium cursor-pointer">
        {arabicSource("settings.add_a_contract_type")}
      </Button>
    }
  />
);

export default NewContractTypeForm;
