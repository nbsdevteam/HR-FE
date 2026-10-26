import { memo, useCallback } from "react";
import type { CustodyStatus } from "../types";
import { CUSTODY_STATUS_KEYS, custodyStatusLabels } from "../utils/custodyStatus";

type ExitCustodyStatusSelectProps = {
  custodyId: string;
  disabled: boolean;
  onChange: (custodyId: string, status: CustodyStatus) => void;
};

/** What a leaving employee's open custody item can become; the item itself is still active, so it shows that until chosen. */
const SETTLED_STATUSES = CUSTODY_STATUS_KEYS.filter(status => status !== "active");

/** The Custodies tab's status dropdown, on the custody row: record it returned, damaged or lost. */
const ExitCustodyStatusSelect = ({ custodyId, disabled, onChange }: ExitCustodyStatusSelectProps) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>): void => {
    onChange(custodyId, e.target.value as CustodyStatus);
  }, [custodyId, onChange]);

  return (
    <select
      value=""
      onChange={handleChange}
      disabled={disabled}
      aria-label={custodyStatusLabels.active}
      className="h-8 w-auto px-2 rounded-lg border border-border bg-input-background text-foreground"
      style={{ fontSize: 12 }}
      data-exit-custody-status={custodyId}
    >
      <option value="" disabled>{custodyStatusLabels.active}</option>
      {SETTLED_STATUSES.map(status => (
        <option key={status} value={status}>{custodyStatusLabels[status]}</option>
      ))}
    </select>
  );
};

export default memo(ExitCustodyStatusSelect);
