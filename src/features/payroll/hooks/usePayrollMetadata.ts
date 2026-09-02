import { useCallback, useEffect, useRef, useState } from "react";
import { fetchPayrollMetadata } from "@/shared/api/payroll";
import type { PayrollMetadataResponse } from "@/shared/api/payrollTypes";
import { errorMessage } from "../utils/errorMessage";

/**
 * Session-cached across every mount of the Salary page — metadata is
 * departments/shifts/allowance types/deduction types/leave types/configs,
 * safe to reuse until a settings/shift/department/allowance-type change
 * (backend §5). Module-level so switching tabs and coming back doesn't
 * refire it.
 */
let cachedMetadata: PayrollMetadataResponse | null = null;
let inflightRequest: Promise<PayrollMetadataResponse> | null = null;

const loadMetadata = (force: boolean): Promise<PayrollMetadataResponse> => {
  if (!force && cachedMetadata) return Promise.resolve(cachedMetadata);
  if (!force && inflightRequest) return inflightRequest;
  inflightRequest = fetchPayrollMetadata()
    .then((data) => {
      cachedMetadata = data;
      inflightRequest = null;
      return data;
    })
    .catch((e: unknown) => {
      inflightRequest = null;
      throw e;
    });
  return inflightRequest;
};

export const usePayrollMetadata = () => {
  const [metadata, setMetadata] = useState<PayrollMetadataResponse | null>(cachedMetadata);
  const [loading, setLoading] = useState(!cachedMetadata);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);

  const load = useCallback((force: boolean): void => {
    setLoading(true);
    loadMetadata(force)
      .then((data) => {
        if (!mountedRef.current) return;
        setMetadata(data);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!mountedRef.current) return;
        setError(errorMessage(e));
      })
      .finally(() => {
        if (mountedRef.current) setLoading(false);
      });
  }, []);

  const refetch = useCallback((): void => load(true), [load]);

  useEffect(() => {
    mountedRef.current = true;
    load(false);
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { metadata, loading, error, refetch };
};
