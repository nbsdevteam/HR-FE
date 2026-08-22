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

const EmployeeAddAttachmentForm = ({ newAttachment, onChange, onConfirm, onCancel }: EmployeeAddAttachmentFormProps) => (
  <DashedAddRecordCard
    title={arabicSource("shared.add_a_new_attachment")}
    confirmDisabled={!newAttachment.name.trim()}
    onConfirm={onConfirm}
    onCancel={onCancel}
  >
    <DashedRecordField
      label={arabicSource("shared.document_name")}
      value={newAttachment.name}
      onChange={(e) => onChange({ name: e.target.value })}
      placeholder={arabicSource("shared.example_graduation_certificate")}
    />
    <Select
      label={arabicSource("shared.file_type")}
      labelClassName="text-muted-foreground block mb-1"
      labelStyle={{ fontSize: 11 }}
      value={newAttachment.type}
      onChange={(e) => onChange({ type: e.target.value })}
      className={dashedRecordInputClass}
      style={{ fontSize: 13 }}
    >
      <option value="PDF">PDF</option>
      <option value={arabicSource("common.image")}>{arabicSource("common.image")}</option>
      <option value="Word">Word</option>
      <option value="Excel">Excel</option>
      <option value={arabicSource("common.other")}>{arabicSource("shared.i_see")}</option>
    </Select>
  </DashedAddRecordCard>
);

export default EmployeeAddAttachmentForm;
