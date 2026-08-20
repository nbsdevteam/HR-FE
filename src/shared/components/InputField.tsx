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
}: InputFieldProps) => {
  const input = (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
      dir={dir}
      step={step}
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
