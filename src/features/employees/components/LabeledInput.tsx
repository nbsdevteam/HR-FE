import type { InputHTMLAttributes } from "react";
import { inputCls, labelCls } from "../styles";

type LabeledInputProps = {
  label: string;
} & InputHTMLAttributes<HTMLInputElement>;

const LabeledInput = ({ label, ...inputProps }: LabeledInputProps) => (
  <div>
    <label className={labelCls} style={{ fontSize: 12 }}>{label}</label>
    <input className={inputCls} {...inputProps} />
  </div>
);

export default LabeledInput;
