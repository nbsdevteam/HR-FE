import type { ComponentType, ChangeEvent } from "react";
import FieldLabel from "./FieldLabel";

type LabeledTextFieldProps = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  errorMessage?: string;
  accentColorClassName?: string;
  focusBorderClassName?: string;
};

const LabeledTextField = ({
  icon,
  label,
  value,
  onChange,
  placeholder,
  error = false,
  errorMessage,
  accentColorClassName = "text-primary",
  focusBorderClassName = "focus:border-primary/50",
}: LabeledTextFieldProps) => {
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    onChange(e.target.value);
  };

  return (
    <div>
      <FieldLabel icon={icon} accentColorClassName={accentColorClassName}>{label}</FieldLabel>
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={`w-full bg-background border rounded-lg px-3 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none ${focusBorderClassName} transition-colors ${error ? "border-red-500" : "border-border/60"}`}
        style={{ fontSize: 13 }}
      />
      {error && errorMessage && <p className="text-red-400 mt-1" style={{ fontSize: 11 }}>{errorMessage}</p>}
    </div>
  );
};

export default LabeledTextField;
