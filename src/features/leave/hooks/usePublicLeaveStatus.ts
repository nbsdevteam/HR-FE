import { useCallback, useState } from "react";
import { fetchPublicLeaveStatus } from "../api/publicLeaveApi";
import type { PublicLeaveStatusResult } from "../types/publicLeave";

export const usePublicLeaveStatus = (token: string) => {
  const [statuses, setStatuses] = useState<PublicLeaveStatusResult[] | null>(null);

  const load = useCallback(async (employeeId: number, verification: string | undefined) => {
    const data = await fetchPublicLeaveStatus({
      token,
      employee_id: employeeId,
      ...(verification !== undefined ? { verification } : {}),
    });
    setStatuses(data);
    return data;
  }, [token]);

  const reset = useCallback(() => {
    setStatuses(null);
  }, []);

  return { load, reset, statuses };
};
