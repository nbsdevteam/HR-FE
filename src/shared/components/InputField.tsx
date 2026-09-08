import { useCallback } from "react";
import DatePicker from "./ui/DatePicker";

interface InputFieldProps {
  /** When set, wraps the input in a labeled block; omit for a bare input. */
  label?: string;
  type?: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  className: string;
  dir?: string;
  step?: string;
  min?: number;
  max?: number;
}

/**
 * Shared labeled/bare text-or-number input field, factored out of the
 * near-identical "New X Type" settings forms that each hand-rolled the same
 * input markup independently.
 */
const InputField = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  className,
  dir,
  step,
  min,
  max,
}: InputFieldProps) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      onChange(e.target.value);
    },
    [onChange]
  );

  const input =
    type === "date" ? (
      // `className` here is a native-input box style (border/bg/rounded/height)
      // meant for the `<input>` branch below — DatePicker already carries its
      // own matching box styling on the trigger button, so forwarding it here
      // would double it up as a border around a border. Only width belongs on
      // its wrapper.
      <DatePicker value={String(value)} onChange={onChange} placeholder={placeholder} className="w-full" />
    ) : (
      <input
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
        dir={dir}
        step={step}
        min={min}
        max={max}
      />
    );

  if (!label) return input;

  return (
    <div>
      <label className="block text-foreground text-sm mb-2">{label}</label>
      {input}
    </div>
  );
};

export default InputField;
