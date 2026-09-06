import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { fetchPublicLeaveStatus } from "../api/publicLeaveApi";
import type { PublicLeaveStatusResult } from "../types/publicLeave";

interface LoadStatusVars {
  employeeId: number;
  verification: string | undefined;
}

/** Loaded on demand once identity is confirmed — see `usePublicLeaveBalances`. */
export const usePublicLeaveStatus = (token: string) => {
  const mutation = useMutation<PublicLeaveStatusResult[], Error, LoadStatusVars>({
    mutationFn: ({ employeeId, verification }) =>
      fetchPublicLeaveStatus({
        token,
        employee_id: employeeId,
        ...(verification !== undefined ? { verification } : {}),
      }),
    retry: false,
  });

  const load = useCallback((employeeId: number, verification: string | undefined) => {
    return mutation.mutateAsync({ employeeId, verification });
  }, [mutation.mutateAsync]);

  const reset = useCallback(() => {
    mutation.reset();
  }, [mutation.reset]);

  return { load, reset, statuses: mutation.data ?? null };
};
