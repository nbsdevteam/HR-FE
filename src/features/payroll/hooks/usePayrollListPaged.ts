import { useCallback, useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
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

const toIdOrNull = (value: string | number | null): number | null =>
  value != null && value !== "" ? Number(value) : null;

/**
 * Server-paginated, month-scoped payroll rows (backend §4/§10/§11).
 *
 * Split into two queries so a page turn never re-triggers the expensive
 * totals computation: `listQuery` is keyed on page/perPage and always
 * requests `include_totals: false`, while `totalsQuery` is keyed only on the
 * month/filters (backend §4.3: totals cost O(matching employees), not O(page
 * size)) and is cached independently of which page is on screen.
 */
export const usePayrollListPaged = ({ month, search, departmentId, employeeId, status }: UsePayrollListPagedParams) => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PAYROLL_PAGE_SIZE);

  const debouncedSearch = useDebouncedValue(search);
  const enabled = !!month;
  const departmentIdNum = toIdOrNull(departmentId);
  const employeeIdNum = toIdOrNull(employeeId);

  const listQuery = useQuery<PayrollListResponse, Error>({
    queryKey: ["payrollList", month, debouncedSearch, departmentIdNum, employeeIdNum, status, page, perPage],
    queryFn: () => fetchPayrollList({
      month,
      page,
      limit: perPage,
      search: debouncedSearch || undefined,
      department_id: departmentIdNum,
      employee_id: employeeIdNum,
      status,
      include_totals: false,
    }),
    enabled,
    placeholderData: keepPreviousData,
  });

  const totalsQuery = useQuery<PayrollTotals | null, Error>({
    queryKey: ["payrollTotals", month, debouncedSearch, departmentIdNum, employeeIdNum, status],
    queryFn: async () => {
      const data = await fetchPayrollList({
        month,
        page: 1,
        limit: 1,
        search: debouncedSearch || undefined,
        department_id: departmentIdNum,
        employee_id: employeeIdNum,
        status,
        include_totals: true,
      });
      return data.totals ?? null;
    },
    enabled,
  });

  const result = listQuery.data ?? EMPTY_RESULT;

  const handlePageChange = useCallback((next: number): void => {
    setPage(next);
  }, []);

  const handlePerPageChange = useCallback((next: number): void => {
    setPerPage(next);
    setPage(1);
  }, []);

  const refetch = useCallback((): void => {
    void listQuery.refetch();
    void totalsQuery.refetch();
  }, [listQuery.refetch, totalsQuery.refetch]);

  // A filter/month change invalidates the current page number.
  useEffect(() => {
    setPage(1);
  }, [month, debouncedSearch, departmentIdNum, employeeIdNum, status]);

  // A ledger save or excuse toggle can empty the last page; step back rather
  // than stranding the user on a page that will always render zero rows.
  useEffect(() => {
    if (!listQuery.isFetching && page > result.pagination.total_pages && result.pagination.total_pages > 0) {
      setPage(result.pagination.total_pages);
    }
  }, [listQuery.isFetching, page, result.pagination.total_pages]);

  return {
    items: result.items,
    pagination: result.pagination,
    totals: totalsQuery.data ?? null,
    totalsLoading: totalsQuery.isFetching,
    listError: listQuery.error ? errorMessage(listQuery.error) : null,
    listLoading: listQuery.isFetching,
    page: result.pagination.page || page,
    perPage: result.pagination.per_page || perPage,
    totalPages: result.pagination.total_pages,
    total: result.pagination.total,
    refetchList: refetch,
    onPageChange: handlePageChange,
    onPerPageChange: handlePerPageChange,
  };
};
