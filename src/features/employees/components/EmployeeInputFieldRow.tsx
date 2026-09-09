import type { ComponentType, ReactNode } from "react";
import { useCallback } from "react";
import { PositiveNumberInput } from "@/shared/components";
import EmployeeFieldRow from "./EmployeeFieldRow";

type EmployeeInputFieldRowProps = {
  icon: ComponentType<{ className?: string }>;
  iconColor?: string;
  label: string;
  /** What the row shows when not editing — often formatted (currency, an em dash fallback). */
  value: ReactNode;
  /** The raw value bound to the input while editing. */
  inputValue: string | number;
  type?: "text" | "number";
  highlight?: boolean;
  isEditing: boolean;
  onChange: (value: string) => void;
};

const inputClass =
  "w-full bg-transparent border-b-2 border-primary/40 focus:border-primary px-1 py-1.5 text-foreground outline-none transition-colors";

/**
 * A detail-panel row whose edit control is a plain text/number input.
 *
 * The info tab repeated this exact `EmployeeFieldRow` + `<input>` pairing for
 * every free-text field; the rows that need a select, a type-ahead, a date
 * picker or their own validation message keep using `EmployeeFieldRow` directly.
 */
const EmployeeInputFieldRow = ({
  icon,
  iconColor,
  label,
  value,
  inputValue,
  type = "text",
  highlight,
  isEditing,
  onChange,
}: EmployeeInputFieldRowProps) => {
  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => onChange(e.target.value),
    [onChange],
  );

  return (
    <EmployeeFieldRow
      icon={icon}
      iconColor={iconColor}
      label={label}
      value={value}
      dir="ltr"
      highlight={highlight}
      isEditing={isEditing}
      editElement={
        type === "number" ? (
          <PositiveNumberInput
            value={inputValue}
            onChange={onChange}
            className={inputClass}
            style={{ fontSize: 14 }}
            dir="ltr"
          />
        ) : (
          <input
            type={type}
            value={inputValue}
            onChange={handleTextChange}
            className={inputClass}
            style={{ fontSize: 14 }}
            dir="ltr"
          />
        )
      }
    />
  );
};

export default EmployeeInputFieldRow;
