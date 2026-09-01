import type { InputHTMLAttributes } from "react";
import { inputCls, labelCls } from "../styles";

type LabeledInputProps = {
  label: string;
  addedContainerClasses?: string;
  addedInputClasses?: string;
  /** Field-level rejection message, rendered under the input. */
  error?: string | null;
} & InputHTMLAttributes<HTMLInputElement>;

const LabeledInput = ({
  label,
  addedContainerClasses,
  addedInputClasses,
  error,
  ...inputProps
}: LabeledInputProps) => (
  <div className={addedContainerClasses}>
    <label className={labelCls} style={{ fontSize: 12 }}>
      {label}
    </label>
    {/* FIXED: Using template literals to properly combine class strings */}
    <input
      className={`${inputCls} ${addedInputClasses || ""} ${error ? "border-destructive" : ""}`}
      aria-invalid={error ? true : undefined}
      {...inputProps}
    />
    {error && (
      <p className="text-destructive mt-1" style={{ fontSize: 11 }}>
        {error}
      </p>
    )}
  </div>
);

export default LabeledInput;
