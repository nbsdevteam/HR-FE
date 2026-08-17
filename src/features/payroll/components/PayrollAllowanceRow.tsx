import { Plus } from "lucide-react";
import { formatCurrency } from "@/features/payroll";

type PayrollAllowanceRowProps = {
  name: string;
  amount: number;
  currency: string;
};

const PayrollAllowanceRow = ({ name, amount, currency }: PayrollAllowanceRowProps) => (
  <div className="flex items-center justify-between py-2 ps-4 border-b border-border/10">
    <span className="text-emerald-400 flex items-center gap-2" style={{ fontSize: 13 }}>
      <Plus className="w-3.5 h-3.5" />
      {name}
    </span>
    <span className="text-emerald-400" style={{ fontSize: 13 }} dir="ltr">+{formatCurrency(amount, currency)}</span>
  </div>
);

export default PayrollAllowanceRow;
