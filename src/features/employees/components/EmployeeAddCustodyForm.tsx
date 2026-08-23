import { arabicSource } from "@/i18n/source";
import DashedAddRecordCard from "./shared/DashedAddRecordCard";
import DashedRecordField from "./shared/DashedRecordField";

type NewCustody = { item: string; description: string; dateReceived: string; serialNumber: string };

type EmployeeAddCustodyFormProps = {
  newCustody: NewCustody;
  onChange: (patch: Partial<NewCustody>) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

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
    </DashedAddRecordCard>
  );
};

export default EmployeeAddCustodyForm;
