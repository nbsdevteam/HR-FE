import { useCallback, useState } from "react";
import * as odooData from "@/shared/api/odooData";
import { arabicSource } from "@/i18n/source";

/**
 * `next_id` — the employee-code allocator, unrelated to the Hikvision device
 * number. Odoo allocates the device number itself on create and returns it in
 * the response; the SPA never fetches, computes or sends one (hand-off §1/§2).
 * No client-side fallback on a failed fetch — a failure surfaces via
 * `onFetchError` and leaves the number `null`, so the caller's submit guard
 * blocks Add.
 */
export const useNextEmployeeCode = (onFetchError: (message: string) => void) => {
  const [nextEmployeeId, setNextEmployeeId] = useState<number | null>(null);
  const [loadingNextId, setLoadingNextId] = useState(false);

  const fetchNextId = useCallback(async () => {
    setLoadingNextId(true);
    try {
      const data = await odooData.fetchNextEmployeeCode();
      setNextEmployeeId(data?.next_id ?? null);
    } catch {
      setNextEmployeeId(null);
      onFetchError(arabicSource("employees.employee_number_not_specified"));
    }
    setLoadingNextId(false);
  }, [onFetchError]);

  const resetNextId = useCallback(() => {
    setNextEmployeeId(null);
  }, []);

  return {
    nextEmployeeId,
    loadingNextId,
    fetchNextId,
    resetNextId,
  };
};
