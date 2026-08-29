import type { ReactNode } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import type { TypeFormCheckboxConfig, TypeFormRowConfig } from "../types";
import NewTypeFormCheckbox from "./NewTypeFormCheckbox";
import NewTypeFormRow from "./NewTypeFormRow";

type NewTypeFormProps<T> = {
  form: T;
  rows: TypeFormRowConfig<T>[];
  checkboxes?: TypeFormCheckboxConfig<T>[];
  onFieldChange: (patch: Partial<T>) => void;
  footer: ReactNode;
  /** Rendered inside the checkbox row (selects, colour pickers, …). */
  extraControls?: ReactNode;
  containerClassName?: string;
  inputClassName?: string;
  checkboxRowClassName?: string;
  checkboxLabelClassName?: string;
  checkboxInputClassName?: string;
  motionProps?: HTMLMotionProps<"div">;
};

const DEFAULT_CONTAINER =
  "mb-4 p-4 rounded-lg bg-muted/20 border border-border/30 space-y-3";
const DEFAULT_INPUT =
  "p-2 rounded-lg bg-input border border-border/50 text-foreground text-sm";
const DEFAULT_CHECKBOX_ROW = "flex items-center gap-6";
const DEFAULT_CHECKBOX_LABEL =
  "flex items-center gap-2 text-sm text-muted-foreground";
const DEFAULT_CHECKBOX_INPUT = "accent-primary";

/**
 * Shared "New X Type" settings form. The contract-type, document-type and
 * leave-type forms were three copies of the same shape — grid rows of inputs, a
 * row of checkboxes, then an action footer — differing only in which fields
 * they list and how they are skinned. They now all drive this one component
 * from a field config, so a change to the shape happens in one place.
 */
const NewTypeForm = <T,>({
  form,
  rows,
  checkboxes,
  onFieldChange,
  footer,
  extraControls,
  containerClassName = DEFAULT_CONTAINER,
  inputClassName = DEFAULT_INPUT,
  checkboxRowClassName = DEFAULT_CHECKBOX_ROW,
  checkboxLabelClassName = DEFAULT_CHECKBOX_LABEL,
  checkboxInputClassName = DEFAULT_CHECKBOX_INPUT,
  motionProps,
}: NewTypeFormProps<T>) => (
  <motion.div {...motionProps} className={containerClassName}>
    {rows.map((row) => (
      <NewTypeFormRow
        key={row.id}
        row={row}
        form={form}
        inputClassName={inputClassName}
        onFieldChange={onFieldChange}
      />
    ))}

    {(checkboxes?.length || extraControls) && (
      <div className={checkboxRowClassName}>
        {checkboxes?.map((checkbox) => (
          <NewTypeFormCheckbox
            key={checkbox.key}
            checkbox={checkbox}
            checked={Boolean(form[checkbox.key])}
            labelClassName={checkboxLabelClassName}
            inputClassName={checkboxInputClassName}
            onFieldChange={onFieldChange}
          />
        ))}
        {extraControls}
      </div>
    )}

    {footer}
  </motion.div>
);

export default NewTypeForm;
