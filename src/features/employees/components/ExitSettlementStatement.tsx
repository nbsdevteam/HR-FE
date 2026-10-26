import { memo } from "react";
import type { ExitSettlement } from "@/shared/hooks";
import ExitSettlementLineRow from "./ExitSettlementLineRow";
import ExitSettlementTotalRow from "./ExitSettlementTotalRow";
import ExitSettlementWarningNote from "./ExitSettlementWarningNote";

type ExitSettlementStatementProps = {
  statement: ExitSettlement;
};

/** The lines, the per-currency totals and any warnings, exactly as the server calculated them. */
const ExitSettlementStatement = ({ statement }: ExitSettlementStatementProps) => (
  <div className="space-y-3">
    <table className="w-full">
      <tbody>
        {statement.lines.map((line, index) => (
          <ExitSettlementLineRow key={`${line.code}-${index}`} line={line} />
        ))}
      </tbody>
      <tfoot>
        {Object.entries(statement.totals).map(([currency, amount]) => (
          <ExitSettlementTotalRow key={currency} currency={currency} amount={amount} />
        ))}
      </tfoot>
    </table>
    {statement.warnings.map(warning => (
      <ExitSettlementWarningNote key={`${warning.code}-${warning.custody_id ?? ""}`} warning={warning} />
    ))}
  </div>
);

export default memo(ExitSettlementStatement);
