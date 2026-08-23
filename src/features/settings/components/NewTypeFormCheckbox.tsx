import { useCallback } from "react";
import type { TypeFormCheckboxConfig } from "../types";

type NewTypeFormCheckboxProps<T> = {
  checkbox: TypeFormCheckboxConfig<T>;
  checked: boolean;
  labelClassName: string;
  inputClassName: string;
  onFieldChange: (patch: Partial<T>) => void;
};

/**
 * One config-driven boolean toggle. Owns its change handler so the checkbox row
 * can be rendered from a `.map()` without an inline arrow on `onChange`.
 */
const NewTypeFormCheckbox = <T,>({
  checkbox,
  checked,
  labelClassName,
  inputClassName,
  onFieldChange,
}: NewTypeFormCheckboxProps<T>) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      onFieldChange({ [checkbox.key]: e.target.checked } as Partial<T>);
    },
    [checkbox.key, onFieldChange],
  );

  return (
    <label className={labelClassName}>
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        className={inputClassName}
      />
      {checkbox.label}
    </label>
  );
};

export default NewTypeFormCheckbox;
