import type { ReactNode, SelectHTMLAttributes } from "react";
import { dashedRecordInputClass } from "./DashedAddRecordCard";

type DashedRecordSelectFieldProps = {
  label: string;
  children: ReactNode;
} & SelectHTMLAttributes<HTMLSelectElement>;

const DashedRecordSelectField = ({ label, children, ...selectProps }: DashedRecordSelectFieldProps) => (
  <div>
    <label className="text-muted-foreground block mb-1" style={{ fontSize: 11 }}>{label}</label>
    <select className={dashedRecordInputClass} style={{ fontSize: 13 }} {...selectProps}>{children}</select>
  </div>
);

export default DashedRecordSelectField;
