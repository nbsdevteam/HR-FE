import { useCallback, useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import * as odooData from "@/shared/api/odooData";
import { DEFAULT_EMPLOYEE_PAGE_SIZE, type EmployeeListPage } from "@/shared/api/core";
import { useDebouncedValue } from "@/shared/hooks";
import { errorMessage } from "../utils/errorMessage";

const EMPTY_PAGE: EmployeeListPage = {
  items: [],
  total: 0,
  page: 1,
  perPage: DEFAULT_EMPLOYEE_PAGE_SIZE,
  totalPages: 1,
};

type UseEmployeesPagedParams = {
  /** Raw search box value — debounced here, so the caller can pass it per keystroke. */
  search: string;
  /** `null` for "all departments". */
  departmentId: string | null;
  /** Shows archived employees alongside active ones (backend §3.4). */
  includeArchived?: boolean;
  /** Skip fetching entirely while the list view is not the one on screen. */
  enabled?: boolean;
};

/**
 * Server-paginated roster for the employee list table (backend §1/§2).
 *
 * Search and the department filter are sent to the backend rather than applied
 * to a locally held array, since with paging the client only ever holds one
 * page and could not filter the rest. The full-roster `useEmployees` fetch is
 * untouched and still backs the stats, the kanban board and every dropdown.
 */
export const useEmployeesPaged = ({ search, departmentId, includeArchived = false, enabled = true }: UseEmployeesPagedParams) => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_EMPLOYEE_PAGE_SIZE);

  const debouncedSearch = useDebouncedValue(search);

  // `keepPreviousData` shows the last page's rows while the next one loads
  // instead of flashing empty, and the query key alone (rather than a manual
  // monotonic request id) guarantees a slow page-2 response can never
  // overwrite the page-3 rows the user has already moved on to.
  const query = useQuery<EmployeeListPage, Error>({
    queryKey: ["employeesPaged", page, perPage, debouncedSearch, departmentId, includeArchived],
    queryFn: () => odooData.fetchEmployeesPage({ page, limit: perPage, search: debouncedSearch, departmentId, includeArchived }),
    enabled,
    placeholderData: keepPreviousData,
  });

  const result = query.data ?? EMPTY_PAGE;

  const handlePageChange = useCallback((next: number): void => {
    setPage(next);
  }, []);

  const handlePerPageChange = useCallback((next: number): void => {
    setPerPage(next);
    // The old page number means a different slice at the new size; the row the
    // user was looking at is only reliably still on screen from the top.
    setPage(1);
  }, []);

  const refetch = useCallback((): void => {
    void query.refetch();
  }, [query.refetch]);

  // Any filter change invalidates the current page number — page 7 of the old
  // result set is usually past the end of the new one.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, departmentId, includeArchived]);

  // A deletion can empty the last page; step back rather than stranding the
  // user on a page that will always render zero rows.
  useEffect(() => {
    if (!query.isFetching && page > result.totalPages) setPage(result.totalPages);
  }, [query.isFetching, page, result.totalPages]);

  return {
    pageEmployees: result.items,
    pageError: query.error ? errorMessage(query.error) : null,
    pageLoading: query.isFetching,
    pageNumber: result.page,
    pageTotal: result.total,
    perPage: result.perPage,
    refetchPage: refetch,
    totalPages: result.totalPages,
    onPageChange: handlePageChange,
    onPerPageChange: handlePerPageChange,
  };
};
