import type { ComponentType, ReactNode } from "react";
import EmployeeFieldRow from "./EmployeeFieldRow";

type EmployeeInputFieldRowProps = {
  icon: ComponentType<{ className?: string }>;
  iconColor?: string;
  label: string;
  /** What the row shows when not editing — often formatted (currency, an em dash fallback). */
  value: ReactNode;
  /** The raw value bound to the input while editing. */
  inputValue: string | number;
  type?: "text" | "number" | "date";
  max?: string;
  highlight?: boolean;
  isEditing: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const inputClass =
  "w-full bg-transparent border-b-2 border-primary/40 focus:border-primary px-1 py-1.5 text-foreground outline-none transition-colors";

/**
 * A detail-panel row whose edit control is a plain text/number/date input.
 *
 * The info tab repeated this exact `EmployeeFieldRow` + `<input>` pairing for
 * every free-text field; the rows that need a select, a type-ahead or their own
 * validation message keep using `EmployeeFieldRow` directly.
 */
const EmployeeInputFieldRow = ({
  icon,
  iconColor,
  label,
  value,
  inputValue,
  type = "text",
  max,
  highlight,
  isEditing,
  onChange,
}: EmployeeInputFieldRowProps) => (
  <EmployeeFieldRow
    icon={icon}
    iconColor={iconColor}
    label={label}
    value={value}
    dir="ltr"
    highlight={highlight}
    isEditing={isEditing}
    editElement={
      <input
        type={type}
        value={inputValue}
        onChange={onChange}
        max={max}
        className={inputClass}
        style={{ fontSize: 14 }}
        dir="ltr"
      />
    }
  />
);

export default EmployeeInputFieldRow;
