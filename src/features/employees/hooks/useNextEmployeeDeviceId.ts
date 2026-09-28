import { useCallback, useState } from "react";
import * as odooData from "@/shared/api/odooData";
import { arabicSource } from "@/i18n/source";

/**
 * The two numbers `next_code` allocates for a not-yet-created employee:
 * `nextEmployeeId` (`next_id`, the employee-code allocator) and `nextDeviceNo`
 * (`next_device_no`, the Hikvision terminal's own sequence). They diverge
 * once either one is taken by another concurrent create, so both are held
 * independently rather than one being derived from the other (Hikvision
 * employee-number hand-off §1). No client-side fallback on a failed fetch —
 * `MAX(person_id) + 1` can hand out a number already retired to a leaver
 * (hand-off §3.2/audit B.1) — a failure surfaces via `onFetchError` instead
 * and leaves both numbers `null`, so the caller's submit guard blocks Add.
 */
export const useNextEmployeeDeviceId = (onFetchError: (message: string) => void) => {
  const [nextEmployeeId, setNextEmployeeId] = useState<number | null>(null);
  const [nextDeviceNo, setNextDeviceNo] = useState<number | string | null>(null);
  const [loadingNextId, setLoadingNextId] = useState(false);

  const fetchNextId = useCallback(async () => {
    setLoadingNextId(true);
    try {
      const data = await odooData.fetchNextEmployeeCode();
      setNextEmployeeId(data?.next_id ?? null);
      setNextDeviceNo(data?.next_device_no ?? null);
    } catch {
      setNextEmployeeId(null);
      setNextDeviceNo(null);
      onFetchError(arabicSource("employees.employee_number_not_specified"));
    }
    setLoadingNextId(false);
  }, [onFetchError]);

  const resetNextId = useCallback(() => {
    setNextEmployeeId(null);
    setNextDeviceNo(null);
  }, []);

  return {
    nextEmployeeId,
    nextDeviceNo,
    loadingNextId,
    fetchNextId,
    resetNextId,
  };
};
