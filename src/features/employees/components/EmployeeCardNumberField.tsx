import { arabicSource } from "@/i18n/source";
import type { EmployeeAddForm } from "../types";
import LabeledInput from "./LabeledInput";

type EmployeeCardNumberFieldProps = {
  value: EmployeeAddForm["cardNumber"];
  onFormChange: (updates: Partial<EmployeeAddForm>) => void;
};

const EmployeeCardNumberField = ({ value, onFormChange }: EmployeeCardNumberFieldProps) => {
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onFormChange({ cardNumber: e.target.value });
  };

  return (
    <LabeledInput
      label={`${arabicSource("devicemanagement.card_number")} ${arabicSource("employees.optional_can_be_added_later")}`}
      type="text"
      dir="ltr"
      value={value}
      onChange={handleCardNumberChange}
      placeholder={arabicSource("employees.enter_the_card_number")}
    />
  );
};

export default EmployeeCardNumberField;
