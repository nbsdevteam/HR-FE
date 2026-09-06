import * as odooData from "@/shared/api/odooData";
import { useAsyncList } from "@/shared/hooks/useAsyncList";
import type { LeaveRecord } from "../types";
import { toLeaveRecords } from "../utils/leaveMapper";

export const useEmployeeLeaves = (employeeId: string) => {
  const { data: leaves, loading: leavesLoading, error: leaveError, refetch: reloadLeaves } = useAsyncList<LeaveRecord>(
    // No `status` filter: the panel shows every state.
    async () => toLeaveRecords(await odooData.fetchLeaveRequests({ employeeId })),
    [employeeId],
    "Failed to load leaves",
    undefined,
    { cacheKey: employeeId ? `employeeLeaves:${employeeId}` : undefined, enabled: !!employeeId },
  );

  return {
    leaves,
    leavesLoading,
    leaveError,
    reloadLeaves,
  };
};
