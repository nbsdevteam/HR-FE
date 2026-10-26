import { memo } from "react";
import { formatNumber } from "@/i18n/format";
import { arabicSource } from "@/i18n/source";

type ExitSettlementTotalRowProps = {
  currency: string;
  amount: number;
};

/** One currency's total; amounts are never converted between currencies. */
const ExitSettlementTotalRow = ({ currency, amount }: ExitSettlementTotalRowProps) => (
  <tr className="border-t border-border/40" data-settlement-total={currency}>
    <td className="px-3 py-2 text-foreground" style={{ fontSize: 13 }}>{arabicSource("lifecycle.exit_settlement_total")}</td>
    <td className="px-3 py-2 text-end text-gradient-gold" style={{ fontSize: 15 }} dir="ltr">
      {formatNumber(amount)} {currency}
    </td>
  </tr>
);

export default memo(ExitSettlementTotalRow);
