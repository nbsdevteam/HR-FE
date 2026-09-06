import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { fetchPublicLeaveBalances } from "../api/publicLeaveApi";
import type { PublicLeaveBalances } from "../types/publicLeave";

interface LoadBalancesVars {
  employeeId: number;
  verification?: string;
}

/**
 * Loaded on demand once identity is confirmed (see `usePublicLeaveVerification`),
 * not on mount — modeled as a mutation rather than a query since there's no
 * caching/sharing benefit for a value only ever read once per wizard session.
 */
export const usePublicLeaveBalances = (token: string) => {
  const mutation = useMutation<PublicLeaveBalances, Error, LoadBalancesVars>({
    mutationFn: ({ employeeId, verification }) => fetchPublicLeaveBalances(token, employeeId, verification),
    retry: false,
  });

  const load = useCallback((employeeId: number, verification?: string) => {
    return mutation.mutateAsync({ employeeId, verification });
  }, [mutation.mutateAsync]);

  const reset = useCallback(() => {
    mutation.reset();
  }, [mutation.reset]);

  return { balances: mutation.data ?? null, load, loading: mutation.isPending, reset };
};
