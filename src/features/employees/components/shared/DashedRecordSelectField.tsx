import type { SelectHTMLAttributes } from "react";
import { dashedRecordInputClass } from "./DashedAddRecordCard";
import SelectOptionElement from "./SelectOptionElement";

type DashedRecordSelectOption = { value: string; label: string };

type DashedRecordSelectFieldProps = {
  label: string;
  options: readonly DashedRecordSelectOption[];
} & SelectHTMLAttributes<HTMLSelectElement>;

const DashedRecordSelectField = ({ label, options, ...selectProps }: DashedRecordSelectFieldProps) => (
  <div>
    <label className="text-muted-foreground block mb-1" style={{ fontSize: 11 }}>{label}</label>
    <select className={dashedRecordInputClass} style={{ fontSize: 13 }} {...selectProps}>
      {options.map((opt) => (
        <SelectOptionElement key={opt.value} value={opt.value} label={opt.label} />
      ))}
    </select>
  </div>
);

export default DashedRecordSelectField;
