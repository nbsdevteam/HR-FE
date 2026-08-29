import { useCallback, useState } from "react";
import { fetchPublicLeaveBalances } from "../api/publicLeaveApi";
import type { PublicLeaveBalances } from "../types/publicLeave";

export const usePublicLeaveBalances = (token: string) => {
  const [balances, setBalances] = useState<PublicLeaveBalances | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (employeeId: number, verification?: string) => {
    setLoading(true);
    try {
      const data = await fetchPublicLeaveBalances(token, employeeId, verification);
      setBalances(data);
      return data;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const reset = useCallback(() => {
    setBalances(null);
  }, []);

  return { balances, load, loading, reset };
};
