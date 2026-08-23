import { arabicSource } from "@/i18n/source";
import { Select } from "@/shared/components";
import DashedAddRecordCard, { dashedRecordInputClass } from "./shared/DashedAddRecordCard";
import DashedRecordField from "./shared/DashedRecordField";

type NewAttachment = { name: string; type: string };

type EmployeeAddAttachmentFormProps = {
  newAttachment: NewAttachment;
  onChange: (patch: Partial<NewAttachment>) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

const EmployeeAddAttachmentForm = ({ newAttachment, onChange, onConfirm, onCancel }: EmployeeAddAttachmentFormProps) => {
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onChange({ name: e.target.value });
  };

  const handleTypeChange = (value: string): void => {
    onChange({ type: value });
  };

  return (
    <DashedAddRecordCard
      title={arabicSource("shared.add_a_new_attachment")}
      confirmDisabled={!newAttachment.name.trim()}
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <DashedRecordField
        label={arabicSource("shared.document_name")}
        value={newAttachment.name}
        onChange={handleNameChange}
        placeholder={arabicSource("shared.example_graduation_certificate")}
      />
      <Select
        label={arabicSource("shared.file_type")}
        labelClassName="text-muted-foreground block mb-1"
        labelStyle={{ fontSize: 11 }}
        value={newAttachment.type}
        onChange={handleTypeChange}
        options={[
          { value: "PDF", label: "PDF" },
          { value: arabicSource("common.image"), label: arabicSource("common.image") },
          { value: "Word", label: "Word" },
          { value: "Excel", label: "Excel" },
          { value: arabicSource("common.other"), label: arabicSource("shared.i_see") },
        ]}
        className={dashedRecordInputClass}
        style={{ fontSize: 13 }}
      />
    </DashedAddRecordCard>
  );
};

export default EmployeeAddAttachmentForm;
