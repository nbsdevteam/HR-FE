import { Button } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type {
  NewDocTypeForm as NewDocTypeFormState,
  TypeFormCheckboxConfig,
  TypeFormRowConfig,
} from "../types";
import NewTypeForm from "./NewTypeForm";

type TNewDocTypeFormProps = {
  form: NewDocTypeFormState;
  onFieldChange: (patch: Partial<NewDocTypeFormState>) => void;
  onSave: () => void;
};

const ROWS: TypeFormRowConfig<NewDocTypeFormState>[] = [
  {
    id: "names",
    gridClassName: "grid grid-cols-2 gap-3",
    fields: [
      { key: "name_ar", placeholder: arabicSource("settings.document_name_arabic") },
      { key: "name_en", placeholder: arabicSource("settings.name_english") },
    ],
  },
  {
    id: "expiry",
    gridClassName: "grid grid-cols-2 gap-3",
    fields: [
      { key: "code", placeholder: arabicSource("common.code") },
      { key: "expiry_warning_days", type: "number", placeholder: arabicSource("settings.alert_days_before_expiry") },
    ],
  },
];

const CHECKBOXES: TypeFormCheckboxConfig<NewDocTypeFormState>[] = [
  { key: "has_expiry", label: arabicSource("settings.has_an_expiration_date") },
  { key: "is_required", label: arabicSource("settings.mandatory_required") },
];

const NewDocTypeForm = ({
  form,
  onFieldChange,
  onSave,
}: TNewDocTypeFormProps) => (
  <NewTypeForm
    form={form}
    rows={ROWS}
    checkboxes={CHECKBOXES}
    onFieldChange={onFieldChange}
    footer={
      <Button onClick={onSave} className="w-full font-medium cursor-pointer">
        {arabicSource("settings.add_document_type")}
      </Button>
    }
  />
);

export default NewDocTypeForm;
