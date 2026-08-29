import type { ComponentType } from "react";
import { payrollCardClass as cardCls } from "../styles";

type PayrollSummaryChipProps = {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
  active?: boolean;
  onClick?: () => void;
};

const PayrollSummaryChip = ({ label, value, icon: Icon, color, active, onClick }: PayrollSummaryChipProps) => (
  <button
    onClick={onClick}
    disabled={!onClick}
    className={`${cardCls} p-4 text-start ${onClick ? "hover:border-primary/40 cursor-pointer" : ""} ${active ? "border-primary/40 bg-primary/5" : ""}`}
  >
    <div className="flex items-center gap-2 mb-1">
      <Icon className={`w-4 h-4 ${color}`} />
      <span className="text-muted-foreground" style={{ fontSize: 11 }}>{label}</span>
    </div>
    <span className={color} style={{ fontSize: 18 }}>{value}</span>
  </button>
);

export default PayrollSummaryChip;
