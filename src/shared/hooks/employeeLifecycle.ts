import { useQuery } from "@tanstack/react-query";
import * as odooData from "@/shared/api/odooData";
import { STALE_TIME } from "@/shared/api/queryClient";
import type { EmployeeLifecycleSummary } from "./employeeLifecycleTypes";

export type {
  EmployeeLifecycleSummary,
  LifecycleContract,
  LifecycleExit,
  LifecycleTimelineEntry,
} from "./employeeLifecycleTypes";

/** Query key prefix — a mutation that changes contract or exit state invalidates this. */
export const EMPLOYEE_LIFECYCLE_KEY = "employeeLifecycle";

/**
 * The lifecycle summary behind the profile's Life cycle tab. Contract and exit
 * status are the backend's to change (expiry, End of Service completion), so a
 * mutation refreshes this instead of patching the status locally.
 */
export const useEmployeeLifecycle = (employeeId: string | undefined, enabled = true) => {
  const query = useQuery<EmployeeLifecycleSummary, Error>({
    queryKey: [EMPLOYEE_LIFECYCLE_KEY, employeeId],
    queryFn: () => odooData.fetchEmployeeLifecycle(employeeId as string),
    enabled: enabled && Boolean(employeeId),
    staleTime: STALE_TIME.SHORT,
    refetchOnWindowFocus: true,
  });
  return {
    summary: query.data ?? null,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
