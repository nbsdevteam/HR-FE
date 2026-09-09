import { useCallback } from "react";
import { PositiveNumberInput } from "@/shared/components";

type PublicApplyInputProps = {
  value: string;
  onChange: (value: string) => void;
  type?: string;
  dir?: string;
};

const inputClass =
  "w-full px-4 py-3 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none";

const PublicApplyInput = ({ value, onChange, type = "text", dir }: PublicApplyInputProps) => {
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => onChange(event.target.value),
    [onChange],
  );

  if (type === "number") {
    return (
      <PositiveNumberInput
        value={value}
        onChange={onChange}
        dir={dir}
        className={inputClass}
        style={{ fontSize: 14 }}
      />
    );
  }

  return (
    <input
      type={type}
      value={value}
      dir={dir}
      onChange={handleChange}
      className={inputClass}
      style={{ fontSize: 14 }}
    />
  );
};

export default PublicApplyInput;
