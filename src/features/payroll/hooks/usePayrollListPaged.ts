import { useCallback, useEffect, useRef, useState } from "react";
import { fetchPayrollList } from "@/shared/api/payroll";
import type { PayrollListResponse, PayrollStatus, PayrollTotals } from "@/shared/api/payrollTypes";
import { useDebouncedValue } from "@/shared/hooks";
import { errorMessage } from "../utils/errorMessage";

export const DEFAULT_PAYROLL_PAGE_SIZE = 25;

const EMPTY_RESULT: PayrollListResponse = {
  items: [],
  total: 0,
  limit: DEFAULT_PAYROLL_PAGE_SIZE,
  offset: 0,
  page: 1,
  per_page: DEFAULT_PAYROLL_PAGE_SIZE,
  pagination: {
    total: 0, count: 0, limit: DEFAULT_PAYROLL_PAGE_SIZE, offset: 0, page: 1,
    per_page: DEFAULT_PAYROLL_PAGE_SIZE, total_pages: 0, has_next: false, has_prev: false,
    next_offset: null, prev_offset: null,
  },
  month: "",
  filters: { search: null, department_id: null, employee_id: null, status: null },
};

type UsePayrollListPagedParams = {
  month: string;
  search: string;
  departmentId: string | number | null;
  employeeId: string | number | null;
  status: PayrollStatus | null;
};

/**
 * Server-paginated, month-scoped payroll rows (backend §4/§10/§11).
 *
 * `include_totals` is sent only when the month or a filter changes — a page
 * change re-requests just the 25 rows and keeps the previous totals in state
 * (backend §4.3: totals cost O(matching employees), not O(page size)).
 */
export const usePayrollListPaged = ({ month, search, departmentId, employeeId, status }: UsePayrollListPagedParams) => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PAYROLL_PAGE_SIZE);
  const [result, setResult] = useState<PayrollListResponse>(EMPTY_RESULT);
  const [totals, setTotals] = useState<PayrollTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalsLoading, setTotalsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const debouncedSearch = useDebouncedValue(search);

  const requestRef = useRef(0);
  const lastFilterKeyRef = useRef<string | null>(null);

  const handlePageChange = useCallback((next: number): void => {
    setPage(next);
  }, []);

  const handlePerPageChange = useCallback((next: number): void => {
    setPerPage(next);
    setPage(1);
  }, []);

  const refetch = useCallback((): void => {
    setReloadToken((token) => token + 1);
  }, []);

  // A filter/month change invalidates the current page number.
  useEffect(() => {
    setPage(1);
  }, [month, debouncedSearch, departmentId, employeeId, status]);

  useEffect(() => {
    if (!month) return;

    const filterKey = JSON.stringify({ month, debouncedSearch, departmentId, employeeId, status });
    const includeTotals = filterKey !== lastFilterKeyRef.current;
    lastFilterKeyRef.current = filterKey;

    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setLoading(true);
    if (includeTotals) setTotalsLoading(true);

    fetchPayrollList({
      month,
      page,
      limit: perPage,
      search: debouncedSearch || undefined,
      department_id: departmentId != null && departmentId !== "" ? Number(departmentId) : null,
      employee_id: employeeId != null && employeeId !== "" ? Number(employeeId) : null,
      status,
      include_totals: includeTotals,
    })
      .then((data) => {
        if (requestRef.current !== requestId) return;
        setResult(data);
        setError(null);
        if (data.totals) setTotals(data.totals);
      })
      .catch((e: unknown) => {
        if (requestRef.current !== requestId) return;
        setResult(EMPTY_RESULT);
        setError(errorMessage(e));
      })
      .finally(() => {
        if (requestRef.current !== requestId) return;
        setLoading(false);
        if (includeTotals) setTotalsLoading(false);
      });
  }, [month, page, perPage, debouncedSearch, departmentId, employeeId, status, reloadToken]);

  // A ledger save or excuse toggle can empty the last page; step back rather
  // than stranding the user on a page that will always render zero rows.
  useEffect(() => {
    if (!loading && page > result.pagination.total_pages && result.pagination.total_pages > 0) {
      setPage(result.pagination.total_pages);
    }
  }, [loading, page, result.pagination.total_pages]);

  return {
    items: result.items,
    pagination: result.pagination,
    totals,
    totalsLoading,
    listError: error,
    listLoading: loading,
    page: result.pagination.page || page,
    perPage: result.pagination.per_page || perPage,
    totalPages: result.pagination.total_pages,
    total: result.pagination.total,
    refetchList: refetch,
    onPageChange: handlePageChange,
    onPerPageChange: handlePerPageChange,
  };
};
