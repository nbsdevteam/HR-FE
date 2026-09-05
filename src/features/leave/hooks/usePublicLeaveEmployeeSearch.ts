import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { arabicSource } from "@/i18n/source";
import { useDebouncedValue } from "@/shared/hooks";
import { searchPublicLeaveEmployees } from "../api/publicLeaveApi";
import { publicLeaveErrorMessage } from "../utils/publicLeaveErrorMessage";
import type { PublicLeaveEmployeeSearchResponse, PublicLeaveEmployeeSearchResult } from "../types/publicLeave";

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Search-as-you-type + selection, shared by the "file a request" flow and the
 * "track my request" flow (backend hand-off §3) — each screen owns its own
 * instance so selecting an employee on one never touches the other.
 */
export const usePublicLeaveEmployeeSearch = (token: string, minSearchChars: number) => {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<PublicLeaveEmployeeSearchResult | null>(null);

  // `tooShort` (below) reflects the raw keystroke immediately, so the "type
  // more characters" state never waits out the debounce. The query's `enabled`
  // instead gates on the *debounced* value's own length — gating it on the
  // immediate value would let a query queued for a since-abandoned short
  // value fire the moment typing crosses the threshold, before the debounce
  // has actually caught up to the latest keystrokes.
  const trimmed = query.trim();
  const tooShort = trimmed.length < minSearchChars;
  const debouncedQuery = useDebouncedValue(trimmed, SEARCH_DEBOUNCE_MS);
  const debouncedTooShort = debouncedQuery.length < minSearchChars;

  const searchQuery = useQuery<PublicLeaveEmployeeSearchResponse, Error>({
    queryKey: ["publicLeaveEmployeeSearch", token, debouncedQuery],
    queryFn: () => searchPublicLeaveEmployees(token, debouncedQuery),
    enabled: !debouncedTooShort,
    retry: false,
  });

  const results = tooShort ? [] : searchQuery.data?.items ?? [];
  const truncated = tooShort ? false : searchQuery.data?.truncated ?? false;
  const searchError = searchQuery.error
    ? publicLeaveErrorMessage(searchQuery.error, arabicSource("public_leave.error_generic"))
    : "";

  const updateQuery = useCallback((value: string) => {
    setQuery(value);
    setSelected(null);
  }, []);

  const selectEmployee = useCallback((employee: PublicLeaveEmployeeSearchResult) => {
    setSelected(employee);
  }, []);

  const clearSelection = useCallback(() => {
    setSelected(null);
  }, []);

  const reset = useCallback(() => {
    setQuery("");
    setSelected(null);
  }, []);

  return {
    clearSelection,
    query,
    reset,
    results,
    searchError,
    searching: searchQuery.isFetching,
    selectEmployee,
    selected,
    tooShort,
    truncated,
    updateQuery,
  };
};
