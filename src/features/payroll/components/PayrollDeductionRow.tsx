import { Minus } from "lucide-react";
import { formatCurrency } from "@/features/payroll";

type PayrollDeductionRowProps = {
  name: string;
  amount: number;
  currency: string;
};

const PayrollDeductionRow = ({ name, amount, currency }: PayrollDeductionRowProps) => (
  <div className="flex items-center justify-between py-2 ps-4 border-b border-border/10">
    <span className="text-orange-400 flex items-center gap-2" style={{ fontSize: 13 }}>
      <Minus className="w-3.5 h-3.5" />
      {name}
    </span>
    <span className="text-destructive" style={{ fontSize: 13 }} dir="ltr">-{formatCurrency(amount, currency)}</span>
  </div>
);

export default PayrollDeductionRow;
