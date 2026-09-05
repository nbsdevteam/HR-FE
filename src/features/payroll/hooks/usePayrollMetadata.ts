import { useCachedList } from "@/shared/hooks/core";
import { fetchPayrollMetadata } from "@/shared/api/payroll";

/**
 * Cached under the shared `QueryClient` — metadata is departments/shifts/
 * allowance types/deduction types/leave types/configs, safe to reuse until a
 * settings/shift/department/allowance-type change (backend §5). Cache-key
 * sharing means switching tabs and coming back doesn't refire it, and
 * `queryClient.clear()` on sign-out (see `shared/auth/index.tsx`) keeps a
 * prior user's metadata from leaking into the next session.
 */
export const usePayrollMetadata = () => {
  const { data, loading, error, refetch } = useCachedList(
    "payrollMetadata",
    async () => [await fetchPayrollMetadata()],
    "Failed to load payroll metadata",
  );
  return { metadata: data[0] ?? null, loading, error, refetch };
};
