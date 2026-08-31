import { TypeAhead } from "@/shared/components";

const fieldLabelClass = "text-foreground block mb-1.5";

type EmployeeTypeAheadFieldProps<T> = {
  label: string;
  items: T[];
  getId: (item: T) => string;
  getLabel: (item: T) => string;
  value: string;
  placeholder: string;
  /** Field-level rejection from the backend, rendered under the input. */
  error?: string | null;
  onChange: (value: string) => void;
};

/**
 * Labelled type-ahead picker with room for a field-level error underneath —
 * used for the two foreign-key dropdowns (department, job title) whose ids the
 * backend validates and can reject on save (backend §4).
 */
const EmployeeTypeAheadField = <T,>({
  label,
  items,
  getId,
  getLabel,
  value,
  placeholder,
  error = null,
  onChange,
}: EmployeeTypeAheadFieldProps<T>) => (
  <div>
    <label className={fieldLabelClass} style={{ fontSize: 12 }}>
      {label}
    </label>
    <TypeAhead
      items={items}
      getId={getId}
      getLabel={getLabel}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
    {error && (
      <p className="text-destructive mt-1" style={{ fontSize: 11 }} role="alert">
        {error}
      </p>
    )}
  </div>
);

export default EmployeeTypeAheadField;
