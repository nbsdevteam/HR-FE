import { memo, useCallback } from "react";
import { Button } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { DbLeaveRequest } from "@/shared/hooks";

type LeaveExcuseFollowUpControlProps = {
  leave: DbLeaveRequest;
  onFollowUp: (leave: DbLeaveRequest) => void;
};

/**
 * Shown in place of the ordinary Approve/Reject/Delete actions while a
 * leave's manager-excuse request is pending (backend v1.16.0 §5) — those
 * buttons hit the wrong endpoints for this state (the plain refuse/approve
 * calls never fire on a pending excuse request).
 */
const LeaveExcuseFollowUpControl = ({ leave, onFollowUp }: LeaveExcuseFollowUpControlProps) => {
  const handleClick = useCallback(() => onFollowUp(leave), [onFollowUp, leave]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground" style={{ fontSize: 11 }} dir="ltr">
        {leave.excuse.followup_count}/{leave.excuse.followup_max}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={leave.excuse.followup_remaining <= 0}
      >
        {arabicSource("leave.excuse_follow_up")}
      </Button>
    </div>
  );
};

export default memo(LeaveExcuseFollowUpControl);
