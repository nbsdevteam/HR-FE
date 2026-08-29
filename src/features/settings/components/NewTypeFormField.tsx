import { useCallback } from "react";
import { InputField } from "@/shared/components";
import type { TypeFormFieldConfig } from "../types";

type NewTypeFormFieldProps<T> = {
  field: TypeFormFieldConfig<T>;
  value: string | number;
  inputClassName: string;
  onFieldChange: (patch: Partial<T>) => void;
};

/**
 * One config-driven input. Owns its own change handler so `NewTypeFormRow` can
 * render fields from a `.map()` without an inline arrow on `onChange`.
 */
const NewTypeFormField = <T,>({
  field,
  value,
  inputClassName,
  onFieldChange,
}: NewTypeFormFieldProps<T>) => {
  const handleChange = useCallback(
    (next: string): void => {
      onFieldChange({
        [field.key]: field.type === "number" ? Number(next) : next,
      } as Partial<T>);
    },
    [field.key, field.type, onFieldChange],
  );

  return (
    <InputField
      type={field.type}
      value={field.blankWhenFalsy && !value ? "" : value}
      onChange={handleChange}
      placeholder={field.placeholder}
      className={inputClassName}
      dir={field.dir}
    />
  );
};

export default NewTypeFormField;
