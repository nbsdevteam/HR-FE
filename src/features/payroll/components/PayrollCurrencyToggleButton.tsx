import { memo } from "react";

type PayrollCurrencyToggleButtonProps = {
  currency: "IQD" | "USD";
  isActive: boolean;
  onSelect: (currency: "IQD" | "USD") => void;
};

const PayrollCurrencyToggleButton = ({ currency, isActive, onSelect }: PayrollCurrencyToggleButtonProps) => (
  <button
    onClick={() => onSelect(currency)}
    className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
      isActive
        ? "bg-primary text-primary-foreground shadow-sm"
        : "text-muted-foreground hover:text-foreground"
    }`}
    style={{ fontSize: 12 }}
  >
    {currency}
  </button>
);

export default memo(PayrollCurrencyToggleButton);
