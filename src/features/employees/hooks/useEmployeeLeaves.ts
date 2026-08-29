import { useState, useCallback, useEffect } from "react";
import * as odooData from "@/shared/api/odooData";
import type { LeaveRecord } from "../types";
import { toLeaveRecords } from "../utils/leaveMapper";
import { errorMessage } from "../utils/errorMessage";

export const useEmployeeLeaves = (employeeId: string) => {
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [leavesLoading, setLeavesLoading] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  const reloadLeaves = useCallback(async () => {
    if (!employeeId) return;
    setLeavesLoading(true);
    setLeaveError(null);
    try {
      // No `status` filter: the panel shows every state.
      const rows = await odooData.fetchLeaveRequests({ employeeId });
      setLeaves(toLeaveRecords(rows));
    } catch (e: unknown) {
      setLeaveError(errorMessage(e));
    } finally {
      setLeavesLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    reloadLeaves();
  }, [reloadLeaves]);

  return {
    leaves,
    leavesLoading,
    leaveError,
    reloadLeaves,
  };
};
