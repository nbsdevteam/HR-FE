import { arabicSource } from "@/i18n/source";
import type { CustodyStatus } from "../types";
import { CUSTODY_STATUS_KEYS, custodyStatusLabels } from "../utils/custodyStatus";
import DashedAddRecordCard from "./shared/DashedAddRecordCard";
import DashedRecordField from "./shared/DashedRecordField";
import DashedRecordSelectField from "./shared/DashedRecordSelectField";

type NewCustody = { item: string; description: string; dateReceived: string; serialNumber: string; status: CustodyStatus; notes: string };

type EmployeeAddCustodyFormProps = {
  newCustody: NewCustody;
  onChange: (patch: Partial<NewCustody>) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

const CUSTODY_STATUS_OPTIONS = CUSTODY_STATUS_KEYS.map((key) => ({ value: key, label: custodyStatusLabels[key] }));

const EmployeeAddCustodyForm = ({ newCustody, onChange, onConfirm, onCancel }: EmployeeAddCustodyFormProps) => {
  const handleItemChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onChange({ item: e.target.value });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onChange({ description: e.target.value });
  };

  const handleDateReceivedChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onChange({ dateReceived: e.target.value });
  };

  const handleSerialNumberChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onChange({ serialNumber: e.target.value });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    onChange({ status: e.target.value as CustodyStatus });
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onChange({ notes: e.target.value });
  };

  return (
    <DashedAddRecordCard
      title={arabicSource("shared.add_a_new_liability")}
      confirmDisabled={!newCustody.item.trim()}
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <DashedRecordField
        label={arabicSource("shared.purpose_name")}
        value={newCustody.item}
        onChange={handleItemChange}
        placeholder={arabicSource("shared.example_portable_calculator")}
      />
      <DashedRecordField
        label={arabicSource("common.description")}
        value={newCustody.description}
        onChange={handleDescriptionChange}
        placeholder={arabicSource("shared.example_dell_latitude_5540")}
      />
      <DashedRecordField
        label={arabicSource("shared.date_of_receipt")}
        type="date"
        value={newCustody.dateReceived}
        onChange={handleDateReceivedChange}
        dir="ltr"
      />
      <DashedRecordField
        label={arabicSource("common.serial_number")}
        value={newCustody.serialNumber}
        onChange={handleSerialNumberChange}
        placeholder={arabicSource("shared.optional")}
        dir="ltr"
      />
      <DashedRecordSelectField
        label={arabicSource("common.status")}
        options={CUSTODY_STATUS_OPTIONS}
        value={newCustody.status}
        onChange={handleStatusChange}
      />
      <DashedRecordField
        label={arabicSource("common.notes")}
        value={newCustody.notes}
        onChange={handleNotesChange}
        placeholder={arabicSource("shared.optional")}
      />
    </DashedAddRecordCard>
  );
};

export default EmployeeAddCustodyForm;
