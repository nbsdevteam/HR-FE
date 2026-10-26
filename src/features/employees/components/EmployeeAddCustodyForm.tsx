import { DatePicker } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { CustodyStatus } from "../types";
import { CUSTODY_CURRENCIES, CUSTODY_STATUS_KEYS, custodyStatusLabels } from "../utils/custodyStatus";
import DashedAddRecordCard from "./shared/DashedAddRecordCard";
import DashedRecordField from "./shared/DashedRecordField";
import DashedRecordSelectField from "./shared/DashedRecordSelectField";

type NewCustody = {
  item: string; description: string; dateReceived: string; serialNumber: string; status: CustodyStatus; notes: string;
  valueAmount: string; valueCurrency: string;
};

type EmployeeAddCustodyFormProps = {
  newCustody: NewCustody;
  onChange: (patch: Partial<NewCustody>) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

const CUSTODY_CURRENCY_OPTIONS = CUSTODY_CURRENCIES.map((currency) => ({ value: currency, label: currency }));

const CUSTODY_STATUS_OPTIONS = CUSTODY_STATUS_KEYS.map((key) => ({ value: key, label: custodyStatusLabels[key] }));

const EmployeeAddCustodyForm = ({ newCustody, onChange, onConfirm, onCancel }: EmployeeAddCustodyFormProps) => {
  const handleItemChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onChange({ item: e.target.value });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onChange({ description: e.target.value });
  };

  const handleDateReceivedChange = (value: string): void => {
    onChange({ dateReceived: value });
  };

  const handleSerialNumberChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onChange({ serialNumber: e.target.value });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    onChange({ status: e.target.value as CustodyStatus });
  };

  const handleValueAmountChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onChange({ valueAmount: e.target.value });
  };

  const handleValueCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    onChange({ valueCurrency: e.target.value });
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
      <div>
        <label className="text-muted-foreground block mb-1" style={{ fontSize: 11 }}>
          {arabicSource("shared.date_of_receipt")}
        </label>
        <DatePicker value={newCustody.dateReceived} onChange={handleDateReceivedChange} />
      </div>
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
        label={arabicSource("employees.custody_value_amount")}
        type="number"
        min={0}
        value={newCustody.valueAmount}
        onChange={handleValueAmountChange}
        placeholder={arabicSource("shared.optional")}
        dir="ltr"
      />
      <DashedRecordSelectField
        label={arabicSource("employees.custody_value_currency")}
        options={CUSTODY_CURRENCY_OPTIONS}
        value={newCustody.valueCurrency}
        onChange={handleValueCurrencyChange}
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
