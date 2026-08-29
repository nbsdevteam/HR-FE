import type { InputHTMLAttributes } from "react";
import { dashedRecordInputClass } from "./DashedAddRecordCard";

type DashedRecordFieldProps = {
  label: string;
} & InputHTMLAttributes<HTMLInputElement>;

const DashedRecordField = ({ label, ...inputProps }: DashedRecordFieldProps) => (
  <div>
    <label className="text-muted-foreground block mb-1" style={{ fontSize: 11 }}>{label}</label>
    <input className={dashedRecordInputClass} style={{ fontSize: 13 }} {...inputProps} />
  </div>
);

export default DashedRecordField;
