import { memo } from "react";
import { Info } from "lucide-react";
import { arabicSource } from "@/i18n/source";

/**
 * The benefits and final settlement amounts are typed in, not computed by the
 * server (that arrives with a later phase) — so they are labelled as such
 * rather than presented as a verified calculation.
 */
const ExitSettlementDisclaimer = () => (
  <p className="flex items-center gap-1.5 text-muted-foreground" style={{ fontSize: 12 }} data-exit-settlement-disclaimer>
    <Info className="w-3.5 h-3.5 shrink-0" />
    {arabicSource("lifecycle.exit_settlement_unverified")}
  </p>
);

export default memo(ExitSettlementDisclaimer);
