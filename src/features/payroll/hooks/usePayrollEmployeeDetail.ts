import { useCallback, useEffect, useRef, useState } from "react";
import { fetchPayrollEmployeeDetail } from "@/shared/api/payroll";
import type { PayrollEmployeeDetailResponse } from "@/shared/api/payrollTypes";
import { errorMessage } from "../utils/errorMessage";

/**
 * Lazy per-employee payroll breakdown (backend §6/§13) — fetched only while
 * the detail panel is open, on `(employeeId, month)` change. Invalidate with
 * `refetch()` after a ledger save, an excuse toggle, or a payslip generation.
 */
export const usePayrollEmployeeDetail = (employeeId: string | null, month: string) => {
  const [detail, setDetail] = useState<PayrollEmployeeDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestRef = useRef(0);

  const load = useCallback((): void => {
    if (!employeeId || !month) {
      setDetail(null);
      setError(null);
      setLoading(false);
      return;
    }
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setLoading(true);
    fetchPayrollEmployeeDetail(employeeId, month)
      .then((data) => {
        if (requestRef.current !== requestId) return;
        setDetail(data);
        setError(null);
      })
      .catch((e: unknown) => {
        if (requestRef.current !== requestId) return;
        setDetail(null);
        setError(errorMessage(e));
      })
      .finally(() => {
        if (requestRef.current === requestId) setLoading(false);
      });
  }, [employeeId, month]);

  useEffect(() => {
    load();
  }, [load]);

  return { detail, detailLoading: loading, detailError: error, refetchDetail: load };
};
