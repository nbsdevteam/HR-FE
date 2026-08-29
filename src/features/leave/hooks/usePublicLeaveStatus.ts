import { useCallback, useState } from "react";
import { fetchPublicLeaveStatus } from "../api/publicLeaveApi";
import type { PublicLeaveStatusResult } from "../types/publicLeave";

export const usePublicLeaveStatus = (token: string) => {
  const [referenceCode, setReferenceCode] = useState("");
  const [status, setStatus] = useState<PublicLeaveStatusResult | null>(null);

  const load = useCallback(async (employeeId: number, verification: string | undefined) => {
    const data = await fetchPublicLeaveStatus({
      token,
      employee_id: employeeId,
      ...(verification !== undefined ? { verification } : {}),
      reference_code: referenceCode.trim(),
    });
    setStatus(data);
    return data;
  }, [referenceCode, token]);

  const reset = useCallback(() => {
    setReferenceCode("");
    setStatus(null);
  }, []);

  return { load, referenceCode, reset, setReferenceCode, status };
};
