import type { ReactNode, SelectHTMLAttributes } from "react";
import { labelCls, selectCls } from "../styles";

type LabeledSelectProps = {
  label: string;
  children: ReactNode;
} & SelectHTMLAttributes<HTMLSelectElement>;

const LabeledSelect = ({ label, children, ...selectProps }: LabeledSelectProps) => (
  <div>
    <label className={labelCls} style={{ fontSize: 12 }}>{label}</label>
    <select className={selectCls} {...selectProps}>{children}</select>
  </div>
);

export default LabeledSelect;
