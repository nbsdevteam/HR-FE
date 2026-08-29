import { Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { formatCurrency } from "@/shared/utils/currency";

type PayrollDeductionRowProps = {
  name: ReactNode;
  amount: number;
  currency: string;
  icon?: LucideIcon | null;
  labelColorClassName?: string;
};

const PayrollDeductionRow = ({ name, amount, currency, icon: Icon = Minus, labelColorClassName = "text-orange-400" }: PayrollDeductionRowProps) => (
  <div className="flex items-center justify-between py-2 ps-4 border-b border-border/10">
    <span className={`${labelColorClassName} ${Icon ? "flex items-center gap-2" : ""}`} style={{ fontSize: 13 }}>
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {name}
    </span>
    <span className="text-destructive" style={{ fontSize: 13 }} dir="ltr">-{formatCurrency(amount, currency)}</span>
  </div>
);

export default PayrollDeductionRow;
