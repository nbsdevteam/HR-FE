import { memo } from "react";

type IrPenaltyRowProps = {
  detail: string;
  amount: number;
};

const IrPenaltyRow = ({ detail, amount }: IrPenaltyRowProps) => (
  <div className="flex items-start justify-between gap-3 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2">
    <span className="text-muted-foreground" style={{ fontSize: 11.5 }} data-i18n-ignore>{detail}</span>
    <span className="text-destructive flex-shrink-0" style={{ fontSize: 11.5 }} dir="ltr">−{amount}</span>
  </div>
);

export default IrPenaltyRow;
