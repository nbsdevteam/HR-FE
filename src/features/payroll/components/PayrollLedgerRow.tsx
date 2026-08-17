import type { ComponentType } from "react";
import { formatCurrency } from "@/features/payroll";

type PayrollLedgerRowProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  icon: ComponentType<{ className?: string }>;
  isCredit: boolean;
  color: string;
  otherVal: number;
  otherCurrency: "IQD" | "USD";
  editing: boolean;
  currency: "IQD" | "USD";
};

const PayrollLedgerRow = ({ label, value, onChange, icon: Icon, isCredit, color, otherVal, otherCurrency, editing, currency }: PayrollLedgerRowProps) => (
  <div className="flex items-center justify-between py-2.5 border-b border-border/15">
    <span className={`${color} flex items-center gap-2`} style={{ fontSize: 14 }}>
      <Icon className="w-4 h-4" />
      {label}
    </span>
    <div className="flex items-center gap-3">
      {!editing && otherVal > 0 && (
        <span className="text-muted-foreground/50" style={{ fontSize: 11 }} dir="ltr">
          {isCredit ? "+" : "-"}{formatCurrency(otherVal, otherCurrency)}
        </span>
      )}
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={value || ""}
            onChange={(e) => onChange(Number(e.target.value) || 0)}
            className="w-32 h-8 px-3 rounded-lg border border-border bg-input-background text-foreground text-end outline-none focus:ring-2 focus:ring-ring"
            style={{ fontSize: 13 }}
            dir="ltr"
            min={0}
            placeholder="0"
          />
          <span className="text-muted-foreground" style={{ fontSize: 11 }}>{currency}</span>
        </div>
      ) : (
        <span className={color} style={{ fontSize: 14 }} dir="ltr">
          {value > 0 ? `${isCredit ? "+" : "-"}${formatCurrency(value, currency)}` : "—"}
        </span>
      )}
    </div>
  </div>
);

export default PayrollLedgerRow;
