import { arabicSource } from "@/i18n/source";
import DashedAddRecordCard from "./shared/DashedAddRecordCard";
import DashedRecordField from "./shared/DashedRecordField";
import DashedRecordSelectField from "./shared/DashedRecordSelectField";

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
    <DashedRecordSelectField
      label={arabicSource("shared.file_type")}
      value={newAttachment.type}
      onChange={(e) => onChange({ type: e.target.value })}
    >
      <option value="PDF">PDF</option>
      <option value={arabicSource("common.image")}>{arabicSource("common.image")}</option>
      <option value="Word">Word</option>
      <option value="Excel">Excel</option>
      <option value={arabicSource("common.other")}>{arabicSource("shared.i_see")}</option>
    </DashedRecordSelectField>
  </DashedAddRecordCard>
);

export default EmployeeAddAttachmentForm;
