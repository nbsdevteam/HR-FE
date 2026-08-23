import type { TypeFormRowConfig } from "../types";
import NewTypeFormField from "./NewTypeFormField";

type NewTypeFormRowProps<T> = {
  row: TypeFormRowConfig<T>;
  form: T;
  inputClassName: string;
  onFieldChange: (patch: Partial<T>) => void;
};

const NewTypeFormRow = <T,>({
  row,
  form,
  inputClassName,
  onFieldChange,
}: NewTypeFormRowProps<T>) => (
  <div className={row.gridClassName}>
    {row.fields.map((field) => (
      <NewTypeFormField
        key={field.key}
        field={field}
        value={form[field.key] as string | number}
        inputClassName={inputClassName}
        onFieldChange={onFieldChange}
      />
    ))}
  </div>
);

export default NewTypeFormRow;
