import { arabicSource } from "@/i18n/source";
import { defaultExitTypeLabels } from "../styles/lifecycle";
import type { PublicExitSignInfo } from "../types/publicExitSign";
import ExitSettlementStatement from "./ExitSettlementStatement";
import PublicExitSignClearanceRow from "./PublicExitSignClearanceRow";

type PublicExitSignSummaryProps = {
  info: PublicExitSignInfo;
};

/** What the employee is signing: their exit details, the clearance state and the confirmed settlement. */
const PublicExitSignSummary = ({ info }: PublicExitSignSummaryProps) => (
  <div className="space-y-5">
    <div>
      <h1 className="text-foreground" style={{ fontSize: 20 }} dir="auto">{info.employeeName}</h1>
      <p className="text-muted-foreground" style={{ fontSize: 13 }}>
        {defaultExitTypeLabels[info.exitType] ?? info.exitType}
        {info.exitDate && <> · {arabicSource("public_exit_sign.exit_date")}: <span dir="ltr">{info.exitDate}</span></>}
        {info.lastWorkingDay && <> · {arabicSource("common.last_working_day")}: <span dir="ltr">{info.lastWorkingDay}</span></>}
      </p>
    </div>
    {info.clearance.length > 0 && (
      <section>
        <h2 className="text-foreground mb-2" style={{ fontSize: 14 }}>{arabicSource("public_exit_sign.clearance_title")}</h2>
        <ul className="space-y-1">
          {info.clearance.map((line, index) => (
            <PublicExitSignClearanceRow key={`${line.item}-${index}`} line={line} />
          ))}
        </ul>
      </section>
    )}
    {info.settlement && (
      <section>
        <h2 className="text-foreground mb-2" style={{ fontSize: 14 }}>{arabicSource("lifecycle.exit_settlement_title")}</h2>
        <ExitSettlementStatement statement={info.settlement} />
      </section>
    )}
  </div>
);

export default PublicExitSignSummary;
