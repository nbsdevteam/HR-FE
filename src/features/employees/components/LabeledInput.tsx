import type { InputHTMLAttributes } from "react";
import { inputCls, labelCls } from "../styles";

type LabeledInputProps = {
  label: string;
  addedContainerClasses?: string;
  addedInputClasses?: string;
} & InputHTMLAttributes<HTMLInputElement>;

const LabeledInput = ({
  label,
  addedContainerClasses,
  addedInputClasses,
  ...inputProps
}: LabeledInputProps) => (
  <div className={addedContainerClasses}>
    <label className={labelCls} style={{ fontSize: 12 }}>
      {label}
    </label>
    {/* FIXED: Using template literals to properly combine class strings */}
    <input
      className={`${inputCls} ${addedInputClasses || ""}`}
      {...inputProps}
    />
  </div>
);

export default LabeledInput;
